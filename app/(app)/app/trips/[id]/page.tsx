'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Navigation, Zap, BatteryCharging, ShieldCheck, CheckCircle2, Play } from 'lucide-react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { getTripById } from '@/lib/mock/trips';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { ConfidenceScore } from '@/components/shared/ConfidenceScore';
import { MapComponent } from '@/components/shared/MapComponent';

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const trip = getTripById(id);

  if (!trip) {
    notFound();
  }

  const isCompleted = trip.status === 'completed';

  return (
    <div className="min-h-dvh bg-white text-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 p-4 flex items-center justify-between">
        <Link href="/app/trips" className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-black">
          <ArrowLeft className="w-4 h-4" /> All Trips
        </Link>
        <span
          className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            isCompleted ? 'bg-gray-100 text-gray-800' : 'bg-black text-white'
          }`}
        >
          {trip.status}
        </span>
        <div className="w-12" />
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Trip Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">
            {trip.origin.label.split(',')[0]} to {trip.destination.label.split(',')[0]}
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">Planned on {new Date(trip.plannedAt).toLocaleDateString()}</p>
        </div>

        {/* Map */}
        <div className="h-56 rounded-2xl overflow-hidden border border-gray-200 relative">
          <MapComponent
            stations={trip.stops.map((s) => s.station).filter(Boolean) as any}
            center={{ lat: 12.7, lng: 77.2 }}
            zoom={8}
          />
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="glass-card rounded-xl p-3 border-gray-200">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Distance</span>
            <span className="text-sm font-extrabold text-black font-mono">{trip.totalDistanceKm} km</span>
          </div>
          <div className="glass-card rounded-xl p-3 border-gray-200">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Duration</span>
            <span className="text-sm font-extrabold text-black font-mono">
              {Math.round(trip.totalDurationMinutes / 60)}h {trip.totalDurationMinutes % 60}m
            </span>
          </div>
          <div className="glass-card rounded-xl p-3 border-gray-200">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Cost</span>
            <span className="text-sm font-extrabold text-black font-mono">
              {formatCurrency(trip.actualCostInr ?? trip.estimatedCostInr)}
            </span>
          </div>
          <div className="glass-card rounded-xl p-3 border-gray-200">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Battery Start</span>
            <span className="text-sm font-extrabold text-emerald-700 font-mono">{trip.batteryAtStart}%</span>
          </div>
        </div>

        {/* Charging Stops timeline */}
        <div>
          <h2 className="text-base font-extrabold text-black mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-black" /> Charging Stop Itinerary
          </h2>

          <div className="space-y-4">
            {trip.stops.map((stop, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-5 border-gray-200 space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                      Stop {stop.order}: {stop.station?.operator}
                    </span>
                    <h3 className="text-base font-extrabold text-black mt-0.5">{stop.station?.name}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">{stop.station?.address}</p>
                  </div>
                  {stop.station && <ConfidenceScore score={stop.station.confidenceScore} size="sm" />}
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px] font-bold uppercase">Arrival Battery</span>
                    <span className="text-amber-700 font-extrabold font-mono">{stop.arrivalBatteryPercent}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-bold uppercase">Charge Duration</span>
                    <span className="text-black font-extrabold font-mono">{stop.chargingDurationMinutes} mins</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-bold uppercase">Target Charge</span>
                    <span className="text-emerald-700 font-extrabold font-mono">{stop.departureBatteryPercent}%</span>
                  </div>
                </div>

                {stop.station && (
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">Estimated Cost: {formatCurrency(stop.estimatedCostInr)}</span>
                    <Link
                      href={`/app/station/${stop.station.id}`}
                      className="text-xs text-black font-extrabold hover:underline"
                    >
                      Station Details →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start / Relaunch navigation */}
        {!isCompleted && (
          <Link
            href={`/app/trip/active?tripId=${trip.id}`}
            className="block w-full text-center py-4 rounded-xl bg-black text-white font-extrabold text-base shadow-md hover:bg-gray-900 transition-all"
          >
            Launch Active Navigation Mode ⚡
          </Link>
        )}
      </div>
    </div>
  );
}
