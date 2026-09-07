'use client';

import { motion } from 'framer-motion';
import { User, Car, Shield, Award, Leaf, Zap, Settings, CreditCard, ChevronRight, LogOut, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { useVehicleStore } from '@/lib/store/vehicleStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const { activeVehicle } = useVehicleStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.replace('/login');
  };

  return (
    <div className="min-h-dvh bg-navy-900 px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      {/* User Header */}
      <div className="glass-card rounded-2xl p-6 border-mint-400/30 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
        <div className="w-20 h-20 rounded-full bg-teal-gradient flex items-center justify-center text-white text-2xl font-bold border-4 border-mint-400/30 shadow-mint-glow shrink-0">
          {user?.name?.charAt(0).toUpperCase() ?? 'T'}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h1 className="text-xl font-bold text-white">{user?.name ?? 'Tharun Krishna'}</h1>
            <span className="bg-mint-400/15 border border-mint-400/30 text-mint-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" /> Verified EV Driver
            </span>
          </div>
          <p className="text-xs text-white/50">{user?.email ?? 'tharun@chargeahead.in'} • {user?.phone ?? '+91 98765 43210'}</p>
          <div className="text-xs text-teal-300 font-semibold pt-1">
            Community Trust Level: <span className="text-mint-400 font-bold">Gold Contributor (Score: 94)</span>
          </div>
        </div>
      </div>

      {/* Sustainability & Usage Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-400/15 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <Leaf className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-white font-mono">1.8 Tons</div>
          <div className="text-[10px] text-white/50">CO₂ Avoided</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-mint-400/15 text-mint-400 flex items-center justify-center mx-auto mb-2">
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-white font-mono">482 kWh</div>
          <div className="text-[10px] text-white/50">Total Energy</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-teal-400/15 text-teal-300 flex items-center justify-center mx-auto mb-2">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-white font-mono">14 Reports</div>
          <div className="text-[10px] text-white/50">Station Verifications</div>
        </div>
      </div>

      {/* Active Garage Banner */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
            <Car className="w-4 h-4 text-mint-400" /> Current Primary Vehicle
          </span>
          <Link href="/app/profile/vehicles" className="text-xs font-semibold text-mint-400 hover:underline">
            Manage Garage →
          </Link>
        </div>
        <div className="bg-navy-900/80 border border-surface-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-white">
              {activeVehicle ? `${activeVehicle.make} ${activeVehicle.model}` : 'Tata Nexon EV Max'}
            </div>
            <div className="text-xs text-white/50 font-mono mt-0.5">
              {activeVehicle?.licensePlate ?? 'KA 01 EV 9988'} • {activeVehicle?.batteryCapacityKwh ?? 40.5} kWh Battery
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-mint-400 bg-mint-400/10 px-2.5 py-1 rounded-full border border-mint-400/30">
              CCS2 Compatible
            </span>
          </div>
        </div>
      </div>

      {/* Menu Links */}
      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-surface-border">
        <Link href="/app/profile/vehicles" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <Car className="w-5 h-5 text-teal-400" />
            <span className="text-sm font-semibold text-white">My EV Garage</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30" />
        </Link>

        <Link href="/app/wallet" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-mint-400" />
            <span className="text-sm font-semibold text-white">Wallet & Payment Methods</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30" />
        </Link>

        <Link href="/app/profile/settings" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-teal-300" />
            <span className="text-sm font-semibold text-white">App Settings & Preferences</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 text-red-400 hover:bg-red-500/10 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-semibold">Sign Out</span>
          </div>
        </button>
      </div>
    </div>
  );
}
