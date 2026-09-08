'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Car, Check, ArrowRight, BatteryCharging } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MOCK_VEHICLES } from '@/lib/mock/users';
import { useVehicleStore } from '@/lib/store/vehicleStore';
import { toast } from 'sonner';

import type { UserVehicle } from '@/types';

const POPULAR_MODELS = [
  { make: 'Tata', model: 'Nexon EV Max', batteryCapacityKwh: 40.5, maxChargingPowerKw: 50, connectorTypes: ['CCS2'], rangeKm: 453 },
  { make: 'Tata', model: 'Punch EV', batteryCapacityKwh: 35, maxChargingPowerKw: 50, connectorTypes: ['CCS2'], rangeKm: 421 },
  { make: 'MG', model: 'ZS EV', batteryCapacityKwh: 50.3, maxChargingPowerKw: 50, connectorTypes: ['CCS2'], rangeKm: 461 },
  { make: 'Hyundai', model: 'IONIQ 5', batteryCapacityKwh: 72.6, maxChargingPowerKw: 350, connectorTypes: ['CCS2'], rangeKm: 631 },
  { make: 'BYD', model: 'Atto 3', batteryCapacityKwh: 60.48, maxChargingPowerKw: 80, connectorTypes: ['CCS2'], rangeKm: 521 },
  { make: 'Tesla', model: 'Model 3', batteryCapacityKwh: 75, maxChargingPowerKw: 250, connectorTypes: ['CCS2', 'Type2'], rangeKm: 576 },
];

export default function OnboardingVehiclePage() {
  const router = useRouter();
  const { setActiveVehicle, setVehicles } = useVehicleStore();
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [licensePlate, setLicensePlate] = useState('KA 01 EV 9988');
  const [currentBatteryPercent, setCurrentBatteryPercent] = useState(65);
  const [loading, setLoading] = useState(false);

  const selected = POPULAR_MODELS[selectedModelIndex];

  const handleSave = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const modelId = `ev-${selected.make}-${selected.model}`.toLowerCase().replace(/\s+/g, '-');
    const newVehicle: UserVehicle = {
      id: `v-${Date.now()}`,
      userId: 'user-001',
      evModelId: modelId,
      evModel: {
        id: modelId,
        make: selected.make,
        model: selected.model,
        year: 2024,
        batteryCapacityKwh: selected.batteryCapacityKwh,
        rangKm: selected.rangeKm,
        connectorTypes: selected.connectorTypes as any,
      },
      licensePlate,
      isDefault: true,
      currentChargePercent: currentBatteryPercent,
      addedAt: new Date().toISOString(),
    };

    setVehicles([newVehicle, ...MOCK_VEHICLES]);
    setActiveVehicle(newVehicle);
    setLoading(false);
    toast.success(`${selected.make} ${selected.model} added to garage! ⚡`);
    router.replace('/onboarding/preferences');
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
          <span className="text-black font-extrabold uppercase tracking-wider">Step 1 of 2</span>
          <span>Vehicle Setup</span>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-black flex items-center gap-2 tracking-tight">
            <Car className="w-7 h-7 text-black" /> Select Your EV
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            ChargeAhead tailors routes, speeds, and charger compatibility to your exact EV model.
          </p>
        </div>

        {/* Model Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {POPULAR_MODELS.map((item, idx) => {
            const active = idx === selectedModelIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedModelIndex(idx)}
                className={`p-3.5 rounded-2xl text-left border transition-all ${
                  active
                    ? 'border-black bg-black text-white shadow-md'
                    : 'border-gray-200 bg-white text-black hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${active ? 'text-gray-300' : 'text-gray-500'}`}>{item.make}</span>
                  {active && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="text-sm font-extrabold mt-0.5">{item.model}</div>
                <div className={`text-[10px] mt-2 font-mono ${active ? 'text-gray-300' : 'text-gray-500'}`}>
                  {item.batteryCapacityKwh} kWh • {item.rangeKm} km
                </div>
              </button>
            );
          })}
        </div>

        {/* Details Form */}
        <div className="glass-card rounded-2xl p-5 space-y-4 border-gray-200">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              License Plate (Optional)
            </label>
            <input
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-black font-mono focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
              <span className="text-gray-700 flex items-center gap-1">
                <BatteryCharging className="w-4 h-4 text-black" /> Current Battery Level
              </span>
              <span className="text-black font-mono text-sm">{currentBatteryPercent}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={currentBatteryPercent}
              onChange={(e) => setCurrentBatteryPercent(Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-black text-white font-extrabold text-base flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-md"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Save & Continue to Preferences <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
