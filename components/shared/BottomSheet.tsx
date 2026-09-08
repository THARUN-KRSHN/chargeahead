'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  snapPoints?: ('half' | 'full')[];
  defaultSnap?: 'half' | 'full';
  showHandle?: boolean;
  showCloseButton?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  className,
  showHandle = true,
  showCloseButton = false,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {onClose && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
              onClick={handleBackdropClick}
            />
          )}

          {/* Sheet */}
          <motion.div
            key="sheet"
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-[70] max-w-xl mx-auto rounded-t-3xl shadow-2xl',
              'bg-slate-900 border-t border-slate-800 text-white',
              'max-h-[90vh] overflow-hidden flex flex-col',
              className,
            )}
          >
            {/* Handle */}
            {showHandle && (
              <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto mt-3 mb-1 shrink-0" />
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-5 pb-2 pt-1">
                {title && <h2 className="text-base font-black text-white">{title}</h2>}
                {showCloseButton && onClose && (
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
