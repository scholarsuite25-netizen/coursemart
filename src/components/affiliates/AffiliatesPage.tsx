import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  DollarSign,
  ExternalLink,
  Link2,
  MousePointerClick,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { AffiliateProfile } from '../../types/marketplace';
import {
  AFFILIATE_MIN_PAYOUT_NGN,
  calculateAffiliateLedgerSummary,
} from '../../utils/commerce';
import { formatNaira } from '../../utils/currency';

export function AffiliatesPage() {
  const {
    currentUser,
    products,
    currentUserAffiliate,
    affiliateConversions,
    affiliatePayouts,
    joinAffiliateProgram,
    requestAffiliatePayout,
    quickLoginAsRole,
    navigate,
    showToast,
  } = useStore();

  const [fullNameInput, setFullNameInput] = useState(currentUser?.name || '');
  const [phoneInput, setPhoneInput] = useState('');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [stateCityInput, setStateCityInput] = useState('Lagos, Nigeria');
  const [promotionChannel, setPromotionChannel] = useState('WhatsApp Groups & Communities');
  const [audienceDesc, setAudienceDesc] = useState('');
  const [idType, setIdType] = useState('National ID (NIN)');
  const [idNumber, setIdNumber] = useState('');
  const [bankName, setBankName] = useState('Guaranty Trust Bank (GTBank)');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [payoutMethod, setPayoutMethod] =
    useState<AffiliateProfile['payoutMethod']>('GTB Bank Transfer');
  const [joinError, setJoinError] = useState<string | null>(null);

  const [selectedProductSlug, setSelectedProductSlug] = useState<string>('home');
  const [copiedLink, setCopiedLink] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState(currentUserAffiliate?.bankDetails ?? '');
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [submittingPayout, setSubmittingPayout] = useState(false);

  const myConversions = useMemo(() => {
    if (!currentUser) return [];
    return affiliateConversions.filter((c) => c.affiliateUserId === currentUser.id);
  }, [affiliateConversions, currentUser]);

  const myPayouts = useMemo(() => {
    if (!currentUser) return [];
    return affiliatePayouts.filter((p) => p.affiliateUserId === currentUser.id);
  }, [affiliatePayouts, currentUser]);

  const summary = useMemo(
    () =>
      calculateAffiliateLedgerSummary(
        myConversions,
        myPayouts,
        currentUserAffiliate?.clicks ?? 0
      ),
    [myConversions, myPayouts, currentUserAffiliate]
  );

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://digitalwealthcreators.org.ng';

  const generatedReferralUrl = currentUserAffiliate
    ? selectedProductSlug === 'home'
      ? `${origin}/?ref=${currentUserAffiliate.code}`
      : selectedProductSlug === 'membership'
      ? `${origin}/membership?ref=${currentUserAffiliate.code}`
      : `${origin}/product/${selectedProductSlug}?ref=${currentUserAffiliate.code}`
    : '';

  const handleCopyReferralUrl = () => {
    if (!generatedReferralUrl) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(generatedReferralUrl).catch(() => {});
    }
    setCopiedLink(true);
    showToast('Copied affiliate referral link');
    window.setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    if (!accountNumber.trim() || accountNumber.trim().length < 10) {
      setJoinError('Please provide a valid 10-digit NUBAN account number.');
      return;
    }
    const combinedBank = `${bankName} · ${accountNumber.trim()} · ${accountName.trim() || fullNameInput.trim() || currentUser?.name || 'Partner'}`;
    const res = joinAffiliateProgram({
      bankDetails: combinedBank,
      payoutMethod,
      phone: phoneInput.trim(),
      whatsappNumber: whatsappInput.trim() || phoneInput.trim(),
      stateOrCity: stateCityInput.trim(),
      promotionChannel,
      audienceDescription: audienceDesc.trim(),
      idType,
      idNumber: idNumber.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountName: (accountName.trim() || fullNameInput.trim() || currentUser?.name || 'Partner'),
    });
    if (!res.ok) {
      setJoinError(res.error ?? 'Unable to activate partner profile.');
      return;
    }
    if (res.profile) {
      setWithdrawBank(res.profile.bankDetails);
    }
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingPayout) return;
    setPayoutError(null);
    setSubmittingPayout(true);
    const amount = Number(withdrawAmount);
    const res = requestAffiliatePayout(amount, withdrawBank || currentUserAffiliate?.bankDetails || '');
    setSubmittingPayout(false);
    if (!res.ok) {
      setPayoutError(res.error ?? 'Unable to submit payout request.');
      return;
    }
    setWithdrawAmount('');
  };

  return (
    <main className="pb-20 bg-slate-50 min-h-screen">
      {/* Navy & Gold Header */}
      <section className="bg-[#0a192f] text-white border-b-4 border-[#d4af37]">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-12 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#f5c451]">
            Partner & Affiliate Program
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white text-balance">
            Earn 10% commission on the first purchase of every new customer you introduce.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Join our verified partner network, generate trackable referral links for any Course, Digital Product,
            Software License, or Membership tier. Payouts are settled via GTB Bank Transfer or Direct Wire.
          </p>
          <div className="p-3 rounded-lg bg-[#112240] border border-[#233554] text-xs text-slate-300 max-w-2xl flex items-start gap-2">
            <span className="text-[#f5c451] font-bold">🔒 Security Policy:</span>
            <span>
              Commission is credited strictly <strong>once per customer introduced</strong> (first purchase only, non-recurrent).
              Anti-self-referral security prevents using your own link to purchase items for yourself.
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-10 space-y-8">
        {!currentUser ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-2xl mx-auto text-center space-y-4">
            <h2 className="font-display text-2xl font-extrabold text-slate-900">
              Sign in to activate your Affiliate Partner Dashboard
            </h2>
            <p className="text-sm text-slate-600">
              Any signed-in learner, creator, or customer can enroll immediately, generate referral
              links, and track real-time conversions.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#0a192f] rounded-md cursor-pointer"
              >
                Sign In / Create Account
              </button>
              <button
                type="button"
                onClick={() => quickLoginAsRole('customer')}
                className="px-5 py-2.5 text-sm font-bold text-[#0a192f] bg-[#d4af37] rounded-md cursor-pointer"
              >
                Preview with Demo Partner (Alex Rivera)
              </button>
            </div>
          </div>
        ) : !currentUserAffiliate ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6 shadow-sm">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#0a192f] border border-blue-200">
                Partner Verification & Onboarding
              </span>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 mt-2">
                Join the DWC Affiliate Partner Network
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Receive your unique referral code (`?ref=`) and 10% standard commission rate on first purchases made by introduced customers.
              </p>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="aff-fullname" className="block text-xs font-bold text-slate-700 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    id="aff-fullname"
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder="e.g. Samuel Babatunde Omotoso"
                    className="w-full h-10 px-3 text-xs sm:text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="aff-statecity" className="block text-xs font-bold text-slate-700 mb-1">
                    State/City Location *
                  </label>
                  <input
                    id="aff-statecity"
                    type="text"
                    value={stateCityInput}
                    onChange={(e) => setStateCityInput(e.target.value)}
                    placeholder="e.g. Abeokuta, Ogun State"
                    className="w-full h-10 px-3 text-xs sm:text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="aff-phone" className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    id="aff-phone"
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="e.g. +234 803 123 4567"
                    className="w-full h-10 px-3 text-xs sm:text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="aff-whatsapp" className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp Number *
                  </label>
                  <input
                    id="aff-whatsapp"
                    type="tel"
                    value={whatsappInput}
                    onChange={(e) => setWhatsappInput(e.target.value)}
                    placeholder="e.g. +234 803 123 4567"
                    className="w-full h-10 px-3 text-xs sm:text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="aff-channel" className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Promotion Channel *
                  </label>
                  <select
                    id="aff-channel"
                    value={promotionChannel}
                    onChange={(e) => setPromotionChannel(e.target.value)}
                    className="w-full h-10 px-3 text-xs sm:text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400"
                  >
                    <option value="WhatsApp Groups & Communities">WhatsApp Groups & Communities</option>
                    <option value="Social Media (Facebook/Instagram/X)">Social Media (Facebook/Instagram/X)</option>
                    <option value="YouTube/Podcasts/Webinars">YouTube/Podcasts/Webinars</option>
                    <option value="Blog, Website & SEO">Blog, Website & SEO</option>
                    <option value="Email Newsletter">Email Newsletter</option>
                    <option value="Direct/In-Person Professional Network">Direct/In-Person Professional Network</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="aff-audience" className="block text-xs font-bold text-slate-700 mb-1">
                    Audience Reach/Profile URL
                  </label>
                  <input
                    id="aff-audience"
                    type="text"
                    value={audienceDesc}
                    onChange={(e) => setAudienceDesc(e.target.value)}
                    placeholder="e.g. 5,000 WhatsApp group members or Twitter handle"
                    className="w-full h-10 px-3 text-xs sm:text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label htmlFor="aff-idtype" className="block text-xs font-bold text-slate-700 mb-1">
                    Government ID Verification Type *
                  </label>
                  <select
                    id="aff-idtype"
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full h-10 px-3 text-xs sm:text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400"
                  >
                    <option value="National ID (NIN)">National ID (NIN)</option>
                    <option value="Voter's Card (VIN)">Voter's Card (VIN)</option>
                    <option value="Driver's License">Driver's License</option>
                    <option value="International Passport">International Passport</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="aff-idnum" className="block text-xs font-bold text-slate-700 mb-1">
                    ID/NIN Number *
                  </label>
                  <input
                    id="aff-idnum"
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 12345678901"
                    className="w-full h-10 px-3 text-xs sm:text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Settlement Bank Account Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="aff-bankname" className="block text-xs font-bold text-slate-700 mb-1">
                      Bank Name *
                    </label>
                    <input
                      id="aff-bankname"
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. GTBank, Zenith, Kuda"
                      className="w-full h-10 px-3 text-xs sm:text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="aff-accnum" className="block text-xs font-bold text-slate-700 mb-1">
                      10-Digit Account Number *
                    </label>
                    <input
                      id="aff-accnum"
                      type="text"
                      maxLength={10}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="0123456789"
                      className="w-full h-10 px-3 text-xs sm:text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 font-mono tabular-nums"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="aff-accname" className="block text-xs font-bold text-slate-700 mb-1">
                      Account Holder Name *
                    </label>
                    <input
                      id="aff-accname"
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Name as registered on account"
                      className="w-full h-10 px-3 text-xs sm:text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span>🛡 Anti-Fraud Notice:</span>
                </p>
                <p>
                  Affiliates are strictly prohibited from using their own referral links to purchase items for themselves.
                  System audit automatically verifies buyer identity and denies self-credited commissions.
                </p>
              </div>

              {joinError && <p className="text-xs font-semibold text-rose-700">{joinError}</p>}

              <button
                type="submit"
                className="w-full py-3.5 text-sm font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md cursor-pointer shadow transition-all"
              >
                Register & Activate Verified Partner Account
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Partner Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Referral Clicks</span>
                  <MousePointerClick className="w-4 h-4 text-[#0a192f]" />
                </div>
                <p className="font-display text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
                  {currentUserAffiliate.clicks}
                </p>
                <p className="text-xs text-slate-500 mt-1 tabular-nums">
                  Code: <strong className="font-mono text-[#0a192f]">{currentUserAffiliate.code}</strong>
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Attributed Sales</span>
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="font-display text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
                  {myConversions.length}
                </p>
                <p className="text-xs text-slate-500 mt-1 tabular-nums">
                  {summary.convRate}% conversion · {currentUserAffiliate.commissionRate}% rate
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Available Balance</span>
                  <Wallet className="w-4 h-4 text-[#b4690e]" />
                </div>
                <p className="font-display text-2xl font-extrabold text-emerald-700 mt-2 tabular-nums">
                  {formatNaira(summary.availableBalance)}
                </p>
                <p className="text-xs text-slate-500 mt-1 tabular-nums">
                  {summary.canRequestPayout
                    ? 'Meets ₦10,000 min withdrawal'
                    : `Min payout: ${formatNaira(AFFILIATE_MIN_PAYOUT_NGN)}`}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Pending Clearance</span>
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </div>
                <p className="font-display text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
                  {formatNaira(summary.pendingHoldEarned)}
                </p>
                <p className="text-xs text-slate-500 mt-1 tabular-nums">
                  {summary.holdDays}-day verification hold · Lifetime approved:{' '}
                  {formatNaira(summary.lifetimeApprovedEarned)}
                </p>
              </div>
            </div>

            {/* Reconciled Double-Entry Ledger Equation */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-xs tabular-nums">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-700">
                <span className="font-bold text-[#0a192f]">Ledger Reconciliation:</span>
                <span>
                  Lifetime Approved/Paid{' '}
                  <strong className="text-slate-900">{formatNaira(summary.lifetimeApprovedEarned)}</strong>
                </span>
                <span>−</span>
                <span>
                  Settled Payouts{' '}
                  <strong className="text-slate-900">{formatNaira(summary.settledPaidOut)}</strong>
                </span>
                <span>−</span>
                <span>
                  Pending Payouts{' '}
                  <strong className="text-slate-900">{formatNaira(summary.pendingWithdrawals)}</strong>
                </span>
                <span>=</span>
                <span className="font-extrabold text-emerald-700">
                  Available {formatNaira(summary.availableBalance)}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Min withdrawal {formatNaira(summary.minPayoutNgn)} · {summary.holdDays}-day refund hold
              </span>
            </div>

            {/* Referral Link Generator + Payout Request */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-[#0a192f]" />
                  <h2 className="font-display text-lg font-extrabold text-slate-900">
                    Offer & Product Referral Link Builder
                  </h2>
                </div>

                <div>
                  <label
                    htmlFor="aff-target-offer"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Select Offer to Promote
                  </label>
                  <select
                    id="aff-target-offer"
                    value={selectedProductSlug}
                    onChange={(e) => setSelectedProductSlug(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400"
                  >
                    <option value="home">Storefront Homepage (All Offers)</option>
                    <option value="membership">Tiered Membership Plans</option>
                    {products
                      .filter((p) => p.status === 'published')
                      .map((p) => (
                        <option key={p.id} value={p.slug}>
                          {p.title} ({formatNaira(p.price)})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <code className="font-mono text-xs text-slate-800 break-all">
                    {generatedReferralUrl}
                  </code>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyReferralUrl}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={generatedReferralUrl}
                      onClick={(e) => {
                        e.preventDefault();
                        const url = new URL(generatedReferralUrl);
                        window.history.pushState({}, '', `${url.pathname}${url.search}`);
                        navigate(url.pathname);
                        showToast(`Testing referral link ?ref=${currentUserAffiliate.code}`);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Test</span>
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
                  <p className="text-xs font-bold text-slate-800">Ready-to-Share Promo Copy</p>
                  <p className="text-xs text-slate-600 leading-relaxed select-all">
                    Level up your engineering, AI workflows, and wealth creation with Digital Wealth Creators (DWC)’s
                    curated courses, templates, and licensed tools. Use my partner link for instant
                    access: {generatedReferralUrl}
                  </p>
                </div>
              </section>

              <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-lg font-extrabold text-slate-900">
                  Request Commission Payout
                </h2>
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">
                    Available approved earnings:{' '}
                    <strong className="text-emerald-700 tabular-nums">
                      {formatNaira(summary.availableBalance)}
                    </strong>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Minimum withdrawal: {formatNaira(AFFILIATE_MIN_PAYOUT_NGN)}. New commissions settle after a {summary.holdDays}-day hold window.
                  </p>
                </div>

                <form onSubmit={handlePayoutSubmit} className="space-y-3">
                  <div>
                    <label
                      htmlFor="aff-withdraw-amount"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Amount (NGN ₦)
                    </label>
                    <input
                      id="aff-withdraw-amount"
                      type="number"
                      step="1"
                      min={AFFILIATE_MIN_PAYOUT_NGN}
                      max={Math.max(AFFILIATE_MIN_PAYOUT_NGN, Math.floor(summary.availableBalance))}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder={String(Math.round(summary.availableBalance))}
                      className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 tabular-nums"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="aff-withdraw-bank"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Bank / Settlement Details
                    </label>
                    <input
                      id="aff-withdraw-bank"
                      type="text"
                      value={withdrawBank || currentUserAffiliate.bankDetails}
                      onChange={(e) => setWithdrawBank(e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400"
                      required
                    />
                  </div>

                  {payoutError && (
                    <p className="text-xs font-semibold text-rose-700">{payoutError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={!summary.canRequestPayout || submittingPayout}
                    className="w-full py-2.5 text-xs font-bold text-white bg-[#0a192f] hover:bg-[#112240] disabled:opacity-50 rounded-md cursor-pointer"
                  >
                    {submittingPayout ? 'Submitting...' : 'Submit Payout Request'}
                  </button>
                </form>
              </section>
            </div>

            {/* Conversions & Payout History Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Referral Conversions ({myConversions.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="px-4 py-2.5">Order</th>
                        <th className="px-4 py-2.5">Buyer</th>
                        <th className="px-4 py-2.5">Sale</th>
                        <th className="px-4 py-2.5">Commission</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myConversions.map((conv) => (
                        <tr key={conv.id}>
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">
                            {conv.orderId}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{conv.buyerName}</td>
                          <td className="px-4 py-3 tabular-nums">{formatNaira(conv.orderTotal)}</td>
                          <td className="px-4 py-3 font-bold text-emerald-700 tabular-nums">
                            +{formatNaira(conv.commissionAmount)}
                          </td>
                          <td className="px-4 py-3 font-semibold capitalize">{conv.status}</td>
                        </tr>
                      ))}
                      {myConversions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                            Share your `?ref=` link to start recording conversions.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Payout Requests ({myPayouts.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Amount</th>
                        <th className="px-4 py-2.5">Account</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myPayouts.map((pay) => (
                        <tr key={pay.id}>
                          <td className="px-4 py-3 tabular-nums">{pay.requestedAt.slice(0, 10)}</td>
                          <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">
                            {formatNaira(pay.amount)}
                          </td>
                          <td className="px-4 py-3 text-slate-600 truncate max-w-[180px]">
                            {pay.bankDetails}
                          </td>
                          <td className="px-4 py-3 font-semibold capitalize">{pay.status}</td>
                        </tr>
                      ))}
                      {myPayouts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                            No payout requests submitted yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
