# ⚡ ChargeAhead — AI-Powered EV Charging & Route Optimization Platform

ChargeAhead is a next-generation Electric Vehicle (EV) smart route planning and charging station reservation platform. It leverages Google Gemini AI for live traffic analysis, dynamic time-slot recommendations, intelligent tariff calculation, turn-by-turn voice navigation, and community-driven charger trustworthiness verification.

---

## 🔗 Repository Versions & Links

- 🌐 **Frontend / Demo Version**: [https://github.com/THARUN-KRSHN/chargeahead](https://github.com/THARUN-KRSHN/chargeahead)
- ⚙️ **Working Version (Full-Stack Model)**: [https://github.com/THARUN-KRSHN/chargeahead/tree/real-working-model/working-model](https://github.com/THARUN-KRSHN/chargeahead/tree/real-working-model/working-model)

---

## 🚀 Quick Start Guide

### 1. Running the Frontend / Demo Version (`main` branch)

```bash
# Clone the repository
git clone https://github.com/THARUN-KRSHN/chargeahead.git
cd chargeahead

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 2. Running the Full Working Model (`real-working-model` branch)

```bash
# Switch to the real-working-model branch
git checkout real-working-model

# Navigate to the working-model directory
cd working-model

# Install dependencies
npm install

# Start the full-stack development server
npm run dev
```

---

## ✨ Key Features

- **🤖 Gemini AI Traffic & Time-Slot Advisor**: Analyzes road congestion and station queue history to recommend the optimal charging window with dynamic off-peak discounts.
- **🗺️ Smart EV Route Planner**: Calculates optimal highway stops based on EV range, corridor detours, connector compatibility, and live charger status.
- **🔊 Turn-by-Turn Voice Navigation**: Google Maps-style interactive navigation with live vehicle tracking, voice guidance, and charger arrival triggers.
- **📊 Charger Trust Score & Community Reports**: Driver reporting system for port outages, cable defects, or queues to calculate live station trust scores.
- **🔌 Exact Charger Bay & Landmark Details**: Shows precise bay locations (e.g., *Bay 1 - Express Canopy*) and landmark directions at stations.
- **👥 Dual Portals**:
  - **EV Drivers**: Vehicle management, route planning, slot reservation, wallet, and active navigation.
  - **Station Operators**: Live station analytics, port utilization metrics, revenue charts, and incident management.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Styling**: Vanilla CSS & Tailwind CSS utilities
- **State Management**: Zustand
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Maps API**: Interactive Map components & OpenStreetMap / Leaflet / Mapbox integration
