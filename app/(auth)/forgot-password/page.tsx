'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your registered email address');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
    toast.success('Password reset link sent!');
  };

  return (
    <div className="min-h-dvh bg-white text-black flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-bold hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mb-4 shadow-md">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Reset Password</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Enter your email to receive a password reset link
          </p>
        </div>

        {submitted ? (
          <div className="glass-card rounded-2xl p-6 text-center space-y-4 border-gray-200">
            <CheckCircle className="w-12 h-12 text-black mx-auto" />
            <h2 className="text-lg font-extrabold text-black">Check your email</h2>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              We've sent password reset instructions to <span className="text-black font-extrabold">{email}</span>.
            </p>
            <Link
              href="/reset-password"
              className="inline-block w-full py-3 rounded-xl bg-black text-white font-extrabold text-sm shadow-md hover:bg-gray-900 transition-all"
            >
              Simulate Reset Link →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Registered Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="driver@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl bg-black text-white font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-md"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Send Reset Instructions'
              )}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
