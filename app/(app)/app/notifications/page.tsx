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
    <div className="min-h-dvh bg-white px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6 text-black">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-black flex items-center gap-2">
            <Bell className="w-6 h-6 text-black" /> Notifications
          </h1>
          <p className="text-sm text-gray-500 font-bold">Live station alerts, reroute prompts, and charging updates</p>
        </div>

        <button
          onClick={markAllAsRead}
          className="text-xs text-black font-extrabold hover:underline flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" /> Mark all read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
            filter === 'all' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
            filter === 'unread' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
          }`}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
        </button>
      </div>

      {/* Notification items */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm text-gray-500 space-y-2">
            <Bell className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm font-bold">No notifications to display</p>
          </div>
        ) : (
          filteredNotifs.map((n) => {
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => markAsRead(n.id)}
                className={`bg-white rounded-2xl p-4 transition-all cursor-pointer border shadow-sm ${
                  !n.isRead ? 'border-black bg-gray-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 text-black flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    {n.type === 'reroute_alert' && <Navigation className="w-4 h-4 text-amber-600" />}
                    {n.type === 'charging_completed' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                    {n.type === 'station_offline' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    {n.type === 'reservation_reminder' && <Zap className="w-4 h-4 text-black" />}
                    {n.type === 'payment_receipt' && <Zap className="w-4 h-4 text-black" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-extrabold text-black truncate">{n.title}</h2>
                      <span className="text-[10px] text-gray-400 font-bold font-mono">{formatRelativeTime(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-600 font-bold mt-1 leading-relaxed">{n.body}</p>

                    {n.actionUrl && (
                      <Link
                        href={n.actionUrl}
                        className="inline-flex items-center gap-1 text-xs text-black font-extrabold hover:underline mt-2.5"
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
