import { useEffect, useRef, useState } from 'react';
import { Check, Copy, MessageCircle, Send, Share2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { buildProductShareUrl } from '../../utils/whatsapp';

interface ShareButtonProps {
  title: string;
  url?: string;
  variant?: 'navbar' | 'footer' | 'card';
  label?: string;
}

export function ShareButton({
  title,
  url,
  variant = 'card',
  label = 'Share',
}: ShareButtonProps) {
  const { showToast } = useStore();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const resolvedUrl =
    url || (typeof window !== 'undefined' ? window.location.href : 'https://digitalwealthcreators.vercel.app');

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(resolvedUrl).catch(() => {});
    }
    setCopied(true);
    showToast('Share link copied to clipboard');
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url: resolvedUrl });
        setOpen(false);
        return;
      } catch {
        // Fallback to popover menu if cancelled or unsupported
      }
    }
    setOpen((prev) => !prev);
  };

  const buttonClasses =
    variant === 'navbar'
      ? 'p-2 text-slate-200 hover:text-[#f5c451] rounded-md hover:bg-[#112240] transition-colors cursor-pointer inline-flex items-center gap-1.5'
      : variant === 'footer'
      ? 'inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md transition-colors cursor-pointer'
      : 'inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-slate-800 border border-slate-300 bg-white hover:bg-slate-50 rounded-md transition-colors cursor-pointer';

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={handleNativeShare}
        aria-expanded={open}
        aria-label={`Share ${title}`}
        className={buttonClasses}
      >
        <Share2 className="w-4 h-4 shrink-0" />
        {variant !== 'navbar' && <span>{label}</span>}
      </button>

      {open && (
        <div
          className={`absolute ${
            variant === 'footer' ? 'bottom-full mb-2 left-0' : 'top-full mt-2 right-0'
          } w-60 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-50 text-slate-800`}
          role="menu"
          aria-label="Share options"
        >
          <p className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 mb-1">
            Share via
          </p>
          <button
            type="button"
            onClick={handleCopyLink}
            role="menuitem"
            className="w-full px-2.5 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 rounded flex items-center gap-2.5 cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <span>{copied ? 'Copied Link!' : 'Copy Direct Link'}</span>
          </button>

          <a
            href={buildProductShareUrl('whatsapp', title, resolvedUrl)}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="w-full px-2.5 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded flex items-center gap-2.5"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>Share on WhatsApp</span>
          </a>

          <a
            href={buildProductShareUrl('telegram', title, resolvedUrl)}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="w-full px-2.5 py-2 text-left text-xs font-semibold text-sky-600 hover:bg-sky-50 rounded flex items-center gap-2.5"
          >
            <Send className="w-4 h-4 text-sky-500 shrink-0" />
            <span>Share on Telegram</span>
          </a>

          <a
            href={buildProductShareUrl('x', title, resolvedUrl)}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="w-full px-2.5 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 rounded flex items-center gap-2.5"
          >
            <Share2 className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Share on X (Twitter)</span>
          </a>

          <a
            href={buildProductShareUrl('linkedin', title, resolvedUrl)}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="w-full px-2.5 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 rounded flex items-center gap-2.5"
          >
            <Share2 className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Share on LinkedIn</span>
          </a>
        </div>
      )}
    </div>
  );
}
