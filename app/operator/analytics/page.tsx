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
  { name: 'CCS2 (DC Fast)', value: 72, color: '#000000' },
  { name: 'Type 2 (AC Slow)', value: 18, color: '#666666' },
  { name: 'GB/T & CHAdeMO', value: 10, color: '#999999' },
];

export default function OperatorAnalyticsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto bg-white text-black">
      <div>
        <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Network Analytics</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-black">Revenue & Utilization Intelligence</h1>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-black">Weekly Network Revenue</h2>
            <p className="text-xs text-gray-500 font-bold">Total energy sales across all 18 charging locations</p>
          </div>
          <span className="text-xs font-mono font-extrabold text-black bg-gray-100 px-3 py-1 rounded-full border border-gray-300">
            Weekly Total: {formatCurrency(240100)}
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={REVENUE_DATA}>
              <XAxis dataKey="day" stroke="#00000040" tick={{ fill: '#000000', fontSize: 12, fontWeight: 'bold' }} />
              <YAxis stroke="#00000040" tick={{ fill: '#000000', fontSize: 12, fontWeight: 'bold' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#000000', borderRadius: '12px', color: '#000' }}
                labelStyle={{ color: '#000000', fontWeight: 'bold' }}
              />
              <Bar dataKey="revenue" fill="#000000" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid for Pie Chart & Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Connector type share */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-black">Connector Type Distribution</h2>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={CONNECTOR_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {CONNECTOR_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #ccc' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CPO Efficiency Metrics */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-black">Network Efficiency KPIs</h2>
          <div className="space-y-3 text-xs font-bold">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
              <span className="text-gray-700">Avg Session Duration:</span>
              <span className="font-mono font-extrabold text-black">38 Minutes</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
              <span className="text-gray-700">Average Charging Speed:</span>
              <span className="font-mono font-extrabold text-emerald-700">48.2 kW DC</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
              <span className="text-gray-700">Port Turnover Rate:</span>
              <span className="font-mono font-extrabold text-black">4.2 Sessions / Port / Day</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
