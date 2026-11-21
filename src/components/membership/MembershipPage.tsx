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

  return (
    <main className="pb-20 bg-white">
      {/* Navy & Gold Header */}
      <section className="bg-[#0a192f] text-white border-b-4 border-[#d4af37]">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-12 lg:py-16 space-y-6">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#f5c451]">
              All-Access Membership Tiers
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight text-balance">
              Unlock courses, digital products, and member-only savings.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Choose a predictable monthly or annual pass to unlock tier-eligible video courses,
              downloadable eBooks, templates, toolkits, and automatic checkout discounts.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            {/* Standard ₦10k vs Master Class ₦25k Segmented Switch */}
            <div
              role="group"
              aria-label="Membership options"
              className="inline-flex items-center p-1 bg-[#112240] border border-[#263d66] rounded-lg"
            >
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 text-xs font-bold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  billingCycle === 'annual'
                    ? 'bg-[#d4af37] text-[#0a192f]'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                Standard 1-Year Pass (₦10,000 / yr)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('masterclass')}
                className={`px-4 py-2 text-xs font-bold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  billingCycle === 'masterclass'
                    ? 'bg-[#d4af37] text-[#0a192f]'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                Master Class 1-Year Pass (₦25,000 / yr · Includes Online Training)
              </button>
            </div>

            {!currentUser && (
              <button
                type="button"
                onClick={() => quickLoginAsRole('customer')}
                className="px-4 py-2.5 text-xs font-bold text-[#0a192f] bg-[#f5c451] hover:bg-[#e5bf45] rounded-md whitespace-nowrap shrink-0 cursor-pointer"
              >
                Try with Demo Student Account
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-10 space-y-12">
        {/* Active Member Banner */}
        {currentUser && activeUserMembership && activeMembershipPlan && (
          <div className="p-6 rounded-xl bg-slate-50 border border-[#d4af37] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0a192f] text-[#f5c451] flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0a192f] uppercase tracking-wider">
                  Active Membership Pass
                </p>
                <h2 className="font-display text-lg font-extrabold text-slate-900">
                  {activeMembershipPlan.name} · {activeUserMembership.billingCycle === 'annual' ? 'Annual' : 'Monthly'} Plan
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

        {/* 3 Tier Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {membershipPlans.map((plan) => {
            const isCurrent = activeUserMembership?.planId === plan.id && activeUserMembership.status === 'active';
            const displayPrice =
              plan.id === 'free'
                ? 0
                : billingCycle === 'masterclass'
                ? (plan.masterclassPrice ?? 25000)
                : plan.annualPrice;
            const unlockedCount = includedProductsCountByTier(plan.id);

            return (
              <div
                key={plan.id}
                className={`rounded-xl p-6 flex flex-col justify-between transition-colors ${
                  plan.featured
                    ? 'bg-[#0a192f] text-white border-2 border-[#d4af37] shadow-lg'
                    : 'bg-white text-slate-900 border border-slate-200'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          plan.featured ? 'text-[#f5c451]' : 'text-slate-500'
                        }`}
                      >
                        {plan.audienceLabel}
                      </p>
                      <h2 className="font-display text-2xl font-extrabold mt-1">
                        {plan.name}
                      </h2>
                    </div>
                    {plan.featured && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-[#d4af37] text-[#0a192f] shrink-0">
                        Most Popular
                      </span>
                    )}
                  </div>

                  <p className={`text-sm leading-relaxed ${plan.featured ? 'text-slate-300' : 'text-slate-600'}`}>
                    {plan.tagline}
                  </p>

                  <div className="pt-2 pb-4 border-b border-slate-200/20">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-3xl sm:text-4xl font-extrabold tabular-nums">
                        {formatNaira(displayPrice)}
                      </span>
                      <span className={`text-xs ${plan.featured ? 'text-slate-300' : 'text-slate-500'}`}>
                        {plan.id === 'free' ? 'forever' : '/ year'}
                      </span>
                    </div>

                    {plan.id === 'paid' && (
                      <div className="mt-2.5 space-y-1.5">
                        {billingCycle === 'masterclass' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-sm">
                            <Check className="w-3.5 h-3.5 text-slate-950" />
                            <span>1-Year Access WITH Master Class Online Training Included</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                            <span>1-Year Access (without masterclass training)</span>
                          </div>
                        )}
                        <p className="text-xs text-[#f5c451] tabular-nums pt-1">
                          {billingCycle === 'masterclass'
                            ? '₦25,000 for one year access to all resources and master class online training'
                            : '₦10,000 for one year access to all resources without masterclass training'}
                          {' · '}50% discount on premium products
                        </p>
                      </div>
                    )}

                    {plan.id === 'free' && (
                      <p className="text-xs mt-1 text-slate-500">
                        Always 100% Free · Direct access to all free-toggled catalog items & preview lessons
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 text-sm pt-1">
                    {plan.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            plan.featured ? 'text-[#f5c451]' : 'text-emerald-700'
                          }`}
                        />
                        <span className={plan.featured ? 'text-slate-200' : 'text-slate-700'}>
                          {perk}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  {isCurrent ? (
                    <div className="w-full py-3 px-4 rounded-md text-center text-xs font-bold bg-emerald-600 text-white inline-flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Current Active Tier</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenSubscribe(plan)}
                      className={`w-full py-3 px-4 rounded-md text-sm font-bold transition-colors cursor-pointer ${
                        plan.featured
                          ? 'bg-[#d4af37] text-[#0a192f] hover:bg-[#e5bf45]'
                          : 'bg-[#0a192f] text-white hover:bg-[#112240]'
                      }`}
                    >
                      {activeUserMembership ? `Switch to ${plan.name}` : `Join ${plan.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Concrete Plan Comparison Matrix */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-extrabold text-slate-900">
            Membership Tier Comparison
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                <tr>
                  <th className="px-5 py-3.5">Capability & Entitlement</th>
                  {membershipPlans.map((p) => (
                    <th key={p.id} className="px-5 py-3.5 text-slate-900">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">Course Library Access</td>
                  {membershipPlans.map((p) => (
                    <td key={p.id} className="px-5 py-3.5 text-slate-600">
                      {p.courseAccessLabel}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">Digital Resources</td>
                  {membershipPlans.map((p) => (
                    <td key={p.id} className="px-5 py-3.5 text-slate-600">
                      {p.digitalAccessLabel}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">Automatic Cart Discount</td>
                  {membershipPlans.map((p) => (
                    <td key={p.id} className="px-5 py-3.5 font-bold text-[#0a192f] tabular-nums">
                      {p.storeDiscountPercent}% Off All Items
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">Mentorship & Community</td>
                  {membershipPlans.map((p) => (
                    <td key={p.id} className="px-5 py-3.5 text-slate-600">
                      {p.supportLevel}
                    </td>
                  ))}
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
                  className={`py-2.5 px-3 text-xs font-bold rounded-md border cursor-pointer ${
                    paymentMethod === 'paystack' || paymentMethod === 'card'
                      ? 'border-[#0a192f] bg-[#0a192f] text-white'
                      : 'border-slate-300 text-slate-700'
                  }`}
                >
                  Paystack / Instant Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('gtb_whatsapp')}
                  className={`py-2.5 px-3 text-xs font-bold rounded-md border cursor-pointer ${
                    paymentMethod === 'gtb_whatsapp'
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
                      `Hello ${TINTOL_PAYMENT_DETAILS.accountName}, I am activating the ${checkoutPlan.name} (${
                        billingCycle === 'masterclass'
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
