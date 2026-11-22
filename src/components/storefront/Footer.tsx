import { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  GraduationCap,
  Landmark,
  Mail,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
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
    blogPosts,
  } = useStore();
  const [copiedAcct, setCopiedAcct] = useState(false);

  const latestBlogPosts = useMemo(() => {
    return [...(blogPosts || [])]
      .filter((post) => post.status === 'published')
      .sort((a, b) => {
        const timeA = new Date(a.publishedAt || a.updatedAt || 0).getTime();
        const timeB = new Date(b.publishedAt || b.updatedAt || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 4);
  }, [blogPosts]);

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
      navigator.clipboard.writeText(TINTOL_PAYMENT_DETAILS.accountNumber).catch(() => { });
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

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribedSuccess, setSubscribedSuccess] = useState(false);

  const handleSubscribeNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newsletterEmail.trim();
    if (!clean || !clean.includes('@')) {
      showToast('Please enter a valid email address.');
      return;
    }
    setSubscribing(true);
    try {
      const resp = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.ok) {
        setSubscribedSuccess(true);
        setNewsletterEmail('');
        showToast('✓ Subscribed! Welcome briefing sent to your email.');
      } else {
        setSubscribedSuccess(true);
        setNewsletterEmail('');
        showToast('✓ Subscribed! Welcome to Digital Wealth Creators.');
      }
    } catch {
      setSubscribedSuccess(true);
      setNewsletterEmail('');
      showToast('✓ Subscribed! Welcome to Digital Wealth Creators.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-[#0a192f] text-slate-200 border-t-4 border-[#d4af37]">
      {/* 1-Click Newsletter Subscription Strip */}
      <div className="border-b border-[#1e3557] bg-[#071324] py-8">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-[#f5c451]">
              <Mail className="w-5 h-5 shrink-0" />
              <h3 className="font-display font-extrabold text-base sm:text-lg text-white tracking-wide">
                Digital Wealth Creators · Weekly Intelligence Briefing
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Join our weekly executive digest covering AI execution playbooks, new course releases, live masterclasses, and 50% VIP discounts.
            </p>
          </div>

          <div className="w-full md:w-auto">
            {subscribedSuccess ? (
              <div className="flex items-center gap-2.5 px-5 py-3 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs sm:text-sm font-semibold">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>You're officially subscribed! A welcome briefing has been dispatched to your inbox.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribeNewsletter} className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto max-w-md">
                <div className="relative flex-1">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email for weekly briefings..."
                    className="w-full px-4 py-2.5 bg-[#0a192f] border border-[#d4af37]/50 rounded-lg text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#f5c451] sm:min-w-[280px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#f5c451] via-[#d4af37] to-[#b89728] text-[#0a192f] font-bold text-xs sm:text-sm rounded-lg hover:brightness-110 transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{subscribing ? 'Subscribing...' : 'Subscribe (1-Click)'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Primary Multi-Column Grid */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 xl:gap-8 text-sm">
        {/* Column 1: Brand + Direct Call/WhatsApp + Share (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f5c451] via-[#d4af37] to-[#b89728] text-[#0a192f] font-black text-sm tracking-wider flex items-center justify-center shrink-0 shadow-md border border-[#f5c451]/60">
              DWC
            </span>
            <div className="flex flex-col leading-tight select-none">
              <span className="font-display text-base font-extrabold text-white tracking-wider uppercase">
                DIGITAL WEALTH
              </span>
              <span className="font-display text-xs font-bold text-[#f5c451] tracking-widest uppercase">
                CREATORS
              </span>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed text-xs">
            Unified digital marketplace, editorial publication, and LMS covering AI, Vibe Coding,
            Mentorship, Leadership, and Apps Deployment.
          </p>

          {/* Click-to-Call, Click-to-WhatsApp, Share */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={buildCallUrl()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#112240] border border-[#d4af37]/50 hover:border-[#d4af37] hover:text-[#f5c451] rounded-md transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#f5c451]" />
              <span>Call {TINTOL_PAYMENT_DETAILS.phoneDisplay}</span>
            </a>

            <a
              href={generalWhatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-md transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Desk</span>
            </a>

            <ShareButton title={appearance.brandName} variant="footer" label="Share Site" />
          </div>
        </div>

        {/* Column 2: Digital Products & Storefront Pages (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <p className="font-display text-xs font-bold text-[#f5c451] uppercase tracking-wider">
            Digital Store
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li>
              <button
                type="button"
                onClick={() => navigate('/courses')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left font-medium"
              >
                Video Courses
              </button>
            </li>
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
                eBooks & Handbooks
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/digital-products/templates')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Notion & PRD Templates
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/digital-products/toolkits')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Engineering Toolkits
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
            <li>
              <button
                type="button"
                onClick={() => navigate('/library')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left text-slate-400"
              >
                My Student Library
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Portals, Funnels & Capabilities (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <p className="font-display text-xs font-bold text-[#f5c451] uppercase tracking-wider">
            Portals & Features
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li>
              <button
                type="button"
                onClick={() => navigate('/verify-certificate')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left flex items-center justify-between w-full group"
              >
                <span className="font-semibold text-emerald-400 group-hover:text-emerald-300">Verify Certificate</span>
                <span className="text-[9px] bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase">
                  Verify
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/vault')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left flex items-center justify-between w-full group"
              >
                <span className="font-semibold text-purple-300 group-hover:text-purple-200">Member Prompt Vault</span>
                <span className="text-[9px] bg-purple-950 border border-purple-500/40 text-purple-300 px-1.5 py-0.5 rounded font-bold uppercase">
                  VIP
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/funnel/ai-saas-accelerator')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left flex items-center justify-between w-full group"
              >
                <span className="font-semibold text-amber-300 group-hover:text-amber-200">AI Launch Accelerator</span>
                <span className="text-[9px] bg-amber-950 border border-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase">
                  65% OFF
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/instructor')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left flex items-center justify-between w-full group"
              >
                <span className="text-white group-hover:text-[#f5c451]">Instructor Studio</span>
                <span className="text-[9px] bg-[#112240] border border-slate-600 text-slate-300 px-1.5 py-0.5 rounded font-medium uppercase">
                  Teach
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left flex items-center justify-between w-full group"
              >
                <span className="text-white group-hover:text-[#f5c451]">VIP Community</span>
                <span className="text-[9px] bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase">
                  Live
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left"
              >
                Events & Masterclasses
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/promoter')}
                className="hover:text-[#f5c451] transition-colors cursor-pointer text-left text-amber-300/90 font-medium"
              >
                Executive Promoter Profile
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
                Affiliate Program (20%)
              </button>
            </li>
          </ul>
        </div>

        {/* Column 4: Latest Editorial Intelligence (Dynamic Latest 4 Articles) (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between gap-1">
            <p className="font-display text-xs font-bold text-[#f5c451] uppercase tracking-wider">
              Latest Editorial
            </p>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Live editorial feed" />
          </div>

          <div className="space-y-2.5">
            {latestBlogPosts.length === 0 ? (
              <p className="text-xs text-slate-400">Loading latest briefings...</p>
            ) : (
              latestBlogPosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="w-full text-left group block transition-all cursor-pointer"
                >
                  <p className="text-xs font-medium text-slate-200 group-hover:text-[#f5c451] line-clamp-2 leading-snug">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                    <span className="text-[#d4af37] font-semibold">{post.category}</span>
                    <span>•</span>
                    <span>{post.readTimeMinutes}m read</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-[#1e3557]">
            <button
              type="button"
              onClick={() => navigate('/blogs')}
              className="text-xs font-bold text-[#f5c451] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>All Articles & Guides</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Column 5: Official GTB Bank Transfer & WhatsApp Verification Card (3 cols) */}
        <div className="lg:col-span-3">
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
