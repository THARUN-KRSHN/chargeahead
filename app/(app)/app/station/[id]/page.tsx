'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Clock, Star, Zap, Wifi, Coffee, ShoppingBag, UtensilsCrossed, Bath,
  ParkingSquare, AlertTriangle, ChevronLeft, CheckCircle2, XCircle, Flag, Share2
} from 'lucide-react';
import { fetchStationById, fetchStationReports, submitReport } from '@/lib/mock/api';
import { ConfidenceScore, ConfidenceBreakdown } from '@/components/shared/ConfidenceScore';
import { ReportIssueSheet } from '@/components/shared/ReportIssueSheet';
import { useReportStore } from '@/lib/services/reportStore';
import type { ChargingStation, CommunityReport, ReportType } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const AMENITY_ICONS: Record<string, { icon: any; label: string }> = {
  restroom: { icon: Bath, label: 'Restrooms' },
  food: { icon: UtensilsCrossed, label: 'Food' },
  wifi: { icon: Wifi, label: 'Wi-Fi' },
  parking: { icon: ParkingSquare, label: 'Parking' },
  shopping: { icon: ShoppingBag, label: 'Shopping' },
  coffee: { icon: Coffee, label: 'Coffee' },
  ev_lounge: { icon: Zap, label: 'EV Lounge' },
};

const REPORT_TYPES: { type: ReportType; label: string; color: string }[] = [
  { type: 'working', label: '✅ Working', color: 'text-emerald-700 font-bold' },
  { type: 'busy', label: '🚗 Busy', color: 'text-amber-700 font-bold' },
  { type: 'broken', label: '🔧 Broken', color: 'text-red-700 font-bold' },
  { type: 'blocked', label: '🚫 Blocked', color: 'text-red-700 font-bold' },
  { type: 'payment_issue', label: '💳 Payment Issue', color: 'text-amber-700 font-bold' },
  { type: 'offline', label: '⛔ Offline', color: 'text-red-700 font-bold' },
];

