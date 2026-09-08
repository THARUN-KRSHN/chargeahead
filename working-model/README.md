# ChargeAhead — Real Working Model

A small, self-contained **live-data** proof of the core ChargeAhead loop:

1. Real user location on a real map  
2. Real nearby EV charging stations from Open Charge Map  
3. Real place search (Nominatim) + real road routing (OSRM) + stations **along the route**
4. Battery SoC + full-range inputs → remaining range, reachable stations, and a simple charge-preserving plan

**No mocks. No hardcoded stations. No invented availability, queue, or confidence scores.**

---

## How to run (Vite)

This subproject uses **Vite** so `.env` keys can be inlined for the browser. From `working-model/`:

```bash
cp .env.example .env   # then fill any free keys you have
npm install
npm run dev            # opens Vite dev server (usually http://localhost:5173)
```

Production-style static build:

```bash
npm run build
npm run preview
```

### Environment variables (all optional)

| Variable | Service | If blank |
|----------|---------|----------|
| `VITE_OCM_API_KEY` | Open Charge Map | Works keyless at low volume |
| `VITE_GROQ_API_KEY` | Groq AI plan text | AI box skipped; deterministic plan still works |
| `VITE_MAPTILER_API_KEY` | MapTiler map + geocoding | Map falls back to OSM raster tiles; search falls back to Nominatim |

Free key sign-ups: [openchargemap.org](https://openchargemap.org), [console.groq.com](https://console.groq.com), [maptiler.com](https://maptiler.com). Check each provider’s current free-tier limits before a long demo.

**Do not commit `.env`** — only `.env.example` is in the repo. Client-side keys are fine for a judged demo, not for production.

### Services used

| Service | Purpose | Auth |
|---------|---------|------|
| Browser Geolocation | User GPS | Permission prompt |
| MapTiler (optional) | Vector map style + place search | Free key |
| OpenStreetMap tiles | Map fallback | None |
| Nominatim | Place search fallback | User-Agent |
| Open Charge Map | Charging stations | Optional free key |
| OSRM public | Driving routes | None |
| Groq (optional) | Plan narration | Free key |

---

## What is real (live data)

- **User location** — `navigator.geolocation.getCurrentPosition`. If denied or unavailable, the map centers on a fixed Bengaluru coordinate and the UI clearly labels it as a **default location**, not real GPS.
- **Map** — MapLibre GL with MapTiler streets style when `VITE_MAPTILER_API_KEY` is set; otherwise free OSM raster tiles.
- **Stations** — Every marker and list item comes from a live Open Charge Map `/v3/poi/` response at runtime. No seeded or fallback station list.
- **Station details** — Only fields present in the OCM response are shown: Title, address, operator, StatusType, DateLastVerified, Connections (type + power kW).  
  Live availability, queue length, and any “confidence %” are **not** invented; the UI states that OCM does not provide them.
- **Distance sorting** — Real Haversine distance from the user’s actual (or labeled-fallback) position.
- **Destination search** — MapTiler Geocoding (India) when keyed; otherwise Nominatim with 400 ms debounce.
- **Road route** — OSRM public instance returns real geometry, distance (km) and duration (min). Polyline is drawn on the map.
- **Stations along the route** — After routing, several points are sampled along the OSRM polyline. Open Charge Map is queried near each sample (corridor radius ~8 km). Results are merged, de-duplicated, filtered to stations actually near the path, and shown as “Stations along this route”. This is a simple real-data corridor filter — not claimed as an optimal stop-planning algorithm.

### Optional feature included
**Connector-type filter** — Dropdown options are built **only** from the connector types that appear in the current live OCM result set. No hardcoded connector list.

**Data-freshness badge** — If `DateLastVerified` is older than 90 days (or missing), a small “not recently verified” label is shown. This is a plain date-based flag, not a confidence score or percentage.

---


### Battery range & charge plan (user inputs only)

- At start, enter **Battery SoC %** and **Full range at 100% (km)** (from your vehicle’s real rated range).
- Remaining range = full range × (SoC / 100). A 15% reserve is kept for planning.
- Stations are tagged **in range** / **beyond range** using that value.
- Checkbox: “Show only stations within remaining range”.
- **Filter by charge type**: connector dropdown built only from live OCM results.
- After routing, a **Charge plan** box compares real OSRM trip distance to your remaining range and suggests the furthest reachable live station along the corridor when a stop is needed.


### Route-aware stop selection

- Each corridor station stores **detourKm** (how far off the OSRM path) and **routeProgressKm** (how far into the trip along the path).
- Charge-plan recommendations prefer stations with detour ≤ 5 km and the **highest route progress still within usable range** — not the station closest to your start by straight line.
- Station list is ordered by route progress (order you’d pass them) and shows “km into trip” + “km off route” labels.


### Safety reserve & AI plan

- **Safety reserve %** (default 20%) is user-editable. A stop is recommended only when trip distance + reserve exceeds remaining range. Comfortable short trips show **No charging stop needed** with spare km/% — no forced end-of-trip stop.
- Optional **Groq** narration (`GROQ_API_KEY` in `app.js`, free at console.groq.com). Deterministic plan always shows first; AI box updates when available. Station IDs from the model are validated against the real OCM list; factual fields never come from the LLM.
- **Client-side Groq key exposure** is acceptable for a judged demo only — not production-ready.


### Voice briefing & traffic-light markers

- **Play voice briefing** reads the current plan (Groq summary when available, otherwise the deterministic plan + comfort tips). Uses Groq PlayAI TTS when `VITE_GROQ_API_KEY` is set; otherwise the browser’s built-in speech synthesis.
- Map markers and list dots use **green / yellow / red** tiers from real `detourKm` / `routeProgressKm` / range — not invented occupancy.
- Comfort tips (tea / meal / toilet) are suggested from **real trip duration** and paired with required charge stops when present.

## Explicit non-features (intentionally omitted)

- Reservations, payments, wallet, login  
- Fake availability / queue / trust scores  
- Hardcoded or “demo mode” station lists  
- Any paid API or usage-billed service  

---

## Known limitations

- **Sparse coverage** — Open Charge Map has limited density outside major Indian cities. Empty results are shown honestly (“No verified stations found in this area”).
- **Rate limits** — Anonymous OCM and Nominatim have fair-use limits. Use a free OCM key and keep search debounced.
- **No live occupancy** — OCM does not publish real-time “ports free right now”. The model surfaces operational status and last-verified date only.
- **CORS / file protocol** — Prefer a local static server if the browser blocks cross-origin requests from `file://`.

---

## Files

```
working-model/
├── index.html   # UI shell
├── style.css    # Styles
├── app.js       # All logic (geolocation, OCM, Nominatim, OSRM, map)
└── README.md    # This file
```

Open `index.html` (or serve the folder) and allow location access to begin.
