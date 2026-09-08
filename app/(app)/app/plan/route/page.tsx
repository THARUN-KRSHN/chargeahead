'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Navigation, Zap, ShieldCheck, Clock,
  BatteryCharging, Play, ChevronRight, ChevronUp, ChevronDown,
  AlertTriangle, CheckCircle, Info,
} from 'lucide-react';
import Link from 'next/link';
import { MapCanvas } from '@/components/shared/MapCanvas';
import { ConfidenceScore } from '@/components/shared/ConfidenceScore';
import { MOCK_PLACES, getPlaceById } from '@/lib/mock/places';
import { MOCK_STATIONS } from '@/lib/mock/stations';
import { MOCK_VEHICLES } from '@/lib/mock/users';
import { computeRoute, formatDuration, formatDistance } from '@/lib/mock/routing';
import { useTripStore } from '@/lib/store/tripStore';
import { useVehicleStore } from '@/lib/store/vehicleStore';
import type { Trip, RouteStop, RoutePlan } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Fallback place lookup ─────────────────────────────────────

function findPlace(id: string, label: string) {
  return (
    getPlaceById(id) ??
    MOCK_PLACES.find((p) => p.label.toLowerCase().includes(label.toLowerCase().slice(0, 8))) ??
    MOCK_PLACES[0]
  );
}

// ── Stop mini-card ─────────────────────────────────────────────

