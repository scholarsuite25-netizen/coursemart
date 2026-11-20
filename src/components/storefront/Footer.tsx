import { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Landmark,
  MessageCircle,
  Phone,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  TINTOL_PAYMENT_DETAILS,
  buildCallUrl,
  buildWhatsAppUrl,
} from '../../utils/whatsapp';
import { ShareButton } from '../common/ShareButton';

export function Footer() {
  const {
    appearance,
    navigate,
    setFilters,
    whatsappGroups,
    joinWhatsAppGroup,
    showToast,
  } = useStore();
  const [copiedAcct, setCopiedAcct] = useState(false);

  const publicGroups = whatsappGroups.filter(
    (g) => g.active && g.visibility === 'public'
  );

  const handleBrowseType = (type: 'all' | 'course' | 'ebook' | 'software') => {
    setFilters((prev) => ({ ...prev, type, category: 'All' }));
    navigate('/');
    window.setTimeout(() => {
      document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const handleCopyAccount = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(TINTOL_PAYMENT_DETAILS.accountNumber).catch(() => {});
    }
    setCopiedAcct(true);
    showToast(`Copied GTB Account ${TINTOL_PAYMENT_DETAILS.accountNumber}`);
    window.setTimeout(() => setCopiedAcct(false), 2000);
  };

  const generalWhatsAppLink = buildWhatsAppUrl(
    `Hello ${TINTOL_PAYMENT_DETAILS.accountName}, I would like assistance with a course, digital product, or software license on ${appearance.brandName}.`
  );
  const paymentProofLink = buildWhatsAppUrl(
    `Hello ${TINTOL_PAYMENT_DETAILS.accountName}, I made a GTB bank transfer to ${TINTOL_PAYMENT_DETAILS.accountNumber} and would like to submit my payment receipt.`
  );

  return (
    <footer className="bg-[#0a192f] text-slate-200 border-t-4 border-[#d4af37]">
      {/* Primary Multi-Column Grid */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 text-sm">
        {/* Column 1: Brand + Direct Call/WhatsApp + Share (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-md bg-[#d4af37] text-[#0a192f] font-display font-black text-base flex items-center justify-center shrink-0">
              {appearance.brandName.charAt(0).toUpperCase()}
            </span>
            <p className="font-display text-xl font-extrabold text-white tracking-tight">
              {appearance.brandName}
            </p>
          </div>

          <p className="text-slate-300 leading-relaxed max-w-sm">
            Unified digital marketplace, editorial publication, and LMS covering AI, Vibe Coding,
            Mentorship, Leadership, and Apps Deployment.
          </p>

          {/* Click-to-Call, Click-to-WhatsApp, Share */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <a
              href={buildCallUrl()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#112240] border border-[#d4af37]/50 hover:border-[#d4af37] hover:text-[#f5c451] rounded-md transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#f5c451]" />
              <span>Call {TINTOL_PAYMENT_DETAILS.phoneDisplay}</span>
            </a>

            <a
              href={generalWhatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-md transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Support</span>
            </a>

            <ShareButton title={appearance.brandName} variant="footer" label="Share Site" />
          </div>
        </div>

        {/* Column 2: Digital Products & Storefront Pages (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <p className="font-display text-xs font-bold text-[#f5c451] uppercase tracking-wider">
            Digital Products
          </p>
          <ul className="space-y-2 text-slate-300">
            <li>
              <button
                type="button"
                onClick={() => navigate('/digital-products')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Digital Products Hub
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/digital-products/ebooks')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                eBooks (PDF / EPUB)
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/digital-products/templates')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Templates
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/digital-products/toolkits')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Toolkits
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/courses')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Video Courses
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/software')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Software & Licenses
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Blogs & Portals (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <p className="font-display text-xs font-bold text-[#f5c451] uppercase tracking-wider">
            Blogs & Portals
          </p>
          <ul className="space-y-2 text-slate-300">
            <li>
              <button
                type="button"
                onClick={() => navigate('/blogs')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left font-semibold text-white"
              >
                All Blogs
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/blogs/category/ai')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                AI
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/blogs/category/mentorship')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Mentorship
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/blogs/category/leadership')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Leadership
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/blogs/category/vibe-coding')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Vibe Coding
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/blogs/category/apps-deployment')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Apps Deployment
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left text-white font-semibold"
              >
                Events & Workshops
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/membership')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left text-[#f5c451]"
              >
                Membership Plans
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/affiliates')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Affiliate Program
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/showcase')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Showcase
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/library')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                My Library
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Events & Seminars
              </button>
            </li>
          </ul>
        </div>

        {/* Column 4: Official GTB Bank Transfer & WhatsApp Verification Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-[#112240] border border-[#d4af37]/50 rounded-xl p-5 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[#f5c451]">
                <Landmark className="w-4 h-4 shrink-0" />
                <p className="font-display text-xs font-bold uppercase tracking-wider">
                  Direct Bank & WhatsApp Payment
                </p>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            <div className="bg-[#0a192f] border border-[#233554] rounded-lg p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Bank</span>
                <span className="font-bold text-white">
                  {TINTOL_PAYMENT_DETAILS.bankFullName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Account Number</span>
                <div className="flex items-center gap-2">
                  <code className="font-mono font-extrabold text-sm text-[#f5c451] tabular-nums select-all">
                    {TINTOL_PAYMENT_DETAILS.accountNumber}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    aria-label="Copy GTB account number"
                    className="p-1 text-slate-300 hover:text-[#f5c451] bg-[#112240] rounded cursor-pointer"
                  >
                    {copiedAcct ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account Name</span>
                <span className="font-bold text-white">
                  {TINTOL_PAYMENT_DETAILS.accountName}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Transfer directly to the GTB account above and tap below to send your receipt via
              WhatsApp for fast activation.
            </p>

            <a
              href={paymentProofLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md inline-flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send Payment Proof on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* WhatsApp Communities Directory Strip */}
      {publicGroups.length > 0 && (
        <div className="border-t border-[#1e3557] bg-[#081427]">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-[#f5c451] shrink-0" />
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-wider text-[#f5c451]">
                  Official WhatsApp Learning & Buyer Communities
                </p>
                <p className="text-xs text-slate-400">
                  Join active cohorts, receive software updates, and connect with mentors.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {publicGroups.map((group) => (
                <a
                  key={group.id}
                  href={group.inviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => joinWhatsAppGroup(group.id)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#112240] border border-[#2a436e] hover:border-[#d4af37] rounded-md transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{group.name}</span>
                  <span className="text-[11px] text-[#f5c451] tabular-nums">
                    ({group.membersCount})
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Legal & Contact Bar */}
      <div className="border-t border-[#1e3557] bg-[#06101f]">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              © 2026 {appearance.brandName} · {TINTOL_PAYMENT_DETAILS.accountName}. All rights
              reserved.
            </span>
            <span className="text-[#d4af37]/60">·</span>
            <span>GTB Settlement · Instant Course & License Delivery</span>
            <span className="text-[#d4af37]/60">·</span>
            <span className="text-slate-400">
              Sample catalog ratings, buyer counts & demo financial figures shown for evaluation
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={buildCallUrl()}
              className="hover:text-[#f5c451] transition-colors tabular-nums"
            >
              Tel: {TINTOL_PAYMENT_DETAILS.phoneDisplay}
            </a>
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#f5c451] transition-colors"
            >
              WhatsApp Desk
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
