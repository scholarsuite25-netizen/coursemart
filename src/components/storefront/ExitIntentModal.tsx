import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Tag, Sparkles, Clock, ArrowRight, X, ShieldAlert } from 'lucide-react';

const EXIT_INTENT_DISMISS_KEY = 'dwc_exit_intent_dismissed';
const REGISTERED_USER_KEY = 'dwc_registered_user';
const SUPPRESS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isExitIntentSuppressed(): boolean {
  try {
    if (localStorage.getItem(REGISTERED_USER_KEY) === '1') {
      return true;
    }
    const dismissedAt = localStorage.getItem(EXIT_INTENT_DISMISS_KEY);
    if (!dismissedAt) return false;
    const elapsed = Date.now() - parseInt(dismissedAt, 10);
    return Number.isFinite(elapsed) && elapsed < SUPPRESS_DURATION_MS;
  } catch {
    return false;
  }
}

export const ExitIntentModal: React.FC = () => {
  const { currentUser, setAppliedCouponCode, setIsCartOpen, showToast } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => isExitIntentSuppressed());
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Never show to registered/signed-in users or if already dismissed
    if (currentUser || isDismissed || isExitIntentSuppressed()) {
      setIsOpen(false);
      return;
    }

    const triggerOnce = () => {
      if (hasTriggeredRef.current || isExitIntentSuppressed()) return;
      hasTriggeredRef.current = true;
      setIsOpen(true);
    };

    // 1. Desktop: Mouse leaves browser viewport toward top
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 15) {
        triggerOnce();
      }
    };

    // 2. Mobile: Rapid upward scroll detection (>250px up within 200ms)
    const handleScroll = () => {
      const currentY = window.scrollY;
      const currentTime = Date.now();
      const timeDiff = currentTime - lastScrollTime.current;
      const distance = lastScrollY.current - currentY;

      if (timeDiff > 0 && distance > 250 && timeDiff < 200) {
        triggerOnce();
      }

      lastScrollY.current = currentY;
      lastScrollTime.current = currentTime;
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentUser, isDismissed]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        try {
          localStorage.setItem(EXIT_INTENT_DISMISS_KEY, Date.now().toString());
        } catch {
          // ignore
        }
        setIsDismissed(true);
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleDismiss = () => {
    try {
      localStorage.setItem(EXIT_INTENT_DISMISS_KEY, Date.now().toString());
    } catch {
      // ignore storage errors
    }
    setIsDismissed(true);
    setIsOpen(false);
  };

  const handleApplyVoucher = () => {
    try {
      localStorage.setItem(EXIT_INTENT_DISMISS_KEY, Date.now().toString());
    } catch {
      // ignore storage errors
    }
    setIsDismissed(true);
    setAppliedCouponCode('SAVE85');
    setIsOpen(false);
    setIsCartOpen(true);
    showToast('🏷️ Voucher SAVE85 applied! Enjoy 85% off your entire cart.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Exit Intent Offer"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-rose-500/30 overflow-hidden">
        {/* Top Warning Banner */}
        <div className="bg-rose-600 px-4 py-2 text-white flex items-center justify-between text-xs sm:text-sm font-bold">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-white" />
            <span>WAIT! BEFORE YOU GO...</span>
          </div>
          <div className="flex items-center gap-1 bg-black/25 px-2 py-0.5 rounded font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{timerStr}</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-8 right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Tag className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Don't Leave Empty-Handed!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Take an extra <strong className="text-rose-600 dark:text-rose-400 font-bold">85% OFF</strong> any course, digital product, or mentorship program right now.
            </p>
          </div>

          {/* Voucher Code Box */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-dashed border-rose-400 dark:border-rose-500/50 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Coupon Code</span>
              <span className="font-mono text-xl font-extrabold text-slate-900 dark:text-white tracking-wider">SAVE85</span>
            </div>
            <span className="text-xs bg-rose-500 text-white font-bold px-2.5 py-1 rounded-md uppercase">
              85% Discount
            </span>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleApplyVoucher}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-lg shadow-rose-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Apply 85% Voucher & View Cart</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleDismiss}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
            >
              No thanks, I'll pay regular price later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
