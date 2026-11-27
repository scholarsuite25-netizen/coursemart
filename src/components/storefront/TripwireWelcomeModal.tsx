import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Sparkles, Clock, Zap, CheckCircle2, X, ShieldCheck } from 'lucide-react';

const TRIPWIRE_DISMISS_KEY = 'dwc_tripwire_dismissed';
const REGISTERED_USER_KEY = 'dwc_registered_user';
const SUPPRESS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isTripwireSuppressed(): boolean {
  try {
    if (localStorage.getItem(REGISTERED_USER_KEY) === '1') {
      return true;
    }
    const dismissedAt = localStorage.getItem(TRIPWIRE_DISMISS_KEY);
    if (!dismissedAt) return false;
    const elapsed = Date.now() - parseInt(dismissedAt, 10);
    return Number.isFinite(elapsed) && elapsed < SUPPRESS_DURATION_MS;
  } catch {
    return false;
  }
}

export const TripwireWelcomeModal: React.FC = () => {
  const { currentUser, products, addToCart, setIsCartOpen, setAppliedCouponCode, showToast } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds

  useEffect(() => {
    // Never show to registered / signed-in users or if dismissed recently
    if (currentUser || isTripwireSuppressed()) {
      setIsOpen(false);
      return;
    }

    // Trigger after 4 seconds of initial landing for unregistered visitors
    const timer = setTimeout(() => {
      if (!isTripwireSuppressed()) {
        setIsOpen(true);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentUser]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        try {
          localStorage.setItem(TRIPWIRE_DISMISS_KEY, Date.now().toString());
        } catch {
          // ignore
        }
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timeLeft]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleDismiss = () => {
    try {
      localStorage.setItem(TRIPWIRE_DISMISS_KEY, Date.now().toString());
    } catch {
      // ignore storage errors
    }
    setIsOpen(false);
  };

  const handleClaimOffer = () => {
    try {
      localStorage.setItem(TRIPWIRE_DISMISS_KEY, Date.now().toString());
    } catch {
      // ignore storage errors
    }
    setAppliedCouponCode('SAVE85');
    
    // Pick the first available course or digital product to bundle
    const targetProduct = products.find((p) => p.status === 'published') || products[0];
    if (targetProduct) {
      addToCart(targetProduct);
    }
    
    setIsOpen(false);
    setIsCartOpen(true);
    showToast('🎉 Flash Welcome Offer Applied! 85% Voucher SAVE85 Activated in Cart.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Special Registration Offer"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-amber-500/30 overflow-hidden">
        {/* Top Urgency Ribbon */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-2.5 text-white flex items-center justify-between text-xs sm:text-sm font-semibold tracking-wide">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-200 animate-pulse" />
            <span>SPECIAL ONE-TIME REGISTRATION OFFER</span>
          </div>
          <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-10 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Dismiss offer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              90% Off Welcome Deal
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Unlock The 105+ Executive AI Prompt Vault
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Get our complete suite of executive prompts, marketing automations, and digital money-making playbooks at our exclusive community entry rate.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 line-through">Regular Price: ₦25,000</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                Today: ₦2,500 <span className="text-xs font-medium text-slate-500">(One-Time)</span>
              </div>
            </div>
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Save 90%
            </span>
          </div>

          {/* Value Checklist */}
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>105 Production AI Prompts</strong> (Copy, Coding, Strategy & Growth)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>YouTube-to-Course Automation Tool</strong> Included</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>Instant Access to Official Telegram Hub</strong> & VIP Networking</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>Instant Paystack & GTBank Transfer</strong> Verification</span>
            </li>
          </ul>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleClaimOffer}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <Zap className="w-5 h-5 text-yellow-300" />
              <span>Claim Welcome Deal for ₦2,500</span>
            </button>

            <button
              onClick={handleDismiss}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
            >
              No thanks, I prefer paying the full ₦25,000 price later
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Secure Checkout via Paystack & Direct GTBank Transfer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
