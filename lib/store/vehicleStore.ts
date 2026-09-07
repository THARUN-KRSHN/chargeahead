import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserVehicle } from '@/types';

interface VehicleState {
  activeVehicle: UserVehicle | null;
  vehicles: UserVehicle[];
  setActiveVehicle: (vehicle: UserVehicle) => void;
  setVehicles: (vehicles: UserVehicle[]) => void;
  addVehicle: (vehicle: UserVehicle) => void;
  removeVehicle: (vehicleId: string) => void;
  updateBattery: (vehicleId: string, percent: number) => void;
}

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set) => ({
      activeVehicle: null,
      vehicles: [],
      setActiveVehicle: (vehicle) => set({ activeVehicle: vehicle }),
      setVehicles: (vehicles) =>
        set({
          vehicles,
          activeVehicle: vehicles.find((v) => v.isDefault) ?? vehicles[0] ?? null,
        }),
      addVehicle: (vehicle) =>
        set((s) => ({ vehicles: [...s.vehicles, vehicle] })),
      removeVehicle: (vehicleId) =>
        set((s) => ({
          vehicles: s.vehicles.filter((v) => v.id !== vehicleId),
          activeVehicle:
            s.activeVehicle?.id === vehicleId
              ? s.vehicles.find((v) => v.id !== vehicleId) ?? null
              : s.activeVehicle,
        })),
      updateBattery: (vehicleId, percent) =>
        set((s) => ({
          vehicles: s.vehicles.map((v) =>
            v.id === vehicleId ? { ...v, currentChargePercent: percent } : v,
          ),
          activeVehicle:
            s.activeVehicle?.id === vehicleId
              ? { ...s.activeVehicle, currentChargePercent: percent }
              : s.activeVehicle,
        })),
    }),
    {
      name: 'chargeahead-vehicle',
      partialize: (state) => ({ activeVehicle: state.activeVehicle, vehicles: state.vehicles }),
    },
  ),
);
