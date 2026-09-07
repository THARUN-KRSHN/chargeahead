'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, QrCode, Clock, MapPin, Zap, CreditCard, XCircle, Calendar, Copy } from 'lucide-react';
import { fetchBookingById, cancelBooking } from '@/lib/mock/api';
import type { Booking } from '@/types';
import { cn } from '@/lib/utils';
import { format, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBookingById(id).then(setBooking).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      await cancelBooking(booking.id);
      setBooking((b) => b ? { ...b, status: 'cancelled', paymentStatus: 'refunded' } : null);
      toast.success('Booking cancelled. Refund will process in 3–5 business days.');
    } catch {
      toast.error('Could not cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Check-in code copied!');
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-10 rounded-xl w-32" />
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <XCircle className="w-12 h-12 text-red-500 mb-3" />
        <p className="text-gray-600 font-bold">Booking not found</p>
        <button onClick={() => router.back()} className="mt-3 text-black font-extrabold text-sm hover:underline">Go back</button>
      </div>
    );
  }

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  const minsUntil = differenceInMinutes(startDate, new Date());
  const isUpcoming = booking.status === 'upcoming';
  const isCompleted = booking.status === 'completed';

  return (
    <div className="min-h-dvh bg-white text-black pb-8">
      {/* Header */}
      <div className="sticky top-16 z-20 flex items-center gap-3 px-4 py-4 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-200 hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-black" />
        </button>
        <div>
          <h1 className="font-extrabold text-black text-lg">Booking Details</h1>
          <p className="text-xs text-gray-500 font-medium">#{booking.id}</p>
        </div>
        <span className={cn(
          'ml-auto connector-badge text-xs font-bold px-3 py-1 rounded-full',
          booking.status === 'upcoming' ? 'status-available' : booking.status === 'completed' ? 'status-available' : 'status-offline'
        )}>
          {booking.status}
        </span>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">
        {/* QR Code (upcoming only) */}
        {isUpcoming && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl p-5 text-center border-gray-200 shadow-sm"
          >
            {minsUntil > 0 && minsUntil < 60 && (
              <div className="mb-3 text-xs font-extrabold text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 inline-block border border-amber-200">
                ⚡ Starts in {minsUntil} minutes
              </div>
            )}

            {/* Mock QR */}
            <div className="w-36 h-36 bg-black p-2 rounded-xl mx-auto mb-4 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-2 grid grid-cols-7 gap-0.5">
                {Array.from({ length: 49 }).map((_, i) => (
                  <div key={i} className={cn('rounded-[1px]', Math.random() > 0.5 ? 'bg-white' : 'bg-black')} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center shadow-md">
                  <Zap className="w-4 h-4 text-black" />
                </div>
              </div>
            </div>

            <p className="text-black font-extrabold text-xl font-mono tracking-wider">{booking.qrCode}</p>
            <p className="text-gray-500 text-xs font-medium mt-1 mb-3">Scan at the charging bay</p>

            <button
              onClick={() => handleCopyCode(booking.checkInCode)}
              className="flex items-center gap-1.5 mx-auto text-sm font-extrabold text-black hover:underline"
            >
              <Copy className="w-3.5 h-3.5" />
              Manual code: <span className="font-mono text-black font-extrabold">{booking.checkInCode}</span>
            </button>
          </motion.div>
        )}

        {/* Station info */}
        <div className="glass-card rounded-2xl p-4 border-gray-200">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Station</h2>
          <Link href={`/app/station/${booking.stationId}`}>
            <div className="flex items-start gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-black text-base">{booking.station.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-500 font-medium">{booking.station.address}</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Booking details */}
        <div className="glass-card rounded-2xl p-4 space-y-3 border-gray-200">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Details</h2>
          {[
            { label: 'Date', value: format(startDate, 'EEEE, dd MMMM yyyy'), icon: Calendar },
            { label: 'Time', value: `${format(startDate, 'h:mm a')} – ${format(endDate, 'h:mm a')}`, icon: Clock },
            { label: 'Charger', value: `${booking.port.connectorType} · ${booking.port.speedKw} kW`, icon: Zap },
            { label: 'Vehicle', value: booking.vehicle.nickname ?? booking.vehicle.evModel.model, icon: null },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
                {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
                {label}
              </span>
              <span className="text-sm font-bold text-black">{value}</span>
            </div>
          ))}
        </div>

        {/* Payment */}
        <div className="glass-card rounded-2xl p-4 space-y-3 border-gray-200">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">Amount</span>
            <span className="text-lg font-extrabold text-black font-mono">
              ₹{booking.actualCostInr ?? booking.estimatedCostInr}
              {!booking.actualCostInr && <span className="text-xs text-gray-400 font-normal ml-1">est.</span>}
            </span>
          </div>
          {booking.energyDeliveredKwh && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Energy delivered</span>
              <span className="text-sm font-bold text-black">{booking.energyDeliveredKwh} kWh</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">Status</span>
            <span className={cn('text-sm font-extrabold', booking.paymentStatus === 'paid' ? 'text-emerald-700' : booking.paymentStatus === 'refunded' ? 'text-amber-700' : 'text-red-700')}>
              {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {isUpcoming && (
            <Link href="/app/trip/active" className="block">
              <button className="w-full py-4 rounded-xl bg-black text-white font-extrabold text-sm hover:bg-gray-900 transition-all shadow-md">
                Navigate to Station
              </button>
            </Link>
          )}
          {isCompleted && (
            <Link href={`/app/wallet/receipt/${booking.id}`} className="block">
              <button className="w-full py-3.5 rounded-xl border border-gray-300 text-black font-extrabold text-sm hover:bg-gray-50 transition-all">
                View Receipt
              </button>
            </Link>
          )}
          {isUpcoming && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full py-3.5 rounded-xl border border-red-200 text-red-600 font-extrabold text-sm hover:bg-red-50 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {cancelling ? <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" /> : 'Cancel Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
