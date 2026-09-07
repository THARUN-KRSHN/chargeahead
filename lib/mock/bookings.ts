import type { Booking, BookingStatus } from '@/types';
import { MOCK_STATIONS } from './stations';
import { MOCK_VEHICLES, MOCK_PAYMENT_METHODS } from './users';

const s001 = MOCK_STATIONS[0];
const s006 = MOCK_STATIONS[5];
const s009 = MOCK_STATIONS[8];
const v001 = MOCK_VEHICLES[0];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'bk-001',
    userId: 'user-001',
    stationId: 'stn-001',
    station: s001,
    portId: 'p001-1',
    port: s001.ports[0],
    status: 'upcoming',
    startTime: new Date(Date.now() + 45 * 60000).toISOString(),
    endTime: new Date(Date.now() + 105 * 60000).toISOString(),
    qrCode: 'CHRG-BK001-QR9X72',
    checkInCode: 'CA7291',
    estimatedCostInr: 280,
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    vehicleId: 'uv-001',
    vehicle: v001,
    tripId: 'trip-001',
  },
  {
    id: 'bk-002',
    userId: 'user-001',
    stationId: 'stn-006',
    station: s006,
    portId: 'p006-1',
    port: s006.ports[0],
    status: 'upcoming',
    startTime: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 2 * 24 * 3600000 + 90 * 60000).toISOString(),
    qrCode: 'CHRG-BK002-QR4K81',
    checkInCode: 'CA5543',
    estimatedCostInr: 360,
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    vehicleId: 'uv-001',
    vehicle: v001,
  },
  {
    id: 'bk-003',
    userId: 'user-001',
    stationId: 'stn-009',
    station: s009,
    portId: 'p009-1',
    port: s009.ports[0],
    status: 'completed',
    startTime: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    endTime: new Date(Date.now() - 3 * 24 * 3600000 + 75 * 60000).toISOString(),
    qrCode: 'CHRG-BK003-QR2M44',
    checkInCode: 'CA1192',
    estimatedCostInr: 315,
    actualCostInr: 302,
    energyDeliveredKwh: 14.4,
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString(),
    vehicleId: 'uv-001',
    vehicle: v001,
  },
  {
    id: 'bk-004',
    userId: 'user-001',
    stationId: 'stn-001',
    station: s001,
    portId: 'p001-3',
    port: s001.ports[2],
    status: 'cancelled',
    startTime: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    endTime: new Date(Date.now() - 7 * 24 * 3600000 + 60 * 60000).toISOString(),
    qrCode: 'CHRG-BK004-QR8P33',
    checkInCode: 'CA8823',
    estimatedCostInr: 240,
    paymentStatus: 'refunded',
    createdAt: new Date(Date.now() - 8 * 24 * 3600000).toISOString(),
    vehicleId: 'uv-001',
    vehicle: v001,
  },
];

export function getBookingById(id: string): Booking | undefined {
  return MOCK_BOOKINGS.find((b) => b.id === id);
}

export function getBookingsByStatus(status: BookingStatus): Booking[] {
  return MOCK_BOOKINGS.filter((b) => b.status === status);
}
