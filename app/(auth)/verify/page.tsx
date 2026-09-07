'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(45);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      toast.error('Please enter complete 6-digit verification code');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setVerified(true);
    toast.success('Phone number verified successfully! ⚡');
    setTimeout(() => {
      router.replace('/onboarding/vehicle');
    }, 800);
  };

  const handleResend = () => {
    setTimer(45);
    toast.info('New verification code sent via SMS');
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
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Verify Phone Number</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            We sent a 6-digit code to <span className="text-black font-extrabold">+91 98765 43210</span>
          </p>
        </div>

        <div className="space-y-6">
          {/* OTP Input grid */}
          <div className="flex justify-between gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 bg-gray-50 border border-gray-200 rounded-xl text-center text-xl font-extrabold text-black focus:outline-none focus:border-black focus:bg-white transition-all"
              />
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleVerify}
            disabled={loading || verified}
            className="w-full py-4 rounded-xl bg-black text-white font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-gray-900 disabled:opacity-60 transition-all shadow-md"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : verified ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-white" /> Verified!
              </>
            ) : (
              <>
                Verify & Continue <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>

          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Didn't receive code?</span>
            {timer > 0 ? (
              <span className="text-gray-400 font-mono font-bold">Resend in {timer}s</span>
            ) : (
              <button
                onClick={handleResend}
                className="text-black font-extrabold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Resend Code
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
