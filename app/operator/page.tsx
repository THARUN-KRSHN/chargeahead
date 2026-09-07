'use client';

import { motion } from 'framer-motion';
import { Radio, Zap, ShieldAlert, BarChart3, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { MOCK_STATIONS } from '@/lib/mock/stations';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const CHART_DATA = [
  { time: '06:00', utilization: 25, powerKw: 140 },
  { time: '09:00', utilization: 68, powerKw: 380 },
  { time: '12:00', utilization: 84, powerKw: 520 },
  { time: '15:00', utilization: 92, powerKw: 610 },
  { time: '18:00', utilization: 78, powerKw: 490 },
  { time: '21:00', utilization: 45, powerKw: 280 },
];

export default function OperatorDashboardPage() {
  const handleRefreshData = () => {
    toast.success('Synced live OCPI telemetry from 18 stations ⚡');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto bg-white text-black">
      {/* Top Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Network Operations Center</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-black">Station Operator Control Center</h1>
        </div>

        <button
          onClick={handleRefreshData}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-gray-900 transition-all shadow-md self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sync Telemetry Heartbeats
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-bold">Network Health</div>
          <div className="text-2xl font-extrabold text-black font-mono mt-1">98.4%</div>
          <div className="text-[11px] text-emerald-700 font-extrabold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 16 of 18 stations online
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-bold">Active Charging Sessions</div>
          <div className="text-2xl font-extrabold text-black font-mono mt-1">12 EVs</div>
          <div className="text-[11px] text-black font-extrabold mt-1">420 kW peak output</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-bold">Energy Delivered Today</div>
          <div className="text-2xl font-extrabold text-black font-mono mt-1">1,840 kWh</div>
          <div className="text-[11px] text-gray-500 font-bold mt-1">Avg 32 kWh / session</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-bold">Revenue Generated Today</div>
          <div className="text-2xl font-extrabold text-black font-mono mt-1">{formatCurrency(34960)}</div>
          <div className="text-[11px] text-gray-700 font-bold mt-1">₹19.0 / kWh tariff</div>
        </div>
      </div>

      {/* Utilization Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-black">Peak Hourly Network Utilization</h2>
            <p className="text-xs text-gray-500 font-bold">Aggregated port load across Bangalore & Expressway hubs</p>
          </div>
          <span className="text-xs text-black font-extrabold font-mono bg-gray-100 px-3 py-1 rounded-full border border-gray-300">
            Peak Load: 92% (15:00)
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CHART_DATA}>
              <defs>
                <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#000000" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#00000040" tick={{ fill: '#000000', fontSize: 12, fontWeight: 'bold' }} />
              <YAxis stroke="#00000040" tick={{ fill: '#000000', fontSize: 12, fontWeight: 'bold' }} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#000000', borderRadius: '12px', color: '#000' }}
                labelStyle={{ color: '#000000', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="utilization" stroke="#000000" strokeWidth={3} fill="url(#utilGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Stations & Maintenance Alert Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Stations quick table */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-black flex items-center gap-2">
              <Radio className="w-4 h-4 text-black" /> High Traffic Stations Overview
            </h2>
            <Link href="/operator/stations" className="text-xs text-black hover:underline font-extrabold">
              Manage All Stations →
            </Link>
          </div>

          <div className="divide-y divide-gray-200 text-xs">
            {MOCK_STATIONS.slice(0, 4).map((stn: any) => (
              <div key={stn.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-black">{stn.name}</div>
                  <div className="text-gray-500 font-bold text-[11px]">{stn.city} • {stn.ports.length} Guns</div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-emerald-700 font-mono font-extrabold">{stn.confidenceScore}% Usability Score</span>
                  <div className="text-[10px] text-gray-500 font-bold">₹{stn.pricePerKwhInr ?? stn.pricePerKwh}/kWh</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flagged Maintenance Alerts */}
        <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" /> Flagged Maintenance Alerts
          </h2>

          <div className="space-y-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-amber-300 shadow-sm space-y-1">
              <div className="text-amber-900 font-extrabold">ChargeZone Phoenix Hub</div>
              <p className="text-amber-800 font-medium">Gun #2 CCS2 thermal sensor reporting elevated temperature (72°C).</p>
              <span className="text-[10px] text-gray-500 font-bold block pt-1">Flagged 14 mins ago via CPO Heartbeat</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-1">
              <div className="text-black font-extrabold">Statiq Connaught Place</div>
              <p className="text-gray-700 font-medium">Community Check-in: Driver reported screen backlight flicker.</p>
              <span className="text-[10px] text-gray-500 font-bold block pt-1">Flagged 45 mins ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
