import type { Trip } from '@/types';
import { MOCK_STATIONS } from './stations';
import { MOCK_VEHICLES } from './users';

const s001 = MOCK_STATIONS[0];
const s006 = MOCK_STATIONS[5];
const s009 = MOCK_STATIONS[8];
const v001 = MOCK_VEHICLES[0];

export const MOCK_TRIPS: Trip[] = [
  {
    id: 'trip-001',
    userId: 'user-001',
    status: 'planned',
    origin: { label: 'HSR Layout, Bengaluru', coordinates: { lat: 12.9116, lng: 77.6389 } },
    destination: { label: 'Mysore Palace, Mysuru', coordinates: { lat: 12.3052, lng: 76.6552 } },
    stops: [
      {
        stationId: 'stn-001',
        station: s001,
        arrivalBatteryPercent: 45,
        departureBatteryPercent: 80,
        chargingDurationMinutes: 42,
        estimatedCostInr: 285,
        order: 1,
      },
    ],
    segments: [
      {
        from: { lat: 12.9116, lng: 77.6389 },
        to: { lat: 12.9352, lng: 77.6245 },
        distanceKm: 4.2,
        durationMinutes: 12,
      },
      {
        from: { lat: 12.9352, lng: 77.6245 },
        to: { lat: 12.3052, lng: 76.6552 },
        distanceKm: 146.8,
        durationMinutes: 168,
      },
    ],
    totalDistanceKm: 151,
    totalDurationMinutes: 222,
    estimatedCostInr: 285,
    batteryAtStart: 68,
    plannedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    vehicle: v001,
  },
  {
    id: 'trip-002',
    userId: 'user-001',
    status: 'completed',
    origin: { label: 'Indiranagar, Bengaluru', coordinates: { lat: 12.9784, lng: 77.6408 } },
    destination: { label: 'DLF Cyber City, Gurugram', coordinates: { lat: 28.4963, lng: 77.0883 } },
    stops: [
      {
        stationId: 'stn-009',
        station: s009,
        arrivalBatteryPercent: 22,
        departureBatteryPercent: 85,
        chargingDurationMinutes: 78,
        estimatedCostInr: 315,
        order: 1,
      },
    ],
    segments: [
      {
        from: { lat: 12.9784, lng: 77.6408 },
        to: { lat: 28.6304, lng: 77.2177 },
        distanceKm: 2090,
        durationMinutes: 1260,
      },
    ],
    totalDistanceKm: 2090,
    totalDurationMinutes: 1338,
    estimatedCostInr: 315,
    actualCostInr: 302,
    batteryAtStart: 80,
    batteryAtEnd: 62,
    plannedAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    startedAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    vehicle: v001,
  },
  {
    id: 'trip-003',
    userId: 'user-001',
    status: 'completed',
    origin: { label: 'Koramangala, Bengaluru', coordinates: { lat: 12.9352, lng: 77.6245 } },
    destination: { label: 'Bandra West, Mumbai', coordinates: { lat: 19.0607, lng: 72.8363 } },
    stops: [
      {
        stationId: 'stn-011',
        station: MOCK_STATIONS[10],
        arrivalBatteryPercent: 30,
        departureBatteryPercent: 90,
        chargingDurationMinutes: 65,
        estimatedCostInr: 378,
        order: 1,
      },
      {
        stationId: 'stn-006',
        station: s006,
        arrivalBatteryPercent: 25,
        departureBatteryPercent: 80,
        chargingDurationMinutes: 55,
        estimatedCostInr: 440,
        order: 2,
      },
    ],
    segments: [],
    totalDistanceKm: 985,
    totalDurationMinutes: 720,
    estimatedCostInr: 818,
    actualCostInr: 792,
    batteryAtStart: 72,
    batteryAtEnd: 55,
    plannedAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
    startedAt: new Date(Date.now() - 14 * 24 * 3600000 + 2 * 3600000).toISOString(),
    completedAt: new Date(Date.now() - 13 * 24 * 3600000).toISOString(),
    vehicle: v001,
  },
];

export function getTripById(id: string): Trip | undefined {
  return MOCK_TRIPS.find((t) => t.id === id);
}
