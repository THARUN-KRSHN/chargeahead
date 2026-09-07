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
    if (type === 'credit' || type === 'refund') return <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
    return <ArrowUpRight className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="min-h-dvh px-4 pt-6 pb-8 bg-white text-black">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-extrabold text-black mb-5">Wallet</h1>

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-5 overflow-hidden relative bg-black text-white shadow-xl"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-white" />
              <span className="text-sm font-bold text-gray-300">ChargeAhead Credits</span>
            </div>
            <div className="text-4xl font-extrabold text-white mb-1">₹{user?.walletBalance ?? 480}</div>
            <div className="text-sm text-gray-400 font-bold">Available balance</div>
          </div>
        </motion.div>

        {/* Payment Methods */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-black text-base">Payment Methods</h2>
            <button
              onClick={() => setAddCardOpen(true)}
              className="flex items-center gap-1.5 text-xs font-extrabold text-black hover:underline transition-colors"
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
                <div key={pm.id} className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-black truncate">{pm.label}</p>
                    {pm.expiryMonth && (
                      <p className="text-xs text-gray-500 font-bold">Exp. {pm.expiryMonth}/{pm.expiryYear}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {pm.isDefault ? (
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Default</span>
                    ) : (
                      <button onClick={() => handleSetDefault(pm.id)} className="text-xs text-gray-500 font-bold hover:text-black transition-colors">
                        Set default
                      </button>
                    )}
                    <button onClick={() => handleRemove(pm.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* UPI option */}
              <button
                onClick={() => toast.info('UPI linking coming soon!')}
                className="w-full flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-dashed border-gray-300 hover:border-black transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-black" />
                </div>
                <span className="text-sm text-gray-600 font-bold">Link UPI / Add bank</span>
              </button>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-black text-base">Recent Transactions</h2>
            <Link href="/app/wallet/history" className="text-xs font-extrabold text-black hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-2">
            {recentTxns.map((tx) => (
              <Link key={tx.id} href={`/app/wallet/receipt/${tx.id}`}>
                <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm flex items-center gap-3 hover:border-black transition-all">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', tx.type === 'credit' || tx.type === 'refund' ? 'bg-emerald-50' : 'bg-red-50')}>
                    {txnIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-black truncate">{tx.description.split(' · ')[0]}</p>
                    <p className="text-xs text-gray-500 font-bold">{format(new Date(tx.createdAt), 'dd MMM · h:mm a')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-sm font-extrabold', tx.type === 'credit' || tx.type === 'refund' ? 'text-emerald-700' : 'text-black')}>
                      {tx.type === 'credit' || tx.type === 'refund' ? '+' : '-'}₹{tx.amountInr}
                    </p>
                    <p className={cn('text-[10px] font-bold capitalize', tx.status === 'success' || tx.status === 'refunded' ? 'text-gray-400' : 'text-red-500')}>
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
        <form onSubmit={handleSubmit(handleAddCard)} className="space-y-4 pb-6 text-black">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Card Number</label>
            <input {...register('cardNumber')} placeholder="1234 5678 9012 3456" inputMode="numeric"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black font-mono tracking-widest" />
            {errors.cardNumber && <p className="mt-1 text-xs text-red-500">{errors.cardNumber.message as string}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Cardholder Name</label>
            <input {...register('cardHolder')} placeholder="THARUN KRISHNA"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black uppercase font-bold" />
            {errors.cardHolder && <p className="mt-1 text-xs text-red-500">{errors.cardHolder.message as string}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Expiry (MM/YY)</label>
              <input {...register('expiry')} placeholder="12/28"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black font-mono" />
              {errors.expiry && <p className="mt-1 text-xs text-red-500">{errors.expiry.message as string}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">CVV</label>
              <input {...register('cvv')} placeholder="•••" type="password" maxLength={3}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black font-mono" />
              {errors.cvv && <p className="mt-1 text-xs text-red-500">{errors.cvv.message as string}</p>}
            </div>
          </div>
          <p className="text-[10px] text-gray-500 font-bold">🔒 Secured with 256-bit encryption. Card details are tokenized and never stored.</p>
          <motion.button type="submit" disabled={addingCard} whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-xl bg-black text-white font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-md">
            {addingCard ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Add Card'}
          </motion.button>
        </form>
      </BottomSheet>
    </div>
  );
}
