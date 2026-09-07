import type { User, UserVehicle, PaymentMethod } from '@/types';
import { EV_MODELS } from './vehicles';

export const MOCK_VEHICLES: UserVehicle[] = [
  {
    id: 'uv-001',
    userId: 'user-001',
    evModelId: 'tata-nexon-ev-max',
    evModel: EV_MODELS[0],
    nickname: 'White Nexon',
    licensePlate: 'KA-01-AB-1234',
    currentChargePercent: 68,
    isDefault: true,
    color: '#F5F5F5',
    addedAt: '2024-03-15T10:00:00Z',
  },
  {
    id: 'uv-002',
    userId: 'user-001',
    evModelId: 'mg-zs-ev',
    evModel: EV_MODELS[2],
    nickname: 'ZS Asphalt',
    licensePlate: 'KA-01-CD-5678',
    currentChargePercent: 41,
    isDefault: false,
    color: '#4A4A4A',
    addedAt: '2024-07-02T12:00:00Z',
  },
];

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm-001',
    userId: 'user-001',
    type: 'card',
    label: 'HDFC Visa •••• 4242',
    last4: '4242',
    bank: 'HDFC Bank',
    isDefault: true,
    expiryMonth: 12,
    expiryYear: 2026,
    brand: 'visa',
  },
  {
    id: 'pm-002',
    userId: 'user-001',
    type: 'upi',
    label: 'tharun@okaxis',
    upiId: 'tharun@okaxis',
    isDefault: false,
  },
  {
    id: 'pm-003',
    userId: 'user-001',
    type: 'card',
    label: 'SBI Mastercard •••• 9876',
    last4: '9876',
    bank: 'State Bank of India',
    isDefault: false,
    expiryMonth: 9,
    expiryYear: 2025,
    brand: 'mastercard',
  },
];

export const MOCK_USER: User = {
  id: 'user-001',
  name: 'Tharun Krishna',
  email: 'tharun@chargeahead.in',
  phone: '+91 98765 43210',
  avatarUrl: '/images/avatars/user-001.webp',
  role: 'driver',
  vehicles: MOCK_VEHICLES,
  defaultVehicleId: 'uv-001',
  preferences: {
    preferredConnectors: ['CCS2', 'Type2'],
    notifyBeforeReservation: 15,
    notifyOnCongestion: true,
    notifyOnStationOffline: true,
    preferFastCharging: true,
    homeChargingEnabled: false,
  },
  communityScore: 74,
  totalReports: 18,
  createdAt: '2024-01-10T08:00:00Z',
  walletBalance: 480,
};

export const MOCK_OPERATOR_USER: User = {
  id: 'operator-001',
  name: 'Priya Sharma',
  email: 'priya@nexcharge.in',
  phone: '+91 90000 12345',
  avatarUrl: '/images/avatars/operator-001.webp',
  role: 'operator',
  vehicles: [],
  preferences: {
    preferredConnectors: [],
    notifyBeforeReservation: 0,
    notifyOnCongestion: true,
    notifyOnStationOffline: true,
    preferFastCharging: false,
    homeChargingEnabled: false,
  },
  communityScore: 0,
  totalReports: 0,
  createdAt: '2023-06-01T08:00:00Z',
  walletBalance: 0,
};
