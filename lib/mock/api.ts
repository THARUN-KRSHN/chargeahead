// ============================================================
// ChargeAhead — Mock API Layer
// All functions simulate network latency with realistic delays
// ============================================================

import type {
  User,
  ChargingStation,
  Booking,
  Trip,
  Transaction,
  CommunityReport,
  AppNotification,
  UserVehicle,
  EVModel,
  PaymentMethod,
  SearchPlace,
  ChargingSession,
  LoginFormData,
  SignupFormData,
  VehicleFormData,
  ReportFormData,
  BookingFormData,
} from '@/types';

import { MOCK_STATIONS, getNearbyStations, getStationById } from './stations';
import { MOCK_USER, MOCK_OPERATOR_USER, MOCK_VEHICLES, MOCK_PAYMENT_METHODS } from './users';
import { EV_MODELS, getEvModelById } from './vehicles';
import { MOCK_BOOKINGS, getBookingById } from './bookings';
import { MOCK_TRIPS, getTripById } from './trips';
import { MOCK_TRANSACTIONS, getTransactionById } from './transactions';
import { MOCK_REPORTS, getReportsByStation } from './reports';
import { MOCK_NOTIFICATIONS } from './notifications';

// ---- Utility ----

export function mockDelay(minMs = 300, maxMs = 900): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomFail(chance = 0.05): boolean {
  return Math.random() < chance;
}

// ---- Auth ----

export async function mockLogin(data: LoginFormData): Promise<User> {
  await mockDelay(500, 1000);
  if (data.emailOrPhone === 'operator@chargeahead.in' || data.emailOrPhone === '+91 90000 12345') {
    return MOCK_OPERATOR_USER;
  }
  if (
    data.emailOrPhone === 'demo@chargeahead.in' ||
    data.emailOrPhone === 'tharun@chargeahead.in' ||
    data.emailOrPhone.includes('@') ||
    data.emailOrPhone.startsWith('+91')
  ) {
    return MOCK_USER;
  }
  throw new Error('Invalid credentials. Use demo@chargeahead.in / any password');
}

export async function mockSignup(data: SignupFormData): Promise<User> {
  await mockDelay(700, 1200);
  return {
    ...MOCK_USER,
    id: `user-${Date.now()}`,
    name: data.name,
    email: data.email,
    phone: data.phone,
    vehicles: [],
    walletBalance: 100, // welcome bonus
    createdAt: new Date().toISOString(),
  };
}

export async function mockVerifyOtp(otp: string): Promise<boolean> {
  await mockDelay(400, 800);
  return otp.length === 6; // any 6-digit OTP works
}

export async function mockSendOtp(emailOrPhone: string): Promise<void> {
  await mockDelay(300, 600);
  // no-op, just simulates sending
}

export async function mockResetPassword(token: string, newPassword: string): Promise<void> {
  await mockDelay(500, 800);
  if (!token || newPassword.length < 8) throw new Error('Invalid reset token or weak password');
}

// ---- Stations ----

export async function fetchNearbyStations(userLocationOrLimit: { lat: number; lng: number } | number = 16): Promise<ChargingStation[]> {
  await mockDelay(300, 700);
  return getNearbyStations(userLocationOrLimit as any);
}

export async function fetchStationById(id: string): Promise<ChargingStation> {
  await mockDelay(300, 600);
  const station = getStationById(id);
  if (!station) throw new Error(`Station ${id} not found`);
  return station;
}

export async function searchStations(query: string): Promise<ChargingStation[]> {
  await mockDelay(200, 500);
  const q = query.toLowerCase();
  return MOCK_STATIONS.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.operator.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q),
  );
}

// ---- Search / Places ----

