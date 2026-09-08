'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, ArrowRight, Globe, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { mockSignup } from '@/lib/mock/api';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(10, 'Enter a valid 10-digit phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const passwordVal = watch('password', '');
  const hasMinLen = passwordVal.length >= 6;
  const hasNum = /\d/.test(passwordVal);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const user = await mockSignup({ ...data, confirmPassword: data.password });
      login(user);
      toast.success('Account created! Please verify your phone number ⚡');
      router.replace('/verify');
    } catch (err: any) {
      toast.error(err.message ?? 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    const { MOCK_USER } = await import('@/lib/mock/users');
    login(MOCK_USER);
    toast.success('Signed in with Google ⚡');
    router.replace('/onboarding/vehicle');
  };

  return (
    <div className="min-h-dvh bg-white text-black flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mb-4 shadow-md">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Create Account</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Join ChargeAhead intelligent EV network</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Tharun Krishna"
              {...register('name')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              placeholder="driver@chargeahead.in"
              {...register('email')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Mobile Phone</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              {...register('phone')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600 font-medium">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>}

            {/* Strength check */}
            <div className="flex gap-4 mt-2 text-[11px] text-gray-500 font-medium">
              <span className={hasMinLen ? 'text-emerald-700 font-bold flex items-center gap-1' : ''}>
                {hasMinLen && <Check className="w-3 h-3" />} 6+ characters
              </span>
              <span className={hasNum ? 'text-emerald-700 font-bold flex items-center gap-1' : ''}>
                {hasNum && <Check className="w-3 h-3" />} 1+ number
              </span>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-black text-white font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-md mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Create Account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={handleSocialSignup}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-white text-black text-sm font-bold hover:bg-gray-50 transition-all"
        >
          <Globe className="w-4 h-4" /> Continue with Google
        </button>

        <p className="text-center text-sm text-gray-500 font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-black font-extrabold hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
