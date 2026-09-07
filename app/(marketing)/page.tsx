'use client';

import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Navigation, ArrowRight, CheckCircle2, MapPin, Clock, BatteryCharging, Sparkles, AlertTriangle, Users, Award, Play } from 'lucide-react';
import Link from 'next/link';
import { ConfidenceScore } from '@/components/shared/ConfidenceScore';

export default function MarketingLandingPage() {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-16 md:pt-24 px-4 md:px-8 max-w-7xl mx-auto text-center space-y-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-mint-400/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint-400/10 border border-mint-400/30 text-mint-400 text-xs font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen EV Trip Intelligence Platform
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight"
        >
          Don't just find chargers.{' '}
          <span className="bg-mint-gradient bg-clip-text text-transparent">
            Know if they'll work.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
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
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-mint-gradient text-navy-900 font-bold text-base shadow-mint-glow hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            Launch Interactive Demo <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/how-it-works"
            className="w-full sm:w-auto px-8 py-4 rounded-xl glass-card text-white font-semibold text-base hover:bg-white/10 transition-all flex items-center justify-center gap-2 border-surface-border"
          >
            See Confidence Engine <Play className="w-4 h-4 text-mint-400 fill-mint-400" />
          </Link>
        </motion.div>

        {/* Hero Visual Card / App Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-8 max-w-4xl mx-auto"
        >
          <div className="glass-card rounded-3xl p-6 border-mint-400/30 text-left shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-white/40 font-mono ml-2">chargeahead.in/app/home</span>
              </div>
              <span className="text-xs text-mint-400 font-semibold bg-mint-400/10 px-3 py-1 rounded-full border border-mint-400/30">
                Live Telemetry Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-navy-900/90 rounded-2xl p-4 border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-teal-300 font-semibold">Zeon Fast Charging</span>
                  <ConfidenceScore score={91} size="sm" />
                </div>
                <div className="text-sm font-bold text-white">Ramanagara Expressway Hub</div>
                <div className="text-xs text-emerald-400 font-semibold">3 of 4 ports free • 0 min wait</div>
              </div>

              <div className="bg-navy-900/90 rounded-2xl p-4 border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-teal-300 font-semibold">Tata Power EZ Charge</span>
                  <ConfidenceScore score={88} size="sm" />
                </div>
                <div className="text-sm font-bold text-white">Mandya Bypass Fast Hub</div>
                <div className="text-xs text-emerald-400 font-semibold">2 of 2 ports free • 0 min wait</div>
              </div>

              <div className="bg-navy-900/90 rounded-2xl p-4 border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-400 font-semibold">ChargeZone Plaza</span>
                  <ConfidenceScore score={42} size="sm" />
                </div>
                <div className="text-sm font-bold text-white">Phoenix Mall Hub</div>
                <div className="text-xs text-amber-400 font-semibold">Queue buildup (30m wait predicted)</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Comparison Strip: Maps vs ChargeAhead */}
      <section className="px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-semibold text-mint-400 uppercase tracking-widest">The Problem We Solve</span>
          <h2 className="text-3xl font-extrabold text-white">Standard Maps vs. ChargeAhead</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Standard Maps */}
          <div className="glass-card rounded-2xl p-6 border-red-500/30 space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" /> Standard EV Navigation Apps
            </div>
            <ul className="space-y-3 text-xs text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✗</span> Shows charger location, but not real-time status or hardware fault rates.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✗</span> No queue prediction — you arrive to find 4 cars waiting in line.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✗</span> Static route planning forces you to search for backup chargers manually while driving.
              </li>
            </ul>
          </div>

          {/* ChargeAhead */}
          <div className="glass-card rounded-2xl p-6 border-mint-400/40 space-y-4 bg-mint-400/5">
            <div className="flex items-center gap-2 text-mint-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" /> ChargeAhead Intelligent Platform
            </div>
            <ul className="space-y-3 text-xs text-white/90">
              <li className="flex items-start gap-2">
                <span className="text-mint-400 font-bold">✓</span> <strong>Reliability Score:</strong> Live algorithm weighs telemetry + user check-ins.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-mint-400 font-bold">✓</span> <strong>Predictive Queue:</strong> AI estimates wait times when you'll actually arrive.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-mint-400 font-bold">✓</span> <strong>Live Auto-Rerouting:</strong> Instant voice/visual prompt to switch stops if queue forms.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3 Pillars Section */}
      <section className="px-4 md:px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold text-mint-400 uppercase tracking-widest">How It Works</span>
          <h2 className="text-3xl font-extrabold text-white">Predict. Act. Adapt.</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-400/15 text-teal-300 flex items-center justify-center font-bold text-lg">
              01
            </div>
            <h3 className="text-lg font-bold text-white">Predict</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Our confidence scoring model calculates real-time hardware status, power drops, and queue dynamics.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-mint-400/15 text-mint-400 flex items-center justify-center font-bold text-lg">
              02
            </div>
            <h3 className="text-lg font-bold text-white">Act</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Reserve guaranteed charging ports up to 30 minutes in advance or pay seamlessly with unified wallet.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-400/15 text-emerald-400 flex items-center justify-center font-bold text-lg">
              03
            </div>
            <h3 className="text-lg font-bold text-white">Adapt</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              If an en-route charger breaks or gets occupied, ChargeAhead automatically prompts a faster alternate stop.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="px-4 md:px-8 max-w-5xl mx-auto">
        <div className="glass-card rounded-3xl p-10 text-center border-mint-400/40 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-mint-400/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl font-extrabold text-white">Ready for worry-free EV road trips?</h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto">
            Experience the complete clickable prototype now — explore live stations, simulate long-distance trip rerouting, and test port reservations.
          </p>
          <Link
            href="/app/home"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-mint-gradient text-navy-900 font-bold text-base shadow-mint-glow hover:opacity-90 transition-all"
          >
            Launch Web App Demo <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
