import { create } from 'zustand';
import type { Trip, ChargingStation } from '@/types';

interface TripState {
  activeTrip: Trip | null;
  plannedTrip: Trip | null;
  currentStopIndex: number;
  isRerouting: boolean;
  rerouteFired: boolean; // prevents repeated reroute alerts
  rerouteAlert: { message: string; alternativeStation: ChargingStation | null } | null;
  // Persisted OSRM route for active trip
  activeRoute: { lat: number; lng: number }[] | null;
  activeRouteDistanceKm: number;
  activeRouteDurationMinutes: number;
  setActiveTrip: (trip: Trip | null) => void;
  setPlannedTrip: (trip: Trip | null) => void;
  /** Alias used by plan/route page */
  setTrip: (trip: any) => void;
  setActiveRoute: (polyline: { lat: number; lng: number }[], distanceKm: number, durationMinutes: number) => void;
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
  rerouteFired: false,
  rerouteAlert: null,
  activeRoute: null,
  activeRouteDistanceKm: 0,
  activeRouteDurationMinutes: 0,
  setActiveTrip: (trip) => set({ activeTrip: trip, currentStopIndex: 0, rerouteFired: false }),
  setPlannedTrip: (trip) => set({ plannedTrip: trip }),
  setTrip: (trip) => set({ activeTrip: trip, currentStopIndex: 0, rerouteFired: false }),
  setActiveRoute: (polyline, distanceKm, durationMinutes) =>
    set({ activeRoute: polyline, activeRouteDistanceKm: distanceKm, activeRouteDurationMinutes: durationMinutes }),
  advanceStop: () => set((s) => ({ currentStopIndex: s.currentStopIndex + 1 })),
  triggerReroute: (message, alternativeStation) =>
    set({ isRerouting: true, rerouteAlert: { message, alternativeStation }, rerouteFired: true }),
  dismissReroute: () => set({ isRerouting: false, rerouteAlert: null }),
  acceptReroute: () => set({ isRerouting: false, rerouteAlert: null }),
  clearTrip: () => set({
    activeTrip: null, plannedTrip: null, currentStopIndex: 0,
    isRerouting: false, rerouteAlert: null, rerouteFired: false,
    activeRoute: null,
  }),
}));
