'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Calendar, Wallet, User, Zap, Bell } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/app/home', label: 'Explore', icon: Home },
  { href: '/app/trips', label: 'Trips', icon: MapPin },
  { href: '/app/bookings', label: 'Bookings', icon: Calendar },
  { href: '/app/wallet', label: 'Wallet', icon: Wallet },
  { href: '/app/profile', label: 'Profile', icon: User },
];

export function AppNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  return (
    <>
      {/* ── Desktop top nav ── */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center px-6 lg:px-8 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        {/* Logo */}
        <Link href="/app/home" className="flex items-center gap-2 mr-8 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-black font-extrabold text-xl tracking-tight">
            Charge<span className="text-gray-500 font-semibold">Ahead</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1.5 flex-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                  active
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-black hover:bg-gray-100',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Link
            href="/app/notifications"
            className="relative p-2 rounded-xl text-gray-700 hover:text-black hover:bg-gray-100 transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar */}
          <Link href="/app/profile">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold border-2 border-gray-300 hover:border-black transition-all">
              {user?.name?.charAt(0).toUpperCase() ?? 'T'}
            </div>
          </Link>
        </div>
      </header>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 flex items-center border-t border-gray-200 bg-white/97 backdrop-blur-md safe-area-bottom">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all"
            >
              <div
                className={cn(
                  'relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200',
                  active ? 'bg-black text-white' : 'text-gray-500',
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-all duration-200',
                    active ? 'text-white' : 'text-gray-500',
                  )}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {href === '/app/bookings' && unreadCount > 0 && !active && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold transition-all',
                  active ? 'text-black' : 'text-gray-500',
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
