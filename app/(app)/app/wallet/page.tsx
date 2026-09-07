'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, CreditCard, Plus, ArrowUpRight, ArrowDownLeft, Trash2, Check, Zap } from 'lucide-react';
import Link from 'next/link';
import { fetchPaymentMethods, fetchTransactions } from '@/lib/mock/api';
import type { PaymentMethod, Transaction } from '@/types';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const cardSchema = z.object({
  cardNumber: z.string().min(16, 'Enter 16-digit card number').max(19),
  cardHolder: z.string().min(2, 'Enter cardholder name'),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Use MM/YY format'),
  cvv: z.string().length(3, 'Enter 3-digit CVV'),
});

export default function WalletPage() {
  const { user } = useAuthStore();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [addingCard, setAddingCard] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(cardSchema) });

  useEffect(() => {
    Promise.all([fetchPaymentMethods(), fetchTransactions()])
      .then(([pm, txns]) => { setMethods(pm); setRecentTxns(txns.slice(0, 4)); })
      .finally(() => setLoading(false));
  }, []);

  const handleSetDefault = (id: string) => {
    setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
    toast.success('Default payment method updated');
  };

  const handleRemove = (id: string) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
    toast.success('Payment method removed');
  };

  const handleAddCard = async (data: any) => {
    setAddingCard(true);
    await new Promise((r) => setTimeout(r, 1200));
    const last4 = data.cardNumber.replace(/\s/g, '').slice(-4);
    setMethods((prev) => [...prev, {
      id: `pm-${Date.now()}`,
      userId: 'user-001',
      type: 'card',
      label: `New Card •••• ${last4}`,
      last4,
      isDefault: false,
      expiryMonth: parseInt(data.expiry.split('/')[0]),
      expiryYear: parseInt('20' + data.expiry.split('/')[1]),
      brand: 'visa',
    }]);
    setAddCardOpen(false);
    reset();
    setAddingCard(false);
    toast.success('Card added successfully!');
  };

  const txnIcon = (type: Transaction['type']) => {
    if (type === 'credit' || type === 'refund') return <ArrowDownLeft className="w-4 h-4 text-mint-400" />;
    return <ArrowUpRight className="w-4 h-4 text-red-400" />;
  };

  return (
    <div className="min-h-dvh px-4 pt-6 pb-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-5">Wallet</h1>

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 mb-5 overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #1C7293 0%, #0B1F3A 100%)' }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-mint-400/10 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-mint-400" />
              <span className="text-sm font-semibold text-white/70">ChargeAhead Credits</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">₹{user?.walletBalance ?? 480}</div>
            <div className="text-sm text-white/50">Available balance</div>
          </div>
        </motion.div>

        {/* Payment Methods */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Payment Methods</h2>
            <button
              onClick={() => setAddCardOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-mint-400 hover:text-mint-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Card
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {methods.map((pm) => (
                <div key={pm.id} className="glass-card rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-gradient flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{pm.label}</p>
                    {pm.expiryMonth && (
                      <p className="text-xs text-white/40">Exp. {pm.expiryMonth}/{pm.expiryYear}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {pm.isDefault ? (
                      <span className="connector-badge status-available text-[10px]">Default</span>
                    ) : (
                      <button onClick={() => handleSetDefault(pm.id)} className="text-xs text-white/40 hover:text-teal-300 transition-colors">
                        Set default
                      </button>
                    )}
                    <button onClick={() => handleRemove(pm.id)} className="p-1 text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* UPI option */}
              <button
                onClick={() => toast.info('UPI linking coming soon!')}
                className="w-full flex items-center gap-3 p-3.5 glass-card rounded-xl border-dashed border-surface-border hover:border-mint-400/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white/40" />
                </div>
                <span className="text-sm text-white/40">Link UPI / Add bank</span>
              </button>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Recent Transactions</h2>
            <Link href="/app/wallet/history" className="text-xs font-semibold text-teal-300 hover:text-teal-200">
              View all
            </Link>
          </div>

          <div className="space-y-2">
            {recentTxns.map((tx) => (
              <Link key={tx.id} href={`/app/wallet/receipt/${tx.id}`}>
                <div className="glass-card rounded-xl p-3.5 flex items-center gap-3 hover:border-mint-400/10 transition-all">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', tx.type === 'credit' || tx.type === 'refund' ? 'bg-mint-400/10' : 'bg-red-400/10')}>
                    {txnIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.description.split(' · ')[0]}</p>
                    <p className="text-xs text-white/40">{format(new Date(tx.createdAt), 'dd MMM · h:mm a')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-sm font-bold', tx.type === 'credit' || tx.type === 'refund' ? 'text-mint-400' : 'text-white')}>
                      {tx.type === 'credit' || tx.type === 'refund' ? '+' : '-'}₹{tx.amountInr}
                    </p>
                    <p className={cn('text-[10px]', tx.status === 'success' || tx.status === 'refunded' ? 'text-white/30' : 'text-red-400')}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Add card sheet */}
      <BottomSheet isOpen={addCardOpen} onClose={() => setAddCardOpen(false)} title="Add Debit / Credit Card" showHandle showCloseButton>
        <form onSubmit={handleSubmit(handleAddCard)} className="space-y-4 pb-6">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Card Number</label>
            <input {...register('cardNumber')} placeholder="1234 5678 9012 3456" inputMode="numeric"
              className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-mint-400/60 font-mono tracking-widest" />
            {errors.cardNumber && <p className="mt-1 text-xs text-red-400">{errors.cardNumber.message as string}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Cardholder Name</label>
            <input {...register('cardHolder')} placeholder="THARUN KRISHNA"
              className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-mint-400/60 uppercase" />
            {errors.cardHolder && <p className="mt-1 text-xs text-red-400">{errors.cardHolder.message as string}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Expiry (MM/YY)</label>
              <input {...register('expiry')} placeholder="12/28"
                className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-mint-400/60 font-mono" />
              {errors.expiry && <p className="mt-1 text-xs text-red-400">{errors.expiry.message as string}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">CVV</label>
              <input {...register('cvv')} placeholder="•••" type="password" maxLength={3}
                className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-mint-400/60 font-mono" />
              {errors.cvv && <p className="mt-1 text-xs text-red-400">{errors.cvv.message as string}</p>}
            </div>
          </div>
          <p className="text-[10px] text-white/30">🔒 Secured with 256-bit encryption. Card details are tokenized and never stored.</p>
          <motion.button type="submit" disabled={addingCard} whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-xl bg-mint-gradient text-navy-900 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-mint-glow">
            {addingCard ? <div className="w-5 h-5 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" /> : 'Add Card'}
          </motion.button>
        </form>
      </BottomSheet>
    </div>
  );
}
