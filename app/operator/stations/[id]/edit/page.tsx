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

  const [price, setPrice] = useState((station.pricePerKwh ?? 18).toString());
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
    <div className="max-w-2xl mx-auto space-y-6 bg-white text-black">
      <Link href="/operator/stations" className="inline-flex items-center gap-2 text-xs text-gray-600 font-bold hover:text-black">
        <ArrowLeft className="w-4 h-4" /> Back to Stations
      </Link>

      <div>
        <span className="text-xs text-gray-500 font-bold">{station.operator}</span>
        <h1 className="text-2xl font-extrabold text-black mt-0.5">Edit Station Configuration</h1>
        <p className="text-xs text-gray-500 font-bold">{station.name} • {station.city}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl space-y-5 text-xs font-bold text-black">
        <div>
          <label className="block text-gray-700 mb-1.5">Energy Tariff Rate (₹ per kWh)</label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-black font-mono font-bold focus:border-black outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹ / kWh</span>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 mb-1.5">Operational Mode</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-black font-bold focus:border-black outline-none"
          >
            <option value="operational">Operational (Online & Available)</option>
            <option value="busy">Busy / High Queue</option>
            <option value="maintenance">Maintenance Mode (Offline)</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-1.5">Operator Dispatch Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Scheduled firmware update tonight 02:00-04:00 AM..."
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:border-black outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-black text-white font-extrabold text-xs shadow-md hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Station Configuration
        </button>
      </form>
    </div>
  );
}
