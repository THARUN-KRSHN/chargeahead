'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Calendar, Zap, ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { MOCK_TRIPS } from '@/lib/mock/trips';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

export default function TripsPage() {
  const [filter, setFilter] = useState<'all' | 'planned' | 'completed'>('all');

  const filteredTrips = MOCK_TRIPS.filter((t) => {
    if (filter === 'planned') return t.status === 'planned';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="min-h-dvh bg-white text-black px-4 py-6 md:px-8 max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Your EV Trips</h1>
          <p className="text-sm text-gray-500 font-medium">History and planned route itineraries</p>
        </div>
        <Link
          href="/app/plan"
          className="flex items-center gap-1.5 bg-black text-white px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-md hover:bg-gray-900 transition-all"
        >
          <Plus className="w-4 h-4" /> Plan New Trip
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-fit">
        {(['all', 'planned', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-extrabold capitalize transition-all ${
              filter === tab ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Trip List */}
      <div className="space-y-4">
        {filteredTrips.map((trip) => {
          const isCompleted = trip.status === 'completed';
          return (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-5 border-gray-200 hover:border-black transition-all shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isCompleted ? 'bg-gray-100 text-gray-800' : 'bg-black text-white'
                      }`}
                    >
                      {trip.status}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{formatRelativeTime(trip.plannedAt)}</span>
                  </div>

                  <h2 className="text-lg font-extrabold text-black flex items-center gap-2 mt-1">
                    {trip.origin.label.split(',')[0]} <ArrowRight className="w-4 h-4 text-black shrink-0" />{' '}
                    {trip.destination.label.split(',')[0]}
                  </h2>
                </div>

                <div className="text-right">
                  <div className="text-base font-mono font-extrabold text-black">
                    {formatCurrency(trip.actualCostInr ?? trip.estimatedCostInr)}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">{trip.totalDistanceKm} km</div>
                </div>
              </div>

              {/* Stops summary */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-gray-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-black" /> {trip.stops.length} Charging Stop
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> {Math.round(trip.totalDurationMinutes / 60)}h{' '}
                    {trip.totalDurationMinutes % 60}m
                  </span>
                </div>

                <Link
                  href={`/app/trips/${trip.id}`}
                  className="text-black font-extrabold hover:underline flex items-center gap-1"
                >
                  View Itinerary →
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
