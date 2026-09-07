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
    <div className="min-h-dvh bg-white px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6 text-black">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link href="/app/profile" className="flex items-center gap-2 text-sm text-gray-600 font-bold hover:text-black">
          <ArrowLeft className="w-4 h-4" /> Profile
        </Link>
        <span className="text-xs text-gray-400 font-bold">App Settings</span>
      </div>

      <h1 className="text-2xl font-extrabold text-black">Settings & Preferences</h1>

      {/* Notifications Section */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold text-black flex items-center gap-2">
          <Bell className="w-4 h-4 text-black" /> Notifications & Alerts
        </h2>

        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-black font-extrabold">Real-time Push Notifications</div>
            <div className="text-gray-500 font-bold">Station availability changes & session updates</div>
          </div>
          <button
            onClick={() => setPushNotifs((v) => !v)}
            className={`w-10 h-5 rounded-full relative transition-colors ${pushNotifs ? 'bg-black' : 'bg-gray-200'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${pushNotifs ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="h-px bg-gray-200" />

        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-black font-extrabold">Predictive Reroute Popups</div>
            <div className="text-gray-500 font-bold">Instant alerts when queue builds up en route</div>
          </div>
          <button
            onClick={() => setRerouteAlerts((v) => !v)}
            className={`w-10 h-5 rounded-full relative transition-colors ${rerouteAlerts ? 'bg-black' : 'bg-gray-200'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${rerouteAlerts ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="h-px bg-gray-200" />

        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-black font-extrabold">SMS Charging Alerts</div>
            <div className="text-gray-500 font-bold">Receive SMS when EV reaches 80% charge</div>
          </div>
          <button
            onClick={() => setChargingCompleteSMS((v) => !v)}
            className={`w-10 h-5 rounded-full relative transition-colors ${chargingCompleteSMS ? 'bg-black' : 'bg-gray-200'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${chargingCompleteSMS ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Account Security */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold text-black flex items-center gap-2">
          <Lock className="w-4 h-4 text-black" /> Account Security
        </h2>

        <form onSubmit={handleSavePassword} className="space-y-3 text-xs font-bold">
          <div>
            <label className="block text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-black focus:border-black outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-black focus:border-black outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-black text-white font-extrabold hover:bg-gray-900 transition-all shadow-md"
          >
            Update Security Credentials
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50/60 rounded-2xl p-5 border border-red-200 space-y-3">
        <h2 className="text-sm font-extrabold text-red-700 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Danger Zone
        </h2>
        <p className="text-xs text-gray-700 font-bold">Permanently delete your ChargeAhead account and charging history.</p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-extrabold hover:bg-red-700 transition-all shadow-sm"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl text-center space-y-4 text-black"
          >
            <Trash2 className="w-10 h-10 text-red-600 mx-auto" />
            <h3 className="text-lg font-extrabold text-black">Are you sure?</h3>
            <p className="text-xs text-gray-600 font-bold">
              This action cannot be undone. All trip history, saved vehicles, and wallet credits will be deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-black text-xs font-extrabold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  toast.error('Demo Mode: Account deletion prevented');
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-extrabold"
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