export default function StationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [station, setStation] = useState<ChargingStation | null>(null);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ports' | 'community'>('overview');

  useEffect(() => {
    Promise.all([fetchStationById(id), fetchStationReports(id)])
      .then(([s, r]) => { setStation(s); setReports(r); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmitReport = async () => {
    if (!selectedReportType) return;
    setSubmittingReport(true);
    try {
      const report = await submitReport(id, { type: selectedReportType, description: reportDescription });
      setReports((prev) => [report, ...prev]);
      setReportSheetOpen(false);
      setSelectedReportType(null);
      setReportDescription('');
      toast.success('Report submitted — thank you for helping the community!');
    } catch {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-fade-in bg-white">
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white text-black text-center">
        <XCircle className="w-12 h-12 text-red-500 mb-3" />
        <p className="text-gray-600 font-bold">Station not found</p>
        <button onClick={() => router.back()} className="mt-3 text-black font-extrabold text-sm hover:underline">Go back</button>
      </div>
    );
  }

  const statusColor = station.status === 'available' ? 'text-emerald-700' : station.status === 'busy' ? 'text-amber-700' : 'text-red-700';

  return (
    <div className="min-h-dvh bg-white text-black pb-8">
      {/* Hero area */}
      <div className="relative h-52 bg-gray-50 border-b border-gray-200 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-white opacity-80">
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 208">
            {[0,1,2,3,4,5].map(i => (
              <line key={`h${i}`} x1="0" y1={i*40} x2="400" y2={i*40} stroke="#000000" strokeWidth="0.5"/>
            ))}
            {[0,1,2,3,4,5,6,7,8,9].map(i => (
              <line key={`v${i}`} x1={i*50} y1="0" x2={i*50} y2="208" stroke="#000000" strokeWidth="0.5"/>
            ))}
          </svg>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center"
            >
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Back + share */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center border border-gray-200 hover:bg-white shadow-sm">
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>
          <button onClick={() => toast.info('Link copied to clipboard!')} className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center border border-gray-200 hover:bg-white shadow-sm">
            <Share2 className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Status badge */}
        <div className="absolute bottom-4 left-4">
          <span className={cn('connector-badge text-xs font-extrabold px-3 py-1 rounded-full', `status-${station.status}`)}>
            {station.availablePorts > 0 ? `${station.availablePorts} ports free` : station.status === 'offline' ? 'Offline' : 'All busy'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-black tracking-tight">{station.name}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">{station.address}</span>
            </div>
            <div className="flex items-center gap-3 mt-2 font-medium">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-black">{station.rating}</span>
                <span className="text-xs text-gray-400">({station.reviewCount})</span>
              </div>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-600">{station.operatingHours}</span>
              <span className="text-gray-300">·</span>
              <span className={cn('text-sm font-extrabold', statusColor)}>
                {station.status.charAt(0).toUpperCase() + station.status.slice(1)}
              </span>
            </div>
          </div>

          <ConfidenceScore score={station.confidenceScore} size="sm" showLabel={false} />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          <div className="glass-card rounded-xl p-3 text-center border-gray-200">
            <div className="text-lg font-extrabold text-emerald-600">{station.confidenceScore}%</div>
            <div className="text-[9px] text-gray-500 font-bold mt-0.5 uppercase">reliable</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center border-gray-200">
            <div className="text-lg font-extrabold text-black">{station.availablePorts}/{station.totalPorts}</div>
            <div className="text-[9px] text-gray-500 font-bold mt-0.5 uppercase">ports</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center border-gray-200">
            <div className="text-lg font-extrabold text-black">
              {station.predictedQueueMinutes > 0 ? `${station.predictedQueueMinutes}m` : '0m'}
            </div>
            <div className="text-[9px] text-gray-500 font-bold mt-0.5 uppercase">wait est.</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center border-gray-200">
            <div className="text-lg font-extrabold text-black font-mono">₹{station.pricePerKwh}</div>
            <div className="text-[9px] text-gray-500 font-bold mt-0.5 uppercase">per kWh</div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex gap-2 mb-5">
          {station.isReservable && (
            <Link href={`/app/station/${id}/reserve`} className="flex-1">
              <button className="w-full py-3.5 rounded-xl bg-black text-white font-extrabold text-sm hover:bg-gray-900 transition-all shadow-md">
                Reserve Slot
              </button>
            </Link>
          )}
          <Link href="/app/trip/active" className="flex-1">
            <button className={cn('w-full py-3.5 rounded-xl font-extrabold text-sm transition-all', station.isReservable ? 'border border-gray-300 text-black hover:bg-gray-50' : 'bg-black text-white hover:bg-gray-900 shadow-md')}>
              Navigate
            </button>
          </Link>
          <button
            onClick={() => toast.success('Station added as trip stop')}
            className="px-4 py-3.5 rounded-xl border border-gray-200 text-gray-700 hover:border-black hover:text-black text-sm font-bold transition-all"
          >
            + Stop
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 border border-gray-200">
          {(['overview', 'ports', 'community'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn('flex-1 py-2 rounded-lg text-xs font-extrabold transition-all capitalize', activeTab === tab ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black')}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Confidence breakdown */}
              <div className="glass-card rounded-2xl p-5 border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-extrabold text-black text-base">True Charging Availability™</h2>
                  <ConfidenceScore score={station.confidenceScore} size="sm" showLabel={false} />
                </div>
                <ConfidenceBreakdown breakdown={station.confidenceBreakdown} />
                <p className="text-[10px] text-gray-400 font-medium mt-3">
                  Last verified {formatDistanceToNow(new Date(station.lastVerifiedAt), { addSuffix: true })}
                </p>
              </div>

              {/* Amenities */}
              {station.amenities.length > 0 && (
                <div className="glass-card rounded-2xl p-5 border-gray-200">
                  <h2 className="font-extrabold text-black text-base mb-3">Amenities</h2>
                  <div className="grid grid-cols-4 gap-3">
                    {station.amenities.map((a) => {
                      const item = AMENITY_ICONS[a];
                      if (!item) return null;
                      const Icon = item.icon;
                      return (
                        <div key={a} className="flex flex-col items-center gap-1.5">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-black" />
                          </div>
                          <span className="text-[10px] text-gray-600 font-semibold text-center">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Queue info */}
              {station.queueLength > 0 && (
                <div className="glass-card rounded-2xl p-4 border border-amber-300 bg-amber-50">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span className="text-sm font-extrabold text-amber-800">Queue Alert</span>
                  </div>
                  <p className="text-xs text-amber-900 font-medium">
                    {station.queueLength} vehicle{station.queueLength !== 1 ? 's' : ''} waiting. Predicted wait time:{' '}
                    <span className="font-extrabold text-black">{station.predictedQueueMinutes} minutes</span>.
                  </p>
                  {station.isReservable && (
                    <Link href={`/app/station/${id}/reserve`}>
                      <button className="mt-2 text-xs font-extrabold text-black underline">
                        Reserve to skip queue →
                      </button>
                    </Link>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'ports' && (
            <motion.div key="ports" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
              {station.ports.map((port) => (
                <div key={port.id} className="glass-card rounded-xl p-4 flex items-center gap-3 border-gray-200">
                  <div className={cn('w-3 h-3 rounded-full shrink-0', port.status === 'available' ? 'bg-emerald-500' : port.status === 'busy' ? 'bg-amber-500' : 'bg-red-500')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-black">{port.connectorType}</span>
                      <span className="connector-badge text-[10px] text-black bg-gray-100 border-gray-200 font-bold">{port.speedKw} kW</span>
                      <span className={cn('connector-badge text-[10px] font-bold', `status-${port.status}`)}>{port.status}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium mt-0.5 block">₹{port.pricePerKwh}/kWh</span>
                  </div>
                  <Zap className={cn('w-4 h-4 shrink-0', port.status === 'available' ? 'text-black' : 'text-gray-300')} />
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'community' && (
            <CommunityTabSection station={station} onOpenReportSheet={() => setReportSheetOpen(true)} />
          )}
        </AnimatePresence>
      </div>

      {/* Report sheet */}
      <ReportIssueSheet
        isOpen={reportSheetOpen}
        onClose={() => setReportSheetOpen(false)}
        station={station}
      />
    </div>
  );
}

function CommunityTabSection({ station, onOpenReportSheet }: { station: ChargingStation; onOpenReportSheet: () => void }) {
  const reports = useReportStore((state) => state.getReportsForStation(station.id));
  const corroborateReport = useReportStore((state) => state.corroborateReport);

  return (
    <motion.div key="community" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-extrabold text-black text-base">Community Reports</h2>
        <button
          onClick={onOpenReportSheet}
          className="flex items-center gap-1.5 text-xs font-extrabold text-black hover:underline bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200"
        >
          <Flag className="w-3.5 h-3.5 text-black" /> Report issue
        </button>
      </div>
      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm font-medium">No reports yet. Be the first!</div>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="glass-card rounded-xl p-4 border-gray-200 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {r.reporterName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-black">{r.reporterName}</span>
                      <span
                        className={cn(
                          'connector-badge text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border',
                          r.category === 'working' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                        )}
                      >
                        {r.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {r.comment && <p className="text-xs text-gray-600 font-medium mt-1">{r.comment}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <span className="text-[11px] text-gray-500 font-semibold">
                  Status: <span className="font-extrabold text-black uppercase">{r.status}</span>
                </span>
                <button
                  type="button"
                  onClick={() => corroborateReport(r.id, 'user-001')}
                  className="text-xs font-extrabold text-black hover:underline bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1"
                >
                  👍 Me too ({r.corroborationCount})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
