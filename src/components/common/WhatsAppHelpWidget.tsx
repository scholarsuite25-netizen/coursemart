import { useMemo, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { TINTOL_PAYMENT_DETAILS, buildWhatsAppUrl } from '../../utils/whatsapp';

export function WhatsAppHelpWidget() {
  const { route, appearance, currentUser } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const inquiryContext = useMemo(() => {
    const cleanRoute = (route || '/').split('?')[0].toLowerCase();

    if (
      cleanRoute === '/promoter' ||
      cleanRoute.startsWith('/facilitator') ||
      cleanRoute.startsWith('/speaker')
    ) {
      return {
        topic: 'Executive Promoter & Facilitator',
        message: `Hello S. B. OMOTOSO, I am inquiring regarding executive facilitation, keynote speaking, and institutional consultancy for our organization.`,
      };
    }

    if (cleanRoute.startsWith('/learn/')) {
      return {
        topic: 'Course Player & LMS Assistance',
        message: `Hello ${appearance.brandName} Support, I need assistance with my enrolled course content, lecture playback, or notes.`,
      };
    }

    if (cleanRoute === '/verify-certificate' || cleanRoute.startsWith('/verify-certificate')) {
      return {
        topic: 'Certificate Verification',
        message: `Hello ${appearance.brandName} Support, I have an inquiry regarding certificate authenticity verification.`,
      };
    }

    if (cleanRoute === '/courses' || cleanRoute.startsWith('/product/')) {
      return {
        topic: 'Course & Product Inquiries',
        message: `Hello ${appearance.brandName} Support, I would like more information about your courses, digital products, or software licenses.`,
      };
    }

    if (cleanRoute === '/membership') {
      return {
        topic: 'Membership Pass Support',
        message: `Hello ${appearance.brandName} Support, I have a question regarding the VIP Membership Pass and member perks.`,
      };
    }

    if (cleanRoute === '/community') {
      return {
        topic: 'Community & Group Support',
        message: `Hello ${appearance.brandName} Support, I would like to join the official WhatsApp learning and buyer communities.`,
      };
    }

    const userName = currentUser ? ` (${currentUser.name})` : '';
    return {
      topic: 'General Assistance',
      message: `Hello ${appearance.brandName} Support${userName}, I would like assistance with the platform and digital resources.`,
    };
  }, [route, appearance.brandName, currentUser]);

  const targetWhatsAppUrl = useMemo(() => {
    return buildWhatsAppUrl(inquiryContext.message, TINTOL_PAYMENT_DETAILS.phoneDigits);
  }, [inquiryContext.message]);

  return (
    <div
      className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2 select-none print:hidden"
      data-testid="whatsapp-help-widget"
    >
      {/* Expandable Chat Bubble Preview */}
      {isOpen && (
        <div className="w-80 max-w-[calc(100vw-3rem)] bg-white dark:bg-[#112240] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#233554] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="bg-[#0a192f] text-white p-3.5 flex items-center justify-between border-b border-[#d4af37]/40">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-inner">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0a192f]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">CourseMart Instant Support</p>
                <p className="text-[10px] text-emerald-400 font-medium">Online · Direct WhatsApp</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close WhatsApp chat preview"
              className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#081528] space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#112240] border border-slate-200/80 dark:border-[#233554] space-y-1 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                {inquiryContext.topic}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 italic">
                "{inquiryContext.message}"
              </p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Tap below to start a live WhatsApp chat with our executive promoter & support team.
            </p>
          </div>

          {/* Action CTA */}
          <div className="p-3 bg-white dark:bg-[#112240] border-t border-slate-100 dark:border-[#1e3557]">
            <a
              href={targetWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg inline-flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Chat on WhatsApp (+2348034710699)</span>
            </a>
          </div>
        </div>
      )}

      {/* Floating Button with Status Badge and Tooltip */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Instant WhatsApp Help (+2348034710699)"
          title="Chat with us on WhatsApp (+2348034710699)"
          className="relative w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer ring-4 ring-emerald-600/20"
        >
          <MessageCircle className="w-6 h-6" />

          {/* Pulse Indicator */}
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white dark:border-[#0a192f]" />
          </span>
        </button>

        {/* Hover Tooltip (when popover is closed) */}
        {!isOpen && (
          <div className="hidden sm:block absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            <div className="px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900/90 dark:bg-slate-800 backdrop-blur-xs rounded-md shadow-lg border border-slate-700">
              WhatsApp Help · +234 803 471 0699
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
