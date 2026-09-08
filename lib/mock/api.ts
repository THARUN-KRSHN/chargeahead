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

import { fetchOCMStations, fetchOCMStationById } from '@/lib/api/openChargeMap';

// ---- Stations ----

export async function fetchNearbyStations(limit = 12, lat = 12.9716, lng = 77.5946): Promise<ChargingStation[]> {
  await mockDelay(300, 600);
  try {
    const ocmStations = await fetchOCMStations({ latitude: lat, longitude: lng, maxResults: limit });
    if (ocmStations && ocmStations.length > 0) {
      const mockFallback = getNearbyStations(limit - ocmStations.length);
      return [...ocmStations, ...mockFallback].slice(0, limit);
    }
  } catch (err) {
    console.warn('OCM API fetch error, falling back to mock data:', err);
  }
  return getNearbyStations(limit);
}

export async function fetchStationById(id: string): Promise<ChargingStation> {
  await mockDelay(200, 500);
  if (id.startsWith('ocm-')) {
    const ocmStation = await fetchOCMStationById(id);
    if (ocmStation) return ocmStation;
  }
  const station = getStationById(id);
  if (!station) throw new Error(`Station ${id} not found`);
  return station;
}

export async function searchStations(query: string): Promise<ChargingStation[]> {
  await mockDelay(200, 500);
  const q = query.toLowerCase();
  const mockResults = MOCK_STATIONS.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.operator.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q),
  );

  try {
    const ocmResults = await fetchOCMStations({ maxResults: 15 });
    const matchingOcm = ocmResults.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.operator.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q),
    );
    return [...matchingOcm, ...mockResults];
  } catch {
    return mockResults;
  }
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

// ---- Bookings ----

export async function fetchUserBookings(): Promise<Booking[]> {
  await mockDelay(400, 700);
  return MOCK_BOOKINGS;
}

export async function fetchBookingById(id: string): Promise<Booking> {
  await mockDelay(300, 600);
  const booking = getBookingById(id);
  if (!booking) throw new Error(`Booking ${id} not found`);
  return booking;
}

export async function createBooking(data: BookingFormData): Promise<Booking> {
  await mockDelay(600, 1200);
  if (randomFail(0.05)) throw new Error('Booking failed. Please try again.');
  const station = getStationById(data.portId.split('-')[0]) ?? MOCK_STATIONS[0];
  return {
    id: `bk-${Date.now()}`,
    userId: 'user-001',
    stationId: station.id,
    station,
    portId: data.portId,
    port: station.ports[0],
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
}

export async function cancelBooking(bookingId: string): Promise<void> {
  await mockDelay(400, 800);
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
  return getReportsByStation(stationId);
}

export async function submitReport(stationId: string, data: ReportFormData): Promise<CommunityReport> {
  await mockDelay(500, 900);
  return {
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
