'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  Zap,
  ShieldAlert,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  ThumbsUp,
  Check,
  Wrench,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { MOCK_STATIONS } from '@/lib/mock/stations';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useReportStore } from '@/lib/services/reportStore';
import type { ReportStatus, StationReport } from '@/types';

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
    <div className="space-y-8 max-w-7xl mx-auto bg-white text-black pb-12">
      {/* Top Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">
            Network Operations Center
          </span>
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
            <p className="text-xs text-gray-500 font-bold">
              Aggregated port load across Bangalore & Expressway hubs
            </p>
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
              <XAxis
                dataKey="time"
                stroke="#00000040"
                tick={{ fill: '#000000', fontSize: 12, fontWeight: 'bold' }}
              />
              <YAxis stroke="#00000040" tick={{ fill: '#000000', fontSize: 12, fontWeight: 'bold' }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#000000',
                  borderRadius: '12px',
                  color: '#000',
                }}
                labelStyle={{ color: '#000000', fontWeight: 'bold' }}
              />
              <Area
                type="monotone"
                dataKey="utilization"
                stroke="#000000"
                strokeWidth={3}
                fill="url(#utilGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reported Issues Queue (Operator Control Loop) */}
      <ReportedIssuesQueueSection />

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
                  <div className="text-gray-500 font-bold text-[11px]">
                    {stn.city} • {stn.ports.length} Guns
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-emerald-700 font-mono font-extrabold">
                    {stn.confidenceScore}% Usability Score
                  </span>
                  <div className="text-[10px] text-gray-500 font-bold">
                    ₹{stn.pricePerKwhInr ?? stn.pricePerKwh}/kWh
                  </div>
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
              <p className="text-amber-800 font-medium">
                Gun #2 CCS2 thermal sensor reporting elevated temperature (72°C).
              </p>
              <span className="text-[10px] text-gray-500 font-bold block pt-1">
                Flagged 14 mins ago via CPO Heartbeat
              </span>
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

function ReportedIssuesQueueSection() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const reports = useReportStore((state) => state.reports);
  const updateReportStatus = useReportStore((state) => state.updateReportStatus);

  const filtered = reports.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const handleAction = (report: StationReport, targetStatus: ReportStatus) => {
    if (targetStatus === 'resolved') {
      if (resolvingId !== report.id) {
        setResolvingId(report.id);
        setResolutionNote('');
        return;
      }
      // Confirm resolve with note
      updateReportStatus(report.id, 'resolved', resolutionNote || 'Issue inspected & resolved by operator.');
      setResolvingId(null);
      setResolutionNote('');
      toast.success(`Report #${report.id.slice(-4)} marked resolved! Station confidence score restored.`);
      return;
    }

    updateReportStatus(report.id, targetStatus);
    toast.info(`Report #${report.id.slice(-4)} status updated to "${targetStatus}".`);
  };

  return (
    <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest">
            Operator Action Queue
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
            <Wrench className="w-5 h-5 text-emerald-600" /> Incoming Community Issue Reports
          </h2>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {(['all', 'new', 'in_progress', 'resolved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all ${
                filter === tab ? 'bg-black text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm font-semibold">
            No reports in queue for tab "{filter}"
          </div>
        ) : (
          filtered.map((r) => {
            const station = MOCK_STATIONS.find((s) => s.id === r.stationId) || {
              name: `Station ${r.stationId}`,
            };
            const isResolved = r.status === 'resolved';

            const isHighSeverity = r.category === 'broken' || r.category === 'safety';
            const categoryBadge = isHighSeverity
              ? 'bg-red-50 text-red-700 border-red-200'
              : r.category === 'working'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200';

            return (
              <div
                key={r.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-slate-300 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900">{station.name}</span>
                      <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-extrabold uppercase ${categoryBadge}`}>
                        {r.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[10px] font-extrabold uppercase">
                        Status: {r.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-3">
                      <span>Reported by: <strong className="text-slate-800">{r.reporterName}</strong></span>
                      <span>•</span>
                      <span suppressHydrationWarning>{mounted ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-emerald-600" /> {r.corroborationCount} corroborations
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-slate-400">#{r.id.slice(-6)}</span>
                </div>

                {r.comment && (
                  <p className="text-xs text-slate-800 font-medium bg-white p-3 rounded-xl border border-slate-200 shadow-inner">
                    "{r.comment}"
                  </p>
                )}

                {r.operatorNote && (
                  <div className="text-xs text-emerald-900 font-medium bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Operator Resolution Note:</strong> {r.operatorNote}</span>
                  </div>
                )}

                {/* Operator Actions */}
                {!isResolved && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    {resolvingId === r.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Add resolution note (e.g. Technician replaced gun lock)"
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleAction(r, 'resolved')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black shadow-md uppercase tracking-wider"
                        >
                          Confirm Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => setResolvingId(null)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {r.status === 'new' && (
                          <button
                            type="button"
                            onClick={() => handleAction(r, 'acknowledged')}
                            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-extrabold transition-all shadow-sm"
                          >
                            Acknowledge
                          </button>
                        )}
                        {r.status !== 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => handleAction(r, 'in_progress')}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold transition-all shadow-sm"
                          >
                            Mark In Progress
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAction(r, 'resolved')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black shadow-md transition-all flex items-center gap-1 uppercase tracking-wider"
                        >
                          <Check className="w-3.5 h-3.5" /> Resolve Issue
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