const MOCK_PLACES: SearchPlace[] = [
  { id: 'pl-001', label: 'Mysore Palace', sublabel: 'Mysuru, Karnataka', coordinates: { lat: 12.3052, lng: 76.6552 }, type: 'place' },
  { id: 'pl-002', label: 'Lal Bagh Botanical Garden', sublabel: 'Bengaluru, Karnataka', coordinates: { lat: 12.9507, lng: 77.5848 }, type: 'place' },
  { id: 'pl-003', label: 'Kempegowda International Airport', sublabel: 'Bengaluru, Karnataka', coordinates: { lat: 13.1989, lng: 77.7068 }, type: 'place' },
  { id: 'pl-004', label: 'Connaught Place', sublabel: 'New Delhi', coordinates: { lat: 28.6304, lng: 77.2177 }, type: 'place' },
  { id: 'pl-005', label: 'Gateway of India', sublabel: 'Mumbai, Maharashtra', coordinates: { lat: 18.9220, lng: 72.8347 }, type: 'place' },
  { id: 'pl-006', label: 'Cyber City', sublabel: 'Gurugram, Haryana', coordinates: { lat: 28.4963, lng: 77.0883 }, type: 'place' },
  { id: 'pl-007', label: 'Jubilee Hills', sublabel: 'Hyderabad, Telangana', coordinates: { lat: 17.4216, lng: 78.4096 }, type: 'place' },
  { id: 'pl-008', label: 'Koramangala', sublabel: 'Bengaluru, Karnataka', coordinates: { lat: 12.9352, lng: 77.6245 }, type: 'place' },
  { id: 'pl-009', label: 'Indiranagar', sublabel: 'Bengaluru, Karnataka', coordinates: { lat: 12.9784, lng: 77.6408 }, type: 'place' },
  { id: 'pl-010', label: 'Bandra West', sublabel: 'Mumbai, Maharashtra', coordinates: { lat: 19.0607, lng: 72.8363 }, type: 'place' },
];

export async function searchPlaces(query: string): Promise<SearchPlace[]> {
  await mockDelay(150, 400);
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const stationResults: SearchPlace[] = MOCK_STATIONS
    .filter((s) => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q))
    .slice(0, 3)
    .map((s) => ({
      id: s.id,
      label: s.name,
      sublabel: `${s.address} · Charging Station`,
      coordinates: s.coordinates,
      type: 'station' as const,
    }));
  const placeResults = MOCK_PLACES.filter(
    (p) => p.label.toLowerCase().includes(q) || p.sublabel.toLowerCase().includes(q),
  );
  return [...stationResults, ...placeResults].slice(0, 8);
}

// ---- Real Geocoding (Nominatim) ----
// API docs: https://nominatim.openstreetmap.org/
// Free, no API key. Rate limit: 1 req/second. Must set User-Agent header.

export async function geocodePlace(query: string): Promise<{ lat: number; lng: number; displayName: string }[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in&addressdetails=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'ChargeAhead/1.0 (chargeahead.in)' } });
    if (!res.ok) throw new Error('Nominatim error');
    const data = await res.json();
    return data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
    }));
  } catch {
    return []; // fail gracefully
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'ChargeAhead/1.0 (chargeahead.in)' } });
    if (!res.ok) throw new Error();
    const data = await res.json();
    // Return a short human-readable address
    const addr = data.address;
    const parts = [addr?.suburb || addr?.neighbourhood, addr?.city || addr?.town || addr?.village, addr?.state].filter(Boolean);
    return parts.join(', ') || data.display_name;
  } catch {
    return 'Current Location';
  }
}

// ---- Real Road Routing (OSRM) ----
// API docs: http://project-osrm.org/docs/v5.22.0/api/
// Free public instance at router.project-osrm.org — no API key needed.

