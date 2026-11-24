import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Crown,
  Landmark,
  MessageCircle,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { MembershipPlan, PaymentMethod } from '../../types/marketplace';
import { formatNaira } from '../../utils/currency';
import {
  resolvePaystackChannels,
  type PaystackPaymentOptionId,
} from '../../utils/paystack';
import { TINTOL_PAYMENT_DETAILS, buildWhatsAppUrl } from '../../utils/whatsapp';
import { PaystackChannelPicker } from '../common/PaystackChannelPicker';
import { SeoHead } from '../common/SeoHead';
import { DEFAULT_SITE_URL } from '../../utils/seoHead';
import { buildBreadcrumbListSchema } from '../../utils/seoSchema';

export function MembershipPage() {
  const {
    currentUser,
    membershipPlans,
    activeUserMembership,
    activeMembershipPlan,
    subscribeMembership,
    verifyPaystackReference,
    cancelMembership,
    quickLoginAsRole,
    publicServerConfig,
    navigate,
    products,
    showToast,
  } = useStore();

  const [billingCycle, setBillingCycle] = useState<'annual' | 'masterclass'>('annual');
  const [checkoutPlan, setCheckoutPlan] = useState<MembershipPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack');
  const [paystackOption, setPaystackOption] = useState<PaystackPaymentOptionId>('all');
  const [transferRef, setTransferRef] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processingPaystack, setProcessingPaystack] = useState(false);
  const [verifyingPaystack, setVerifyingPaystack] = useState(false);
  const [paystackAuthUrl, setPaystackAuthUrl] = useState<string | null>(null);
  const [pendingPayRef, setPendingPayRef] = useState<string | null>(null);

  const handleOpenSubscribe = (plan: MembershipPlan) => {
    setError(null);
    setPaystackAuthUrl(null);
    setPendingPayRef(null);
    if (!currentUser) {
      showToast('Sign in or use Demo Student Sign In to subscribe');
      navigate('/login');
      return;
    }
    setCheckoutPlan(plan);
  };

  const handleConfirmSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPlan || processingPaystack) return;
    setError(null);
    setPaystackAuthUrl(null);

    if (paymentMethod === 'gtb_whatsapp' && transferRef.trim().length < 3) {
      setError('Enter your GTB transfer sender name or reference to submit.');
      return;
    }

    let payRef = transferRef;
    let paystackVerified = false;
    const chargeAmount =
      checkoutPlan.id === 'free'
        ? 0
        : billingCycle === 'masterclass'
          ? (checkoutPlan.masterclassPrice ?? 25000)
          : checkoutPlan.annualPrice;

    if ((paymentMethod === 'paystack' || paymentMethod === 'card') && currentUser) {
      setProcessingPaystack(true);
      try {
        const ref = `MEM-PSK-${Date.now()}`;
        const initRes = await fetch('/api/paystack/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser.email,
            amountNgn: chargeAmount,
            channels: resolvePaystackChannels(paystackOption),
            reference: ref,
            callbackUrl:
              typeof window !== 'undefined' ? window.location.origin + '/membership' : undefined,
            metadata: { planId: checkoutPlan.id, billingCycle, paystackOption },
          }),
        });
        const initJson = (await initRes.json()) as {
          configured?: boolean;
          authorizationUrl?: string;
          reference?: string;
          error?: string;
        };
        if (!initRes.ok) {
          setError(initJson.error || 'Paystack initialization failed.');
          setProcessingPaystack(false);
          return;
        }
        payRef = initJson.reference || ref;
        setPendingPayRef(payRef);
        if (initJson.configured && initJson.authorizationUrl) {
          setPaystackAuthUrl(initJson.authorizationUrl);
        }
      } catch {
        // Safe offline fallback
      } finally {
        setProcessingPaystack(false);
      }
    }

    const res = subscribeMembership(checkoutPlan.id, billingCycle, {
      paymentMethod,
      paymentReference: payRef,
      paystackVerified,
    });
    if (!res.ok) {
      setError(res.error ?? 'Unable to complete membership subscription.');
      return;
    }
    if (paystackVerified || paymentMethod === 'gtb_whatsapp') {
      setCheckoutPlan(null);
    }
    setTransferRef('');
  };

  const includedProductsCountByTier = (tier: MembershipPlan['id']) => {
    return products.filter((p) => {
      if (p.status !== 'published') return false;
      if (tier === 'free') {
        return p.price === 0 || p.includedInMembershipTier === 'free';
      }
      return p.includedInMembershipTier === 'paid' || (p.price > 0 && !p.isPremium);
    }).length;
  };

  // SEO: OfferCatalog of membership tiers + breadcrumb JSON-LD for /membership
  const seoOfferCatalog = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Digital Wealth Creators Membership Plans',
    url: `${DEFAULT_SITE_URL}/membership`,
    itemListElement: membershipPlans.map((plan, idx) => ({
      '@type': 'Offer',
      position: idx + 1,
      price: plan.annualPrice,
      priceCurrency: 'NGN',
      itemOffered: {
        '@type': 'Service',
        name: plan.name,
        description: plan.tagline || plan.audienceLabel || plan.name,
        provider: {
          '@type': 'Organization',
          name: 'Digital Wealth Creators',
          url: DEFAULT_SITE_URL,
        },
      },
    })),
  };

  return (
    <main className="pb-20 bg-white">
      {/* SEO: canonical, OpenGraph and OfferCatalog + breadcrumb JSON-LD */}
      <SeoHead
        title="Membership Plans — Free, Standard ₦10k & Master Class ₦25k"
        description="Compare DWC membership tiers: start free, or unlock the Standard 1-Year Pass (₦10,000) and Master Class 1-Year Pass (₦25,000) with 50% member discounts, full course access and mentorship."
        canonical={`${DEFAULT_SITE_URL}/membership`}
        ogType="website"
        jsonLd={[
          seoOfferCatalog,
          buildBreadcrumbListSchema([
            { name: 'Home', url: '/' },
            { name: 'Membership', url: '/membership' },
          ]),
        ]}
      />

      {/* Group Membership (Campus/Group) — new purchase surface */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0a192f] via-[#0a192f] to-[#142a4d] border-4 border-[#d4af37]/40 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_#f5c451,_transparent_50%)]" aria-hidden="true" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 text-left">
            <div className="space-y-3 max-w-xl">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-[#f5c451]/10 text-[#f5c451] rounded-full px-3 py-1">
                🎓 Campus &amp; Group Packs
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                DWC Group Membership Pass (15 Seats, ₦75,000)
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                A Group Admin or institution representative registers for a maximum of 15 seats with one lump-sum payment. Every assigned member gets their N25 paid-seat status. Perfect for campuses, cohorts, and teams. Groups can also access Enquiry-help desk services and booked mentorship sessions through the platform.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/product/dwc-group-membership-15')}
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 text-sm font-bold bg-[#f5c451] hover:bg-[#d4af37] text-[#0a192f] rounded-xl shadow-lg shadow-[#f5c451]/30 transition-all cursor-pointer"
            >
              View Group Pass
            </button>
          </div>
        </div>
      </div>

      {/* Navy & Gold Centered Header */}
      <section className="bg-[#0a192f] text-white border-b-4 border-[#d4af37]">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12 lg:py-16 text-center space-y-5">
          <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#112240] text-[#f5c451] border border-[#d4af37]/40 mx-auto">
            <Crown className="w-3.5 h-3.5" />
            <span>Digital Wealth Creators · All-Access Tiers</span>
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight text-balance">
            Unlock Courses, Digital Tools, and Member-Only Savings.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Choose your learning path: start 100% free with open catalog courses, or upgrade to an
            all-access pass for unrestricted resource downloads, masterclasses, and automatic 50% checkout savings on Premium items.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            {/* Standard ₦10k vs Master Class ₦25k Segmented Switch */}
            <div
              role="group"
              aria-label="Membership options"
              className="inline-flex items-center p-1 bg-[#112240] border border-[#263d66] rounded-lg shadow-inner"
            >
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 text-xs font-bold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${billingCycle === 'annual'
                  ? 'bg-[#d4af37] text-[#0a192f] shadow'
                  : 'text-slate-200 hover:text-white'
                  }`}
              >
                Standard 1-Year Pass (₦10,000 / yr)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('masterclass')}
                className={`px-4 py-2 text-xs font-bold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${billingCycle === 'masterclass'
                  ? 'bg-[#d4af37] text-[#0a192f] shadow'
                  : 'text-slate-200 hover:text-white'
                  }`}
              >
                Master Class 1-Year Pass (₦25,000 / yr · Online Training)
              </button>
            </div>

            {!currentUser && (
              <button
                type="button"
                onClick={() => quickLoginAsRole('customer')}
                className="px-4 py-2.5 text-xs font-bold text-[#0a192f] bg-[#f5c451] hover:bg-[#e5bf45] rounded-md whitespace-nowrap shrink-0 cursor-pointer shadow"
              >
                Try with Demo Student Account
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-10 space-y-16">
        {/* Active Member Banner */}
        {currentUser && activeUserMembership && activeMembershipPlan && (
          <div className="p-6 rounded-xl bg-slate-50 border border-[#d4af37] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0a192f] text-[#f5c451] flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0a192f] uppercase tracking-wider">
                  Active Membership Pass
                </p>
                <h2 className="font-display text-lg font-extrabold text-slate-900">
                  {activeMembershipPlan.name} · {activeUserMembership.billingCycle === 'annual' ? 'Standard 1-Year' : 'Master Class 1-Year'} Pass
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                  Automatic {activeMembershipPlan.storeDiscountPercent}% store discount active · Renews{' '}
                  {activeUserMembership.renewsAt.slice(0, 10)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/courses')}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0a192f] hover:bg-[#112240] rounded-md cursor-pointer"
              >
                Browse Unlocked Courses
              </button>
              <button
                type="button"
                onClick={cancelMembership}
                className="px-4 py-2 text-xs font-bold text-rose-700 border border-rose-300 hover:bg-rose-50 rounded-md cursor-pointer"
              >
                Cancel Plan
              </button>
            </div>
          </div>
        )}

        {/* 3 Symmetrically Centered & Well-Designed Tier Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch justify-center">
          {/* 1. Free Membership Card - High-Polish Emerald/Slate Design */}
          <div className="rounded-2xl p-6 sm:p-7 flex flex-col justify-between bg-white text-slate-900 border-2 border-emerald-500/40 hover:border-emerald-600 shadow-md hover:shadow-xl transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 pointer-events-none" />
            <div className="space-y-4 relative z-10">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Free Forever
                  </span>
                  <h2 className="font-display text-2xl font-black text-slate-900 mt-2">
                    Free Member
                  </h2>
                </div>
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  ✓
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Ideal for self-paced beginners exploring digital wealth creation, free catalog courses, and community chats.
              </p>

              <div className="pt-2 pb-4 border-b border-slate-100">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">
                    ₦0
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    / forever
                  </span>
                </div>
                <p className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>No credit card required · Instant access</span>
                </p>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm pt-1">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Access to all free courses (text & video formats)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Preview lessons on all catalog courses</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Download free community eBooks and toolkits</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Public discussion channels & verifiable certificate</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-4 h-4 text-slate-400 font-bold shrink-0 mt-0.5 text-center">·</span>
                  <span className="text-slate-500 italic">Pay full rate for Premium products at checkout</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 relative z-10">
              {activeUserMembership?.planId === 'free' ? (
                <div className="w-full py-3 px-4 rounded-xl text-center text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Your Current Active Tier</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const freePlan = membershipPlans.find((p) => p.id === 'free');
                    if (freePlan) handleOpenSubscribe(freePlan);
                  }}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer shadow"
                >
                  Get Started Free
                </button>
              )}
            </div>
          </div>

          {/* 2. Standard 1-Year Pass Card (₦10,000 / year) */}
          <div className="rounded-2xl p-6 sm:p-7 flex flex-col justify-between bg-[#0a192f] text-white border-2 border-slate-700 hover:border-[#d4af37]/60 shadow-lg hover:shadow-xl transition-all relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#112240] text-[#f5c451] border border-[#263d66]">
                    Self-Paced Pass
                  </span>
                  <h2 className="font-display text-2xl font-black text-white mt-2">
                    Standard 1-Year
                  </h2>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#112240] text-[#f5c451] flex items-center justify-center font-bold border border-[#d4af37]/30">
                  <Crown className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Full 1-year access to all resources and catalog courses without masterclass training, plus 50% off Premium products.
              </p>

              <div className="pt-2 pb-4 border-b border-slate-700/60">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-3xl sm:text-4xl font-black text-[#f5c451] tabular-nums">
                    ₦10,000
                  </span>
                  <span className="text-xs text-slate-400">
                    / year
                  </span>
                </div>
                <p className="text-xs text-amber-300 font-semibold mt-1.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>50% discount on all Premium products</span>
                </p>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm pt-1">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#f5c451] shrink-0 mt-0.5" />
                  <span className="text-slate-200">100% catalog access to all courses (text & video)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#f5c451] shrink-0 mt-0.5" />
                  <span className="text-slate-200">All digital resources, eBooks, templates & toolkits</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#f5c451] shrink-0 mt-0.5" />
                  <span className="text-slate-200">Automatic 50% discount on products labeled Premium</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#f5c451] shrink-0 mt-0.5" />
                  <span className="text-slate-200">Full Community Chat channels & support forum</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-4 h-4 text-slate-500 font-bold shrink-0 mt-0.5 text-center">·</span>
                  <span className="text-slate-400 italic">Self-paced learning without live masterclasses</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              {activeUserMembership?.planId === 'paid' && activeUserMembership.billingCycle === 'annual' ? (
                <div className="w-full py-3 px-4 rounded-xl text-center text-xs font-bold bg-[#112240] text-[#f5c451] border border-[#d4af37]/40 inline-flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#f5c451]" />
                  <span>Your Current Active Plan</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setBillingCycle('annual');
                    const paidPlan = membershipPlans.find((p) => p.id === 'paid');
                    if (paidPlan) handleOpenSubscribe(paidPlan);
                  }}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#112240] text-[#f5c451] border border-[#d4af37]/60 hover:bg-[#1a335e] transition-colors cursor-pointer shadow"
                >
                  Subscribe Standard (₦10,000 / yr)
                </button>
              )}
            </div>
          </div>

          {/* 3. VIP Master Class 1-Year Pass Card (₦25,000 / year) */}
          <div className="rounded-2xl p-6 sm:p-7 flex flex-col justify-between bg-gradient-to-b from-[#0a192f] via-[#0e2242] to-[#0a192f] text-white border-2 border-[#d4af37] shadow-2xl relative overflow-hidden hover:scale-[1.01] transition-transform">
            <div className="absolute -top-3 right-5">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-[#f5c451] to-[#d4af37] text-[#0a192f] shadow-md border border-white/20">
                ⭐ Master Class VIP
              </span>
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#f5c451]">
                    Complete Mastermind
                  </span>
                  <h2 className="font-display text-2xl font-black text-white mt-1">
                    Master Class 1-Year
                  </h2>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#d4af37] text-[#0a192f] flex items-center justify-center font-black shadow">
                  <Crown className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                One year access to all resources and catalog courses PLUS online masterclass training & VIP Prompt Vault.
              </p>

              <div className="pt-2 pb-4 border-b border-[#d4af37]/30">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-3xl sm:text-4xl font-black text-white tabular-nums">
                    ₦25,000
                  </span>
                  <span className="text-xs text-[#f5c451] font-semibold">
                    / year · All-Inclusive
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#d4af37] text-[#0a192f]">
                  <Check className="w-3 h-3 text-[#0a192f]" />
                  <span>Online Master Class Training Included</span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm pt-1">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#f5c451] shrink-0 mt-0.5" />
                  <span className="text-white font-medium">1-Year online masterclass training workshops</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#f5c451] shrink-0 mt-0.5" />
                  <span className="text-slate-100">100% all resources, video & text courses unlocked</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#f5c451] shrink-0 mt-0.5" />
                  <span className="text-slate-100">VIP AI Prompt Vault access with verified agents</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#f5c451] shrink-0 mt-0.5" />
                  <span className="text-slate-100">Automatic 50% discount on products labeled Premium</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#f5c451] shrink-0 mt-0.5" />
                  <span className="text-slate-100">Promoter & Facilitator direct support & reviews</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              {activeUserMembership?.planId === 'paid' && activeUserMembership.billingCycle === 'masterclass' ? (
                <div className="w-full py-3 px-4 rounded-xl text-center text-xs font-bold bg-[#d4af37] text-[#0a192f] inline-flex items-center justify-center gap-1.5 shadow">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Your Current VIP Tier</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setBillingCycle('masterclass');
                    const paidPlan = membershipPlans.find((p) => p.id === 'paid');
                    if (paidPlan) handleOpenSubscribe(paidPlan);
                  }}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold bg-[#d4af37] hover:bg-[#e5bf45] text-[#0a192f] transition-all cursor-pointer shadow-lg hover:shadow-xl"
                >
                  Join Master Class VIP (₦25,000 / yr)
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Detailed Benefits of Each Membership Explanation Section */}
        <section className="space-y-6 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
              Detailed Benefits of Each Membership
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Clear breakdown of who each membership is built for and what value you receive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Tier Deep Dive */}
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Free Member Benefits
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Who it is for:</strong> Exploratory students, visitors, and curious learners testing out the platform.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✔</span>
                  <span><strong>Zero Financial Obligation:</strong> Completely free forever without card requirements.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✔</span>
                  <span><strong>Open Catalog Courses:</strong> Full access to all courses marked Free, including preview lectures.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✔</span>
                  <span><strong>Community Chat:</strong> Join open discussions with peers across Nigeria and globally.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✔</span>
                  <span><strong>Free Certificates:</strong> Verifiable digital certificate issued upon completing free courses.</span>
                </li>
              </ul>
            </div>

            {/* Standard ₦10k Tier Deep Dive */}
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#112240] text-[#f5c451] flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Standard 1-Year (₦10,000)
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Who it is for:</strong> Self-paced builders, developers, and educators who want all materials without live sessions.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li className="flex items-start gap-1.5">
                  <span className="text-[#0a192f] font-bold">✔</span>
                  <span><strong>All Resources Access:</strong> Unrestricted access to all courses, eBooks, templates, and toolkits.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#0a192f] font-bold">✔</span>
                  <span><strong>50% Premium Discount:</strong> Instant 50% discount on all products labeled Premium at checkout.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#0a192f] font-bold">✔</span>
                  <span><strong>Self-Directed Pace:</strong> Learn when you want without recurring scheduled masterclass obligations.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#0a192f] font-bold">✔</span>
                  <span><strong>Immediate ROI:</strong> Buying two premium products saves more than the entire ₦10,000 annual fee.</span>
                </li>
              </ul>
            </div>

            {/* VIP Masterclass ₦25k Tier Deep Dive */}
            <div className="p-6 rounded-xl border border-[#d4af37]/60 bg-amber-50/30 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#d4af37] text-[#0a192f] flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Master Class 1-Year (₦25,000)
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Who it is for:</strong> Serious creators, tech founders, and leaders who demand hands-on live guidance.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-700 font-bold">✔</span>
                  <span><strong>Online Masterclass Training:</strong> Live virtual workshops, hands-on labs, and expert feedback.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-700 font-bold">✔</span>
                  <span><strong>VIP Prompt Vault:</strong> Exclusive access to production AI prompts, agents, and templates.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-700 font-bold">✔</span>
                  <span><strong>All Resources Included:</strong> Unlocked access to every video course, text guide, and software tool.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-700 font-bold">✔</span>
                  <span><strong>50% Premium Discount:</strong> Half-price savings on all premium digital product purchases.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Concrete Plan Comparison Matrix */}
        <section className="space-y-3">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
              Side-by-Side Entitlement Matrix
            </h2>
            <p className="text-xs text-slate-700 font-medium">
              Compare features across Free, Standard, and Master Class plans.
            </p>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm leading-tight">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-800 leading-tight">
                <tr>
                  <th className="px-4 py-2.5">Capability & Entitlement</th>
                  <th className="px-4 py-2.5 text-slate-900">Free Member</th>
                  <th className="px-4 py-2.5 text-slate-900">Standard 1-Year (₦10k)</th>
                  <th className="px-4 py-2.5 text-amber-950 bg-amber-50/70">Master Class 1-Year (₦25k)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm leading-tight">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-900">Annual Pricing</td>
                  <td className="px-4 py-2.5 text-slate-800 font-bold">₦0 (Forever)</td>
                  <td className="px-4 py-2.5 text-slate-950 font-black">₦10,000 / year</td>
                  <td className="px-4 py-2.5 text-amber-950 font-black bg-amber-50/40">₦25,000 / year</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-900">Course Formats Included</td>
                  <td className="px-4 py-2.5 text-slate-800 font-medium">Free Text, Video & Multimedia</td>
                  <td className="px-4 py-2.5 text-slate-950 font-bold">100% Courses (Text, Video, Audio, Infographics)</td>
                  <td className="px-4 py-2.5 text-amber-950 font-bold bg-amber-50/40">100% All Courses + Mastermind Labs</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-900">Online Master Class Training</td>
                  <td className="px-4 py-2.5 text-slate-600 font-medium">Not Included</td>
                  <td className="px-4 py-2.5 text-slate-700 font-medium">Not Included (Self-Paced)</td>
                  <td className="px-4 py-2.5 text-emerald-800 font-extrabold bg-amber-50/40">✔ Included (1-Year Online Training)</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-900">Discount on Premium Products</td>
                  <td className="px-4 py-2.5 text-slate-600 font-medium">0% (Full Price)</td>
                  <td className="px-4 py-2.5 text-emerald-800 font-bold">50% Automatic Discount</td>
                  <td className="px-4 py-2.5 text-emerald-800 font-bold bg-amber-50/40">50% Automatic Discount</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-900">VIP AI Prompt Vault</td>
                  <td className="px-4 py-2.5 text-slate-600 font-medium">Sample Prompts Only</td>
                  <td className="px-4 py-2.5 text-slate-800 font-medium">Standard Prompts</td>
                  <td className="px-4 py-2.5 text-purple-800 font-bold bg-amber-50/40">✔ Full VIP Access (Photography & Vision)</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-900">Downloadable Resources</td>
                  <td className="px-4 py-2.5 text-slate-800 font-medium">Free Deliverables</td>
                  <td className="px-4 py-2.5 text-slate-950 font-bold">All eBooks, Toolkits, Software</td>
                  <td className="px-4 py-2.5 text-amber-950 font-bold bg-amber-50/40">All eBooks, Toolkits, Software</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-900">Community Support</td>
                  <td className="px-4 py-2.5 text-slate-800 font-medium">Public Channels</td>
                  <td className="px-4 py-2.5 text-slate-800 font-medium">Full Community Channels</td>
                  <td className="px-4 py-2.5 text-amber-950 font-bold bg-amber-50/40">Facilitator Mentorship & S.B.O Hub</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Membership Subscription Modal */}
      {checkoutPlan && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Subscribe to ${checkoutPlan.name}`}
        >
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-[#0a192f] text-white border-b-2 border-[#d4af37] flex items-center justify-between">
              <h3 className="font-display text-base font-bold">
                Activate {checkoutPlan.name}
              </h3>
              <button
                type="button"
                onClick={() => setCheckoutPlan(null)}
                aria-label="Close membership checkout"
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSubscription} className="p-6 space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{checkoutPlan.name}</p>
                  <p className="text-xs text-slate-500">
                    {billingCycle === 'masterclass'
                      ? '1-Year Master Class Pass (Includes Online Training)'
                      : '1-Year Standard Pass (without masterclass training)'} ·{' '}
                    50% Off Premium Products
                  </p>
                </div>
                <span className="font-display text-xl font-extrabold text-[#0a192f] tabular-nums">
                  {formatNaira(
                    billingCycle === 'masterclass'
                      ? (checkoutPlan.masterclassPrice ?? 25000)
                      : checkoutPlan.annualPrice
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paystack')}
                  className={`py-2.5 px-3 text-xs font-bold rounded-md border cursor-pointer ${paymentMethod === 'paystack' || paymentMethod === 'card'
                    ? 'border-[#0a192f] bg-[#0a192f] text-white'
                    : 'border-slate-300 text-slate-700'
                    }`}
                >
                  Paystack / Instant Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('gtb_whatsapp')}
                  className={`py-2.5 px-3 text-xs font-bold rounded-md border cursor-pointer ${paymentMethod === 'gtb_whatsapp'
                    ? 'border-[#d4af37] bg-amber-50 text-[#0a192f]'
                    : 'border-slate-300 text-slate-700'
                    }`}
                >
                  GTB Bank + WhatsApp
                </button>
              </div>

              {(paymentMethod === 'paystack' || paymentMethod === 'card') && !paystackAuthUrl && (
                <PaystackChannelPicker
                  selectedOption={paystackOption}
                  onSelect={setPaystackOption}
                  paystackConfigured={publicServerConfig.paystackConfigured}
                />
              )}

              {paymentMethod === 'gtb_whatsapp' && (
                <div className="p-3.5 rounded-lg bg-[#0a192f] text-white text-xs space-y-2">
                  <div className="flex items-center gap-2 text-[#f5c451] font-bold">
                    <Landmark className="w-4 h-4" />
                    <span>{TINTOL_PAYMENT_DETAILS.bankFullName}</span>
                  </div>
                  <p className="font-mono font-bold text-sm text-[#f5c451]">
                    {TINTOL_PAYMENT_DETAILS.accountNumber} · {TINTOL_PAYMENT_DETAILS.accountName}
                  </p>
                  <input
                    type="text"
                    value={transferRef}
                    onChange={(e) => setTransferRef(e.target.value)}
                    placeholder="Transfer sender name or reference"
                    className="w-full h-9 px-3 rounded bg-[#112240] border border-[#2a436e] text-white placeholder:text-slate-400"
                  />
                  <a
                    href={buildWhatsAppUrl(
                      `Hello ${TINTOL_PAYMENT_DETAILS.accountName}, I am activating the ${checkoutPlan.name} (${billingCycle === 'masterclass'
                        ? '₦25,000 1-Year Master Class Pass with Online Training'
                        : '₦10,000 1-Year Standard Pass without masterclass training'
                      }) membership via GTB transfer.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Send proof on WhatsApp Desk</span>
                  </a>
                </div>
              )}

              {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}

              {paystackAuthUrl ? (
                <div className="p-4 rounded-lg bg-[#0a192f] text-white border border-[#d4af37] space-y-2.5">
                  <p className="text-xs font-bold text-[#f5c451]">
                    Complete Paystack Settlement to Activate {checkoutPlan.name}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Your pass is held as Pending until Paystack verifies payment.
                  </p>
                  <a
                    href={paystackAuthUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md inline-flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Proceed to Paystack Checkout</span>
                  </a>
                  {pendingPayRef && (
                    <button
                      type="button"
                      disabled={verifyingPaystack}
                      onClick={async () => {
                        setVerifyingPaystack(true);
                        const check = await verifyPaystackReference(pendingPayRef);
                        setVerifyingPaystack(false);
                        if (check.verified) {
                          setCheckoutPlan(null);
                          setPaystackAuthUrl(null);
                          setPendingPayRef(null);
                        } else {
                          showToast(check.message);
                        }
                      }}
                      className="w-full py-2 px-4 text-xs font-semibold text-[#f5c451] border border-[#d4af37]/60 rounded-md inline-flex items-center justify-center gap-2 hover:bg-[#112240] cursor-pointer disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {verifyingPaystack ? 'Checking Paystack...' : 'Verify Paystack Payment Now'}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={processingPaystack}
                  className="w-full py-3 text-sm font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {processingPaystack
                      ? 'Connecting Paystack...'
                      : paymentMethod === 'gtb_whatsapp'
                        ? 'Submit Transfer & Activate Pending Pass'
                        : publicServerConfig.paystackConfigured
                          ? 'Pay via Paystack & Activate'
                          : 'Proceed to Paystack Settlement'}
                  </span>
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
