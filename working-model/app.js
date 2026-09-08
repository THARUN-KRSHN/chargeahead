/**
 * ChargeAhead — Real Working Model
 * Live data only: Browser Geolocation, Open Charge Map, Nominatim, OSRM, OSM tiles.
 * No mocks, no hardcoded stations, no invented availability/queue/confidence numbers.
 *
 * Battery range uses only user-entered SoC % and full-range km.
 * Remaining range = fullRangeKm * (soc / 100).
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Config — keys from Vite env (see .env.example). Leave blank for free fallbacks.
  // Client-side keys are OK for a hackathon demo only, not production.
  // ---------------------------------------------------------------------------
  const OCM_API_KEY = import.meta.env.VITE_OCM_API_KEY || "";
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
  const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY || "";

  const OCM_BASE = "https://api.openchargemap.io/v3/poi/";
  const NOMINATIM = "https://nominatim.openstreetmap.org/search";
  const OSRM = "https://router.project-osrm.org/route/v1/driving";
  const GROQ_CHAT = "https://api.groq.com/openai/v1/chat/completions";
  const FALLBACK_CENTER = { lat: 12.9716, lng: 77.5946 }; // Bengaluru (labeled as default)

  // Raw OSM raster style — used when MapTiler key is blank
  const OSM_FALLBACK_STYLE = {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
  };

  // Max detour off the OSRM polyline to treat a station as genuinely "on the way"
  const ON_ROUTE_DETOUR_MAX_KM = 5;

  // Corridor search radius around each sample point (also used for spacing)
  const CORRIDOR_KM = 8;

  // Traffic-light tiers = distance from the *route path* (detourKm)
  const ON_ROUTE_DETOUR_GOOD_KM = 2.5; // ≤2.5 km off the road path = green (truly on-route)
  const ON_ROUTE_DETOUR_MAX_KM_REC = 2.5; // only recommend stations within this detour when greens exist
  const ON_ROUTE_DETOUR_FAR_KM = CORRIDOR_KM; // >8 km = red
  // Keep a slightly wider band still "acceptable" for planning if no tight match
  const ON_ROUTE_DETOUR_OK_KM = ON_ROUTE_DETOUR_MAX_KM; // 5 km
  const NEARBY_COMFORTABLE_FRACTION = 0.5;

  // Soft page size for long lists — all stations kept; "Show more" reveals the rest
  const LIST_PAGE_SIZE = 40;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  let map = null;
  let userMarker = null;
  let stationMarkers = [];
  let routeSourceId = "route-line";
  let userPos = null;
  let isFallbackLocation = false;
  let currentStations = [];
  let routeStations = [];
  let activeFilter = "";
  let reachableOnly = false;
  let selectedId = null;
  let destCoords = null;
  let searchTimeout = null;
  let lastRoute = null; // { polyline, distanceKm, durationMin, steps }
  let navigationWatchId = null;
  let liveStepIndex = 0;
  let journeyActive = false;
  let selectedVehicleLabel = "";
  let evDataset = []; // rows from India_EV_Dataset.csv
  const NAVIGATION_ZOOM = 16;

  // User-provided battery (no invented vehicle model)
  let socPercent = 70;
  let fullRangeKm = 350;
  let safetyPercent = 20; // user-configurable reserve (% of full range)
  let listShowAll = false; // "show more" for long station lists
  let lastDeterministicPlan = null; // for Groq validation / fallback
  let lastGroqResult = null; // { summary, stops:[{id,reason}], spokenText } after validation
  let recommendedStationIds = new Set(); // highlighted on map + list

  // ---------------------------------------------------------------------------
  // DOM refs
  // ---------------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const el = {
    locationStatus: $("location-status"),
    socInput: $("soc-input"),
    fullRangeInput: $("full-range-input"),
    safetyInput: $("safety-input"),
    remainingRange: $("remaining-range"),
    safetySummary: $("safety-summary"),
    destInput: $("dest-input"),
    suggestions: $("suggestions"),
    routeInfo: $("route-info"),
    routeDistance: $("route-distance"),
    routeDuration: $("route-duration"),
    routeEta: $("route-eta"),
    chargePlan: $("charge-plan"),
    aiPlan: $("ai-plan"),
    clearRoute: $("clear-route"),
    applyReplan: $("apply-replan"),
    startJourney: $("start-journey"),
    routeInstructions: $("route-instructions"),
    instructionList: $("instruction-list"),
    liveNavigation: $("live-navigation"),
    liveInstruction: $("live-instruction"),
    liveDistance: $("live-distance"),
    recenterButton: $("recenter-btn"),
    vehicleModel: $("vehicle-model"),
    vehicleInfo: $("vehicle-info"),
    vehicleRange: $("vehicle-range"),
    vehicleCafv: $("vehicle-cafv"),
    listTitle: $("list-title"),
    stationCount: $("station-count"),
    stationList: $("station-list"),
    mapMessage: $("map-message"),
    detailDrawer: $("detail-drawer"),
    detailContent: $("detail-content"),
    closeDrawer: $("close-drawer"),
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function haversineKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  /**
   * Build cumulative distance (km) along a polyline from vertex 0.
   * Returns an array of the same length as polyline.
   */
  function cumulativeRouteKm(polyline) {
    const cum = [0];
    for (let i = 1; i < polyline.length; i++) {
      cum.push(cum[i - 1] + haversineKm(polyline[i - 1], polyline[i]));
    }
    return cum;
  }

  /**
   * For a station point, find the closest polyline vertex and return:
   * { detourKm, routeProgressKm, closestIndex }
   * detourKm = min haversine distance to any vertex (approx perpendicular offset)
   * routeProgressKm = cumulative distance along the route to that closest vertex
   */
  function stationRouteMetrics(stationCoords, polyline, cumKm) {
    let bestIdx = 0;
    let bestD = Infinity;
    for (let i = 0; i < polyline.length; i++) {
      const d = haversineKm(stationCoords, polyline[i]);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }
    return {
      detourKm: bestD,
      routeProgressKm: cumKm[bestIdx] ?? 0,
      closestIndex: bestIdx,
    };
  }

  function remainingRangeKm() {
    const soc = Math.max(0, Math.min(100, Number(socPercent) || 0));
    const full = Math.max(1, Number(fullRangeKm) || 1);
    return full * (soc / 100);
  }

  function safetyMarginKm() {
    const full = Math.max(1, Number(fullRangeKm) || 1);
    const pct = Math.max(0, Math.min(50, Number(safetyPercent) || 0));
    return full * (pct / 100);
  }

  /** Distance you can drive while still keeping the safety reserve */
  function usableRangeKm() {
    return Math.max(0, remainingRangeKm() - safetyMarginKm());
  }

  function formatClock(date) {
    try {
      return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      const h = date.getHours();
      const m = String(date.getMinutes()).padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    }
  }

  const VEHICLE_STORAGE_KEY = "chargeahead_vehicle_profile";

  function saveVehicleProfile() {
    try {
      localStorage.setItem(
        VEHICLE_STORAGE_KEY,
        JSON.stringify({
          socPercent,
          fullRangeKm,
          safetyPercent,
        })
      );
    } catch (_) {}
  }

  function loadVehicleProfile() {
    try {
      const raw = localStorage.getItem(VEHICLE_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return null;
      return data;
    } catch {
      return null;
    }
  }

  function updateRangeUI() {
    const rem = remainingRangeKm();
    const margin = safetyMarginKm();
    el.remainingRange.textContent = `${rem.toFixed(0)} km (${socPercent}%)`;
    if (el.safetySummary) {
      el.safetySummary.textContent = `${margin.toFixed(0)} km (${safetyPercent}%)`;
    }
    const list = routeStations.length ? routeStations : currentStations;
    if (list.length) {
      renderStationList(
        list,
        routeStations.length ? "Stations along this route" : "Nearby stations"
      );
    }
    if (lastRoute) updateChargePlan(lastRoute, routeStations);
  }

  function showMapMessage(text, isError = false) {
    el.mapMessage.textContent = text;
    el.mapMessage.classList.toggle("err", isError);
    el.mapMessage.classList.remove("hidden");
  }

  function hideMapMessage() {
    el.mapMessage.classList.add("hidden");
  }

  function setLocationStatus(text, cls) {
    el.locationStatus.textContent = text;
    el.locationStatus.className = "status-pill " + (cls || "");
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---------------------------------------------------------------------------
  // 1. Map + Geolocation
  // ---------------------------------------------------------------------------
  function initMap(center) {
    const mapStyle = MAPTILER_API_KEY
      ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_API_KEY}`
      : OSM_FALLBACK_STYLE;

    map = new maplibregl.Map({
      container: "map",
      style: mapStyle,
      center: [center.lng, center.lat],
      zoom: 12,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.on("load", () => ensureMapLegend());
    // If style already loaded (fallback), still try
    setTimeout(ensureMapLegend, 500);
  }

  function placeUserMarker(pos, isFallback) {
    if (userMarker) {
      userMarker.setLngLat([pos.lng, pos.lat]);
      return;
    }
    const node = document.createElement("div");
    node.className = "user-location-marker";
    node.style.cssText = `
      width: 18px; height: 18px; border-radius: 50%;
      background: ${isFallback ? "#f59e0b" : "#3b82f6"};
      border: 3px solid #fff;
      box-shadow: 0 0 0 6px ${isFallback ? "rgba(245,158,11,0.25)" : "rgba(59,130,246,0.3)"};
    `;
    node.title = isFallback
      ? "Default location (Bengaluru) — geolocation denied or unavailable"
      : "Your location";
    userMarker = new maplibregl.Marker({ element: node, anchor: "center" })
      .setLngLat([pos.lng, pos.lat])
      .addTo(map);
  }

  function recenterMap() {
    if (!map || !userPos) return;
    map.flyTo({
      center: [userPos.lng, userPos.lat],
      zoom: journeyActive ? NAVIGATION_ZOOM : Math.max(map.getZoom(), 13),
      duration: 800,
    });
  }

  function setupRecenterButton() {
    if (!el.recenterButton) return;
    el.recenterButton.disabled = !userPos;
    el.recenterButton.addEventListener("click", recenterMap);
  }


  function getUserLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          pos: FALLBACK_CENTER,
          fallback: true,
          reason: "Geolocation not supported by this browser",
        });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (p) => {
          resolve({
            pos: { lat: p.coords.latitude, lng: p.coords.longitude },
            fallback: false,
          });
        },
        (err) => {
          resolve({
            pos: FALLBACK_CENTER,
            fallback: true,
            reason: err.message || "Permission denied or unavailable",
          });
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
      );
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Open Charge Map
  // ---------------------------------------------------------------------------
  async function fetchOCMStations(lat, lng, distanceKm = 15, maxResults = 30) {
    const params = new URLSearchParams({
      output: "json",
      countrycode: "IN",
      latitude: String(lat),
      longitude: String(lng),
      distance: String(distanceKm),
      distanceunit: "KM",
      maxresults: String(maxResults),
      compact: "true",
      verbose: "false",
    });
    if (OCM_API_KEY && OCM_API_KEY.trim()) params.set("key", OCM_API_KEY.trim());

    const url = `${OCM_BASE}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Open Charge Map error ${res.status}: ${text.slice(0, 120) || res.statusText}`
      );
    }
    return res.json();
  }

  function normalizeStation(poi, fromPos) {
    const addr = poi.AddressInfo || {};
    const lat = addr.Latitude;
    const lng = addr.Longitude;
    if (lat == null || lng == null) return null;

    const coords = { lat: Number(lat), lng: Number(lng) };
    const distanceKm = fromPos ? haversineKm(fromPos, coords) : null;

    const connections = (poi.Connections || []).map((c) => ({
      type:
        (c.ConnectionType && c.ConnectionType.Title) ||
        c.ConnectionTypeID ||
        "Unknown",
      powerKW: c.PowerKW != null ? c.PowerKW : null,
      quantity: c.Quantity || 1,
      status: (c.StatusType && c.StatusType.Title) || null,
    }));

    return {
      id: poi.ID,
      name: addr.Title || "Unnamed station",
      address: [addr.AddressLine1, addr.Town, addr.StateOrProvince, addr.Postcode]
        .filter(Boolean)
        .join(", "),
      coords,
      distanceKm,
      operator: (poi.OperatorInfo && poi.OperatorInfo.Title) || null,
      status: (poi.StatusType && poi.StatusType.Title) || null,
      statusIsOperational: poi.StatusType ? poi.StatusType.IsOperational : null,
      dateLastVerified: poi.DateLastVerified || null,
      connections,
      raw: poi,
    };
  }

  function isStale(dateStr) {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    const days = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    return days > 90;
  }

  function isReachable(station) {
    // When we know how far along the route the station sits, use that
    // (real path progress). Otherwise fall back to straight-line from user.
    const usable = usableRangeKm();
    if (station.routeProgressKm != null) {
      return station.routeProgressKm <= usable;
    }
    if (station.distanceKm == null) return true;
    return station.distanceKm <= usable;
  }

  // ---------------------------------------------------------------------------
  // Markers & list
  // ---------------------------------------------------------------------------
  const TIER_COLORS = {
    green: "#22c55e",
    yellow: "#f59e0b",
    red: "#ef4444",
  };

  /**
   * Traffic light = how close the station is to the *route path*, not distance from start.
   * Green: on / near the route (small detour)
   * Yellow: slightly off-route
   * Red: far off-route (or unknown detour while routing)
   * Nearby mode (no route): still use distance from you as a soft hint only.
   */
  function classifyStationTier(station) {
    // Along a route: ONLY detour from the road path matters
    if (station.detourKm != null) {
      if (station.detourKm <= ON_ROUTE_DETOUR_GOOD_KM) return "green"; // truly near the road
      if (station.detourKm <= ON_ROUTE_DETOUR_OK_KM) return "yellow"; // slightly off
      return "red"; // far off-route
    }
    // Routing active but detour not computed yet
    if (station.routeProgressKm != null) return "yellow";

    // Nearby mode (no destination route): soft distance-from-you tiers
    const usable = usableRangeKm();
    if (station.distanceKm == null) return "yellow";
    if (station.distanceKm <= usable * NEARBY_COMFORTABLE_FRACTION) return "green";
    if (station.distanceKm <= usable) return "yellow";
    return "red";
  }


  /**
   * Comfort / break suggestions from real trip duration only (no fake POIs).
   * Suggests rest stops at charge stops when duration warrants it.
   */
  function buildComfortBreakHints(tripKm, durationMin, plannedStops) {
    const hours = (durationMin || 0) / 60;
    const lines = [];
    if (hours < 1.5 && tripKm < 80) {
      lines.push("Short hop — stretch at the destination if you like; no mid-trip break needed.");
      return lines;
    }
    if (hours < 3) {
      lines.push("Comfort tip: a quick tea / washroom stop pairs well with any charge stop on this route.");
    } else if (hours < 5) {
      lines.push("Comfort tip: plan a proper meal + toilet break around a mid-route charge stop (roughly every 2–3 hours of driving).");
    } else {
      lines.push("Long drive: schedule meal and toilet breaks with each charge stop — aim to leave the seat every 2–3 hours.");
    }
    if (plannedStops && plannedStops.length) {
      plannedStops.forEach((item, i) => {
        const name = item.station && item.station.name ? item.station.name : "charge stop";
        const progress = item.station && item.station.routeProgressKm != null
          ? `~${item.station.routeProgressKm.toFixed(0)} km into the trip`
          : "along the route";
        if (i === 0 && hours >= 1.5) {
          lines.push(`Suggested comfort pause at ${name} (${progress}): tea / coffee + quick stretch.`);
        } else if (hours >= 3) {
          lines.push(`At ${name} (${progress}): good moment for a meal or toilet break while charging.`);
        }
      });
    } else if (hours >= 2) {
      lines.push("Even without a required charge stop, consider a short tea break mid-way if you feel fatigued.");
    }
    return lines;
  }

  function clearStationMarkers() {
    stationMarkers.forEach((m) => m.remove());
    stationMarkers = [];
  }

  function addStationMarker(station) {
    const tier = classifyStationTier(station);
    const color = TIER_COLORS[tier] || TIER_COLORS.yellow;
    const offline = station.statusIsOperational === false;
    const isRec = recommendedStationIds.has(station.id);
    // Recommended gets a larger hit area so the yellow halo fits
    const size = isRec ? 44 : 28;

    // Root element: MapLibre owns position/transform — do NOT set position/transform here
    const root = document.createElement("div");
    root.className = "station-marker-root" + (isRec ? " is-recommended" : "");
    root.style.width = size + "px";
    root.style.height = size + "px";
    root.style.cursor = "pointer";

    // Outer yellow ring for suggested/AI-recommended stops (very visible on the map)
    if (isRec) {
      const halo = document.createElement("div");
      halo.className = "station-rec-halo";
      root.appendChild(halo);
    }

    const inner = document.createElement("div");
    inner.className = "station-marker-inner";
    inner.style.cssText = [
      "width:" + (isRec ? "30px" : "100%"),
      "height:" + (isRec ? "30px" : "100%"),
      "margin:" + (isRec ? "7px auto 0" : "0"),
      "border-radius:50%",
      "background:" + color,
      "border:" + (isRec ? "3px solid #fde047" : "2px solid #fff"),
      "box-shadow:" + (isRec ? "0 0 12px #eab308cc" : "0 0 6px " + color + "80"),
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "opacity:" + (offline ? "0.55" : "1"),
      "position:relative",
      "z-index:2",
      "pointer-events:auto",
    ].join(";");

    if (isRec) {
      const badge = document.createElement("span");
      badge.className = "station-rec-label";
      badge.textContent = "★";
      badge.title = "Suggested stop";
      inner.appendChild(badge);
    }

    if (offline) {
      const warn = document.createElement("span");
      warn.textContent = "⚠";
      warn.style.cssText =
        "position:absolute;top:-7px;right:-7px;font-size:11px;line-height:1;pointer-events:none";
      inner.appendChild(warn);
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    svg.setAttribute("viewBox", "0 0 24 24");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M13 2L3 14h9l-1 8 10-12h-9l1-8z");
    path.setAttribute("fill", "#0f1419");
    svg.appendChild(path);
    inner.appendChild(svg);
    root.appendChild(inner);

    const tierLabel =
      tier === "green"
        ? "On route — within ~2.5 km of the road path"
        : tier === "yellow"
          ? "Slightly off route — up to ~5 km detour"
          : "Far off route — more than ~5 km off the path";
    root.title =
      station.name +
      " — " +
      tierLabel +
      (offline ? " — reported non-operational" : "") +
      (isRec ? " — ★ Suggested charge stop" : "");

    const marker = new maplibregl.Marker({
      element: root,
      anchor: "center",
    })
      .setLngLat([station.coords.lng, station.coords.lat])
      .addTo(map);

    root.addEventListener("click", (e) => {
      e.stopPropagation();
      selectStation(station);
    });
    stationMarkers.push(marker);
  }

  /** Sort: green (lowest detour) first, then yellow, then red */
  function preferOnRouteStations(stations) {
    if (!stations || !stations.length) return [];
    return stations.slice().sort((a, b) => {
      const ta = classifyStationTier(a);
      const tb = classifyStationTier(b);
      const rank = { green: 0, yellow: 1, red: 2 };
      const ra = rank[ta] ?? 3;
      const rb = rank[tb] ?? 3;
      if (ra !== rb) return ra - rb;
      const da = a.detourKm != null ? a.detourKm : 99;
      const db = b.detourKm != null ? b.detourKm : 99;
      if (da !== db) return da - db;
      // further along the trip is better among equal detour
      return (b.routeProgressKm ?? 0) - (a.routeProgressKm ?? 0);
    });
  }

  /**
   * Never highlight an off-route station when a true on-route (green) option exists.
   * `picks` = stations the planner/AI suggested; `pool` = full corridor list.
   */
  function resolveRecommendedStations(picks, pool) {
    const list = (picks || []).filter(Boolean);
    const all = pool && pool.length ? pool : list;

    const isTight = (s) =>
      s.detourKm != null && s.detourKm <= ON_ROUTE_DETOUR_GOOD_KM;

    const greenPicks = list.filter(isTight);
    if (greenPicks.length) return preferOnRouteStations(greenPicks);

    // Planner picked only off-route — but green stations exist in the corridor?
    const greenPool = all.filter(isTight);
    if (greenPool.length) {
      // Use the best green option(s) instead of the off-route pick
      return preferOnRouteStations(greenPool).slice(0, Math.max(1, list.length || 1));
    }

    // No green anywhere — keep honest off-route picks (sorted)
    return preferOnRouteStations(list.length ? list : all).slice(0, 1);
  }

  function applyRecommendedHighlights(ids) {
    recommendedStationIds = new Set(
      (ids || []).filter((id) => id != null)
    );
    if (routeStations.length) {
      clearStationMarkers();
      routeStations.forEach(addStationMarker);
      renderStationList(routeStations, "Stations along this route");
    } else if (currentStations.length) {
      clearStationMarkers();
      currentStations.forEach(addStationMarker);
      renderStationList(currentStations, "Nearby stations");
    }
  }

  function ensureMapLegend() {
    if (!map || document.getElementById("map-tier-legend")) return;
    const box = document.createElement("div");
    box.id = "map-tier-legend";
    box.className = "map-tier-legend";
    box.innerHTML = `
      <div><span class="leg-dot" style="background:#22c55e"></span> On route — within ~2.5 km of the road path</div>
      <div><span class="leg-dot" style="background:#f59e0b"></span> Slightly off route — up to ~5 km detour</div>
      <div><span class="leg-dot" style="background:#ef4444"></span> Far off route — more than ~5 km off the path</div>
      <div><span class="leg-warn">⚠</span> Reported non-operational</div>
    `;
    const wrap = document.querySelector(".map-wrap");
    if (wrap) wrap.appendChild(box);
  }

  function getActiveList() {
    return routeStations.length ? routeStations : currentStations;
  }

  function getActiveTitle() {
    return routeStations.length ? "Stations along this route" : "Nearby stations";
  }

  function renderStationList(stations, title) {
    el.listTitle.textContent = title || "Nearby stations";

    let filtered = stations.slice();

    // Suggested stops first, then by route progress (or distance when nearby).
    const onRoute = filtered.some((s) => s.routeProgressKm != null);
    filtered.sort((a, b) => {
      const ar = recommendedStationIds.has(a.id) ? 0 : 1;
      const br = recommendedStationIds.has(b.id) ? 0 : 1;
      if (ar !== br) return ar - br;
      if (onRoute) {
        return (a.routeProgressKm ?? 9999) - (b.routeProgressKm ?? 9999);
      }
      return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
    });

    el.stationCount.textContent = String(filtered.length);

    if (!stations.length) {
      el.stationList.innerHTML = `<div class="empty-state">No verified stations found in this area.<br>Open Charge Map may have sparse coverage outside major cities.</div>`;
      return;
    }
    if (!filtered.length) {
      el.stationList.innerHTML = `<div class="empty-state">No stations to show for this route.</div>`;
      return;
    }

    // Explicit page — never silent truncation
    const total = filtered.length;
    const visible =
      listShowAll || total <= LIST_PAGE_SIZE
        ? filtered
        : filtered.slice(0, LIST_PAGE_SIZE);

    const cardsHtml = visible
      .map((s) => {
        const reach = isReachable(s);
        const reachLabel = reach
          ? `<span class="reach">in range</span>`
          : `<span class="reach no">beyond range</span>`;

        // Always show all three distance fields (— when unavailable)
        const fromYou =
          s.distanceKm != null ? `${s.distanceKm.toFixed(1)} km from you` : "— from you";
        const intoTrip =
          s.routeProgressKm != null
            ? `~${s.routeProgressKm.toFixed(1)} km into trip`
            : "— into trip";
        const detour =
          s.detourKm != null
            ? `~${s.detourKm.toFixed(1)} km off route`
            : "— off route";
        const onWay =
          s.detourKm != null && s.detourKm <= ON_ROUTE_DETOUR_MAX_KM;

        const stale = isStale(s.dateLastVerified)
          ? `<span class="freshness">not recently verified</span>`
          : "";
        const status = s.status || "Status unknown";
        const types = [
          ...new Set(s.connections.map((c) => c.type).filter(Boolean)),
        ]
          .slice(0, 3)
          .join(", ");
        const tier = classifyStationTier(s);
        const tierColor = TIER_COLORS[tier] || TIER_COLORS.yellow;
        const isSuggested = recommendedStationIds.has(s.id);
        const recBadge = isSuggested
          ? `<span class="rec-badge">★ Suggested stop</span>`
          : "";
        return `
          <div class="station-card ${selectedId === s.id ? "active" : ""} ${isSuggested ? "suggested" : ""} ${reach ? "" : "out-of-range"}" data-id="${s.id}">
            <div class="name"><span class="tier-dot" style="background:${tierColor}" title="${tier}"></span>${escapeHtml(s.name)}${recBadge}</div>
            <div class="meta">
              <span class="dist" title="Straight-line distance from your position">${fromYou}</span>
              <span class="dist" title="Distance into your trip along the route">${intoTrip}</span>
              <span class="${onWay ? "detour-ok" : "detour-far"}" title="How far off the road path this station is">${detour}</span>
              ${reachLabel}
              <span>${escapeHtml(status)}</span>
              ${types ? `<span>${escapeHtml(types)}</span>` : ""}
              ${stale}
            </div>
          </div>`;
      })
      .join("");

    let moreHtml = "";
    if (!listShowAll && total > LIST_PAGE_SIZE) {
      moreHtml = `<button type="button" class="btn-secondary show-more-btn" id="show-more-stations">Show all ${total} stations</button>`;
    } else if (listShowAll && total > LIST_PAGE_SIZE) {
      moreHtml = `<button type="button" class="btn-secondary show-more-btn" id="show-less-stations">Show fewer</button>`;
    }

    el.stationList.innerHTML = cardsHtml + moreHtml;

    el.stationList.querySelectorAll(".station-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = Number(card.dataset.id);
        const st = filtered.find((s) => s.id === id);
        if (st) selectStation(st);
      });
    });
    const moreBtn = document.getElementById("show-more-stations");
    if (moreBtn) {
      moreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        listShowAll = true;
        renderStationList(stations, title);
      });
    }
    const lessBtn = document.getElementById("show-less-stations");
    if (lessBtn) {
      lessBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        listShowAll = false;
        renderStationList(stations, title);
      });
    }
  }

  function updateConnectorFilter(stations) {
    if (!el.connectorFilter) return;
    const types = new Set();
    stations.forEach((s) =>
      s.connections.forEach((c) => {
        if (c.type) types.add(c.type);
      })
    );
    const sorted = Array.from(types).sort();
    const current = el.connectorFilter.value;
    el.connectorFilter.innerHTML =
      `<option value="">All connectors (from live results)</option>` +
      sorted
        .map(
          (t) =>
            `<option value="${escapeHtml(t)}" ${t === current ? "selected" : ""}>${escapeHtml(t)}</option>`
        )
        .join("");
  }

  function selectStation(station) {
    selectedId = station.id;
    renderStationList(getActiveList(), getActiveTitle());
    map.flyTo({
      center: [station.coords.lng, station.coords.lat],
      zoom: 14,
      duration: 800,
    });
    showDetail(station);
  }

  function showDetail(s) {
    const verified = s.dateLastVerified
      ? new Date(s.dateLastVerified).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "Not available";
    const staleNote = isStale(s.dateLastVerified)
      ? ` <span class="freshness">not recently verified</span>`
      : "";
    const reach = isReachable(s);

    let connHtml = "";
    if (s.connections.length) {
      connHtml =
        `<ul class="conn-list">` +
        s.connections
          .map((c) => {
            const power =
              c.powerKW != null ? `${c.powerKW} kW` : "Power unknown";
            return `<li><span>${escapeHtml(c.type)} × ${c.quantity}</span><span>${power}</span></li>`;
          })
          .join("") +
        `</ul>`;
    } else {
      connHtml = `<p class="no-data">No connector details in Open Charge Map response for this station.</p>`;
    }

    el.detailContent.innerHTML = `
      <div class="detail-title">${escapeHtml(s.name)}</div>
      <div class="detail-addr">${escapeHtml(s.address || "Address not provided")}</div>
      <div class="detail-grid">
        <div class="detail-item">
          <label>Operator</label>
          <span>${escapeHtml(s.operator || "Unknown")}</span>
        </div>
        <div class="detail-item">
          <label>Status</label>
          <span>${escapeHtml(s.status || "Unknown")}</span>
        </div>
        <div class="detail-item">
          <label>From you (straight line)</label>
          <span>${s.distanceKm != null ? s.distanceKm.toFixed(2) + " km" : "—"}</span>
        </div>
        <div class="detail-item">
          <label>Into trip (along route)</label>
          <span>${s.routeProgressKm != null ? "~" + s.routeProgressKm.toFixed(1) + " km" : "—"}</span>
        </div>
        <div class="detail-item">
          <label>Off route (detour)</label>
          <span>${s.detourKm != null ? "~" + s.detourKm.toFixed(1) + " km" : "—"}</span>
        </div>
        <div class="detail-item">
          <label>Reachable now?</label>
          <span style="color:${reach ? "var(--accent)" : "var(--danger)"}">${
            reach
              ? "Yes (within usable range)"
              : "No — beyond remaining charge"
          }</span>
        </div>
        <div class="detail-item">
          <label>Last verified</label>
          <span>${verified}${staleNote}</span>
        </div>
        <div class="detail-item">
          <label>Your remaining range</label>
          <span>${remainingRangeKm().toFixed(0)} km (usable ~${usableRangeKm().toFixed(0)} km)</span>
        </div>
      </div>
      <div class="detail-item">
        <label>Connectors / charge type (from OCM)</label>
        ${connHtml}
      </div>
      <p class="no-data" style="margin-top:0.75rem">
        Live port occupancy and queue times are not provided by Open Charge Map and are intentionally not invented here.
      </p>
    `;
    el.detailDrawer.classList.remove("hidden");
  }

  // ---------------------------------------------------------------------------
  // Load stations for a point
  // ---------------------------------------------------------------------------
  async function loadStationsAround(pos, opts = {}) {
    const {
      distanceKm = 15,
      title = "Nearby stations",
      setAsCurrent = true,
    } = opts;
    el.stationList.innerHTML = `<div class="empty-state">Fetching live stations from Open Charge Map…</div>`;
    el.stationCount.textContent = "…";

    try {
      const raw = await fetchOCMStations(pos.lat, pos.lng, distanceKm);
      const stations = (raw || [])
        .map((p) => normalizeStation(p, userPos || pos))
        .filter(Boolean)
        .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

      clearStationMarkers();
      stations.forEach(addStationMarker);

      if (setAsCurrent) {
        currentStations = stations;
        routeStations = [];
        listShowAll = false;
      } else {
        routeStations = stations;
      }

      updateConnectorFilter(stations);
      renderStationList(stations, title);

      if (!stations.length) {
        showMapMessage(
          "No verified stations found in this area (Open Charge Map).",
          false
        );
      } else {
        hideMapMessage();
      }
    } catch (err) {
      console.error(err);
      el.stationList.innerHTML = `<div class="error-state">Failed to load stations.<br>${escapeHtml(err.message)}<br><br>Check network or Open Charge Map rate limits. No fallback data is used.</div>`;
      el.stationCount.textContent = "0";
      showMapMessage("Station fetch failed — see list for details.", true);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Geocoding + Routing + along-route stations + charge plan
  // ---------------------------------------------------------------------------
  async function geocode(query) {
    // Prefer MapTiler geocoding when a key is present; fall back to Nominatim
    if (MAPTILER_API_KEY && MAPTILER_API_KEY.trim()) {
      const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_API_KEY.trim()}&country=in&limit=5`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`MapTiler geocoding ${res.status}`);
      const data = await res.json();
      // Normalize to Nominatim-like shape: display_name, lat, lon
      // MapTiler / GeoJSON center is [lng, lat]
      return (data.features || []).map((f) => {
        const center = f.center || (f.geometry && f.geometry.coordinates) || [0, 0];
        return {
          display_name: f.place_name || f.text || f.place_name_en || "Unknown place",
          lat: center[1],
          lon: center[0],
        };
      });
    }

    const url = `${NOMINATIM}?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ChargeAhead-WorkingModel/1.0" },
    });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    return res.json();
  }

  async function fetchRoute(origin, dest) {
    const coords = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`;
    const url = `${OSRM}/${coords}?geometries=geojson&overview=full&steps=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    const route = data.routes && data.routes[0];
    if (!route) throw new Error("No route found");
    const steps = (route.legs || [])
      .flatMap((leg) => leg.steps || [])
      .filter((step) => step.maneuver && step.maneuver.type !== "notification");
    return {
      polyline: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
      steps,
    };
  }

  function formatStepDistance(meters) {
    if (meters == null) return "";
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  }

  function formatStepInstruction(step) {
    const maneuver = step.maneuver || {};
    const name = (step.name || "").trim();
    const modifier = maneuver.modifier ? ` ${maneuver.modifier}` : "";
    const type = maneuver.type || "";
    if (type === "depart") return name ? `Depart onto ${name}` : "Depart";
    if (type === "arrive") return name ? `Arrive at ${name}` : "Arrive at destination";
    if (type === "roundabout" || type === "rotary") {
      const exit = maneuver.exit ? `, take exit ${maneuver.exit}` : "";
      return `Enter roundabout${exit}` + (name ? ` onto ${name}` : "");
    }
    if (type === "turn" || type === "end of road" || type === "continue" || type === "new name" || type === "fork" || type === "ramp" || type === "merge") {
      const verb = type === "turn" ? `Turn${modifier}` : type === "continue" ? "Continue" : type.charAt(0).toUpperCase() + type.slice(1) + modifier;
      return name ? `${verb} onto ${name}` : verb;
    }
    return name || type || "Continue";
  }

  function renderRouteInstructions(steps) {
    if (!el.instructionList || !el.routeInstructions) return;
    const list = steps || [];
    if (!list.length) {
      el.routeInstructions.classList.add("hidden");
      el.instructionList.innerHTML = "";
      return;
    }
    el.instructionList.innerHTML = list
      .map(
        (step, i) => `
        <li class="instruction-item">
          <span class="instruction-number">${i + 1}</span>
          <span class="instruction-copy">${escapeHtml(formatStepInstruction(step))}</span>
          <span class="instruction-distance">${formatStepDistance(step.distance)}</span>
        </li>`
      )
      .join("");
    el.routeInstructions.classList.remove("hidden");
  }

  function updateLiveBanner(step) {
    if (!el.liveInstruction) return;
    if (!step) {
      el.liveInstruction.textContent = "Journey complete";
      if (el.liveDistance) el.liveDistance.textContent = "";
      return;
    }
    el.liveInstruction.textContent = formatStepInstruction(step);
    if (el.liveDistance) el.liveDistance.textContent = formatStepDistance(step.distance);
  }

  function stopJourneyTracking() {
    if (navigationWatchId != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(navigationWatchId);
      navigationWatchId = null;
    }
    journeyActive = false;
    liveStepIndex = 0;
    if (el.liveNavigation) el.liveNavigation.classList.add("hidden");
    if (el.startJourney) {
      el.startJourney.textContent = "Start journey";
      el.startJourney.disabled = !(lastRoute && lastRoute.steps && lastRoute.steps.length);
    }
  }

  function advanceLiveStep(pos) {
    if (!lastRoute || !pos || !lastRoute.steps || !lastRoute.steps.length) return;
    // Advance while close to end of current step's last coordinate
    while (liveStepIndex < lastRoute.steps.length - 1) {
      const step = lastRoute.steps[liveStepIndex];
      const geom = step.geometry && step.geometry.coordinates;
      if (!geom || !geom.length) {
        liveStepIndex++;
        continue;
      }
      const [lng, lat] = geom[geom.length - 1];
      const d = haversineKm(pos, { lat, lng });
      // Within ~45 m of step end → advance
      if (d < 0.045) {
        liveStepIndex++;
        continue;
      }
      break;
    }
    updateLiveBanner(lastRoute.steps[liveStepIndex]);
  }

  function startJourney() {
    if (!lastRoute || !lastRoute.steps || !lastRoute.steps.length) {
      showMapMessage("No turn-by-turn steps for this route.", true);
      return;
    }
    journeyActive = true;
    liveStepIndex = Math.max(
      0,
      lastRoute.steps.findIndex((step) => !["depart"].includes((step.maneuver || {}).type))
    );
    if (liveStepIndex < 0) liveStepIndex = 0;

    renderRouteInstructions(lastRoute.steps);
    if (el.liveNavigation) el.liveNavigation.classList.remove("hidden");
    updateLiveBanner(lastRoute.steps[liveStepIndex]);

    if (el.startJourney) {
      el.startJourney.textContent = "Journey active";
      el.startJourney.disabled = true;
    }

    if (userPos) {
      placeUserMarker(userPos, isFallbackLocation);
      recenterMap();
    }

    if (navigator.geolocation && navigationWatchId == null) {
      navigationWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          userPos = p;
          isFallbackLocation = false;
          placeUserMarker(p, false);
          advanceLiveStep(p);
          if (journeyActive && map) {
            map.easeTo({
              center: [p.lng, p.lat],
              duration: 500,
            });
          }
        },
        (err) => console.warn("Live location update failed:", err.message),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
      );
    }
  }

  function drawRoute(polyline) {
    if (!map.getSource(routeSourceId)) {
      map.addSource(routeSourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "LineString", coordinates: [] },
          properties: {},
        },
      });
      map.addLayer({
        id: "route-layer",
        type: "line",
        source: routeSourceId,
        paint: {
          "line-color": "#60a5fa",
          "line-width": 4,
          "line-opacity": 0.9,
        },
      });
    }
    map.getSource(routeSourceId).setData({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: polyline.map((p) => [p.lng, p.lat]),
      },
      properties: {},
    });
  }

  /**
   * Apply current battery settings and re-run charge plan + highlights for the active route.
   * Does not clear the destination — recomputes stops with the latest SoC / range / reserve.
   */
  async function applyAndReplan() {
    // Pull latest values from inputs
    socPercent = Number(el.socInput.value) || 0;
    fullRangeKm = Number(el.fullRangeInput.value) || 1;
    if (el.safetyInput) safetyPercent = Number(el.safetyInput.value) || 0;
    saveVehicleProfile();
    updateRangeUI();

    if (!lastRoute || !destCoords || !userPos) {
      showMapMessage("Set a destination first, then Apply & replan.", true);
      return;
    }

    showMapMessage("Replanning with updated charge settings…");
    try {
      // Refresh plan + recommended highlights from existing along-route stations
      if (routeStations.length) {
        updateChargePlan(lastRoute, routeStations);
        hideMapMessage();
      } else {
        // Re-fetch stations along route if list was empty
        const along = await loadStationsAlongRoute(lastRoute.polyline, CORRIDOR_KM);
        updateChargePlan(lastRoute, along);
      }
    } catch (err) {
      console.error(err);
      showMapMessage("Replan failed: " + (err.message || err), true);
    }
  }

  function clearRoute() {
    stopJourneyTracking();
    if (el.routeInstructions) el.routeInstructions.classList.add("hidden");
    if (el.instructionList) el.instructionList.innerHTML = "";
    destCoords = null;
    routeStations = [];
    lastRoute = null;
    if (map.getSource(routeSourceId)) {
      map.getSource(routeSourceId).setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [] },
        properties: {},
      });
    }
    el.routeInfo.classList.add("hidden");
    el.chargePlan.classList.add("hidden");
    if (el.aiPlan) el.aiPlan.classList.add("hidden");
    lastDeterministicPlan = null;
    lastGroqResult = null;
    recommendedStationIds = new Set();
    listShowAll = false;
    el.destInput.value = "";
    if (userPos) {
      loadStationsAround(userPos, {
        title: "Nearby stations",
        setAsCurrent: true,
      });
    }
  }

  /**
   * Distance-aware sampling along the route polyline.
   * Aim for a sample about every (corridorKm * 1.5) km of real route length,
   * clamped between 4 and 15 samples so short trips aren't under-sampled and
   * long trips don't hammer the OCM rate limit.
   */
  function samplePolylineByDistance(polyline, routeDistanceKm, corridorKm) {
    if (!polyline || polyline.length === 0) return [];
    const spacingKm = Math.max(3, corridorKm * 1.5);
    let n = Math.ceil(routeDistanceKm / spacingKm) + 1;
    n = Math.max(4, Math.min(15, n));
    if (polyline.length <= n) return polyline.slice();

    const cum = cumulativeRouteKm(polyline);
    const total = cum[cum.length - 1] || routeDistanceKm || 1;
    const samples = [];
    for (let i = 0; i < n; i++) {
      const target = (total * i) / (n - 1);
      // Find vertex closest to this cumulative distance
      let best = 0;
      for (let j = 0; j < cum.length; j++) {
        if (Math.abs(cum[j] - target) < Math.abs(cum[best] - target)) best = j;
      }
      samples.push(polyline[best]);
    }
    return samples;
  }

  async function loadStationsAlongRoute(polyline, corridorKm = CORRIDOR_KM) {
    el.stationList.innerHTML = `<div class="empty-state">Finding chargers along the route (live Open Charge Map)…</div>`;
    el.stationCount.textContent = "…";
    el.listTitle.textContent = "Stations along this route";

    const routeKm = lastRoute ? lastRoute.distanceKm : 0;
    const samples = samplePolylineByDistance(polyline, routeKm, corridorKm);
    // Ensure origin / destination are included
    if (userPos) samples.unshift(userPos);
    if (destCoords) samples.push(destCoords);

    const seen = new Map();
    const errors = [];

    for (const pt of samples) {
      try {
        const raw = await fetchOCMStations(pt.lat, pt.lng, corridorKm, 20);
        (raw || []).forEach((poi) => {
          const st = normalizeStation(poi, userPos);
          if (st && !seen.has(st.id)) seen.set(st.id, st);
        });
      } catch (err) {
        errors.push(err.message);
        console.warn("OCM sample fetch failed:", err);
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    // Attach detourKm + routeProgressKm using the real polyline geometry
    const cumKm = cumulativeRouteKm(polyline);
    const alongRoute = [];
    for (const st of seen.values()) {
      const m = stationRouteMetrics(st.coords, polyline, cumKm);
      if (m.detourKm > corridorKm) continue; // outside corridor
      st.detourKm = m.detourKm;
      st.routeProgressKm = m.routeProgressKm;
      alongRoute.push(st);
    }

    // Order by how far into the trip you'd reach them
    alongRoute.sort(
      (a, b) => (a.routeProgressKm ?? 9999) - (b.routeProgressKm ?? 9999)
    );

    clearStationMarkers();
    alongRoute.forEach(addStationMarker);

    routeStations = alongRoute;
    listShowAll = false;
    updateConnectorFilter(alongRoute);
    renderStationList(alongRoute, "Stations along this route");

    if (!alongRoute.length) {
      const msg = errors.length
        ? `No stations found along the route. (${errors[0]})`
        : "No verified stations found along this route corridor.";
      showMapMessage(msg, false);
    } else {
      hideMapMessage();
    }

    return alongRoute;
  }

  /**
   * Pick the best on-route stop: highest routeProgressKm still within usable range,
   * among stations with detourKm ≤ ON_ROUTE_DETOUR_MAX_KM.
   * Falls back to wider corridor with an honest "off-route" label if none qualify.
   */
  function pickBestStop(candidates, usable, preferOnRoute = true) {
    // 1) True on-route (tight detour) within usable range
    const tight = candidates.filter(
      (s) =>
        s.detourKm != null &&
        s.detourKm <= ON_ROUTE_DETOUR_GOOD_KM &&
        s.routeProgressKm != null &&
        s.routeProgressKm <= usable
    );
    // Prefer furthest along the trip among tight matches (still low detour)
    tight.sort((a, b) => {
      const dp = (b.routeProgressKm ?? 0) - (a.routeProgressKm ?? 0);
      if (Math.abs(dp) > 1) return dp;
      return (a.detourKm ?? 99) - (b.detourKm ?? 99);
    });
    if (tight.length) {
      return { station: tight[0], offRoute: false };
    }

    // 2) Acceptable on-route band (≤ 5 km) if nothing tighter
    const onRoute = candidates.filter(
      (s) =>
        s.detourKm != null &&
        s.detourKm <= ON_ROUTE_DETOUR_OK_KM &&
        s.routeProgressKm != null &&
        s.routeProgressKm <= usable
    );
    onRoute.sort((a, b) => {
      const dd = (a.detourKm ?? 99) - (b.detourKm ?? 99);
      if (Math.abs(dd) > 0.3) return dd; // lower detour wins
      return (b.routeProgressKm ?? 0) - (a.routeProgressKm ?? 0);
    });
    if (onRoute.length) {
      return { station: onRoute[0], offRoute: false };
    }
    if (!preferOnRoute) return { station: null, offRoute: false };

    // 3) Fallback: any reachable in corridor (honest off-route label)
    const any = candidates
      .filter(
        (s) => s.routeProgressKm != null && s.routeProgressKm <= usable
      )
      .sort((a, b) => (a.detourKm ?? 99) - (b.detourKm ?? 99));
    if (any.length) {
      return { station: any[0], offRoute: true };
    }
    return { station: null, offRoute: false };
  }

  /**
   * Chain stops along the route until the remaining distance is within usable range.
   * Assumes a full recharge at each stop (usable range available again).
   */
  function chainStops(candidates, tripKm, usable) {
    const stops = [];
    let covered = 0;
    const usedIds = new Set();
    let guard = 0;
    while (tripKm - covered > usable && guard < 8) {
      guard++;
      const remainingUsableFromHere = usable; // after recharge at previous stop
      // Candidates further along than what we've already covered
      const ahead = candidates.filter(
        (s) =>
          !usedIds.has(s.id) &&
          s.routeProgressKm != null &&
          s.routeProgressKm > covered + 0.5 &&
          s.routeProgressKm <= covered + remainingUsableFromHere
      );
      const pick = pickBestStop(ahead, covered + remainingUsableFromHere, true);
      // pickBestStop filters by routeProgressKm <= usable from origin; re-filter for chain
      let station = null;
      let offRoute = false;
      const tightAhead = ahead
        .filter(
          (s) => s.detourKm != null && s.detourKm <= ON_ROUTE_DETOUR_GOOD_KM
        )
        .sort((a, b) => {
          const dp = (b.routeProgressKm ?? 0) - (a.routeProgressKm ?? 0);
          if (Math.abs(dp) > 1) return dp;
          return (a.detourKm ?? 99) - (b.detourKm ?? 99);
        });
      const okAhead = ahead
        .filter(
          (s) =>
            s.detourKm != null &&
            s.detourKm <= ON_ROUTE_DETOUR_OK_KM &&
            s.detourKm > ON_ROUTE_DETOUR_GOOD_KM
        )
        .sort((a, b) => (a.detourKm ?? 99) - (b.detourKm ?? 99));
      if (tightAhead.length) {
        station = tightAhead[0];
        offRoute = false;
      } else if (okAhead.length) {
        station = okAhead[0];
        offRoute = false;
      } else if (ahead.length) {
        ahead.sort((a, b) => (a.detourKm ?? 99) - (b.detourKm ?? 99));
        station = ahead[0];
        offRoute = true;
      }
      if (!station) break;
      usedIds.add(station.id);
      stops.push({ station, offRoute });
      covered = station.routeProgressKm;
    }
    return stops;
  }

  function formatStopLabel(stop, offRoute) {
    const s = stop;
    const progress =
      s.routeProgressKm != null
        ? `~${s.routeProgressKm.toFixed(1)} km into trip`
        : "progress unknown";
    const detour =
      s.detourKm != null ? `~${s.detourKm.toFixed(1)} km off route` : "";
    const flag = offRoute
      ? ` <em>(off-route — nearest option requires a larger detour)</em>`
      : "";
    return `<strong>${escapeHtml(s.name)}</strong> (${progress}${detour ? ", " + detour : ""})${flag}`;
  }

  /**
   * Deterministic charge plan.
   * Stop is recommended ONLY when tripKm + safetyMargin > remaining range.
   * When no stop is needed, do not attach a recommended station to the verdict.
   */
  function updateChargePlan(route, stations) {
    const box = el.chargePlan;
    if (!route) {
      box.classList.add("hidden");
      if (el.aiPlan) el.aiPlan.classList.add("hidden");
      return;
    }

    const rem = remainingRangeKm();
    const margin = safetyMarginKm();
    const usable = usableRangeKm();
    const tripKm = route.distanceKm;
    const spareKm = rem - tripKm;
    const sparePct = fullRangeKm > 0 ? (spareKm / fullRangeKm) * 100 : 0;

    let candidates = stations.slice();

    let cls = "ok";
    let html = `<h3>Charge plan</h3>`;
    let plannedStops = []; // { station, offRoute }[]
    let verdict = "no_stop";

    html += `<div class="plan-line">Trip distance (OSRM road): <strong>${tripKm.toFixed(1)} km</strong></div>`;
    html += `<div class="plan-line">Remaining range: <strong>${rem.toFixed(0)} km</strong> · Safety reserve: <strong>${margin.toFixed(0)} km (${safetyPercent}%)</strong></div>`;
    html += `<div class="plan-line">Usable without dipping into reserve: <strong>${usable.toFixed(0)} km</strong></div>`;

    // No stop needed: can complete trip AND keep the safety margin
    if (tripKm + margin <= rem) {
      cls = "ok";
      verdict = "no_stop";
      html += `<div class="plan-line"><strong>No charging stop needed</strong> — you'll arrive with approximately <strong>${spareKm.toFixed(0)} km / ${sparePct.toFixed(0)}%</strong> to spare (above your ${safetyPercent}% reserve).</div>`;
      html += `<div class="plan-line" style="color:var(--text-muted)">On-route stations below are optional reference only — not required for this trip.</div>`;
    } else {
      // A stop is required to keep the margin
      const stops = chainStops(candidates, tripKm, usable);
      plannedStops = stops;
      if (!stops.length) {
        cls = "err";
        verdict = "impossible";
        const shortfall = (tripKm + margin - rem).toFixed(0);
        html += `<div class="plan-line plan-alert"><strong>⚠️ Way too little charge for this trip</strong></div>`;
        html += `<div class="plan-line">You need about <strong>${(tripKm + margin).toFixed(0)} km</strong> of usable range (trip + ${safetyPercent}% reserve), but only have <strong>${rem.toFixed(0)} km</strong> left — short by ~${shortfall} km.</div>`;
        html += `<div class="plan-line">Raise your SoC, lower the safety reserve, or pick a closer destination. No safe charge plan is possible with the current numbers.</div>`;
        const anyInAbsRange = candidates
          .filter((s) => s.routeProgressKm != null && s.routeProgressKm <= rem)
          .sort((a, b) => (b.routeProgressKm ?? 0) - (a.routeProgressKm ?? 0));
        if (anyInAbsRange.length) {
          const s = anyInAbsRange[0];
          const off = !(
            s.detourKm != null && s.detourKm <= ON_ROUTE_DETOUR_MAX_KM
          );
          html += `<div class="plan-line">Nearest reachable option (may still break reserve): ${formatStopLabel(s, off)}</div>`;
        } else {
          html += `<div class="plan-line">No reachable stations along this corridor for the selected charge type.</div>`;
        }
      } else {
        cls = tripKm <= rem ? "warn" : "err";
        verdict = stops.length === 1 ? "one_stop" : "multi_stop";
        html += `<div class="plan-line"><strong>Charging stop required</strong> to keep your ${safetyPercent}% / ${margin.toFixed(0)} km reserve along the trip.</div>`;
        stops.forEach((item, i) => {
          const s = item.station;
          const progress = s.routeProgressKm ?? 0;
          // Rough charge left on arrival at this stop (before recharge)
          const chargeAtStopKm = Math.max(0, rem - progress);
          const chargeAtStopPct =
            fullRangeKm > 0 ? (chargeAtStopKm / fullRangeKm) * 100 : 0;
          html += `<div class="plan-line">Stop ${i + 1}: ${formatStopLabel(s, item.offRoute)} — arrive with ~${chargeAtStopKm.toFixed(0)} km / ${chargeAtStopPct.toFixed(0)}% remaining</div>`;
        });
        const last = stops[stops.length - 1].station;
        const remainingAfter = tripKm - (last.routeProgressKm ?? 0);
        if (remainingAfter > usable) {
          html += `<div class="plan-line">After stop ${stops.length}, ~${remainingAfter.toFixed(0)} km remain and may still exceed usable range — corridor may be sparse.</div>`;
        } else {
          html += `<div class="plan-line">After stop ${stops.length}, remaining ~${remainingAfter.toFixed(0)} km fits within usable range + reserve.</div>`;
        }
      }
    }

    // Friendly comfort / break gestures from real duration only
    const comfort = buildComfortBreakHints(
      tripKm,
      route.durationMin || 0,
      plannedStops
    );
    if (comfort.length) {
      html += `<div class="plan-line comfort-title"><strong>Comfort tips</strong></div>`;
      comfort.forEach((line) => {
        html += `<div class="plan-line comfort">${escapeHtml(line)}</div>`;
      });
    }

    html += `<div class="plan-line" style="margin-top:0.4rem;color:var(--text-muted);font-size:0.72rem">Deterministic plan: real OSRM distance + your SoC/range/reserve + live OCM stations. Stops ranked by route progress; detour ≤ ${ON_ROUTE_DETOUR_MAX_KM} km = on-route. Occupancy not predicted.</div>`;


    lastGroqResult = null;

    box.className = "charge-plan " + cls;
    box.innerHTML = html;
    box.classList.remove("hidden");

    lastDeterministicPlan = {
      verdict,
      plannedStops,
      tripKm,
      rem,
      margin,
      usable,
      candidates,
      durationMin: route.durationMin || 0,
      spareKm,
      sparePct,
      comfort,
    };

    // Highlight recommended stops on map + list (prefer on-route / green)
    if (verdict === "impossible") {
      applyRecommendedHighlights([]);
      showMapMessage(
        "Way too little charge for this trip — raise SoC or pick a closer destination.",
        true
      );
    } else {
      const picks = plannedStops.map((p) => p.station).filter(Boolean);
      const resolved = resolveRecommendedStations(picks, candidates);
      applyRecommendedHighlights(resolved.map((st) => st.id));
    }

    // Kick off optional Groq narration (non-blocking)
    requestGroqPlan(route, candidates, lastDeterministicPlan);
  }







  // ---------------------------------------------------------------------------
  // Optional Groq AI plan narration (never invents stations)
  // ---------------------------------------------------------------------------
  async function requestGroqPlan(route, candidates, detPlan) {
    if (!el.aiPlan) return;
    if (!GROQ_API_KEY || !GROQ_API_KEY.trim()) {
      el.aiPlan.classList.add("hidden");
      return;
    }

    el.aiPlan.className = "charge-plan ai-plan";
    el.aiPlan.innerHTML = `<h3>AI-suggested plan <span class="ai-badge">loading…</span></h3><div class="plan-line">Asking Groq to reason over the real station list…</div>`;
    el.aiPlan.classList.remove("hidden");

    const payload = {
      tripKm: route.distanceKm,
      durationMin: route.durationMin,
      remainingRangeKm: remainingRangeKm(),
      usableRangeKm: usableRangeKm(),
      safetyMarginKm: safetyMarginKm(),
      safetyPercent,
      verdictHint: detPlan.verdict,
      stations: candidates.slice(0, 40).map((s) => ({
        id: s.id,
        name: s.name,
        routeProgressKm:
          s.routeProgressKm != null ? Number(s.routeProgressKm.toFixed(2)) : null,
        detourKm: s.detourKm != null ? Number(s.detourKm.toFixed(2)) : null,
        distanceKm: s.distanceKm != null ? Number(s.distanceKm.toFixed(2)) : null,
        connectors: s.connections.map((c) => c.type).filter(Boolean),
        status: s.status,
      })),
    };

    try {
      const res = await fetch(GROQ_CHAT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are an EV trip assistant. You ONLY choose station IDs from the provided candidate list. Never invent stations, coordinates, or distances. Return JSON only.",
            },
            {
              role: "user",
              content: `Given this real trip data, decide ordered charging stops (if any) and explain briefly using only the provided numbers.

Rules:
- If remainingRangeKm >= tripKm + safetyMarginKm, recommendedStopIds must be [].
- Otherwise pick stops only from stations[].id, strongly preferring low detourKm (on-route / green: detour ≤ 5 km) and reachable within usableRangeKm. Avoid red (large detour) stations when a greener option exists.
- Do not invent IDs.

Data:
${JSON.stringify(payload)}

Return JSON shape:
{
  "recommendedStopIds": [number],
  "stops": [{ "id": number, "reason": string }],
  "summary": string
}`,
            },
          ],
        }),
      });

      if (!res.ok) {
        el.aiPlan.classList.add("hidden");
        return;
      }
      const data = await res.json();
      const content =
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content;
      if (!content) {
        el.aiPlan.classList.add("hidden");
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        el.aiPlan.classList.add("hidden");
        return;
      }

      const byId = new Map(candidates.map((s) => [s.id, s]));
      const rawIds = Array.isArray(parsed.recommendedStopIds)
        ? parsed.recommendedStopIds
        : (parsed.stops || []).map((x) => x.id);
      const validStops = [];
      for (const id of rawIds) {
        const st = byId.get(Number(id));
        if (st) validStops.push(st);
      }

      // If LLM said no stops or all IDs invalid when det plan also says no stop — OK
      // If all IDs invalid when stops were needed — hide AI box (use deterministic only)
      if (!validStops.length && detPlan.verdict !== "no_stop" && detPlan.verdict !== "impossible") {
        // try using reasons only if empty — fall back silently
        el.aiPlan.classList.add("hidden");
        return;
      }

      const reasonById = {};
      (parsed.stops || []).forEach((x) => {
        if (x && x.id != null) reasonById[Number(x.id)] = x.reason || "";
      });

      let html = `<h3>AI-suggested plan <span class="ai-badge">Groq</span></h3>`;
      if (parsed.summary) {
        html += `<div class="plan-line">${escapeHtml(parsed.summary)}</div>`;
      }
      if (!validStops.length) {
        html += `<div class="plan-line"><strong>No stop required</strong> (AI agrees with the numbers you entered).</div>`;
      } else {
        validStops.forEach((s, i) => {
          // Factual fields only from OCM object
          const reason = reasonById[s.id]
            ? escapeHtml(reasonById[s.id])
            : "";
          html += `<div class="plan-line">Stop ${i + 1}: ${formatStopLabel(
            s,
            !(s.detourKm != null && s.detourKm <= ON_ROUTE_DETOUR_MAX_KM)
          )}${reason ? `<br><span style="color:var(--text-muted)">${reason}</span>` : ""}</div>`;
        });
      }
      html += `<div class="plan-line" style="margin-top:0.35rem;color:var(--text-muted);font-size:0.72rem">Station facts (distances, connectors) come from Open Charge Map / OSRM — not from the model. Invalid model IDs were dropped.</div>`;
  
      // Spoken text prefers AI summary + validated stop reasons
      const spokenParts = [];
      if (parsed.summary) spokenParts.push(parsed.summary);
      validStops.forEach((st, i) => {
        const reason = reasonById[st.id];
        spokenParts.push(
          `Stop ${i + 1}: ${st.name}` + (reason ? `. ${reason}` : ".")
        );
      });
      if (detPlan && detPlan.comfort && detPlan.comfort.length) {
        spokenParts.push(detPlan.comfort.join(" "));
      }
      lastGroqResult = {
        summary: parsed.summary || "",
        stops: validStops.map((st) => ({
          id: st.id,
          reason: reasonById[st.id] || "",
        })),
        spokenText: spokenParts.join(" "),
      };

      // Map highlight: never prefer off-route AI picks when green on-route exists
      if (validStops.length) {
        const ordered = resolveRecommendedStations(validStops, candidates);
        applyRecommendedHighlights(ordered.map((st) => st.id));
        const first = ordered[0];
        if (first && first.coords && map) {
          try {
            map.flyTo({
              center: [first.coords.lng, first.coords.lat],
              zoom: Math.max(map.getZoom(), 12),
              duration: 900,
            });
          } catch (_) {}
        }
      }

      el.aiPlan.className = "charge-plan ai-plan ok";
      el.aiPlan.innerHTML = html;
      el.aiPlan.classList.remove("hidden");
    } catch (err) {
      console.warn("Groq plan failed:", err);
      el.aiPlan.classList.add("hidden");
      lastGroqResult = null;
    }
  }

  async function onDestinationSelected(item) {
    const dest = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };
    destCoords = dest;
    el.suggestions.classList.add("hidden");
    el.destInput.value = item.display_name.split(",").slice(0, 3).join(",");

    if (!userPos) {
      showMapMessage("User location not available — cannot compute route.", true);
      return;
    }

    el.routeInfo.classList.remove("hidden");
    el.routeDistance.textContent = "…";
    el.routeDuration.textContent = "…";
    if (el.routeEta) el.routeEta.textContent = "…";
    el.routeDistance.setAttribute("data-label", "Distance");
    el.routeDuration.setAttribute("data-label", "Duration");
    el.chargePlan.classList.add("hidden");

    try {
      const route = await fetchRoute(userPos, dest);
      lastRoute = route;
      drawRoute(route.polyline);
      el.routeDistance.textContent = `${route.distanceKm.toFixed(1)} km`;
      el.routeDuration.textContent = `${Math.round(route.durationMin)} min`;
      if (el.startJourney) {
        el.startJourney.disabled = !(route.steps && route.steps.length);
        el.startJourney.textContent = "Start journey";
      }
      stopJourneyTracking();
      if (route.steps && route.steps.length) {
        renderRouteInstructions(route.steps);
      }
      if (el.routeEta) {
        const eta = new Date(Date.now() + route.durationMin * 60 * 1000);
        el.routeEta.textContent = `Arrive around ${formatClock(eta)}`;
        el.routeEta.setAttribute("data-label", "ETA");
      }

      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([userPos.lng, userPos.lat]);
      bounds.extend([dest.lng, dest.lat]);
      route.polyline.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 60, duration: 1000 });

      const along = await loadStationsAlongRoute(route.polyline, CORRIDOR_KM);
      updateChargePlan(route, along);
    } catch (err) {
      console.error(err);
      showMapMessage(`Routing failed: ${err.message}`, true);
      el.routeDistance.textContent = "—";
      el.routeDuration.textContent = "—";
      if (el.routeEta) el.routeEta.textContent = "—";
    }
  }

  function setupSearch() {
    el.destInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      const q = el.destInput.value.trim();
      if (q.length < 2) {
        el.suggestions.classList.add("hidden");
        return;
      }
      searchTimeout = setTimeout(async () => {
        try {
          const results = await geocode(q);
          if (!results.length) {
            el.suggestions.innerHTML = `<li><div class="sug-name">No results</div></li>`;
          } else {
            el.suggestions.innerHTML = results
              .map(
                (r, i) => `
                <li data-idx="${i}">
                  <div class="sug-name">${escapeHtml(r.display_name.split(",")[0])}</div>
                  <div class="sug-sub">${escapeHtml(r.display_name)}</div>
                </li>`
              )
              .join("");
            el.suggestions.querySelectorAll("li").forEach((li) => {
              li.addEventListener("click", () => {
                const idx = Number(li.dataset.idx);
                onDestinationSelected(results[idx]);
              });
            });
          }
          el.suggestions.classList.remove("hidden");
        } catch (err) {
          console.error(err);
          el.suggestions.innerHTML = `<li><div class="sug-name">Search failed</div><div class="sug-sub">${escapeHtml(err.message)}</div></li>`;
          el.suggestions.classList.remove("hidden");
        }
      }, 400);
    });

    document.addEventListener("click", (e) => {
      if (
        !el.destInput.contains(e.target) &&
        !el.suggestions.contains(e.target)
      ) {
        el.suggestions.classList.add("hidden");
      }
    });

    el.clearRoute.addEventListener("click", clearRoute);
    if (el.applyReplan) {
      el.applyReplan.addEventListener("click", applyAndReplan);
    }
  }

  function setupBatteryAndFilters() {
    // Restore saved vehicle profile (demo friction fix)
    const saved = loadVehicleProfile();
    if (saved) {
      if (saved.socPercent != null) {
        socPercent = Number(saved.socPercent) || 70;
        el.socInput.value = String(socPercent);
      }
      if (saved.fullRangeKm != null) {
        fullRangeKm = Number(saved.fullRangeKm) || 350;
        el.fullRangeInput.value = String(fullRangeKm);
      }
      if (saved.safetyPercent != null && el.safetyInput) {
        safetyPercent = Number(saved.safetyPercent) || 20;
        el.safetyInput.value = String(safetyPercent);
      }
    }

    el.socInput.addEventListener("input", () => {
      socPercent = Number(el.socInput.value) || 0;
      updateRangeUI();
      syncSocChips();
    });
    el.fullRangeInput.addEventListener("input", () => {
      fullRangeKm = Number(el.fullRangeInput.value) || 1;
      updateRangeUI();
    });
    if (el.safetyInput) {
      el.safetyInput.addEventListener("input", () => {
        safetyPercent = Number(el.safetyInput.value) || 0;
        updateRangeUI();
      });
    }

    // Quick SoC chips
    document.querySelectorAll(".soc-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const v = Number(btn.getAttribute("data-soc"));
        if (!v) return;
        socPercent = v;
        el.socInput.value = String(v);
        updateRangeUI();
        syncSocChips();
      });
    });
    function syncSocChips() {
      document.querySelectorAll(".soc-chip").forEach((btn) => {
        const v = Number(btn.getAttribute("data-soc"));
        btn.classList.toggle("active", v === Number(socPercent));
      });
    }
    syncSocChips();

    // initial (HTML defaults if nothing saved)
    if (!saved) {
      socPercent = Number(el.socInput.value) || 70;
      fullRangeKm = Number(el.fullRangeInput.value) || 350;
      safetyPercent = el.safetyInput ? Number(el.safetyInput.value) || 20 : 20;
    }
    updateRangeUI();
  }

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Vehicle model selection (from India_EV_Dataset.csv)
  // ---------------------------------------------------------------------------
  function parseCsvLine(line) {
    const out = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQ = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQ = true;
      } else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  }

  async function loadEVDataset() {
    if (!el.vehicleModel) return;
    try {
      const response = await fetch("./India_EV_Dataset.csv");
      if (!response.ok) throw new Error("CSV " + response.status);
      const text = await response.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) throw new Error("Empty CSV");
      const headers = parseCsvLine(lines[0]);
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < headers.length) continue;
        const row = {};
        headers.forEach((h, idx) => {
          row[h.trim()] = (cols[idx] || "").trim();
        });
        rows.push(row);
      }
      evDataset = rows;
      const models = Array.from(
        new Set(rows.map((r) => (r.Model || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));
      el.vehicleModel.innerHTML =
        '<option value="">Select model</option>' +
        models
          .map(
            (model) =>
              `<option value="${escapeHtml(model)}">${escapeHtml(model)}</option>`
          )
          .join("");
      el.vehicleModel.disabled = false;
    } catch (err) {
      console.error("Failed to load EV dataset:", err);
      el.vehicleModel.innerHTML = '<option value="">Could not load models</option>';
    }
  }

  function setupVehicleSelection() {
    if (!el.vehicleModel) return;
    el.vehicleModel.addEventListener("change", () => {
      const selectedModel = el.vehicleModel.value;
      if (!selectedModel) {
        if (el.vehicleInfo) el.vehicleInfo.classList.add("hidden");
        selectedVehicleLabel = "";
        return;
      }
      const row = evDataset.find((r) => (r.Model || "").trim() === selectedModel);
      if (!row) return;
      const parsedRange = Number.parseFloat(row["Electric Range"]);
      selectedVehicleLabel = selectedModel;
      if (el.vehicleRange) {
        el.vehicleRange.textContent = Number.isFinite(parsedRange)
          ? `${parsedRange} km`
          : "Unknown";
      }
      let cafv = row["Clean Alternative Fuel Vehicle (CAFV) Eligibility"] || "Unknown";
      if (cafv.includes("Not eligible") || cafv.includes("Not Eligible")) cafv = "Not eligible";
      else if (cafv.includes("Eligible")) cafv = "Eligible";
      if (el.vehicleCafv) el.vehicleCafv.textContent = cafv;
      if (el.vehicleInfo) el.vehicleInfo.classList.remove("hidden");

      // Apply rated range into full-range input when known
      if (Number.isFinite(parsedRange) && parsedRange > 0) {
        fullRangeKm = parsedRange;
        el.fullRangeInput.value = String(Math.round(parsedRange));
        updateRangeUI();
      }
    });
  }

  async function start() {
    setLocationStatus("Locating…");
    setupBatteryAndFilters();
    setupSearch();
    setupRecenterButton();
    setupVehicleSelection();
    loadEVDataset();
    if (el.startJourney) {
      el.startJourney.addEventListener("click", startJourney);
    }
    el.closeDrawer.addEventListener("click", () => {
      el.detailDrawer.classList.add("hidden");
      selectedId = null;
    });

    const { pos, fallback, reason } = await getUserLocation();
    userPos = pos;
    isFallbackLocation = fallback;

    initMap(pos);
    placeUserMarker(pos, fallback);
    if (el.recenterButton) el.recenterButton.disabled = false;

    if (fallback) {
      setLocationStatus("Default: Bengaluru", "warn");
      showMapMessage(
        `Geolocation unavailable (${reason || "permission denied"}). Map centered on Bengaluru as a labeled default — not your real GPS position.`,
        false
      );
    } else {
      setLocationStatus(
        `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`,
        "ok"
      );
    }

    await loadStationsAround(pos, {
      title: "Nearby stations",
      setAsCurrent: true,
    });
  }

  start().catch((err) => {
    console.error(err);
    setLocationStatus("Error", "err");
    showMapMessage("Failed to start: " + err.message, true);
  });
})();
