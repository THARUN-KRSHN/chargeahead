'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Zap, LayoutDashboard, Radio, BarChart3, Settings, LogOut, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { href: '/operator', label: 'Dashboard Overview', icon: LayoutDashboard },
  { href: '/operator/stations', label: 'Station Management', icon: Radio },
  { href: '/operator/analytics', label: 'Analytics & Revenue', icon: BarChart3 },
];

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleSwitchToDriver = () => {
    toast.info('Switched to EV Driver View');
    router.push('/app/home');
  };

  return (
    <div className="min-h-dvh bg-white text-black flex">
      {/* Sidebar Desktop */}
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col justify-between p-4 hidden md:flex shrink-0">
        <div className="space-y-6">
          {/* Logo & Operator Badge */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-extrabold text-black block">ChargeAhead</span>
              <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">CPO Operator Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/operator' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all',
                    active
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:text-black hover:bg-gray-100',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Operator Controls */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <div className="px-2">
            <div className="text-xs font-extrabold text-black">Zeon Charging Network</div>
            <div className="text-[10px] text-gray-500 font-bold">Operator ID: CPO-ZEON-IN</div>
          </div>

          <button
            onClick={handleSwitchToDriver}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 text-xs font-extrabold text-black hover:bg-gray-200 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Switch to Driver View
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-black" />
            <span className="font-extrabold text-sm text-black">ChargeAhead Operator</span>
          </div>
          <button onClick={handleSwitchToDriver} className="text-xs text-black font-extrabold hover:underline">
            Driver View →
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-white">{children}</main>
      </div>
    </div>
  );
}
