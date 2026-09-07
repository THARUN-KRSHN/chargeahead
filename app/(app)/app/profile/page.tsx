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
    <div className="min-h-dvh bg-white px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6 text-black">
      {/* User Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
        <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center text-white text-2xl font-extrabold shadow-md shrink-0">
          {user?.name?.charAt(0).toUpperCase() ?? 'T'}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h1 className="text-xl font-extrabold text-black">{user?.name ?? 'Tharun Krishna'}</h1>
            <span className="bg-gray-100 border border-gray-300 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3 text-black" /> Verified EV Driver
            </span>
          </div>
          <p className="text-xs text-gray-500 font-bold">{user?.email ?? 'tharun@chargeahead.in'} • {user?.phone ?? '+91 98765 43210'}</p>
          <div className="text-xs text-gray-700 font-bold pt-1">
            Community Trust Level: <span className="text-black font-extrabold">Gold Contributor (Score: 94)</span>
          </div>
        </div>
      </div>

      {/* Sustainability & Usage Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2 font-bold">
            <Leaf className="w-4 h-4" />
          </div>
          <div className="text-lg font-extrabold text-black font-mono">1.8 Tons</div>
          <div className="text-[10px] text-gray-500 font-bold">CO₂ Avoided</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
          <div className="w-8 h-8 rounded-lg bg-gray-100 text-black flex items-center justify-center mx-auto mb-2 font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-lg font-extrabold text-black font-mono">482 kWh</div>
          <div className="text-[10px] text-gray-500 font-bold">Total Energy</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
          <div className="w-8 h-8 rounded-lg bg-gray-100 text-black flex items-center justify-center mx-auto mb-2 font-bold">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-lg font-extrabold text-black font-mono">14 Reports</div>
          <div className="text-[10px] text-gray-500 font-bold">Station Verifications</div>
        </div>
      </div>

      {/* Active Garage Banner */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Car className="w-4 h-4 text-black" /> Current Primary Vehicle
          </span>
          <Link href="/app/profile/vehicles" className="text-xs font-extrabold text-black hover:underline">
            Manage Garage →
          </Link>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-base font-extrabold text-black">
              {activeVehicle?.evModel ? `${activeVehicle.evModel.make} ${activeVehicle.evModel.model}` : 'Tata Nexon EV Max'}
            </div>
            <div className="text-xs text-gray-500 font-bold font-mono mt-0.5">
              {activeVehicle?.licensePlate ?? 'KA 01 EV 9988'} • {activeVehicle?.evModel?.batteryCapacityKwh ?? 40.5} kWh Battery
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
              CCS2 Compatible
            </span>
          </div>
        </div>
      </div>

      {/* Menu Links */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-200">
        <Link href="/app/profile/vehicles" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <Car className="w-5 h-5 text-black" />
            <span className="text-sm font-extrabold text-black">My EV Garage</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link href="/app/wallet" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-black" />
            <span className="text-sm font-extrabold text-black">Wallet & Payment Methods</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link href="/app/profile/settings" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-black" />
            <span className="text-sm font-extrabold text-black">App Settings & Preferences</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 text-red-600 hover:bg-red-50 transition-colors text-left font-extrabold"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-extrabold">Sign Out</span>
          </div>
        </button>
      </div>
    </div>
  );
}
