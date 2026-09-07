'use client';

import Link from 'next/link';
import { Zap, ArrowRight, Menu, X, Shield, Globe } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-navy-900 text-white flex flex-col selection:bg-mint-400 selection:text-navy-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 h-20 border-b border-surface-border bg-navy-900/90 backdrop-blur-md px-4 md:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-mint-gradient flex items-center justify-center shadow-mint-glow">
            <Zap className="w-5 h-5 text-navy-900" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Charge<span className="text-mint-400">Ahead</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <Link href="/how-it-works" className="hover:text-mint-400 transition-colors">How it Works</Link>
          <Link href="/operators" className="hover:text-mint-400 transition-colors">For Operators</Link>
          <Link href="/about" className="hover:text-mint-400 transition-colors">About Us</Link>
          <Link href="/faq" className="hover:text-mint-400 transition-colors">FAQ</Link>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/app/home"
            className="px-5 py-2.5 rounded-xl bg-mint-gradient text-navy-900 text-sm font-bold shadow-mint-glow hover:opacity-90 transition-all flex items-center gap-1.5"
          >
            Launch Web App <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileNavOpen((v) => !v)}
          className="md:hidden p-2 text-white/70 hover:text-white"
        >
          {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden sticky top-20 z-40 bg-navy-900 border-b border-surface-border px-6 py-6 space-y-4"
          >
            <Link href="/how-it-works" onClick={() => setMobileNavOpen(false)} className="block text-base font-semibold text-white/80">How it Works</Link>
            <Link href="/operators" onClick={() => setMobileNavOpen(false)} className="block text-base font-semibold text-white/80">For Operators</Link>
            <Link href="/about" onClick={() => setMobileNavOpen(false)} className="block text-base font-semibold text-white/80">About Us</Link>
            <Link href="/faq" onClick={() => setMobileNavOpen(false)} className="block text-base font-semibold text-white/80">FAQ</Link>
            <div className="pt-4 border-t border-surface-border flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileNavOpen(false)} className="text-center py-3 text-sm font-semibold text-white/80 border border-surface-border rounded-xl">Sign In</Link>
              <Link href="/app/home" onClick={() => setMobileNavOpen(false)} className="text-center py-3 bg-mint-gradient text-navy-900 text-sm font-bold rounded-xl shadow-mint-glow">Launch Web App →</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-navy-950 py-12 px-6 md:px-12 text-xs text-white/50 space-y-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-mint-gradient flex items-center justify-center">
                <Zap className="w-4 h-4 text-navy-900" />
              </div>
              <span className="text-base font-bold text-white">ChargeAhead</span>
            </div>
            <p className="max-w-sm text-white/60 leading-relaxed">
              The intelligent EV trip-planning platform. Predict charger usability, estimate queues, and reroute dynamically before you arrive.
            </p>
          </div>

          <div>
            <span className="font-bold text-white uppercase tracking-wider block mb-3 text-[11px]">Platform</span>
            <ul className="space-y-2">
              <li><Link href="/app/home" className="hover:text-mint-400">Driver Web App</Link></li>
              <li><Link href="/how-it-works" className="hover:text-mint-400">Predictive Engine</Link></li>
              <li><Link href="/operators" className="hover:text-mint-400">CPO Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <span className="font-bold text-white uppercase tracking-wider block mb-3 text-[11px]">Company</span>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-mint-400">About Us</Link></li>
              <li><Link href="/support" className="hover:text-mint-400">Support Desk</Link></li>
              <li><Link href="/faq" className="hover:text-mint-400">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <span className="font-bold text-white uppercase tracking-wider block mb-3 text-[11px]">Legal</span>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="hover:text-mint-400">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-mint-400">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-surface-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <span>© 2026 ChargeAhead Technologies Inc. Built for EV Drivers worldwide.</span>
          <span className="flex items-center gap-1.5 text-teal-300 font-semibold">
            <Globe className="w-3.5 h-3.5" /> India • Bengaluru • Delhi • Mumbai
          </span>
        </div>
      </footer>
    </div>
  );
}
