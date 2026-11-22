import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Clock,
  Sparkles,
  Star,
  Play,
  ArrowRight,
  Lock,
  Flame,
  Check,
  CreditCard,
  Building2,
  BookOpen,
  Layers,
  ArrowLeft,
  Download,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SEED_SALES_FUNNELS, SEED_PRODUCTS } from '../../data/seedData';
import type {
  PaymentMethod,
  Product,
  SalesFunnelConfig,
  SalesFunnelStep,
  Order,
} from '../../types/marketplace';
import { formatNaira } from '../../utils/currency';
import {
  calculateFunnelOrderTotal,
  buildFunnelCheckoutPayload,
  getFunnelBySlug,
} from '../../utils/funnelsAndVault';

interface SalesFunnelPageProps {
  slug?: string;
}

export function SalesFunnelPage({ slug }: SalesFunnelPageProps) {
  const {
    products,
    currentUser,
    completeFunnelOrder,
    navigate,
    activeReferralCode,
    showToast,
  } = useStore();

  // Find funnel configuration
  const funnel: SalesFunnelConfig = useMemo(() => {
    if (slug) {
      const found = getFunnelBySlug(SEED_SALES_FUNNELS, slug);
      if (found) return found;
    }
    return SEED_SALES_FUNNELS[0];
  }, [slug]);

  // Resolve Products
  const mainProduct: Product = useMemo(() => {
    return (
      products.find((p) => p.id === funnel.mainProductId) ||
      SEED_PRODUCTS.find((p) => p.id === funnel.mainProductId) ||
      SEED_PRODUCTS[0]
    );
  }, [products, funnel.mainProductId]);

  const orderBumpProduct: Product | undefined = useMemo(() => {
    if (!funnel.orderBump) return undefined;
    return (
      products.find((p) => p.id === funnel.orderBump?.productId) ||
      SEED_PRODUCTS.find((p) => p.id === funnel.orderBump?.productId)
    );
  }, [products, funnel.orderBump]);

  const upsellProduct: Product | undefined = useMemo(() => {
    if (!funnel.upsell) return undefined;
    return (
      products.find((p) => p.id === funnel.upsell?.productId) ||
      SEED_PRODUCTS.find((p) => p.id === funnel.upsell?.productId)
    );
  }, [products, funnel.upsell]);

  // Step state
  const [currentStep, setCurrentStep] = useState<SalesFunnelStep>('offer');
  const [bumpSelected, setBumpSelected] = useState<boolean>(true); // high-converting default
  const [upsellAccepted, setUpsellAccepted] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Form state
  const [name, setName] = useState<string>(currentUser?.name || '');
  const [email, setEmail] = useState<string>(currentUser?.email || '');
  const [phone, setPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync user info if currentUser changes
  useEffect(() => {
    if (currentUser) {
      if (!name) setName(currentUser.name);
      if (!email) setEmail(currentUser.email);
    }
  }, [currentUser, name, email]);

  // Urgency Timer (14:59)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(899);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 899));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pricing calculations
  const mainPrice = funnel.mainProductPrice ?? mainProduct.price;
  const bumpPrice = funnel.orderBump?.price ?? orderBumpProduct?.price ?? 0;
  const upsellPrice = funnel.upsell?.price ?? upsellProduct?.price ?? 0;

  const currentTotals = useMemo(() => {
    return calculateFunnelOrderTotal(
      mainPrice,
      bumpSelected,
      bumpPrice,
      upsellAccepted,
      upsellPrice
    );
  }, [mainPrice, bumpSelected, bumpPrice, upsellAccepted, upsellPrice]);

  // Handle Checkout submission
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Please enter a valid email address for product delivery.');
      return;
    }

    setIsSubmitting(true);

    const buyerUser = currentUser || {
      id: `user-guest-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: 'customer' as const,
      joinedAt: new Date().toISOString(),
    };

    // Card or Paystack simulate verified in mock environment; GTB stays pending
    const isPaystackVerified = paymentMethod === 'paystack' || paymentMethod === 'card';

    const { order, payload } = buildFunnelCheckoutPayload({
      funnel,
      mainProduct,
      orderBumpProduct,
      orderBumpSelected: bumpSelected,
      upsellProduct,
      upsellSelected: false, // upsell evaluated in step 3
      user: {
        id: buyerUser.id,
        name: cleanName,
        email: cleanEmail,
      },
      options: {
        paymentMethod,
        paymentReference: `PST-FNL-${Date.now()}`,
        paystackVerified: isPaystackVerified,
        affiliateCode: activeReferralCode || undefined,
        orderNotes: phone ? `Phone: ${phone}` : undefined,
      },
    });

    // Execute order in store without touching global cart
    completeFunnelOrder(payload, order);
    setCompletedOrder(order);
    setIsSubmitting(false);

    // If funnel has an upsell, advance to upsell stage; otherwise go directly to confirmation
    if (funnel.upsell) {
      setCurrentStep('upsell');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentStep('confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Upsell Accept
  const handleAcceptUpsell = () => {
    if (!completedOrder || !funnel.upsell) {
      setCurrentStep('confirmation');
      return;
    }

    setUpsellAccepted(true);

    // Add upsell product item to the completed order
    const upsellItem = {
      productId: funnel.upsell.productId,
      productTitle: funnel.upsell.title,
      productType: upsellProduct?.type || 'software',
      price: funnel.upsell.price,
    };

    const updatedItems = [...completedOrder.items, upsellItem];
    const newTotal = completedOrder.total + funnel.upsell.price;

    const updatedOrder: Order = {
      ...completedOrder,
      items: updatedItems,
      total: newTotal,
    };

    const updatedPayload = {
      funnelId: funnel.id,
      funnelSlug: funnel.slug,
      items: updatedItems,
      subtotal: completedOrder.subtotal,
      bumpAmount: bumpSelected ? bumpPrice : 0,
      upsellAmount: funnel.upsell.price,
      discount: completedOrder.discount,
      total: newTotal,
      customer: {
        id: completedOrder.userId,
        name: completedOrder.customerName,
        email: completedOrder.customerEmail,
      },
      paymentMethod: completedOrder.paymentMethod || 'card',
      paymentReference: completedOrder.paymentReference,
      status: completedOrder.status,
    };

    completeFunnelOrder(updatedPayload, updatedOrder);
    setCompletedOrder(updatedOrder);
    showToast('VIP Upgrade added to your enrollment!');
    setCurrentStep('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Upsell Decline
  const handleDeclineUpsell = () => {
    setUpsellAccepted(false);
    setCurrentStep('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-[#f5c451] selection:text-slate-950">
      {/* 1. Distraction-Free Top Bar */}
      <header className="sticky top-0 z-40 bg-[#0a192f]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo & Badge */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 focus:outline-none"
            >
              Course<span className="text-[#f5c451]">Mart</span>
            </button>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-[#f5c451]/15 text-[#f5c451] px-2.5 py-0.5 rounded-full border border-[#f5c451]/30">
              <Sparkles className="w-3 h-3" />
              Special Offer
            </span>
          </div>

          {/* Stepper Indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
            <span
              className={`px-2.5 py-1 rounded-full ${
                currentStep === 'offer'
                  ? 'bg-[#5624d0] text-white shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              1. Offer
            </span>
            <span className="text-slate-600">→</span>
            <span
              className={`px-2.5 py-1 rounded-full ${
                currentStep === 'checkout'
                  ? 'bg-[#5624d0] text-white shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              2. Checkout
            </span>
            <span className="text-slate-600">→</span>
            <span
              className={`px-2.5 py-1 rounded-full ${
                currentStep === 'upsell'
                  ? 'bg-[#5624d0] text-white shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              3. VIP Upgrade
            </span>
            <span className="text-slate-600">→</span>
            <span
              className={`px-2.5 py-1 rounded-full ${
                currentStep === 'confirmation'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              4. Ready
            </span>
          </div>

          {/* Urgency Countdown Timer */}
          <div className="flex items-center gap-2 bg-red-950/70 border border-red-800/80 text-red-200 px-3 py-1 rounded-lg text-xs font-bold animate-pulse">
            <Flame className="w-4 h-4 text-red-400 shrink-0" />
            <span>Offer Ends:</span>
            <span className="font-mono text-sm tracking-wider text-white">
              {formatTimer(secondsRemaining)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 md:py-12">
        {/* ========================================================= */}
        {/* STAGE 1: HERO OFFER STAGE                                  */}
        {/* ========================================================= */}
        {currentStep === 'offer' && (
          <div className="space-y-12">
            {/* Top Hook */}
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              {funnel.badgeText && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f5c451]/15 text-[#f5c451] border border-[#f5c451]/30">
                  <Flame className="w-3.5 h-3.5" />
                  {funnel.badgeText}
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {funnel.headline}
              </h1>
              {funnel.subheadline && (
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                  {funnel.subheadline}
                </p>
              )}
            </div>

            {/* Video / Visual Showcase Card */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950/80 shadow-2xl group max-w-4xl mx-auto">
              <div className="aspect-video w-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
                <img
                  src={funnel.videoPoster || mainProduct.thumbnail || '/assets/images/hero_learning_workspace_1794890414767.jpg'}
                  alt={funnel.title}
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Floating Play Button */}
                <div className="absolute z-10 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep('checkout');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-20 h-20 rounded-full bg-[#f5c451] hover:bg-[#ebd56e] text-slate-950 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all focus:outline-none"
                    aria-label="Play Course Trailer"
                  >
                    <Play className="w-8 h-8 fill-slate-950 ml-1" />
                  </button>
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-300 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800 backdrop-blur-sm">
                    Watch Full System Walkthrough (14.5 Hrs Inside)
                  </span>
                </div>
              </div>

              {/* Bottom Quick Bar inside card */}
              <div className="p-4 sm:p-6 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-slate-200">
                    4.9 / 5.0 (340+ Verified Engineers Enrolled)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 line-through">
                    {formatNaira(mainProduct.originalPrice || mainProduct.price * 2)}
                  </span>
                  <span className="text-2xl font-black text-[#f5c451]">
                    {formatNaira(mainPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Core Features & Transformation Checklist */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="space-y-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/80">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#f5c451]" />
                  What You Receive Immediately:
                </h3>
                <ul className="space-y-3">
                  {(funnel.features || mainProduct.learningOutcomes).map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Guarantee & Instructor Proof */}
              <div className="space-y-6 flex flex-col justify-between bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 rounded-2xl border border-slate-700/80">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#f5c451] font-bold text-sm uppercase tracking-wider">
                    <ShieldCheck className="w-5 h-5" />
                    {funnel.guaranteeBadge || '100% Risk-Free Guarantee'}
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Enroll completely risk-free for 30 full days.
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    If this masterclass and its production codebases do not accelerate your system
                    delivery by at least 3x, simply message our team for an immediate 100% refund.
                  </p>
                </div>

                {/* Primary Offer CTA Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('checkout');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-4 px-6 rounded-xl font-black text-slate-950 bg-[#f5c451] hover:bg-[#ebd56e] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base shadow-xl shadow-[#f5c451]/10 focus:outline-none"
                >
                  <span>Claim Your Accelerated Seat for {formatNaira(mainPrice)}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Social Proof Testimonials */}
            {funnel.socialProof && funnel.socialProof.length > 0 && (
              <div className="space-y-6 max-w-4xl mx-auto pt-6 border-t border-slate-800">
                <h3 className="text-center text-sm font-bold uppercase tracking-wider text-slate-400">
                  Trusted by Staff Engineers and Technology Leaders
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {funnel.socialProof.map((proof, i) => (
                    <div
                      key={i}
                      className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between"
                    >
                      <div className="flex text-amber-400">
                        {[...Array(proof.rating || 5)].map((_, rIdx) => (
                          <Star key={rIdx} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-sm text-slate-200 italic leading-relaxed">
                        &ldquo;{proof.quote}&rdquo;
                      </p>
                      <div className="pt-2 border-t border-slate-800/80">
                        <div className="text-sm font-bold text-white">{proof.author}</div>
                        <div className="text-xs text-slate-400">{proof.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 2: FRICTIONLESS CHECKOUT & ORDER BUMP               */}
        {/* ========================================================= */}
        {currentStep === 'checkout' && (
          <div className="space-y-8">
            {/* Stage Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <button
                  type="button"
                  onClick={() => setCurrentStep('offer')}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2 focus:outline-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Offer Details
                </button>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Complete Your Enrollment
                </h2>
                <p className="text-sm text-slate-400">
                  Instant digital access delivered immediately upon payment.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-3 py-1 rounded-lg text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                256-Bit SSL Encrypted
              </div>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Contact & Payment & Bump */}
              <div className="lg:col-span-7 space-y-6">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-sm font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. Contact Information Card */}
                <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#5624d0] text-white flex items-center justify-center text-xs">
                      1
                    </span>
                    Student Delivery Details
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#f5c451]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Email Address (Deliverable Access Sent Here) *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. alex@example.com"
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#f5c451]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        WhatsApp / Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +234 803 123 4567"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#f5c451]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Payment Selector Card */}
                <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#5624d0] text-white flex items-center justify-center text-xs">
                      2
                    </span>
                    Payment Method (Paystack NGN Gateway)
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paystack')}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        paymentMethod === 'paystack' || paymentMethod === 'card'
                          ? 'border-[#f5c451] bg-[#f5c451]/10 text-white'
                          : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-5 h-5 text-[#f5c451]" />
                        <div>
                          <div className="text-xs font-bold">Instant Paystack / Card</div>
                          <div className="text-[11px] text-slate-400">Debit card, USSD, Apple Pay</div>
                        </div>
                      </div>
                      {(paymentMethod === 'paystack' || paymentMethod === 'card') && (
                        <Check className="w-4 h-4 text-[#f5c451]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('gtb_whatsapp')}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        paymentMethod === 'gtb_whatsapp'
                          ? 'border-[#f5c451] bg-[#f5c451]/10 text-white'
                          : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-5 h-5 text-[#f5c451]" />
                        <div>
                          <div className="text-xs font-bold">GTB Direct Bank Transfer</div>
                          <div className="text-[11px] text-slate-400">Manual settlement on WhatsApp</div>
                        </div>
                      </div>
                      {paymentMethod === 'gtb_whatsapp' && (
                        <Check className="w-4 h-4 text-[#f5c451]" />
                      )}
                    </button>
                  </div>

                  {paymentMethod === 'gtb_whatsapp' && (
                    <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-xs text-amber-200 leading-relaxed">
                      <strong>GTBank Account:</strong> 0123456789 (Digital Wealth Creators / DWC). After completing checkout, send your transfer screenshot via WhatsApp to +234 803 471 0699 for instant admin activation.
                    </div>
                  )}
                </div>

                {/* 3. 1-Click Order Bump Card */}
                {funnel.orderBump && (
                  <div
                    className={`rounded-2xl p-5 border-2 border-dashed transition-all ${
                      bumpSelected
                        ? 'border-amber-400 bg-amber-950/20'
                        : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <input
                        type="checkbox"
                        id="order-bump-checkbox"
                        checked={bumpSelected}
                        onChange={(e) => setBumpSelected(e.target.checked)}
                        className="w-5 h-5 mt-1 rounded border-amber-400 text-[#5624d0] focus:ring-[#f5c451] cursor-pointer"
                      />
                      <label htmlFor="order-bump-checkbox" className="space-y-1.5 cursor-pointer select-none">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded animate-pulse">
                            One-Time Offer
                          </span>
                          <span className="text-sm font-bold text-white">
                            YES! Add {funnel.orderBump.title} for just {formatNaira(funnel.orderBump.price)}
                          </span>
                          {funnel.orderBump.originalPrice && (
                            <span className="text-xs text-slate-400 line-through">
                              {formatNaira(funnel.orderBump.originalPrice)}
                            </span>
                          )}
                          {funnel.orderBump.highlightText && (
                            <span className="text-xs font-bold text-emerald-400">
                              ({funnel.orderBump.highlightText})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {funnel.orderBump.description}
                        </p>
                      </label>
                    </div>
                  </div>
                )}

                {/* Action Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-xl font-black text-slate-950 bg-[#f5c451] hover:bg-[#ebd56e] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base shadow-xl shadow-[#f5c451]/10 focus:outline-none disabled:opacity-50"
                >
                  <Lock className="w-5 h-5" />
                  <span>
                    {isSubmitting
                      ? 'Securing Your Enrollment...'
                      : `Complete Secure Enrollment • ${formatNaira(currentTotals.total)}`}
                  </span>
                </button>
              </div>

              {/* Right Column: Sticky Order Summary */}
              <div className="lg:col-span-5 sticky top-20 space-y-4">
                <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-4 shadow-xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-700 pb-3">
                    Order Summary
                  </h3>

                  <div className="space-y-3 text-sm">
                    {/* Main Item */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{funnel.title}</div>
                        <div className="text-xs text-slate-400">Main Masterclass Offer</div>
                      </div>
                      <div className="font-bold text-slate-200">
                        {formatNaira(currentTotals.subtotal)}
                      </div>
                    </div>

                    {/* Bump Item */}
                    {bumpSelected && funnel.orderBump && (
                      <div className="flex items-start justify-between gap-3 text-amber-300 pt-2 border-t border-slate-700/50">
                        <div>
                          <div className="font-semibold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            {funnel.orderBump.title}
                          </div>
                          <div className="text-xs text-amber-400/80">1-Click Order Bump</div>
                        </div>
                        <div className="font-bold">
                          {formatNaira(currentTotals.bumpAmount)}
                        </div>
                      </div>
                    )}

                    {/* Total Row */}
                    <div className="pt-3 border-t border-slate-700 flex items-center justify-between text-base">
                      <span className="font-bold text-white">Total Investment:</span>
                      <span className="text-2xl font-black text-[#f5c451]">
                        {formatNaira(currentTotals.total)}
                      </span>
                    </div>
                  </div>

                  {/* Trust guarantees */}
                  <div className="pt-4 border-t border-slate-700/80 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Instant LMS & Library access unlocked upon completion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Full DRM-free source code repository & Notion workspace</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>30-Day Money-Back Guarantee included</span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 3: POST-PURCHASE ONE-CLICK VIP UPSELL               */}
        {/* ========================================================= */}
        {currentStep === 'upsell' && funnel.upsell && (
          <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
            {/* Urgent Notification Banner */}
            <div className="bg-red-950/80 border border-red-800 p-4 rounded-2xl text-center space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-red-400 bg-red-900/50 px-3 py-1 rounded-full border border-red-700">
                WAIT! Your Order Is Being Processed
              </span>
              <p className="text-xs text-red-200 pt-1">
                Do not refresh or hit the back button. Read below for a 1-time exclusive VIP upgrade offer.
              </p>
            </div>

            {/* Upsell Card */}
            <div className="bg-slate-800/80 border border-slate-700 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl">
              <div className="text-center space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f5c451]/15 text-[#f5c451] border border-[#f5c451]/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  Exclusive 1-Click VIP Upgrade
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                  {funnel.upsell.headline}
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  {funnel.upsell.description}
                </p>
              </div>

              {/* Price comparison */}
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="text-slate-400 line-through text-base">
                  Normally {formatNaira(funnel.upsell.originalPrice || funnel.upsell.price * 2)}
                </div>
                <div className="text-3xl font-black text-[#f5c451]">
                  Just {formatNaira(funnel.upsell.price)}
                </div>
              </div>

              {/* Benefits list */}
              <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-700/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Included in this VIP Upgrade:
                </h4>
                <ul className="space-y-2.5">
                  {funnel.upsell.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleAcceptUpsell}
                  className="w-full py-4 px-6 rounded-xl font-black text-slate-950 bg-[#f5c451] hover:bg-[#ebd56e] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base shadow-xl shadow-[#f5c451]/10 focus:outline-none"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>
                    YES! Upgrade My Order with {funnel.upsell.title} ({formatNaira(funnel.upsell.price)}) →
                  </span>
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleDeclineUpsell}
                    className="text-xs text-slate-400 hover:text-slate-200 underline focus:outline-none transition-colors"
                  >
                    {funnel.upsell.declineText ||
                      "No thanks, I will pass on this one-time discount and understand I won't see this price again."}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 4: ORDER CONFIRMATION & ACCESS PASS                */}
        {/* ========================================================= */}
        {currentStep === 'confirmation' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn text-center">
            {/* Celebration Icon */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-800">
                Enrollment Verified & Active
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Welcome Aboard!
              </h2>
              <p className="text-slate-300 text-sm max-w-md mx-auto">
                Your order is confirmed. Your learning deliverables, source code access, and prompt
                vault privileges are ready.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 text-left space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <span className="text-xs text-slate-400">Order Reference:</span>
                <span className="font-mono text-sm font-bold text-[#f5c451]">
                  {completedOrder?.id || `ORD-FNL-${Date.now().toString(36).toUpperCase()}`}
                </span>
              </div>

              {/* Acquired products */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Acquired Products & Licences:
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <BookOpen className="w-4 h-4 text-[#f5c451]" />
                      <span>{mainProduct.title}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">Full Access</span>
                  </div>

                  {bumpSelected && funnel.orderBump && (
                    <div className="flex items-center justify-between text-sm bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{funnel.orderBump.title}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">Unlocked</span>
                    </div>
                  )}

                  {upsellAccepted && funnel.upsell && (
                    <div className="flex items-center justify-between text-sm bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <span>{funnel.upsell.title}</span>
                      </div>
                      <span className="text-xs font-bold text-purple-400">VIP Commercial</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Paid */}
              <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Total Settled:</span>
                <span className="text-xl font-black text-white">
                  {formatNaira(completedOrder?.total || currentTotals.total)}
                </span>
              </div>
            </div>

            {/* Direct Navigation Pathway Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/library')}
                className="w-full py-4 px-6 rounded-xl font-black text-slate-950 bg-[#f5c451] hover:bg-[#ebd56e] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base shadow-xl shadow-[#f5c451]/10 focus:outline-none"
              >
                <BookOpen className="w-5 h-5" />
                <span>Go to My Learning Library →</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/vault')}
                  className="py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center justify-center gap-2 focus:outline-none"
                >
                  <Sparkles className="w-4 h-4 text-[#f5c451]" />
                  <span>Member Prompt Vault</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center justify-center gap-2 focus:outline-none"
                >
                  <span>Explore Marketplace</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
