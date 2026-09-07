'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Navigation, Users, Clock, ArrowRight, Activity, Radio } from 'lucide-react';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-20 space-y-16 bg-white text-black">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Under The Hood</span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-black">The ChargeAhead Usability Engine</h1>
        <p className="text-base text-gray-600 font-medium leading-relaxed">
          How our predictive telemetry algorithms calculate station reliability, queue times, and automated reroutes.
        </p>
      </div>

      <div className="space-y-8">
        {/* Step 1 */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-black bg-gray-100 px-3 py-1 rounded-full border border-gray-300">
              <Activity className="w-3.5 h-3.5" /> 1. Telemetry & Heartbeat Monitoring
            </div>
            <h2 className="text-2xl font-extrabold text-black">Real-time CPO API Integration</h2>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              ChargeAhead ingests live telemetry signals from Charge Point Operators (Zeon, Tata Power, Statiq, ChargeZone). If a gun's voltage drops or communication drops out for more than 4 minutes, the station's confidence score decreases immediately.
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-xs space-y-2 font-mono text-gray-900 font-semibold">
            <div>▸ Incoming CPO Heartbeat: STN-001</div>
            <div>▸ Telemetry: 350V DC / 120A OK</div>
            <div className="text-emerald-700 font-extrabold">▸ Confidence Index Calculated: 91% (HEALTHY)</div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg grid md:grid-cols-2 gap-8 items-center">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-xs space-y-2 font-mono text-gray-900 font-semibold md:order-1">
            <div>▸ Active En-Route EV Count: 3 vehicles</div>
            <div>▸ ETA Window: 14:15 - 14:30</div>
            <div className="text-amber-700 font-extrabold">▸ Queue Probability: High (Reroute Triggered)</div>
          </div>
          <div className="space-y-4 md:order-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-black bg-gray-100 px-3 py-1 rounded-full border border-gray-300">
              <Clock className="w-3.5 h-3.5" /> 2. Predictive Queue Estimation
            </div>
            <h2 className="text-2xl font-extrabold text-black">ETA-Aware Slot Reservations</h2>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              Instead of just checking if a port is open right now, ChargeAhead calculates how many EVs are currently driving toward that station with ETAs matching your arrival window.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-black bg-gray-100 px-3 py-1 rounded-full border border-gray-300">
              <Users className="w-3.5 h-3.5" /> 3. Community Verification
            </div>
            <h2 className="text-2xl font-extrabold text-black">Crowdsourced Driver Reports</h2>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              EV drivers earn trust points by submitting 1-tap check-ins (e.g. "ICE vehicle blocking CCS2 port", "Restroom open", "Power throttled to 25kW").
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-xs space-y-3">
            <div className="flex items-center justify-between text-black">
              <span className="font-extrabold">Latest Driver Report</span>
              <span className="text-gray-500 font-bold text-[10px]">2 mins ago</span>
            </div>
            <p className="text-gray-700 font-medium">"Gun #2 latch fixed. Charging at 58kW rate!"</p>
          </div>
        </div>
      </div>

      <div className="text-center pt-6">
        <Link
          href="/app/home"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-black text-white font-extrabold text-base shadow-md hover:bg-gray-900 transition-all"
        >
          Try ChargeAhead Engine Demo <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
