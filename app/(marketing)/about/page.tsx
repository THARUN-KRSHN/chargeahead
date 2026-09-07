'use client';

import { Zap, Target, Shield, Heart, MapPin } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold text-mint-400 uppercase tracking-widest">Our Mission</span>
        <h1 className="text-4xl font-extrabold text-white">Accelerating the Electric Transition</h1>
        <p className="text-base text-white/60 leading-relaxed max-w-2xl mx-auto">
          ChargeAhead was born out of frustration with broken EV chargers, offline networks, and unexpected 1-hour queues on national highways.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-8 border-mint-400/30 space-y-6">
        <h2 className="text-2xl font-bold text-white">Why ChargeAhead?</h2>
        <p className="text-sm text-white/70 leading-relaxed">
          Electric vehicle adoption in India and worldwide is surging. However, charger availability data remains fragmented across dozens of separate operator apps with zero cross-network reliability guarantees.
        </p>
        <p className="text-sm text-white/70 leading-relaxed">
          Our platform brings predictive artificial intelligence, live telemetry aggregation, and crowdsourced driver verification into one unified web experience — enabling effortless long-distance road trips.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl text-center space-y-2">
          <Target className="w-8 h-8 text-mint-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Predictive AI</h3>
          <p className="text-xs text-white/50">Calculating charger usability before you arrive</p>
        </div>
        <div className="glass-card p-6 rounded-2xl text-center space-y-2">
          <Shield className="w-8 h-8 text-teal-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Reliability First</h3>
          <p className="text-xs text-white/50">Community check-ins protect drivers from dead plugs</p>
        </div>
        <div className="glass-card p-6 rounded-2xl text-center space-y-2">
          <Heart className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Driver Centric</h3>
          <p className="text-xs text-white/50">Unified wallet and effortless slot reservations</p>
        </div>
      </div>
    </div>
  );
}
