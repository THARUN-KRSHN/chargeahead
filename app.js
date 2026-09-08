/**
 * ChargeAhead — Real Working Model
 * Live data only: Browser Geolocation, Open Charge Map, Nominatim, OSRM, OSM tiles.
 * No mocks, no hardcoded stations, no invented availability/queue/confidence numbers.
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Config — put a free OCM key here if you hit rate limits
  // Register at https://openchargemap.org (free)
  // ---------------------------------------------------------------------------
  const OCM_API_KEY = ""; // optional; leave empty for anonymous (low volume)

  const OCM_BASE = "https://api.openchargemap.io/v3/poi/";
  const NOMINATIM = "https://nominatim.openstreetmap.org/search";
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
  let searchTimeout = null;

  // ---------------------------------------------------------------------------
  // DOM refs
  // ---------------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const el = {
    locationStatus: $("location-status"),
    destInput: $("dest-input"),
    suggestions: $("suggestions"),
    routeInfo: $("route-info"),
    routeDistance: $("route-distance"),
    routeDuration: $("route-duration"),
    clearRoute: $("clear-route"),
    connectorFilter: $("connector-filter"),
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

  // ---------------------------------------------------------------------------
  // 1. Map + Geolocation
  // ---------------------------------------------------------------------------
  function initMap(center) {
    map = new maplibregl.Map({
      container: "map",
      style: {
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
      },
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

    const el = document.createElement("div");
    el.style.cssText = `
      width: 18px; height: 18px; border-radius: 50%;
      background: ${isFallback ? "#f59e0b" : "#3b82f6"};
      border: 3px solid #fff;
      box-shadow: 0 0 0 6px ${isFallback ? "rgba(245,158,11,0.25)" : "rgba(59,130,246,0.3)"};
    `;
    el.title = isFallback ? "Default location (Bengaluru) — geolocation denied or unavailable" : "Your location";

    userMarker = new maplibregl.Marker({ element: el })
      .setLngLat([pos.lng, pos.lat])
      .addTo(map);

    map.flyTo({ center: [pos.lng, pos.lat], zoom: 12, duration: 1000 });
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
    if (isNaN(d.getTime())) return true;
    const days = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    return days > 90;
  }

  // ---------------------------------------------------------------------------
  // Markers & list
  // ---------------------------------------------------------------------------
  function clearStationMarkers() {
    stationMarkers.forEach((m) => m.remove());
    stationMarkers = [];
  }

  function addStationMarker(station) {
    const color = station.statusIsOperational === false ? "#6b7280" : "#22c55e";
    const el = document.createElement("div");
    el.style.cssText = `
      width: 28px; height: 28px; border-radius: 50%;
      background: ${color};
      border: 2px solid #fff;
      box-shadow: 0 0 8px ${color}80;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    `;
    el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#0f1419"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
    el.title = station.name;

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([station.coords.lng, station.coords.lat])
      .addTo(map);

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      selectStation(station);
    });

    stationMarkers.push(marker);
  }

  function renderStationList(stations, title) {
    el.listTitle.textContent = title || "Nearby stations";
    el.stationCount.textContent = String(stations.length);

    if (!stations.length) {
      el.stationList.innerHTML = `<div class="empty-state">No verified stations found in this area.<br>Open Charge Map may have sparse coverage outside major cities.</div>`;
      return;
    }

    const filtered = activeFilter
      ? stations.filter((s) =>
          s.connections.some((c) => c.type === activeFilter)
        )
      : stations;

    if (!filtered.length) {
      el.stationList.innerHTML = `<div class="empty-state">No stations match the selected connector filter.</div>`;
      return;
    }

    el.stationList.innerHTML = filtered
      .map((s) => {
        const dist =
          s.distanceKm != null ? `${s.distanceKm.toFixed(1)} km` : "";
        const stale = isStale(s.dateLastVerified)
          ? `<span class="freshness">not recently verified</span>`
          : "";
        const status = s.status || "Status unknown";
        return `
          <div class="station-card ${selectedId === s.id ? "active" : ""}" data-id="${s.id}">
            <div class="name">${escapeHtml(s.name)}</div>
            <div class="meta">
              ${dist ? `<span class="dist">${dist}</span>` : ""}
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
      ? ` <span class="freshness">not recently verified</span>`
      : "";

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
          <label>Distance</label>
          <span>${s.distanceKm != null ? s.distanceKm.toFixed(2) + " km" : "—"}</span>
        </div>
        <div class="detail-item">
          <label>Last verified</label>
          <span>${verified}${staleNote}</span>
        </div>
      </div>
      <div class="detail-item">
        <label>Connectors (from OCM)</label>
        ${connHtml}
      </div>
      <p class="no-data" style="margin-top:0.75rem">
        Live availability, queue times and confidence scores are not provided by Open Charge Map and are intentionally not invented here.
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

  // ---------------------------------------------------------------------------
  // Load stations for a point
  // ---------------------------------------------------------------------------
  async function loadStationsAround(pos, opts = {}) {
    const { distanceKm = 15, title = "Nearby stations", setAsCurrent = true } = opts;
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
      } else {
        routeStations = stations;
      }

      updateConnectorFilter(stations);
      renderStationList(stations, title);

      if (!stations.length) {
        showMapMessage("No verified stations found in this area (Open Charge Map).", false);
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
  // 3. Geocoding (Nominatim) + Routing (OSRM)
  // ---------------------------------------------------------------------------
  async function geocode(query) {
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
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
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
    if (map.getSource(routeSourceId)) {
      map.getSource(routeSourceId).setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [] },
        properties: {},
      });
    }
    el.routeInfo.classList.add("hidden");
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

    try {
      const route = await fetchRoute(userPos, dest);
      drawRoute(route.polyline);
      el.routeDistance.textContent = `${route.distanceKm.toFixed(1)} km`;
      el.routeDuration.textContent = `${Math.round(route.durationMin)} min`;

      // Fit bounds
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([userPos.lng, userPos.lat]);
      bounds.extend([dest.lng, dest.lat]);
      route.polyline.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 60, duration: 1000 });

      // Re-query stations near destination (simple radius, not "optimal" algorithm)
      await loadStationsAround(dest, {
        distanceKm: 12,
        title: "Stations near destination",
        setAsCurrent: false,
      });
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
    });
  }

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------
  async function start() {
    setLocationStatus("Locating…");

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

    setupSearch();
    setupFilter();
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
