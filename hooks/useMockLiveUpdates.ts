'use client';

import { useEffect, useRef } from 'react';
import { useTripStore } from '@/lib/store/tripStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { MOCK_STATIONS } from '@/lib/mock/stations';

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

export function useMockLiveUpdates(options: { enableReroute?: boolean } = {}) {
  const { triggerReroute, rerouteAlert } = useTripStore();
  const { addNotification } = useNotificationStore();
  const rerouteFiredRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Nudge station data every 8 seconds
    const stationInterval = setInterval(nudgeStations, 8000);

    // Scripted reroute event: fires once ~20 seconds after active trip
    if (options.enableReroute && !rerouteFiredRef.current) {
      const rerouteTimer = setTimeout(() => {
        if (rerouteFiredRef.current) return;
        rerouteFiredRef.current = true;
        triggerReroute(
          '⚠ Station ahead is now 90% busy — ChargeAhead found a better stop (+6 km, saves 18 min queue)',
          MOCK_STATIONS[2], // Ather Grid MG Road as alternative
        );
        addNotification({
          id: `notif-reroute-${Date.now()}`,
          userId: 'user-001',
          type: 'reroute_alert',
          title: 'Route updated',
          body: 'Alternative charging stop found — Ather Grid MG Road. +6 km but saves 18 min queue.',
          actionUrl: '/app/trip/active',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }, 22000); // fire after 22 seconds

      return () => {
        clearInterval(stationInterval);
        clearTimeout(rerouteTimer);
      };
    }

    return () => clearInterval(stationInterval);
  }, [options.enableReroute, triggerReroute, addNotification]);
}

// Subscribe to live station updates from any component
export function useStationLiveUpdates(callback: (updates: StationUpdates) => void) {
  useEffect(() => {
    listeners.add(callback);
    return () => { listeners.delete(callback); };
  }, [callback]);
}
