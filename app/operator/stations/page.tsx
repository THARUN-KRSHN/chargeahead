'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Search, SlidersHorizontal, Edit3, Power, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { MOCK_STATIONS } from '@/lib/mock/stations';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function OperatorStationsPage() {
  const [search, setSearch] = useState('');
  const [stationsList, setStationsList] = useState(MOCK_STATIONS);

  const filtered = stationsList.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleStationMaintenance = (id: string) => {
    setStationsList((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const newStatus = s.status === 'operational' ? 'maintenance' : 'operational';
          toast.info(`${s.name} status toggled to ${newStatus}`);
          return { ...s, status: newStatus as any };
        }
        return s;
      }),
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-teal-300" /> Station Management
          </h1>
          <p className="text-xs text-white/50">Manage operational parameters, pricing tariffs, and maintenance mode</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search stations or cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy-900 border border-surface-border rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-teal-300"
          />
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Stations Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-surface-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-900 border-b border-surface-border text-white/50 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-6 py-4">Station Name</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tariff Rate</th>
                <th className="px-6 py-4">Confidence Index</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-white/80">
              {filtered.map((stn) => {
                const isOp = stn.status === 'operational';
                return (
                  <tr key={stn.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{stn.name}</div>
                      <div className="text-[10px] text-white/40 font-mono">{stn.id} • {stn.ports.length} Ports</div>
                    </td>
                    <td className="px-6 py-4 font-medium">{stn.city}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isOp ? 'bg-emerald-400/15 text-emerald-400' : 'bg-amber-400/15 text-amber-400'
                        }`}
                      >
                        {isOp ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {stn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-teal-300">
                      ₹{stn.pricePerKwhInr} / kWh
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-mint-400">
                      {stn.confidenceScore}% Usable
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => toggleStationMaintenance(stn.id)}
                        className="px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-white/70 hover:text-white text-[11px] font-semibold transition-all"
                      >
                        <Power className="w-3 h-3 inline mr-1" /> Toggle Mode
                      </button>

                      <Link
                        href={`/operator/stations/${stn.id}/edit`}
                        className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 text-[11px] font-bold transition-all"
                      >
                        <Edit3 className="w-3 h-3 inline mr-1" /> Edit Tariff
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
