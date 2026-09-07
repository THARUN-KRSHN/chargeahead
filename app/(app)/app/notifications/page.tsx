'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Navigation, Zap, ShieldAlert, CheckCircle, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { formatRelativeTime } from '@/lib/utils';

export default function NotificationsCenterPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  return (
    <div className="min-h-dvh bg-navy-900 px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-mint-400" /> Notifications
          </h1>
          <p className="text-sm text-white/50">Live station alerts, reroute prompts, and charging updates</p>
        </div>

        <button
          onClick={markAllAsRead}
          className="text-xs text-mint-400 font-semibold hover:underline flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" /> Mark all read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-surface-card p-1 rounded-xl border border-surface-border w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'all' ? 'bg-mint-400 text-navy-900' : 'text-white/60 hover:text-white'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'unread' ? 'bg-mint-400 text-navy-900' : 'text-white/60 hover:text-white'
          }`}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
        </button>
      </div>

      {/* Notification items */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-white/50 space-y-2">
            <Bell className="w-8 h-8 text-white/30 mx-auto" />
            <p className="text-sm font-semibold">No notifications to display</p>
          </div>
        ) : (
          filteredNotifs.map((n) => {
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => markAsRead(n.id)}
                className={`glass-card rounded-2xl p-4 transition-all cursor-pointer border ${
                  !n.isRead ? 'border-mint-400/40 bg-mint-400/5' : 'border-surface-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-mint-400/15 text-mint-400 flex items-center justify-center shrink-0 mt-0.5">
                    {n.type === 'reroute_alert' && <Navigation className="w-4 h-4 text-amber-400" />}
                    {n.type === 'charging_completed' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    {n.type === 'station_offline' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                    {n.type === 'reservation_reminder' && <Zap className="w-4 h-4 text-teal-300" />}
                    {n.type === 'payment_receipt' && <Zap className="w-4 h-4 text-mint-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-white truncate">{n.title}</h2>
                      <span className="text-[10px] text-white/40 font-mono">{formatRelativeTime(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">{n.body}</p>

                    {n.actionUrl && (
                      <Link
                        href={n.actionUrl}
                        className="inline-flex items-center gap-1 text-xs text-mint-400 font-semibold hover:underline mt-2.5"
                      >
                        Take Action <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
