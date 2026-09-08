'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MapPin,
  Zap,
  Battery,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  MessageSquare,
  CornerUpRight,
  Navigation,
  LocateFixed,
  ChevronLeft,
} from 'lucide-react';
import { MapComponent } from '@/components/shared/MapComponent';
import { ChargingProgressBar } from '@/components/shared/ChargingProgressBar';
import { ReportIssueSheet } from '@/components/shared/ReportIssueSheet';
import { useTripStore } from '@/lib/store/tripStore';
import { useVehicleStore } from '@/lib/store/vehicleStore';
import { useReportStore } from '@/lib/services/reportStore';
import { useMockLiveUpdates } from '@/hooks/useMockLiveUpdates';
import { speakText, stopSpeaking } from '@/lib/utils/voiceAssistant';
import { MOCK_TRIPS } from '@/lib/mock/trips';
import { ENROUTE_FALLBACK_STATIONS } from '@/lib/api/geminiRoutePlanner';
import { startChargingSession, stopChargingSession } from '@/lib/mock/api';
import { getBookingById, DYNAMIC_BOOKINGS } from '@/lib/mock/bookings';
import { getStationById } from '@/lib/mock/stations';
import { fetchOSRMRoute, type RouteStepInstruction } from '@/lib/api/geoServices';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { LatLng, ChargingStation } from '@/types';

type TripPhase = 'driving' | 'arriving' | 'charging' | 'complete';

// Fallback interpolation if OSRM response is delayed
function generateSmoothWaypoints(origin: LatLng, destination: LatLng, totalSteps = 50): LatLng[] {
  const points: LatLng[] = [];
  const midLat = (origin.lat + destination.lat) / 2 + 0.003;
  const midLng = (origin.lng + destination.lng) / 2 + 0.003;

  for (let i = 0; i <= totalSteps; i++) {
    const t = i / totalSteps;
    const lat = (1 - t) * (1 - t) * origin.lat + 2 * (1 - t) * t * midLat + t * t * destination.lat;
    const lng = (1 - t) * (1 - t) * origin.lng + 2 * (1 - t) * t * midLng + t * t * destination.lng;
    points.push({ lat, lng });
  }
  return points;
}

function ActiveTripContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const stationId = searchParams.get('stationId');

  const { activeVehicle } = useVehicleStore();
  const { activeTrip } = useTripStore();
  const computeConfidenceScore = useReportStore((state) => state.computeConfidenceScore);

  const [phase, setPhase] = useState<TripPhase>('driving');
  const [chargePercent, setChargePercent] = useState(activeVehicle?.currentChargePercent ?? 68);
  const [energyKwh, setEnergyKwh] = useState(0);
  const [costAccrued, setCostAccrued] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(35);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [tripComplete, setTripComplete] = useState(false);

  // Voice Assistant & Community Report states
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [followVehicle, setFollowVehicle] = useState(true);

  // OSRM Real Road Route states
  const [osrmWaypoints, setOsrmWaypoints] = useState<LatLng[]>([]);
  const [osrmDistanceKm, setOsrmDistanceKm] = useState<number>(5.1);
  const [osrmDurationMin, setOsrmDurationMin] = useState<number>(8);
  const [osrmSteps, setOsrmSteps] = useState<RouteStepInstruction[]>([]);

  // Dynamic target station resolution based on URL params / activeTrip / DYNAMIC_BOOKINGS
  const targetStation: ChargingStation = useMemo(() => {
    if (bookingId) {
      const booking = getBookingById(bookingId);
      if (booking?.station) return booking.station;
    }
    if (stationId) {
      const station = getStationById(stationId);
      if (station) return station;
    }
    if (activeTrip?.stops?.[0]?.station) {
      return activeTrip.stops[0].station;
    }
    if (DYNAMIC_BOOKINGS.length > 0 && DYNAMIC_BOOKINGS[0].station) {
      return DYNAMIC_BOOKINGS[0].station;
    }
    return (
      ENROUTE_FALLBACK_STATIONS.find((s) => s.id === 'st-zeon-edappal') ||
      MOCK_TRIPS[0].stops[0].station
    );
  }, [bookingId, stationId, activeTrip]);

  // Destination coordinates
  const destCoords: LatLng = useMemo(
    () => targetStation.coordinates || { lat: 10.7672, lng: 76.0022 },
    [targetStation.coordinates]
  );

  // Origin coordinates: active trip origin OR ~4km road offset towards booked station
  const originCoords: LatLng = useMemo(() => {
    if (activeTrip?.origin?.coordinates) return activeTrip.origin.coordinates;
    return {
      lat: targetStation.coordinates.lat + 0.028,
      lng: targetStation.coordinates.lng - 0.012,
    };
  }, [activeTrip?.origin?.coordinates, targetStation.coordinates.lat, targetStation.coordinates.lng]);

  // Fetch real OSRM road geometry & navigation steps
  useEffect(() => {
    let cancelled = false;

    async function loadRealRoadRoute() {
      try {
        const routeData = await fetchOSRMRoute([originCoords, destCoords]);
        if (!cancelled && routeData.geometry && routeData.geometry.length >= 2) {
          setOsrmWaypoints(routeData.geometry);
          setOsrmDistanceKm(routeData.distanceKm);
          setOsrmDurationMin(routeData.durationMin);
          if (routeData.steps && routeData.steps.length > 0) {
            setOsrmSteps(routeData.steps);
          }
        }
      } catch (err) {
        console.warn('OSRM road route fetch fallback:', err);
      }
    }

    loadRealRoadRoute();
    return () => {
      cancelled = true;
    };
  }, [originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng]);

  // Active waypoints (real OSRM road polyline or smooth fallback)
  const waypoints = useMemo(() => {
    if (osrmWaypoints.length >= 2) return osrmWaypoints;
    return generateSmoothWaypoints(originCoords, destCoords, 50);
  }, [osrmWaypoints, originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng]);

  // Animated vehicle position along the real road route during driving phase
  const [stepIndex, setStepIndex] = useState(0);
  const currentPos = waypoints[stepIndex] || waypoints[0];

  const progressFraction = stepIndex / (waypoints.length - 1 || 1);
  const distanceRemainingKm = Math.max(0.1, parseFloat(((1 - progressFraction) * (osrmDistanceKm || 5.1)).toFixed(1)));
  const etaMinutesRemaining = Math.max(1, Math.round((1 - progressFraction) * (osrmDurationMin || 8)));

  // Dynamic Turn-by-Turn Instruction based on real road steps & progress
  const currentInstruction = useMemo(() => {
    if (phase !== 'driving') return `Arrived at ${targetStation.name}`;
    if (osrmSteps.length > 0) {
      const stepIdx = Math.min(Math.floor(progressFraction * osrmSteps.length), osrmSteps.length - 1);
      return osrmSteps[stepIdx].instruction;
    }
    if (progressFraction < 0.3) {
      return `Head south towards ${targetStation.name} on ${targetStation.address.split(',')[0] || 'Main Road'}`;
    } else if (progressFraction < 0.7) {
      return `In 500m, turn onto Station Plaza Service Lane`;
    } else if (progressFraction < 0.95) {
      return `In 150m, enter ${targetStation.name} · ${targetStation.ports?.[0]?.bayLocation ?? 'Bay 1'}`;
    } else {
      return `Arriving at ${targetStation.name}`;
    }
  }, [phase, progressFraction, targetStation.name, targetStation.address, targetStation.ports, osrmSteps]);

  // Voice Guidance Trigger on major instruction changes
  useEffect(() => {
    if (voiceEnabled && phase === 'driving' && stepIndex % 10 === 0) {
      speakText(`${currentInstruction}. Battery level ${Math.round(chargePercent)} percent.`, true);
    }
  }, [stepIndex, phase, voiceEnabled, currentInstruction, chargePercent]);

  const toggleVoice = () => {
    if (voiceEnabled) {
      stopSpeaking();
      setVoiceEnabled(false);
      toast.info('🔊 Voice Assistant Muted');
    } else {
      setVoiceEnabled(true);
      toast.success('🔊 Voice Assistant Enabled');
      speakText(`Voice navigation active. Driving towards ${targetStation.name}`, true);
    }
  };

  // Move vehicle smoothly along waypoints during driving phase
  useEffect(() => {
    if (phase !== 'driving' || waypoints.length === 0) return;
    const timer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < waypoints.length - 1) {
          // Slowly decrease battery as driving occurs
          if (prev % 15 === 0) setChargePercent((b) => Math.max(20, b - 1));
          return prev + 1;
        }
        setPhase('arriving');
        return prev;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [phase, waypoints.length]);

  // Enable live mock updates
  useMockLiveUpdates({ enableReroute: false });

  // Simulate charging progress when session active
  useEffect(() => {
    if (phase !== 'charging') return;
    const interval = setInterval(() => {
      setChargePercent((p) => {
        const next = Math.min(p + 0.8, 80);
        if (next >= 80) {
          clearInterval(interval);
          setPhase('complete');
        }
        return next;
      });
      setEnergyKwh((e) => parseFloat((e + 0.18).toFixed(2)));
      setCostAccrued((c) => parseFloat((c + 3.2).toFixed(2)));
      setTimeRemaining((t) => Math.max(0, t - 1));
    }, 1800);
    return () => clearInterval(interval);
  }, [phase]);

  const handleStartCharging = async () => {
    setLoadingSession(true);
    try {
      const session = await startChargingSession(bookingId ?? 'bk-001', targetStation.ports[0]?.id ?? 'p-ze1');
      setSessionId(session.id);
      setPhase('charging');
      if (voiceEnabled) speakText(`Charging started at ${targetStation.name}.`, true);
      toast.success('⚡ Charging session started!');
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
    stopSpeaking();
    setTripComplete(true);
    toast.success('🎉 Navigation complete! You have reached your destination.');
    setTimeout(() => router.push('/app/bookings'), 2500);
  };

  const liveStationTrust = computeConfidenceScore(targetStation);

  if (tripComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-white text-black"
      >
        <motion.div animate={{ scale: [0.8, 1.1, 1] }} transition={{ duration: 0.6 }}>
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6 mx-auto">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
        </motion.div>
        <h1 className="text-3xl font-extrabold text-black mb-2">Arrived at Station!</h1>
        <p className="text-gray-500 font-bold mb-8">{targetStation.name}</p>
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
            <div className="text-2xl font-extrabold text-black">{osrmDistanceKm} km</div>
            <div className="text-[10px] text-gray-500 font-bold mt-1">Distance</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
            <div className="text-2xl font-extrabold text-black">₹{Math.round(costAccrued || 240)}</div>
            <div className="text-[10px] text-gray-500 font-bold mt-1">Charged</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
            <div className="text-2xl font-extrabold text-emerald-600">14m</div>
            <div className="text-[10px] text-gray-500 font-bold mt-1">Time Saved</div>
          </div>
        </div>
        <p className="text-sm text-emerald-700 font-extrabold">ChargeAhead guided your EV safely with live turn-by-turn navigation.</p>
      </motion.div>
    );
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden relative bg-white text-black">
      {/* Full-screen Interactive Google Map */}
      <MapComponent
        stations={[targetStation]}
        route={waypoints}
        height="100%"
        className="absolute inset-0"
        userLocation={currentPos}
        selectedStationId={targetStation.id}
        followUser={followVehicle}
        autoFitRouteOnLoad={false}
      />

      {/* Top Turn-by-Turn Voice Navigation Banner (Google Maps Dark Theme) */}
      <div className="absolute top-4 left-4 right-4 z-20 space-y-2 max-w-md mx-auto">
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                <span>In {distanceRemainingKm} km · {etaMinutesRemaining} min ETA</span>
              </div>
              <p className="text-sm font-black text-white leading-snug mt-0.5">{currentInstruction}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              className={cn(
                'p-2.5 rounded-xl border transition-all text-xs font-bold',
                voiceEnabled ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300' : 'bg-white/10 border-white/20 text-gray-400'
              )}
              title={voiceEnabled ? 'Mute Voice Assistant' : 'Enable Voice Assistant'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg border border-white/10">
              <Battery className={cn('w-4 h-4 shrink-0', chargePercent > 40 ? 'text-emerald-400' : 'text-amber-400')} />
              <span className="text-xs font-black text-white">{Math.round(chargePercent)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Control Sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-20 max-w-md mx-auto">
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white rounded-t-3xl border-t border-gray-200 shadow-2xl px-5 pt-3 pb-safe"
        >
          <div className="sheet-handle bg-gray-300" />

          {phase === 'driving' && (
            <div className="pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Destination Charger</p>
                  <p className="font-black text-black text-base">{targetStation.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600 font-bold">~{etaMinutesRemaining} min ({distanceRemainingKm} km) · {targetStation.address}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full block mb-1">
                    {liveStationTrust}% Trust Score
                  </span>
                  <p className="text-2xl font-black text-emerald-600">{Math.round(chargePercent)}%</p>
                </div>
              </div>

              {/* Live Location Navigation Action Bar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFollowVehicle((f) => !f)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xs',
                    followVehicle ? 'bg-black text-white border-black' : 'bg-gray-100 text-black border-gray-300'
                  )}
                >
                  <LocateFixed className="w-4 h-4" /> {followVehicle ? 'Lock Camera to Car' : 'Free Camera View'}
                </button>

                <button
                  onClick={() => setReportSheetOpen(true)}
                  className="py-2.5 px-3 rounded-xl bg-purple-50 border border-purple-200 hover:border-purple-300 text-purple-900 font-black text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <MessageSquare className="w-4 h-4 text-purple-600" /> Report Status
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-2">
                  <div className="text-sm font-extrabold text-black">{distanceRemainingKm} km</div>
                  <div className="text-[10px] text-gray-500 font-bold">remaining</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-2">
                  <div className="text-sm font-extrabold text-black">₹{targetStation.pricePerKwh * 15}</div>
                  <div className="text-[10px] text-gray-500 font-bold">est. cost</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-2">
                  <div className="text-sm font-extrabold text-emerald-600">
                    {targetStation.ports?.[0]?.bayLocation ?? 'Bay 1 Ready'}
                  </div>
                  <div className="text-[10px] text-gray-500 font-bold">reserved slot</div>
                </div>
              </div>
            </div>
          )}

          {phase === 'arriving' && (
            <div className="pb-4 space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-100 border border-gray-300">
                <MapPin className="w-6 h-6 text-black shrink-0" />
                <div>
                  <p className="text-sm font-black text-black">Arrived at {targetStation.name}</p>
                  <p className="text-xs text-gray-600 font-bold mt-0.5">
                    Proceed to {targetStation.ports?.[0]?.bayLocation ?? 'Bay 1'} · Check-in Code: CA7291
                  </p>
                </div>
              </div>
              <button
                onClick={handleStartCharging}
                disabled={loadingSession}
                className="w-full py-3.5 rounded-xl bg-black text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-gray-900 disabled:opacity-60 shadow-md"
              >
                {loadingSession ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>⚡ Connect Plug & Start Charging</>}
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
                className="w-full mt-4 py-3 rounded-xl border border-red-500 text-red-600 font-extrabold text-sm hover:bg-red-50 transition-all"
              >
                Stop Charging
              </button>
            </div>
          )}

          {phase === 'complete' && (
            <div className="pb-4 space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-black text-emerald-700">Charged to 80% ⚡</p>
                  <p className="text-xs text-gray-600 font-bold">{energyKwh.toFixed(1)} kWh delivered · ₹{Math.round(costAccrued)}</p>
                </div>
              </div>
              <button
                onClick={handleEndTrip}
                className="w-full py-3.5 rounded-xl bg-black text-white font-extrabold text-sm hover:bg-gray-900 shadow-md"
              >
                Complete Navigation →
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Community Report Sheet */}
      <ReportIssueSheet
        isOpen={reportSheetOpen}
        onClose={() => setReportSheetOpen(false)}
        station={targetStation}
      />
    </div>
  );
}

export default function ActiveTripPage() {
  return (
    <Suspense
      fallback={
        <div className="h-dvh flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ActiveTripContent />
    </Suspense>
  );
}