export async function fetchRouteOSRM(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<{ polyline: { lat: number; lng: number }[]; distanceKm: number; durationMinutes: number }> {
  try {
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?geometries=geojson&overview=full`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM error');
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) throw new Error('No route found');
    const polyline: { lat: number; lng: number }[] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({ lat, lng }),
    );
    return {
      polyline,
      distanceKm: parseFloat((route.distance / 1000).toFixed(1)),
      durationMinutes: Math.round(route.duration / 60),
    };
  } catch {
    // Fallback: straight line
    return {
      polyline: [origin, destination],
      distanceKm: 0,
      durationMinutes: 0,
    };
  }
}

// ---- Vehicles ----

export async function fetchUserVehicles(): Promise<UserVehicle[]> {
  await mockDelay(300, 600);
  return MOCK_VEHICLES;
}

export async function fetchEvModels(): Promise<EVModel[]> {
  await mockDelay(200, 500);
  return EV_MODELS;
}

export async function addVehicle(data: VehicleFormData): Promise<UserVehicle> {
  await mockDelay(500, 900);
  const model = getEvModelById(data.evModelId);
  if (!model) throw new Error('EV model not found');
  return {
    id: `uv-${Date.now()}`,
    userId: 'user-001',
    evModelId: data.evModelId,
    evModel: model,
    nickname: data.nickname,
    licensePlate: data.licensePlate,
    currentChargePercent: data.currentChargePercent,
    isDefault: false,
    color: data.color,
    addedAt: new Date().toISOString(),
  };
}

export async function removeVehicle(vehicleId: string): Promise<void> {
  await mockDelay(300, 600);
}

// ---- Bookings (localStorage backed + mock fallback) ----

// ---- localStorage helpers ----

const LS_BOOKINGS = 'ca_bookings_v1';
const LS_REPORTS = 'ca_reports_v1';

function lsGet<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
}

function lsAppend<T>(key: string, item: T): void {
  if (typeof window === 'undefined') return;
  const arr = lsGet<T>(key);
  arr.unshift(item as T); // newest first
  localStorage.setItem(key, JSON.stringify(arr.slice(0, 100))); // cap at 100 items
}

export async function createBooking(data: BookingFormData): Promise<Booking> {
  await mockDelay(600, 1200);
  if (randomFail(0.05)) throw new Error('Booking failed. Please try again.');
  const station = getStationById(data.portId.split('-')[0]) ?? MOCK_STATIONS[0];
  const booking: Booking = {
    id: `bk-${Date.now()}`,
    userId: 'user-001',
    stationId: station.id,
    station,
    portId: data.portId,
    port: station.ports.find(p => p.id === data.portId) ?? station.ports[0],
    status: 'upcoming',
    startTime: data.startTime,
    endTime: data.endTime,
    qrCode: `CHRG-${Date.now()}-QR`,
    checkInCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    estimatedCostInr: Math.round(Math.random() * 300 + 100),
    paymentStatus: 'paid',
    createdAt: new Date().toISOString(),
    vehicleId: data.vehicleId,
    vehicle: MOCK_VEHICLES[0],
  };
  lsAppend(LS_BOOKINGS, booking);
  return booking;
}

export async function cancelBooking(bookingId: string): Promise<void> {
  await mockDelay(400, 800);
}

export async function fetchUserBookings(): Promise<Booking[]> {
  await mockDelay(400, 700);
  const localBookings = lsGet<Booking>(LS_BOOKINGS);
  // Merge, dedup by id
  const all = [...localBookings, ...MOCK_BOOKINGS];
  const seen = new Set<string>();
  return all.filter(b => { if (seen.has(b.id)) return false; seen.add(b.id); return true; });
}

export async function fetchBookingById(id: string): Promise<Booking> {
  await mockDelay(300, 600);
  const fromLs = lsGet<Booking>(LS_BOOKINGS).find(b => b.id === id);
  if (fromLs) return fromLs;
  const booking = getBookingById(id);
  if (!booking) throw new Error(`Booking ${id} not found`);
  return booking;
}

// ---- Trips ----

export async function fetchUserTrips(): Promise<Trip[]> {
  await mockDelay(400, 700);
  return MOCK_TRIPS;
}

export async function fetchTripById(id: string): Promise<Trip> {
  await mockDelay(300, 600);
  const trip = getTripById(id);
  if (!trip) throw new Error(`Trip ${id} not found`);
  return trip;
}

export async function planTrip(originLabel: string, destinationLabel: string, vehicleId: string): Promise<Trip> {
  await mockDelay(800, 1500);
  return MOCK_TRIPS[0]; // return the planned trip as demo
}

// ---- Transactions ----

export async function fetchTransactions(): Promise<Transaction[]> {
  await mockDelay(400, 700);
  return MOCK_TRANSACTIONS;
}

export async function fetchTransactionById(id: string): Promise<Transaction> {
  await mockDelay(300, 600);
  const tx = getTransactionById(id);
  if (!tx) throw new Error(`Transaction ${id} not found`);
  return tx;
}

// ---- Payments ----

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  await mockDelay(300, 600);
  return MOCK_PAYMENT_METHODS;
}

export async function addPaymentMethod(data: { last4: string; brand: string; expiryMonth: number; expiryYear: number }): Promise<PaymentMethod> {
  await mockDelay(700, 1200);
  if (randomFail(0.08)) throw new Error('Card declined. Please check your details and try again.');
  return {
    id: `pm-${Date.now()}`,
    userId: 'user-001',
    type: 'card',
    label: `New Card •••• ${data.last4}`,
    last4: data.last4,
    isDefault: false,
    expiryMonth: data.expiryMonth,
    expiryYear: data.expiryYear,
    brand: data.brand as PaymentMethod['brand'],
  };
}

export async function processPayment(amountInr: number, paymentMethodId: string): Promise<{ success: boolean; transactionId: string }> {
  await mockDelay(800, 1500);
  if (randomFail(0.07)) throw new Error('Payment failed. Please retry or use a different method.');
  return { success: true, transactionId: `tx-${Date.now()}` };
}

// ---- Community Reports ----

export async function fetchStationReports(stationId: string): Promise<CommunityReport[]> {
  await mockDelay(300, 600);
  const localReports = lsGet<CommunityReport>(LS_REPORTS).filter(r => r.stationId === stationId);
  const mockReports = getReportsByStation(stationId);
  const all = [...localReports, ...mockReports];
  const seen = new Set<string>();
  return all.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
}

export async function submitReport(stationId: string, data: ReportFormData): Promise<CommunityReport> {
  await mockDelay(500, 900);
  const report: CommunityReport = {
    id: `rpt-${Date.now()}`,
    stationId,
    userId: 'user-001',
    userName: 'Tharun Krishna',
    userAvatarUrl: '/images/avatars/user-001.webp',
    type: data.type,
    description: data.description,
    portId: data.portId,
    verified: false,
    upvotes: 0,
    createdAt: new Date().toISOString(),
  };
  lsAppend(LS_REPORTS, report);
  return report;
}

/**
 * Recalculates a station's confidence score from community reports.
 * working → +3, busy/payment_issue → −3, broken/blocked → −5, other → −2
 * Score is clamped 0–100.
 */
export function recalcConfidenceScore(baseScore: number, reports: CommunityReport[]): number {
  const recentReports = reports.slice(0, 10); // only last 10 reports matter
  const delta = recentReports.reduce((acc, r) => {
    switch (r.type) {
      case 'working': return acc + 3;
      case 'busy': return acc - 3;
      case 'payment_issue': return acc - 3;
      case 'broken': return acc - 5;
      case 'blocked': return acc - 5;
      default: return acc - 2;
    }
  }, 0);
  return Math.max(0, Math.min(100, baseScore + delta));
}

// ---- Notifications ----

export async function fetchNotifications(): Promise<AppNotification[]> {
  await mockDelay(200, 500);
  return MOCK_NOTIFICATIONS;
}

export async function markNotificationRead(notifId: string): Promise<void> {
  await mockDelay(100, 300);
}

// ---- Charging Session ----

export async function startChargingSession(bookingId: string, portId: string): Promise<ChargingSession> {
  await mockDelay(500, 1000);
  return {
    id: `cs-${Date.now()}`,
    bookingId,
    stationId: 'stn-001',
    portId,
    startedAt: new Date().toISOString(),
    estimatedEndAt: new Date(Date.now() + 45 * 60000).toISOString(),
    targetPercent: 80,
    currentPercent: 32,
    energyDeliveredKwh: 0,
    powerKw: 50,
    costAccruedInr: 0,
    status: 'active',
  };
}

export async function stopChargingSession(sessionId: string): Promise<{ finalCostInr: number; energyKwh: number }> {
  await mockDelay(400, 800);
  return { finalCostInr: 284, energyKwh: 13.6 };
}

// ---- Operator ----

export async function fetchOperatorStats() {
  await mockDelay(400, 800);
  return {
    totalStations: 8,
    totalActiveSessions: 14,
    totalRevenueToday: 12840,
    averageUtilization: 67,
    unresolvedReports: 3,
    newReportsToday: 5,
  };
}

export async function fetchOperatorStations() {
  await mockDelay(400, 700);
  return MOCK_STATIONS.slice(0, 8).map((s, i) => ({
    stationId: s.id,
    station: s,
    activeSessionsCount: Math.floor(Math.random() * s.totalPorts),
    utilizationPercent: Math.round(40 + Math.random() * 50),
    revenueToday: Math.round(800 + Math.random() * 2000),
    revenueThisMonth: Math.round(20000 + Math.random() * 40000),
    unresolvedReports: Math.floor(Math.random() * 4),
  }));
}

export async function fetchUtilizationChart() {
  await mockDelay(300, 600);
  const hours = ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'];
  return hours.map((label) => ({
    label,
    value: Math.round(20 + Math.random() * 70),
    value2: Math.round(10 + Math.random() * 50),
  }));
}

export async function fetchRevenueChart() {
  await mockDelay(300, 600);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((label) => ({
    label,
    value: Math.round(8000 + Math.random() * 6000),
    value2: Math.round(3000 + Math.random() * 3000),
  }));
}
