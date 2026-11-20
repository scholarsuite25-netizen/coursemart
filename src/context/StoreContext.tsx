import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { storageService } from '../services/storageService';
import type {
  AffiliateConversion,
  AffiliatePayoutRequest,
  AffiliateProfile,
  BlogComment,
  BlogPost,
  CartItem,
  Coupon,
  CoursemartEvent,
  CourseProgress,
  EmailBroadcastCampaign,
  EventRegistration,
  LicenseKey,
  MembershipPlan,
  MembershipTierId,
  ModuleQuizResult,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductFilterState,
  ProductReview,
  PublicServerConfig,
  ShowcaseSite,
  SocialPostDraft,
  StorefrontAppearance,
  UserAccount,
  UserMembership,
  UserRole,
  WhatsAppGroup,
} from '../types/marketplace';
import {
  buildPreEventAcknowledgementHtml,
  generateEventConfirmationCode,
  validateEventRegistrationForm,
  type EventRegistrationInput,
} from '../utils/events';
import { resolveInitialOrderStatus } from '../utils/automation';
import {
  AFFILIATE_MIN_PAYOUT_NGN,
  calculateAffiliateCommission,
  calculateAffiliateLedgerSummary,
  calculateExtendedCartTotals,
  extractReferralCodeFromSearch,
  generateCertificateCode,
  generateLicenseKey,
  gradeModuleQuiz,
  isTierSufficient,
  roundCurrency,
  toggleModuleLecturesCompletion,
} from '../utils/commerce';
import { formatNaira } from '../utils/currency';

export interface RouteState {
  path: string;
}

interface StoreContextValue {
  route: string;
  navigate: (path: string) => void;
  products: Product[];
  users: UserAccount[];
  orders: Order[];
  licenses: LicenseKey[];
  coupons: Coupon[];
  reviews: ProductReview[];
  progressList: CourseProgress[];
  appearance: StorefrontAppearance;
  currentUser: UserAccount | null;
  cart: CartItem[];
  wishlist: string[];
  filters: ProductFilterState;
  setFilters: React.Dispatch<React.SetStateAction<ProductFilterState>>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  appliedCouponCode: string;
  setAppliedCouponCode: (code: string) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  publicServerConfig: PublicServerConfig;
  adminSessionVerified: boolean;

