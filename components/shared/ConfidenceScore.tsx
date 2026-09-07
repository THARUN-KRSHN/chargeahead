'use client';

import { cn } from '@/lib/utils';

interface ConfidenceScoreProps {
  score: number;          // 0–100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const levelConfig = {
  high: { color: '#00C853', label: 'High Confidence', textColor: 'text-emerald-700' },
  medium: { color: '#F59E0B', label: 'Medium Confidence', textColor: 'text-amber-700' },
  low: { color: '#E85D4C', label: 'Low Confidence', textColor: 'text-red-700' },
};

function getLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 75) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

const sizeConfig = {
  sm: { outer: 56, inner: 40, strokeWidth: 5, fontSize: 'text-sm', labelSize: 'text-[8px]' },
  md: { outer: 80, inner: 58, strokeWidth: 7, fontSize: 'text-xl', labelSize: 'text-[10px]' },
  lg: { outer: 120, inner: 88, strokeWidth: 9, fontSize: 'text-3xl', labelSize: 'text-xs' },
};

export function ConfidenceScore({ score, size = 'md', showLabel = true, className }: ConfidenceScoreProps) {
  const level = getLevel(score);
  const config = levelConfig[level];
  const dims = sizeConfig[size];
  const radius = (dims.outer - dims.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: dims.outer, height: dims.outer }}>
        <svg
          width={dims.outer}
          height={dims.outer}
          viewBox={`0 0 ${dims.outer} ${dims.outer}`}
          className="confidence-ring"
          aria-label={`Confidence score: ${score}%`}
        >
          {/* Background track */}
          <circle
            cx={dims.outer / 2}
            cy={dims.outer / 2}
            r={radius}
            fill="none"
            stroke="#E5E5E5"
            strokeWidth={dims.strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={dims.outer / 2}
            cy={dims.outer / 2}
            r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth={dims.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-extrabold text-black leading-none', dims.fontSize)}>
            {score}
          </span>
          <span className={cn('text-gray-400 font-bold mt-0.5', dims.labelSize)}>%</span>
        </div>
      </div>

      {showLabel && (
        <span className={cn('font-bold', dims.labelSize === 'text-xs' ? 'text-sm' : dims.labelSize, config.textColor)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

// Horizontal breakdown bars used in station detail
interface ConfidenceBreakdownProps {
  breakdown: { operatorData: number; communityData: number; historicalData: number };
}

export function ConfidenceBreakdown({ breakdown }: ConfidenceBreakdownProps) {
  const items = [
    { label: 'Operator telemetry', value: breakdown.operatorData, color: '#000000' },
    { label: 'Community check-ins', value: breakdown.communityData, color: '#00C853' },
    { label: 'Historical availability', value: breakdown.historicalData, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-3">
      {items.map(({ label, value, color }) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 font-medium">{label}</span>
            <span className="text-xs font-bold text-black">{value}%</span>
          </div>
          <div className="charge-bar">
            <div
              className="charge-bar-fill"
              style={{ width: `${value}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
