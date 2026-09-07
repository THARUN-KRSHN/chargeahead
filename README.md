# ChargeAhead ⚡
> **Predictive EV Charging Hub & Smart Routing Intelligence for India**

ChargeAhead is a full-stack, production-grade EV charging ecosystem delivering **True Charging Availability™**, dynamic congestion-aware rerouting, real road routing, physics-driven range estimation, and unified reservation with dedicated walk-up bays.

---

## 🚀 Key Highlights & Working Model Features

- **🌐 100% Free Public Stack**: Zero API key dependencies for routing or maps:
  - **Native Browser Geolocation**: Real GPS positioning with fallback.
  - **Nominatim (OpenStreetMap)**: Free live place search & geocoding.
  - **OSRM (Open Source Routing Machine)**: Real road geometries and travel time calculation.
  - **OpenStreetMap Tiles & MapLibre GL**: Responsive vector map rendering.
- **🗺️ Color-Coded Station Map**:
  - Green (Available), Amber (Busy), Grey (Offline) with live status legend.
  - Promoted "Sponsored" placement badges for operator monetization.
- **⏱️ Reservation Flow & Walk-Up Bays**:
  - 1–2 charging bays explicitly reserved for walk-up/drop-in drivers (unreservable via app).
  - 5-minute countdown slot hold timer preventing concurrency conflicts.
  - One-tap `Pay ₹{amount}` unified checkout action.
- **🧾 Instant Tax Invoice & Check-In Pass**:
  - Real calculated energy kWh, base cost, and 18% GST breakdown.
  - Check-in pass QR code for immediate station arrival scanning.
- **⚡ Physics-Driven EV Range Estimator**:
  - Real formula adjusting for Battery SoC%, temperature/weather penalties, and elevation gradients.
- **🔄 Algorithm-Driven Congestion Reroute**:
  - Automatic alternative station suggestion when a stop experiences high queue times (>15m) or full bay exhaustion.
- **👥 Dynamic Community Trust Badge**:
  - One-tap community problem reporting (`working`, `busy`, `broken`, `blocked`, `offline`).
  - Dynamic score re-calculation updating station reliability in real time.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.3.4 (App Router, Turbopack)
- **Styling**: TailwindCSS & Vanilla CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Maps**: MapLibre GL + OSM raster tiles
- **Icons**: Lucide React
- **Notifications**: Sonner

---

## 📁 Project Architecture

```
chargeahead/
├── app/
│   ├── (app)/app/
│   │   ├── home/                  # Station discovery map & list view + Range estimator
│   │   ├── plan/                  # AI Trip Planner with Nominatim search
│   │   │   └── route/             # OSRM road route calculation & stops recommendation
│   │   ├── station/[id]/          # Station details & dynamic community report badge
│   │   │   ├── reserve/           # Slot reservation, walk-up bay locking & hold timer
│   │   │   └── receipt/           # Tax invoice & Check-in QR pass
│   │   ├── trip/active/           # Real GPS navigation & algorithm-driven rerouting
│   │   ├── notifications/         # Real-time alert feed
│   │   └── wallet/                # Payment methods & transaction history
│   └── operator/                  # Operator management & station control portal
├── components/shared/
│   ├── MapComponent.tsx           # Status-colored markers, route polyline & legend
│   ├── StationCard.tsx            # Left-border status accent & sponsored badge
│   ├── RangeEstimator.tsx         # Battery SoC, weather & terrain range slider
│   └── ConfidenceScore.tsx        # True Availability reliability badge
├── hooks/
│   ├── useGeolocation.ts          # Real GPS watcher & fallback
│   └── useMockLiveUpdates.ts      # Congestion check & smart rerouting hook
├── lib/
│   ├── mock/api.ts                # OSRM routing, Nominatim, storage persistence
│   ├── mock/stations.ts           # 20 curated Indian EV stations with bay labels
│   └── store/tripStore.ts         # Active trip & OSRM polyline store
└── ChargeAhead_TEAM_06.pdf        # Presentation Deck
```

---

## 🏁 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
```

---

## 🧪 Key Demo Flows to Test

1. **Live GPS & Nearest Stations**:
   - Navigate to `/app/home`. Allow location access to view stations sorted by distance from your current position.
2. **Dynamic Range Estimator**:
   - Switch to **List** view on `/app/home`. Toggle weather and terrain settings to see estimated range adapt dynamically.
3. **Trip Planning with Road Routes**:
   - Go to `/app/plan`, search for "Mysuru" or any city. Click "Plan Journey" to see the full OSRM road polyline rendered on the map.
4. **Reservation & Dedicated Walk-Up Bays**:
   - Tap any station, click "Reserve Slot". Walk-up bays are grayed out with a purple badge. Continue to Step 2 to observe the 5-minute hold timer and pay to generate the check-in receipt.
5. **Community Badge Recalculation**:
   - On a station details page, tap "Report issue" in the Community tab and select a report type to immediately see the reliability score update.

---

## 📄 Submission Materials
- **Presentation Deck**: [`ChargeAhead_TEAM_06.pdf`](./ChargeAhead_TEAM_06.pdf)
- **Detailed Implementation Progress**: [`progress.md`](./progress.md)