function StopCard({ stop, index }: { stop: RouteStop; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const confidenceColor =
    stop.station.confidenceScore >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : stop.station.confidenceScore >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-red-700 bg-red-50 border-red-200';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          {/* Stop number badge */}
          <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center shrink-0 shadow-sm">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
              Stop {index + 1} · {formatDistance(stop.legDistanceKm)} from {index === 0 ? 'origin' : `Stop ${index}`}
            </div>
            <div className="text-sm font-extrabold text-black">{stop.station.name}</div>
            <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {stop.station.address}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
          <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full border', confidenceColor)}>
            {stop.station.confidenceScore}% reliable
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Battery state */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <BatteryCharging className="w-4 h-4 text-black" />
                  <span className="text-gray-600">Arrive:</span>
                  <span className="text-amber-700 font-extrabold font-mono">{stop.arrivalChargePercent}%</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Depart:</span>
                  <span className="text-emerald-700 font-extrabold font-mono">{stop.targetChargePercent}%</span>
                  <span className="text-gray-500">(+{stop.chargeTimeMin}m)</span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-500 block text-[10px] font-bold uppercase mb-0.5">Queue</span>
                  <span className={stop.station.predictedQueueMinutes === 0 ? 'text-emerald-700 font-extrabold' : 'text-amber-700 font-extrabold'}>
                    {stop.station.predictedQueueMinutes === 0 ? 'No wait' : `${stop.station.predictedQueueMinutes}m wait`}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-500 block text-[10px] font-bold uppercase mb-0.5">Ports Free</span>
                  <span className="text-black font-extrabold">{stop.station.availablePorts}/{stop.station.totalPorts}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-500 block text-[10px] font-bold uppercase mb-0.5">Cost Est.</span>
                  <span className="text-black font-extrabold font-mono">₹{stop.estimatedCostInr}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Link href={`/app/station/${stop.station.id}`} className="flex-1">
                  <button className="w-full py-2.5 rounded-xl border border-gray-200 text-black text-xs font-extrabold hover:bg-gray-50 transition-all">
                    View Station
                  </button>
                </Link>
                {stop.station.isReservable && (
                  <Link href={`/app/station/${stop.station.id}/reserve`} className="flex-1">
                    <button className="w-full py-2.5 rounded-xl bg-black text-white text-xs font-extrabold hover:bg-gray-900 transition-all">
                      Reserve Port →
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Time breakdown pill ────────────────────────────────────────

function TimeBreakdown({ plan }: { plan: RoutePlan }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-gray-600 flex-wrap">
      <span className="flex items-center gap-1">
        <Navigation className="w-3 h-3 text-gray-500" />
        <strong className="text-black">{formatDuration(plan.totalDrivingMin)}</strong> driving
      </span>
      {plan.needsCharging && plan.stops.length > 0 && (
        <>
          <span className="text-gray-300">+</span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <strong className="text-black">{formatDuration(plan.totalChargingMin)}</strong> charging
          </span>
        </>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────

export default function RouteResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setActiveTrip } = useTripStore();
  const { activeVehicle } = useVehicleStore();

  const [sheetExpanded, setSheetExpanded] = useState(false);

  // Read params
  const originId = searchParams.get('originId') ?? '';
  const destId = searchParams.get('destId') ?? '';
  const originLabel = searchParams.get('originLabel') ?? searchParams.get('origin') ?? 'Koramangala, Bengaluru';
  const destLabel = searchParams.get('destLabel') ?? searchParams.get('destination') ?? 'Mysuru Palace, Mysuru';
  const initialBattery = Number(searchParams.get('battery') ?? 75);

  // Resolve places
  const origin = useMemo(() => findPlace(originId, originLabel), [originId, originLabel]);
  const destination = useMemo(() => findPlace(destId, destLabel), [destId, destLabel]);

  // Override labels with what the user typed (may differ from dataset label)
  const originResolved = useMemo(() => ({ ...origin, label: originLabel || origin.label }), [origin, originLabel]);
  const destResolved = useMemo(() => ({ ...destination, label: destLabel || destination.label }), [destination, destLabel]);

  // Determine vehicle
  const vehicle = activeVehicle ?? MOCK_VEHICLES[0];

  // Compute route
  const plan = useMemo(
    () => computeRoute(originResolved, destResolved, vehicle, initialBattery, MOCK_STATIONS),
    [originResolved, destResolved, vehicle, initialBattery],
  );

  // ── Start trip ───────────────────────────────────────────
  const handleStartTrip = () => {
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      userId: 'user-001',
      status: 'active',
      origin: { label: originResolved.label, coordinates: originResolved.coords },
      destination: { label: destResolved.label, coordinates: destResolved.coords },
      stops: plan.stops.map((stop, i) => ({
        stationId: stop.station.id,
        station: stop.station,
        arrivalBatteryPercent: stop.arrivalChargePercent,
        departureBatteryPercent: stop.targetChargePercent,
        chargingDurationMinutes: stop.chargeTimeMin,
        estimatedCostInr: stop.estimatedCostInr,
        order: i + 1,
      })),
      segments: [
        ...plan.stops.map((stop, i) => ({
          from: i === 0 ? originResolved.coords : plan.stops[i - 1].station.coordinates,
          to: stop.station.coordinates,
          distanceKm: stop.legDistanceKm,
          durationMinutes: stop.legTimeMin,
        })),
        {
          from: plan.stops.length > 0
            ? plan.stops[plan.stops.length - 1].station.coordinates
            : originResolved.coords,
          to: destResolved.coords,
          distanceKm: plan.finalLegDistanceKm,
          durationMinutes: plan.finalLegTimeMin,
        },
      ],
      totalDistanceKm: plan.totalDistanceKm,
      totalDurationMinutes: plan.totalTimeMin,
      estimatedCostInr: plan.totalCostInr,
      batteryAtStart: initialBattery,
      plannedAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      vehicle,
    };

    setActiveTrip(newTrip);
    toast.success('Navigation started! EV Telemetry sync active ⚡');
    router.push('/app/trip/active');
  };

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-white relative">
      {/* ── Sticky header ── */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/app/plan" className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-black">
          <ArrowLeft className="w-4 h-4" /> Edit
        </Link>
        <div className="text-center">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Route to</div>
          <div className="text-sm font-extrabold text-black max-w-[200px] truncate">{destResolved.label}</div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg px-2 py-1">
          <Zap className="w-3 h-3 text-amber-500" />
          {plan.stops.length} stop{plan.stops.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Map (top portion) ── */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{ bottom: sheetExpanded ? '65vh' : '42vh' }}
      >
        <MapCanvas
          origin={originResolved}
          destination={destResolved}
          stops={plan.stops}
          height="100%"
          className="w-full h-full"
        />
        {/* Gradient fade into sheet */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>

      {/* ── Trip Summary Sheet (bottom) ── */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 overflow-hidden z-10 transition-all duration-300"
        style={{ height: sheetExpanded ? '65vh' : '42vh' }}
      >
        {/* Drag handle */}
        <button
          onClick={() => setSheetExpanded((v) => !v)}
          className="w-full flex flex-col items-center pt-3 pb-2 hover:bg-gray-50 transition-colors"
          aria-label={sheetExpanded ? 'Collapse summary' : 'Expand summary'}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full mb-2" />
          {sheetExpanded
            ? <ChevronDown className="w-4 h-4 text-gray-400" />
            : <ChevronUp className="w-4 h-4 text-gray-400" />
          }
        </button>

        <div className="overflow-y-auto pb-6 px-4" style={{ maxHeight: 'calc(100% - 60px)' }}>
          {/* ── Hero stats ── */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-[10px] text-gray-500 uppercase font-bold">Distance</div>
              <div className="text-lg font-extrabold text-black font-mono mt-0.5">
                {formatDistance(plan.totalDistanceKm)}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-[10px] text-gray-500 uppercase font-bold">Total Time</div>
              <div className="text-lg font-extrabold text-black font-mono mt-0.5">
                {formatDuration(plan.totalTimeMin)}
              </div>
              {plan.stops.length > 0 && (
                <div className="text-[9px] text-gray-500 font-medium">
                  incl. {formatDuration(plan.totalChargingMin)} charging
                </div>
              )}
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-[10px] text-gray-500 uppercase font-bold">
                {plan.needsCharging ? 'Est. Cost' : 'Stops'}
              </div>
              <div className="text-lg font-extrabold text-black font-mono mt-0.5">
                {plan.needsCharging ? `₹${plan.totalCostInr}` : '0'}
              </div>
              {!plan.needsCharging && (
                <div className="text-[9px] text-emerald-700 font-bold">Direct trip!</div>
              )}
            </div>
          </div>

          {/* Time breakdown */}
          <div className="mb-4">
            <TimeBreakdown plan={plan} />
          </div>

          {/* Long trip warning */}
          {plan.longTripWarning && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="text-amber-800 font-medium">{plan.longTripWarning}</span>
            </div>
          )}

          {/* Direct trip confirmation */}
          {!plan.needsCharging && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-emerald-800 font-medium">
                Your vehicle can complete this trip on current charge ({initialBattery}%) with no stops needed.
              </span>
            </div>
          )}

          {/* ── Charging stops ── */}
          {plan.stops.length > 0 && (
            <div className="mb-4 space-y-2">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Charging Stops
              </h2>
              {plan.stops.map((stop, i) => (
                <StopCard key={stop.station.id} stop={stop} index={i} />
              ))}
            </div>
          )}

          {/* ── Final leg ── */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between mb-4 text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">Final leg to {destResolved.label.split(',')[0]}</span>
            </div>
            <div className="font-extrabold text-black font-mono">
              {formatDistance(plan.finalLegDistanceKm)} · {formatDuration(plan.finalLegTimeMin)}
            </div>
          </div>

          {/* ── Confidence note ── */}
          {plan.stops.length > 0 && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 text-xs">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span className="text-blue-700 font-medium">
                Stops chosen by confidence score, minimal detour, predicted queue & charge speed — refresh for live updates.
              </span>
            </div>
          )}

          {/* ── Start trip CTA ── */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleStartTrip}
            className="w-full py-4 rounded-xl bg-black text-white font-extrabold text-base flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-lg"
          >
            <Play className="w-5 h-5 fill-white" /> Start Live Navigation & Telemetry
          </motion.button>
        </div>
      </div>

      {/* Spacer behind header */}
      <div className="h-14 shrink-0" />
    </div>
  );
}
