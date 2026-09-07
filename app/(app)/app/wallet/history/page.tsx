'use client';

import { useState, useEffect } from 'react';
import { fetchTransactions } from '@/lib/mock/api';
import type { Transaction } from '@/types';
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function TransactionHistoryPage() {
  const router = useRouter();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'charge' | 'refund'>('all');

  useEffect(() => { fetchTransactions().then(setTxns).finally(() => setLoading(false)); }, []);

  const filtered = txns.filter((t) => filter === 'all' || t.type === filter || (filter === 'refund' && (t.type === 'refund' || t.status === 'refunded')));
  const totalSpent = txns.filter((t) => t.type === 'charge' && t.status === 'success').reduce((a, t) => a + t.amountInr, 0);

  return (
    <div className="min-h-dvh pb-8 bg-white text-black">
      <div className="sticky top-16 z-20 flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-200">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
          <ChevronLeft className="w-5 h-5 text-black" />
        </button>
        <h1 className="font-extrabold text-black">Transaction History</h1>
      </div>

      <div className="px-4 pt-4 max-w-lg mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 font-bold mb-1">Total spent</p>
            <p className="text-xl font-extrabold text-red-600">₹{totalSpent}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 font-bold mb-1">Sessions</p>
            <p className="text-xl font-extrabold text-black">{txns.filter((t) => t.type === 'charge').length}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'charge', 'refund'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-4 py-1.5 rounded-full text-xs font-extrabold transition-all border', filter === f ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:border-black')}>
              {f === 'all' ? 'All' : f === 'charge' ? 'Charges' : 'Refunds'}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx) => (
              <Link key={tx.id} href={`/app/wallet/receipt/${tx.id}`}>
                <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm flex items-center gap-3 hover:border-black transition-all cursor-pointer">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', tx.type === 'credit' || tx.type === 'refund' || tx.status === 'refunded' ? 'bg-emerald-50' : 'bg-red-50')}>
                    {tx.type === 'credit' || tx.type === 'refund' || tx.status === 'refunded' ? (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-black truncate">{tx.description.split(' · ')[0]}</p>
                    <p className="text-xs text-gray-500 font-bold">{format(new Date(tx.createdAt), 'dd MMM yyyy · h:mm a')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-sm font-extrabold', tx.type === 'credit' || tx.status === 'refunded' ? 'text-emerald-700' : 'text-black')}>
                      {tx.type === 'credit' || tx.status === 'refunded' ? '+' : '-'}₹{tx.amountInr}
                    </p>
                    <p className={cn('text-[10px] font-bold capitalize', tx.status === 'success' ? 'text-gray-400' : tx.status === 'refunded' ? 'text-amber-600' : 'text-red-500')}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
