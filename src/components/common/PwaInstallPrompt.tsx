import { useEffect, useState } from 'react';
import { Download, Share2, Smartphone, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const DISMISS_STORAGE_KEY = 'cm_pwa_dismissed';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PwaInstallPrompt() {
  const { appearance } = useStore();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // Check 7-day dismissal cache
    const checkDismissed = (): boolean => {
      try {
        const stored = localStorage.getItem(DISMISS_STORAGE_KEY);
        if (!stored) return false;
        const timestamp = parseInt(stored, 10);
        return Date.now() - timestamp < DISMISS_TTL_MS;
      } catch {
        return false;
      }
    };

    if (checkDismissed()) {
      return;
    }

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isAppleDevice);

    // Capture standard PWA install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!checkDismissed()) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS Safari, show prompt after a short delay so user can discover it
    let timer: number | undefined;
    if (isAppleDevice && !checkDismissed()) {
      timer = window.setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsVisible(false);
        }
      } catch {
        // user closed prompt
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions((prev) => !prev);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
    } catch {
      // storage unavailable
    }
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Install Digital Wealth Creators (DWC) Web Application"
      className="fixed bottom-6 right-6 z-40 max-w-sm w-[calc(100vw-3rem)] bg-white dark:bg-[#112240] text-slate-900 dark:text-slate-100 p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-[#233554] animate-in fade-in slide-in-from-bottom-3 duration-200 print:hidden select-none"
      data-testid="pwa-install-prompt"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5c451] via-[#d4af37] to-[#b89728] text-[#0a192f] flex items-center justify-center font-black text-xs tracking-wider shrink-0 shadow-md border border-[#f5c451]/50">
            DWC
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              Install {appearance.brandName} App
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Instant access, offline lecture notes & theater mode
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt for 7 days"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {showIOSInstructions && isIOS && (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-[#081528] rounded-lg border border-slate-200 dark:border-[#233554] text-xs space-y-1.5 animate-in fade-in">
          <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>How to install on iOS Safari:</span>
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
            <li>Tap the <Share2 className="w-3 h-3 inline mx-0.5 text-blue-500" /> Share button in Safari.</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
            <li>Tap <strong>Add</strong> at top right to launch anytime.</li>
          </ol>
        </div>
      )}

      <div className="mt-3.5 flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex-1 py-2 px-3 bg-[#d4af37] hover:bg-[#e5bf45] text-[#0a192f] text-xs font-extrabold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isIOS ? (showIOSInstructions ? 'Hide Instructions' : 'Install on iOS') : 'Install App'}</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2d4f] rounded-lg transition-colors cursor-pointer"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}
