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
    <div className="min-h-dvh bg-navy-950 text-white flex">
      {/* Sidebar Desktop */}
      <aside className="w-64 border-r border-surface-border bg-navy-900 flex flex-col justify-between p-4 hidden md:flex shrink-0">
        <div className="space-y-6">
          {/* Logo & Operator Badge */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-lg bg-teal-gradient flex items-center justify-center shadow-mint-glow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white block">ChargeAhead</span>
              <span className="text-[10px] text-teal-300 font-semibold uppercase tracking-wider">CPO Operator Portal</span>
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
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
                    active
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5',
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
        <div className="pt-4 border-t border-surface-border space-y-3">
          <div className="px-2">
            <div className="text-xs font-bold text-white">Zeon Charging Network</div>
            <div className="text-[10px] text-white/50">Operator ID: CPO-ZEON-IN</div>
          </div>

          <button
            onClick={handleSwitchToDriver}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-card border border-surface-border text-xs text-white/70 hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Switch to Driver View
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-surface-border bg-navy-900 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-teal-300" />
            <span className="font-bold text-sm text-white">ChargeAhead Operator</span>
          </div>
          <button onClick={handleSwitchToDriver} className="text-xs text-teal-300 font-semibold">
            Driver View →
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
