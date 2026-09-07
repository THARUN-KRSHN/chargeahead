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
    <div className="min-h-dvh bg-navy-900 px-4 py-6 md:px-8 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/app/wallet/history" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Transaction History
        </Link>
        <button onClick={handleShare} className="text-white/60 hover:text-white p-2">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Receipt Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-6 border-mint-400/30 space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-mint-400/5 rounded-full blur-2xl pointer-events-none" />

        {/* Status Badge */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-mint-400/15 border border-mint-400/30 flex items-center justify-center mx-auto text-mint-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <span className="text-xs font-semibold text-mint-400 uppercase tracking-widest block">
            Payment {tx.status}
          </span>
          <div className="text-3xl font-extrabold text-white font-mono">{formatCurrency(tx.amountInr)}</div>
          <div className="text-xs text-white/40">{new Date(tx.createdAt).toLocaleString()}</div>
        </div>

        <div className="h-px bg-surface-border" />

        {/* Station Info */}
        {tx.station && (
          <div className="space-y-1">
            <span className="text-[10px] text-teal-300 font-semibold uppercase tracking-wider">Station</span>
            <div className="text-base font-bold text-white">{tx.station.name}</div>
            <p className="text-xs text-white/50 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-white/40" /> {tx.station.address}
            </p>
          </div>
        )}

        {/* Session Breakdown */}
        <div className="space-y-3 bg-navy-900/60 p-4 rounded-xl border border-surface-border text-xs">
          <div className="flex justify-between text-white/70">
            <span>Energy Delivered:</span>
            <span className="font-mono font-bold text-white">{tx.energyKwh ?? 14.4} kWh</span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>Base Energy Cost:</span>
            <span className="font-mono text-white">{formatCurrency(baseAmount)}</span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>GST (18%):</span>
            <span className="font-mono text-white">{formatCurrency(gst)}</span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>Payment Method:</span>
            <span className="font-semibold text-teal-300 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" /> UPI / Wallet
            </span>
          </div>
        </div>

        {/* Receipt ID Footer */}
        <div className="text-center pt-2">
          <div className="text-[10px] font-mono text-white/40">TXN ID: {tx.id.toUpperCase()}-2026-CHG</div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="w-full py-3.5 rounded-xl bg-mint-gradient text-navy-900 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-mint-glow"
        >
          <Download className="w-4 h-4" /> Download PDF Tax Invoice
        </button>
      </motion.div>
    </div>
  );
}
