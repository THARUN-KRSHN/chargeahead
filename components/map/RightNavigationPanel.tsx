'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  Zap,
  Battery,
  Clock,
  QrCode,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Play,
  RotateCcw,
  X,
  Sparkles,
} from 'lucide-react';
import type { RealRoutePlan, RealRouteStop } from '@/lib/api/geoServices';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RightNavigationPanelProps {
  plan: RealRoutePlan;
  onEndJourney: () => void;
}

type NavStep = 'driving' | 'arrived_at_station' | 'payment' | 'charging' | 'trip_completed';

export function RightNavigationPanel({ plan, onEndJourney }: RightNavigationPanelProps) {
  const [navStep, setNavStep] = useState<NavStep>('driving');
  const [currentStopIndex, setCurrentStopIndex] = useState<number>(0);
  const activeStop: RealRouteStop | undefined = plan.stops[currentStopIndex];

  // Battery simulation state
  const [liveBattery, setLiveBattery] = useState<number>(plan.startChargePercent);
  const [chargingProgress, setChargingProgress] = useState<number>(0);
  const [kwhDelivered, setKwhDelivered] = useState<number>(0);
  const [selectedPort, setSelectedPort] = useState<string>('CCS2 — 60 kW Fast Plug');

  // Driving step index
  const [currentDirStep, setCurrentDirStep] = useState<number>(0);

  // Simulated vehicle movement / battery drain during driving
  useEffect(() => {
    if (navStep !== 'driving') return;
    const timer = setInterval(() => {
      setLiveBattery((prev) => {
        if (prev <= (activeStop ? activeStop.arrivalChargePercent : 15)) return prev;
        return prev - 1;
      });

      setCurrentDirStep((prev) => (prev + 1) % Math.max(1, plan.drivingSteps.length));
    }, 4000);
    return () => clearInterval(timer);
  }, [navStep, activeStop, plan.drivingSteps.length]);

  // Live Charging Simulation Timer
  useEffect(() => {
    if (navStep !== 'charging' || !activeStop) return;

    setChargingProgress(activeStop.arrivalChargePercent);
    setKwhDelivered(0);

    const target = activeStop.targetChargePercent;
    const capacity = plan.vehicle.evModel?.batteryCapacityKwh ?? 40;
    const totalKwh = Math.round(((target - activeStop.arrivalChargePercent) / 100) * capacity);

    const interval = setInterval(() => {
      setChargingProgress((prev) => {
        if (prev >= target) {
          clearInterval(interval);
          return target;
        }
        return prev + 2;
      });

      setKwhDelivered((prev) => {
        if (prev >= totalKwh) return totalKwh;
        return Math.min(totalKwh, prev + 1.5);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [navStep, activeStop, plan.vehicle.evModel?.batteryCapacityKwh]);

  const currentInstruction =
    plan.drivingSteps[currentDirStep]?.instruction ||
    `Continue on main highway towards ${plan.destination.label}`;

  const notifications = useNotificationStore((state) => state.notifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const activeRerouteAlert = notifications.find((n) => !n.isRead && n.type === 'reroute_alert');

  return (
    <motion.div
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="absolute top-0 right-0 bottom-0 w-full md:w-[400px] bg-white text-slate-900 border-l border-slate-200 shadow-2xl z-40 flex flex-col overflow-hidden"
    >
      {/* Navigation Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black animate-pulse shadow-md">
            <Navigation className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Active Navigation</div>
            <div className="text-sm font-black text-slate-900 truncate max-w-[200px]">
              {plan.destination.label}
            </div>
          </div>
        </div>

        <button
          onClick={onEndJourney}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors border border-slate-200"
        >
          Exit Route
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* High Severity Live Mid-Trip Reroute Banner */}
        {activeRerouteAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 border-2 border-red-500 rounded-2xl space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-between text-xs text-red-700 font-extrabold">
              <span className="flex items-center gap-1.5 uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-red-600" /> {activeRerouteAlert.title}
              </span>
              <button onClick={() => markRead(activeRerouteAlert.id)} className="text-slate-500 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-800 font-medium leading-relaxed">
              {activeRerouteAlert.body}
            </p>
            <div className="pt-1 flex gap-2">
              <button
                onClick={() => {
                  toast.success('Rerouted to nearest optimal EV charging hub! ⚡');
                  markRead(activeRerouteAlert.id);
                }}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow uppercase tracking-wider"
              >
                Accept Alternative Stop
              </button>
            </div>
          </motion.div>
        )}

        {/* Real-Time Driver Guidance Card */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-emerald-800 font-extrabold">
            <span className="flex items-center gap-1.5 tracking-wider">
              <Navigation className="w-3.5 h-3.5 text-emerald-600" /> DRIVER INSTRUCTION
            </span>
            <span>Step {currentDirStep + 1}/{Math.max(1, plan.drivingSteps.length)}</span>
          </div>
          <p className="text-sm font-black text-slate-900 leading-snug">{currentInstruction}</p>
        </div>

        {/* Live Battery Gauge & Range */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs font-extrabold">
            <span className="text-slate-700 flex items-center gap-1.5">
              <Battery className="w-4 h-4 text-emerald-600" /> Vehicle Battery Status
            </span>
            <span className="text-emerald-600 font-black">{navStep === 'charging' ? chargingProgress : liveBattery}%</span>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${navStep === 'charging' ? chargingProgress : liveBattery}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 font-bold pt-0.5">
            <span>Model: {plan.vehicle.nickname || `${plan.vehicle.evModel?.make} ${plan.vehicle.evModel?.model}`}</span>
            <span>Est Range: {Math.round((liveBattery / 100) * (plan.vehicle.evModel?.rangKm ?? 350))} km</span>
          </div>
        </div>

        {/* Dynamic Nav Step Flow */}
        <AnimatePresence mode="wait">
          {/* STEP 1: Driving to Next Charging Station */}
          {navStep === 'driving' && (
            <motion.div
              key="driving"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {activeStop ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4 fill-current text-emerald-600" /> Next Charging Stop
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {activeStop.station.confidenceScore}% Reliable
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900">{activeStop.station.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{activeStop.station.operator} · {activeStop.station.address}</p>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-center text-xs">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                      <div className="text-[10px] text-slate-500 font-extrabold uppercase">Arrival Charge</div>
                      <div className="font-black text-emerald-600 text-sm">{activeStop.arrivalChargePercent}%</div>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                      <div className="text-[10px] text-slate-500 font-extrabold uppercase">Est Charge Time</div>
                      <div className="font-black text-slate-900 text-sm">{activeStop.chargeTimeMin} min</div>
                    </div>
                  </div>

                  {/* Simulate Station Arrival CTA */}
                  <button
                    onClick={() => setNavStep('arrived_at_station')}
                    className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all uppercase tracking-wider mt-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-950" /> Simulate Arrival at Station
                  </button>
                </div>
              ) : (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Direct Route — Destination Ahead</h4>
                  <p className="text-xs text-slate-500 font-bold">No charging stops required for this leg.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: Arrived at Station & Operator Payment Check */}
          {navStep === 'arrived_at_station' && activeStop && (
            <motion.div
              key="arrived"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-black uppercase tracking-wider">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> ChargeAhead Pay Partner Station
                </div>

                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  This station operator (<strong className="text-slate-900">{activeStop.station.operator}</strong>) allows direct charge activation & payment through ChargeAhead!
                </p>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600 font-bold">
                    <span>Selected Plug:</span>
                    <span className="font-extrabold text-slate-900">CCS2 Dual 60kW</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-bold">
                    <span>Tariff Rate:</span>
                    <span className="font-black text-emerald-600">₹{activeStop.station.pricePerKwh}/kWh</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-bold">
                    <span>Estimated Session Cost:</span>
                    <span className="font-black text-emerald-600">₹{activeStop.cost}</span>
                  </div>
                </div>

                <button
                  onClick={() => setNavStep('payment')}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                >
                  <CreditCard className="w-4 h-4" /> View Payment Instructions & Start
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Payment Instructions & QR Code Scan */}
          {navStep === 'payment' && activeStop && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-center">
                <div className="inline-flex p-3 bg-white border border-slate-200 rounded-2xl shadow-lg mx-auto">
                  <QrCode className="w-24 h-24 text-slate-900" />
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900">Scan Charger QR Code</h4>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">Plug vehicle in and authorize payment</p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl text-left text-xs space-y-1">
                  <div className="flex justify-between text-slate-500 font-bold">
                    <span>Operator:</span>
                    <span className="text-slate-900 font-black">{activeStop.station.operator}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-bold">
                    <span>Target Charge:</span>
                    <span className="text-emerald-600 font-black">{activeStop.targetChargePercent}%</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-bold">
                    <span>Total Amount:</span>
                    <span className="text-emerald-600 font-black">₹{activeStop.cost}</span>
                  </div>
                </div>

                <button
                  onClick={() => setNavStep('charging')}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                >
                  <Zap className="w-4 h-4 fill-current" /> Pay & Start Charging Session
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Live Charging Progress Screen */}
          {navStep === 'charging' && activeStop && (
            <motion.div
              key="charging"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="p-5 bg-slate-50 border border-emerald-300 rounded-2xl space-y-4 text-center">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping" />
                  <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-2xl">
                    <Zap className="w-8 h-8 fill-current animate-bounce" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">Charging In Progress</h3>
                  <p className="text-xs text-emerald-700 font-extrabold">{activeStop.station.name}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-500 font-extrabold uppercase">Speed</div>
                    <div className="font-black text-emerald-600 text-sm">58 kW</div>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-500 font-extrabold uppercase">Energy</div>
                    <div className="font-black text-slate-900 text-sm">{kwhDelivered} kWh</div>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-500 font-extrabold uppercase">Target</div>
                    <div className="font-black text-emerald-600 text-sm">{activeStop.targetChargePercent}%</div>
                  </div>
                </div>

                {chargingProgress >= activeStop.targetChargePercent ? (
                  <div className="p-3 bg-emerald-500 text-slate-950 rounded-xl font-black text-xs shadow-xl animate-bounce">
                    Charging Complete! Vehicle ready to roll.
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 font-bold flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> Approx 12 mins remaining
                  </div>
                )}

                <button
                  onClick={() => {
                    setLiveBattery(activeStop.targetChargePercent);
                    if (currentStopIndex + 1 < plan.stops.length) {
                      setCurrentStopIndex(currentStopIndex + 1);
                      setNavStep('driving');
                    } else {
                      setNavStep('trip_completed');
                    }
                  }}
                  className="w-full py-3.5 rounded-xl bg-black hover:bg-slate-900 text-emerald-400 font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Complete Charging & Resume Trip
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Trip Completed */}
          {navStep === 'trip_completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto font-black shadow-xl">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900">You Have Reached {plan.destination.label}!</h3>
              <p className="text-xs text-slate-600 font-bold">Total Distance: {plan.totalDistanceKm} km · Battery Remaining: {liveBattery}%</p>

              <button
                onClick={onEndJourney}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-xl transition-all uppercase tracking-wider"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
