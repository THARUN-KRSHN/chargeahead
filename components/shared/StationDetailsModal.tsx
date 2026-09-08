'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  MapPin,
  Clock,
  ShieldCheck,
  Star,
  Plus,
  Calendar,
  AlertTriangle,
  ThumbsUp,
  Flag,
} from 'lucide-react';
import type { ChargingStation } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useReportStore } from '@/lib/services/reportStore';
import { ReportIssueSheet } from '@/components/shared/ReportIssueSheet';

interface StationDetailsModalProps {
  station: ChargingStation | null;
  onClose: () => void;
  onSelectAsStop?: (station: ChargingStation) => void;
}

export function StationDetailsModal({
  station,
  onClose,
  onSelectAsStop,
}: StationDetailsModalProps) {
  const [reportSheetOpen, setReportSheetOpen] = useState(false);

  const allReports = useReportStore((state) => state.reports);
  const reports = useMemo(() => {
    if (!station) return [];
    return allReports.filter((r) => r.stationId === station.id);
  }, [allReports, station?.id]);

  const corroborateReport = useReportStore((state) => state.corroborateReport);
  const computeConfidenceScore = useReportStore((state) => state.computeConfidenceScore);

  if (!station) return null;

  const liveConfidenceScore = computeConfidenceScore(station);

  const confColor =
    liveConfidenceScore >= 80
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : liveConfidenceScore >= 60
      ? 'text-amber-600 bg-amber-50 border-amber-200'
      : 'text-red-600 bg-red-50 border-red-200';

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900"
          >
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-start justify-between relative">
              <div className="flex items-start gap-3 pr-8">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                    {station.operator}
                  </span>
                  <h2 className="text-base font-black leading-tight text-white">{station.name}</h2>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{station.address}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Reliability Badge & Port Availability Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Reliability score card */}
                <div className={cn('p-3 rounded-2xl border flex flex-col justify-between', confColor)}>
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" /> Reliability Score
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black">{liveConfidenceScore}%</div>
                    <div className="text-[10px] font-semibold opacity-80">Calculated Live Data</div>
                  </div>
                </div>

                {/* Ports Status card */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-emerald-600" /> Port Status
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900">
                      {station.availablePorts} <span className="text-sm font-bold text-slate-400">/ {station.totalPorts}</span>
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-600">Available Now</div>
                  </div>
                </div>
              </div>

              {/* Persistent Report An Issue Bar */}
              <div className="p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Notice something wrong here?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReportSheetOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-md flex items-center gap-1"
                >
                  <Flag className="w-3.5 h-3.5" /> Report Issue
                </button>
              </div>

              {/* Recent Community Reports Feed */}
              {reports.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Recent Community Reports ({reports.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {reports.slice(0, 3).map((report) => {
                      const isWorking = report.category === 'working';
                      const badgeColor = isWorking
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-red-100 text-red-800 border-red-200';

                      return (
                        <div
                          key={report.id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900">{report.reporterName}</span>
                              <span
                                className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase tracking-wide ${badgeColor}`}
                              >
                                {report.category}
                              </span>
                            </div>
                            <span suppressHydrationWarning className="text-[10px] text-slate-400 font-semibold">
                              {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {report.comment && (
                            <p className="text-slate-600 font-medium leading-tight text-xs">{report.comment}</p>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                            <span className="text-slate-400 font-semibold">
                              Status: <span className="font-extrabold text-slate-700 uppercase">{report.status}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => corroborateReport(report.id, 'user-001')}
                              className="text-emerald-700 hover:text-emerald-900 font-extrabold flex items-center gap-1 hover:underline bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200"
                            >
                              <ThumbsUp className="w-3 h-3" /> Me too ({report.corroborationCount})
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ports & Speeds List */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Available Charger Plugs ({station.ports.length})
                </h3>
                <div className="space-y-2">
                  {station.ports.map((port, i) => (
                    <div
                      key={port.id || i}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          ⚡
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-slate-900">{port.connectorType}</div>
                          <div className="text-[11px] text-slate-500 font-semibold">{port.speedKw} kW Fast Charging</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-600">₹{port.pricePerKwh}/kWh</div>
                        <span className="inline-block text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {port.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operating Hours & Amenities */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Hours:
                  </span>
                  <span className="font-extrabold text-slate-900">{station.operatingHours || '24/7'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> User Rating:
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {station.rating} ★ ({station.reviewCount} reviews)
                  </span>
                </div>

                {station.amenities && station.amenities.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400 mb-1.5">Amenities</div>
                    <div className="flex flex-wrap gap-1.5">
                      {station.amenities.map((a) => (
                        <span
                          key={a}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 capitalize"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {onSelectAsStop && (
                  <button
                    onClick={() => {
                      onSelectAsStop(station);
                      onClose();
                    }}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4" /> Add as Charging Stop
                  </button>
                )}

                <Link href={`/app/station/${station.id}/reserve`} className="block w-full">
                  <button className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all">
                    <Calendar className="w-4 h-4 text-emerald-400" /> Reserve Charger Port
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      <ReportIssueSheet
        isOpen={reportSheetOpen}
        onClose={() => setReportSheetOpen(false)}
        station={station}
      />
    </>
  );
}
