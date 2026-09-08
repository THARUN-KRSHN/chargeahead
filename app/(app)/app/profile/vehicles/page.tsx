'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Car, Plus, Check, Zap, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useVehicleStore } from '@/lib/store/vehicleStore';
import { MOCK_VEHICLES } from '@/lib/mock/users';
import { EV_MODELS } from '@/lib/mock/vehicles';
import type { EVModel } from '@/types';
import { toast } from 'sonner';

export default function GarageVehiclesPage() {
  const { vehicles, activeVehicle, setActiveVehicle, setVehicles } = useVehicleStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>(EV_MODELS[0]?.id || 'tata-nexon-ev-empowered');
  const [newMake, setNewMake] = useState(EV_MODELS[0]?.make || 'Tata');
  const [newModel, setNewModel] = useState(EV_MODELS[0]?.model || 'Nexon EV Empowered+ LR');
  const [newPlate, setNewPlate] = useState('KA 03 EV 4321');
  const [newCapacity, setNewCapacity] = useState(String(EV_MODELS[0]?.batteryCapacityKwh || 45));
  const [isCustom, setIsCustom] = useState(false);

  const currentVehicles = vehicles.length > 0 ? vehicles : MOCK_VEHICLES;

  const handleSelectDatasetModel = (modelId: string) => {
    setSelectedModelId(modelId);
    if (modelId === 'custom') {
      setIsCustom(true);
      return;
    }
    setIsCustom(false);
    const found = EV_MODELS.find((m) => m.id === modelId);
    if (found) {
      setNewMake(found.make);
      setNewModel(found.model);
      setNewCapacity(String(found.batteryCapacityKwh));
    }
  };

  const selectedEvModel: EVModel | undefined = isCustom ? undefined : EV_MODELS.find((m) => m.id === selectedModelId);

  const handleSetPrimary = (vehicle: any) => {
    setActiveVehicle(vehicle);
    toast.success(`${vehicle.make ?? vehicle.evModel?.make} ${vehicle.model ?? vehicle.evModel?.model} set as primary vehicle ⚡`);
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const capacityNum = parseFloat(newCapacity) || 40;
    const connectors = selectedEvModel?.connectorTypes || ['CCS2', 'Type2'];
    const rangeKm = selectedEvModel?.rangKm || Math.round(capacityNum * 8.5);

    const created = {
      id: `v-${Date.now()}`,
      userId: 'user-001',
      evModelId: selectedEvModel?.id || `custom-${Date.now()}`,
      evModel: {
        id: selectedEvModel?.id || `custom-${Date.now()}`,
        make: newMake,
        model: newModel,
        year: selectedEvModel?.year || 2024,
        batteryCapacityKwh: capacityNum,
        rangKm: rangeKm,
        connectorTypes: connectors,
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
          className="flex items-center gap-1.5 bg-black text-white px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-md hover:bg-gray-900 transition-all"
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
          const rangeKm = v.rangKm ?? v.evModel?.rangKm ?? 350;
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
                    <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">{make}</span>
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
                  <div className="text-[11px] text-emerald-700 font-extrabold">{rangeKm} km Range</div>
                </div>
              </div>

              {/* Connectors & Actions */}
              <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {connectors.map((c: string) => (
                    <span key={c} className="bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg text-black font-extrabold font-mono text-[10px]">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-lg w-full border border-gray-200 shadow-2xl space-y-4 text-black"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-black">Add EV to Garage</h2>
                <p className="text-xs text-gray-500 font-bold">Select your EV model from our verified dataset</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                <Zap className="w-4 h-4 fill-current" />
              </div>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4 text-xs font-bold">
              {/* Dropdown Selector */}
              <div>
                <label className="block text-gray-700 font-extrabold uppercase text-[10px] tracking-wider mb-1.5">
                  Select EV Model Dataset
                </label>
                <select
                  value={selectedModelId}
                  onChange={(e) => handleSelectDatasetModel(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-3 text-black font-extrabold focus:border-black outline-none transition-all"
                >
                  <optgroup label="Select from Verified EV Dataset">
                    {EV_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.make} {m.model} ({m.batteryCapacityKwh} kWh · {m.rangKm} km)
                      </option>
                    ))}
                  </optgroup>
                  <option value="custom">✏️ Custom / Other EV Model</option>
                </select>
              </div>

              {/* Verified Spec Preview Card */}
              {selectedEvModel && !isCustom && (
                <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 border border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Verified EV Specs
                    </span>
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                      {selectedEvModel.year} Model
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-sm font-black">{selectedEvModel.make} {selectedEvModel.model}</div>
                      <div className="text-xs text-slate-400 font-medium">Battery Pack: <span className="text-white font-bold">{selectedEvModel.batteryCapacityKwh} kWh</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-emerald-400">{selectedEvModel.rangKm} km</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Estimated Range</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold">Supported Ports:</span>
                    {selectedEvModel.connectorTypes.map((c) => (
                      <span key={c} className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-500/30">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Inputs */}
              {isCustom ? (
                <div className="grid grid-cols-2 gap-3">
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
                    <label className="block text-gray-700 mb-1">Battery Capacity (kWh)</label>
                    <input
                      type="number"
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-black font-mono focus:border-black outline-none"
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block text-gray-700 mb-1">License Plate Number</label>
                <input
                  type="text"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  placeholder="e.g. KA 03 EV 4321"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-black font-mono font-bold focus:border-black outline-none uppercase"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-300 text-black font-extrabold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-black text-white font-extrabold shadow-md hover:bg-gray-900"
                >
                  Save EV to Garage
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
