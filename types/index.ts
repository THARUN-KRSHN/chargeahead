// ============================================================
// ChargeAhead — Central Type Definitions
// ============================================================

// ---- Enums ----

export type ConnectorType =
  | 'CCS2'
  | 'CHAdeMO'
  | 'Type2'
  | 'CCS1'
  | 'GB/T'
  | 'Type1'
  | 'Bharat AC-001'
  | 'Bharat DC-001';

export type ChargerSpeed = 'slow' | 'fast' | 'ultra-fast';

export type StationStatus = 'available' | 'busy' | 'offline' | 'unknown';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type ReportType = 'broken' | 'blocked' | 'busy' | 'working' | 'payment_issue' | 'other';

export type BookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled' | 'missed';

export type TripStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export type PaymentMethodType = 'card' | 'upi' | 'wallet' | 'net_banking';

export type UserRole = 'driver' | 'operator' | 'admin';

export type NotificationType =
  | 'reroute_alert'
  | 'reservation_reminder'
  | 'station_offline'
  | 'charging_complete'
  | 'payment_success'
  | 'payment_failed'
  | 'community_report'
  | 'promo';

// ---- Coordinates ----

export interface LatLng {
  lat: number;
  lng: number;
}

// ---- Amenity ----

export type AmenityType =
  | 'restroom'
  | 'food'
  | 'wifi'
  | 'parking'
  | 'shopping'
  | 'hotel'
  | 'atm'
  | 'ev_lounge'
  | 'coffee';

// ---- Charger Port ----

export interface ChargerPort {
  id: string;
  connectorType: ConnectorType;
  speedKw: number;
  chargerSpeed: ChargerSpeed;
  status: StationStatus;
  pricePerKwh: number; // in INR
  sessionFee?: number; // flat session fee in INR
}

// ---- Charging Station ----

export interface ChargingStation {
  id: string;
  name: string;
  operator: string;
  address: string;
  city: string;
  state: string;
  coordinates: LatLng;
  distance?: number; // km from user (computed)
  etaMinutes?: number; // drive ETA (computed)
  status: StationStatus;
  totalPorts: number;
  availablePorts: number;
  ports: ChargerPort[];
  confidenceScore: number; // 0–100
  confidenceLevel: ConfidenceLevel;
  confidenceBreakdown: {
    operatorData: number; // 0–100
    communityData: number; // 0–100
    historicalData: number; // 0–100
  };
  predictedQueueMinutes: number;
  queueLength: number;
  lastVerifiedAt: string; // ISO timestamp
  amenities: AmenityType[];
  photos: string[]; // URLs
  rating: number; // 0–5
  reviewCount: number;
  operatingHours: string; // e.g. "24/7" or "06:00 - 22:00"
  isReservable: boolean;
  pricePerKwh: number; // average
  fastChargeAvailable: boolean;
  ultraFastAvailable: boolean;
}

// ---- EV Vehicle ----

export interface EVModel {
  id: string;
  make: string;
  model: string;
  year: number;
  batteryCapacityKwh: number;
  rangKm: number;
  connectorTypes: ConnectorType[];
  imageUrl?: string;
}

export interface UserVehicle {
  id: string;
  userId: string;
  evModelId: string;
  evModel: EVModel;
  nickname?: string;
  licensePlate?: string;
  currentChargePercent: number;
  isDefault: boolean;
  color?: string;
  addedAt: string;
}

// ---- User & Auth ----

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: UserRole;
  vehicles: UserVehicle[];
  defaultVehicleId?: string;
  preferences: UserPreferences;
  communityScore: number; // 0–100 trust score
  totalReports: number;
  createdAt: string;
  walletBalance: number; // INR
}

export interface UserPreferences {
  preferredConnectors: ConnectorType[];
  notifyBeforeReservation: number; // minutes
  notifyOnCongestion: boolean;
  notifyOnStationOffline: boolean;
  preferFastCharging: boolean;
  homeChargingEnabled: boolean;
}

// ---- Trip / Route ----

