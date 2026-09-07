'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { useVehicleStore } from '@/lib/store/vehicleStore';
import { AppNav } from '@/components/shared/AppNav';
import { fetchNotifications } from '@/lib/mock/api';
import { MOCK_VEHICLES } from '@/lib/mock/users';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { setNotifications } = useNotificationStore();
  const { setVehicles } = useVehicleStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Bootstrap app data
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications().then(setNotifications);
    setVehicles(MOCK_VEHICLES);
  }, [isAuthenticated, setNotifications, setVehicles]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-dvh bg-white text-black">
      <AppNav />
      {/* Desktop: top nav offset. Mobile: bottom nav offset */}
      <main className="md:pt-16 pb-16 md:pb-0 min-h-dvh">
        {children}
      </main>
    </div>
  );
}
