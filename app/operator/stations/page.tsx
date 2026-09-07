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
    <div className="space-y-6 max-w-7xl mx-auto bg-white text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-black flex items-center gap-2">
            <Radio className="w-6 h-6 text-black" /> Station Management
          </h1>
          <p className="text-xs text-gray-500 font-bold">Manage operational parameters, pricing tariffs, and maintenance mode</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search stations or cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-xs text-black font-bold placeholder:text-gray-400 focus:outline-none focus:border-black"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Stations Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase font-extrabold text-[10px]">
              <tr>
                <th className="px-6 py-4">Station Name</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tariff Rate</th>
                <th className="px-6 py-4">Confidence Index</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-black">
              {filtered.map((stn: any) => {
                const isOp = stn.status === 'operational' || stn.status === 'available';
                return (
                  <tr key={stn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-black">{stn.name}</div>
                      <div className="text-[10px] text-gray-500 font-bold font-mono">{stn.id} • {stn.ports.length} Ports</div>
                    </td>
                    <td className="px-6 py-4 font-bold">{stn.city}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          isOp ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isOp ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {stn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-extrabold text-black">
                      ₹{stn.pricePerKwhInr ?? stn.pricePerKwh} / kWh
                    </td>
                    <td className="px-6 py-4 font-mono font-extrabold text-emerald-700">
                      {stn.confidenceScore}% Usable
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => toggleStationMaintenance(stn.id)}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-black hover:bg-gray-100 text-[11px] font-extrabold transition-all"
                      >
                        <Power className="w-3 h-3 inline mr-1" /> Toggle Mode
                      </button>

                      <Link
                        href={`/operator/stations/${stn.id}/edit`}
                        className="px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-900 text-[11px] font-extrabold transition-all shadow-sm"
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
