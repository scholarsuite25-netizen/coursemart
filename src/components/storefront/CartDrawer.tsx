import { useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Crown,
  KeyRound,
  Landmark,
  MessageCircle,
  Phone,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { LicenseKey, Order, PaymentMethod } from '../../types/marketplace';
import { calculateExtendedCartTotals } from '../../utils/commerce';
import { formatNaira } from '../../utils/currency';
import {
  getPaystackOptionLabel,
  resolvePaystackChannels,
  type PaystackPaymentOptionId,
} from '../../utils/paystack';
import { formatProductTypeLabel, getAccentTheme } from '../../utils/theme';
import {
  TINTOL_PAYMENT_DETAILS,
  buildBankTransferWhatsAppMessage,
  buildCallUrl,
  buildWhatsAppUrl,
} from '../../utils/whatsapp';
import { PaystackChannelPicker } from '../common/PaystackChannelPicker';
import { ProductThumbnail } from '../common/ProductThumbnail';

export function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    products,
    coupons,
    appliedCouponCode,
    setAppliedCouponCode,
    removeFromCart,
    currentUser,
    activeMembershipPlan,
    activeReferralCode,
    quickLoginAsRole,
    completeCheckout,
    verifyPaystackReference,
    publicServerConfig,
    navigate,
    appearance,
    showToast,
  } = useStore();

  const accent = getAccentTheme(appearance.accentTheme);
  const [couponInput, setCouponInput] = useState(appliedCouponCode);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack');
  const [paystackOption, setPaystackOption] = useState<PaystackPaymentOptionId>('all');
  const [transferRef, setTransferRef] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [paystackAuthUrl, setPaystackAuthUrl] = useState<string | null>(null);
  const [isProcessingPaystack, setIsProcessingPaystack] = useState(false);
  const [isVerifyingPaystack, setIsVerifyingPaystack] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<{
    order: Order;
    licenses: LicenseKey[];
  } | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const checkoutInFlightRef = useRef(false);

  if (!isCartOpen) return null;

  const memberDiscountPct = activeMembershipPlan?.storeDiscountPercent ?? 0;
  const totals = calculateExtendedCartTotals(
    cart,
    coupons,
    appliedCouponCode,
    memberDiscountPct,
    0
  );

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedCouponCode(couponInput.trim().toUpperCase());
  };

  const handleCopyGtbAccount = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(TINTOL_PAYMENT_DETAILS.accountNumber).catch(() => {});
    }
    setCopiedAccount(true);
    showToast(`Copied GTB Account ${TINTOL_PAYMENT_DETAILS.accountNumber}`);
    window.setTimeout(() => setCopiedAccount(false), 2000);
  };

  const executeCheckoutForUser = async (overrideUser?: typeof currentUser) => {
    if (checkoutInFlightRef.current) return;
    checkoutInFlightRef.current = true;
    setCheckoutError(null);
    setPaystackAuthUrl(null);
    const activeUser = overrideUser ?? currentUser;
    if (!activeUser) {
      checkoutInFlightRef.current = false;
      setCheckoutError('Sign in to complete checkout, or use Demo Student Checkout below.');
      return;
    }

    let paystackRef = transferRef;
    let paystackVerified = false;

    if ((paymentMethod === 'paystack' || paymentMethod === 'card') && totals.grandTotal > 0) {
      setIsProcessingPaystack(true);
      try {
        const resp = await fetch('/api/paystack/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: activeUser.email,
            amountNgn: totals.grandTotal,
            channels: resolvePaystackChannels(paystackOption),
            reference: `CM-${Date.now()}`,
            callbackUrl: typeof window !== 'undefined' ? window.location.origin + '/library?tab=orders' : undefined,
            metadata: { paystackOption },
          }),
        });
        const data = (await resp.json()) as {
          mode?: string;
          configured?: boolean;
          authorizationUrl?: string;
          reference?: string;
          error?: string;
        };
        if (!resp.ok) {
          setCheckoutError(data.error || 'Paystack initialization failed.');
          setIsProcessingPaystack(false);
          checkoutInFlightRef.current = false;
          return;
        }
        paystackRef = data.reference || paystackRef;
        if (data.configured && data.authorizationUrl) {
          setPaystackAuthUrl(data.authorizationUrl);
        }
      } catch {
        // Safe offline fallback
      } finally {
        setIsProcessingPaystack(false);
      }
    }

    const channelNote =
      paymentMethod !== 'gtb_whatsapp' ? `Paystack (${getPaystackOptionLabel(paystackOption)})` : '';
    const mergedOrderNotes = [orderNotes.trim(), channelNote].filter(Boolean).join(' · ');

    const res = completeCheckout(overrideUser ?? undefined, {
      paymentMethod,
      paymentReference: paystackRef,
      senderName: activeUser.name,
      orderNotes: mergedOrderNotes,
      paystackVerified,
    });
    checkoutInFlightRef.current = false;
    if (!res.ok || !res.order) {
      setCheckoutError(res.error ?? 'Unable to complete checkout.');
      return;
    }
    setCompletedReceipt({
      order: res.order,
      licenses: res.generatedLicenses ?? [],
    });
    setTransferRef('');
    setOrderNotes('');
  };

  const handleCheckout = () => {
    void executeCheckoutForUser(undefined);
  };

  const handleDemoStudentCheckout = () => {
    setCheckoutError(null);
    const demoUser = quickLoginAsRole('customer');
    if (!demoUser) {
      setCheckoutError('Demo student account unavailable.');
      return;
    }
    void executeCheckoutForUser(demoUser);
  };

  const closeDrawer = () => {
    setCompletedReceipt(null);
    setPaystackAuthUrl(null);
    setCheckoutError(null);
    setIsCartOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart and checkout"
    >
      <div className="w-full max-w-md min-w-0 bg-white h-full flex flex-col shadow-2xl overflow-x-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0a192f] text-white border-b-2 border-[#d4af37] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#f5c451]" />
            <h2 className="font-display text-lg font-bold text-white">
              {completedReceipt
                ? completedReceipt.order.status === 'pending'
                  ? paystackAuthUrl
                    ? 'Complete Paystack Settlement'
                    : 'Awaiting GTB Transfer Proof'
                  : 'Order Confirmed'
                : `Shopping Cart (${cart.length})`}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart drawer"
            className="p-1.5 text-slate-300 hover:text-[#f5c451] rounded-md hover:bg-[#112240] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt View After Purchase */}
        {completedReceipt ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {completedReceipt.order.status === 'pending' ? (
              completedReceipt.order.paymentMethod !== 'gtb_whatsapp' ? (
                <div className="p-5 rounded-xl bg-[#0a192f] text-white border-2 border-[#d4af37] space-y-4">
                  <div className="flex items-center gap-2.5 text-[#f5c451] font-bold text-base">
                    <CreditCard className="w-5 h-5 shrink-0" />
                    <span>Order {completedReceipt.order.id} · Paystack Payment Required</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    <strong>Zero Access Without Payment:</strong> Your order is recorded as{' '}
                    <strong className="text-amber-400">Pending Settlement</strong>. Course and product
                    access remains locked until actual payment is completed and verified.
                  </p>
                  {paystackAuthUrl ? (
                    <a
                      href={paystackAuthUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Proceed to Paystack Checkout ({formatNaira(completedReceipt.order.total)})</span>
                    </a>
                  ) : (
                    <div className="p-3 bg-[#112240] border border-[#233554] rounded-md text-xs space-y-1 text-slate-300">
                      <p className="font-semibold text-[#f5c451]">Live Gateway Pending Verification</p>
                      <p>Reference: <code className="font-mono text-white select-all">{completedReceipt.order.paymentReference || 'N/A'}</code></p>
                      <p className="text-[11px] text-slate-400">
                        Once you finish payment on Paystack, click the verification button below or have an Admin confirm in the Admin Console.
                      </p>
                    </div>
                  )}
                  {completedReceipt.order.paymentReference && (
                    <button
                      type="button"
                      disabled={isVerifyingPaystack}
                      onClick={async () => {
                        setIsVerifyingPaystack(true);
                        const check = await verifyPaystackReference(
                          completedReceipt.order.paymentReference!
                        );
                        setIsVerifyingPaystack(false);
                        if (check.verified) {
                          setCompletedReceipt((prev) =>
                            prev ? { ...prev, order: { ...prev.order, status: 'completed' } } : prev
                          );
                          setPaystackAuthUrl(null);
                        } else {
                          showToast(check.message);
                        }
                      }}
                      className="w-full py-2.5 px-4 text-xs font-semibold text-[#f5c451] border border-[#d4af37]/60 rounded-md inline-flex items-center justify-center gap-2 hover:bg-[#112240] cursor-pointer disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isVerifyingPaystack
                          ? 'Checking Paystack Settlement...'
                          : 'I Completed Payment — Verify Now'}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-[#0a192f] text-white border-2 border-[#d4af37] space-y-4">
                  <div className="flex items-center gap-2.5 text-[#f5c451] font-bold text-base">
                    <Clock className="w-5 h-5 shrink-0" />
                    <span>Order {completedReceipt.order.id} · Pending GTB Verification</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    <strong>Safety Verification Rule:</strong> Downloads and courses remain locked
                    until an Admin verifies your GTB transfer of{' '}
                    <strong className="text-[#f5c451] tabular-nums">
                      {formatNaira(completedReceipt.order.total)}
                    </strong>{' '}
                    and clicks Verify GTB & Unlock.
                  </p>

                  <div className="bg-[#112240] border border-[#233554] rounded-lg p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bank</span>
                      <span className="font-bold text-white">
                        {TINTOL_PAYMENT_DETAILS.bankFullName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Account Number</span>
                      <span className="font-mono font-extrabold text-sm text-[#f5c451] select-all">
                        {TINTOL_PAYMENT_DETAILS.accountNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Name</span>
                      <span className="font-bold text-white">
                        {TINTOL_PAYMENT_DETAILS.accountName}
                      </span>
                    </div>
                  </div>

                  <a
                    href={buildWhatsAppUrl(
                      buildBankTransferWhatsAppMessage({
                        orderId: completedReceipt.order.id,
                        customerName: completedReceipt.order.customerName,
                        customerEmail: completedReceipt.order.customerEmail,
                        items: completedReceipt.order.items.map((i) => i.productTitle),
                        total: completedReceipt.order.total,
                        paymentReference: completedReceipt.order.paymentReference,
                      })
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Transfer Receipt on WhatsApp</span>
                  </a>

                  <a
                    href={buildCallUrl()}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-[#f5c451] border border-[#d4af37]/60 rounded-md inline-flex items-center justify-center gap-2 hover:bg-[#112240]"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Payment Desk ({TINTOL_PAYMENT_DETAILS.phoneDisplay})</span>
                  </a>
                </div>
              )
            ) : (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Order {completedReceipt.order.id} Confirmed</span>
                </div>
                <p className="text-sm text-emerald-900">
                  Instant access unlocked for {completedReceipt.order.customerName}. Total paid:{' '}
                  <strong className="tabular-nums">
                    {formatNaira(completedReceipt.order.total)}
                  </strong>
                </p>
              </div>
            )}

            {/* Itemized Receipt Breakdown */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2 text-xs tabular-nums">
              <p className="font-bold text-slate-900">Itemized Receipt Summary</p>
              {completedReceipt.order.items.map((item) => (
                <div key={item.productId} className="flex justify-between text-slate-700">
                  <span className="truncate pr-2">
                    {item.productTitle}
                    {item.variantName ? ` (${item.variantName})` : ''}
                  </span>
                  <span className="font-semibold shrink-0">{formatNaira(item.price)}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatNaira(completedReceipt.order.subtotal)}</span>
              </div>
              {completedReceipt.order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Savings</span>
                  <span>-{formatNaira(completedReceipt.order.discount)}</span>
                </div>
              )}
              {(completedReceipt.order.membershipDiscount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Membership Discount</span>
                  <span>-{formatNaira(completedReceipt.order.membershipDiscount!)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 pt-1">
                <span>Total Charged</span>
                <span>{formatNaira(completedReceipt.order.total)}</span>
              </div>
              {completedReceipt.order.orderNotes && (
                <p className="text-[11px] text-slate-500 pt-1">
                  Note: {completedReceipt.order.orderNotes}
                </p>
              )}
            </div>

            {completedReceipt.licenses.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#5624d0]" />
                  <span>Generated Software License Keys</span>
                </h3>
                {completedReceipt.licenses.map((lic) => (
                  <div
                    key={lic.id}
                    className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-1"
                  >
                    <p className="text-xs font-semibold text-slate-700">
                      {lic.productTitle} · {lic.tierName}
                    </p>
                    <p className="font-mono text-sm font-bold text-slate-900 select-all">
                      {lic.key}
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {lic.maxSeats} activation seat(s) ready
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  navigate('/library');
                }}
                className={`w-full py-3 px-4 text-sm font-bold text-white ${accent.primaryBg} ${accent.primaryHoverBg} rounded-md cursor-pointer`}
              >
                Open My Digital Library
              </button>
              <button
                type="button"
                onClick={closeDrawer}
                className="w-full py-2.5 px-4 text-sm font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-display text-base font-bold text-slate-900">
                    Your cart is empty
                  </p>
                  <p className="text-sm text-slate-500">
                    Explore courses, digital products, and software tools to add items.
                  </p>
                </div>
              ) : (
                cart.map((item) => {
                  const prod = products.find((p) => p.id === item.productId);
                  if (!prod) return null;
                  return (
                    <div
                      key={item.productId}
                      className="flex items-start gap-3.5 pb-4 border-b border-slate-100"
                    >
                      <div className="w-20 h-15 rounded overflow-hidden shrink-0 bg-slate-100">
                        <ProductThumbnail
                          src={prod.thumbnail}
                          alt={prod.title}
                          type={prod.type}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 line-clamp-2">
                          {prod.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatProductTypeLabel(prod.type, prod.digitalSubType)}
                          {item.tierName ? ` · ${item.tierName}` : ''}
                          {item.variantName ? ` · ${item.variantName}` : ''}
                        </p>
                        {item.sku && (
                          <p className="text-[11px] font-mono text-slate-400">SKU: {item.sku}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                            {formatNaira(item.unitPrice)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            aria-label={`Remove ${prod.title} from cart`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-800 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Totals + Coupon + Order Note + Payment Method + Checkout */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3.5 overflow-y-auto max-h-[64vh]">
                {activeMembershipPlan && (
                  <div className="flex items-center justify-between text-xs bg-[#0a192f] text-[#f5c451] px-3 py-2 rounded-md">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <Crown className="w-3.5 h-3.5" />
                      {activeMembershipPlan.name} Store Perk Active
                    </span>
                    <span className="font-bold tabular-nums">
                      -{activeMembershipPlan.storeDiscountPercent}% Auto-Applied
                    </span>
                  </div>
                )}

                {activeReferralCode && (
                  <p className="text-[11px] font-semibold text-emerald-700">
                    Partner Referral Attribution Active: <code className="font-mono">{activeReferralCode}</code>
                  </p>
                )}

                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <label htmlFor="cart-coupon-input" className="text-xs font-bold text-slate-700">
                    Coupon Code (try LEARN20 or WELCOME10)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="cart-coupon-input"
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Enter coupon code"
                        className="w-full h-9 pl-8 pr-3 text-sm font-mono uppercase bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 h-9 text-xs font-bold text-slate-900 border border-slate-900 rounded-md hover:bg-white cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {totals.couponError && (
                    <p className="text-xs font-medium text-rose-700">{totals.couponError}</p>
                  )}
                  {totals.appliedCoupon && (
                    <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                      <span>
                        Coupon {totals.appliedCoupon.code} applied (
                        {totals.appliedCoupon.discountType === 'percent'
                          ? `${totals.appliedCoupon.value}% off`
                          : `${formatNaira(totals.appliedCoupon.value)} off`}
                        )
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCouponInput('');
                          setAppliedCouponCode('');
                        }}
                        className="underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </form>

                {/* Order Notes */}
                <div>
                  <label htmlFor="cart-order-notes" className="block text-xs font-bold text-slate-700 mb-1">
                    Order Notes / Invoice Memo (optional)
                  </label>
                  <input
                    id="cart-order-notes"
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g., Company billing name or team onboarding request"
                    className="w-full h-8 px-3 text-xs bg-white border border-slate-300 rounded-md"
                  />
                </div>

                {/* Payment Method Switcher */}
                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-700">Payment Method</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paystack')}
                      className={`px-3 py-2 rounded-md border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        paymentMethod === 'paystack' || paymentMethod === 'card'
                          ? 'bg-[#0a192f] text-[#f5c451] border-[#0a192f]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Paystack / Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('gtb_whatsapp')}
                      className={`px-3 py-2 rounded-md border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        paymentMethod === 'gtb_whatsapp'
                          ? 'bg-[#0a192f] text-[#f5c451] border-[#0a192f]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Landmark className="w-3.5 h-3.5" />
                      <span>GTB + WhatsApp</span>
                    </button>
                  </div>

                  {(paymentMethod === 'paystack' || paymentMethod === 'card') && (
                    <PaystackChannelPicker
                      selectedOption={paystackOption}
                      onSelect={setPaystackOption}
                      paystackConfigured={publicServerConfig.paystackConfigured}
                    />
                  )}

                  {paymentMethod === 'gtb_whatsapp' && (
                    <div className="bg-[#0a192f] text-white border border-[#d4af37] rounded-lg p-3.5 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between text-[#f5c451] font-bold">
                        <span>GTB Bank Transfer Details</span>
                        <button
                          type="button"
                          onClick={handleCopyGtbAccount}
                          className="inline-flex items-center gap-1 text-[11px] underline cursor-pointer"
                        >
                          {copiedAccount ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedAccount ? 'Copied' : 'Copy Acct'}</span>
                        </button>
                      </div>
                      <div className="space-y-1 text-[11px] bg-[#112240] rounded p-2.5">
                        <p>
                          <span className="text-slate-400">Bank:</span>{' '}
                          <strong>{TINTOL_PAYMENT_DETAILS.bankName}</strong>
                        </p>
                        <p>
                          <span className="text-slate-400">Account No:</span>{' '}
                          <strong className="font-mono text-[#f5c451]">
                            {TINTOL_PAYMENT_DETAILS.accountNumber}
                          </strong>
                        </p>
                        <p>
                          <span className="text-slate-400">Account Name:</span>{' '}
                          <strong>{TINTOL_PAYMENT_DETAILS.accountName}</strong>
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="gtb-transfer-ref"
                          className="block text-[11px] font-semibold text-slate-300 mb-1"
                        >
                          Transfer Reference / Sender Name (optional)
                        </label>
                        <input
                          id="gtb-transfer-ref"
                          type="text"
                          value={transferRef}
                          onChange={(e) => setTransferRef(e.target.value)}
                          placeholder="e.g. GTB-NIP-48921 / Sender Name"
                          className="w-full h-8 px-2.5 text-xs bg-[#112240] border border-[#263d66] rounded text-white placeholder:text-slate-400 focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200 text-sm tabular-nums">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatNaira(totals.subtotal)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Coupon Discount</span>
                      <span>-{formatNaira(totals.discount)}</span>
                    </div>
                  )}
                  {totals.membershipDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Membership Discount ({memberDiscountPct}%)</span>
                      <span>-{formatNaira(totals.membershipDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
                    <span>Total</span>
                    <span>{formatNaira(totals.grandTotal)}</span>
                  </div>
                </div>

                {checkoutError && (
                  <p className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-2.5">
                    {checkoutError}
                  </p>
                )}

                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={isProcessingPaystack}
                    onClick={handleCheckout}
                    className={`w-full py-3 px-4 text-sm font-bold rounded-md transition-colors cursor-pointer disabled:opacity-60 ${
                      paymentMethod === 'gtb_whatsapp'
                        ? 'bg-[#0a192f] hover:bg-[#112240] text-[#f5c451] border border-[#d4af37]'
                        : `text-white ${accent.primaryBg} ${accent.primaryHoverBg}`
                    }`}
                  >
                    {isProcessingPaystack
                      ? 'Connecting Paystack...'
                      : paymentMethod === 'gtb_whatsapp'
                      ? `Place GTB Transfer Order (${formatNaira(totals.grandTotal)})`
                      : `Pay with Paystack (${formatNaira(totals.grandTotal)})`}
                  </button>

                  {!currentUser && (
                    <button
                      type="button"
                      onClick={handleDemoStudentCheckout}
                      className="w-full py-2.5 px-4 text-xs font-bold text-slate-800 border border-slate-300 bg-white rounded-md hover:bg-slate-50 cursor-pointer"
                    >
                      Instant Demo Student Checkout (Alex Rivera)
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
