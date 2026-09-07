'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface ChargingProgressBarProps {
  currentPercent: number;
  targetPercent?: number;
  powerKw?: number;
  energyKwh?: number;
  costInr?: number;
  timeRemainingMinutes?: number;
  large?: boolean;
  className?: string;
}

export function ChargingProgressBar({
  currentPercent,
  targetPercent = 80,
  powerKw,
  energyKwh,
  costInr,
  timeRemainingMinutes,
  large = false,
  className,
}: ChargingProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, currentPercent));
  const color =
    clamped < 20 ? '#E85D4C' : clamped < 50 ? '#F59E0B' : '#00C853';

  return (
    <div className={cn('w-full', className)}>
      {/* Labels */}
      {large && (
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-4xl font-extrabold text-black leading-none">{clamped}%</div>
            <div className="text-xs text-gray-500 font-medium mt-1">Battery charge level</div>
          </div>
          {powerKw && (
            <div className="flex items-center gap-1 text-emerald-600">
              <Zap className="w-4 h-4 fill-emerald-600" />
              <span className="text-lg font-bold">{powerKw} kW</span>
            </div>
          )}
        </div>
      )}

      {/* Bar */}
      <div
        className={cn(
          'w-full rounded-full bg-gray-100 border border-gray-200 overflow-hidden relative',
          large ? 'h-4' : 'h-2.5',
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="h-full rounded-full relative"
          style={{
            background: color,
          }}
        >
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute right-0 top-0 bottom-0 w-3 rounded-full"
            style={{ background: color }}
          />
        </motion.div>

        {/* Target marker */}
        {targetPercent && targetPercent < 100 && (
          <div
            className="absolute h-full w-0.5 bg-black/40"
            style={{ left: `${targetPercent}%`, top: 0, transform: 'translateX(-50%)' }}
          />
        )}
      </div>

      {/* Stats row */}
      {large && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          {energyKwh !== undefined && (
            <div className="glass-card rounded-xl p-3 text-center border-gray-200">
              <div className="text-lg font-extrabold text-black">{energyKwh.toFixed(1)}</div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">kWh delivered</div>
            </div>
          )}
          {costInr !== undefined && (
            <div className="glass-card rounded-xl p-3 text-center border-gray-200">
              <div className="text-lg font-extrabold text-black">₹{costInr.toFixed(0)}</div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">cost accrued</div>
            </div>
          )}
          {timeRemainingMinutes !== undefined && (
            <div className="glass-card rounded-xl p-3 text-center border-gray-200">
              <div className="text-lg font-extrabold text-black">{timeRemainingMinutes}m</div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">remaining</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
