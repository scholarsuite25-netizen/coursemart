import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { getCountdownSecondsRemaining } from '../../utils/commerce';

export function AnnouncementBar() {
  const { appearance, setAppliedCouponCode, setIsCartOpen, showToast } = useStore();
  const [dismissed, setDismissed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    getCountdownSecondsRemaining(appearance.announcementEndsAt)
  );

  useEffect(() => {
    setSecondsLeft(getCountdownSecondsRemaining(appearance.announcementEndsAt));
    if (!appearance.announcementCountdownEnabled || !appearance.announcementEndsAt) return;
    const timer = window.setInterval(() => {
      setSecondsLeft(getCountdownSecondsRemaining(appearance.announcementEndsAt));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [appearance.announcementCountdownEnabled, appearance.announcementEndsAt]);

  if (!appearance.announcementEnabled || dismissed) return null;

  const days = Math.floor(secondsLeft / 86400);
  const hours = String(Math.floor((secondsLeft % 86400) / 3600)).padStart(2, '0');
  const mins = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const handleApplyPromo = () => {
    if (!appearance.announcementCoupon) return;
    setAppliedCouponCode(appearance.announcementCoupon);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(appearance.announcementCoupon).catch(() => {});
    }
    showToast(`Coupon ${appearance.announcementCoupon} applied to cart`);
    setIsCartOpen(true);
  };

  return (
    <div
      className="bg-[#061224] text-amber-50 border-b border-[#d4af37]/35 min-h-[38px] px-4 py-1.5 flex items-center justify-center relative text-xs sm:text-sm overflow-hidden"
      role="region"
      aria-label="Promotional announcement"
    >
      <div className="max-w-7xl w-full mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 pr-8 text-center">
        <span className="font-medium max-w-full truncate">
          {appearance.announcementText}
        </span>
        {appearance.announcementCoupon && (
          <button
            type="button"
            onClick={handleApplyPromo}
            className="font-mono font-bold text-[#f5c451] underline underline-offset-4 hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Use code {appearance.announcementCoupon}
          </button>
        )}
        {appearance.announcementCountdownEnabled && secondsLeft > 0 && (
          <span className="hidden md:inline-flex items-center gap-1 text-slate-300 tabular-nums font-mono text-xs whitespace-nowrap shrink-0">
            Ends in {days > 0 ? `${days}d ` : ''}
            {hours}:{mins}:{secs}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-[#f5c451] rounded cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
