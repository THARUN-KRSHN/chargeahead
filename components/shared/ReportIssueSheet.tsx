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
  color: string;
  activeBg: string;
}[] = [
  {
    category: 'broken',
    label: 'Broken Charger',
    icon: Wrench,
    color: 'text-red-600',
    activeBg: 'bg-red-500 text-white border-red-500',
  },
  {
    category: 'blocked',
    label: 'Spot Blocked',
    icon: Ban,
    color: 'text-amber-600',
    activeBg: 'bg-amber-500 text-white border-amber-500',
  },
  {
    category: 'busy',
    label: 'Long Queue',
    icon: Clock,
    color: 'text-amber-600',
    activeBg: 'bg-amber-600 text-white border-amber-600',
  },
  {
    category: 'payment_issue',
    label: 'Payment Failure',
    icon: CreditCard,
    color: 'text-purple-600',
    activeBg: 'bg-purple-600 text-white border-purple-600',
  },
  {
    category: 'incorrect_info',
    label: 'Wrong Info / Price',
    icon: Info,
    color: 'text-blue-600',
    activeBg: 'bg-blue-600 text-white border-blue-600',
  },
  {
    category: 'safety',
    label: 'Safety Concern',
    icon: AlertTriangle,
    color: 'text-red-700',
    activeBg: 'bg-red-700 text-white border-red-700',
  },
  {
    category: 'working',
    label: 'Working Perfectly',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    activeBg: 'bg-emerald-600 text-white border-emerald-600',
  },
];

export function ReportIssueSheet({ isOpen, onClose, station }: ReportIssueSheetProps) {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { canUserReport, submitReport } = useReportStore();

  const handleAttachPhoto = () => {
    // Mock photo attachment
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

    // Rate limiting check
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

      // Reset and close
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
      <div className="space-y-5 pb-6 text-slate-900">
        <div>
          <p className="text-xs font-bold text-slate-500">
            Reporting issue for <span className="font-extrabold text-slate-900">{station.name}</span>
          </p>
        </div>

        {/* Category Single-Select Chips */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
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
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all text-left ${
                    isSelected
                      ? activeBg
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : ''}`} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Comment Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Optional Context / Note
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Gun #2 CCS2 thermal cutout issue, wait queue is 4 cars..."
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-medium transition-all"
          />
        </div>

        {/* Mock Photo Attachment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Attach Photo Proof
            </span>
            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove photo
              </button>
            )}
          </div>

          {photoUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-28 bg-slate-100">
              <img src={photoUrl} alt="Report attachment" className="w-full h-full object-cover" />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAttachPhoto}
              className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 text-slate-600 flex items-center justify-center gap-2 text-xs font-extrabold transition-all"
            >
              <Camera className="w-4 h-4 text-emerald-600" /> Snap or Upload Photo
            </button>
          )}
        </div>

        {/* Submit Action Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedCategory || submitting}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
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
