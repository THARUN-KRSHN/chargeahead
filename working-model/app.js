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

  // Traffic-light tiers (reuse real detour / range numbers only)
  const ON_ROUTE_DETOUR_GOOD_KM = ON_ROUTE_DETOUR_MAX_KM; // ≤5 km detour = green
  const ON_ROUTE_DETOUR_FAR_KM = CORRIDOR_KM; // beyond corridor edge = red
  const NEARBY_COMFORTABLE_FRACTION = 0.5; // nearby mode: green if well within usable range

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
  let lastRoute = null; // { polyline, distanceKm, durationMin }

  // User-provided battery (no invented vehicle model)
  let socPercent = 70;
  let fullRangeKm = 350;
  let safetyPercent = 20; // user-configurable reserve (% of full range)
  let listShowAll = false; // "show more" for long station lists
  let lastDeterministicPlan = null; // for Groq validation / fallback
  let lastGroqResult = null; // { summary, stops:[{id,reason}], spokenText } after validation
  let currentBriefingAudio = null; // HTMLAudioElement when Groq TTS is playing
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
    chargePlan: $("charge-plan"),
    aiPlan: $("ai-plan"),
    clearRoute: $("clear-route"),
    connectorFilter: $("connector-filter"),
    reachableOnly: $("reachable-only"),
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
    if (userMarker) userMarker.remove();
    const node = document.createElement("div");
    node.style.cssText = `
      width: 18px; height: 18px; border-radius: 50%;
      background: ${isFallback ? "#f59e0b" : "#3b82f6"};
      border: 3px solid #fff;
      box-shadow: 0 0 0 6px ${isFallback ? "rgba(245,158,11,0.25)" : "rgba(59,130,246,0.3)"};
    `;
    node.title = isFallback
      ? "Default location (Bengaluru) — geolocation denied or unavailable"
      : "Your location";
    userMarker = new maplibregl.Marker({ element: node })
      .setLngLat([pos.lng, pos.lat])
      .addTo(map);
    map.flyTo({ center: [pos.lng, pos.lat], zoom: 12, duration: 1000 });
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

  function classifyStationTier(station) {
    const usable = usableRangeKm();
    if (station.routeProgressKm != null) {
      if (station.routeProgressKm > usable) return "red";
      if (station.detourKm != null && station.detourKm <= ON_ROUTE_DETOUR_GOOD_KM)
        return "green";
      if (station.detourKm != null && station.detourKm <= ON_ROUTE_DETOUR_FAR_KM)
        return "yellow";
      return "red";
    }
    if (station.distanceKm == null) return "yellow";
    if (station.distanceKm <= usable * NEARBY_COMFORTABLE_FRACTION) return "green";
    if (station.distanceKm <= usable) return "yellow";
    return "red";
  }

  function stopSpeaking() {
    if (currentBriefingAudio) {
      try {
        currentBriefingAudio.pause();
        currentBriefingAudio.src = "";
      } catch (_) {}
      currentBriefingAudio = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
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
    const size = isRec ? 34 : 28;
    const border = isRec ? "3px solid #fff" : "2px solid #fff";
    const ring = isRec
      ? `0 0 0 3px ${color}, 0 0 12px ${color}aa`
      : `0 0 8px ${color}80`;

    const node = document.createElement("div");
    node.style.cssText = `
      width: ${size}px; height: ${size}px; border-radius: 50%;
      background: ${color};
      border: ${border};
      box-shadow: ${ring};
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      opacity: ${offline ? 0.55 : 1};
      position: relative;
    `;
    const warn = offline
      ? `<span style="position:absolute;top:-6px;right:-6px;font-size:11px;line-height:1">⚠</span>`
      : "";
    node.innerHTML = `${warn}<svg width="14" height="14" viewBox="0 0 24 24" fill="#0f1419"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;

    const tierLabel =
      tier === "green"
        ? "Optimal — on route, short detour, in range"
        : tier === "yellow"
          ? "Slightly far — longer detour or near range edge"
          : "Too far — beyond usable range or large detour";
    node.title =
      station.name +
      " — " +
      tierLabel +
      (offline ? " — reported non-operational" : "") +
      (isRec ? " — Recommended stop" : "");

    const marker = new maplibregl.Marker({ element: node })
      .setLngLat([station.coords.lng, station.coords.lat])
      .addTo(map);

    node.addEventListener("click", (e) => {
      e.stopPropagation();
      selectStation(station);
    });
    stationMarkers.push(marker);
  }

  function ensureMapLegend() {
    if (!map || document.getElementById("map-tier-legend")) return;
    const box = document.createElement("div");
    box.id = "map-tier-legend";
    box.className = "map-tier-legend";
    box.innerHTML = `
      <div><span class="leg-dot" style="background:#22c55e"></span> Optimal — on route, short detour, in range</div>
      <div><span class="leg-dot" style="background:#f59e0b"></span> Slightly far — longer detour or near range edge</div>
      <div><span class="leg-dot" style="background:#ef4444"></span> Too far — beyond usable range or large detour</div>
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
    if (activeFilter) {
      filtered = filtered.filter((s) =>
        s.connections.some((c) => c.type === activeFilter)
      );
    }
    if (reachableOnly) {
      filtered = filtered.filter(isReachable);
    }

    // Along a route: sort by progress along the trip (order you'd pass them).
    // Nearby mode: keep straight-line distance from you.
    const onRoute = filtered.some((s) => s.routeProgressKm != null);
    if (onRoute) {
      filtered.sort(
        (a, b) => (a.routeProgressKm ?? 9999) - (b.routeProgressKm ?? 9999)
      );
    } else {
      filtered.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    el.stationCount.textContent = String(filtered.length);

    if (!stations.length) {
      el.stationList.innerHTML = `<div class="empty-state">No verified stations found in this area.<br>Open Charge Map may have sparse coverage outside major cities.</div>`;
      return;
    }
    if (!filtered.length) {
      el.stationList.innerHTML = `<div class="empty-state">No stations match the current filters (connector / reachable range).</div>`;
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
        const recBadge = recommendedStationIds.has(s.id)
          ? `<span class="rec-badge">Recommended</span>`
          : "";
        return `
          <div class="station-card ${selectedId === s.id ? "active" : ""} ${reach ? "" : "out-of-range"}" data-id="${s.id}">
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
    const url = `${OSRM}/${coords}?geometries=geojson&overview=full`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    const route = data.routes && data.routes[0];
    if (!route) throw new Error("No route found");
    return {
      polyline: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    };
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

  function clearRoute() {
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
    stopSpeaking();
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
    const onRoute = candidates.filter(
      (s) =>
        s.detourKm != null &&
        s.detourKm <= ON_ROUTE_DETOUR_MAX_KM &&
        s.routeProgressKm != null &&
        s.routeProgressKm <= usable
    );
    onRoute.sort((a, b) => (b.routeProgressKm ?? 0) - (a.routeProgressKm ?? 0));
    if (onRoute.length) {
      return { station: onRoute[0], offRoute: false };
    }
    if (!preferOnRoute) return { station: null, offRoute: false };

    // Fallback: any reachable station in the wider corridor (honest label)
    const any = candidates
      .filter(
        (s) => s.routeProgressKm != null && s.routeProgressKm <= usable
      )
      .sort((a, b) => (b.routeProgressKm ?? 0) - (a.routeProgressKm ?? 0));
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
      const onRouteAhead = ahead
        .filter(
          (s) => s.detourKm != null && s.detourKm <= ON_ROUTE_DETOUR_MAX_KM
        )
        .sort((a, b) => (b.routeProgressKm ?? 0) - (a.routeProgressKm ?? 0));
      if (onRouteAhead.length) {
        station = onRouteAhead[0];
        offRoute = false;
      } else if (ahead.length) {
        ahead.sort((a, b) => (b.routeProgressKm ?? 0) - (a.routeProgressKm ?? 0));
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
    if (activeFilter) {
      candidates = candidates.filter((s) =>
        s.connections.some((c) => c.type === activeFilter)
      );
    }

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
        html += `<div class="plan-line"><strong>Cannot complete trip within your safety reserve</strong> — shortfall of ~${(tripKm + margin - rem).toFixed(0)} km vs remaining charge.</div>`;
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

    if (activeFilter) {
      html += `<div class="plan-line">Filter active: <strong>${escapeHtml(activeFilter)}</strong></div>`;
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

    html += voiceButtonRowHtml();

    stopSpeaking();
    lastGroqResult = null;

    box.className = "charge-plan " + cls;
    box.innerHTML = html;
    box.classList.remove("hidden");
    wireVoiceButtons(box);

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

    // Highlight recommended stops on map + list
    recommendedStationIds = new Set(
      plannedStops.map((p) => p.station && p.station.id).filter((id) => id != null)
    );
    // Re-render markers/list to apply highlight
    if (routeStations.length) {
      clearStationMarkers();
      routeStations.forEach(addStationMarker);
      renderStationList(routeStations, "Stations along this route");
    }

    // Kick off optional Groq narration (non-blocking)
    requestGroqPlan(route, candidates, lastDeterministicPlan);
  }

  function voiceButtonRowHtml() {
    return `<div class="voice-row">
      <button type="button" class="btn-voice play-briefing">🔊 Play voice briefing</button>
      <button type="button" class="btn-voice stop-briefing">⏹ Stop</button>
    </div>`;
  }

  function wireVoiceButtons(container) {
    if (!container) return;
    const play = container.querySelector(".play-briefing");
    const stop = container.querySelector(".stop-briefing");
    if (play) {
      play.addEventListener("click", async () => {
        const text = buildSpokenText(lastDeterministicPlan, lastGroqResult);
        if (!text) {
          showMapMessage("No plan to read yet — set a destination first.", true);
          return;
        }
        play.disabled = true;
        play.textContent = "Generating…";
        try {
          await speakPlan(text);
        } finally {
          play.disabled = false;
          play.textContent = "🔊 Play voice briefing";
        }
      });
    }
    if (stop) stop.addEventListener("click", () => stopSpeaking());
  }

  function buildSpokenText(detPlan, groqResult) {
    if (groqResult && groqResult.spokenText) return groqResult.spokenText;
    if (!detPlan) return "";

    const parts = [];
    const trip = detPlan.tripKm != null ? detPlan.tripKm.toFixed(1) : "?";
    parts.push(`Your trip is about ${trip} kilometers.`);

    if (detPlan.verdict === "no_stop") {
      const spare =
        detPlan.spareKm != null ? detPlan.spareKm.toFixed(0) : "some";
      parts.push(
        `You'll arrive with about ${spare} kilometers to spare. No charging stop needed.`
      );
    } else if (detPlan.verdict === "impossible") {
      parts.push(
        "You cannot complete this trip within your current charge and safety reserve. Please raise your state of charge or adjust the reserve."
      );
    } else if (detPlan.plannedStops && detPlan.plannedStops.length) {
      parts.push(
        detPlan.plannedStops.length === 1
          ? "One charging stop is recommended."
          : `${detPlan.plannedStops.length} charging stops are recommended.`
      );
      detPlan.plannedStops.forEach((item, i) => {
        const s = item.station;
        if (!s) return;
        const progress =
          s.routeProgressKm != null
            ? `about ${s.routeProgressKm.toFixed(0)} kilometers into the trip`
            : "along the route";
        const detour =
          s.detourKm != null
            ? `, about ${s.detourKm.toFixed(1)} kilometers off the road path`
            : "";
        parts.push(
          `Stop ${i + 1}: ${s.name}, ${progress}${detour}.`
        );
      });
    }

    if (detPlan.comfort && detPlan.comfort.length) {
      parts.push(detPlan.comfort.join(" "));
    }

    return parts.join(" ");
  }

  async function speakPlan(text) {
    stopSpeaking();
    if (GROQ_API_KEY && GROQ_API_KEY.trim()) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "playai-tts",
            voice: "Aaliyah-PlayAI",
            input: text.slice(0, 4000),
            response_format: "mp3",
          }),
        });
        if (!res.ok) throw new Error(`Groq TTS ${res.status}`);
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        currentBriefingAudio = audio;
        await audio.play();
        return audio;
      } catch (err) {
        console.warn("Groq TTS failed, falling back to browser speech:", err);
      }
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      window.speechSynthesis.speak(u);
      return null;
    }
    showMapMessage("Voice briefing isn't supported in this browser.", true);
    return null;
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
- Otherwise pick stops only from stations[].id, preferring low detourKm and high routeProgressKm still reachable within usableRangeKm from the start (or from previous stop assuming a full recharge).
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
      html += voiceButtonRowHtml();

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

      // Prefer AI-validated stops for map highlight when present
      if (validStops.length) {
        recommendedStationIds = new Set(validStops.map((st) => st.id));
        if (routeStations.length) {
          clearStationMarkers();
          routeStations.forEach(addStationMarker);
          renderStationList(routeStations, "Stations along this route");
        }
      }

      el.aiPlan.className = "charge-plan ai-plan ok";
      el.aiPlan.innerHTML = html;
      el.aiPlan.classList.remove("hidden");
      wireVoiceButtons(el.aiPlan);
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
    el.routeDistance.setAttribute("data-label", "Distance");
    el.routeDuration.setAttribute("data-label", "Duration");
    el.chargePlan.classList.add("hidden");

    try {
      const route = await fetchRoute(userPos, dest);
      lastRoute = route;
      drawRoute(route.polyline);
      el.routeDistance.textContent = `${route.distanceKm.toFixed(1)} km`;
      el.routeDuration.textContent = `${Math.round(route.durationMin)} min`;

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
  }

  function setupBatteryAndFilters() {
    el.socInput.addEventListener("input", () => {
      socPercent = Number(el.socInput.value) || 0;
      updateRangeUI();
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

    el.connectorFilter.addEventListener("change", () => {
      activeFilter = el.connectorFilter.value;
      renderStationList(getActiveList(), getActiveTitle());
      if (lastRoute) updateChargePlan(lastRoute, routeStations);
    });

    el.reachableOnly.addEventListener("change", () => {
      reachableOnly = el.reachableOnly.checked;
      renderStationList(getActiveList(), getActiveTitle());
    });

    // initial
    socPercent = Number(el.socInput.value) || 70;
    fullRangeKm = Number(el.fullRangeInput.value) || 350;
    safetyPercent = el.safetyInput ? Number(el.safetyInput.value) || 20 : 20;
    updateRangeUI();
  }

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------
  async function start() {
    setLocationStatus("Locating…");
    setupBatteryAndFilters();
    setupSearch();
    el.closeDrawer.addEventListener("click", () => {
      el.detailDrawer.classList.add("hidden");
      selectedId = null;
    });

    const { pos, fallback, reason } = await getUserLocation();
    userPos = pos;
    isFallbackLocation = fallback;

    initMap(pos);
    placeUserMarker(pos, fallback);

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
