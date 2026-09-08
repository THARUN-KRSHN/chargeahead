(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Config Ã¢â‚¬â€ put a free OCM key here if you hit rate limits
  // Register at https://openchargemap.org (free)
  // ---------------------------------------------------------------------------
  const OCM_API_KEY = "d338ca7e-aadf-4249-8245-b268bd32e47e"; // optional; leave empty for anonymous (low volume)
  const GEMINI_API_KEY = "AIzaSyAm0MOgbu31YCyFOCGpcySNKGDC1kegRD4";
  const MAPTILER_KEY = "FlFldT3wDqWlXQi2PcH1";
  const GEMINI_MODEL = "gemini-3.5-flash-lite";
  const SAFE_BACKUP_MIN_KM = 50;
  const SAFE_BACKUP_RATIO = 0.2;
  const GEMINI_RECOMMENDATION_LIMIT = 8;
  const NAVIGATION_ZOOM = 18;

  const OCM_BASE = "https://api.openchargemap.io/v3/poi/";
  const OSRM = "https://router.project-osrm.org/route/v1/driving";
  const FALLBACK_CENTER = { lat: 12.9716, lng: 77.5946 }; // Bengaluru (labeled as default)

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  let map = null;
  let userMarker = null;
  let stationMarkers = [];
  let routeSourceId = "route-line";
  let userPos = null;           // { lat, lng } or null
  let isFallbackLocation = false;
  let currentStations = [];     // raw OCM POIs + computed distanceKm
  let routeStations = [];       // stations near destination / along route
  let activeFilter = "";
  let selectedId = null;
  let destCoords = null;
  let currentRoute = null;
  let navigationWatchId = null;
  let liveStepIndex = 0;
  let searchTimeout = null;
  let selectedVehicleRangeKm = null;
  let selectedVehicleLabel = "";
  let recommendationTimer = null;
  let recommendationRequestId = 0;
  let recommendationInFlight = false;
  let recommendationDirty = false;
  let lastRecommendationKey = "";

  // ---------------------------------------------------------------------------
  // DOM refs
  // ---------------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const el = {
    locationStatus: $("location-status"),           // mobile topbar pill
    locationStatusDesktop: $("location-status-desktop"), // desktop panel pill
    destInput: $("dest-input"),
    suggestions: $("suggestions"),
    routeInfo: $("route-info"),
    routeDistance: $("route-distance"),
    routeDuration: $("route-duration"),
    clearRoute: $("clear-route"),
    startJourney: $("start-journey"),
    routeInstructions: $("route-instructions"),
    instructionList: $("instruction-list"),
    connectorFilter: $("connector-filter"),
    listTitle: $("list-title"),
    stationCount: $("station-count"),
    stationList: $("station-list"),
    mapMessage: $("map-message"),
    liveNavigation: $("live-navigation"),
    liveInstruction: $("live-instruction"),
    liveDistance: $("live-distance"),
    recenterButton: $("recenter-btn"),
    detailDrawer: $("detail-drawer"),
    detailContent: $("detail-content"),
    closeDrawer: $("close-drawer"),
    vehicleModel: $("vehicle-model"),
    vehicleInfo: $("vehicle-info"),
    vehicleRange: $("vehicle-range"),
    vehicleCafv: $("vehicle-cafv"),
    aiStatus: $("ai-status"),
    aiResult: $("ai-result"),
    aiRefresh: $("ai-refresh"),
    aiCard: $("ai-card"),
    sidePanel: $("side-panel"),
    panelFab: $("panel-fab"),
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

  function bearingBetween(from, to) {
    const lat1 = (from.lat * Math.PI) / 180;
    const lat2 = (to.lat * Math.PI) / 180;
    const dLng = ((to.lng - from.lng) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
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
    const cls2 = "status-pill " + (cls || "");
    // update both the mobile topbar pill and the desktop panel pill
    if (el.locationStatus) {
      el.locationStatus.textContent = text;
      el.locationStatus.className = cls2;
    }
    if (el.locationStatusDesktop) {
      el.locationStatusDesktop.textContent = text;
      el.locationStatusDesktop.className = cls2 + " status-pill--sm";
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Map + Geolocation
  // ---------------------------------------------------------------------------
  function initMap(center) {
    map = new maplibregl.Map({
      container: "map",
      style: `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`,
      center: [center.lng, center.lat],
      zoom: 12,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      // route source/layer will be added when a route is drawn
    });
  }

  function placeUserMarker(pos, isFallback) {
    if (userMarker) userMarker.remove();

    const markerEl = document.createElement("div");
    const color = isFallback ? "#FFB300" : "#2979FF";
    const glow  = isFallback ? "rgba(255,179,0,0.28)" : "rgba(41,121,255,0.28)";
    markerEl.style.cssText = `
      width: 34px; height: 34px; border-radius: 50%;
      background: ${color};
      border: 3px solid #fff;
      box-shadow: 0 0 0 7px ${glow}, 0 2px 8px rgba(0,0,0,0.4);
      cursor: default;
      display: flex; align-items: center; justify-content: center;
    `;
    markerEl.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 11.5 6.6 6h10.8l1.6 5.5V17h-2v-2H7v2H5v-5.5Z" fill="#fff"/>
        <path d="M8 9.5h8l-.8-2H8.8l-.8 2Z" fill="${color}"/>
        <circle cx="8" cy="13" r="1.2" fill="${color}"/>
        <circle cx="16" cy="13" r="1.2" fill="${color}"/>
      </svg>`;
    markerEl.title = isFallback
      ? "Default location (Bengaluru) - geolocation denied or unavailable"
      : "Your location";

    userMarker = new maplibregl.Marker({ element: markerEl })
      .setLngLat([pos.lng, pos.lat])
      .addTo(map);

    map.flyTo({ center: [pos.lng, pos.lat], zoom: 12, duration: 1000 });
  }

  function recenterMap() {
    if (!map || !userPos) return;
    map.flyTo({
      center: [userPos.lng, userPos.lat],
      zoom: navigationWatchId != null ? NAVIGATION_ZOOM : 18,
      duration: 700,
    });
  }

  function setupRecenterButton() {
    if (!el.recenterButton) return;
    el.recenterButton.disabled = false;
    el.recenterButton.addEventListener("click", recenterMap);
  }

  function getUserLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ pos: FALLBACK_CENTER, fallback: true, reason: "Geolocation not supported by this browser" });
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
    if (OCM_API_KEY) params.set("key", OCM_API_KEY);

    const url = `${OCM_BASE}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Open Charge Map error ${res.status}: ${text.slice(0, 120) || res.statusText}`);
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
      type: (c.ConnectionType && c.ConnectionType.Title) || c.ConnectionTypeID || "Unknown",
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
    if (Number.isNaN(d.getTime())) return true;
    const ageDays = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    return ageDays > 90;
  }

  function renderStationList(stations, title) {
    const filtered = activeFilter
      ? stations.filter((s) => s.connections.some((c) => c.type === activeFilter))
      : stations;

    if (el.listTitle) {
      el.listTitle.textContent = title;
    }
    if (el.stationCount) {
      el.stationCount.textContent = String(filtered.length);
    }

    if (!filtered.length) {
      el.stationList.innerHTML = `<div class="empty-state">No stations match the selected connector filter.</div>`;
      return;
    }

    el.stationList.innerHTML = filtered
      .map((s) => {
        const dist = s.distanceKm != null ? `${s.distanceKm.toFixed(1)} km` : "";
        const stale = isStale(s.dateLastVerified)
          ? `<span class="freshness-tag">Unverified</span>`
          : "";
        const status = s.status || "Status unknown";
        const isActive = selectedId === s.id;
        return `
          <div class="station-card ${isActive ? "active" : ""}" data-id="${s.id}">
            <div class="stn-name">${escapeHtml(s.name)}</div>
            <div class="stn-meta">
              ${dist ? `<span class="stn-dist">${dist}</span>` : ""}
              <span>${escapeHtml(status)}</span>
              ${s.operator ? `<span>${escapeHtml(s.operator)}</span>` : ""}
              ${stale}
            </div>
          </div>`;
      })
      .join("");

    el.stationList.querySelectorAll(".station-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = Number(card.dataset.id);
        const st = filtered.find((s) => s.id === id);
        if (st) selectStation(st);
      });
    });
  }

  function clearStationMarkers() {
    stationMarkers.forEach((marker) => marker.remove());
    stationMarkers = [];
  }

  function addStationMarker(station) {
    if (!map) return;

    const markerEl = document.createElement("div");
    const isOperational = station.statusIsOperational !== false;
    markerEl.className = "station-marker";
    markerEl.style.cssText = `
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid #fff;
      background: ${isOperational ? "#00C853" : "#FF5252"};
      box-shadow: 0 0 0 5px ${isOperational ? "rgba(0,200,83,0.2)" : "rgba(255,82,82,0.2)"};
      cursor: pointer;
    `;
    markerEl.title = station.name;
    markerEl.addEventListener("click", (e) => {
      e.stopPropagation();
      selectStation(station);
    });

    const marker = new maplibregl.Marker({ element: markerEl, anchor: "center" })
      .setLngLat([station.coords.lng, station.coords.lat])
      .addTo(map);

    stationMarkers.push(marker);
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
    renderStationList(
      routeStations.length ? routeStations : currentStations,
      routeStations.length ? "Stations along / near route" : "Nearby stations"
    );

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
      ? ` <span class="freshness-tag">Not recently verified</span>`
      : "";

    let connHtml = "";
    if (s.connections.length) {
      connHtml =
        `<ul class="conn-list">` +
        s.connections
          .map((c) => {
            const power = c.powerKW != null ? `${c.powerKW} kW` : "Power unknown";
            return `<li><span>${escapeHtml(c.type)} x ${c.quantity}</span><span>${power}</span></li>`;
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
          <label>Distance</label>
          <span>${s.distanceKm != null ? s.distanceKm.toFixed(2) + " km" : "—"}</span>
        </div>
        <div class="detail-item">
          <label>Last Verified</label>
          <span>${verified}${staleNote}</span>
        </div>
      </div>
      <div class="detail-item">
        <label>Connectors (from Open Charge Map)</label>
        ${connHtml}
      </div>
      <p class="no-data" style="margin-top:1rem">
        Live availability, queue times and confidence scores are not provided by Open Charge Map and are intentionally not displayed here.
      </p>
    `;
    el.detailDrawer.classList.remove("hidden");
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getStationPoolForRecommendation() {
    // A route is the user's active journey, so never mix nearby stations into
    // the AI candidate set while route stations are available.
    const base = routeStations.length ? routeStations : currentStations;
    const visible = activeFilter
      ? base.filter((s) => s.connections.some((c) => c.type === activeFilter))
      : base;

    return visible
      .filter((s) => s.distanceKm != null)
      .filter((s) => s.statusIsOperational !== false)
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }

  function computeSafeBackupKm(rangeKm) {
    if (!Number.isFinite(rangeKm) || rangeKm <= 0) return null;
    return Math.max(SAFE_BACKUP_MIN_KM, Math.round(rangeKm * SAFE_BACKUP_RATIO));
  }

  function summarizeConnections(connections) {
    if (!connections.length) return "No connector details";

    return connections
      .slice(0, 3)
      .map((c) => {
        const power = c.powerKW != null ? `${c.powerKW} kW` : "power unknown";
        return `${c.type}${c.quantity ? ` x${c.quantity}` : ""} (${power})`;
      })
      .join("; ");
  }

  function buildCandidatePayload(station) {
    return {
      id: station.id,
      name: station.name,
      onRoute: routeStations.some((routeStation) => routeStation.id === station.id),
      distanceKm: Number(station.distanceKm.toFixed(1)),
      status: station.status || "Unknown",
      operator: station.operator || "Unknown",
      lastVerified: station.dateLastVerified || null,
      recentlyVerified: !isStale(station.dateLastVerified),
      connectors: summarizeConnections(station.connections),
    };
  }

  function renderRecommendationMessage(text, isError = false) {
    el.aiStatus.textContent = text;
    el.aiStatus.style.color = isError ? "var(--danger)" : "";
    el.aiResult.classList.add("hidden");
    el.aiResult.innerHTML = "";
  }

  function renderRecommendationResult(station, reserveKm, reason, fallbackUsed) {
    const remainingKm = selectedVehicleRangeKm != null
      ? Math.max(0, selectedVehicleRangeKm - station.distanceKm - reserveKm)
      : null;

    const routeBased = routeStations.some((rs) => rs.id === station.id);
    const connectors = station.connections.length
      ? station.connections.slice(0, 2).map((c) => c.type).join(" / ")
      : "No connector info";

    // Update status line above the result
    el.aiStatus.textContent = fallbackUsed
      ? `Local fallback ranking${routeBased ? " (route-based)" : ""} - Gemini unavailable.`
      : `Gemini picked the best${routeBased ? " route" : " nearby"} stop.`;
    el.aiStatus.style.color = "";

    // Build pill values
    const distPill      = `${station.distanceKm.toFixed(1)} km away`;
    const backupPill    = remainingKm != null ? `${remainingKm.toFixed(0)} km backup remaining` : "backup range unknown";
    const statusPill    = station.status || "Status unknown";
    const connPill      = connectors;
    const routeLabel    = routeBased ? "On your route" : "Nearby";
    const isOperational = station.statusIsOperational !== false;

    el.aiResult.innerHTML = `
      <div class="ai-station-name">${escapeHtml(station.name)}</div>
      <div class="ai-pills">
        <span class="ai-pill ai-pill--accent">${distPill}</span>
        <span class="ai-pill ${isOperational ? "" : "ai-pill--warn"}">${escapeHtml(statusPill)}</span>
        <span class="ai-pill">${escapeHtml(connPill)}</span>
        <span class="ai-pill">${backupPill}</span>
        <span class="ai-pill">${routeLabel}</span>
      </div>
      <div class="ai-reason">${escapeHtml(reason)}</div>
      <button class="ai-view-btn" type="button">View station -&gt;</button>
    `;
    el.aiResult.classList.remove("hidden");

    el.aiResult.querySelector(".ai-view-btn")
      .addEventListener("click", () => selectStation(station));
  }

  function pickFallbackStation(candidates, reserveKm) {
    const ranked = [...candidates].sort((a, b) => {
      const aFresh = !isStale(a.dateLastVerified) ? 1 : 0;
      const bFresh = !isStale(b.dateLastVerified) ? 1 : 0;
      const aConn = a.connections.length ? 1 : 0;
      const bConn = b.connections.length ? 1 : 0;
      const aScore =
        aFresh * 100 +
        aConn * 25 -
        a.distanceKm * 10 +
        (a.statusIsOperational === true ? 15 : 0);
      const bScore =
        bFresh * 100 +
        bConn * 25 -
        b.distanceKm * 10 +
        (b.statusIsOperational === true ? 15 : 0);
      return bScore - aScore;
    });

    const station = ranked[0];
    const reason = [
      "Selected the closest live station that also looked operational.",
      !isStale(station.dateLastVerified) ? "It has a recent verification date." : "Its verification date is older or missing, so treat it cautiously.",
      station.connections.length ? "Connector details are present in the live OCM response." : "Connector details are sparse, so verify plug compatibility before leaving.",
    ].join(" ");

    return { station, reason, fallbackUsed: true, reserveKm };
  }

  function parseGeminiJson(text) {
    if (!text) return null;
    const cleaned = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    try {
      return JSON.parse(cleaned);
    } catch (_) {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start >= 0 && end > start) {
        return JSON.parse(cleaned.slice(start, end + 1));
      }
    }
    return null;
  }

  async function fetchGeminiRecommendation(promptBody) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(promptBody),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini error ${res.status}: ${text.slice(0, 200) || res.statusText}`);
    }

    return res.json();
  }

  function scheduleRecommendationRefresh(force = false) {
    if (force) {
      lastRecommendationKey = "";
    }
    clearTimeout(recommendationTimer);
    recommendationTimer = setTimeout(() => {
      refreshRecommendation().catch((err) => {
        console.error(err);
        renderRecommendationMessage(`Recommendation failed: ${err.message}`, true);
      });
    }, 300);
  }

  async function refreshRecommendation() {
    const keyParts = [
      selectedVehicleRangeKm != null ? selectedVehicleRangeKm.toFixed(1) : "no-range",
      routeStations.length ? "route" : "nearby",
      activeFilter || "all",
      getStationPoolForRecommendation()
        .slice(0, 10)
        .map((s) => `${s.id}:${s.distanceKm?.toFixed(1) ?? "na"}`)
        .join("|"),
    ];
    const requestKey = keyParts.join("::");
    if (requestKey === lastRecommendationKey) return;
    lastRecommendationKey = requestKey;

    if (!Number.isFinite(selectedVehicleRangeKm) || selectedVehicleRangeKm <= 0) {
      renderRecommendationMessage("Select a vehicle with a known electric range to rank the next stop.");
      return;
    }

    const candidates = getStationPoolForRecommendation();
    if (!candidates.length) {
      renderRecommendationMessage("No live stations are available in the current view.");
      return;
    }

    const reserveKm = computeSafeBackupKm(selectedVehicleRangeKm);
    const usableRangeKm = selectedVehicleRangeKm - reserveKm;
    if (!Number.isFinite(reserveKm) || usableRangeKm <= 0) {
      renderRecommendationMessage("The selected vehicle range is too small for a safe backup buffer.", true);
      return;
    }

    const safeCandidates = candidates.filter((s) => s.distanceKm <= usableRangeKm);
    if (!safeCandidates.length) {
      renderRecommendationMessage(
        `No station is within the safe reach window. Range: ${selectedVehicleRangeKm.toFixed(0)} km, reserve: ${reserveKm.toFixed(0)} km.`
      );
      return;
    }

    const limitedCandidates = safeCandidates.slice(0, GEMINI_RECOMMENDATION_LIMIT).map(buildCandidatePayload);
    const promptBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "Choose the single best charging station from the JSON candidate list. Only pick a station whose id appears in the candidates array. If routeContext is 'Stations along route', every candidate is already on or near the active route; prioritize staying on that route, then prefer an operational and recently verified station that is a practical next stop while respecting the safe backup buffer. Do not invent new stations, distances, connector data, or availability. Return JSON only with selectedId and reason.",
            },
            {
              text: JSON.stringify({
                vehicleRangeKm: Number(selectedVehicleRangeKm.toFixed(1)),
                safeBackupKm: Number(reserveKm.toFixed(1)),
                usableRangeKm: Number(usableRangeKm.toFixed(1)),
                routeContext: routeStations.length ? "Stations along route" : "Nearby stations",
                activeFilter: activeFilter || "all",
                candidates: limitedCandidates,
              }),
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: {
          type: "OBJECT",
          properties: {
            selectedId: { type: "INTEGER" },
            reason: { type: "STRING" },
          },
          required: ["selectedId", "reason"],
        },
      },
    };

    const currentRequestId = ++recommendationRequestId;
    recommendationInFlight = true;
    renderRecommendationMessage("Gemini is ranking the best safe station from the live set...");

    try {
      const data = await fetchGeminiRecommendation(promptBody);
      if (currentRequestId !== recommendationRequestId) return;

      const candidateText =
        data?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("") || "";
      const parsed = parseGeminiJson(candidateText);
      if (!parsed || !Number.isInteger(parsed.selectedId)) {
        throw new Error("Gemini returned an unexpected response");
      }

      const selected = safeCandidates.find((s) => s.id === parsed.selectedId) || safeCandidates[0];
      const modelReason = typeof parsed.reason === "string" && parsed.reason.trim()
        ? parsed.reason.trim()
        : "Gemini selected a safe station from the live list.";
      const reason = safeCandidates.find((s) => s.id === parsed.selectedId)
        ? modelReason
        : `${modelReason} The model chose an out-of-set station, so the safest live candidate was used instead.`;

      renderRecommendationResult(selected, reserveKm, reason, false);
    } catch (err) {
      if (currentRequestId !== recommendationRequestId) return;
      console.error(err);
      const fallback = pickFallbackStation(safeCandidates, reserveKm);
      renderRecommendationResult(fallback.station, reserveKm, fallback.reason, true);
    } finally {
      recommendationInFlight = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Load stations for a point
  // ---------------------------------------------------------------------------
  async function loadStationsAround(pos, opts = {}) {
    const { distanceKm = 15, title = "Nearby stations", setAsCurrent = true } = opts;
    el.stationList.innerHTML = `<div class="empty-state">Fetching live stations from Open Charge Map...</div>`;
    el.stationCount.textContent = "...";

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
      } else {
        routeStations = stations;
      }

      updateConnectorFilter(stations);
      renderStationList(stations, title);
      scheduleRecommendationRefresh();

      if (!stations.length) {
        showMapMessage("No verified stations found in this area (Open Charge Map).", false);
      } else {
        hideMapMessage();
      }
    } catch (err) {
      console.error(err);
      el.stationList.innerHTML = `<div class="error-state">Failed to load stations.<br>${escapeHtml(err.message)}<br><br>Check network or Open Charge Map rate limits. No fallback data is used.</div>`;
      el.stationCount.textContent = "0";
      showMapMessage("Station fetch failed - see list for details.", true);
    }
  }

  async function loadStationsAlongRoute(polylineArr, opts = {}) {
    const { distanceKm = 10, title = "Stations along route", setAsCurrent = false } = opts;
    el.stationList.innerHTML = `<div class="empty-state">Fetching live stations along route from Open Charge Map...</div>`;
    el.stationCount.textContent = "...";

    try {
      const encoded = encodePolyline(polylineArr);
      const params = new URLSearchParams({
        output: "json",
        countrycode: "IN",
        polyline: encoded,
        distance: String(distanceKm),
        distanceunit: "KM",
        maxresults: "100",
        compact: "true",
        verbose: "false",
      });
      if (OCM_API_KEY) params.set("key", OCM_API_KEY);

      const url = `${OCM_BASE}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Open Charge Map error ${res.status}: ${text.slice(0, 120) || res.statusText}`);
      }
      const raw = await res.json();

      const stations = (raw || [])
        .map((p) => normalizeStation(p, userPos))
        .filter(Boolean)
        .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

      clearStationMarkers();
      stations.forEach(addStationMarker);

      if (setAsCurrent) {
        currentStations = stations;
        routeStations = [];
      } else {
        routeStations = stations;
      }

      updateConnectorFilter(stations);
      renderStationList(stations, title);
      scheduleRecommendationRefresh();

      if (!stations.length) {
        showMapMessage("No verified stations found along this route (Open Charge Map).", false);
      } else {
        hideMapMessage();
      }
    } catch (err) {
      console.error(err);
      el.stationList.innerHTML = `<div class="error-state">Failed to load stations along route.<br>${escapeHtml(err.message)}</div>`;
      el.stationCount.textContent = "0";
      showMapMessage("Station fetch failed - see list for details.", true);
    }
  }

  function encodePolyline(coordinates) {
    let factor = 1e5;
    let lastLat = 0;
    let lastLng = 0;
    let result = '';
    for (let i = 0; i < coordinates.length; i++) {
      let lat = Math.round(coordinates[i].lat * factor);
      let lng = Math.round(coordinates[i].lng * factor);
      let dLat = lat - lastLat;
      let dLng = lng - lastLng;
      lastLat = lat;
      lastLng = lng;
      result += encodeValue(dLat) + encodeValue(dLng);
    }
    return result;

    function encodeValue(value) {
      value = value < 0 ? ~(value << 1) : (value << 1);
      let res = '';
      while (value >= 0x20) {
        res += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
        value >>= 5;
      }
      res += String.fromCharCode(value + 63);
      return res;
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Geocoding (MapTiler) + Routing (OSRM)
  // ---------------------------------------------------------------------------
  async function geocode(query) {
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&country=in&limit=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`MapTiler Geocoding Error: ${res.status}`);
    const data = await res.json();
    
    // Map MapTiler GeoJSON features to the format expected by the app
    return data.features.map((f) => ({
      display_name: f.place_name,
      lat: f.center[1],
      lon: f.center[0],
    }));
  }

  async function reverseGeocode(pos) {
    const url = `https://api.maptiler.com/geocoding/${pos.lng},${pos.lat}.json?key=${MAPTILER_KEY}&language=en&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`MapTiler Reverse Geocoding Error: ${res.status}`);
    const data = await res.json();
    const placeName = data.features?.[0]?.place_name || data.features?.[0]?.text;
    if (!placeName) throw new Error("No place name returned");
    return placeName
      .split(",")
      .slice(0, 2)
      .join(",")
      .trim();
  }

  async function fetchRoute(origin, dest) {
    const coords = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`;
    const url = `${OSRM}/${coords}?geometries=geojson&overview=full&steps=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    const route = data.routes && data.routes[0];
    if (!route) throw new Error("No route found");
    return {
      polyline: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
      steps: route.legs
        .flatMap((leg) => leg.steps || [])
        .filter((step) => step.maneuver?.type !== "notification"),
    };
  }

  function formatStepDistance(meters) {
    if (!Number.isFinite(meters)) return "";
    return meters < 1000
      ? `${Math.max(1, Math.round(meters))} m`
      : `${(meters / 1000).toFixed(1)} km`;
  }

  function formatStepInstruction(step) {
    const maneuver = step.maneuver || {};
    const name = step.name || "the road";
    const modifier = maneuver.modifier ? ` ${maneuver.modifier}` : "";
    const type = maneuver.type;

    if (type === "depart") return `Start on ${name}`;
    if (type === "arrive") return "Arrive at your destination";
    if (type === "roundabout" || type === "rotary") {
      const exit = maneuver.exit ? `, take exit ${maneuver.exit}` : "";
      return `Enter the roundabout${exit}${name !== "the road" ? ` onto ${name}` : ""}`;
    }
    if (type === "merge") return `Merge${modifier} onto ${name}`;
    if (type === "on ramp" || type === "off ramp") return `${type === "on ramp" ? "Take the ramp" : "Exit the ramp"}${modifier} onto ${name}`;
    if (type === "fork") return `Keep${modifier} at the fork onto ${name}`;
    if (type === "new name") return `Continue onto ${name}`;
    if (type === "end of road") return `At the end of the road, turn${modifier} onto ${name}`;
    if (type === "turn") return `Turn${modifier} onto ${name}`;
    return `Continue${name !== "the road" ? ` on ${name}` : ""}`;
  }

  function renderRouteInstructions(steps) {
    const visibleSteps = steps.filter((step) => step.maneuver?.type !== "notification");
    el.instructionList.innerHTML = visibleSteps
      .map((step) => `
        <li class="instruction-item">
          <span class="instruction-number">${visibleSteps.indexOf(step) + 1}</span>
          <span class="instruction-copy">${escapeHtml(formatStepInstruction(step))}</span>
          <span class="instruction-distance">${formatStepDistance(step.distance)}</span>
        </li>`)
      .join("");
  }

  function startJourney() {
    if (!currentRoute) return;
    renderRouteInstructions(currentRoute.steps);
    el.routeInstructions.classList.remove("hidden");
    el.startJourney.textContent = "Journey started";
    el.startJourney.disabled = true;
    liveStepIndex = Math.max(
      0,
      currentRoute.steps.findIndex((step) => !["depart", "notification"].includes(step.maneuver?.type))
    );
    el.liveNavigation.classList.remove("hidden");
    const initialBearing = getNavigationBearing(userPos);
    map.flyTo({
      center: [userPos.lng, userPos.lat],
      zoom: NAVIGATION_ZOOM,
      bearing: initialBearing,
      duration: 900,
      essential: true,
    });
    updateLiveInstruction(userPos);

    if (navigator.geolocation && navigationWatchId == null) {
      navigationWatchId = navigator.geolocation.watchPosition(
        (position) => {
          userPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          if (userMarker) userMarker.setLngLat([userPos.lng, userPos.lat]);
          map.easeTo({
            center: [userPos.lng, userPos.lat],
            zoom: NAVIGATION_ZOOM,
            bearing: getNavigationBearing(userPos),
            duration: 500,
            essential: true,
          });
          updateLiveInstruction(userPos);
        },
        (error) => console.warn("Live navigation location update failed:", error.message),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }
  }

  function getNavigationBearing(pos) {
    const step = currentRoute?.steps[liveStepIndex];
    const location = step?.maneuver?.location;
    if (location) {
      const target = { lat: location[1], lng: location[0] };
      if (haversineKm(pos, target) > 0.03) return bearingBetween(pos, target);
    }

    const nextPoint = currentRoute?.polyline?.[1];
    return nextPoint ? bearingBetween(pos, nextPoint) : 0;
  }

  function updateLiveInstruction(pos) {
    if (!currentRoute || !pos || !currentRoute.steps.length) return;

    while (liveStepIndex < currentRoute.steps.length - 1) {
      const step = currentRoute.steps[liveStepIndex];
      const location = step.maneuver?.location;
      if (!location) break;
      const distanceKm = haversineKm(pos, { lat: location[1], lng: location[0] });
      if (distanceKm > 0.04) break;
      liveStepIndex += 1;
    }

    const step = currentRoute.steps[liveStepIndex];
    const location = step.maneuver?.location;
    const distanceMeters = location
      ? haversineKm(pos, { lat: location[1], lng: location[0] }) * 1000
      : step.distance;

    el.liveInstruction.textContent = formatStepInstruction(step);
    el.liveDistance.textContent = step.maneuver?.type === "arrive"
      ? "You have arrived"
      : distanceMeters != null
        ? `In ${formatStepDistance(distanceMeters)}`
        : "Follow the route";

    if (userMarker) userMarker.setRotation(getNavigationBearing(pos));
  }

  function drawRoute(polyline) {
    if (!map.getSource(routeSourceId)) {
      map.addSource(routeSourceId, {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
      });
      // Casing (dark outline for contrast on light map areas)
      map.addLayer({
        id: "route-layer-casing",
        type: "line",
        source: routeSourceId,
        paint: {
          "line-color": "rgba(0,0,0,0.35)",
          "line-width": 7,
          "line-opacity": 0.6,
        },
      });
      // Accent green route line
      map.addLayer({
        id: "route-layer",
        type: "line",
        source: routeSourceId,
        paint: {
          "line-color": "#00C853",
          "line-width": 4.5,
          "line-opacity": 0.95,
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
    if (navigationWatchId != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(navigationWatchId);
      navigationWatchId = null;
    }
    destCoords = null;
    currentRoute = null;
    liveStepIndex = 0;
    routeStations = [];
    if (map.getSource(routeSourceId)) {
      map.getSource(routeSourceId).setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [] },
        properties: {},
      });
    }
    el.routeInfo.classList.add("hidden");
    el.routeInstructions.classList.add("hidden");
    el.instructionList.innerHTML = "";
    el.startJourney.textContent = "Start journey";
    el.startJourney.disabled = true;
    el.liveNavigation.classList.add("hidden");
    el.destInput.value = "";
    // reload nearby stations around user
    if (userPos) {
      loadStationsAround(userPos, { title: "Nearby stations", setAsCurrent: true });
    }
  }

  async function onDestinationSelected(item) {
    const dest = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };
    destCoords = dest;
    if (navigationWatchId != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(navigationWatchId);
      navigationWatchId = null;
    }
    el.suggestions.classList.add("hidden");
    el.destInput.value = item.display_name.split(",").slice(0, 3).join(",");

    if (!userPos) {
      showMapMessage("User location not available - cannot compute route.", true);
      return;
    }

    el.routeInfo.classList.remove("hidden");
    currentRoute = null;
    el.routeInstructions.classList.add("hidden");
    el.instructionList.innerHTML = "";
    el.startJourney.textContent = "Start journey";
    el.startJourney.disabled = true;
    el.liveNavigation.classList.add("hidden");
    el.routeDistance.textContent = "...";
    el.routeDuration.textContent = "...";
    el.routeDistance.setAttribute("data-label", "Distance");
    el.routeDuration.setAttribute("data-label", "Duration");

    try {
      const route = await fetchRoute(userPos, dest);
      currentRoute = route;
      drawRoute(route.polyline);
      el.routeDistance.textContent = `${route.distanceKm.toFixed(1)} km`;
      el.routeDuration.textContent = `${Math.round(route.durationMin)} min`;
      el.startJourney.disabled = false;

      // Fit bounds
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([userPos.lng, userPos.lat]);
      bounds.extend([dest.lng, dest.lat]);
      route.polyline.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 60, duration: 1000 });

      // Fetch stations along the route using OCM polyline support
      // Simplify polyline to max ~200 points to avoid 414 URI Too Long errors
      let polylineForOCM = route.polyline;
      if (polylineForOCM.length > 200) {
        const step = Math.ceil(polylineForOCM.length / 200);
        polylineForOCM = polylineForOCM.filter((_, i) => i % step === 0 || i === polylineForOCM.length - 1);
      }

      await loadStationsAlongRoute(polylineForOCM, {
        distanceKm: 10,
        title: "Stations along route",
        setAsCurrent: false,
      });
    } catch (err) {
      console.error(err);
      showMapMessage(`Routing failed: ${err.message}`, true);
      el.routeDistance.textContent = "-";
      el.routeDuration.textContent = "-";
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
      // debounce ~400ms to respect Nominatim 1 req/s
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
      if (!el.destInput.contains(e.target) && !el.suggestions.contains(e.target)) {
        el.suggestions.classList.add("hidden");
      }
    });

    el.clearRoute.addEventListener("click", clearRoute);
    el.startJourney.addEventListener("click", startJourney);
  }

  // ---------------------------------------------------------------------------
  // Filter
  // ---------------------------------------------------------------------------
  function setupFilter() {
    el.connectorFilter.addEventListener("change", () => {
      activeFilter = el.connectorFilter.value;
      const list = routeStations.length ? routeStations : currentStations;
      const title = routeStations.length
        ? "Stations near destination"
        : "Nearby stations";
      renderStationList(list, title);
      scheduleRecommendationRefresh();
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Vehicle Selection Data (CSV)
  // ---------------------------------------------------------------------------
  let evDataset = [];
  
  async function loadEVDataset() {
    try {
      const response = await fetch('./India_EV_Dataset.csv');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          evDataset = results.data;
          
          const models = Array.from(
            new Set(evDataset.map((row) => row.Model?.trim()).filter(Boolean))
          ).sort();
          el.vehicleModel.innerHTML = '<option value="">Select model</option>' +
            models.map((model) => `<option value="${escapeHtml(model)}">${escapeHtml(model)}</option>`).join('');
          el.vehicleModel.disabled = false;
        }
      });
    } catch (err) {
      console.error("Failed to load EV dataset:", err);
      el.vehicleModel.innerHTML = '<option value="">Failed to load data</option>';
    }
  }
  
  function setupVehicleSelection() {
    el.vehicleModel.addEventListener("change", (e) => {
      const selectedModel = e.target.value;
      
      if (!selectedModel) {
        el.vehicleInfo.classList.add("hidden");
        selectedVehicleRangeKm = null;
        selectedVehicleLabel = "";
        scheduleRecommendationRefresh();
        return;
      }
      
      const row = evDataset.find(r => r.Model?.trim() === selectedModel);
      
      if (row) {
        // Use "Electric Range" column
        const range = row['Electric Range'];
        const parsedRange = Number.parseFloat(range);
        selectedVehicleRangeKm = Number.isFinite(parsedRange) && parsedRange > 0 ? parsedRange : null;
        selectedVehicleLabel = selectedModel;
        el.vehicleRange.textContent = selectedVehicleRangeKm != null ? `${selectedVehicleRangeKm} km` : 'Unknown';
        
        // CAFV Eligibility
        let cafv = row['Clean Alternative Fuel Vehicle (CAFV) Eligibility'] || 'Unknown';
        if (cafv.includes("Not Eligible")) cafv = "Not Eligible";
        else if (cafv.includes("Eligible")) cafv = "Eligible";
        el.vehicleCafv.textContent = cafv;
        
        el.vehicleInfo.classList.remove("hidden");
        scheduleRecommendationRefresh();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Mobile panel FAB toggle
  // ---------------------------------------------------------------------------
  function setupMobileFab() {
    const fab = el.panelFab;
    const panel = el.sidePanel;
    if (!fab || !panel) return;

    const iconOpen  = fab.querySelector(".fab-icon--open");
    const iconClose = fab.querySelector(".fab-icon--close");

    function openPanel() {
      panel.classList.add("panel-open");
      fab.setAttribute("aria-expanded", "true");
      if (iconOpen)  iconOpen.classList.add("hidden");
      if (iconClose) iconClose.classList.remove("hidden");
    }

    function closePanel() {
      panel.classList.remove("panel-open");
      fab.setAttribute("aria-expanded", "false");
      if (iconOpen)  iconOpen.classList.remove("hidden");
      if (iconClose) iconClose.classList.add("hidden");
    }

    fab.addEventListener("click", () => {
      panel.classList.contains("panel-open") ? closePanel() : openPanel();
    });

    // Tapping the map closes the panel on mobile
    document.getElementById("map").addEventListener("click", () => {
      if (window.innerWidth < 900) closePanel();
    });
  }

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------
  async function start() {
    setLocationStatus("Locating...");

    const { pos, fallback, reason } = await getUserLocation();
    userPos = pos;
    isFallbackLocation = fallback;

    initMap(pos);
    placeUserMarker(pos, fallback);

    if (fallback) {
      setLocationStatus("Default: Bengaluru", "warn");
      showMapMessage(
        `Geolocation unavailable (${reason || "permission denied"}). Map centered on Bengaluru as a labeled default - not your real GPS position.`,
        false
      );
    } else {
      setLocationStatus("Finding location...", "ok");
      reverseGeocode(pos)
        .then((placeName) => setLocationStatus(placeName || "Current location", "ok"))
        .catch((err) => {
          console.warn("Reverse geocoding failed:", err);
          setLocationStatus("Current location", "ok");
        });
    }

    setupSearch();
    setupFilter();
    setupVehicleSelection();
    setupMobileFab();
    setupRecenterButton();

    el.aiRefresh.addEventListener("click", () => {
      scheduleRecommendationRefresh(true);
    });

    // Start loading dataset asynchronously
    loadEVDataset();

    el.closeDrawer.addEventListener("click", () => {
      el.detailDrawer.classList.add("hidden");
      selectedId = null;
    });

    // Load real nearby stations
    await loadStationsAround(pos, { title: "Nearby stations", setAsCurrent: true });
  }

  start().catch((err) => {
    console.error(err);
    setLocationStatus("Error", "err");
    showMapMessage("Failed to start: " + err.message, true);
  });
})();

