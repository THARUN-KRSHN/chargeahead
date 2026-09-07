'use client';

import { use, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowLeft, Download, QrCode, Share2, Receipt, Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { notFound, useRouter, useSearchParams } from 'next/navigation';
import { fetchStationById, fetchBookingById } from '@/lib/mock/api';
import type { ChargingStation, Booking } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function StationReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [station, setStation] = useState<ChargingStation | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchStationById(id).catch(() => null),
      bookingId ? fetchBookingById(bookingId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([stn, bkg]) => {
        setStation(stn);
        setBooking(bkg);
      })
      .finally(() => setLoading(false));
  }, [id, bookingId]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-white p-6 max-w-lg mx-auto space-y-4">
        <div className="skeleton h-10 w-32 rounded-xl" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    );
  }

  if (!station) {
    notFound();
  }

  const amount = booking?.estimatedCostInr ?? 280;
  const baseAmount = Math.round(amount * 0.8475);
  const gst = amount - baseAmount;
  const energyKwh = Math.round((amount / (station.pricePerKwh || 16)) * 10) / 10;
  const checkInCode = booking?.checkInCode ?? 'CA-' + Math.floor(1000 + Math.random() * 9000);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.info('Receipt link copied to clipboard!');
  };

  const handleDownload = () => {
    toast.success('Downloading official tax invoice PDF...');
  };

  return (
    <div className="min-h-dvh bg-white px-4 py-6 md:px-8 max-w-lg mx-auto space-y-6 text-black">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/app/home')}
          className="flex items-center gap-2 text-sm text-gray-600 font-bold hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="p-2 text-gray-600 hover:text-black rounded-lg hover:bg-gray-100">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Animated Receipt Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl space-y-6 relative overflow-hidden"
      >
        {/* Success Icon + Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 20 }}
            className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600"
          >
            <CheckCircle2 className="w-8 h-8" />
          </motion.div>
          <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest block">
            Payment Confirmed • Unified Checkout
          </span>
          <div className="text-3xl font-extrabold text-black font-mono">
            {formatCurrency(amount)}
          </div>
          <p className="text-xs text-gray-500 font-bold">
            {new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Check-In Pass QR Mock */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex items-center gap-4">
          <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center text-white shrink-0 shadow-inner">
            <QrCode className="w-10 h-10" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Fast Check-In Pass</span>
            <div className="text-lg font-mono font-extrabold text-black tracking-widest">{checkInCode}</div>
            <p className="text-[11px] text-gray-500">Scan at bay scanner or present to attendant</p>
          </div>
        </div>

        {/* Station details */}
        <div className="space-y-1">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Charging Hub</span>
          <div className="text-base font-extrabold text-black">{station.name}</div>
          <p className="text-xs text-gray-600 font-medium">{station.address}</p>
        </div>

        {/* Itemized Session Breakdown */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs font-bold">
          <div className="flex justify-between text-gray-600">
            <span>Estimated Energy:</span>
            <span className="font-mono text-black font-extrabold">~{energyKwh} kWh</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tariff Rate:</span>
            <span className="font-mono text-black">₹{station.pricePerKwh} / kWh</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Base Cost:</span>
            <span className="font-mono text-black">{formatCurrency(baseAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>GST (18%):</span>
            <span className="font-mono text-black">{formatCurrency(gst)}</span>
          </div>
          <div className="h-px bg-gray-200 my-1" />
          <div className="flex justify-between text-black text-sm font-extrabold">
            <span>Total Paid</span>
            <span className="font-mono">{formatCurrency(amount)}</span>
          </div>
        </div>

        {/* Tax Invoice reference */}
        <div className="text-center">
          <div className="text-[10px] font-mono text-gray-400 font-bold uppercase">
            Invoice: CA-INV-{Date.now().toString().slice(-8)} • GSTIN: 29AABCC1234F1Z5
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleDownload}
            className="w-full py-3.5 rounded-xl bg-black text-white font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-md"
          >
            <Download className="w-4 h-4" /> Download PDF Tax Invoice
          </button>
          <button
            onClick={() => router.push(bookingId ? `/app/bookings/${bookingId}` : '/app/bookings')}
            className="w-full py-3 rounded-xl border border-gray-300 text-black font-extrabold text-sm hover:bg-gray-50 transition-all"
          >
            View My Bookings →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
