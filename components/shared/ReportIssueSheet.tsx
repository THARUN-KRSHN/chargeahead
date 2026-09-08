'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wrench,
  Ban,
  Clock,
  CheckCircle2,
  CreditCard,
  Info,
  AlertTriangle,
  Camera,
  X,
  Send,
  Loader2,
} from 'lucide-react';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { useReportStore } from '@/lib/services/reportStore';
import type { ReportCategory, ChargingStation } from '@/types';
import { toast } from 'sonner';

interface ReportIssueSheetProps {
  isOpen: boolean;
  onClose: () => void;
  station: ChargingStation;
}

const CATEGORIES: {
  category: ReportCategory;
  label: string;
  icon: any;
  activeBg: string;
}[] = [
  {
    category: 'broken',
    label: 'Broken Charger',
    icon: Wrench,
    activeBg: 'bg-red-600 text-white border-red-500 shadow-md shadow-red-900/30',
  },
  {
    category: 'blocked',
    label: 'Spot Blocked',
    icon: Ban,
    activeBg: 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-900/30',
  },
  {
    category: 'busy',
    label: 'Long Queue',
    icon: Clock,
    activeBg: 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-900/30',
  },
  {
    category: 'payment_issue',
    label: 'Payment Failure',
    icon: CreditCard,
    activeBg: 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/30',
  },
  {
    category: 'incorrect_info',
    label: 'Wrong Info / Price',
    icon: Info,
    activeBg: 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30',
  },
  {
    category: 'safety',
    label: 'Safety Concern',
    icon: AlertTriangle,
    activeBg: 'bg-red-700 text-white border-red-600 shadow-md shadow-red-950/40',
  },
  {
    category: 'working',
    label: 'Working Perfectly',
    icon: CheckCircle2,
    activeBg: 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30',
  },
];

export function ReportIssueSheet({ isOpen, onClose, station }: ReportIssueSheetProps) {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { canUserReport, submitReport } = useReportStore();

  const handleAttachPhoto = () => {
    const mockPhotos = [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&q=80',
      'https://images.unsplash.com/photo-1558441719-23451ead6699?w=400&q=80',
    ];
    const photo = mockPhotos[Math.floor(Math.random() * mockPhotos.length)];
    setPhotoUrl(photo);
    toast.info('Mock photo attached');
  };

  const handleSubmit = async () => {
    if (!selectedCategory) return;

    const userId = 'user-001';
    const rateCheck = canUserReport(userId, station.id);
    if (!rateCheck.allowed) {
      toast.error(`Please wait ${rateCheck.waitMinutes} mins before submitting another report for this station.`);
      return;
    }

    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      submitReport({
        stationId: station.id,
        stationName: station.name,
        userId: 'user-001',
        userName: 'Tharun Krishna',
        category: selectedCategory,
        comment: comment.trim() || undefined,
        photoUrl: photoUrl || undefined,
      });

      toast.success('Thanks! Your report has been sent to the station operator and community.');

      setSelectedCategory(null);
      setComment('');
      setPhotoUrl(null);
      onClose();
    } catch {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Report an Issue" showHandle showCloseButton>
      <div className="space-y-4 pt-1 text-white">
        <div className="bg-slate-800/70 rounded-2xl p-3 border border-slate-700/60 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-semibold">Reporting for</span>
          <span className="text-xs font-black text-emerald-400 truncate max-w-[240px]">{station.name}</span>
        </div>

        {/* Category Single-Select Chips */}
        <div className="space-y-2">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Select Primary Issue
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(({ category, label, icon: Icon, activeBg }) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center gap-2.5 transition-all text-left ${
                    isSelected
                      ? activeBg
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Comment Textarea */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Optional Context / Note
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Gun #2 CCS2 thermal cutout issue, wait queue is 4 cars..."
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 resize-none font-medium transition-all"
          />
        </div>

        {/* Photo Attachment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Attach Photo Proof
            </span>
            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="text-[11px] font-extrabold text-red-400 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove photo
              </button>
            )}
          </div>

          {photoUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 h-28 bg-slate-800">
              <img src={photoUrl} alt="Report attachment" className="w-full h-full object-cover" />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAttachPhoto}
              className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-800/50 hover:bg-slate-800 text-slate-300 flex items-center justify-center gap-2 text-xs font-extrabold transition-all"
            >
              <Camera className="w-4 h-4 text-emerald-400" /> Snap or Upload Photo
            </button>
          )}
        </div>

        {/* Submit Action Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedCategory || submitting}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider mt-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting Report…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Submit Report to Community & Operator
            </>
          )}
        </button>
      </div>
    </BottomSheet>
  );
}
