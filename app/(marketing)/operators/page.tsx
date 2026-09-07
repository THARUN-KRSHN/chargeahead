'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, BarChart3, Zap, ArrowRight, CheckCircle2, Building, Mail, Phone, Globe } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function OperatorsLandingPage() {
  const [name, setName] = useState('');
  const [cpoName, setCpoName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast.error('Please complete all required fields');
      return;
    }
    setSubmitted(true);
    toast.success('Partnership request submitted! Our team will contact you.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-semibold text-mint-400 uppercase tracking-widest">Charge Point Operators</span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">
          Maximize Station Utilization & Reliability
        </h1>
        <p className="text-base text-white/60 leading-relaxed">
          Connect your charging network to ChargeAhead's predictive routing engine. Driver traffic routed directly to high-performing chargers.
        </p>

        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold text-sm hover:bg-teal-500/30 transition-all"
          >
            Access Operator Dashboard Login →
          </Link>
        </div>
      </div>

      {/* Operator Benefits Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 space-y-3">
          <BarChart3 className="w-8 h-8 text-mint-400" />
          <h3 className="text-lg font-bold text-white">Boost Off-Peak Utilization</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Our predictive route planner guides drivers to reliable chargers before they hit 10% battery panic.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-3">
          <ShieldCheck className="w-8 h-8 text-teal-400" />
          <h3 className="text-lg font-bold text-white">Real-Time Hardware Diagnostics</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Get instant alerts when community check-ins flag broken cables or unhandled OCPI protocol errors.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-3">
          <Zap className="w-8 h-8 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Guaranteed Revenue via Reservations</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Allow EV drivers to pay 30-minute port hold fees, eliminating idle charger slots.
          </p>
        </div>
      </div>

      {/* Request CPO Partner Demo Form */}
      <div className="glass-card rounded-3xl p-8 max-w-2xl mx-auto border-mint-400/30 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white">Request CPO Integration Demo</h2>
          <p className="text-xs text-white/50">Integrate your chargers via OCPI 2.2 / OpenADR protocols</p>
        </div>

        {submitted ? (
          <div className="text-center space-y-3 py-6">
            <CheckCircle2 className="w-12 h-12 text-mint-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Thank you for reaching out!</h3>
            <p className="text-xs text-white/60">Our ChargeAhead Operator Partnerships manager will reach out within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-white/60 mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full bg-navy-900 border border-surface-border rounded-xl px-4 py-3 text-white"
              />
            </div>
            <div>
              <label className="block text-white/60 mb-1">CPO / Company Name *</label>
              <input
                type="text"
                required
                value={cpoName}
                onChange={(e) => setCpoName(e.target.value)}
                placeholder="e.g. GreenVolt Energy"
                className="w-full bg-navy-900 border border-surface-border rounded-xl px-4 py-3 text-white"
              />
            </div>
            <div>
              <label className="block text-white/60 mb-1">Work Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@greenvolt.in"
                className="w-full bg-navy-900 border border-surface-border rounded-xl px-4 py-3 text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-mint-gradient text-navy-900 font-bold text-sm shadow-mint-glow hover:opacity-90 transition-all"
            >
              Submit Partnership Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
