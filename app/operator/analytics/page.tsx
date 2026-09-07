'use client';

import { BarChart3, TrendingUp, DollarSign, Zap, Calendar } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const REVENUE_DATA = [
  { day: 'Mon', revenue: 24500, kwh: 1280 },
  { day: 'Tue', revenue: 28900, kwh: 1520 },
  { day: 'Wed', revenue: 31200, kwh: 1640 },
  { day: 'Thu', revenue: 29800, kwh: 1560 },
  { day: 'Fri', revenue: 38400, kwh: 2020 },
  { day: 'Sat', revenue: 45200, kwh: 2380 },
  { day: 'Sun', revenue: 42100, kwh: 2210 },
];

const CONNECTOR_DATA = [
  { name: 'CCS2 (DC Fast)', value: 72, color: '#39E5A0' },
  { name: 'Type 2 (AC Slow)', value: 18, color: '#1C7293' },
  { name: 'GB/T & CHAdeMO', value: 10, color: '#E85D4C' },
];

export default function OperatorAnalyticsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <span className="text-xs font-semibold text-teal-300 uppercase tracking-widest">Network Analytics</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Revenue & Utilization Intelligence</h1>
      </div>

      {/* Revenue Chart */}
      <div className="glass-card rounded-2xl p-6 border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Weekly Network Revenue</h2>
            <p className="text-xs text-white/50">Total energy sales across all 18 charging locations</p>
          </div>
          <span className="text-xs font-mono font-bold text-mint-400 bg-mint-400/10 px-3 py-1 rounded-full border border-mint-400/30">
            Weekly Total: {formatCurrency(240100)}
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={REVENUE_DATA}>
              <XAxis dataKey="day" stroke="#ffffff40" tick={{ fill: '#ffffff60', fontSize: 12 }} />
              <YAxis stroke="#ffffff40" tick={{ fill: '#ffffff60', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B1F3A', borderColor: '#1C7293', borderRadius: '12px' }}
                labelStyle={{ color: '#39E5A0', fontWeight: 'bold' }}
              />
              <Bar dataKey="revenue" fill="#1C7293" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid for Pie Chart & Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Connector type share */}
        <div className="glass-card rounded-2xl p-6 border-surface-border space-y-4">
          <h2 className="text-base font-bold text-white">Connector Type Distribution</h2>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={CONNECTOR_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {CONNECTOR_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0B1F3A', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CPO Efficiency Metrics */}
        <div className="glass-card rounded-2xl p-6 border-surface-border space-y-4">
          <h2 className="text-base font-bold text-white">Network Efficiency KPIs</h2>
          <div className="space-y-3 text-xs">
            <div className="bg-navy-900 p-4 rounded-xl border border-surface-border flex justify-between items-center">
              <span>Avg Session Duration:</span>
              <span className="font-mono font-bold text-white">38 Minutes</span>
            </div>
            <div className="bg-navy-900 p-4 rounded-xl border border-surface-border flex justify-between items-center">
              <span>Average Charging Speed:</span>
              <span className="font-mono font-bold text-mint-400">48.2 kW DC</span>
            </div>
            <div className="bg-navy-900 p-4 rounded-xl border border-surface-border flex justify-between items-center">
              <span>Port Turnover Rate:</span>
              <span className="font-mono font-bold text-teal-300">4.2 Sessions / Port / Day</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
