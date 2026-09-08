'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Navigation,
  QrCode,
  CheckCircle2,
  Clock,
  Battery,
  Users,
  Wrench,
  Sparkles,
  ArrowRight,
  Play,
  RotateCcw,
  Building2,
  Car,
  Layers,
  Search,
  Check,
  ThumbsUp,
  Smartphone,
  Tablet,
  Radio,
  Wifi,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import Link from 'next/link';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOTAL_SLIDES = 10;

const SLIDE_METADATA = [
  { id: 1, title: 'Cover & Vision', icon: Sparkles },
  { id: 2, title: 'The Problem', icon: AlertTriangle },
  { id: 3, title: 'The Solution', icon: ShieldCheck },
  { id: 4, title: 'Real Map & OCM API', icon: MapPin },
  { id: 5, title: 'AI Route Optimization', icon: Navigation },
  { id: 6, title: 'Driver Co-Pilot', icon: QrCode },
  { id: 7, title: 'Community Engine', icon: Users },
  { id: 8, title: 'Operator Control', icon: Wrench },
  { id: 9, title: 'Ecosystem Benefits', icon: Building2 },
  { id: 10, title: 'Launch Experience', icon: Zap },
];

/* -------------------------------------------------------------------------- */
/* Device Mockup Shell Components                                            */
/* -------------------------------------------------------------------------- */

function PhoneFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative w-[280px] sm:w-[300px] h-[540px] sm:h-[580px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-[6px] border-slate-800 flex flex-col justify-between overflow-hidden ${className}`}>
      {/* Speaker / Dynamic Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-b-2xl z-30 flex items-center justify-center gap-2">
        <div className="w-10 h-1 bg-slate-800 rounded-full" />
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* Screen Inner Container */}
      <div className="relative w-full h-full bg-slate-900 rounded-[34px] overflow-hidden flex flex-col pt-6">
        {/* Status Bar */}
        <div className="px-4 py-1.5 flex items-center justify-between text-[10px] font-extrabold text-slate-400 z-20 shrink-0 select-none">
          <span>9:41 AM</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-slate-400" />
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <div className="flex items-center gap-0.5 bg-slate-800 px-1 py-0.5 rounded text-[9px] text-emerald-400 font-mono">
              <Battery className="w-2.5 h-2.5 fill-current" /> 84%
            </div>
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col text-slate-900">
          {children}
        </div>

        {/* Bottom Home Indicator Line */}
        <div className="w-28 h-1 bg-slate-400/30 rounded-full mx-auto my-1.5 shrink-0" />
      </div>
    </div>
  );
}

function TabletFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative w-full max-w-[620px] h-[360px] sm:h-[400px] bg-slate-950 rounded-[32px] p-3 shadow-2xl border-[6px] border-slate-800 flex flex-col justify-between overflow-hidden ${className}`}>
      {/* Screen Inner Container */}
      <div className="relative w-full h-full bg-slate-900 rounded-[22px] overflow-hidden flex flex-col">
        {/* Top Tablet Bar */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-400 z-20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="text-[10px] text-slate-500 font-mono ml-2">ChargeAhead Web Control Center</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>OCM LIVE TELEMETRY</span>
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col text-slate-900 bg-slate-900">
          {children}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Presentation Modal Component                                          */
/* -------------------------------------------------------------------------- */

export function PresentationModal({ isOpen, onClose }: PresentationModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Interactive Simulation States across slides
  const [slide1Driving, setSlide1Driving] = useState(true);
  const [slide3Score, setSlide3Score] = useState(94);
  const [slide3Voting, setSlide3Voting] = useState(false);
  const [slide5Soc, setSlide5Soc] = useState(65);
  const [slide6Kwh, setSlide6Kwh] = useState(14.8);
  const [slide6Soc, setSlide6Soc] = useState(58);
  const [slide7Votes, setSlide7Votes] = useState(4);
  const [slide7Voted, setSlide7Voted] = useState(false);
  const [slide8TicketStatus, setSlide8TicketStatus] = useState<'In Progress' | 'Resolved'>('In Progress');

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % TOTAL_SLIDES);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextSlide, prevSlide, onClose]);

  // Slide 6 Live kWh Counter Simulation
  useEffect(() => {
    if (!isOpen || currentSlide !== 5) return;
    const interval = setInterval(() => {
      setSlide6Kwh((prev) => +(prev + 0.4).toFixed(1));
      setSlide6Soc((prev) => (prev >= 80 ? 80 : prev + 1));
    }, 800);
    return () => clearInterval(interval);
  }, [isOpen, currentSlide]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 md:p-6 text-slate-900 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-6xl h-[94vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
        >
          {/* Header Bar */}
          <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between z-20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  ChargeAhead Product Presentation
                  <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Car className="w-3 h-3 text-emerald-600" /> Interactive Mockups
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-semibold">
                  Slide {currentSlide + 1} of {TOTAL_SLIDES} — {SLIDE_METADATA[currentSlide].title}
                </p>
              </div>
            </div>

            {/* Controls Info */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <span>Use</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono text-slate-700">←</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono text-slate-700">→</kbd>
                <span>to navigate</span>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shadow-sm"
                aria-label="Close Presentation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Top Slide Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 relative shrink-0">
            <motion.div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${((currentSlide + 1) / TOTAL_SLIDES) * 100}%` }}
            />
          </div>

          {/* Main Slide Workspace */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 relative flex flex-col justify-center bg-slate-50/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="w-full max-w-5xl mx-auto"
              >
                {/* ------------------------------------------------------------------ */}
                {/* SLIDE 1: COVER & VISION                                           */}
                {/* ------------------------------------------------------------------ */}
                {currentSlide === 0 && (
                  <div className="grid lg:grid-cols-2 gap-8 items-center text-left">
                    <div className="space-y-5">
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black">
                        <Car className="w-4 h-4 text-emerald-600" /> EV Intelligence & Navigation Platform
                      </span>
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                        Predict. Act. Adapt.{' '}
                        <span className="text-emerald-600 block mt-1">The Future of EV Driving.</span>
                      </h1>
                      <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">
                        ChargeAhead eliminates charger anxiety. By combining real-time CPO telemetry, driver corroboration, and AI corridor routing, we guarantee workable charging stops before you arrive.
                      </p>

                      <div className="pt-2 flex items-center gap-3">
                        <button
                          onClick={nextSlide}
                          className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-xl flex items-center gap-2 transition-all uppercase tracking-wider"
                        >
                          Start Product Tour <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile Mockup Simulation for Slide 1 */}
                    <div className="flex justify-center">
                      <PhoneFrame>
                        <div className="space-y-3">
                          {/* App Top Bar */}
                          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                                <Zap className="w-4 h-4 fill-current" />
                              </div>
                              <span className="text-xs font-black text-white">ChargeAhead</span>
                            </div>
                            <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30">
                              LIVE NAV
                            </span>
                          </div>

                          {/* Simulated EV Car Dashboard Widget */}
                          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Car className="w-3.5 h-3.5 text-emerald-400" /> Tata Nexon EV MAX
                              </span>
                              <span className="text-white font-mono">78% SOC</span>
                            </div>

                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full w-[78%]" />
                            </div>

                            <div className="flex justify-between text-[10px] text-slate-300 font-medium">
                              <span>Range: 284 km</span>
                              <span>Speed: 72 km/h</span>
                            </div>
                          </div>

                          {/* Route Polyline Preview Card */}
                          <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-3 space-y-2 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wide">
                                Bengaluru → Goa Expressway
                              </span>
                              <span className="text-[10px] font-bold text-white">560 km</span>
                            </div>

                            {/* Simulated EV Car along Route */}
                            <div className="relative h-12 bg-slate-900 rounded-xl p-2 flex items-center border border-slate-800">
                              {/* Route Polyline Glow */}
                              <div className="absolute left-4 right-4 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_12px_#10b981]" />
                              {/* Animated Car Icon */}
                              <motion.div
                                animate={{ x: slide1Driving ? [0, 160, 0] : 0 }}
                                transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
                                className="relative z-10 w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg"
                              >
                                <Car className="w-4 h-4 fill-current" />
                              </motion.div>
                            </div>

                            <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-[10px]">
                              <span className="text-slate-300 font-medium">Stop 1: Statiq Chitradurga</span>
                              <span className="font-extrabold text-emerald-400">96% Reliable</span>
                            </div>
                          </div>

                          {/* Interactive Toggle Button */}
                          <button
                            onClick={() => setSlide1Driving(!slide1Driving)}
                            className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" /> {slide1Driving ? 'Pause Simulation' : 'Simulate EV Driving'}
                          </button>
                        </div>
                      </PhoneFrame>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* SLIDE 2: THE PROBLEM                                              */}
                {/* ------------------------------------------------------------------ */}
                {currentSlide === 1 && (
                  <div className="space-y-6 text-left">
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">The Problem</span>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900">The Broken EV Driving Experience</h2>
                      <p className="text-slate-600 font-medium max-w-2xl text-sm">
                        EV adoption is surging, but drivers face major highway bottlenecks using existing legacy pinboard maps:
                      </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6 items-center">
                      {/* 4 Problem Cards */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-md space-y-2">
                          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <h3 className="text-xs font-black text-slate-900">Phantom Chargers</h3>
                          <p className="text-[11px] text-slate-500 font-medium">Map says "Available", but charger screen is blank & power dead.</p>
                        </div>

                        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-md space-y-2">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                            <Clock className="w-4 h-4" />
                          </div>
                          <h3 className="text-xs font-black text-slate-900">Unexpected Queues</h3>
                          <p className="text-[11px] text-slate-500 font-medium">Waiting 45+ mins because all CCS2 ports are taken by unmanaged cars.</p>
                        </div>

                        <div className="bg-white border border-purple-200 rounded-2xl p-4 shadow-md space-y-2">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                            <Layers className="w-4 h-4" />
                          </div>
                          <h3 className="text-xs font-black text-slate-900">App Fragmentation</h3>
                          <p className="text-[11px] text-slate-500 font-medium">Juggling 12 different CPO apps & wallets to start one single plug.</p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-2">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-black">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <h3 className="text-xs font-black text-slate-900">Range Anxiety</h3>
                          <p className="text-[11px] text-slate-500 font-medium">Fear of stranding on highway at 5% battery with no backup.</p>
                        </div>
                      </div>

                      {/* Phone Simulation: Legacy vs ChargeAhead */}
                      <div className="flex justify-center">
                        <PhoneFrame>
                          <div className="space-y-3">
                            <div className="p-2.5 bg-red-950/80 border border-red-500/40 rounded-2xl text-white space-y-2 text-xs">
                              <div className="flex items-center justify-between text-red-400 font-black text-[11px]">
                                <span className="flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Legacy Apps (Static Pins)
                                </span>
                                <span>FAIL</span>
                              </div>
                              <div className="p-2 bg-slate-900 rounded-xl border border-red-500/20 text-[10px] text-slate-300">
                                Tata Power Charger marked "Available", but EV driver arrives to find broken screen & no cable output.
                              </div>
                              <div className="flex items-center gap-1.5 text-red-400 font-bold text-[10px]">
                                <Car className="w-3.5 h-3.5 text-red-400" /> Driver stranded at 4% SoC!
                              </div>
                            </div>

                            <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-white space-y-2 text-xs">
                              <div className="flex items-center justify-between text-emerald-400 font-black text-[11px]">
                                <span className="flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> ChargeAhead Verification
                                </span>
                                <span>PASS</span>
                              </div>
                              <div className="p-2 bg-slate-900 rounded-xl border border-emerald-500/20 text-[10px] text-slate-300">
                                Automatically detects broken gun report & reroutes EV driver 8km ahead to 100% verified Statiq Hub.
                              </div>
                              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
                                <Car className="w-3.5 h-3.5 text-emerald-400" /> Safe arrival guaranteed!
                              </div>
                            </div>
                          </div>
                        </PhoneFrame>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* SLIDE 3: THE SOLUTION                                             */}
                {/* ------------------------------------------------------------------ */}
                {currentSlide === 2 && (
                  <div className="grid lg:grid-cols-2 gap-8 items-center text-left">
                    <div className="space-y-4">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">The Core Engine</span>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900">True Charging Availability™</h2>
                      <p className="text-slate-600 font-medium text-sm leading-relaxed">
                        ChargeAhead dynamically calculates a Tri-Factor Confidence Score before guiding EV drivers to any charging gun.
                      </p>

                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0">1</div>
                          <div>
                            <div className="font-extrabold text-slate-900">CPO Live Telemetry Heartbeat</div>
                            <div className="text-[11px] text-slate-500 font-medium">Real-time OCPI hardware sensor status & kW output.</div>
                          </div>
                        </div>

                        <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0">2</div>
                          <div>
                            <div className="font-extrabold text-slate-900">Crowd-Sourced Driver Verification</div>
                            <div className="text-[11px] text-slate-500 font-medium">Rate-limited community check-ins with time-decay logic.</div>
                          </div>
                        </div>

                        <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0">3</div>
                          <div>
                            <div className="font-extrabold text-slate-900">Historical Predictive AI</div>
                            <div className="text-[11px] text-slate-500 font-medium">Time-of-day congestion & queue duration models.</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tablet Simulation: Live Tri-Factor Gauge */}
                    <div className="flex justify-center">
                      <TabletFrame>
                        <div className="flex flex-col h-full justify-between space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              <span>Statiq Fast Hub — Ramanagara</span>
                            </div>
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                              CCS2 DUAL
                            </span>
                          </div>

                          {/* Big Score Dial Simulation */}
                          <div className="text-center space-y-1">
                            <motion.div
                              key={slide3Score}
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              className="text-5xl font-black text-emerald-400 font-mono tracking-tight"
                            >
                              {slide3Score}%
                            </motion.div>
                            <div className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
                              <Car className="w-3.5 h-3.5 text-emerald-400" /> Dynamic Station Confidence Score
                            </div>
                          </div>

                          {/* Sub Score Breakdown */}
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] border-t border-slate-800 pt-3">
                            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                              <div className="text-slate-400 font-bold">CPO Signal</div>
                              <div className="text-white font-extrabold text-xs">96%</div>
                            </div>
                            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                              <div className="text-slate-400 font-bold">Driver Votes</div>
                              <div className="text-emerald-400 font-extrabold text-xs">{slide3Score}%</div>
                            </div>
                            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                              <div className="text-slate-400 font-bold">AI Forecast</div>
                              <div className="text-white font-extrabold text-xs">92%</div>
                            </div>
                          </div>

                          {/* Simulation Action */}
                          <button
                            onClick={() => {
                              setSlide3Voting(true);
                              setSlide3Score((prev) => (prev === 94 ? 72 : 94));
                              setTimeout(() => setSlide3Voting(false), 500);
                            }}
                            className="w-full py-2 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow flex items-center justify-center gap-2 uppercase tracking-wider"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${slide3Voting ? 'animate-spin' : ''}`} />
                            {slide3Score === 94 ? 'Simulate Driver Issue Report (-22%)' : 'Reset Score (94%)'}
                          </button>
                        </div>
                      </TabletFrame>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* SLIDE 4: REAL MAP & OCM API                                       */}
                {/* ------------------------------------------------------------------ */}
                {currentSlide === 3 && (
                  <div className="space-y-6 text-left">
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">GIS & Geocoding</span>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900">Zero-Mock Map Engine</h2>
                      <p className="text-slate-600 font-medium text-sm">
                        Built directly on production GIS standards — live Open Charge Map API telemetry & OSRM polyline rendering.
                      </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6 items-center">
                      <div className="space-y-3">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-3">
                          <MapPin className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-sm font-black text-slate-900">Open Charge Map (OCM) v3 API</h3>
                            <p className="text-xs text-slate-500 font-medium">Queries live EV charger locations, connector types (CCS2, Type 2, GB/T), and power ratings directly.</p>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-3">
                          <Navigation className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-sm font-black text-slate-900">Nominatim & OSRM Engine</h3>
                            <p className="text-xs text-slate-500 font-medium">Real-time place search, reverse geocoding, and driving polyline calculation matching exact road geometry.</p>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-3">
                          <Layers className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-sm font-black text-slate-900">MapLibre GL Triple-Layer Vector</h3>
                            <p className="text-xs text-slate-500 font-medium">High-contrast polyline (`#00FF88` neon green core, dark casing, white outer glow) visible in daylight.</p>
                          </div>
                        </div>
                      </div>

                      {/* Tablet GIS Map Canvas Simulation */}
                      <div className="flex justify-center">
                        <TabletFrame>
                          <div className="relative w-full h-full bg-slate-950 rounded-xl overflow-hidden flex flex-col justify-between p-3 border border-slate-800">
                            {/* Simulated Map Canvas Polyline */}
                            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                            <div className="relative z-10 flex items-center justify-between text-[11px] font-bold text-white">
                              <span className="bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-xl flex items-center gap-1.5">
                                <Car className="w-3.5 h-3.5 text-emerald-400" /> MapLibre GL Vector Tile Canvas
                              </span>
                              <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 text-[10px]">
                                OCM LIVE API CONNECTED
                              </span>
                            </div>

                            {/* Polyline Path SVG Simulation */}
                            <div className="relative h-36 my-2">
                              <svg className="w-full h-full" viewBox="0 0 400 120" fill="none">
                                {/* Outer Glow Layer */}
                                <path d="M 20 100 Q 120 20 220 70 T 380 30" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" opacity="0.8" />
                                {/* Dark Casing Layer */}
                                <path d="M 20 100 Q 120 20 220 70 T 380 30" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                                {/* Neon Green Core Layer */}
                                <path d="M 20 100 Q 120 20 220 70 T 380 30" stroke="#00FF88" strokeWidth="4" strokeLinecap="round" />
                              </svg>

                              {/* OCM Station Pin 1 */}
                              <div className="absolute left-[110px] top-[15px] p-1.5 bg-emerald-500 text-slate-950 rounded-full shadow-lg font-black text-[10px] flex items-center gap-1">
                                <Zap className="w-3 h-3 fill-current" /> Statiq Hub (96%)
                              </div>

                              {/* OCM Station Pin 2 */}
                              <div className="absolute left-[210px] top-[55px] p-1.5 bg-emerald-500 text-slate-950 rounded-full shadow-lg font-black text-[10px] flex items-center gap-1">
                                <Zap className="w-3 h-3 fill-current" /> Tata Power (91%)
                              </div>

                              {/* Animated Car Driving Marker */}
                              <motion.div
                                animate={{ x: [20, 200, 360], y: [70, 35, 10] }}
                                transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
                                className="absolute top-0 left-0 w-7 h-7 rounded-full bg-white border-2 border-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-2xl"
                              >
                                <Car className="w-4 h-4 text-emerald-600" />
                              </motion.div>
                            </div>

                            <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                              <span>Zoom: 12.4 · Lat: 12.9716, Lng: 77.5946</span>
                              <span className="text-emerald-400 font-mono">Polyline: 560km OSRM</span>
                            </div>
                          </div>
                        </TabletFrame>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* SLIDE 5: AI ROUTE OPTIMIZATION                                    */}
                {/* ------------------------------------------------------------------ */}
                {currentSlide === 4 && (
                  <div className="grid lg:grid-cols-2 gap-8 items-center text-left">
                    <div className="space-y-4">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Corridor Planning</span>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900">EV Corridor Smart Planner</h2>
                      <p className="text-slate-600 font-medium text-sm leading-relaxed">
                        Select vehicle model, input battery %, and let ChargeAhead calculate exact highway discharge curves & auto-insert verified OCM charging stops.
                      </p>

                      <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <Car className="w-4 h-4 text-emerald-600" /> Tata Nexon EV MAX (40.5 kWh)
                          </span>
                          <span className="text-emerald-600 font-black">CCS2 Plug</span>
                        </div>

                        {/* Interactive Battery Slider in Slide */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-600">Initial Battery Charge:</span>
                            <span className="text-emerald-600 font-black">{slide5Soc}%</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            step={5}
                            value={slide5Soc}
                            onChange={(e) => setSlide5Soc(Number(e.target.value))}
                            className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Phone Planner Mockup Simulation */}
                    <div className="flex justify-center">
                      <PhoneFrame>
                        <div className="space-y-3">
                          <div className="text-xs font-black text-white flex items-center justify-between border-b border-slate-800 pb-2">
                            <span>Route Breakdown</span>
                            <span className="text-emerald-400 font-mono">560 km</span>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5 text-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px]">
                            <div>
                              <div className="text-slate-400 font-bold">Dist</div>
                              <div className="font-black text-emerald-400">560 km</div>
                            </div>
                            <div>
                              <div className="text-slate-400 font-bold">Drive</div>
                              <div className="font-black text-white">8h 15m</div>
                            </div>
                            <div>
                              <div className="text-slate-400 font-bold">Charge</div>
                              <div className="font-black text-emerald-400">45m</div>
                            </div>
                            <div>
                              <div className="text-slate-400 font-bold">Cost</div>
                              <div className="font-black text-emerald-400">₹680</div>
                            </div>
                          </div>

                          {/* Calculated Stop Card */}
                          <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-1.5 text-xs text-white">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-black text-emerald-400 flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 fill-current" /> Stop 1: Statiq Chitradurga
                              </span>
                              <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                96% Reliable
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-300 font-medium">
                              Arrive: <strong className="text-white">20% SOC</strong> · Charge to: <strong className="text-emerald-400">80% SOC</strong> (35 mins)
                            </div>
                          </div>

                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] text-slate-300 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Car className="w-3.5 h-3.5 text-emerald-400" /> Remaining to Destination:
                            </span>
                            <span className="font-bold text-white">42% battery at arrival</span>
                          </div>
                        </div>
                      </PhoneFrame>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* SLIDE 6: DRIVER CO-PILOT & IN-APP PAY                              */}
                {/* ------------------------------------------------------------------ */}
                {currentSlide === 5 && (
                  <div className="grid lg:grid-cols-2 gap-8 items-center text-left">
                    <div className="space-y-4">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Active Navigation</span>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900">In-App QR Pay & Co-Pilot</h2>
                      <p className="text-slate-600 font-medium text-sm leading-relaxed">
                        Floating driver co-pilot panel provides step-by-step guidance, vehicle discharge tracking, integrated QR code scanner, and real-time charging progress monitoring.
                      </p>

                      <div className="space-y-2 text-xs">
                        <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-800">Unified In-App QR Code Charger Activation</span>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-800">Live kW Speed & kWh Session Energy Tracker</span>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-800">Auto-Resume Trip Navigation upon Full Charge</span>
                        </div>
                      </div>
                    </div>

                    {/* Phone Charging Simulation */}
                    <div className="flex justify-center">
                      <PhoneFrame>
                        <div className="space-y-3 text-center">
                          <div className="relative w-16 h-16 mx-auto flex items-center justify-center mt-2">
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping" />
                            <div className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-2xl">
                              <Zap className="w-7 h-7 fill-current animate-bounce" />
                            </div>
                          </div>

                          <div>
                            <h3 className="text-xs font-black text-white">CCS2 Fast Charging Active</h3>
                            <p className="text-[10px] text-emerald-400 font-bold">Zeon Hub · Gun #2</p>
                          </div>

                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-left">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-400 font-bold flex items-center gap-1">
                                <Car className="w-3.5 h-3.5 text-emerald-400" /> Battery SoC:
                              </span>
                              <span className="text-emerald-400 font-mono font-black">{slide6Soc}%</span>
                            </div>

                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${slide6Soc}%` }} />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-center text-[10px] pt-1">
                              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                                <div className="text-slate-400">Charging Speed</div>
                                <div className="font-mono text-emerald-400 font-black text-xs">58 kW</div>
                              </div>
                              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                                <div className="text-slate-400">Energy Delivered</div>
                                <div className="font-mono text-white font-black text-xs">{slide6Kwh} kWh</div>
                              </div>
                            </div>
                          </div>

                          <button className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow flex items-center justify-center gap-1.5">
                            <QrCode className="w-4 h-4" /> Scan QR to Stop Session
                          </button>
                        </div>
                      </PhoneFrame>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* SLIDE 7: COMMUNITY TRUST                                          */}
                {/* ------------------------------------------------------------------ */}
                {currentSlide === 6 && (
                  <div className="grid lg:grid-cols-2 gap-8 items-center text-left">
                    <div className="space-y-4">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Crowd Intelligence</span>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900">Community Trust Engine</h2>
                      <p className="text-slate-600 font-medium text-sm leading-relaxed">
                        Drivers flag broken plugs, blocked spots, or payment glitches with single-select category chips. Corroborating "Me too" votes dynamically update station confidence ratings.
                      </p>

                      <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs shadow-sm">
                        <div className="font-black text-slate-900 uppercase tracking-wide text-[11px]">Anti-Spam Mitigations</div>
                        <p className="text-slate-600 font-medium">• 30-min per-user rate limit per station.</p>
                        <p className="text-slate-600 font-medium">• 3-hour linear time-decay automatically clears unconfirmed reports.</p>
                      </div>
                    </div>

                    {/* Phone Report & Corroboration Mockup */}
                    <div className="flex justify-center">
                      <PhoneFrame>
                        <div className="space-y-3 text-xs">
                          <div className="flex items-center justify-between text-white border-b border-slate-800 pb-2">
                            <span className="font-black">Station Incident Feed</span>
                            <span className="text-[10px] text-amber-400 font-bold bg-amber-950 border border-amber-500/30 px-2 py-0.5 rounded-md">
                              REPORTED ISSUE
                            </span>
                          </div>

                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-white">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs">Divya Nair (EV Driver)</span>
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                                Payment Issue
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                              "UPI payment timing out on Gun #1, credit card working."
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-slate-400">12 mins ago</span>
                              <button
                                onClick={() => {
                                  if (!slide7Voted) {
                                    setSlide7Votes(slide7Votes + 1);
                                    setSlide7Voted(true);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all ${
                                  slide7Voted
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900'
                                }`}
                              >
                                <ThumbsUp className="w-3 h-3" /> Me too ({slide7Votes})
                              </button>
                            </div>
                          </div>

                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] text-slate-300 flex items-center gap-2">
                            <Car className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Corroboration triggers mid-trip reroute alerts for nearby EV drivers.</span>
                          </div>
                        </div>
                      </PhoneFrame>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* SLIDE 8: OPERATOR CONTROL                                         */}
                {/* ------------------------------------------------------------------ */}
                {currentSlide === 7 && (
                  <div className="space-y-6 text-left">
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Network Operations</span>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900">Closed-Loop Operator Portal (`/operator`)</h2>
                      <p className="text-slate-600 font-medium text-sm max-w-3xl">
                        Charge CPOs receive real-time incident tickets. Resolving an issue immediately restores the station's confidence score across driver navigation maps.
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <TabletFrame>
                        <div className="flex flex-col h-full justify-between space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <Wrench className="w-4 h-4 text-emerald-400" />
                              <span className="font-black text-white text-xs">CPO Operator Action Queue</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                              3 Active Incidents
                            </span>
                          </div>

                          {/* Ticket Item */}
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-white">
                            <div>
                              <div className="font-extrabold text-white flex items-center gap-2">
                                Statiq Connaught Hub — Gun #1 Down
                                <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${
                                  slide8TicketStatus === 'Resolved'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                                }`}>
                                  {slide8TicketStatus}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">Reported 12m ago · 4 driver corroborations</div>
                            </div>

                            <button
                              onClick={() => setSlide8TicketStatus(slide8TicketStatus === 'In Progress' ? 'Resolved' : 'In Progress')}
                              className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition-all shadow ${
                                slide8TicketStatus === 'In Progress'
                                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {slide8TicketStatus === 'In Progress' ? 'Resolve & Restore Score' : 'Re-open Ticket'}
                            </button>
                          </div>

                          <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Station Confidence Rating:
                            </span>
                            <span className="font-black font-mono text-emerald-400 text-sm">
                              {slide8TicketStatus === 'Resolved' ? '96% (RESTORED)' : '72% (DEGRADED)'}
                            </span>
                          </div>
                        </div>
                      </TabletFrame>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* SLIDE 9: ECOSYSTEM BENEFITS                                       */}
                {/* ------------------------------------------------------------------ */}
                {currentSlide === 8 && (
                  <div className="space-y-6 text-left">
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Value Proposition</span>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900">Win-Win Ecosystem Impact</h2>
                      <p className="text-slate-600 font-medium text-sm">
                        Delivering unmatched reliability to EV drivers and higher asset utilization to CPO operators.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-xl space-y-4">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                          <Car className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900">For EV Drivers</h3>
                        <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Zero charging anxiety — 100% verified usable chargers.</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Proactive mid-trip rerouting before hitting broken plugs.</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Single unified app for route planning & charging payment.</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900">For Station Operators (CPOs)</h3>
                        <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Higher station utilization & increased daily kWh revenue.</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Instant community incident flagging & fast MTTR resolution.</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Direct rider trust built on transparent confidence ratings.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* SLIDE 10: LAUNCH CTA                                              */}
                {/* ------------------------------------------------------------------ */}
                {currentSlide === 9 && (
                  <div className="text-center space-y-6 py-4">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto font-black shadow-2xl animate-bounce">
                      <Zap className="w-8 h-8 fill-current" />
                    </div>

                    <div className="space-y-2 max-w-2xl mx-auto">
                      <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Experience ChargeAhead Live
                      </h2>
                      <p className="text-slate-600 font-medium text-sm md:text-base">
                        Don't just find chargers. Know if they'll work before you arrive.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                      <Link
                        href="/app/home"
                        onClick={onClose}
                        className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-2xl transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        <Car className="w-4 h-4" /> Launch App Now <ArrowRight className="w-4 h-4" />
                      </Link>

                      <Link
                        href="/operator"
                        onClick={onClose}
                        className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-black hover:bg-slate-900 text-white font-black text-xs shadow-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        <Wrench className="w-4 h-4 text-emerald-400" /> Explore CPO Operator Portal
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Bar Navigation */}
          <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 z-20">
            {/* Slide Navigation Thumbnails */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0">
              {SLIDE_METADATA.map((slide, idx) => {
                const isActive = currentSlide === idx;
                return (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlide(idx)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1 shrink-0 ${
                      isActive
                        ? 'bg-slate-900 text-emerald-400 shadow-md scale-105'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    <span className="hidden sm:inline">{slide.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Prev / Next Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={prevSlide}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center gap-1 transition-all border border-slate-200"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={nextSlide}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md transition-all uppercase tracking-wider"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
