'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Navigation, Users, Clock, ArrowRight, Activity, Radio } from 'lucide-react';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-20 space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-semibold text-mint-400 uppercase tracking-widest">Under The Hood</span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">The ChargeAhead Usability Engine</h1>
        <p className="text-base text-white/60 leading-relaxed">
          How our predictive telemetry algorithms calculate station reliability, queue times, and automated reroutes.
        </p>
      </div>

      <div className="space-y-8">
        {/* Step 1 */}
        <div className="glass-card rounded-3xl p-8 border-mint-400/30 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-mint-400 bg-mint-400/10 px-3 py-1 rounded-full border border-mint-400/30">
              <Activity className="w-3.5 h-3.5" /> 1. Telemetry & Heartbeat Monitoring
            </div>
            <h2 className="text-2xl font-bold text-white">Real-time CPO API Integration</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              ChargeAhead ingests live telemetry signals from Charge Point Operators (Zeon, Tata Power, Statiq, ChargeZone). If a gun's voltage drops or communication drops out for more than 4 minutes, the station's confidence score decreases immediately.
            </p>
          </div>
          <div className="bg-navy-900/80 p-6 rounded-2xl border border-surface-border text-xs space-y-2 font-mono text-mint-300">
            <div>▸ Incoming CPO Heartbeat: STN-001</div>
            <div>▸ Telemetry: 350V DC / 120A OK</div>
            <div className="text-emerald-400">▸ Confidence Index Calculated: 91% (HEALTHY)</div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="glass-card rounded-3xl p-8 border-teal-400/30 grid md:grid-cols-2 gap-8 items-center">
          <div className="bg-navy-900/80 p-6 rounded-2xl border border-surface-border text-xs space-y-2 font-mono text-teal-300 md:order-1">
            <div>▸ Active En-Route EV Count: 3 vehicles</div>
            <div>▸ ETA Window: 14:15 - 14:30</div>
            <div className="text-amber-400">▸ Queue Probability: High (Reroute Triggered)</div>
          </div>
          <div className="space-y-4 md:order-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-300 bg-teal-400/10 px-3 py-1 rounded-full border border-teal-400/30">
              <Clock className="w-3.5 h-3.5" /> 2. Predictive Queue Estimation
            </div>
            <h2 className="text-2xl font-bold text-white">ETA-Aware Slot Reservations</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Instead of just checking if a port is open right now, ChargeAhead calculates how many EVs are currently driving toward that station with ETAs matching your arrival window.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="glass-card rounded-3xl p-8 border-emerald-400/30 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/30">
              <Users className="w-3.5 h-3.5" /> 3. Community Verification
            </div>
            <h2 className="text-2xl font-bold text-white">Crowdsourced Driver Reports</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              EV drivers earn trust points by submitting 1-tap check-ins (e.g. "ICE vehicle blocking CCS2 port", "Restroom open", "Power throttled to 25kW").
            </p>
          </div>
          <div className="bg-navy-900/80 p-6 rounded-2xl border border-surface-border text-xs space-y-3">
            <div className="flex items-center justify-between text-white">
              <span className="font-bold">Latest Driver Report</span>
              <span className="text-mint-400 text-[10px]">2 mins ago</span>
            </div>
            <p className="text-white/60">"Gun #2 latch fixed. Charging at 58kW rate!"</p>
          </div>
        </div>
      </div>

      <div className="text-center pt-6">
        <Link
          href="/app/home"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-mint-gradient text-navy-900 font-bold text-base shadow-mint-glow hover:opacity-90 transition-all"
        >
          Try ChargeAhead Engine Demo <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
