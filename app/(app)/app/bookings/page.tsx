'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, QrCode, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { fetchUserBookings } from '@/lib/mock/api';
import type { Booking, BookingStatus } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const TABS: { key: BookingStatus | 'all'; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  upcoming: { icon: Clock, color: 'text-black font-extrabold', label: 'Upcoming' },
  active: { icon: AlertCircle, color: 'text-emerald-700 font-extrabold', label: 'Active' },
  completed: { icon: CheckCircle2, color: 'text-emerald-700 font-extrabold', label: 'Completed' },
  cancelled: { icon: XCircle, color: 'text-red-600 font-extrabold', label: 'Cancelled' },
  missed: { icon: XCircle, color: 'text-amber-600 font-extrabold', label: 'Missed' },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  useEffect(() => {
    fetchUserBookings().then(setBookings).finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter((b) => b.status === activeTab);

  return (
    <div className="min-h-dvh bg-white text-black px-4 pt-6 pb-8">
      <div className="max-w-lg mx-auto space-y-5">
        <h1 className="text-3xl font-extrabold text-black tracking-tight">My Bookings</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 border border-gray-200">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={cn(
                'flex-1 py-2 rounded-lg text-xs font-extrabold transition-all',
                activeTab === key ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black',
              )}
            >
              {label}
              {key === 'upcoming' && bookings.filter((b) => b.status === 'upcoming').length > 0 && (
                <span className="ml-1.5 w-4 h-4 inline-flex items-center justify-center bg-white text-black text-[9px] font-extrabold rounded-full">
                  {bookings.filter((b) => b.status === 'upcoming').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton rounded-2xl h-36" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-black font-extrabold text-lg mb-1">No {activeTab} bookings</p>
            <p className="text-gray-500 text-sm font-medium mb-5">
              {activeTab === 'upcoming' ? 'Reserve a charging slot to see it here.' : 'Your past sessions will appear here.'}
            </p>
            {activeTab === 'upcoming' && (
              <Link href="/app/home">
                <button className="px-6 py-3 rounded-xl bg-black text-white font-extrabold text-sm hover:bg-gray-900 shadow-md">
                  Find a station
                </button>
              </Link>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filtered.map((booking) => {
                const conf = statusConfig[booking.status];
                const Icon = conf.icon;
                const startDate = new Date(booking.startTime);
                return (
                  <Link key={booking.id} href={`/app/bookings/${booking.id}`}>
                    <motion.div
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      className="glass-card rounded-2xl p-4 border-gray-200 hover:border-black transition-all cursor-pointer shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-black text-base truncate">{booking.station.name}</h3>
                          <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{booking.station.city}</p>
                        </div>
                        <span className={cn('flex items-center gap-1 text-xs', conf.color)}>
                          <Icon className="w-3.5 h-3.5" />
                          {conf.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-600 font-medium mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {format(startDate, 'dd MMM yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {format(startDate, 'h:mm a')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="connector-badge text-[10px] text-black font-bold border-gray-200 bg-gray-100">{booking.port.connectorType}</span>
                          <span className="connector-badge text-[10px] text-black font-bold border-gray-200 bg-gray-100">{booking.port.speedKw} kW</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-black">
                            ₹{booking.actualCostInr ?? booking.estimatedCostInr}
                          </span>
                          {booking.status === 'upcoming' && (
                            <div className="flex items-center gap-1 text-black font-bold">
                              <QrCode className="w-3.5 h-3.5" />
                              <span className="text-[10px]">QR ready</span>
                            </div>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
