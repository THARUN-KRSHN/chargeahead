# ChargeAhead — Real Working Model

A small, self-contained **live-data** proof of the core ChargeAhead loop:

1. Real user location on a real map  
2. Real nearby EV charging stations from Open Charge Map  
3. Real place search (Nominatim) + real road routing (OSRM) + stations near the destination  

**No mocks. No hardcoded stations. No invented availability, queue, or confidence scores.**

---

## How to run

No build step required.

### Option A — Open directly
```bash
# Just open the file in a modern browser
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

> Note: Some browsers restrict `file://` fetches. If geolocation or APIs fail, use Option B.

### Option B — Local static server (recommended)
```bash
# From this folder:
npx serve .
# or
python3 -m http.server 8080
```
Then open http://localhost:3000 (or 8080).

---

## Optional: Open Charge Map API key

The app works without a key at low volume. If you hit rate limits:

1. Register a free key at https://openchargemap.org  
2. Open `app.js` and set:
   ```js
   const OCM_API_KEY = "your-key-here";
   ```

No other keys are required. All services used are free-tier / public:

| Service            | Purpose                  | Auth                          |
|--------------------|--------------------------|-------------------------------|
| Browser Geolocation| User GPS                 | Permission prompt             |
| OpenStreetMap tiles| Map background           | None                          |
| Open Charge Map    | Charging stations        | Optional free key             |
| Nominatim          | Place search / geocoding | User-Agent required (sent)    |
| OSRM public        | Driving routes           | None                          |

---

## What is real (live data)

- **User location** — `navigator.geolocation.getCurrentPosition`. If denied or unavailable, the map centers on a fixed Bengaluru coordinate and the UI clearly labels it as a **default location**, not real GPS.
- **Map** — MapLibre GL + free OSM raster tiles.
- **Stations** — Every marker and list item comes from a live Open Charge Map `/v3/poi/` response at runtime. No seeded or fallback station list.
- **Station details** — Only fields present in the OCM response are shown: Title, address, operator, StatusType, DateLastVerified, Connections (type + power kW).  
  Live availability, queue length, and any “confidence %” are **not** invented; the UI states that OCM does not provide them.
- **Distance sorting** — Real Haversine distance from the user’s actual (or labeled-fallback) position.
- **Destination search** — Nominatim with India bias + 400 ms debounce (respects 1 req/s).
- **Road route** — OSRM public instance returns real geometry, distance (km) and duration (min). Polyline is drawn on the map.
- **Stations near destination** — Fresh OCM query around the chosen destination (simple radius). Not claimed as an “optimal stop planner”.

### Optional feature included
**Connector-type filter** — Dropdown options are built **only** from the connector types that appear in the current live OCM result set. No hardcoded connector list.

**Data-freshness badge** — If `DateLastVerified` is older than 90 days (or missing), a small “not recently verified” label is shown. This is a plain date-based flag, not a confidence score or percentage.

---

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
