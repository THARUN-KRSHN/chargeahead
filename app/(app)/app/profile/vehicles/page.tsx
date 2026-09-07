'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Car, Plus, Check, Trash2, BatteryCharging, Zap } from 'lucide-react';
import Link from 'next/link';
import { useVehicleStore } from '@/lib/store/vehicleStore';
import { MOCK_VEHICLES } from '@/lib/mock/users';
import { toast } from 'sonner';

export default function GarageVehiclesPage() {
  const { vehicles, activeVehicle, setActiveVehicle, setVehicles } = useVehicleStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMake, setNewMake] = useState('Tata');
  const [newModel, setNewModel] = useState('Punch EV');
  const [newPlate, setNewPlate] = useState('KA 03 EV 4321');
  const [newCapacity, setNewCapacity] = useState('35');

  const currentVehicles = vehicles.length > 0 ? vehicles : MOCK_VEHICLES;

  const handleSetPrimary = (vehicle: any) => {
    setActiveVehicle(vehicle);
    toast.success(`${vehicle.make} ${vehicle.model} set as primary vehicle ⚡`);
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const created = {
      id: `v-${Date.now()}`,
      userId: 'user-001',
      make: newMake,
      model: newModel,
      year: 2024,
      batteryCapacityKwh: parseFloat(newCapacity),
      maxChargingPowerKw: 50,
      connectorTypes: ['CCS2' as const],
      licensePlate: newPlate,
      isDefault: false,
      currentBatteryPercent: 80,
    };

    setVehicles([...currentVehicles, created]);
    setShowAddModal(false);
    toast.success(`${created.make} ${created.model} added to garage!`);
  };

  return (
    <div className="min-h-dvh bg-navy-900 px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link href="/app/profile" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Profile
        </Link>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-mint-gradient text-navy-900 px-3.5 py-2 rounded-xl font-bold text-xs shadow-mint-glow hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Car className="w-6 h-6 text-mint-400" /> My EV Garage
        </h1>
        <p className="text-sm text-white/50">Manage your connected electric vehicles and battery status.</p>
      </div>

      {/* Vehicles List */}
      <div className="space-y-4">
        {currentVehicles.map((v) => {
          const isPrimary = activeVehicle?.id === v.id;
          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-card rounded-2xl p-5 border transition-all ${
                isPrimary ? 'border-mint-400/60 shadow-mint-glow' : 'border-surface-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-teal-300">{v.make}</span>
                    {isPrimary && (
                      <span className="bg-mint-400 text-navy-900 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                        Primary Active
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white mt-0.5">{v.model}</h2>
                  <p className="text-xs text-white/50 font-mono mt-1">
                    Plate: {v.licensePlate} • Year {v.year}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-sm font-bold text-white font-mono">{v.batteryCapacityKwh} kWh</div>
                  <div className="text-[11px] text-mint-400 font-semibold">{v.maxChargingPowerKw} kW Max Charging</div>
                </div>
              </div>

              {/* Connectors & Actions */}
              <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {v.connectorTypes.map((c) => (
                    <span key={c} className="bg-surface-card border border-surface-border px-2.5 py-1 rounded-lg text-white/70 font-mono">
                      {c}
                    </span>
                  ))}
                </div>

                {!isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(v)}
                    className="text-mint-400 hover:text-mint-300 font-semibold flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Set as Primary EV
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-2xl p-6 max-w-md w-full border-mint-400/30 space-y-4"
          >
            <h2 className="text-lg font-bold text-white">Add EV to Garage</h2>
            <form onSubmit={handleAddVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block text-white/60 mb-1">Make</label>
                <input
                  type="text"
                  value={newMake}
                  onChange={(e) => setNewMake(e.target.value)}
                  className="w-full bg-navy-900 border border-surface-border rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white/60 mb-1">Model Name</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-navy-900 border border-surface-border rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white/60 mb-1">License Plate</label>
                <input
                  type="text"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  className="w-full bg-navy-900 border border-surface-border rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-white/60 mb-1">Battery Capacity (kWh)</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full bg-navy-900 border border-surface-border rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-surface-border text-white/70 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-mint-gradient text-navy-900 font-bold shadow-mint-glow"
                >
                  Save EV
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
