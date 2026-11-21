import React, { useEffect, useRef, useState } from 'react';
import { evaluateCopyProtection } from '../../utils/contentProtection';

export interface ContentProtectionWrapperProps {
  enabled?: boolean;
  children: React.ReactNode;
  className?: string;
  onViolation?: (event: string) => void;
  showNoticeOnBlock?: boolean;
}

export function ContentProtectionWrapper({
  enabled = false,
  children,
  className = '',
  onViolation,
  showNoticeOnBlock = true,
}: ContentProtectionWrapperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const triggerNotice = (msg: string) => {
    if (!showNoticeOnBlock) return;
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastNotice(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastNotice(null);
    }, 2400);
  };

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Block Ctrl/Cmd + C (Copy)
      if (isCmdOrCtrl && key === 'c') {
        const evalRes = evaluateCopyProtection('copy', true);
        if (evalRes.blocked) {
          e.preventDefault();
          e.stopPropagation();
          triggerNotice('Content copying is disabled for protected learning materials.');
          onViolation?.('keydown_copy');
        }
        return;
      }

      // Block Ctrl/Cmd + X (Cut)
      if (isCmdOrCtrl && key === 'x') {
        const evalRes = evaluateCopyProtection('cut', true);
        if (evalRes.blocked) {
          e.preventDefault();
          e.stopPropagation();
          triggerNotice('Content cutting is disabled.');
          onViolation?.('keydown_cut');
        }
        return;
      }

      // Block Ctrl/Cmd + U (View Source), Ctrl/Cmd + S (Save Page), Ctrl/Cmd + P (Print)
      if (isCmdOrCtrl && ['u', 's', 'p'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerNotice('Page export / source inspection is disabled on protected materials.');
        onViolation?.(`keydown_${key}`);
        return;
      }

      // Block F12 (DevTools toggle) and PrintScreen
      if (e.key === 'F12' || e.key === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        triggerNotice('Protected LMS viewport.');
        onViolation?.(`keydown_${e.key}`);
        return;
      }
    };

    const el = containerRef.current;
    const handleSelectStart = (e: Event) => {
      const evalRes = evaluateCopyProtection('selectstart', true);
      if (evalRes.blocked) {
        e.preventDefault();
        onViolation?.('selectstart');
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    if (el) {
      el.addEventListener('selectstart', handleSelectStart);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      if (el) {
        el.removeEventListener('selectstart', handleSelectStart);
      }
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [enabled, onViolation, showNoticeOnBlock]);

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
      onContextMenu={(e) => {
        if (enabled) {
          const evalRes = evaluateCopyProtection('contextmenu', true);
          if (evalRes.blocked) {
            e.preventDefault();
            triggerNotice('Right-click context menu is disabled for protected content.');
            onViolation?.('contextmenu');
          }
        }
      }}
      onCopy={(e) => {
        if (enabled) {
          const evalRes = evaluateCopyProtection('copy', true);
          if (evalRes.blocked) {
            e.preventDefault();
            triggerNotice('Text copying is disabled.');
            onViolation?.('copy');
          }
        }
      }}
      onCut={(e) => {
        if (enabled) {
          const evalRes = evaluateCopyProtection('cut', true);
          if (evalRes.blocked) {
            e.preventDefault();
            triggerNotice('Text cut is disabled.');
            onViolation?.('cut');
          }
        }
      }}
      onDragStart={(e) => {
        if (enabled) {
          e.preventDefault();
          onViolation?.('dragstart');
        }
      }}
    >
      <style>{`
        @media print {
          .lms-copy-protected {
            display: none !important;
          }
        }
      `}</style>
      <div className="lms-copy-protected w-full h-full">{children}</div>

      {toastNotice && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#0a192f] text-[#f5c451] border border-[#d4af37]/40 text-xs px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-[#f5c451] animate-ping" />
          <span className="font-medium">{toastNotice}</span>
        </aside>
      )}
    </div>
  );
}
