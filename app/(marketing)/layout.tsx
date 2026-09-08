'use client';

import Link from 'next/link';
import { Zap, ArrowRight, Menu, X, Shield, Globe } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-white text-black flex flex-col selection:bg-black selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 h-20 border-b border-gray-200 bg-white/95 backdrop-blur-md px-4 md:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-black">
            Charge<span className="text-gray-600">Ahead</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-700">
          <Link href="/how-it-works" className="hover:text-black transition-colors">How it Works</Link>
          <Link href="/operators" className="hover:text-black transition-colors">For Operators</Link>
          <Link href="/about" className="hover:text-black transition-colors">About Us</Link>
          <Link href="/faq" className="hover:text-black transition-colors">FAQ</Link>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-xl bg-black text-white text-sm font-extrabold shadow-md hover:bg-gray-900 transition-all flex items-center gap-2"
          >
            Sign In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileNavOpen((v) => !v)}
          className="md:hidden p-2 text-gray-700 hover:text-black"
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
            className="md:hidden sticky top-20 z-40 bg-white border-b border-gray-200 px-6 py-6 space-y-4 shadow-lg"
          >
            <Link href="/how-it-works" onClick={() => setMobileNavOpen(false)} className="block text-base font-bold text-black">How it Works</Link>
            <Link href="/operators" onClick={() => setMobileNavOpen(false)} className="block text-base font-bold text-black">For Operators</Link>
            <Link href="/about" onClick={() => setMobileNavOpen(false)} className="block text-base font-bold text-black">About Us</Link>
            <Link href="/faq" onClick={() => setMobileNavOpen(false)} className="block text-base font-bold text-black">FAQ</Link>
            <div className="pt-4 border-t border-gray-200 flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileNavOpen(false)} className="text-center py-3.5 bg-black text-white text-sm font-extrabold rounded-xl shadow-md">Sign In to Navigation UI →</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 bg-white">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12 px-6 md:px-12 text-xs text-gray-500 space-y-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-extrabold text-black">ChargeAhead</span>
            </div>
            <p className="max-w-sm text-gray-600 leading-relaxed font-medium">
              The intelligent EV trip-planning platform. Predict charger usability, estimate queues, and reroute dynamically before you arrive.
            </p>
          </div>

          <div>
            <span className="font-extrabold text-black uppercase tracking-wider block mb-3 text-[11px]">Platform</span>
            <ul className="space-y-2 font-medium">
              <li><Link href="/app/home" className="hover:text-black">Driver Web App</Link></li>
              <li><Link href="/how-it-works" className="hover:text-black">Predictive Engine</Link></li>
              <li><Link href="/operators" className="hover:text-black">CPO Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <span className="font-extrabold text-black uppercase tracking-wider block mb-3 text-[11px]">Company</span>
            <ul className="space-y-2 font-medium">
              <li><Link href="/about" className="hover:text-black">About Us</Link></li>
              <li><Link href="/support" className="hover:text-black">Support Desk</Link></li>
              <li><Link href="/faq" className="hover:text-black">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <span className="font-extrabold text-black uppercase tracking-wider block mb-3 text-[11px]">Legal</span>
            <ul className="space-y-2 font-medium">
              <li><Link href="/privacy" className="hover:text-black">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-black">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-medium text-gray-500">© 2026 ChargeAhead Technologies Inc. Built for EV Drivers worldwide.</span>
          <span className="flex items-center gap-1.5 text-black font-bold">
            <Globe className="w-3.5 h-3.5" /> India • Bengaluru • Delhi • Mumbai
          </span>
        </div>
      </footer>
    </div>
  );
}
