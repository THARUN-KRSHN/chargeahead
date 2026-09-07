'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-navy-900 text-white flex flex-col items-center justify-center p-4 text-center space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-xs text-white/50 max-w-sm mx-auto">
          An unexpected telemetry processing error occurred.
        </p>
      </div>

      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-mint-gradient text-navy-900 font-bold text-xs shadow-mint-glow hover:opacity-90 transition-all"
      >
        <RefreshCw className="w-4 h-4" /> Try Again
      </button>
    </div>
  );
}
