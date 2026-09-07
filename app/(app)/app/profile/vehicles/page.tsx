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
    toast.success(`${vehicle.make ?? vehicle.evModel?.make} ${vehicle.model ?? vehicle.evModel?.model} set as primary vehicle ⚡`);
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const created = {
      id: `v-${Date.now()}`,
      userId: 'user-001',
      evModelId: 'em-001',
      evModel: {
        id: 'em-001',
        make: newMake,
        model: newModel,
        year: 2024,
        batteryCapacityKwh: parseFloat(newCapacity),
        rangKm: 315,
        connectorTypes: ['CCS2' as const],
      },
      nickname: `${newMake} ${newModel}`,
      licensePlate: newPlate,
      currentChargePercent: 80,
      isDefault: false,
      addedAt: new Date().toISOString(),
    };

    setVehicles([...currentVehicles, created as any]);
    setShowAddModal(false);
    toast.success(`${newMake} ${newModel} added to garage!`);
  };

  return (
    <div className="min-h-dvh bg-white px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6 text-black">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link href="/app/profile" className="flex items-center gap-2 text-sm text-gray-600 font-bold hover:text-black">
          <ArrowLeft className="w-4 h-4" /> Profile
        </Link>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-black text-white px-3.5 py-2 rounded-xl font-extrabold text-xs shadow-md hover:bg-gray-900 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-black flex items-center gap-2">
          <Car className="w-6 h-6 text-black" /> My EV Garage
        </h1>
        <p className="text-sm text-gray-500 font-bold">Manage your connected electric vehicles and battery status.</p>
      </div>

      {/* Vehicles List */}
      <div className="space-y-4">
        {currentVehicles.map((v: any) => {
          const isPrimary = activeVehicle?.id === v.id;
          const make = v.make ?? v.evModel?.make ?? 'EV';
          const model = v.model ?? v.evModel?.model ?? 'Vehicle';
          const capacity = v.batteryCapacityKwh ?? v.evModel?.batteryCapacityKwh ?? 40;
          const connectors = v.connectorTypes ?? v.evModel?.connectorTypes ?? ['CCS2'];
          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
                isPrimary ? 'border-black ring-2 ring-black/10' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-gray-500">{make}</span>
                    {isPrimary && (
                      <span className="bg-black text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                        Primary Active
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-extrabold text-black mt-0.5">{model}</h2>
                  <p className="text-xs text-gray-500 font-bold font-mono mt-1">
                    Plate: {v.licensePlate} • Year {v.year ?? v.evModel?.year ?? 2024}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-sm font-extrabold text-black font-mono">{capacity} kWh</div>
                  <div className="text-[11px] text-emerald-700 font-extrabold">Fast Charge Ready</div>
                </div>
              </div>

              {/* Connectors & Actions */}
              <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {connectors.map((c: string) => (
                    <span key={c} className="bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg text-black font-extrabold font-mono">
                      {c}
                    </span>
                  ))}
                </div>

                {!isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(v)}
                    className="text-black hover:underline font-extrabold flex items-center gap-1"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4 text-black"
          >
            <h2 className="text-lg font-extrabold text-black">Add EV to Garage</h2>
            <form onSubmit={handleAddVehicle} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-gray-700 mb-1">Make</label>
                <input
                  type="text"
                  value={newMake}
                  onChange={(e) => setNewMake(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-black font-bold focus:border-black outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Model Name</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-black font-bold focus:border-black outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">License Plate</label>
                <input
                  type="text"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-black font-mono focus:border-black outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Battery Capacity (kWh)</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-black font-mono focus:border-black outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-black font-extrabold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-black text-white font-extrabold shadow-md hover:bg-gray-900"
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
