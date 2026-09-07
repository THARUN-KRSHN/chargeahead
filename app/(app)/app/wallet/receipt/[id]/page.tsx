'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, CheckCircle2, Zap, MapPin, CreditCard, Share2, Receipt } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTransactionById } from '@/lib/mock/transactions';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tx = getTransactionById(id);

  if (!tx) {
    notFound();
  }

  const handleDownload = () => {
    toast.success('Downloading official PDF receipt...');
  };

  const handleShare = () => {
    toast.info('Receipt link copied to clipboard!');
  };

  const baseAmount = Math.round(tx.amountInr * 0.85);
  const gst = Math.round(tx.amountInr * 0.15);

  return (
    <div className="min-h-dvh bg-white px-4 py-6 md:px-8 max-w-lg mx-auto space-y-6 text-black">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/app/wallet/history" className="flex items-center gap-2 text-sm text-gray-600 font-bold hover:text-black">
          <ArrowLeft className="w-4 h-4" /> Transaction History
        </Link>
        <button onClick={handleShare} className="text-gray-600 hover:text-black p-2">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Receipt Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl space-y-6 relative overflow-hidden"
      >
        {/* Status Badge */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest block">
            Payment {tx.status}
          </span>
          <div className="text-3xl font-extrabold text-black font-mono">{formatCurrency(tx.amountInr)}</div>
          <div className="text-xs text-gray-500 font-bold">{new Date(tx.createdAt).toLocaleString()}</div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Station Info */}
        {tx.station && (
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Station</span>
            <div className="text-base font-extrabold text-black">{tx.station.name}</div>
            <p className="text-xs text-gray-600 font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" /> {tx.station.address}
            </p>
          </div>
        )}

        {/* Session Breakdown */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs font-bold">
          <div className="flex justify-between text-gray-600">
            <span>Energy Delivered:</span>
            <span className="font-mono font-extrabold text-black">{tx.energyKwh ?? 14.4} kWh</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Base Energy Cost:</span>
            <span className="font-mono text-black">{formatCurrency(baseAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>GST (18%):</span>
            <span className="font-mono text-black">{formatCurrency(gst)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Payment Method:</span>
            <span className="font-extrabold text-black flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" /> UPI / Wallet
            </span>
          </div>
        </div>

        {/* Receipt ID Footer */}
        <div className="text-center pt-2">
          <div className="text-[10px] font-mono text-gray-400 font-bold">TXN ID: {tx.id.toUpperCase()}-2026-CHG</div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="w-full py-3.5 rounded-xl bg-black text-white font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-md"
        >
          <Download className="w-4 h-4" /> Download PDF Tax Invoice
        </button>
      </motion.div>
    </div>
  );
}