  // Auth actions
  loginWithCredentials: (
    email: string,
    password: string,
    requiredRole?: UserRole
  ) => { ok: boolean; error?: string; user?: UserAccount };
  loginAdminWithServer: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; user?: UserAccount }>;
  registerUser: (
    name: string,
    email: string,
    password: string,
    role?: 'customer' | 'instructor',
    newsletterOptIn?: boolean
  ) => { ok: boolean; error?: string; user?: UserAccount };
  updateNewsletterPreference: (optIn: boolean) => void;
  quickLoginAsRole: (role: 'customer' | 'instructor') => UserAccount | null;
  logout: () => void;

  // Cart & Wishlist actions
  addToCart: (product: Product, tierId?: string, variantId?: string) => void;
  addBundleToCart: (bundleProducts: Product[]) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isOwnedByCurrentUser: (productId: string) => boolean;

  // Checkout & E-Commerce
  completeCheckout: (
    overrideUser?: UserAccount,
    options?: {
      paymentMethod?: PaymentMethod;
      paymentReference?: string;
      senderName?: string;
      orderNotes?: string;
      paystackVerified?: boolean;
    }
  ) => {
    ok: boolean;
    order?: Order;
    generatedLicenses?: LicenseKey[];
    error?: string;
  };
  verifyPaystackReference: (reference: string) => Promise<{
    ok: boolean;
    verified: boolean;
    message: string;
  }>;
  recordProductDownload: (orderId: string, productId: string) => { ok: boolean; count: number };
  requestOrderRefund: (orderId: string, reason: string) => void;
  resolveOrderRefund: (orderId: string, decision: 'approved' | 'declined') => void;

  // LMS & Digital Delivery actions
  toggleLectureComplete: (productId: string, lectureId: string) => void;
  toggleModuleComplete: (productId: string, moduleId: string) => void;
  setLastViewedLecture: (productId: string, lectureId: string) => void;
  resetCourseProgress: (productId: string) => void;
  saveLectureNote: (productId: string, lectureId: string, note: string) => void;
  addTimestampedNote: (productId: string, lectureId: string, timeLabel: string, text: string) => void;
  deleteTimestampedNote: (productId: string, lectureId: string, noteId: string) => void;
  submitModuleQuiz: (
    productId: string,
    moduleId: string,
    answersByQuestionId: Record<string, number>
  ) => ModuleQuizResult | null;
  issueCourseCertificate: (productId: string) => string | null;
  addLectureQuestion: (productId: string, lectureId: string, question: string) => void;
  getCourseProgress: (productId: string) => CourseProgress | undefined;
  activateLicenseDomain: (licenseId: string, domain: string) => { ok: boolean; error?: string };
  deactivateLicenseDomain: (licenseId: string, domain: string) => void;
  regenerateLicenseKey: (licenseId: string) => void;
  addProductReview: (productId: string, rating: number, comment: string) => void;

  // Membership System
  membershipPlans: MembershipPlan[];
  userMemberships: UserMembership[];
  activeUserMembership: UserMembership | null;
  activeMembershipPlan: MembershipPlan | null;
  isUnlockedByMembership: (product: Product) => boolean;
  enrollViaMembership: (product: Product) => void;
  subscribeMembership: (
    planId: MembershipTierId,
    billingCycle: 'monthly' | 'annual',
    options?: {
      paymentMethod?: PaymentMethod;
      paymentReference?: string;
      paystackVerified?: boolean;
    }
  ) => { ok: boolean; error?: string; membership?: UserMembership };
  cancelMembership: () => void;
  assignMembershipByAdmin: (
    userId: string,
    planId: MembershipTierId,
    status: UserMembership['status']
  ) => void;
  updateMembershipPlan: (plan: MembershipPlan) => void;

  // Affiliate System
  activeReferralCode: string | null;
  affiliates: AffiliateProfile[];
  affiliateConversions: AffiliateConversion[];
  affiliatePayouts: AffiliatePayoutRequest[];
  currentUserAffiliate: AffiliateProfile | null;
  joinAffiliateProgram: (
    bankDetails: string,
    payoutMethod?: AffiliateProfile['payoutMethod']
  ) => { ok: boolean; error?: string; profile?: AffiliateProfile };
  updateAffiliateSettings: (
    bankDetails: string,
    payoutMethod: AffiliateProfile['payoutMethod']
  ) => void;
  requestAffiliatePayout: (amount: number, bankDetails: string) => { ok: boolean; error?: string };
  updateAffiliateCommissionRate: (affiliateId: string, rate: number) => void;
  updateAffiliateConversionStatus: (
    conversionId: string,
    status: AffiliateConversion['status']
  ) => void;
  updateAffiliatePayoutStatus: (
    payoutId: string,
    status: AffiliatePayoutRequest['status']
  ) => void;

  // Showcase Directory
  showcaseSites: ShowcaseSite[];
  upsertShowcaseSite: (site: ShowcaseSite) => void;
  deleteShowcaseSite: (siteId: string) => void;
  toggleShowcaseSite: (siteId: string) => void;

  // WhatsApp Community Groups
  whatsappGroups: WhatsAppGroup[];
  upsertWhatsAppGroup: (group: WhatsAppGroup) => void;
  deleteWhatsAppGroup: (groupId: string) => void;
  toggleWhatsAppGroupStatus: (groupId: string) => void;
  joinWhatsAppGroup: (groupId: string) => void;

  // Blog CMS & Reader Bookmarks / Comments
  blogPosts: BlogPost[];
  bookmarkedBlogIds: string[];
  toggleBlogBookmark: (postId: string) => void;
  upsertBlogPost: (post: BlogPost) => void;
  deleteBlogPost: (postId: string) => void;
  toggleBlogPostStatus: (postId: string) => void;
  addBlogComment: (postId: string, body: string) => { ok: boolean; error?: string };
  deleteBlogComment: (postId: string, commentId: string) => void;

  // Event Management System
  events: CoursemartEvent[];
  eventRegistrations: EventRegistration[];
  upsertEvent: (event: CoursemartEvent) => void;
  deleteEvent: (eventId: string) => void;
  registerForEvent: (
    eventId: string,
    input: EventRegistrationInput,
    payment?: { paymentStatus: EventRegistration['paymentStatus']; paymentReference?: string }
  ) => Promise<{
    ok: boolean;
    registration?: EventRegistration;
    errors?: Record<string, string>;
    error?: string;
  }>;
  updateEventRegistrationPayment: (
    registrationId: string,
    paymentStatus: EventRegistration['paymentStatus']
  ) => void;
  markEventMaterialsSent: (registrationIds: string[]) => void;

  // Social Queue (Draft + 1-Click Approve & Schedule)
  socialDrafts: SocialPostDraft[];
  addSocialDrafts: (drafts: SocialPostDraft[]) => void;
  updateSocialDraft: (draft: SocialPostDraft) => void;
  approveAndScheduleSocialDraft: (draftId: string, scheduledFor?: string) => void;
  deleteSocialDraft: (draftId: string) => void;

  // Email Broadcast Studio
  emailCampaigns: EmailBroadcastCampaign[];
  addEmailCampaign: (campaign: EmailBroadcastCampaign) => void;

  // Instructor & Admin CRUD actions
  upsertProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  duplicateProduct: (productId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  toggleLicenseStatus: (licenseId: string) => void;
  upsertCoupon: (coupon: Coupon) => void;
  deleteCoupon: (couponId: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  updateAppearance: (appearance: StorefrontAppearance) => void;
  resetDemoDatabase: () => void;
}

const DEFAULT_FILTERS: ProductFilterState = {
  type: 'all',
  category: 'All',
  minRating: 0,
  priceFilter: 'all',
  level: 'all',
  search: '',
  sortBy: 'popular',
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname || '/';
  });

  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [users, setUsers] = useState<UserAccount[]>(() => storageService.getUsers());
  const [orders, setOrders] = useState<Order[]>(() => storageService.getOrders());
  const [licenses, setLicenses] = useState<LicenseKey[]>(() => storageService.getLicenses());
  const [coupons, setCoupons] = useState<Coupon[]>(() => storageService.getCoupons());
  const [reviews, setReviews] = useState<ProductReview[]>(() => storageService.getReviews());
  const [progressList, setProgressList] = useState<CourseProgress[]>(() =>
    storageService.getProgressList()
  );
  const [appearance, setAppearance] = useState<StorefrontAppearance>(() =>
    storageService.getAppearance()
  );
  const [whatsappGroups, setWhatsappGroups] = useState<WhatsAppGroup[]>(() =>
    storageService.getWhatsAppGroups()
  );
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => storageService.getBlogPosts());
  const [blogBookmarksMap, setBlogBookmarksMap] = useState<Record<string, string[]>>(() =>
    storageService.getBlogBookmarksMap()
  );
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>(() =>
    storageService.getMembershipPlans()
  );
  const [userMemberships, setUserMemberships] = useState<UserMembership[]>(() =>
    storageService.getUserMemberships()
  );
  const [affiliates, setAffiliates] = useState<AffiliateProfile[]>(() =>
    storageService.getAffiliates()
  );
  const [affiliateConversions, setAffiliateConversions] = useState<AffiliateConversion[]>(() =>
    storageService.getAffiliateConversions()
  );
  const [affiliatePayouts, setAffiliatePayouts] = useState<AffiliatePayoutRequest[]>(() =>
    storageService.getAffiliatePayouts()
  );
  const [showcaseSites, setShowcaseSites] = useState<ShowcaseSite[]>(() =>
    storageService.getShowcaseSites()
  );
  const [events, setEvents] = useState<CoursemartEvent[]>(() => storageService.getEvents());
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>(() =>
    storageService.getEventRegistrations()
  );
  const [socialDrafts, setSocialDrafts] = useState<SocialPostDraft[]>(() =>
    storageService.getSocialDrafts()
  );
  const [emailCampaigns, setEmailCampaigns] = useState<EmailBroadcastCampaign[]>(() =>
    storageService.getEmailCampaigns()
  );
  const [publicServerConfig, setPublicServerConfig] = useState<PublicServerConfig>({
    supabaseConfigured: false,
    paystackConfigured: false,
    paystackPublicKey: null,
    emailProvider: 'none',
    emailProvidersConfigured: [],
    hasGeminiKey: false,
  });
  const [activeReferralCode, setActiveReferralCode] = useState<string | null>(() =>
    storageService.getActiveReferralCode()
  );
  const [cart, setCart] = useState<CartItem[]>(() => storageService.getCart());
  const [wishlist, setWishlist] = useState<string[]>(() => storageService.getWishlist());
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    storageService.getCurrentUserId()
  );
  const [adminSessionVerified, setAdminSessionVerified] = useState(false);
  const [filters, setFilters] = useState<ProductFilterState>(DEFAULT_FILTERS);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const onPopState = () => {
      setRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Capture ?ref=CODE affiliate referral attribution once per session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const refCode = extractReferralCodeFromSearch(window.location.search);
    if (!refCode) return;
    const matched = affiliates.find((a) => a.active && a.code.toUpperCase() === refCode);
    if (matched) {
      setActiveReferralCode(matched.code);
      storageService.setActiveReferralCode(matched.code);
      const clickKey = `cm_ref_clicked_${matched.code}`;
      if (!window.sessionStorage.getItem(clickKey)) {
        window.sessionStorage.setItem(clickKey, '1');
        setAffiliates((prev) =>
          prev.map((a) => (a.id === matched.id ? { ...a, clicks: a.clicks + 1 } : a))
        );
      }
    }
  }, []);

  const navigate = useCallback((path: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setRoute(path);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId]
  );

  // Fetch runtime server capabilities & validate admin session cookie
  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetch('/api/config/public')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PublicServerConfig | null) => {
        if (data) setPublicServerConfig(data);
      })
      .catch(() => {});

    fetch('/api/auth/admin/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((session: { authenticated?: boolean; role?: string; email?: string } | null) => {
        const verified = Boolean(session?.authenticated && session.role === 'admin');
        setAdminSessionVerified(verified);
        if (verified && session?.email) {
          const verifiedEmail = session.email.trim().toLowerCase();
          setUsers((prev) =>
            prev.map((u) =>
              u.id === 'user-admin-1' || u.role === 'admin'
                ? { ...u, email: verifiedEmail, password: '' }
                : u
            )
          );
        }
        if (!verified) {
          setCurrentUserId((prevId) => {
            const matched = users.find((u) => u.id === prevId);
            return matched?.role === 'admin' ? null : prevId;
          });
        }
      })
      .catch(() => setAdminSessionVerified(false));
  }, []);

  const applyVerifiedPaystackReference = useCallback((verifiedRef: string) => {
    let matchedOrder: Order | undefined;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.paymentReference === verifiedRef && o.status === 'pending') {
          matchedOrder = o;
          return { ...o, status: 'completed' };
        }
        return o;
      })
    );
    if (matchedOrder) {
      const completedOrder = matchedOrder;
      const nowIso = new Date().toISOString();
      const newLicenses: LicenseKey[] = [];
      completedOrder.items.forEach((item, idx) => {
        if (item.productType === 'software') {
          newLicenses.push({
            id: `lic-${Date.now()}-${idx}`,
            key: generateLicenseKey('CM', `${completedOrder.id}-${item.productId}-${Date.now()}`),
            productId: item.productId,
            productTitle: item.productTitle,
            userId: completedOrder.userId,
            orderId: completedOrder.id,
            tierName: item.tierName ?? 'Personal Solo License',
            maxSeats: item.seats ?? 1,
            activatedDomains: [],
            status: 'active',
            createdAt: nowIso,
          });
        }
      });
      if (newLicenses.length > 0) {
        setLicenses((prev) => [
          ...newLicenses.filter(
            (nl) => !prev.some((el) => el.orderId === nl.orderId && el.productId === nl.productId)
          ),
          ...prev,
        ]);
      }
      setProducts((prev) =>
        prev.map((p) =>
          completedOrder.items.some((i) => i.productId === p.id)
            ? { ...p, studentsCount: p.studentsCount + 1 }
            : p
        )
      );
      setAffiliateConversions((prev) =>
        prev.map((c) =>
          c.orderId === completedOrder.id && c.status === 'pending'
            ? { ...c, status: 'approved' }
            : c
        )
      );
    }
    setEventRegistrations((prev) =>
      prev.map((reg) =>
        reg.paymentReference === verifiedRef && reg.paymentStatus === 'pending_paystack'
          ? { ...reg, paymentStatus: 'paid_paystack' }
          : reg
      )
    );
    setUserMemberships((prev) =>
      prev.map((m) =>
        m.paymentReference === verifiedRef && m.status === 'pending'
          ? { ...m, status: 'active' }
          : m
      )
    );
    setToastMessage(`Paystack payment ${verifiedRef} verified & access unlocked!`);
  }, []);

  const verifyPaystackReference = useCallback(
    async (reference: string) => {
      const cleanRef = reference.trim();
      if (!cleanRef) {
        return { ok: false, verified: false, message: 'Missing Paystack transaction reference.' };
      }
      try {
        const resp = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: cleanRef }),
        });
        const data = (await resp.json()) as {
          verified?: boolean;
          reference?: string;
          message?: string;
          error?: string;
        };
        if (!resp.ok) {
          return {
            ok: false,
            verified: false,
            message: data.error || 'Could not reach Paystack verification endpoint.',
          };
        }
        if (data.verified) {
          applyVerifiedPaystackReference(data.reference || cleanRef);
          return {
            ok: true,
            verified: true,
            message: data.message || 'Verified via Paystack API',
          };
        }
        return {
          ok: true,
          verified: false,
          message: data.message || 'Payment not yet confirmed on Paystack.',
        };
      } catch {
        return { ok: false, verified: false, message: 'Network error while verifying Paystack payment.' };
      }
    },
    [applyVerifiedPaystackReference]
  );

  // Auto-verify returning Paystack redirect (?reference=... or ?trxref=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = (params.get('reference') || params.get('trxref') || '').trim();
    if (!ref) return;

    verifyPaystackReference(ref).then((result) => {
      if (result.verified) {
        params.delete('reference');
        params.delete('trxref');
        const nextQuery = params.toString();
        const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`;
        window.history.replaceState({}, '', nextUrl);
      }
    });
  }, [verifyPaystackReference]);

  // Sync persistence
  useEffect(() => storageService.saveProducts(products), [products]);
  useEffect(() => storageService.saveUsers(users), [users]);
  useEffect(() => storageService.saveOrders(orders), [orders]);
  useEffect(() => storageService.saveLicenses(licenses), [licenses]);
  useEffect(() => storageService.saveCoupons(coupons), [coupons]);
  useEffect(() => storageService.saveReviews(reviews), [reviews]);
  useEffect(() => storageService.saveProgressList(progressList), [progressList]);
  useEffect(() => storageService.saveAppearance(appearance), [appearance]);
  useEffect(() => storageService.saveWhatsAppGroups(whatsappGroups), [whatsappGroups]);
  useEffect(() => storageService.saveBlogPosts(blogPosts), [blogPosts]);
  useEffect(() => storageService.saveBlogBookmarksMap(blogBookmarksMap), [blogBookmarksMap]);
  useEffect(() => storageService.saveMembershipPlans(membershipPlans), [membershipPlans]);
  useEffect(() => storageService.saveUserMemberships(userMemberships), [userMemberships]);
  useEffect(() => storageService.saveAffiliates(affiliates), [affiliates]);
  useEffect(
    () => storageService.saveAffiliateConversions(affiliateConversions),
    [affiliateConversions]
  );
  useEffect(() => storageService.saveAffiliatePayouts(affiliatePayouts), [affiliatePayouts]);
  useEffect(() => storageService.saveShowcaseSites(showcaseSites), [showcaseSites]);
  useEffect(() => {
    storageService.saveEvents(events);
    if (typeof window !== 'undefined' && adminSessionVerified) {
      fetch('/api/store/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: events }),
      }).catch(() => {});
    }
  }, [events, adminSessionVerified]);
  useEffect(() => {
    storageService.saveEventRegistrations(eventRegistrations);
    if (typeof window !== 'undefined') {
      fetch('/api/store/event_registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: eventRegistrations }),
      }).catch(() => {});
    }
  }, [eventRegistrations]);
  useEffect(() => {
    storageService.saveSocialDrafts(socialDrafts);
    if (typeof window !== 'undefined' && adminSessionVerified) {
      fetch('/api/store/social_drafts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: socialDrafts }),
      }).catch(() => {});
    }
  }, [socialDrafts, adminSessionVerified]);
  useEffect(() => {
    storageService.saveEmailCampaigns(emailCampaigns);
    if (typeof window !== 'undefined' && adminSessionVerified) {
      fetch('/api/store/email_campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: emailCampaigns }),
      }).catch(() => {});
    }
  }, [emailCampaigns, adminSessionVerified]);
  useEffect(() => storageService.setActiveReferralCode(activeReferralCode), [activeReferralCode]);
  useEffect(() => storageService.saveCart(cart), [cart]);
  useEffect(() => storageService.saveWishlist(wishlist), [wishlist]);
  useEffect(() => storageService.setCurrentUserId(currentUserId), [currentUserId]);

  const activeUserMembership = useMemo(() => {
    if (!currentUser) return null;
    return (
      userMemberships.find(
        (m) => m.userId === currentUser.id && m.status === 'active'
      ) ?? null
    );
  }, [currentUser, userMemberships]);

  const activeMembershipPlan = useMemo(() => {
    if (!activeUserMembership) return null;
    return membershipPlans.find((p) => p.id === activeUserMembership.planId) ?? null;
  }, [activeUserMembership, membershipPlans]);

  const isUnlockedByMembership = useCallback(
    (product: Product) => {
      if (!activeUserMembership || !product.includedInMembershipTier) return false;
      return isTierSufficient(activeUserMembership.planId, product.includedInMembershipTier);
    },
    [activeUserMembership]
  );

  const loginWithCredentials = useCallback(
    (email: string, password: string, requiredRole?: UserRole) => {
      const normalizedEmail = email.trim().toLowerCase();
      const found = users.find(
        (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
      );
      if (!found) {
        return { ok: false, error: 'Invalid email or password.' };
      }
      if (requiredRole && found.role !== requiredRole) {
        return {
          ok: false,
          error: `This portal requires ${requiredRole} privileges. Use the Super Admin account.`,
        };
      }
      setCurrentUserId(found.id);
      showToast(`Signed in as ${found.name}`);
      return { ok: true, user: found };
    },
    [users, showToast]
  );

  const registerUser = useCallback(
    (
      name: string,
      email: string,
      password: string,
      role: UserRole = 'customer',
      newsletterOptIn: boolean = false
    ) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        return { ok: false, error: 'An account with this email already exists.' };
      }
      const nowIso = new Date().toISOString();
      const newUser: UserAccount = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        password,
        role,
        title: role === 'instructor' ? 'Independent Instructor' : 'Verified Learner',
        newsletterOptIn,
        newsletterOptedInAt: newsletterOptIn ? nowIso : undefined,
        joinedAt: nowIso,
      };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUserId(newUser.id);
      showToast(
        newsletterOptIn
          ? `Welcome ${newUser.name}! Account created & newsletter subscribed.`
          : `Welcome to ${appearance.brandName}, ${newUser.name}`
      );
      return { ok: true, user: newUser };
    },
    [users, appearance.brandName, showToast]
  );

  const updateNewsletterPreference = useCallback(
    (optIn: boolean) => {
      if (!currentUser) return;
      const nowIso = new Date().toISOString();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                newsletterOptIn: optIn,
                newsletterOptedInAt: optIn ? nowIso : undefined,
              }
            : u
        )
      );
      showToast(
        optIn
          ? 'Subscribed to Coursemart weekly updates & event invites'
          : 'Unsubscribed from marketing emails'
      );
    },
    [currentUser, showToast]
  );

  const loginAdminWithServer = useCallback(
    async (email: string, password: string) => {
      try {
        const resp = await fetch('/api/auth/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = (await resp.json()) as {
          ok?: boolean;
          email?: string;
          error?: string;
        };
        if (!resp.ok || !data.ok) {
          setAdminSessionVerified(false);
          return {
            ok: false,
            error: data.error || 'Administrator authentication failed.',
          };
        }
        const normalized = (data.email || email).trim().toLowerCase();
        let adminAccount = users.find((u) => u.role === 'admin' && u.email.toLowerCase() === normalized);
        if (!adminAccount) {
          const existingAdmin = users.find((u) => u.role === 'admin');
          if (existingAdmin) {
            adminAccount = { ...existingAdmin, email: normalized, password: '' };
            setUsers((prev) =>
              prev.map((u) => (u.id === existingAdmin.id ? adminAccount! : u))
            );
          } else {
            adminAccount = {
              id: 'user-admin-1',
              name: 'Platform Administrator',
              email: normalized,
              password: '',
              role: 'admin',
              title: 'Platform Operations Director',
              joinedAt: new Date().toISOString(),
            };
            setUsers((prev) => [adminAccount!, ...prev]);
          }
        }
        setAdminSessionVerified(true);
        setCurrentUserId(adminAccount.id);
        showToast(`Verified admin session for ${normalized}`);
        return { ok: true, user: adminAccount };
      } catch {
        return {
          ok: false,
          error: 'Could not reach server admin authentication endpoint.',
        };
      }
    },
    [users, showToast]
  );

  const quickLoginAsRole = useCallback(
    (role: 'customer' | 'instructor') => {
      if (role !== 'customer' && role !== 'instructor') {
        return null;
      }
      const target = users.find((u) => u.role === role) ?? null;
      if (target) {
        setCurrentUserId(target.id);
        showToast(`Preview account switched to ${target.name} (${role})`);
      }
      return target;
    },
    [users, showToast]
  );

  const logout = useCallback(() => {
    setCurrentUserId(null);
    setAdminSessionVerified(false);
    if (typeof window !== 'undefined') {
      fetch('/api/auth/admin/logout', { method: 'POST' }).catch(() => {});
    }
    showToast('Signed out');
    if (route.startsWith('/admin') || route.startsWith('/instructor') || route.startsWith('/learn')) {
      navigate('/');
    }
  }, [route, navigate, showToast]);

  const isOwnedByCurrentUser = useCallback(
    (productId: string) => {
      if (!currentUser) return false;
      const purchased = orders.some(
        (order) =>
          order.userId === currentUser.id &&
          order.status === 'completed' &&
          order.items.some((item) => item.productId === productId)
      );
      if (purchased) return true;
      const product = products.find((p) => p.id === productId);
      if (product && isUnlockedByMembership(product)) {
        return true;
      }
      return false;
    },
    [currentUser, orders, products, isUnlockedByMembership]
  );

  const enrollViaMembership = useCallback(
    (product: Product) => {
      if (!currentUser) {
        showToast('Sign in to enroll with your membership');
        navigate('/login');
        return;
      }
      if (!isUnlockedByMembership(product)) {
        showToast('Upgrade your membership tier to unlock this item');
        navigate('/membership');
        return;
      }
      const alreadyOrdered = orders.some(
        (o) =>
          o.userId === currentUser.id &&
          o.status === 'completed' &&
          o.items.some((i) => i.productId === product.id)
      );
      if (!alreadyOrdered) {
        const orderId = `MEM-${Math.floor(1050 + Math.random() * 8900)}`;
        const nowIso = new Date().toISOString();
        const memOrder: Order = {
          id: orderId,
          userId: currentUser.id,
          customerName: currentUser.name,
          customerEmail: currentUser.email,
          items: [
            {
              productId: product.id,
              productTitle: product.title,
              productType: product.type,
              price: 0,
              tierName: `${activeMembershipPlan?.name ?? 'Member'} Pass`,
            },
          ],
          subtotal: 0,
          discount: 0,
          total: 0,
          status: 'completed',
          paymentMethod: 'card',
          orderNotes: `Unlocked via ${activeMembershipPlan?.name ?? 'Membership'} Pass`,
          createdAt: nowIso,
        };
        setOrders((prev) => [memOrder, ...prev]);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, studentsCount: p.studentsCount + 1 } : p
          )
        );
      }
      showToast(`Unlocked "${product.title}" via Membership`);
      if (product.type === 'course') {
        navigate(`/learn/${product.id}`);
      } else {
        navigate('/library');
      }
    },
    [currentUser, isUnlockedByMembership, orders, activeMembershipPlan, navigate, showToast]
  );

  const addToCart = useCallback(
    (product: Product, tierId?: string, variantId?: string) => {
      let unitPrice = product.price;
      let tierName: string | undefined;
      let seats: number | undefined;
      let variantName: string | undefined;
      let sku: string | undefined;

      if (product.type === 'software' && product.softwareData?.licenseTiers.length) {
        const chosenTier =
          product.softwareData.licenseTiers.find((t) => t.id === tierId) ??
          product.softwareData.licenseTiers[0];
        unitPrice = roundCurrency(product.price * chosenTier.priceMultiplier);
        tierName = chosenTier.name;
        seats = chosenTier.seats;
      } else if (product.variants?.length) {
        const chosenVar =
          product.variants.find((v) => v.id === variantId) ?? product.variants[0];
        unitPrice = roundCurrency(product.price + chosenVar.priceDelta);
        variantName = chosenVar.name;
        sku = chosenVar.sku;
      }

      setCart((prev) => {
        const exists = prev.find((item) => item.productId === product.id);
        if (exists) {
          return prev.map((item) =>
            item.productId === product.id
              ? { ...item, tierId, tierName, seats, variantId, variantName, sku, unitPrice }
              : item
          );
        }
        return [
          ...prev,
          { productId: product.id, tierId, tierName, seats, variantId, variantName, sku, unitPrice },
        ];
      });
      setIsCartOpen(true);
      showToast(`Added "${product.title}" to cart`);
    },
    [showToast]
  );

  const addBundleToCart = useCallback(
    (bundleProducts: Product[]) => {
      if (bundleProducts.length === 0) return;
      setCart((prev) => {
        const next = [...prev];
        for (const p of bundleProducts) {
          const discounted = roundCurrency(p.price * 0.85);
          if (!next.some((i) => i.productId === p.id)) {
            next.push({
              productId: p.id,
              variantName: 'Bundle Edition (15% Off)',
              unitPrice: discounted,
            });
          }
        }
        return next;
      });
      setIsCartOpen(true);
      showToast(`Added ${bundleProducts.length}-item Bundle (15% bundle savings)`);
    },
    [showToast]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCouponCode('');
  }, []);

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlist((prev) => {
        const has = prev.includes(productId);
        showToast(has ? 'Removed from wishlist' : 'Saved to wishlist');
        return has ? prev.filter((id) => id !== productId) : [...prev, productId];
      });
    },
    [showToast]
  );

  const completeCheckout = useCallback(
    (
      overrideUser?: UserAccount,
      options?: {
        paymentMethod?: PaymentMethod;
        paymentReference?: string;
        senderName?: string;
        orderNotes?: string;
        paystackVerified?: boolean;
      }
    ) => {
      const activeUser = overrideUser ?? currentUser;
      if (!activeUser) {
        return { ok: false, error: 'Please sign in to complete your purchase.' };
      }
      if (cart.length === 0) {
        return { ok: false, error: 'Your cart is empty.' };
      }

      const incomingRef = options?.paymentReference?.trim();
      if (incomingRef && orders.some((o) => o.paymentReference === incomingRef)) {
        return {
          ok: false,
          error: `Duplicate submission blocked: reference ${incomingRef} has already been recorded.`,
        };
      }

      const paymentMethod: PaymentMethod = options?.paymentMethod ?? 'paystack';
      const orderStatus = resolveInitialOrderStatus(
        paymentMethod,
        options?.paystackVerified === true
      );
      const isPendingTransfer = orderStatus === 'pending';

      const userMem = userMemberships.find(
        (m) => m.userId === activeUser.id && m.status === 'active'
      );
      const memPlan = userMem ? membershipPlans.find((p) => p.id === userMem.planId) : null;
      const memberDiscountPct = memPlan?.storeDiscountPercent ?? 0;

      const totals = calculateExtendedCartTotals(
        cart,
        coupons,
        appliedCouponCode,
        memberDiscountPct,
        0
      );
      const orderId = `ORD-${Math.floor(1050 + Math.random() * 8900)}`;
      const nowIso = new Date().toISOString();

      const orderItems = cart
        .map((cartItem) => {
          const product = products.find((p) => p.id === cartItem.productId);
          if (!product) return null;
          return {
            productId: product.id,
            productTitle: product.title,
            productType: product.type,
            price: cartItem.unitPrice,
            tierName: cartItem.tierName,
            seats: cartItem.seats,
            variantName: cartItem.variantName,
            sku: cartItem.sku,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      const newOrder: Order = {
        id: orderId,
        userId: activeUser.id,
        customerName: activeUser.name,
        customerEmail: activeUser.email,
        items: orderItems,
        subtotal: totals.subtotal,
        discount: totals.discount,
        membershipDiscount: totals.membershipDiscount,
        taxAmount: totals.taxAmount,
        couponCode: totals.appliedCoupon?.code,
        total: totals.grandTotal,
        status: orderStatus,
        paymentMethod,
        paymentReference: options?.paymentReference?.trim() || undefined,
        senderName: options?.senderName?.trim() || undefined,
        orderNotes: options?.orderNotes?.trim() || undefined,
        affiliateCode: activeReferralCode ?? undefined,
        refundStatus: 'none',
        downloadCounts: {},
        createdAt: nowIso,
      };

      const generatedLicenses: LicenseKey[] = [];
      if (!isPendingTransfer) {
        orderItems.forEach((item, idx) => {
          if (item.productType === 'software') {
            generatedLicenses.push({
              id: `lic-${Date.now()}-${idx}`,
              key: generateLicenseKey('CM', `${orderId}-${item.productId}-${Date.now()}`),
              productId: item.productId,
              productTitle: item.productTitle,
              userId: activeUser.id,
              orderId,
              tierName: item.tierName ?? 'Personal Solo License',
              maxSeats: item.seats ?? 1,
              activatedDomains: [],
              status: 'active',
              createdAt: nowIso,
            });
          }
        });
      }

      // Attribute affiliate commission if referred (and not self-referral)
      if (activeReferralCode && totals.grandTotal > 0) {
        const aff = affiliates.find(
          (a) => a.active && a.code === activeReferralCode && a.userId !== activeUser.id
        );
        if (aff) {
          const commissionAmount = calculateAffiliateCommission(
            totals.grandTotal,
            aff.commissionRate
          );
          const conv: AffiliateConversion = {
            id: `aconv-${Date.now()}`,
            affiliateCode: aff.code,
            affiliateUserId: aff.userId,
            orderId,
            buyerName: activeUser.name,
            orderTotal: totals.grandTotal,
            commissionAmount,
            status: isPendingTransfer ? 'pending' : 'approved',
            createdAt: nowIso,
          };
          setAffiliateConversions((prev) => [conv, ...prev]);
        }
      }

      setOrders((prev) => [newOrder, ...prev]);
      if (generatedLicenses.length > 0) {
        setLicenses((prev) => [...generatedLicenses, ...prev]);
      }
      if (totals.appliedCoupon) {
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === totals.appliedCoupon!.id ? { ...c, usageCount: c.usageCount + 1 } : c
          )
        );
      }
      if (!isPendingTransfer) {
        setProducts((prev) =>
          prev.map((p) =>
            orderItems.some((i) => i.productId === p.id)
              ? { ...p, studentsCount: p.studentsCount + 1 }
              : p
          )
        );
      }
      setCart([]);
      setAppliedCouponCode('');
      showToast(
        isPendingTransfer
          ? `Order ${orderId} created — send GTB transfer proof on WhatsApp`
          : `Order ${orderId} completed!`
      );
      return { ok: true, order: newOrder, generatedLicenses };
    },
    [
      currentUser,
      cart,
      orders,
      coupons,
      appliedCouponCode,
      products,
      userMemberships,
      membershipPlans,
      activeReferralCode,
      affiliates,
      showToast,
    ]
  );

  const recordProductDownload = useCallback(
    (orderId: string, productId: string) => {
      const targetOrder = orders.find((o) => o.id === orderId);
      const product = products.find((p) => p.id === productId);
      const limit = product?.downloadLimit ?? 25;
      const currentCount = targetOrder?.downloadCounts?.[productId] ?? 0;
      if (currentCount >= limit) {
        showToast(`Download limit (${limit}) reached for this edition`);
        return { ok: false, count: currentCount };
      }
      const nextCount = currentCount + 1;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                downloadCounts: { ...(o.downloadCounts ?? {}), [productId]: nextCount },
              }
            : o
        )
      );
      return { ok: true, count: nextCount };
    },
    [orders, products, showToast]
  );

  const requestOrderRefund = useCallback(
    (orderId: string, reason: string) => {
      if (!reason.trim()) return;
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder) return;
      if (targetOrder.refundStatus && targetOrder.refundStatus !== 'none') {
        showToast(`A refund request already exists for ${orderId}`);
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, refundStatus: 'requested', refundReason: reason.trim() }
            : o
        )
      );
      showToast(`Refund request submitted for ${orderId}`);
    },
    [orders, showToast]
  );

  const resolveOrderRefund = useCallback(
    (orderId: string, decision: 'approved' | 'declined') => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                refundStatus: decision,
                status: decision === 'approved' ? 'refunded' : o.status,
              }
            : o
        )
      );
      if (decision === 'approved') {
        // Revoke any software license keys & un-paid affiliate commissions linked to the refunded order
        setLicenses((prev) =>
          prev.map((lic) => (lic.orderId === orderId ? { ...lic, status: 'revoked' } : lic))
        );
        setAffiliateConversions((prev) =>
          prev.map((conv) =>
            conv.orderId === orderId && conv.status !== 'paid'
              ? { ...conv, status: 'declined' }
              : conv
          )
        );
      }
      showToast(
        decision === 'approved'
          ? `Refund approved for ${orderId} — associated licenses revoked`
          : `Refund request declined for ${orderId}`
      );
    },
    [showToast]
  );

  const getCourseProgress = useCallback(
    (productId: string) => {
      if (!currentUser) return undefined;
      return progressList.find(
        (p) => p.userId === currentUser.id && p.productId === productId
      );
    },
    [currentUser, progressList]
  );

  const toggleLectureComplete = useCallback(
    (productId: string, lectureId: string) => {
      if (!currentUser) return;
      setProgressList((prev) => {
        const existing = prev.find(
          (p) => p.userId === currentUser.id && p.productId === productId
        );
        const now = new Date().toISOString();
        if (!existing) {
          return [
            ...prev,
            {
              userId: currentUser.id,
              productId,
              completedLectureIds: [lectureId],
              lastLectureId: lectureId,
              notesByLecture: {},
              questions: [],
              updatedAt: now,
            },
          ];
        }
        const exists = existing.completedLectureIds.includes(lectureId);
        const updatedIds = exists
          ? existing.completedLectureIds.filter((id) => id !== lectureId)
          : [...existing.completedLectureIds, lectureId];
        return prev.map((p) =>
          p.userId === currentUser.id && p.productId === productId
            ? { ...p, completedLectureIds: updatedIds, lastLectureId: lectureId, updatedAt: now }
            : p
        );
      });
    },
    [currentUser]
  );

  const toggleModuleComplete = useCallback(
    (productId: string, moduleId: string) => {
      if (!currentUser) return;
      const product = products.find((p) => p.id === productId);
      const targetModule = product?.courseData?.modules.find((m) => m.id === moduleId);
      if (!targetModule) return;

      let markedComplete = false;
      setProgressList((prev) => {
        const existing = prev.find(
          (p) => p.userId === currentUser.id && p.productId === productId
        );
        const now = new Date().toISOString();
        const currentIds = existing?.completedLectureIds ?? [];
        const updatedIds = toggleModuleLecturesCompletion(targetModule, currentIds);
        markedComplete = updatedIds.length > currentIds.length;

        if (!existing) {
          return [
            ...prev,
            {
              userId: currentUser.id,
              productId,
              completedLectureIds: updatedIds,
              lastLectureId: targetModule.lectures[0]?.id,
              notesByLecture: {},
              questions: [],
              updatedAt: now,
            },
          ];
        }

        return prev.map((p) =>
          p.userId === currentUser.id && p.productId === productId
            ? { ...p, completedLectureIds: updatedIds, updatedAt: now }
            : p
        );
      });
      showToast(
        markedComplete
          ? `Marked "${targetModule.title}" complete`
          : `Unmarked "${targetModule.title}"`
      );
    },
    [currentUser, products, showToast]
  );

  const setLastViewedLecture = useCallback(
    (productId: string, lectureId: string) => {
      if (!currentUser) return;
      setProgressList((prev) => {
        const existing = prev.find(
          (p) => p.userId === currentUser.id && p.productId === productId
        );
        const now = new Date().toISOString();
        if (!existing) {
          return [
            ...prev,
            {
              userId: currentUser.id,
              productId,
              completedLectureIds: [],
              lastLectureId: lectureId,
              notesByLecture: {},
              questions: [],
              updatedAt: now,
            },
          ];
        }
        if (existing.lastLectureId === lectureId) return prev;
        return prev.map((p) =>
          p.userId === currentUser.id && p.productId === productId
            ? { ...p, lastLectureId: lectureId, updatedAt: now }
            : p
        );
      });
    },
    [currentUser]
  );

  const resetCourseProgress = useCallback(
    (productId: string) => {
      if (!currentUser) return;
      setProgressList((prev) =>
        prev.map((p) =>
          p.userId === currentUser.id && p.productId === productId
            ? {
                ...p,
                completedLectureIds: [],
                quizScoresByModule: {},
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );
      showToast('Course completion progress reset');
    },
    [currentUser, showToast]
  );

  const saveLectureNote = useCallback(
    (productId: string, lectureId: string, note: string) => {
      if (!currentUser) return;
      setProgressList((prev) => {
        const existing = prev.find(
          (p) => p.userId === currentUser.id && p.productId === productId
        );
        const now = new Date().toISOString();
        if (!existing) {
          return [
            ...prev,
            {
              userId: currentUser.id,
              productId,
              completedLectureIds: [],
              lastLectureId: lectureId,
              notesByLecture: { [lectureId]: note },
              questions: [],
              updatedAt: now,
            },
          ];
        }
        return prev.map((p) =>
          p.userId === currentUser.id && p.productId === productId
            ? {
                ...p,
                notesByLecture: { ...p.notesByLecture, [lectureId]: note },
                updatedAt: now,
              }
            : p
        );
      });
      showToast('Lecture note saved');
    },
    [currentUser, showToast]
  );

  const addTimestampedNote = useCallback(
    (productId: string, lectureId: string, timeLabel: string, text: string) => {
      if (!currentUser || !text.trim()) return;
      const newNote = {
        id: `tn-${Date.now()}`,
        timeLabel,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      setProgressList((prev) => {
        const existing = prev.find(
          (p) => p.userId === currentUser.id && p.productId === productId
        );
        const now = new Date().toISOString();
        if (!existing) {
          return [
            ...prev,
            {
              userId: currentUser.id,
              productId,
              completedLectureIds: [],
              lastLectureId: lectureId,
              notesByLecture: {},
              timestampedNotesByLecture: { [lectureId]: [newNote] },
              questions: [],
              updatedAt: now,
            },
          ];
        }
        const curr = existing.timestampedNotesByLecture?.[lectureId] ?? [];
        return prev.map((p) =>
          p.userId === currentUser.id && p.productId === productId
            ? {
                ...p,
                timestampedNotesByLecture: {
                  ...(p.timestampedNotesByLecture ?? {}),
                  [lectureId]: [newNote, ...curr],
                },
                updatedAt: now,
              }
            : p
        );
      });
      showToast(`Pinned note at ${timeLabel}`);
    },
    [currentUser, showToast]
  );

  const deleteTimestampedNote = useCallback(
    (productId: string, lectureId: string, noteId: string) => {
      if (!currentUser) return;
      setProgressList((prev) =>
        prev.map((p) => {
          if (p.userId !== currentUser.id || p.productId !== productId) return p;
          const curr = p.timestampedNotesByLecture?.[lectureId] ?? [];
          return {
            ...p,
            timestampedNotesByLecture: {
              ...(p.timestampedNotesByLecture ?? {}),
              [lectureId]: curr.filter((n) => n.id !== noteId),
            },
          };
        })
      );
    },
    [currentUser]
  );

  const submitModuleQuiz = useCallback(
    (productId: string, moduleId: string, answersByQuestionId: Record<string, number>) => {
      if (!currentUser) return null;
      const product = products.find((p) => p.id === productId);
      const targetMod = product?.courseData?.modules.find((m) => m.id === moduleId);
      if (!targetMod?.quiz) return null;

      const graded = gradeModuleQuiz(
        targetMod.quiz.questions,
        answersByQuestionId,
        targetMod.quiz.passingScore
      );
      const now = new Date().toISOString();
      const result: ModuleQuizResult = {
        ...graded,
        completedAt: now,
      };

      setProgressList((prev) => {
        const existing = prev.find(
          (p) => p.userId === currentUser.id && p.productId === productId
        );
        if (!existing) {
          return [
            ...prev,
            {
              userId: currentUser.id,
              productId,
              completedLectureIds: [],
              notesByLecture: {},
              quizScoresByModule: { [moduleId]: result },
              questions: [],
              updatedAt: now,
            },
          ];
        }
        return prev.map((p) =>
          p.userId === currentUser.id && p.productId === productId
            ? {
                ...p,
                quizScoresByModule: { ...(p.quizScoresByModule ?? {}), [moduleId]: result },
                updatedAt: now,
              }
            : p
        );
      });
      showToast(
        result.passed
          ? `Quiz passed with ${result.scorePercent}%!`
          : `Scored ${result.scorePercent}% — review explanations and retry`
      );
      return result;
    },
    [currentUser, products, showToast]
  );

  const issueCourseCertificate = useCallback(
    (productId: string) => {
      if (!currentUser) return null;
      const certCode = generateCertificateCode(currentUser.id, productId);
      setProgressList((prev) =>
        prev.map((p) =>
          p.userId === currentUser.id && p.productId === productId
            ? { ...p, certificateCode: certCode, updatedAt: new Date().toISOString() }
            : p
        )
      );
      return certCode;
    },
    [currentUser]
  );

  const addLectureQuestion = useCallback(
    (productId: string, lectureId: string, question: string) => {
      if (!currentUser || !question.trim()) return;
      setProgressList((prev) => {
        const existing = prev.find(
          (p) => p.userId === currentUser.id && p.productId === productId
        );
        const now = new Date().toISOString();
        const newQ = {
          id: `q-${Date.now()}`,
          lectureId,
          userName: currentUser.name,
          question: question.trim(),
          createdAt: now,
        };
        if (!existing) {
          return [
            ...prev,
            {
              userId: currentUser.id,
              productId,
              completedLectureIds: [],
              lastLectureId: lectureId,
              notesByLecture: {},
              questions: [newQ],
              updatedAt: now,
            },
          ];
        }
        return prev.map((p) =>
          p.userId === currentUser.id && p.productId === productId
            ? { ...p, questions: [newQ, ...p.questions], updatedAt: now }
            : p
        );
      });
      showToast('Question posted to course Q&A');
    },
    [currentUser, showToast]
  );

  // Membership actions
  const subscribeMembership = useCallback(
    (
      planId: MembershipTierId,
      billingCycle: 'monthly' | 'annual',
      options?: { paymentMethod?: PaymentMethod; paymentReference?: string; paystackVerified?: boolean }
    ) => {
      if (!currentUser) {
        return { ok: false, error: 'Please sign in first to activate your membership.' };
      }
      const plan = membershipPlans.find((p) => p.id === planId);
      if (!plan) return { ok: false, error: 'Membership plan not found.' };

      const paymentMethod = options?.paymentMethod ?? 'card';
      const status: UserMembership['status'] =
        options?.paystackVerified === true ? 'active' : 'pending';
      const now = new Date();
      const renewDate = new Date(now);
      if (billingCycle === 'annual') {
        renewDate.setFullYear(renewDate.getFullYear() + 1);
      } else {
        renewDate.setMonth(renewDate.getMonth() + 1);
      }

      const nextMem: UserMembership = {
        id: `mem-${Date.now()}`,
        userId: currentUser.id,
        planId,
        billingCycle,
        status,
        paymentMethod,
        paymentReference: options?.paymentReference?.trim() || undefined,
        startedAt: now.toISOString(),
        renewsAt: renewDate.toISOString(),
      };

      setUserMemberships((prev) => [
        nextMem,
        ...prev.filter((m) => m.userId !== currentUser.id),
      ]);
      showToast(
        status === 'active'
          ? `${plan.name} membership activated!`
          : paymentMethod === 'gtb_whatsapp'
          ? `${plan.name} pending GTB transfer verification`
          : `${plan.name} awaiting Paystack payment verification`
      );
      return { ok: true, membership: nextMem };
    },
    [currentUser, membershipPlans, showToast]
  );

  const cancelMembership = useCallback(() => {
    if (!currentUser) return;
    setUserMemberships((prev) =>
      prev.map((m) => (m.userId === currentUser.id ? { ...m, status: 'cancelled' } : m))
    );
    showToast('Membership cancelled');
  }, [currentUser, showToast]);

  const assignMembershipByAdmin = useCallback(
    (userId: string, planId: MembershipTierId, status: UserMembership['status']) => {
      const now = new Date();
      const renewDate = new Date(now);
      renewDate.setMonth(renewDate.getMonth() + 1);
      setUserMemberships((prev) => {
        const exists = prev.find((m) => m.userId === userId);
        if (exists) {
          return prev.map((m) => (m.userId === userId ? { ...m, planId, status } : m));
        }
        return [
          {
            id: `mem-${Date.now()}`,
            userId,
            planId,
            billingCycle: 'monthly',
            status,
            startedAt: now.toISOString(),
            renewsAt: renewDate.toISOString(),
          },
          ...prev,
        ];
      });
      showToast(`Updated member tier to ${planId.toUpperCase()} (${status})`);
    },
    [showToast]
  );

  const updateMembershipPlan = useCallback(
    (plan: MembershipPlan) => {
      setMembershipPlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)));
      showToast(`Updated ${plan.name} plan`);
    },
    [showToast]
  );

  // Affiliate actions
  const currentUserAffiliate = useMemo(() => {
    if (!currentUser) return null;
    return affiliates.find((a) => a.userId === currentUser.id) ?? null;
  }, [currentUser, affiliates]);

  const joinAffiliateProgram = useCallback(
    (
      bankDetails: string,
      payoutMethod: AffiliateProfile['payoutMethod'] = 'GTB Bank Transfer'
    ) => {
      if (!currentUser) {
        return { ok: false, error: 'Please sign in to join the Affiliate program.' };
      }
      if (bankDetails.trim().length < 5) {
        return { ok: false, error: 'Enter your bank account or payout details (min 5 chars).' };
      }
      const existing = affiliates.find((a) => a.userId === currentUser.id);
      if (existing) {
        return { ok: true, profile: existing };
      }
      const cleanName = currentUser.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'PARTNER';
      const code = `${cleanName}${Math.floor(10 + Math.random() * 89)}`;
      const profile: AffiliateProfile = {
        id: `aff-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        code,
        commissionRate: 25,
        clicks: 0,
        payoutMethod,
        bankDetails: bankDetails.trim(),
        active: true,
        joinedAt: new Date().toISOString(),
      };
      setAffiliates((prev) => [profile, ...prev]);
      showToast(`Partner account activated! Your code is ${code}`);
      return { ok: true, profile };
    },
    [currentUser, affiliates, showToast]
  );

  const updateAffiliateSettings = useCallback(
    (bankDetails: string, payoutMethod: AffiliateProfile['payoutMethod']) => {
      if (!currentUser) return;
      setAffiliates((prev) =>
        prev.map((a) =>
          a.userId === currentUser.id ? { ...a, bankDetails: bankDetails.trim(), payoutMethod } : a
        )
      );
      showToast('Updated affiliate payout details');
    },
    [currentUser, showToast]
  );

  const requestAffiliatePayout = useCallback(
    (amount: number, bankDetails: string) => {
      if (!currentUser || !currentUserAffiliate) {
        return { ok: false, error: 'Affiliate profile not found.' };
      }
      if (amount <= 0 || Number.isNaN(amount)) {
        return { ok: false, error: 'Enter a valid payout amount.' };
      }
      if (amount < AFFILIATE_MIN_PAYOUT_NGN) {
        return {
          ok: false,
          error: `Minimum payout withdrawal is ${formatNaira(AFFILIATE_MIN_PAYOUT_NGN)}.`,
        };
      }
      if (bankDetails.trim().length < 5) {
        return { ok: false, error: 'Provide bank or WhatsApp settlement details.' };
      }
      const userConvs = affiliateConversions.filter((c) => c.affiliateUserId === currentUser.id);
      const userPayouts = affiliatePayouts.filter((p) => p.affiliateUserId === currentUser.id);
      const summary = calculateAffiliateLedgerSummary(
        userConvs,
        userPayouts,
        currentUserAffiliate.clicks
      );

      if (amount > summary.availableBalance + 0.01) {
        return {
          ok: false,
          error: `Requested ${formatNaira(amount)} exceeds available approved balance (${formatNaira(summary.availableBalance)}).`,
        };
      }

      const req: AffiliatePayoutRequest = {
        id: `apay-${Date.now()}`,
        affiliateUserId: currentUser.id,
        affiliateName: currentUser.name,
        affiliateCode: currentUserAffiliate.code,
        amount: roundCurrency(amount),
        bankDetails: bankDetails.trim(),
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };
      setAffiliatePayouts((prev) => [req, ...prev]);
      showToast(`Payout request (${formatNaira(amount)}) submitted`);
      return { ok: true };
    },
    [currentUser, currentUserAffiliate, affiliateConversions, affiliatePayouts, showToast]
  );

  const updateAffiliateCommissionRate = useCallback(
    (affiliateId: string, rate: number) => {
      const clamped = Math.max(5, Math.min(60, Math.round(rate)));
      setAffiliates((prev) =>
        prev.map((a) => (a.id === affiliateId ? { ...a, commissionRate: clamped } : a))
      );
      showToast(`Updated commission rate to ${clamped}%`);
    },
    [showToast]
  );

  const updateAffiliateConversionStatus = useCallback(
    (conversionId: string, status: AffiliateConversion['status']) => {
      setAffiliateConversions((prev) =>
        prev.map((c) => (c.id === conversionId ? { ...c, status } : c))
      );
      showToast(`Conversion marked ${status}`);
    },
    [showToast]
  );

  const updateAffiliatePayoutStatus = useCallback(
    (payoutId: string, status: AffiliatePayoutRequest['status']) => {
      setAffiliatePayouts((prev) =>
        prev.map((p) =>
          p.id === payoutId
            ? { ...p, status, processedAt: new Date().toISOString() }
            : p
        )
      );
      showToast(`Payout request marked ${status}`);
    },
    [showToast]
  );

  // Showcase CRUD
  const upsertShowcaseSite = useCallback(
    (site: ShowcaseSite) => {
      setShowcaseSites((prev) => {
        const exists = prev.some((s) => s.id === site.id);
        return exists ? prev.map((s) => (s.id === site.id ? site : s)) : [site, ...prev];
      });
      showToast(`Saved Showcase site "${site.name}"`);
    },
    [showToast]
  );

  const deleteShowcaseSite = useCallback(
    (siteId: string) => {
      setShowcaseSites((prev) => prev.filter((s) => s.id !== siteId));
      showToast('Showcase entry deleted');
    },
    [showToast]
  );

  const toggleShowcaseSite = useCallback(
    (siteId: string) => {
      setShowcaseSites((prev) =>
        prev.map((s) => (s.id === siteId ? { ...s, active: !s.active } : s))
      );
      showToast('Updated Showcase visibility');
    },
    [showToast]
  );

  const activateLicenseDomain = useCallback(
    (licenseId: string, domain: string) => {
      const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
      if (!cleanDomain || !cleanDomain.includes('.')) {
        return { ok: false, error: 'Enter a valid domain (e.g. app.acme.dev).' };
      }
      const target = licenses.find((l) => l.id === licenseId);
      if (!target) return { ok: false, error: 'License not found.' };
      if (target.status !== 'active') {
        return { ok: false, error: 'This license key has been revoked.' };
      }
      if (target.activatedDomains.includes(cleanDomain)) {
        return { ok: false, error: 'Domain is already activated on this license.' };
      }
      if (target.activatedDomains.length >= target.maxSeats) {
        return {
          ok: false,
          error: `All ${target.maxSeats} seat(s) are currently in use. Deactivate a domain first.`,
        };
      }
      setLicenses((prev) =>
        prev.map((l) =>
          l.id === licenseId
            ? { ...l, activatedDomains: [...l.activatedDomains, cleanDomain] }
            : l
        )
      );
      showToast(`Activated ${cleanDomain}`);
      return { ok: true };
    },
    [licenses, showToast]
  );

  const deactivateLicenseDomain = useCallback(
    (licenseId: string, domain: string) => {
      setLicenses((prev) =>
        prev.map((l) =>
          l.id === licenseId
            ? { ...l, activatedDomains: l.activatedDomains.filter((d) => d !== domain) }
            : l
        )
      );
      showToast(`Released seat for ${domain}`);
    },
    [showToast]
  );

  const regenerateLicenseKey = useCallback(
    (licenseId: string) => {
      setLicenses((prev) =>
        prev.map((l) =>
          l.id === licenseId
            ? { ...l, key: generateLicenseKey('CM') }
            : l
        )
      );
      showToast('Generated new license key');
    },
    [showToast]
  );

  const addProductReview = useCallback(
    (productId: string, rating: number, comment: string) => {
      if (!currentUser || !comment.trim()) return;
      const newReview: ProductReview = {
        id: `rev-${Date.now()}`,
        productId,
        userId: currentUser.id,
        userName: currentUser.name,
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };
      setReviews((prev) => [newReview, ...prev]);
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          const totalCount = p.reviewCount + 1;
          const newAvg = roundCurrency((p.rating * p.reviewCount + rating) / totalCount);
          return {
            ...p,
            rating: Math.min(5, Math.max(1, Number(newAvg.toFixed(1)))),
            reviewCount: totalCount,
          };
        })
      );
      showToast('Thank you for your review');
    },
    [currentUser, showToast]
  );

  const upsertProduct = useCallback(
    (product: Product) => {
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === product.id);
        if (exists) {
          return prev.map((p) => (p.id === product.id ? product : p));
        }
        return [product, ...prev];
      });
      showToast(`Saved product "${product.title}"`);
    },
    [showToast]
  );

  const deleteProduct = useCallback(
    (productId: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast('Product deleted');
    },
    [showToast]
  );

  const duplicateProduct = useCallback(
    (productId: string) => {
      const target = products.find((p) => p.id === productId);
      if (!target) return;
      const copy: Product = {
        ...target,
        id: `prod-${Date.now()}`,
        slug: `${target.slug}-copy-${Math.floor(Math.random() * 999)}`,
        title: `${target.title} (Copy)`,
        status: 'draft',
        studentsCount: 0,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      setProducts((prev) => [copy, ...prev]);
      showToast(`Duplicated "${target.title}" as draft`);
    },
    [products, showToast]
  );

  const upsertWhatsAppGroup = useCallback(
    (group: WhatsAppGroup) => {
      setWhatsappGroups((prev) => {
        const exists = prev.some((g) => g.id === group.id);
        return exists ? prev.map((g) => (g.id === group.id ? group : g)) : [group, ...prev];
      });
      showToast(`Saved WhatsApp group "${group.name}"`);
    },
    [showToast]
  );

  const deleteWhatsAppGroup = useCallback(
    (groupId: string) => {
      setWhatsappGroups((prev) => prev.filter((g) => g.id !== groupId));
      showToast('WhatsApp group removed');
    },
    [showToast]
  );

  const toggleWhatsAppGroupStatus = useCallback(
    (groupId: string) => {
      setWhatsappGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, active: !g.active } : g))
      );
      showToast('Updated WhatsApp group status');
    },
    [showToast]
  );

  const joinWhatsAppGroup = useCallback(
    (groupId: string) => {
      setWhatsappGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, membersCount: Math.min(g.maxMembers, g.membersCount + 1) }
            : g
        )
      );
      showToast('Opening WhatsApp community invite');
    },
    [showToast]
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      const targetOrder = orders.find((o) => o.id === orderId);
      const isPromotingToCompleted =
        targetOrder && targetOrder.status !== 'completed' && status === 'completed';

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );

      if (isPromotingToCompleted && targetOrder) {
        const nowIso = new Date().toISOString();
        const existingLicForOrder = licenses.filter((l) => l.orderId === orderId);
        const newLicenses: LicenseKey[] = [];

        targetOrder.items.forEach((item, idx) => {
          if (
            item.productType === 'software' &&
            !existingLicForOrder.some((l) => l.productId === item.productId)
          ) {
            newLicenses.push({
              id: `lic-${Date.now()}-${idx}`,
              key: generateLicenseKey('CM', `${orderId}-${item.productId}-${Date.now()}`),
              productId: item.productId,
              productTitle: item.productTitle,
              userId: targetOrder.userId,
              orderId,
              tierName: item.tierName ?? 'Personal Solo License',
              maxSeats: item.seats ?? 1,
              activatedDomains: [],
              status: 'active',
              createdAt: nowIso,
            });
          }
        });

        if (newLicenses.length > 0) {
          setLicenses((prev) => [...newLicenses, ...prev]);
        }

        setProducts((prev) =>
          prev.map((p) =>
            targetOrder.items.some((i) => i.productId === p.id)
              ? { ...p, studentsCount: p.studentsCount + 1 }
              : p
          )
        );

        // Approve linked affiliate conversions if any
        setAffiliateConversions((prev) =>
          prev.map((c) => (c.orderId === orderId && c.status === 'pending' ? { ...c, status: 'approved' } : c))
        );
      }

      showToast(
        isPromotingToCompleted
          ? `Order ${orderId} verified & digital access unlocked`
          : `Order ${orderId} marked ${status}`
      );
    },
    [orders, licenses, showToast]
  );

  const toggleLicenseStatus = useCallback(
    (licenseId: string) => {
      setLicenses((prev) =>
        prev.map((l) =>
          l.id === licenseId
            ? { ...l, status: l.status === 'active' ? 'revoked' : 'active' }
            : l
        )
      );
      showToast('Updated license key status');
    },
    [showToast]
  );

  const upsertCoupon = useCallback(
    (coupon: Coupon) => {
      setCoupons((prev) => {
        const exists = prev.some((c) => c.id === coupon.id);
        return exists
          ? prev.map((c) => (c.id === coupon.id ? coupon : c))
          : [coupon, ...prev];
      });
      showToast(`Saved coupon ${coupon.code}`);
    },
    [showToast]
  );

  const deleteCoupon = useCallback(
    (couponId: string) => {
      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
      showToast('Coupon deleted');
    },
    [showToast]
  );

  const updateUserRole = useCallback(
    (userId: string, role: UserRole) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
      showToast(`Updated user role to ${role}`);
    },
    [showToast]
  );

  const updateAppearance = useCallback(
    (nextAppearance: StorefrontAppearance) => {
      setAppearance(nextAppearance);
      showToast('Storefront appearance published');
    },
    [showToast]
  );

  const activeBookmarkKey = currentUser?.id ?? 'guest';
  const bookmarkedBlogIds = useMemo(
    () => blogBookmarksMap[activeBookmarkKey] ?? [],
    [blogBookmarksMap, activeBookmarkKey]
  );

  const toggleBlogBookmark = useCallback(
    (postId: string) => {
      setBlogBookmarksMap((prev) => {
        const current = prev[activeBookmarkKey] ?? [];
        const has = current.includes(postId);
        showToast(has ? 'Removed article from Saved Articles' : 'Saved article to My Library');
        return {
          ...prev,
          [activeBookmarkKey]: has
            ? current.filter((id) => id !== postId)
            : [postId, ...current],
        };
      });
    },
    [activeBookmarkKey, showToast]
  );

  const upsertBlogPost = useCallback(
    (post: BlogPost) => {
      setBlogPosts((prev) => {
        const exists = prev.some((p) => p.id === post.id);
        return exists ? prev.map((p) => (p.id === post.id ? post : p)) : [post, ...prev];
      });
      showToast(`Saved blog post "${post.title}"`);
    },
    [showToast]
  );

  const deleteBlogPost = useCallback(
    (postId: string) => {
      setBlogPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('Blog post deleted');
    },
    [showToast]
  );

  const toggleBlogPostStatus = useCallback(
    (postId: string) => {
      setBlogPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, status: p.status === 'published' ? 'draft' : 'published' }
            : p
        )
      );
      showToast('Updated blog publication status');
    },
    [showToast]
  );

  const addBlogComment = useCallback(
    (postId: string, body: string) => {
      if (!currentUser) {
        return { ok: false, error: 'Please sign in to post a comment.' };
      }
      const trimmed = body.trim();
      if (trimmed.length < 2) {
        return { ok: false, error: 'Comment must be at least 2 characters.' };
      }
      const newComment: BlogComment = {
        id: `bc-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        body: trimmed,
        createdAt: new Date().toISOString(),
      };
      setBlogPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: [newComment, ...p.comments] } : p
        )
      );
      showToast('Comment published');
      return { ok: true };
    },
    [currentUser, showToast]
  );

  const deleteBlogComment = useCallback(
    (postId: string, commentId: string) => {
      setBlogPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
            : p
        )
      );
      showToast('Comment removed');
    },
    [showToast]
  );

  // Event Management actions
  const upsertEvent = useCallback(
    (event: CoursemartEvent) => {
      setEvents((prev) => {
        const exists = prev.some((e) => e.id === event.id);
        return exists ? prev.map((e) => (e.id === event.id ? event : e)) : [event, ...prev];
      });
      showToast(`Saved event "${event.title}"`);
    },
    [showToast]
  );

  const deleteEvent = useCallback(
    (eventId: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      showToast('Event deleted');
    },
    [showToast]
  );

  const registerForEvent = useCallback(
    async (
      eventId: string,
      input: EventRegistrationInput,
      payment?: { paymentStatus: EventRegistration['paymentStatus']; paymentReference?: string }
    ) => {
      const targetEvent = events.find((e) => e.id === eventId);
      if (!targetEvent) {
        return { ok: false, error: 'Event not found.' };
      }

      const check = validateEventRegistrationForm(input, targetEvent, eventRegistrations);
      if (!check.valid) {
        return { ok: false, errors: check.errors, error: Object.values(check.errors)[0] };
      }

      const confirmationCode = generateEventConfirmationCode(targetEvent.id, input.email);
      const nowIso = new Date().toISOString();
      const baseReg: EventRegistration = {
        id: `evreg-${Date.now()}`,
        eventId: targetEvent.id,
        eventTitle: targetEvent.title,
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || undefined,
        organization: input.organization?.trim() || undefined,
        roleTitle: input.roleTitle.trim(),
        experienceLevel: input.experienceLevel,
        attendanceMode: input.attendanceMode,
        learningGoals: input.learningGoals?.trim() || undefined,
        newsletterOptIn: Boolean(input.newsletterOptIn),
        confirmationCode,
        paymentStatus:
          payment?.paymentStatus ?? (targetEvent.price === 0 ? 'free' : 'paid_paystack'),
        paymentReference: payment?.paymentReference?.trim() || undefined,
        acknowledgementEmailStatus: 'in_app_ready',
        registeredAt: nowIso,
      };

      // Dispatch real email confirmation & pre-event materials only when an ESP API key is active
      if (publicServerConfig.emailProvider !== 'none') {
        try {
          const emailPayload = buildPreEventAcknowledgementHtml(targetEvent, baseReg);
          const resp = await fetch('/api/events/acknowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: baseReg.email,
              name: baseReg.fullName,
              subject: emailPayload.subject,
              html: emailPayload.html,
            }),
          });
          if (resp.ok) {
            baseReg.acknowledgementEmailStatus = 'sent_via_esp';
            baseReg.preEventMaterialsSentAt = nowIso;
          } else {
            baseReg.acknowledgementEmailStatus = 'queued_no_esp_key';
          }
        } catch {
          baseReg.acknowledgementEmailStatus = 'in_app_ready';
        }
      } else {
        baseReg.acknowledgementEmailStatus = 'queued_no_esp_key';
      }

      setEventRegistrations((prev) => [baseReg, ...prev]);
      showToast(`Registered for "${targetEvent.title}" (${confirmationCode})`);
      return { ok: true, registration: baseReg };
    },
    [events, eventRegistrations, publicServerConfig.emailProvider, showToast]
  );

  const updateEventRegistrationPayment = useCallback(
    (registrationId: string, paymentStatus: EventRegistration['paymentStatus']) => {
      setEventRegistrations((prev) =>
        prev.map((r) => (r.id === registrationId ? { ...r, paymentStatus } : r))
      );
      showToast('Updated event attendee payment status');
    },
    [showToast]
  );

  const markEventMaterialsSent = useCallback((registrationIds: string[]) => {
    const idSet = new Set(registrationIds);
    const nowIso = new Date().toISOString();
    setEventRegistrations((prev) =>
      prev.map((r) =>
        idSet.has(r.id)
          ? { ...r, preEventMaterialsSentAt: nowIso, acknowledgementEmailStatus: 'sent_via_esp' }
          : r
      )
    );
  }, []);

  // Social Queue actions
  const addSocialDrafts = useCallback(
    (drafts: SocialPostDraft[]) => {
      setSocialDrafts((prev) => [...drafts, ...prev]);
      showToast(`Created ${drafts.length} social draft(s) for review`);
    },
    [showToast]
  );

  const updateSocialDraft = useCallback((draft: SocialPostDraft) => {
    setSocialDrafts((prev) =>
      prev.map((d) =>
        d.id === draft.id ? { ...draft, updatedAt: new Date().toISOString() } : d
      )
    );
  }, []);

  const approveAndScheduleSocialDraft = useCallback(
    (draftId: string, scheduledFor?: string) => {
      const targetTime =
        scheduledFor || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      setSocialDrafts((prev) =>
        prev.map((d) =>
          d.id === draftId
            ? {
                ...d,
                status: 'scheduled',
                scheduledFor: targetTime,
                updatedAt: new Date().toISOString(),
              }
            : d
        )
      );
      showToast('Draft approved & scheduled');
    },
    [showToast]
  );

  const deleteSocialDraft = useCallback(
    (draftId: string) => {
      setSocialDrafts((prev) => prev.filter((d) => d.id !== draftId));
      showToast('Removed social draft');
    },
    [showToast]
  );

  // Email Broadcast actions
  const addEmailCampaign = useCallback(
    (campaign: EmailBroadcastCampaign) => {
      setEmailCampaigns((prev) => [campaign, ...prev]);
      showToast(
        campaign.status === 'sent'
          ? `Broadcast sent to ${campaign.recipientCount} subscriber(s)`
          : 'Saved broadcast campaign draft'
      );
    },
    [showToast]
  );

  const resetDemoDatabase = useCallback(() => {
    storageService.resetAllDemoData();
    window.location.reload();
  }, []);

  const value: StoreContextValue = {
    route,
    navigate,
    products,
    users,
    orders,
    licenses,
    coupons,
    reviews,
    progressList,
    appearance,
    currentUser,
    cart,
    wishlist,
    filters,
    setFilters,
    isCartOpen,
    setIsCartOpen,
    appliedCouponCode,
    setAppliedCouponCode,
    toastMessage,
    showToast,
    publicServerConfig,
    adminSessionVerified,
    loginWithCredentials,
    loginAdminWithServer,
    registerUser,
    updateNewsletterPreference,
    quickLoginAsRole,
    logout,
    addToCart,
    addBundleToCart,
    removeFromCart,
    clearCart,
    toggleWishlist,
    isOwnedByCurrentUser,
    completeCheckout,
    verifyPaystackReference,
    recordProductDownload,
    requestOrderRefund,
    resolveOrderRefund,
    toggleLectureComplete,
    toggleModuleComplete,
    setLastViewedLecture,
    resetCourseProgress,
    saveLectureNote,
    addTimestampedNote,
    deleteTimestampedNote,
    submitModuleQuiz,
    issueCourseCertificate,
    addLectureQuestion,
    getCourseProgress,
    membershipPlans,
    userMemberships,
    activeUserMembership,
    activeMembershipPlan,
    isUnlockedByMembership,
    enrollViaMembership,
    subscribeMembership,
    cancelMembership,
    assignMembershipByAdmin,
    updateMembershipPlan,
    activeReferralCode,
    affiliates,
    affiliateConversions,
    affiliatePayouts,
    currentUserAffiliate,
    joinAffiliateProgram,
    updateAffiliateSettings,
    requestAffiliatePayout,
    updateAffiliateCommissionRate,
    updateAffiliateConversionStatus,
    updateAffiliatePayoutStatus,
    showcaseSites,
    upsertShowcaseSite,
    deleteShowcaseSite,
    toggleShowcaseSite,
    events,
    eventRegistrations,
    upsertEvent,
    deleteEvent,
    registerForEvent,
    updateEventRegistrationPayment,
    markEventMaterialsSent,
    socialDrafts,
    addSocialDrafts,
    updateSocialDraft,
    approveAndScheduleSocialDraft,
    deleteSocialDraft,
    emailCampaigns,
    addEmailCampaign,
    activateLicenseDomain,
    deactivateLicenseDomain,
    regenerateLicenseKey,
    addProductReview,
    whatsappGroups,
    upsertWhatsAppGroup,
    deleteWhatsAppGroup,
    toggleWhatsAppGroupStatus,
    joinWhatsAppGroup,
    blogPosts,
    bookmarkedBlogIds,
    toggleBlogBookmark,
    upsertBlogPost,
    deleteBlogPost,
    toggleBlogPostStatus,
    addBlogComment,
    deleteBlogComment,
    upsertProduct,
    deleteProduct,
    duplicateProduct,
    updateOrderStatus,
    toggleLicenseStatus,
    upsertCoupon,
    deleteCoupon,
    updateUserRole,
    updateAppearance,
    resetDemoDatabase,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
