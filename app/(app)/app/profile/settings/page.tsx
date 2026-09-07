'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Shield, Lock, Trash2, Moon, Smartphone, Check } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [pushNotifs, setPushNotifs] = useState(true);
  const [rerouteAlerts, setRerouteAlerts] = useState(true);
  const [chargingCompleteSMS, setChargingCompleteSMS] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Security settings updated!');
  };

  return (
    <div className="min-h-dvh bg-navy-900 px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link href="/app/profile" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Profile
        </Link>
        <span className="text-xs text-white/40">App Settings</span>
      </div>

      <h1 className="text-2xl font-bold text-white">Settings & Preferences</h1>

      {/* Notifications Section */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-mint-400" /> Notifications & Alerts
        </h2>

        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-white font-semibold">Real-time Push Notifications</div>
            <div className="text-white/50">Station availability changes & session updates</div>
          </div>
          <button
            onClick={() => setPushNotifs((v) => !v)}
            className={`w-10 h-5 rounded-full relative transition-colors ${pushNotifs ? 'bg-mint-400' : 'bg-surface-border'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-navy-900 absolute top-0.5 transition-transform ${pushNotifs ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="h-px bg-surface-border" />

        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-white font-semibold">Predictive Reroute Popups</div>
            <div className="text-white/50">Instant alerts when queue builds up en route</div>
          </div>
          <button
            onClick={() => setRerouteAlerts((v) => !v)}
            className={`w-10 h-5 rounded-full relative transition-colors ${rerouteAlerts ? 'bg-mint-400' : 'bg-surface-border'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-navy-900 absolute top-0.5 transition-transform ${rerouteAlerts ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="h-px bg-surface-border" />

        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-white font-semibold">SMS Charging Alerts</div>
            <div className="text-white/50">Receive SMS when EV reaches 80% charge</div>
          </div>
          <button
            onClick={() => setChargingCompleteSMS((v) => !v)}
            className={`w-10 h-5 rounded-full relative transition-colors ${chargingCompleteSMS ? 'bg-mint-400' : 'bg-surface-border'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-navy-900 absolute top-0.5 transition-transform ${chargingCompleteSMS ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Account Security */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-300" /> Account Security
        </h2>

        <form onSubmit={handleSavePassword} className="space-y-3 text-xs">
          <div>
            <label className="block text-white/60 mb-1">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-navy-900 border border-surface-border rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-white/60 mb-1">New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-navy-900 border border-surface-border rounded-xl px-3 py-2 text-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold hover:bg-teal-500/30 transition-all"
          >
            Update Security Credentials
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="glass-card rounded-2xl p-5 border-red-500/30 space-y-3">
        <h2 className="text-sm font-bold text-red-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Danger Zone
        </h2>
        <p className="text-xs text-white/50">Permanently delete your ChargeAhead account and charging history.</p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold hover:bg-red-500/20 transition-all"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-2xl p-6 max-w-sm w-full border-red-500/40 text-center space-y-4"
          >
            <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Are you sure?</h3>
            <p className="text-xs text-white/60">
              This action cannot be undone. All trip history, saved vehicles, and wallet credits will be deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-surface-border text-white/70 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  toast.error('Demo Mode: Account deletion prevented');
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold"
              >
                Confirm Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
