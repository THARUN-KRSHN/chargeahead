'use client';

import Link from 'next/link';
import { Zap, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-white text-black flex flex-col items-center justify-center p-4 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-md">
        <Zap className="w-8 h-8 text-white" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-mono font-extrabold text-gray-500 uppercase tracking-widest">Error 404</span>
        <h1 className="text-3xl font-extrabold text-black">Page Not Found</h1>
        <p className="text-sm text-gray-600 font-bold max-w-sm mx-auto">
          The requested station route or page doesn't exist or has been relocated.
        </p>
      </div>

      <Link
        href="/app/home"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-extrabold text-sm shadow-md hover:bg-gray-900 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Return to App Home
      </Link>
    </div>
  );
}
