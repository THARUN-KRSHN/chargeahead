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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-teal-300 uppercase tracking-widest">Network Operations Center</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Station Operator Control Center</h1>
        </div>

        <button
          onClick={handleRefreshData}
          className="flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-500/40 px-4 py-2 rounded-xl text-xs font-bold hover:bg-teal-500/30 transition-all self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sync Telemetry Heartbeats
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border-teal-400/30">
          <div className="text-xs text-white/50 font-medium">Network Health</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">98.4%</div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 16 of 18 stations online
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-mint-400/30">
          <div className="text-xs text-white/50 font-medium">Active Charging Sessions</div>
          <div className="text-2xl font-extrabold text-mint-400 font-mono mt-1">12 EVs</div>
          <div className="text-[11px] text-mint-400 font-semibold mt-1">420 kW peak output</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-surface-border">
          <div className="text-xs text-white/50 font-medium">Energy Delivered Today</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">1,840 kWh</div>
          <div className="text-[11px] text-white/40 mt-1">Avg 32 kWh / session</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-surface-border">
          <div className="text-xs text-white/50 font-medium">Revenue Generated Today</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">{formatCurrency(34960)}</div>
          <div className="text-[11px] text-teal-300 font-semibold mt-1">₹19.0 / kWh tariff</div>
        </div>
      </div>

      {/* Utilization Chart */}
      <div className="glass-card rounded-2xl p-6 border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Peak Hourly Network Utilization</h2>
            <p className="text-xs text-white/50">Aggregated port load across Bangalore & Expressway hubs</p>
          </div>
          <span className="text-xs text-teal-300 font-semibold font-mono bg-teal-400/10 px-3 py-1 rounded-full border border-teal-400/30">
            Peak Load: 92% (15:00)
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CHART_DATA}>
              <defs>
                <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#39E5A0" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#39E5A0" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#ffffff40" tick={{ fill: '#ffffff60', fontSize: 12 }} />
              <YAxis stroke="#ffffff40" tick={{ fill: '#ffffff60', fontSize: 12 }} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B1F3A', borderColor: '#1C7293', borderRadius: '12px' }}
                labelStyle={{ color: '#39E5A0', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="utilization" stroke="#39E5A0" strokeWidth={3} fill="url(#utilGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Stations & Maintenance Alert Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Stations quick table */}
        <div className="md:col-span-2 glass-card rounded-2xl p-6 border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-mint-400" /> High Traffic Stations Overview
            </h2>
            <Link href="/operator/stations" className="text-xs text-teal-300 hover:underline font-semibold">
              Manage All Stations →
            </Link>
          </div>

          <div className="divide-y divide-surface-border text-xs">
            {MOCK_STATIONS.slice(0, 4).map((stn) => (
              <div key={stn.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{stn.name}</div>
                  <div className="text-white/50 text-[11px]">{stn.city} • {stn.ports.length} Guns</div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-mint-400 font-mono font-bold">{stn.confidenceScore}% Usability Score</span>
                  <div className="text-[10px] text-white/40">₹{stn.pricePerKwhInr}/kWh</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flagged Maintenance Alerts */}
        <div className="glass-card rounded-2xl p-6 border-amber-400/30 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Flagged Maintenance Alerts
          </h2>

          <div className="space-y-3 text-xs">
            <div className="bg-navy-900/90 p-3 rounded-xl border border-amber-400/30 space-y-1">
              <div className="text-amber-400 font-bold">ChargeZone Phoenix Hub</div>
              <p className="text-white/60">Gun #2 CCS2 thermal sensor reporting elevated temperature (72°C).</p>
              <span className="text-[10px] text-white/40 block pt-1">Flagged 14 mins ago via CPO Heartbeat</span>
            </div>

            <div className="bg-navy-900/90 p-3 rounded-xl border border-surface-border space-y-1">
              <div className="text-teal-300 font-bold">Statiq Connaught Place</div>
              <p className="text-white/60">Community Check-in: Driver reported screen backlight flicker.</p>
              <span className="text-[10px] text-white/40 block pt-1">Flagged 45 mins ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
