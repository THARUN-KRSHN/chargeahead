'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Battery, Zap, CloudSun, Sun, Cloud, CloudRain, Snowflake, Mountain, ChevronDown, ChevronUp } from 'lucide-react';
import { useVehicleStore } from '@/lib/store/vehicleStore';

interface RangeEstimatorProps {
  nearbyStationsCount?: number;
  onRangeCalculated?: (rangeKm: number) => void;
}

type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'cold';
type TerrainCondition = 'flat' | 'hilly' | 'mountain';

export function RangeEstimator({ nearbyStationsCount = 12, onRangeCalculated }: RangeEstimatorProps) {
  const { activeVehicle } = useVehicleStore();
  const [isOpen, setIsOpen] = useState(false);
  const [batteryPercent, setBatteryPercent] = useState(activeVehicle?.currentChargePercent ?? 75);
  const [weather, setWeather] = useState<WeatherCondition>('sunny');
  const [terrain, setTerrain] = useState<TerrainCondition>('flat');

  // Specs from EV model or standard defaults (Tata Nexon EV Max: 40.5 kWh, 437 km)
  const capacityKwh = activeVehicle?.evModel?.batteryCapacityKwh ?? 40.5;
  const claimedRangeKm = activeVehicle?.evModel?.rangKm ?? 437;

  // Real formula:
  // base_efficiency = capacityKwh / claimedRangeKm (kWh/km)
  // penalties adjust energy consumption rate
  const weatherPenalty: Record<WeatherCondition, number> = {
    sunny: 0.0,
    cloudy: 0.05,
    rainy: 0.12,
    cold: 0.20,
  };

  const terrainPenalty: Record<TerrainCondition, number> = {
    flat: 0.0,
    hilly: 0.10,
    mountain: 0.25,
  };

  const estimatedRange = useMemo(() => {
    const baseEfficiency = capacityKwh / claimedRangeKm;
    const adjustedEfficiency = baseEfficiency * (1 + weatherPenalty[weather] + terrainPenalty[terrain]);
    const usableEnergy = capacityKwh * (batteryPercent / 100);
    const range = Math.round(usableEnergy / adjustedEfficiency);
    if (onRangeCalculated) onRangeCalculated(range);
    return range;
  }, [capacityKwh, claimedRangeKm, batteryPercent, weather, terrain, onRangeCalculated]);

  // Charging estimate to 80%
  const kwhNeeded = Math.max(0, capacityKwh * (0.8 - batteryPercent / 100));
  const estimatedChargeCost = Math.round(kwhNeeded * 16); // ₹16 avg / kWh

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 shadow-sm text-black">
      {/* Header / Summary row */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
            <Battery className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dynamic EV Range</span>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Physics-Driven
              </span>
            </div>
            <div className="text-xl font-extrabold text-black font-mono">
              ~{estimatedRange} km <span className="text-xs font-bold text-gray-500">at {batteryPercent}% SoC</span>
            </div>
          </div>
        </div>

        <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Controls */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-4 border-t border-gray-200 mt-4 overflow-hidden"
          >
            {/* Battery Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <Battery className="w-3.5 h-3.5 text-black" /> Current State of Charge (SoC)
                </span>
                <span className="font-mono text-black font-extrabold">{batteryPercent}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={batteryPercent}
                onChange={(e) => setBatteryPercent(Number(e.target.value))}
                className="w-full accent-black h-2 bg-gray-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Weather condition toggle */}
            <div>
              <span className="text-[11px] font-bold text-gray-600 block mb-1.5 uppercase tracking-wider">
                Weather & Temperature
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { id: 'sunny', label: 'Sunny 30°C', icon: Sun },
                    { id: 'cloudy', label: 'Cloudy 22°C', icon: CloudSun },
                    { id: 'rainy', label: 'Rainy (AC ON)', icon: CloudRain },
                    { id: 'cold', label: 'Cold (<10°C)', icon: Snowflake },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setWeather(id)}
                    className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border flex flex-col items-center gap-1 transition-all ${
                      weather === id
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Terrain toggle */}
            <div>
              <span className="text-[11px] font-bold text-gray-600 block mb-1.5 uppercase tracking-wider">
                Elevation & Gradient
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'flat', label: 'City / Highway (Flat)', icon: Zap },
                    { id: 'hilly', label: 'Rolling Hills (+10%)', icon: Mountain },
                    { id: 'mountain', label: 'Ghats / Mountain (+25%)', icon: Mountain },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTerrain(id)}
                    className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border flex flex-col items-center gap-1 transition-all ${
                      terrain === id
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Insight footer */}
            <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">To charge to 80%:</span>
              <span className="font-extrabold text-black">
                {batteryPercent >= 80 ? 'Already above 80%' : `~₹${estimatedChargeCost} (${kwhNeeded.toFixed(1)} kWh)`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
