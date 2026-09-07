'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Bell, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function OnboardingPreferencesPage() {
  const router = useRouter();
  const [prefFastChargingOnly, setPrefFastChargingOnly] = useState(true);
  const [minConfidenceScore, setMinConfidenceScore] = useState(70);
  const [autoRerouteEnabled, setAutoRerouteEnabled] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    toast.success('Onboarding complete! Welcome to ChargeAhead ⚡');
    router.replace('/app/home');
  };

  return (
    <div className="min-h-dvh bg-white text-black py-10 px-4 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-6"
      >
        {/* Step Header */}
        <div className="flex items-center justify-between text-xs text-gray-500 font-semibold border-b border-gray-200 pb-4">
          <span className="text-black font-extrabold uppercase tracking-wider">Step 2 of 2</span>
          <span>Trip & Charging Preferences</span>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-black flex items-center gap-2 tracking-tight">
            <Sparkles className="w-7 h-7 text-black" /> Smart Preferences
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Configure how ChargeAhead plans your trips and alerts you to unexpected station queues.
          </p>
        </div>

        {/* Preference Toggles */}
        <div className="glass-card rounded-2xl p-6 space-y-5 border-gray-200">
          {/* Fast charging only */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-extrabold text-black flex items-center gap-2">
                <Zap className="w-4 h-4 text-black" /> Prefer Fast Chargers (50kW+)
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Filter out slow AC chargers for highway trips</p>
            </div>
            <button
              type="button"
              onClick={() => setPrefFastChargingOnly((v) => !v)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                prefFastChargingOnly ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  prefFastChargingOnly ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Min Reliability Score */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-black font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-black" /> Minimum Station Reliability Score
              </span>
              <span className="text-black font-mono font-extrabold text-sm">{minConfidenceScore}%+</span>
            </div>
            <input
              type="range"
              min="50"
              max="90"
              step="5"
              value={minConfidenceScore}
              onChange={(e) => setMinConfidenceScore(Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
            <p className="text-[11px] text-gray-500 font-medium mt-1">Only recommend stations verified by community reports & live telemetry</p>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Live Rerouting */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-extrabold text-black">Predictive Live Rerouting</div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Automatically suggest alternative chargers if queue develops en route</p>
            </div>
            <button
              type="button"
              onClick={() => setAutoRerouteEnabled((v) => !v)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                autoRerouteEnabled ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  autoRerouteEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Push Notifications */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-extrabold text-black flex items-center gap-2">
                <Bell className="w-4 h-4 text-black" /> Session & Booking Alerts
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Get notified when charging completes or station becomes available</p>
            </div>
            <button
              type="button"
              onClick={() => setPushNotifications((v) => !v)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                pushNotifications ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  pushNotifications ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleFinish}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-black text-white font-extrabold text-base flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-md"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Launch ChargeAhead <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
