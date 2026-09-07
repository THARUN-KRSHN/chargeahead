'use client';

import { useEffect } from 'react';
import { useTripStore } from '@/lib/store/tripStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { MOCK_STATIONS } from '@/lib/mock/stations';
import { haversineKm } from '@/lib/mock/stations';

interface StationUpdates {
  [stationId: string]: {
    availablePorts: number;
    queueLength: number;
    predictedQueueMinutes: number;
    status: string;
  };
}

// In-memory store for live station nudges (not persisted — just demo state)
let liveStationUpdates: StationUpdates = {};
const listeners: Set<(updates: StationUpdates) => void> = new Set();

function nudgeStations() {
  const updates: StationUpdates = {};
  MOCK_STATIONS.forEach((s) => {
    if (s.status === 'offline') return;
    const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
    const newAvailable = Math.max(0, Math.min(s.totalPorts, (liveStationUpdates[s.id]?.availablePorts ?? s.availablePorts) + delta));
    const queueDelta = Math.floor(Math.random() * 3) - 1;
    const newQueue = Math.max(0, (liveStationUpdates[s.id]?.queueLength ?? s.queueLength) + queueDelta);
    updates[s.id] = {
      availablePorts: newAvailable,
      queueLength: newQueue,
      predictedQueueMinutes: newQueue * 8 + Math.floor(Math.random() * 5),
      status: newAvailable === 0 ? 'busy' : 'available',
    };
  });
  liveStationUpdates = updates;
  listeners.forEach((fn) => fn(updates));
}

export function getLiveStationData(stationId: string) {
  return liveStationUpdates[stationId] ?? null;
}

/**
 * Finds the nearest available station (by Haversine) that isn't the congested one.
 */
function findNearestAvailableAlternative(
  origin: { lat: number; lng: number },
  excludeId: string,
): typeof MOCK_STATIONS[0] | null {
  const available = MOCK_STATIONS
    .filter((s) => s.id !== excludeId && s.status !== 'offline')
    .filter((s) => (liveStationUpdates[s.id]?.availablePorts ?? s.availablePorts) > 0)
    .map((s) => ({ ...s, dist: haversineKm(origin, s.coordinates) }))
    .sort((a, b) => a.dist - b.dist);
  return available[0] ?? null;
}

export function useMockLiveUpdates(options: { enableReroute?: boolean } = {}) {
  const { triggerReroute, rerouteAlert, rerouteFired, activeTrip } = useTripStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    // Nudge station data every 8 seconds
    const stationInterval = setInterval(() => {
      nudgeStations();

      // Algorithm-driven reroute: only fires when an active trip's next stop becomes congested
      if (!options.enableReroute || rerouteFired || !activeTrip) return;

      const stops = (activeTrip as any).stops ?? [];
      const nextStop = stops[0];
      if (!nextStop) return;

      const stationId = nextStop.stationId ?? nextStop.station?.id;
      if (!stationId) return;

      const liveData = liveStationUpdates[stationId];
      if (!liveData) return;

      // Trigger reroute when next stop is fully busy AND predicted queue > 15 minutes
      if (liveData.availablePorts === 0 && liveData.predictedQueueMinutes > 15) {
        const originCoords = (activeTrip as any).origin ?? { lat: 12.9716, lng: 77.5946 };
        const alt = findNearestAvailableAlternative(originCoords, stationId);
        if (!alt) return;

        const savedMinutes = liveData.predictedQueueMinutes;
        const message = `${alt.name} is available nearby — avoids ${savedMinutes} min queue at original stop`;

        triggerReroute(message, alt);
        addNotification({
          id: `notif-reroute-${Date.now()}`,
          userId: 'user-001',
          type: 'reroute_alert',
          title: 'Smarter Route Found',
          body: message,
          actionUrl: '/app/trip/active',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }, 8000);

    return () => clearInterval(stationInterval);
  }, [options.enableReroute, rerouteFired, activeTrip, triggerReroute, addNotification]);
}

// Subscribe to live station updates from any component
export function useStationLiveUpdates(callback: (updates: StationUpdates) => void) {
  useEffect(() => {
    listeners.add(callback);
    return () => { listeners.delete(callback); };
  }, [callback]);
}
