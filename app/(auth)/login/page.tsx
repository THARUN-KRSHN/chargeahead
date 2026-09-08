'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, ArrowRight, Globe, Car, Building2, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { mockLogin } from '@/lib/mock/api';
import { MOCK_USER, MOCK_OPERATOR_USER } from '@/lib/mock/users';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const schema = z.object({
  emailOrPhone: z.string().min(3, 'Enter your email or phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [roleTab, setRoleTab] = useState<'driver' | 'operator'>('driver');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      emailOrPhone: 'demo@chargeahead.in',
      password: 'password123',
    },
  });

  const handleSwitchRole = (role: 'driver' | 'operator') => {
    setRoleTab(role);
    if (role === 'operator') {
      setValue('emailOrPhone', 'operator@chargeahead.in');
    } else {
      setValue('emailOrPhone', 'demo@chargeahead.in');
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (roleTab === 'operator' && data.emailOrPhone === 'demo@chargeahead.in') {
        data.emailOrPhone = 'operator@chargeahead.in';
      }
      const user = await mockLogin(data);
      login(user);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! ⚡`);
      if (roleTab === 'operator' || user.role === 'operator') {
        router.replace('/operator');
      } else {
        router.replace('/app/home');
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoDriver = () => {
    login(MOCK_USER);
    toast.success('Signed in as EV Driver ⚡');
    router.replace('/app/home');
  };

  const handleQuickDemoOperator = () => {
    login(MOCK_OPERATOR_USER);
    toast.success('Signed in as Station Operator 🏢');
    router.replace('/operator');
  };

  return (
    <div className="min-h-dvh bg-white text-black flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md space-y-6"
      >
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-gray-500 hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Website
        </Link>
        {/* Logo */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mb-3 shadow-md">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Sign In</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Access your ChargeAhead account</p>
        </div>

        {/* Separate Sign-in Role Selection Tabs */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-5 border border-gray-200 shadow-inner">
          <button
            type="button"
            onClick={() => handleSwitchRole('driver')}
            className={cn(
              'flex-1 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all',
              roleTab === 'driver' ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:text-black'
            )}
          >
            <Car className="w-4 h-4" /> Driver Sign In
          </button>
          <button
            type="button"
            onClick={() => handleSwitchRole('operator')}
            className={cn(
              'flex-1 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all',
              roleTab === 'operator' ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:text-black'
            )}
          >
            <Building2 className="w-4 h-4" /> Operator Sign In
          </button>
        </div>

        {/* Role Portal Context Banner */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-5">
          {roleTab === 'driver' ? (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                <Car className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-black block mb-0.5">EV Driver Portal</span>
                <span className="text-gray-600 font-medium leading-relaxed">
                  Plan routes, reserve charging slots, and get AI battery predictions.
                </span>
                <div className="mt-1 text-[11px] font-bold text-gray-500">
                  Demo Account: <code className="bg-gray-200 text-black px-1.5 py-0.5 rounded font-mono">demo@chargeahead.in</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-black block mb-0.5">Charge Point Operator Portal</span>
                <span className="text-gray-600 font-medium leading-relaxed">
                  Monitor live station telemetry, charger health, revenue & community reports.
                </span>
                <div className="mt-1 text-[11px] font-bold text-gray-500">
                  Demo Account: <code className="bg-gray-200 text-black px-1.5 py-0.5 rounded font-mono">operator@chargeahead.in</code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email/phone */}
          <div>
            <label htmlFor="emailOrPhone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              {roleTab === 'operator' ? 'Operator Account Email / ID' : 'Driver Email or Phone'}
            </label>
            <input
              id="emailOrPhone"
              type="text"
              placeholder={roleTab === 'operator' ? 'operator@chargeahead.in' : 'demo@chargeahead.in'}
              autoComplete="username"
              {...register('emailOrPhone')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
            />
            {errors.emailOrPhone && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.emailOrPhone.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Password</label>
              <Link href="/forgot-password" className="text-xs text-black font-bold hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl bg-black text-white font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-gray-900 disabled:opacity-60 transition-all shadow-md mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign in as {roleTab === 'operator' ? 'Operator' : 'Driver'} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Quick One-Click Demo Access */}
        <div className="mt-5 pt-4 border-t border-gray-200 space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block text-center">
            One-Click Instant Demo Login
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleQuickDemoDriver}
              className="py-2.5 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-black text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all"
            >
              <Car className="w-3.5 h-3.5" /> Driver Demo
            </button>
            <button
              type="button"
              onClick={handleQuickDemoOperator}
              className="py-2.5 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-black text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Operator Demo
            </button>
          </div>
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-gray-500 font-medium mt-6">
          New to ChargeAhead?{' '}
          <Link href="/signup" className="text-black font-extrabold hover:underline">
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
