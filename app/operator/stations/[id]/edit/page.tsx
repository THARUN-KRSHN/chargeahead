'use client';

import { use, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Zap, Radio, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { getStationById } from '@/lib/mock/stations';
import { toast } from 'sonner';

export default function EditStationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const station = getStationById(id);

  if (!station) {
    notFound();
  }

  const [price, setPrice] = useState(station.pricePerKwhInr.toString());
  const [status, setStatus] = useState(station.status);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    toast.success(`Updated tariff & status for ${station.name}! ⚡`);
    router.push('/operator/stations');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/operator/stations" className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Stations
      </Link>

      <div>
        <span className="text-xs text-teal-300 font-semibold">{station.operator}</span>
        <h1 className="text-2xl font-bold text-white mt-0.5">Edit Station Configuration</h1>
        <p className="text-xs text-white/50">{station.name} • {station.city}</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 border-surface-border space-y-5 text-xs">
        <div>
          <label className="block text-white/60 font-semibold mb-1.5">Energy Tariff Rate (₹ per kWh)</label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-navy-900 border border-surface-border rounded-xl px-4 py-3 text-sm text-white font-mono"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">₹ / kWh</span>
          </div>
        </div>

        <div>
          <label className="block text-white/60 font-semibold mb-1.5">Operational Mode</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full bg-navy-900 border border-surface-border rounded-xl px-4 py-3 text-sm text-white"
          >
            <option value="operational">Operational (Online & Available)</option>
            <option value="busy">Busy / High Queue</option>
            <option value="maintenance">Maintenance Mode (Offline)</option>
          </select>
        </div>

        <div>
          <label className="block text-white/60 font-semibold mb-1.5">Operator Dispatch Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Scheduled firmware update tonight 02:00-04:00 AM..."
            className="w-full bg-navy-900 border border-surface-border rounded-xl px-4 py-3 text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-mint-gradient text-navy-900 font-bold text-xs shadow-mint-glow hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Station Configuration
        </button>
      </form>
    </div>
  );
}
