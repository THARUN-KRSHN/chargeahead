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
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 space-y-16 bg-white text-black">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Charge Point Operators</span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-black">
          Maximize Station Utilization & Reliability
        </h1>
        <p className="text-base text-gray-600 font-medium leading-relaxed">
          Connect your charging network to ChargeAhead's predictive routing engine. Driver traffic routed directly to high-performing chargers.
        </p>

        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-extrabold text-sm hover:bg-gray-900 transition-all shadow-md"
          >
            Access Operator Dashboard Login →
          </Link>
        </div>
      </div>

      {/* Operator Benefits Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
          <BarChart3 className="w-8 h-8 text-black" />
          <h3 className="text-lg font-extrabold text-black">Boost Off-Peak Utilization</h3>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Our predictive route planner guides drivers to reliable chargers before they hit 10% battery panic.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
          <ShieldCheck className="w-8 h-8 text-black" />
          <h3 className="text-lg font-extrabold text-black">Real-Time Hardware Diagnostics</h3>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Get instant alerts when community check-ins flag broken cables or unhandled OCPI protocol errors.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
          <Zap className="w-8 h-8 text-black" />
          <h3 className="text-lg font-extrabold text-black">Guaranteed Revenue via Reservations</h3>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Allow EV drivers to pay 30-minute port hold fees, eliminating idle charger slots.
          </p>
        </div>
      </div>

      {/* Request CPO Partner Demo Form */}
      <div className="bg-white rounded-3xl p-8 max-w-2xl mx-auto border border-gray-200 shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-black">Request CPO Integration Demo</h2>
          <p className="text-xs text-gray-500 font-medium">Integrate your chargers via OCPI 2.2 / OpenADR protocols</p>
        </div>

        {submitted ? (
          <div className="text-center space-y-3 py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-extrabold text-black">Thank you for reaching out!</h3>
            <p className="text-xs text-gray-600 font-medium">Our ChargeAhead Operator Partnerships manager will reach out within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black focus:border-black outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">CPO / Company Name *</label>
              <input
                type="text"
                required
                value={cpoName}
                onChange={(e) => setCpoName(e.target.value)}
                placeholder="e.g. GreenVolt Energy"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black focus:border-black outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Work Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@greenvolt.in"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black focus:border-black outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-black text-white font-extrabold text-sm shadow-md hover:bg-gray-900 transition-all"
            >
              Submit Partnership Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
