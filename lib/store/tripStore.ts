import { create } from 'zustand';
import type { Trip, TripStop, ChargingStation } from '@/types';

interface TripState {
  activeTrip: Trip | null;
  plannedTrip: Trip | null;
  currentStopIndex: number;
  isRerouting: boolean;
  rerouteAlert: { message: string; alternativeStation: ChargingStation | null } | null;
  setActiveTrip: (trip: Trip | null) => void;
  setPlannedTrip: (trip: Trip | null) => void;
  advanceStop: () => void;
  triggerReroute: (message: string, alternativeStation: ChargingStation | null) => void;
  dismissReroute: () => void;
  acceptReroute: () => void;
  clearTrip: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  activeTrip: null,
  plannedTrip: null,
  currentStopIndex: 0,
  isRerouting: false,
  rerouteAlert: null,
  setActiveTrip: (trip) => set({ activeTrip: trip, currentStopIndex: 0 }),
  setPlannedTrip: (trip) => set({ plannedTrip: trip }),
  advanceStop: () => set((s) => ({ currentStopIndex: s.currentStopIndex + 1 })),
  triggerReroute: (message, alternativeStation) =>
    set({ isRerouting: true, rerouteAlert: { message, alternativeStation } }),
  dismissReroute: () => set({ isRerouting: false, rerouteAlert: null }),
  acceptReroute: () => set({ isRerouting: false, rerouteAlert: null }),
  clearTrip: () => set({ activeTrip: null, plannedTrip: null, currentStopIndex: 0, isRerouting: false, rerouteAlert: null }),
}));
