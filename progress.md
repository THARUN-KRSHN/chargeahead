# ChargeAhead — Working Model Progress Tracker

## Project Overview
**ChargeAhead** is an EV charging reservation, route-planning, and True Availability intelligence platform designed for the Indian EV ecosystem. Built with Next.js 16 (Turbopack), TailwindCSS, MapLibre GL, and Zustand.

---

## Deliverables & Status Summary

| # | Deliverable | Status | Notes |
|---|---|---|---|
| 1 | **Working Model** | ✅ Completed & Verified | Zero build errors (`next build` passes cleanly, 32 static routes generated) |
| 2 | **Presentation Deck (PPT/PDF)** | ✅ Available | `ChargeAhead_TEAM_06.pdf` in project root |
| 3 | **Architecture & API Documentation** | ✅ Updated | Complete documentation in `README.md` and `progress.md` |

---

## Working Model Features Implemented

### 1. Real Geolocation & Distance-Sorted Hubs
- **Hook**: [`hooks/useGeolocation.ts`](file:///home/alvi/Projects/chargeahead/hooks/useGeolocation.ts)
  - Leverages native `navigator.geolocation.getCurrentPosition` & `watchPosition`.
  - Graceful fallback to Bengaluru coordinates (`12.9716, 77.5946`) when permission is denied or running in headless mode.
- **Sorting**: Uses real spherical Haversine formula to sort charging hubs relative to the user's real coordinate location, with dynamic driving ETA calculated based on speed corridors.

### 2. Free Public Routing & Geocoding (Zero Paid API Keys)
- **Nominatim Geocoding**:
  - `geocodePlace()` via `https://nominatim.openstreetmap.org/search` (India bounding with `countrycodes=in`).
  - Auto-suggest dropdown in [`app/(app)/app/plan/page.tsx`](file:///home/alvi/Projects/chargeahead/app/(app)/app/plan/page.tsx).
- **OSRM Road Routing Engine**:
  - `fetchRouteOSRM()` via `https://router.project-osrm.org/route/v1/driving/`.
  - Generates actual road geometry polylines, road distances, and drive duration.
  - Rendered on [`MapComponent.tsx`](file:///home/alvi/Projects/chargeahead/components/shared/MapComponent.tsx) and synchronized into [`tripStore.ts`](file:///home/alvi/Projects/chargeahead/lib/store/tripStore.ts).

### 3. Station Map & Color-Coded Status
- **Colors**:
  - 🟢 **Available** (`#22C55E`): Ready for charging.
  - 🟡 **Busy** (`#F59E0B`): Congested or queuing.
  - 🔘 **Offline** (`#6B7280`): Out of service.
  - ⚪ **Unknown** (`#94A3B8`).
- **Interactive Legend**: Floating status indicator widget directly on the map canvas.
- **Sponsored Hubs**: Gold star ring indicator on map + "SPONSORED" badge on cards for promoted placements.

### 4. Reservation Flow with Walk-Up Bays & Hold Timer
- **Location**: [`app/(app)/app/station/[id]/reserve/page.tsx`](file:///home/alvi/Projects/chargeahead/app/(app)/app/station/[id]/reserve/page.tsx)
- **Dedicated Walk-Up Bays**:
  - Designated bays labeled `isWalkUpOnly: true` (e.g., Bharat DC-001 drop-in ports).
  - Clearly marked with purple badges and disabled from reservation to guarantee walk-up access.
- **5-Minute Slot Hold Countdown**:
  - Real-time countdown timer in checkout (`sessionStorage` persisted).
  - Prevents double-booking and expires hold if not completed in time.
- **Unified Checkout**:
  - Single `Pay ₹{amount}` action button.

### 5. Verified Receipt Screen & Tax Invoicing
- **Location**: [`app/(app)/app/station/[id]/receipt/page.tsx`](file:///home/alvi/Projects/chargeahead/app/(app)/app/station/[id]/receipt/page.tsx)
- **Features**:
  - Framer-motion animated checkmark icon.
  - Itemized breakdown (energy kWh, tariff rate, base amount, 18% GST).
  - Fast Check-In Pass QR code block with generated check-in code.
  - "Download PDF Tax Invoice" action and booking history navigation.

### 6. Dynamic Community Reporting & Reliability Score Recalculation
- **Location**: [`app/(app)/app/station/[id]/page.tsx`](file:///home/alvi/Projects/chargeahead/app/(app)/app/station/[id]/page.tsx)
- **Features**:
  - One-tap quick reporting modal with categorization: `working`, `busy`, `broken`, `blocked`, `payment_issue`, `offline`.
  - Real-time score update via `recalcConfidenceScore()`:
    - Working reports boost trust (+3 pts).
    - Offline / broken reports dynamically degrade trust score (-5 to -10 pts).
  - Persisted to browser storage and merged with verified reports.

### 7. Algorithm-Driven Reroute (Congestion-Aware)
- **Hook**: [`hooks/useMockLiveUpdates.ts`](file:///home/alvi/Projects/chargeahead/hooks/useMockLiveUpdates.ts)
- **Algorithm**:
  - Evaluates active trip stops against live availability and predicted queue times.
  - When the upcoming stop reaches 0 available ports AND queue > 15 minutes, automatically detects nearest available alternative via Haversine calculation and issues a reroute alert.

### 8. Physics-Driven EV Range Estimator
- **Component**: [`components/shared/RangeEstimator.tsx`](file:///home/alvi/Projects/chargeahead/components/shared/RangeEstimator.tsx)
- **Formula**:
  $$\text{Adjusted Efficiency} = \frac{\text{Battery Capacity}}{\text{Claimed Range}} \times (1 + \text{Weather Penalty} + \text{Terrain Penalty})$$
  $$\text{Real Range} = \frac{\text{Battery Capacity} \times \text{SoC}\%}{\text{Adjusted Efficiency}}$$
- Integrated into the Home Page list view with interactive sliders for battery SoC, weather conditions (Sunny, Cloudy, Rainy, Cold), and terrain gradients (Flat, Hilly, Mountain).

---

## Free External APIs Utilized

1. **Browser Geolocation API** (`navigator.geolocation`): Native GPS coordinates.
2. **OpenStreetMap Nominatim** (`https://nominatim.openstreetmap.org`): Real search geocoding and reverse geocoding.
3. **OSRM Routing Engine** (`https://router.project-osrm.org`): Real road routing geometries, distances, and drive times.
4. **OpenStreetMap Tiles** (`https://tile.openstreetmap.org`): High-resolution map vector tiles.
