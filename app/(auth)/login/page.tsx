'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, ArrowRight, Globe } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { mockLogin } from '@/lib/mock/api';
import { toast } from 'sonner';

const schema = z.object({
  emailOrPhone: z.string().min(3, 'Enter your email or phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const user = await mockLogin(data);
      login(user);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! ⚡`);
      if (user.role === 'operator') {
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

  const handleSocialLogin = async (provider: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const { MOCK_USER } = await import('@/lib/mock/users');
    login(MOCK_USER);
    toast.success('Signed in with Google ⚡');
    router.replace('/app/home');
  };

  return (
    <div className="min-h-dvh bg-white text-black flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mb-4 shadow-md">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Welcome back</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Sign in to your ChargeAhead account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Demo hint */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
            <p className="text-xs text-gray-600 font-medium">
              <span className="text-black font-extrabold">Demo:</span> Use any email + any password. Or{' '}
              <span className="text-black underline font-bold">operator@chargeahead.in</span> for operator view.
            </p>
          </div>

          {/* Email/phone */}
          <div>
            <label htmlFor="emailOrPhone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Email or Phone
            </label>
            <input
              id="emailOrPhone"
              type="text"
              placeholder="name@example.com or +91 98765…"
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
                Sign in <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-white text-black text-sm font-bold hover:bg-gray-50 transition-all"
          >
            <Globe className="w-4 h-4" /> Google
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleSocialLogin('apple')}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-white text-black text-sm font-bold hover:bg-gray-50 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            Apple
          </motion.button>
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
