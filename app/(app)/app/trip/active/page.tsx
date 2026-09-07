'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MapPin, Zap, AlertTriangle, Battery, Clock, CheckCircle2, RotateCcw } from 'lucide-react';
import { MapComponent } from '@/components/shared/MapComponent';
import { ChargingProgressBar } from '@/components/shared/ChargingProgressBar';
import { useTripStore } from '@/lib/store/tripStore';
import { useVehicleStore } from '@/lib/store/vehicleStore';
import { useMockLiveUpdates } from '@/hooks/useMockLiveUpdates';
import { MOCK_TRIPS } from '@/lib/mock/trips';
import { MOCK_STATIONS } from '@/lib/mock/stations';
import { startChargingSession, stopChargingSession } from '@/lib/mock/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TripPhase = 'driving' | 'arriving' | 'charging' | 'complete';

export default function ActiveTripPage() {
  const router = useRouter();
  const { activeVehicle } = useVehicleStore();
  const { rerouteAlert, acceptReroute, dismissReroute } = useTripStore();
  const [phase, setPhase] = useState<TripPhase>('driving');
  const [chargePercent, setChargePercent] = useState(activeVehicle?.currentChargePercent ?? 68);
  const [energyKwh, setEnergyKwh] = useState(0);
  const [costAccrued, setCostAccrued] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(42);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [tripComplete, setTripComplete] = useState(false);

  // Load demo trip
  const trip = MOCK_TRIPS[0];
  const nextStop = trip.stops[0];
  const alternativeStation = MOCK_STATIONS[2]; // Ather Grid as alt

  // Enable live updates with reroute scripted event
  useMockLiveUpdates({ enableReroute: true });

  // Simulate driving → arriving after 8s
  useEffect(() => {
    const t = setTimeout(() => setPhase('arriving'), 8000);
    return () => clearTimeout(t);
  }, []);

  // Simulate charging progress when session active
  useEffect(() => {
    if (phase !== 'charging') return;
    const interval = setInterval(() => {
      setChargePercent((p) => {
        const next = Math.min(p + 0.6, 80);
        if (next >= 80) { clearInterval(interval); setPhase('complete'); }
        return next;
      });
      setEnergyKwh((e) => parseFloat((e + 0.14).toFixed(2)));
      setCostAccrued((c) => parseFloat((c + 2.0).toFixed(2)));
      setTimeRemaining((t) => Math.max(0, t - 1));
    }, 2000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleStartCharging = async () => {
    setLoadingSession(true);
    try {
      const session = await startChargingSession('bk-001', 'p001-1');
      setSessionId(session.id);
      setPhase('charging');
      toast.success('⚡ Charging started!');
    } catch {
      toast.error('Failed to start session. Please retry.');
    } finally {
      setLoadingSession(false);
    }
  };

  const handleStopCharging = async () => {
    if (!sessionId) return;
    try {
      const result = await stopChargingSession(sessionId);
      toast.success(`Charging complete! ₹${result.finalCostInr} · ${result.energyKwh} kWh`);
      setPhase('complete');
    } catch {
      toast.error('Error stopping session.');
    }
  };

  const handleEndTrip = () => {
    setTripComplete(true);
    toast.success('🎉 Trip complete! ChargeAhead saved you 18 min of wait time.');
    setTimeout(() => router.push('/app/trips'), 2500);
  };

  const route = [
    { lat: 12.9116, lng: 77.6389 },
    { lat: 12.9200, lng: 77.6300 },
    { lat: 12.9352, lng: 77.6245 },
    { lat: 12.3200, lng: 77.0000 },
    { lat: 12.3052, lng: 76.6552 },
  ];

  if (tripComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-hero-gradient"
      >
        <motion.div animate={{ scale: [0.8, 1.1, 1] }} transition={{ duration: 0.6 }}>
          <div className="w-24 h-24 rounded-full bg-mint-400/15 flex items-center justify-center mb-6 mx-auto">
            <CheckCircle2 className="w-12 h-12 text-mint-400" />
          </div>
        </motion.div>
        <h1 className="text-3xl font-bold text-white mb-2">Trip Complete!</h1>
        <p className="text-white/60 mb-8">Heading to Mysore Palace</p>
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{trip.totalDistanceKm}km</div>
            <div className="text-[10px] text-white/40 mt-1">Distance</div>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-mint-400">₹{Math.round(costAccrued + 0)}</div>
            <div className="text-[10px] text-white/40 mt-1">Charged</div>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-teal-300">18m</div>
            <div className="text-[10px] text-white/40 mt-1">Time saved</div>
          </div>
        </div>
        <p className="text-sm text-mint-400 font-semibold">ChargeAhead predicted congestion & saved you 18 minutes of waiting.</p>
      </motion.div>
    );
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden relative">
      {/* Full-screen map */}
      <MapComponent
        stations={[nextStop.station]}
        route={route}
        height="100%"
        className="absolute inset-0"
        userLocation={{ lat: 12.9116, lng: 77.6389 }}
        selectedStationId={nextStop.stationId}
      />

      {/* Top overlay */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className={cn('w-2.5 h-2.5 rounded-full animate-pulse', phase === 'driving' ? 'bg-mint-400' : phase === 'charging' ? 'bg-amber-400' : 'bg-teal-300')} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {phase === 'driving' && '→ Mysore Palace via Koramangala Hub'}
              {phase === 'arriving' && 'Arriving at charging stop…'}
              {phase === 'charging' && 'Charging at Nexcharge Koramangala'}
              {phase === 'complete' && 'Charging complete — continue journey'}
            </p>
            <p className="text-xs text-white/50">
              {phase === 'driving' && `Next stop: ${nextStop.station.name} · ${nextStop.arrivalBatteryPercent}% on arrival`}
              {phase === 'arriving' && 'Pull into bay 3 • Show QR code'}
              {phase === 'charging' && `${timeRemaining} min remaining`}
              {phase === 'complete' && 'Ready to continue to Mysore'}
            </p>
          </div>
          <Battery className={cn('w-5 h-5 shrink-0', chargePercent > 50 ? 'text-mint-400' : chargePercent > 20 ? 'text-amber-400' : 'text-red-400')} />
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-navy-900 rounded-t-3xl border-t border-surface-border shadow-sheet px-5 pt-3 pb-safe"
        >
          <div className="sheet-handle" />

          {phase === 'driving' && (
            <div className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-white/50">Next stop</p>
                  <p className="font-bold text-white">{nextStop.station.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 text-white/40" />
                    <span className="text-xs text-white/50">~12 min · {nextStop.arrivalBatteryPercent}% on arrival</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/50">Battery</p>
                  <p className="text-2xl font-bold text-mint-400">{Math.round(chargePercent)}%</p>
                </div>
              </div>
              <div className="charge-bar mb-4">
                <div className="charge-bar-fill" style={{ width: `${chargePercent}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="glass-card rounded-xl p-2.5">
                  <div className="text-sm font-bold text-white">151 km</div>
                  <div className="text-[10px] text-white/40">total trip</div>
                </div>
                <div className="glass-card rounded-xl p-2.5">
                  <div className="text-sm font-bold text-white">{trip.estimatedCostInr ? `₹${trip.estimatedCostInr}` : '₹285'}</div>
                  <div className="text-[10px] text-white/40">est. cost</div>
                </div>
                <div className="glass-card rounded-xl p-2.5">
                  <div className="text-sm font-bold text-teal-300">18m saved</div>
                  <div className="text-[10px] text-white/40">vs. no plan</div>
                </div>
              </div>
            </div>
          )}

          {phase === 'arriving' && (
            <div className="pb-4">
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-teal-DEFAULT/10 border border-teal-DEFAULT/30">
                <MapPin className="w-5 h-5 text-teal-300 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-teal-300">Arriving at Nexcharge Koramangala</p>
                  <p className="text-xs text-white/60">Head to Bay 3 · Show QR code or enter CA7291</p>
                </div>
              </div>
              <button
                onClick={handleStartCharging}
                disabled={loadingSession}
                className="w-full py-3.5 rounded-xl bg-mint-gradient text-navy-900 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
              >
                {loadingSession ? <div className="w-5 h-5 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" /> : <>⚡ Start Charging</>}
              </button>
            </div>
          )}

          {phase === 'charging' && (
            <div className="pb-4">
              <ChargingProgressBar
                currentPercent={Math.round(chargePercent)}
                targetPercent={80}
                powerKw={50}
                energyKwh={energyKwh}
                costInr={costAccrued}
                timeRemainingMinutes={timeRemaining}
                large
              />
              <button
                onClick={handleStopCharging}
                className="w-full mt-4 py-3 rounded-xl border border-red-400/40 text-red-400 font-semibold text-sm hover:bg-red-400/5 transition-all"
              >
                Stop Charging
              </button>
            </div>
          )}

          {phase === 'complete' && (
            <div className="pb-4">
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-mint-400/10 border border-mint-400/30">
                <CheckCircle2 className="w-5 h-5 text-mint-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-mint-400">Charged to 80% ⚡</p>
                  <p className="text-xs text-white/60">{energyKwh.toFixed(1)} kWh delivered · ₹{Math.round(costAccrued)}</p>
                </div>
              </div>
              <button
                onClick={handleEndTrip}
                className="w-full py-3.5 rounded-xl bg-mint-gradient text-navy-900 font-bold text-sm hover:opacity-90"
              >
                Continue to Mysore →
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Reroute alert */}
      <AnimatePresence>
        {rerouteAlert && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute top-20 left-4 right-4 z-30 glass-card rounded-2xl p-4 border border-amber-400/40"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-400 mb-1">Route Update</p>
                <p className="text-xs text-white/70 mb-3">{rerouteAlert.message}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { acceptReroute(); toast.success('Route updated to Ather Grid MG Road'); }}
                    className="flex-1 py-2 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-400 text-xs font-bold hover:bg-amber-400/25 transition-all"
                  >
                    Accept Reroute
                  </button>
                  <button
                    onClick={() => { dismissReroute(); toast.info('Keeping original route'); }}
                    className="px-4 py-2 rounded-xl border border-surface-border text-white/50 text-xs font-medium hover:text-white hover:border-white/20 transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
