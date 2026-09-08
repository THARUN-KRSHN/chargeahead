'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, MapPin, Clock, BatteryCharging, Sparkles, AlertTriangle, Users, Award, Play } from 'lucide-react';
import Link from 'next/link';
import { ConfidenceScore } from '@/components/shared/ConfidenceScore';
import { PresentationModal } from '@/components/marketing/PresentationModal';

export default function MarketingLandingPage() {
  const [presentationOpen, setPresentationOpen] = useState(false);

  return (
    <div className="space-y-24 pb-20 bg-white text-black">
      {/* Hero Section */}
      <section className="relative pt-16 md:pt-24 px-4 md:px-8 max-w-7xl mx-auto text-center space-y-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-300 text-black text-xs font-bold"
        >
          <Sparkles className="w-3.5 h-3.5 text-black" /> Next-Gen EV Trip Intelligence Platform
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-black max-w-4xl mx-auto leading-tight"
        >
          Don't just find chargers.{' '}
          <span className="text-gray-600 block sm:inline">
            Know if they'll work.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed"
        >
          ChargeAhead combines predictive availability AI, live queue estimation, community verification, and real-time rerouting to guarantee zero charging anxiety.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link
            href="/app/home"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-black text-white font-black text-base shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
          >
            Launch App <ArrowRight className="w-5 h-5 text-emerald-400" />
          </Link>

          <button
            onClick={() => setPresentationOpen(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-base shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            Launch Presentation <Play className="w-4 h-4 fill-current" />
          </button>

          <Link
            href="/how-it-works"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-gray-300 bg-white text-black font-extrabold text-base hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            See Confidence Engine <Sparkles className="w-4 h-4 text-emerald-600" />
          </Link>
        </motion.div>

        {/* Hero Visual Card / App Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-8 max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-3xl p-6 border border-gray-200 text-left shadow-xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-gray-500 font-mono ml-2 font-semibold">chargeahead.in/app/home</span>
              </div>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Live Telemetry Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 font-bold">Zeon Fast Charging</span>
                  <ConfidenceScore score={91} size="sm" />
                </div>
                <div className="text-sm font-extrabold text-black">Ramanagara Expressway Hub</div>
                <div className="text-xs text-emerald-700 font-bold">3 of 4 ports free • 0 min wait</div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 font-bold">Tata Power EZ Charge</span>
                  <ConfidenceScore score={88} size="sm" />
                </div>
                <div className="text-sm font-extrabold text-black">Mandya Bypass Fast Hub</div>
                <div className="text-xs text-emerald-700 font-bold">2 of 2 ports free • 0 min wait</div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-700 font-bold">ChargeZone Plaza</span>
                  <ConfidenceScore score={42} size="sm" />
                </div>
                <div className="text-sm font-extrabold text-black">Phoenix Mall Hub</div>
                <div className="text-xs text-amber-700 font-bold">Queue buildup (30m wait predicted)</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Comparison Strip: Maps vs ChargeAhead */}
      <section className="px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">The Problem We Solve</span>
          <h2 className="text-3xl font-extrabold text-black">Standard Maps vs. ChargeAhead</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Standard Maps */}
          <div className="bg-red-50/60 rounded-2xl p-6 border border-red-200 space-y-4">
            <div className="flex items-center gap-2 text-red-700 font-extrabold text-sm">
              <AlertTriangle className="w-5 h-5" /> Standard EV Navigation Apps
            </div>
            <ul className="space-y-3 text-xs text-gray-700 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-extrabold">✗</span> Shows charger location, but not real-time status or hardware fault rates.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-extrabold">✗</span> No queue prediction — you arrive to find 4 cars waiting in line.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-extrabold">✗</span> Static route planning forces you to search for backup chargers manually while driving.
              </li>
            </ul>
          </div>

          {/* ChargeAhead */}
          <div className="bg-emerald-50/60 rounded-2xl p-6 border border-emerald-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
              <ShieldCheck className="w-5 h-5" /> ChargeAhead Intelligent Platform
            </div>
            <ul className="space-y-3 text-xs text-gray-800 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 font-extrabold">✓</span> <strong>Reliability Score:</strong> Live algorithm weighs telemetry + user check-ins.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 font-extrabold">✓</span> <strong>Predictive Queue:</strong> AI estimates wait times when you'll actually arrive.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 font-extrabold">✓</span> <strong>Live Auto-Rerouting:</strong> Instant voice/visual prompt to switch stops if queue forms.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3 Pillars Section */}
      <section className="px-4 md:px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">How It Works</span>
          <h2 className="text-3xl font-extrabold text-black">Predict. Act. Adapt.</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center font-extrabold text-lg">
              01
            </div>
            <h3 className="text-lg font-extrabold text-black">Predict</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Our confidence scoring model calculates real-time hardware status, power drops, and queue dynamics.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center font-extrabold text-lg">
              02
            </div>
            <h3 className="text-lg font-extrabold text-black">Act</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Reserve guaranteed charging ports up to 30 minutes in advance or pay seamlessly with unified wallet.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center font-extrabold text-lg">
              03
            </div>
            <h3 className="text-lg font-extrabold text-black">Adapt</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              If an en-route charger breaks or gets occupied, ChargeAhead automatically prompts a faster alternate stop.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="px-4 md:px-8 max-w-5xl mx-auto">
        <div className="bg-black rounded-3xl p-10 text-center text-white space-y-6 relative overflow-hidden shadow-2xl">
          <h2 className="text-3xl font-extrabold text-white">Ready for worry-free EV road trips?</h2>
          <p className="text-sm text-gray-300 font-medium max-w-xl mx-auto">
            Sign in to explore live stations, plan long-distance EV trips with AI predictive rerouting, and reserve charging ports.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-extrabold text-base shadow-md hover:bg-gray-100 transition-all"
          >
            Sign In to Access Navigation <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Product Presentation Modal */}
      <PresentationModal
        isOpen={presentationOpen}
        onClose={() => setPresentationOpen(false)}
      />
    </div>
  );
}
