'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ChargingStation } from '@/types';
import { MapPin, Clock, Zap, Star } from 'lucide-react';
import Link from 'next/link';

interface StationCardProps {
  station: ChargingStation;
  className?: string;
  compact?: boolean;
}

const statusConfig: Record<string, { label: string; className: string; borderColor: string }> = {
  available: { label: 'Available', className: 'status-available', borderColor: '#22C55E' },
  busy:      { label: 'Busy',      className: 'status-busy',      borderColor: '#F59E0B' },
  offline:   { label: 'Offline',   className: 'status-offline',   borderColor: '#6B7280' },
  unknown:   { label: 'Unknown',   className: 'status-unknown',   borderColor: '#94A3B8' },
};

const confidenceColor: Record<string, string> = {
  high:   'text-emerald-600',
  medium: 'text-amber-600',
  low:    'text-red-600',
};

export function StationCard({ station, className, compact = false }: StationCardProps) {
  const status = statusConfig[station.status] ?? statusConfig.unknown;
  const confColor = confidenceColor[station.confidenceLevel] ?? 'text-gray-600';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <Link href={`/app/station/${station.id}`}>
        <div
          className={cn(
            'glass-card rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-98 relative overflow-hidden',
            className,
          )}
          style={{ borderLeft: `4px solid ${status.borderColor}` }}
        >
          {/* Sponsored badge */}
          {station.isSponsored && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-50 border border-amber-300 rounded-full px-2 py-0.5">
              <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
              <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wide">Sponsored</span>
            </div>
          )}

          {/* Header row */}
          <div className={cn('flex items-start gap-2 mb-3', station.isSponsored ? 'pr-20' : '')}>
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-black text-base leading-tight truncate">{station.name}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500 truncate font-medium">
                  {station.city}
                  {station.distance !== undefined && ` · ${station.distance} km`}
                </span>
              </div>
            </div>

            {/* Confidence score */}
            <div className={cn('text-right shrink-0', confColor)}>
              <div className="text-lg font-extrabold leading-none">{station.confidenceScore}%</div>
              <div className="text-[10px] text-gray-400 font-semibold mt-0.5">reliable</div>
            </div>
          </div>

          {/* Status + ETA row */}
          <div className="flex items-center gap-2 mb-3">
            <span className={cn('connector-badge text-[10px] font-bold px-2 py-0.5 rounded-full', status.className)}>
              {status.label}
            </span>
            {station.etaMinutes !== undefined && (
              <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <Clock className="w-3 h-3" />
                {station.etaMinutes} min
              </span>
            )}
            {station.queueLength > 0 && (
              <span className="text-xs text-amber-600 font-semibold">
                · {station.queueLength} in queue
              </span>
            )}
          </div>

          {!compact && (
            <>
              {/* Port availability */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-black" />
                  <span className="text-xs text-gray-700 font-medium">
                    <span className="text-black font-bold">{station.availablePorts}</span>
                    <span className="text-gray-400">/{station.totalPorts} ports free</span>
                  </span>
                </div>
                {station.fastChargeAvailable && (
                  <span className="connector-badge text-[10px] text-black bg-gray-100 font-bold border-gray-200">
                    {station.ultraFastAvailable ? '⚡ Ultra-fast' : '⚡ Fast'}
                  </span>
                )}
              </div>

              {/* Footer: price + rating */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-500">
                  from{' '}
                  <span className="text-black font-bold">₹{station.pricePerKwh}/kWh</span>
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-xs text-gray-600 font-semibold">
                    {station.rating.toFixed(1)}{' '}
                    <span className="text-gray-400 font-normal">({station.reviewCount})</span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
