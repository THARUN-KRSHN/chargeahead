import { create } from 'zustand';
import type { PaymentMethod, Booking, ChargingSession } from '@/types';

interface WalletState {
  paymentMethods: PaymentMethod[];
  balance: number;
  activeBooking: Booking | null;
  activeSession: ChargingSession | null;
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  addPaymentMethod: (method: PaymentMethod) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultMethod: (id: string) => void;
  setBalance: (balance: number) => void;
  setActiveBooking: (booking: Booking | null) => void;
  setActiveSession: (session: ChargingSession | null) => void;
  updateSession: (updates: Partial<ChargingSession>) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  paymentMethods: [],
  balance: 480,
  activeBooking: null,
  activeSession: null,
  setPaymentMethods: (paymentMethods) => set({ paymentMethods }),
  addPaymentMethod: (method) =>
    set((s) => ({ paymentMethods: [...s.paymentMethods, method] })),
  removePaymentMethod: (id) =>
    set((s) => ({
      paymentMethods: s.paymentMethods.filter((m) => m.id !== id),
    })),
  setDefaultMethod: (id) =>
    set((s) => ({
      paymentMethods: s.paymentMethods.map((m) => ({ ...m, isDefault: m.id === id })),
    })),
  setBalance: (balance) => set({ balance }),
  setActiveBooking: (activeBooking) => set({ activeBooking }),
  setActiveSession: (activeSession) => set({ activeSession }),
  updateSession: (updates) =>
    set((s) => ({
      activeSession: s.activeSession ? { ...s.activeSession, ...updates } : null,
    })),
}));
