'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Navigation, Zap, ShieldCheck, Clock, BatteryCharging, Play, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ConfidenceScore } from '@/components/shared/ConfidenceScore';
import { MapComponent } from '@/components/shared/MapComponent';
import { MOCK_STATIONS } from '@/lib/mock/stations';
import { useTripStore } from '@/lib/store/tripStore';
import { fetchRouteOSRM, geocodePlace } from '@/lib/mock/api';
import type { LatLng } from '@/types';
import { toast } from 'sonner';

export default function RouteResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setTrip } = useTripStore();

  const origin = searchParams.get('origin') || 'Koramangala, Bengaluru';
  const destination = searchParams.get('destination') || 'Mysuru Palace, Mysuru';
  const initialBattery = Number(searchParams.get('battery') || 75);

  const primaryStop = MOCK_STATIONS[0];
  const backupStop = MOCK_STATIONS[2];

  const [routePolyline, setRoutePolyline] = useState<LatLng[]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(142);
  const [routeDurationMinutes, setRouteDurationMinutes] = useState<number>(165);

  const originCoords: LatLng = { lat: 12.9352, lng: 77.6245 };
  const destCoords: LatLng = { lat: 12.3052, lng: 76.6552 };

  useEffect(() => {
    fetchRouteOSRM(originCoords, destCoords).then((res) => {
      if (res.polyline && res.polyline.length > 0) {
        setRoutePolyline(res.polyline);
        if (res.distanceKm > 0) setRouteDistanceKm(res.distanceKm);
        if (res.durationMinutes > 0) setRouteDurationMinutes(res.durationMinutes + 25); // includes charging
      }
    });
  }, [origin, destination]);

  const handleStartTrip = () => {
    const newTrip = {
      id: `trip-${Date.now()}`,
      userId: 'user-001',
      vehicleId: 'v-001',
      origin: { name: origin, lat: 12.9352, lng: 77.6245 },
      destination: { name: destination, lat: 12.3052, lng: 76.6552 },
      distanceKm: 142,
      estimatedDurationMinutes: 165,
      initialBatteryPercent: initialBattery,
      targetArrivalBatteryPercent: 25,
      status: 'active' as const,
      stops: [
        {
          stationId: primaryStop.id,
          plannedArrivalBatteryPercent: 22,
          plannedChargeDurationMinutes: 25,
          targetBatteryPercent: 80,
          status: 'upcoming' as const,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    setTrip(newTrip);
    toast.success('Navigation started! EV Telemetry sync active ⚡');
    router.push('/app/trip/active');
  };

  return (
    <div className="min-h-dvh bg-white text-black pb-20">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 p-4 flex items-center justify-between">
        <Link href="/app/plan" className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-black">
          <ArrowLeft className="w-4 h-4" /> Edit Search
        </Link>
        <div className="text-center">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Trip Route</div>
          <div className="text-sm font-extrabold text-black max-w-[200px] truncate">{destination}</div>
        </div>
        <div className="w-16" />
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Map Preview */}
        <div className="h-64 rounded-2xl overflow-hidden border border-gray-200 relative">
          <MapComponent
            stations={[MOCK_STATIONS[0], MOCK_STATIONS[2]]}
            center={[12.7, 77.2]}
            zoom={9}
            selectedStationId={MOCK_STATIONS[0].id}
            route={routePolyline}
          />
        </div>

        {/* Route Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4 text-center border-gray-200">
            <div className="text-[10px] text-gray-500 uppercase font-bold">Total Distance</div>
            <div className="text-xl font-extrabold text-black font-mono mt-0.5">{routeDistanceKm} km</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center border-gray-200">
            <div className="text-[10px] text-gray-500 uppercase font-bold">Est. Total Time</div>
            <div className="text-xl font-extrabold text-black font-mono mt-0.5">
              {Math.floor(routeDurationMinutes / 60)}h {routeDurationMinutes % 60}m
            </div>
            <div className="text-[9px] text-gray-500 font-medium">Includes 25m charging</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center border-gray-200">
            <div className="text-[10px] text-gray-500 uppercase font-bold">Stops Needed</div>
            <div className="text-xl font-extrabold text-black font-mono mt-0.5">1 Stop</div>
          </div>
        </div>

        {/* Predictive Stop Recommendation */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-black flex items-center gap-2">
              <Zap className="w-4 h-4 text-black" /> Recommended Charging Stop
            </h2>
            <span className="text-xs text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 font-extrabold">
              91% Usability Guarantee
            </span>
          </div>

          <div className="glass-card rounded-2xl p-6 border-gray-200 space-y-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{primaryStop.operator}</span>
                <h3 className="text-lg font-extrabold text-black mt-0.5">{primaryStop.name}</h3>
                <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> Stop at Km 68 (Ramanagara Expressway)
                </p>
              </div>
              <ConfidenceScore score={primaryStop.confidenceScore} size="md" />
            </div>

            {/* Battery state at arrival */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <BatteryCharging className="w-4 h-4 text-black" />
                <span className="text-gray-600">Arrival Battery:</span>
                <span className="text-amber-700 font-extrabold font-mono">22%</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Charge to:</span>
                <span className="text-emerald-700 font-extrabold font-mono">80% (+25 min)</span>
              </div>
            </div>

            {/* Ports & Queue prediction */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <span className="text-gray-500 block text-[10px] font-bold uppercase">Predicted Queue</span>
                <span className="text-emerald-700 font-extrabold">0 Mins (3 of 4 ports open)</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <span className="text-gray-500 block text-[10px] font-bold uppercase">Max Power</span>
                <span className="text-black font-extrabold font-mono">60 kW DC CCS2</span>
              </div>
            </div>

            {/* Reserve option */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-600 font-medium">Estimated Cost: <strong className="text-black font-extrabold font-mono">₹320</strong></span>
              <Link
                href={`/app/station/${primaryStop.id}/reserve`}
                className="text-xs text-black font-extrabold hover:underline"
              >
                Reserve Port in Advance →
              </Link>
            </div>
          </div>
        </div>

        {/* Alternative Backup Stop */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-black" /> Alternative Backup Station
          </h3>
          <div className="glass-card p-4 rounded-xl flex items-center justify-between border-gray-200">
            <div>
              <div className="text-xs text-gray-500 font-bold">{backupStop.operator}</div>
              <div className="text-sm font-extrabold text-black">{backupStop.name}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">Km 92 (Mandya Bypass) • 25 km after primary</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-extrabold text-emerald-700">Score 88%</span>
              <span className="block text-[10px] text-gray-500 font-medium">2 of 2 ports free</span>
            </div>
          </div>
        </div>

        {/* Start Navigation CTA */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleStartTrip}
          className="w-full py-4 rounded-xl bg-black text-white font-extrabold text-base flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-md"
        >
          <Play className="w-5 h-5 fill-white" /> Start Live Navigation & Telemetry
        </motion.button>
      </div>
    </div>
  );
}
