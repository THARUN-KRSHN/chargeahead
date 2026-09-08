'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, X } from 'lucide-react';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onManual: () => void;
  onDismiss: () => void;
}

export function LocationPermissionModal({
  isOpen,
  onAllow,
  onManual,
  onDismiss,
}: LocationPermissionModalProps) {
  const allowRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) allowRef.current?.focus();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onDismiss}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Close */}
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="flex flex-col items-center px-8 pt-10 pb-2 text-center">
              <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mb-5 shadow-lg">
                <Navigation className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-extrabold text-black tracking-tight">
                Allow Location Access
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-2 leading-relaxed">
                ChargeAhead uses your location to find nearby charging stations and calculate the most efficient route for your EV.
              </p>
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 pt-6 space-y-3">
              <motion.button
                ref={allowRef}
                whileTap={{ scale: 0.97 }}
                onClick={onAllow}
                className="w-full py-3.5 rounded-xl bg-black text-white font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-md"
              >
                <Navigation className="w-4 h-4" />
                Allow Location Access
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onManual}
                className="w-full py-3.5 rounded-xl border border-gray-200 text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
              >
                <MapPin className="w-4 h-4 text-gray-500" />
                Enter Location Manually
              </motion.button>

              <p className="text-center text-[10px] text-gray-400 font-medium pt-1">
                Your location is never stored or shared with third parties.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
