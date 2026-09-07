'use client';

import { Zap, Target, Shield, Heart, MapPin } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-12 bg-white text-black">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Our Mission</span>
        <h1 className="text-4xl font-extrabold text-black">Accelerating the Electric Transition</h1>
        <p className="text-base text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto">
          ChargeAhead was born out of frustration with broken EV chargers, offline networks, and unexpected 1-hour queues on national highways.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl space-y-6">
        <h2 className="text-2xl font-extrabold text-black">Why ChargeAhead?</h2>
        <p className="text-sm text-gray-700 font-medium leading-relaxed">
          Electric vehicle adoption in India and worldwide is surging. However, charger availability data remains fragmented across dozens of separate operator apps with zero cross-network reliability guarantees.
        </p>
        <p className="text-sm text-gray-700 font-medium leading-relaxed">
          Our platform brings predictive artificial intelligence, live telemetry aggregation, and crowdsourced driver verification into one unified web experience — enabling effortless long-distance road trips.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center space-y-2">
          <Target className="w-8 h-8 text-black mx-auto" />
          <h3 className="text-base font-extrabold text-black">Predictive AI</h3>
          <p className="text-xs text-gray-500 font-medium">Calculating charger usability before you arrive</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center space-y-2">
          <Shield className="w-8 h-8 text-black mx-auto" />
          <h3 className="text-base font-extrabold text-black">Reliability First</h3>
          <p className="text-xs text-gray-500 font-medium">Community check-ins protect drivers from dead plugs</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center space-y-2">
          <Heart className="w-8 h-8 text-black mx-auto" />
          <h3 className="text-base font-extrabold text-black">Driver Centric</h3>
          <p className="text-xs text-gray-500 font-medium">Unified wallet and effortless slot reservations</p>
        </div>
      </div>
    </div>
  );
}
