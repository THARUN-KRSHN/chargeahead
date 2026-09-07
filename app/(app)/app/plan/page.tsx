'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Car, BatteryCharging, ArrowRight, Search, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVehicleStore } from '@/lib/store/vehicleStore';
import { searchPlaces } from '@/lib/mock/api';
import { toast } from 'sonner';

const RECENT_SEARCHES = [
  { label: 'Mysuru Palace, Mysuru', dist: '142 km', origin: 'Bengaluru' },
  { label: 'Express Avenue Mall, Chennai', dist: '346 km', origin: 'Bengaluru' },
  { label: 'Cyber City, Gurugram', dist: '28 km', origin: 'New Delhi' },
  { label: 'Lonavala Expressway Stop, Pune', dist: '64 km', origin: 'Mumbai' },
];

export default function TripPlanSearchPage() {
  const router = useRouter();
  const { activeVehicle } = useVehicleStore();
  const [origin, setOrigin] = useState('Koramangala, Bengaluru');
  const [destination, setDestination] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(activeVehicle?.currentBatteryPercent ?? 75);
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const handleDestinationChange = async (val: string) => {
    setDestination(val);
    if (val.length > 2) {
      const res = await searchPlaces(val);
      setSearchResults(res);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectDestination = (dest: string) => {
    setDestination(dest);
    setSearchResults([]);
  };

  const handlePlanRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      toast.error('Please enter a destination to plan trip');
      return;
    }
    const params = new URLSearchParams({
      origin,
      destination,
      battery: batteryLevel.toString(),
    });
    router.push(`/app/plan/route?${params.toString()}`);
  };

  return (
    <div className="min-h-dvh bg-white text-black px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-extrabold text-black uppercase tracking-widest mb-1">
          <Sparkles className="w-4 h-4 text-black" /> AI Trip Planner
        </div>
        <h1 className="text-3xl font-extrabold text-black tracking-tight">Plan Your EV Journey</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">
          Predictive charging stop planning tailored to your vehicle's range, battery level, and live station availability.
        </p>
      </div>

      {/* Plan Form */}
      <form onSubmit={handlePlanRoute} className="glass-card rounded-2xl p-6 space-y-5 border-gray-200 shadow-sm">
        {/* Vehicle summary banner */}
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Car className="w-4 h-4 text-black" />
            <span className="font-extrabold text-black">
              {activeVehicle ? `${activeVehicle.make} ${activeVehicle.model}` : 'Tata Nexon EV Max'}
            </span>
          </div>
          <Link href="/app/profile/vehicles" className="text-black font-extrabold hover:underline">
            Change EV
          </Link>
        </div>

        {/* Origin */}
        <div className="relative">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Starting Location</label>
          <div className="relative">
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 text-sm text-black font-medium focus:outline-none focus:border-black focus:bg-white"
            />
            <Navigation className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Destination with autocomplete */}
        <div className="relative">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Destination</label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Mysuru, Chennai, Hyderabad..."
              value={destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 text-sm text-black font-medium focus:outline-none focus:border-black focus:bg-white"
            />
            <MapPin className="w-4 h-4 text-black absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          {/* Autocomplete dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl z-20">
              {searchResults.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectDestination(item)}
                  className="w-full text-left px-4 py-3 text-sm text-black hover:bg-gray-100 font-medium flex items-center gap-2 border-b border-gray-100 last:border-0"
                >
                  <Search className="w-3.5 h-3.5 text-gray-400" /> {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current Battery Level */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="text-gray-700 flex items-center gap-1.5">
              <BatteryCharging className="w-4 h-4 text-black" /> Current Battery Charge
            </span>
            <span className="text-black font-mono text-sm">{batteryLevel}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={batteryLevel}
            onChange={(e) => setBatteryLevel(Number(e.target.value))}
            className="w-full accent-black cursor-pointer"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full py-4 rounded-xl bg-black text-white font-extrabold text-base flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-md mt-2"
        >
          Calculate Optimal Route & Stops <ArrowRight className="w-5 h-5" />
        </motion.button>
      </form>

      {/* Recent / Suggested Destinations */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Popular Long Distance Routes
        </h2>
        <div className="space-y-2">
          {RECENT_SEARCHES.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setOrigin(item.origin);
                setDestination(item.label);
              }}
              className="w-full glass-card p-4 rounded-xl flex items-center justify-between text-left hover:border-black transition-all group"
            >
              <div>
                <div className="text-sm font-extrabold text-black group-hover:underline">
                  {item.label}
                </div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">From {item.origin}</div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-extrabold text-black">{item.dist}</span>
                <span className="block text-[10px] text-emerald-700 font-bold">1 Stop Required</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