export interface TripStop {
  stationId: string;
  station: ChargingStation;
  arrivalBatteryPercent: number;
  departureBatteryPercent: number;
  chargingDurationMinutes: number;
  estimatedCostInr: number;
  order: number;
}

export interface RouteSegment {
  from: LatLng;
  to: LatLng;
  distanceKm: number;
  durationMinutes: number;
  polyline?: LatLng[]; // simplified polyline
}

export interface Trip {
  id: string;
  userId: string;
  status: TripStatus;
  origin: {
    label: string;
    coordinates: LatLng;
  };
  destination: {
    label: string;
    coordinates: LatLng;
  };
  stops: TripStop[];
  segments: RouteSegment[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  estimatedCostInr: number;
  actualCostInr?: number;
  batteryAtStart: number;
  batteryAtEnd?: number;
  plannedAt: string;
  startedAt?: string;
  completedAt?: string;
  vehicle: UserVehicle;
}

// ---- Booking / Reservation ----

export interface Booking {
  id: string;
  userId: string;
  stationId: string;
  station: ChargingStation;
  portId: string;
  port: ChargerPort;
  status: BookingStatus;
  startTime: string; // ISO
  endTime: string; // ISO
  qrCode: string; // mock QR string
  checkInCode: string;
  estimatedCostInr: number;
  actualCostInr?: number;
  energyDeliveredKwh?: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  createdAt: string;
  vehicleId: string;
  vehicle: UserVehicle;
  tripId?: string;
}

// ---- Payments & Wallet ----

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  label: string; // e.g. "HDFC Visa •••• 4242"
  last4?: string;
  bank?: string;
  upiId?: string;
  isDefault: boolean;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: 'visa' | 'mastercard' | 'rupay' | 'amex';
}

export interface Transaction {
  id: string;
  userId: string;
  bookingId?: string;
  stationId?: string;
  station?: ChargingStation;
  type: 'charge' | 'reservation' | 'refund' | 'credit' | 'topup';
  amountInr: number;
  description: string;
  paymentMethodId: string;
  paymentMethod?: PaymentMethod;
  status: 'success' | 'failed' | 'pending' | 'refunded';
  energyKwh?: number;
  receiptUrl?: string;
  createdAt: string;
}

// ---- Community Reports ----

export interface CommunityReport {
  id: string;
  stationId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  type: ReportType;
  description?: string;
  portId?: string;
  verified: boolean;
  upvotes: number;
  createdAt: string;
}

// ---- Notifications ----

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// ---- Operator Dashboard ----

export interface OperatorStation {
  stationId: string;
  station: ChargingStation;
  activeSessionsCount: number;
  utilizationPercent: number;
  revenueToday: number;
  revenueThisMonth: number;
  unresolvedReports: number;
}

export interface OperatorStats {
  totalStations: number;
  totalActiveSessions: number;
  totalRevenueToday: number;
  averageUtilization: number;
  unresolvedReports: number;
  newReportsToday: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;
}

// ---- Search ----

export interface SearchPlace {
  id: string;
  label: string;
  sublabel: string;
  coordinates: LatLng;
  type: 'station' | 'place' | 'city';
}

// ---- Active Charging Session ----

export interface ChargingSession {
  id: string;
  bookingId: string;
  stationId: string;
  portId: string;
  startedAt: string;
  estimatedEndAt: string;
  targetPercent: number;
  currentPercent: number;
  energyDeliveredKwh: number;
  powerKw: number;
  costAccruedInr: number;
  status: 'active' | 'paused' | 'completed' | 'error';
}

// ---- Form Types ----

export interface LoginFormData {
  emailOrPhone: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface VehicleFormData {
  evModelId: string;
  nickname: string;
  licensePlate: string;
  currentChargePercent: number;
  color: string;
}

export interface ReportFormData {
  type: ReportType;
  portId?: string;
  description: string;
}

export interface BookingFormData {
  portId: string;
  startTime: string;
  endTime: string;
  vehicleId: string;
  paymentMethodId: string;
}

export interface PaymentMethodFormData {
  type: PaymentMethodType;
  cardNumber?: string;
  cardHolder?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvv?: string;
  upiId?: string;
}
