# ⚡ ChargeAhead — Predict. Act. Adapt.

> **Next-Generation AI-Powered EV Corridor Planning & Charging Reliability Platform**
> *Don't just find chargers. Know if they'll work before you arrive.*

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-Vector_GIS-00FF88?style=flat-square)](https://maplibre.org/)
[![OCM API](https://img.shields.io/badge/Open_Charge_Map-v3_Live-blue?style=flat-square)](https://openchargemap.org/)
[![Build Status](https://img.shields.io/badge/Build-Passing-emerald?style=flat-square)](#)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 🌟 Overview

**ChargeAhead** solves the "phantom charger" crisis in long-distance EV driving. Traditional navigation apps show static pins of charging locations without verifying whether power is outputting or ports are broken. ChargeAhead combines **live CPO hardware heartbeats**, **rate-limited driver corroboration check-ins**, and **historical queue prediction models** to calculate a real-time **True Charging Availability™** score before guiding EV drivers.

---

## 🔗 Repository Links

- 🌐 **Frontend / Navigation Platform**: [https://github.com/THARUN-KRSHN/chargeahead](https://github.com/THARUN-KRSHN/chargeahead)
- ⚙️ **Full-Stack Working Model Branch**: [https://github.com/THARUN-KRSHN/chargeahead/tree/real-working-model](https://github.com/THARUN-KRSHN/chargeahead/tree/real-working-model)

---

## 🚀 Key Modules & Features

### 1. 🛡️ True Charging Availability™ Engine
- **Tri-Factor Confidence Scoring**: Combines CPO live hardware telemetry, community driver corroborations, and time-of-day historical queue algorithms.
- **Dynamic Score Dial**: High-visibility reliability score (e.g., `94% Reliable`) rendered on station modals and route stops.

### 2. 🗺️ Zero-Mock GIS Map & Highway Corridor Planner
- **Open Charge Map (OCM) v3 API**: Queries live POIs, connector types (CCS2, Type 2, GB/T), power ratings (kW), and pricing.
- **Nominatim & OSRM Engine**: Real-time place search, reverse geocoding, and driving polyline calculation matching exact road geometry.
- **MapLibre GL Triple-Layer Polyline**: High-visibility `#00FF88` neon green core, dark casing, and white outer glow for daylight driving legibility.

### 3. 📱 Driver Co-Pilot & In-App QR Pay
- **Step-by-Step Navigation**: Live turn-by-turn guidance and battery SoC discharge curve tracking.
- **Integrated QR Charger Pay**: In-app QR code scanner, live charging speed monitor (kW), session energy counter (kWh), and auto-resume trip navigation upon completion.

### 4. 👥 Crowd-Sourced Trust & Corroboration Engine
- **Rate-Limited Driver Reporting**: 30-minute per-user rate limit per station to eliminate spam.
- **Linear Time Decay**: 3-hour decay factor ($\max(0, 1 - \frac{\text{age}}{180})$) automatically clearing unconfirmed single complaints over time.
- **Mid-Trip Reroute Alerts**: High-severity reports trigger active warning banners for en-route drivers with an "Accept Alternative Stop" button.

### 5. 🛠️ Closed-Loop CPO Operator Control Center (`/operator`)
- Real-time **Incident Action Queue** allowing station operators to acknowledge, process, and resolve community issue tickets.
- **Instant Confidence Restoration**: Resolving a ticket clears the incident and immediately restores the station's confidence rating back to 96% across live driver maps.

### 6. 🎬 Interactive Product Presentation Deck (`PresentationModal.tsx`)
- Full-screen **10-slide executive product deck** accessible from the hero section ("Launch Presentation").
- **Device Mockups**: Features custom iPhone (`PhoneFrame`) and iPad (`TabletFrame`) device shells with live interactive simulations (animated driving car, SoC battery slider, kWh counter, score dial recalculation, and ticket resolution toggles).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & React 19
- **Languages**: TypeScript, HTML5, Vanilla CSS
- **Map Engine**: MapLibre GL, OpenStreetMap, OSRM Routing Engine
- **Telemetry Data**: Open Charge Map (OCM) v3 API
- **AI Integration**: Google Gemini API (`@google/genai`)
- **State Management**: Zustand
- **Styling**: Tailwind CSS & Vanilla CSS Design Tokens
- **Animations**: Framer Motion
- **Icons**: Lucide React

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`

### 1. Clone the Repository
```bash
git clone https://github.com/THARUN-KRSHN/chargeahead.git
cd chargeahead
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup (Optional)
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_OCM_API_KEY=your_open_charge_map_key
GEMINI_API_KEY=your_google_gemini_key
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 📂 Project Structure

```
chargeahead/
├── app/
│   ├── (app)/
│   │   ├── app/home/            # Main Driver Map & Navigation Hub
│   │   ├── app/plan/            # AI Corridor Route Planner
│   │   ├── app/station/[id]/    # Live Station Details & Report Sheet
│   │   └── app/trip/active/     # Turn-by-Turn Navigation Co-Pilot
│   ├── (auth)/                  # Login & Signup Flows
│   ├── (marketing)/             # Landing Page & Presentation Hero
│   ├── api/ocm/poi/             # Server Proxy for Open Charge Map API
│   └── operator/                # Closed-Loop CPO Incident Control Center
├── components/
│   ├── map/                     # LeftTripPlannerPanel, RightNavigationPanel
│   ├── marketing/               # PresentationModal & Interactive Device Mockups
│   └── shared/                  # InteractiveMap, StationDetailsModal, ReportIssueSheet
├── lib/
│   ├── api/                     # geoServices.ts, openChargeMap.ts, geminiRoutePlanner.ts
│   ├── services/                # reportStore.ts (Confidence Engine & Corroboration)
│   └── store/                   # vehicleStore.ts, notificationStore.ts
└── public/                      # Static assets & icons
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

---

<p align="center">
  Built with ❤️ for EV Drivers & CPO Station Operators.
</p>
