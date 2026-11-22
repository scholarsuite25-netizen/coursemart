import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { storageService } from '../services/storageService';
import { DEFAULT_APPEARANCE } from '../data/seedData';
import type {
  AffiliateConversion,
  AffiliatePayoutRequest,
  AffiliateProfile,
  BlogComment,
  BlogPost,
  CartItem,
  CommunityChannel,
  CommunityChatMessage,
  CommunityForumReply,
  CommunityForumThread,
  Coupon,
  CoursemartEvent,
  CourseProgress,
  EmailBroadcastCampaign,
  EventRegistration,
  FunnelCheckoutPayload,
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
import type {
  CalendarEngagement,
  FacilitatorBooking,
  FacilitatorBookingInput,
} from '../types/promoter';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import {
  buildPreEventAcknowledgementHtml,
  generateEventConfirmationCode,
  validateEventRegistrationForm,
  type EventRegistrationInput,
} from '../utils/events';
import { resolveInitialOrderStatus } from '../utils/automation';
import {
  AFFILIATE_MIN_PAYOUT_NGN,
  DEFAULT_AFFILIATE_COMMISSION_PERCENT,
  attributeAffiliateReferral,
  calculateAffiliateCommission,
  calculateAffiliateLedgerSummary,
  calculateCourseProgressPercent,
  calculateExtendedCartTotals,
  extractReferralCodeFromSearch,
  generateCertificateCode,
  generateLicenseKey,
  gradeModuleQuiz,
  isTierSufficient,
  isUnlockedByMembership as checkUnlockedByMembership,
  migrateLegacyTier,
  roundCurrency,
  toggleModuleLecturesCompletion,
} from '../utils/commerce';
import { formatNaira } from '../utils/currency';
import { hashPassword, needsPasswordUpgrade, verifyPassword } from '../utils/passwordHash';

export interface RouteState {
  path: string;
}

export interface StoreContextValue {
  route: string;
  navigate: (path: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
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
  ) => Promise<{ ok: boolean; error?: string; user?: UserAccount }>;
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
  ) => Promise<{ ok: boolean; error?: string; user?: UserAccount }>;
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
  completeFunnelOrder: (
    payload: FunnelCheckoutPayload,
    order: Order
  ) => { ok: boolean; orderId: string; error?: string };
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
  addLectureQuestion: (productId: string, lectureId: string, question: string) => string | null;
  answerLectureQuestion: (productId: string, questionId: string, answer: string) => void;
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
    billingCycle: 'monthly' | 'annual' | 'masterclass' | 'onetime' | 'lifetime',
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

  // Community Module (R1)
  communityChannels: CommunityChannel[];
  communityMessages: CommunityChatMessage[];
  forumThreads: CommunityForumThread[];
  forumReplies: CommunityForumReply[];
  sendCommunityMessage: (
    channelId: string,
    content: string,
    replyToId?: string
  ) => { ok: boolean; message?: CommunityChatMessage; error?: string };
  toggleMessageReaction: (messageId: string, emoji: string) => void;
  deleteCommunityMessage: (messageId: string) => void;
  pinCommunityMessage: (messageId: string, isPinned?: boolean) => void;
  createForumThread: (input: {
    title: string;
    body?: string;
    content?: string;
    category: string;
    productId?: string;
    tags?: string[];
  }) => { ok: boolean; thread?: CommunityForumThread; error?: string };
  updateForumThread: (threadId: string, updates: Partial<CommunityForumThread>) => void;
  deleteForumThread: (threadId: string) => void;
  toggleThreadPin: (threadId: string) => void;
  toggleThreadLock: (threadId: string) => void;
  upvoteForumThread: (threadId: string) => void;
  createForumReply: (
    threadId: string,
    body: string
  ) => { ok: boolean; reply?: CommunityForumReply; error?: string };
  updateForumReply: (replyId: string, body: string) => void;
  deleteForumReply: (replyId: string) => void;
  upvoteForumReply: (replyId: string) => void;
  markAcceptedForumReply: (threadId: string, replyId: string) => void;
  upsertCommunityChannel: (channel: CommunityChannel) => void;
  deleteCommunityChannel: (channelId: string) => void;

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

  // Facilitator Booking & Calendar Engagements (Milestone 3)
  facilitatorBookings: FacilitatorBooking[];
  calendarEngagements: CalendarEngagement[];
  isFacilitatorDateFree: (date: string, excludeBookingId?: string) => boolean;
  submitFacilitatorBooking: (input: FacilitatorBookingInput) => {
    success: boolean;
    booking?: FacilitatorBooking;
    whatsappUrl: string;
    error?: string;
  };
  setFacilitatorBookingStatus: (
    bookingId: string,
    newStatus: 'pending' | 'accepted' | 'declined' | 'confirmed'
  ) => { success: boolean; error?: string };
  updateFacilitatorBookingStatus: (
    id: string,
    status: 'pending' | 'accepted' | 'declined' | 'confirmed'
  ) => { success: boolean; error?: string };
  deleteFacilitatorBooking: (id: string) => void;
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

/** Synced keys holding personal data: re-pushed after sign-in so records
 *  created while signed out (or on another device) are uploaded. */
const PERSONAL_SYNC_KEYS = [
  'users',
  'orders',
  'licenses',
  'progress',
  'blog_bookmarks',
  'user_memberships',
  'affiliates',
  'affiliate_conversions',
  'affiliate_payouts',
] as const;

const StoreContext = createContext<StoreContextValue | null>(null);

export type StoreContextType = StoreContextValue;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const saved = localStorage.getItem('cm_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // fallback
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    try {
      localStorage.setItem('cm_theme', theme);
    } catch {
      // ignore
    }
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

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
  const [appearance, setAppearance] = useState<StorefrontAppearance>(() => {
    const app = storageService.getAppearance();
    if (!app.brandName || app.brandName.toLowerCase().includes('coursemart')) {
      return { ...app, brandName: 'DIGITAL WEALTH CREATORS' };
    }
    return app;
  });
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
  const [communityChannels, setCommunityChannels] = useState<CommunityChannel[]>(() =>
    storageService.getCommunityChannels()
  );
  const [communityMessages, setCommunityMessages] = useState<CommunityChatMessage[]>(() =>
    storageService.getCommunityMessages()
  );
  const [forumThreads, setForumThreads] = useState<CommunityForumThread[]>(() =>
    storageService.getForumThreads()
  );
  const [forumReplies, setForumReplies] = useState<CommunityForumReply[]>(() =>
    storageService.getForumReplies()
  );
  const [facilitatorBookings, setFacilitatorBookings] = useState<FacilitatorBooking[]>(() =>
    storageService.getFacilitatorBookings()
  );
  const [calendarEngagements, setCalendarEngagements] = useState<CalendarEngagement[]>(() =>
    storageService.getCalendarEngagements()
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
  const [hydrated, setHydrated] = useState(false);
  const [filters, setFilters] = useState<ProductFilterState>(DEFAULT_FILTERS);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  // Fresh-value refs for async callbacks and effects (avoids stale closures).
  const usersRef = useRef(users);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);
  const syncValuesRef = useRef<Record<string, unknown>>({});
  const prevSyncRef = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // The full set of collections synchronized through the server KV store.
  const syncValues = useMemo<Record<string, unknown>>(
    () => ({
      products,
      users,
      orders,
      licenses,
      coupons,
      reviews,
      progress: progressList,
      appearance,
      whatsapp_groups: whatsappGroups,
      blog_posts: blogPosts,
      blog_bookmarks: blogBookmarksMap,
      membership_plans: membershipPlans,
      user_memberships: userMemberships,
      affiliates,
      affiliate_conversions: affiliateConversions,
      affiliate_payouts: affiliatePayouts,
      showcase_sites: showcaseSites,
      events,
      event_registrations: eventRegistrations,
      social_drafts: socialDrafts,
      email_campaigns: emailCampaigns,
      community_channels: communityChannels,
      community_messages: communityMessages,
      forum_threads: forumThreads,
      forum_replies: forumReplies,
    }),
    [
      products,
      users,
      orders,
      licenses,
      coupons,
      reviews,
      progressList,
      appearance,
      whatsappGroups,
      blogPosts,
      blogBookmarksMap,
      membershipPlans,
      userMemberships,
      affiliates,
      affiliateConversions,
      affiliatePayouts,
      showcaseSites,
      events,
      eventRegistrations,
      socialDrafts,
      emailCampaigns,
      communityChannels,
      communityMessages,
      forumThreads,
      forumReplies,
    ]
  );

  // Type-checked hydration setters keyed by KV store key.
  const syncSetters = useMemo<Record<string, (value: unknown) => void>>(
    () => ({
      products: (v) => { if (Array.isArray(v)) setProducts(v as Product[]); },
      orders: (v) => { if (Array.isArray(v)) setOrders(v as Order[]); },
      licenses: (v) => { if (Array.isArray(v)) setLicenses(v as LicenseKey[]); },
      coupons: (v) => { if (Array.isArray(v)) setCoupons(v as Coupon[]); },
      reviews: (v) => { if (Array.isArray(v)) setReviews(v as ProductReview[]); },
      progress: (v) => { if (Array.isArray(v)) setProgressList(v as CourseProgress[]); },
      appearance: (v) => {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          const app = v as StorefrontAppearance;
          if (!app.brandName || app.brandName.toLowerCase().includes('coursemart')) {
            app.brandName = 'DIGITAL WEALTH CREATORS';
          }
          if (!app.heroTitle || app.heroTitle.toLowerCase().includes('coursemart')) {
            app.heroTitle = DEFAULT_APPEARANCE.heroTitle;
          }
          if (!app.heroSubtitle || app.heroSubtitle.toLowerCase().includes('coursemart')) {
            app.heroSubtitle = DEFAULT_APPEARANCE.heroSubtitle;
          }
          setAppearance(app);
          storageService.saveAppearance(app);
        }
      },
      whatsapp_groups: (v) => { if (Array.isArray(v)) setWhatsappGroups(v as WhatsAppGroup[]); },
      blog_posts: (v) => { if (Array.isArray(v)) setBlogPosts(v as BlogPost[]); },
      blog_bookmarks: (v) => { if (v && typeof v === 'object' && !Array.isArray(v)) setBlogBookmarksMap(v as Record<string, string[]>); },
      membership_plans: (v) => { if (Array.isArray(v)) setMembershipPlans(v as MembershipPlan[]); },
      user_memberships: (v) => { if (Array.isArray(v)) setUserMemberships(v as UserMembership[]); },
      affiliates: (v) => { if (Array.isArray(v)) setAffiliates(v as AffiliateProfile[]); },
      affiliate_conversions: (v) => { if (Array.isArray(v)) setAffiliateConversions(v as AffiliateConversion[]); },
      affiliate_payouts: (v) => { if (Array.isArray(v)) setAffiliatePayouts(v as AffiliatePayoutRequest[]); },
      showcase_sites: (v) => { if (Array.isArray(v)) setShowcaseSites(v as ShowcaseSite[]); },
      events: (v) => { if (Array.isArray(v)) setEvents(v as CoursemartEvent[]); },
      event_registrations: (v) => { if (Array.isArray(v)) setEventRegistrations(v as EventRegistration[]); },
      social_drafts: (v) => { if (Array.isArray(v)) setSocialDrafts(v as SocialPostDraft[]); },
      email_campaigns: (v) => { if (Array.isArray(v)) setEmailCampaigns(v as EmailBroadcastCampaign[]); },
      community_channels: (v) => { if (Array.isArray(v)) setCommunityChannels(v as CommunityChannel[]); },
      community_messages: (v) => { if (Array.isArray(v)) setCommunityMessages(v as CommunityChatMessage[]); },
      forum_threads: (v) => { if (Array.isArray(v)) setForumThreads(v as CommunityForumThread[]); },
      forum_replies: (v) => { if (Array.isArray(v)) setForumReplies(v as CommunityForumReply[]); },
    }),
    []
  );

  useEffect(() => {
    syncValuesRef.current = syncValues;
  });

  useEffect(() => {
    const onPopState = () => {
      setRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Capture ?ref=CODE or ?aff=CODE affiliate referral attribution once per session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const refCode = extractReferralCodeFromSearch(window.location.search);
    if (!refCode) return;
    const matched = affiliates.find((a) => a.active && a.code.toUpperCase() === refCode);
    if (matched) {
      setActiveReferralCode(matched.code);
      storageService.setActiveReferralCode(matched.code);
      try {
        window.localStorage.setItem('cm_referral_code', matched.code);
        window.localStorage.setItem('cm_referral_timestamp', new Date().toISOString());
      } catch {
        // Safe storage fallback
      }
      const clickKey = `cm_ref_clicked_${matched.code}`;
      if (!window.sessionStorage.getItem(clickKey)) {
        window.sessionStorage.setItem(clickKey, '1');
        setAffiliates((prev) =>
          prev.map((a) => (a.id === matched.id ? { ...a, clicks: a.clicks + 1 } : a))
        );
      }
    }
  }, [affiliates]);

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
            const matched = usersRef.current.find((u) => u.id === prevId);
            return matched?.role === 'admin' ? null : prevId;
          });
        }
      })
      .catch(() => setAdminSessionVerified(false));
  }, []);

  // Hydrate shared collections from the server KV store (source of truth) and
  // upgrade any legacy plaintext passwords to PBKDF2 hashes before first use.
  useEffect(() => {
    if (typeof window === 'undefined') {
      setHydrated(true);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const resp = await fetch('/api/store');
        if (cancelled) return;
        if (!resp.ok) {
          prevSyncRef.current = { ...syncValuesRef.current };
          setHydrated(true);
          return;
        }
        const data = (await resp.json()) as { ok?: boolean; values?: Record<string, unknown> };
        const values =
          data.values && typeof data.values === 'object' && !Array.isArray(data.values)
            ? data.values
            : {};

        // `users` merges (never replaces): an anonymous caller only receives
        // their own record, and a signed-in caller must keep other local
        // accounts (previews, demo roles) intact.
        const serverUsers = Array.isArray(values.users)
          ? (values.users as UserAccount[]).filter(
              (u): u is UserAccount => Boolean(u) && typeof u === 'object' && Boolean(u.id)
            )
          : null;
        const baseUsers = serverUsers
          ? (() => {
              const byId = new Map(usersRef.current.map((u) => [u.id, u]));
              for (const su of serverUsers) {
                byId.set(su.id, { ...byId.get(su.id), ...su });
              }
              return Array.from(byId.values());
            })()
          : usersRef.current;

        // Password migration: hash legacy plaintext records so they are never
        // stored, compared or pushed in plaintext again.
        let migrated = false;
        const finalUsers: UserAccount[] = [];
        for (const u of baseUsers) {
          if (needsPasswordUpgrade(u.password)) {
            finalUsers.push({ ...u, password: await hashPassword(u.password) });
            migrated = true;
          } else {
            finalUsers.push(u);
          }
        }

        // Seed the push snapshot before applying server values: keys the server
        // returned are exactly what we set (no echo push), `users` keeps the
        // pre-hydration snapshot so migrations/additions sync up once.
        const overrides: Record<string, unknown> = {};
        for (const key of Object.keys(values)) {
          if (key !== 'users') overrides[key] = values[key];
        }
        prevSyncRef.current = { ...syncValuesRef.current, ...overrides };

        if (migrated || serverUsers) {
          setUsers(finalUsers);
        }
        for (const [key, value] of Object.entries(values)) {
          if (key === 'users') continue;
          syncSetters[key]?.(value);
        }
        setHydrated(true);
      } catch {
        if (!cancelled) {
          prevSyncRef.current = { ...syncValuesRef.current };
          setHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [syncSetters]);

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
  useEffect(() => storageService.saveEvents(events), [events]);
  useEffect(() => storageService.saveEventRegistrations(eventRegistrations), [eventRegistrations]);
  useEffect(() => storageService.saveSocialDrafts(socialDrafts), [socialDrafts]);
  useEffect(() => storageService.saveEmailCampaigns(emailCampaigns), [emailCampaigns]);
  useEffect(() => storageService.saveCommunityChannels(communityChannels), [communityChannels]);
  useEffect(() => storageService.saveCommunityMessages(communityMessages), [communityMessages]);
  useEffect(() => storageService.saveForumThreads(forumThreads), [forumThreads]);
  useEffect(() => storageService.saveForumReplies(forumReplies), [forumReplies]);
  useEffect(() => storageService.setActiveReferralCode(activeReferralCode), [activeReferralCode]);
  useEffect(() => storageService.saveCart(cart), [cart]);
  useEffect(() => storageService.saveWishlist(wishlist), [wishlist]);
  useEffect(() => storageService.setCurrentUserId(currentUserId), [currentUserId]);

  // Unified server sync: push only the collections whose values changed since
  // the last snapshot. Non-OK responses (401/403/429) are graceful no-ops —
  // the server decides what this session may write.
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const prev = prevSyncRef.current;
    if (!prev) return;
    const changed: string[] = [];
    for (const key of Object.keys(syncValues)) {
      if (!Object.is(prev[key], syncValues[key])) changed.push(key);
    }
    if (changed.length === 0) return;
    prevSyncRef.current = { ...prev, ...syncValues };
    for (const key of changed) {
      fetch(`/api/store/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: syncValues[key] }),
      }).catch(() => {});
    }
  }, [hydrated, syncValues]);

  const activeUserMembership = useMemo(() => {
    if (!currentUser) return null;
    const found = userMemberships.find(
      (m) => m.userId === currentUser.id && m.status === 'active'
    );
    if (!found) return null;
    return {
      ...found,
      planId: migrateLegacyTier(found.planId),
    };
  }, [currentUser, userMemberships]);

  const activeMembershipPlan = useMemo(() => {
    if (activeUserMembership) {
      return membershipPlans.find((p) => p.id === activeUserMembership.planId) ?? null;
    }
    if (currentUser) {
      return membershipPlans.find((p) => p.id === 'free') ?? null;
    }
    return null;
  }, [currentUser, activeUserMembership, membershipPlans]);

  const isUnlockedByMembership = useCallback(
    (product: Product) => {
      return checkUnlockedByMembership(product, activeUserMembership);
    },
    [activeUserMembership]
  );

  // After sign-in, re-push personal collections so records created while signed
  // out (or fetched from another device) are uploaded under the new session.
  const resyncPersonalKeys = useCallback(() => {
    const prev = prevSyncRef.current;
    if (!prev) return;
    for (const key of PERSONAL_SYNC_KEYS) {
      delete prev[key];
    }
  }, []);

  const loginWithCredentials = useCallback(
    async (email: string, password: string, requiredRole?: UserRole) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password) {
        return { ok: false, error: 'Email and password are required.' };
      }

      const roleError = (role: UserRole) =>
        requiredRole && role !== requiredRole
          ? `This portal requires ${requiredRole} privileges. Use the Super Admin account.`
          : null;

      // Prefer the server session: it verifies against the synced users
      // collection and issues the HttpOnly cookie that scopes KV writes.
      try {
        const resp = await fetch('/api/auth/user/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, password }),
        });
        const data = (await resp.json()) as {
          ok?: boolean;
          user?: {
            id?: string;
            name?: string;
            email?: string;
            role?: UserRole;
            avatar?: string;
            title?: string;
            newsletterOptIn?: boolean;
            joinedAt?: string;
          };
          error?: string;
        };
        if (resp.ok && data.ok && data.user?.id) {
          const mismatch = roleError(data.user.role ?? 'customer');
          if (mismatch) return { ok: false, error: mismatch };
          const localExisting = usersRef.current.find((u) => u.id === data.user!.id);
          const record: UserAccount = {
            id: data.user.id,
            name: data.user.name || normalizedEmail.split('@')[0] || 'Digital Wealth Creators Member',
            email: data.user.email || normalizedEmail,
            // Keep the local verifier when we already have one; otherwise hash
            // the typed password so offline sign-in never stores plaintext.
            password: localExisting?.password ?? (await hashPassword(password)),
            role: data.user.role ?? 'customer',
            avatar: data.user.avatar,
            title: data.user.title,
            newsletterOptIn: data.user.newsletterOptIn,
            joinedAt: data.user.joinedAt || new Date().toISOString(),
          };
          setUsers((prev) =>
            prev.some((u) => u.id === record.id)
              ? prev.map((u) => (u.id === record.id ? { ...u, ...record } : u))
              : [...prev, record]
          );
          setCurrentUserId(record.id);
          resyncPersonalKeys();
          showToast(`Signed in as ${record.name}`);
          return { ok: true, user: record };
        }
        if (resp.status === 401 || resp.status === 404) {
          return { ok: false, error: 'Invalid email or password.' };
        }
        if (resp.status === 429) {
          return { ok: false, error: data.error || 'Too many sign-in attempts. Wait a minute.' };
        }
        // Other statuses fall through to local verification below.
      } catch {
        // Server unreachable — verify against the local collection instead.
      }

      const found = usersRef.current.find(
        (u) => u.email.trim().toLowerCase() === normalizedEmail
      );
      if (found) {
        const valid = await verifyPassword(password, found.password);
        if (!valid) return { ok: false, error: 'Invalid email or password.' };
        const mismatch = roleError(found.role);
        if (mismatch) return { ok: false, error: mismatch };
        setCurrentUserId(found.id);
        resyncPersonalKeys();
        showToast(`Signed in as ${found.name}`);
        return { ok: true, user: found };
      }
      return { ok: false, error: 'Invalid email or password.' };
    },
    [showToast, resyncPersonalKeys]
  );

  const registerUser = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: UserRole = 'customer',
      newsletterOptIn: boolean = false
    ) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!name.trim()) return { ok: false, error: 'Enter your full name.' };
      if (!password) return { ok: false, error: 'Choose a password.' };
      if (usersRef.current.some((u) => u.email.trim().toLowerCase() === normalizedEmail)) {
        return { ok: false, error: 'An account with this email already exists.' };
      }
      const nowIso = new Date().toISOString();
      const newUser: UserAccount = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        password: await hashPassword(password),
        role,
        title: role === 'instructor' ? 'Independent Instructor' : 'Verified Learner',
        newsletterOptIn,
        newsletterOptedInAt: newsletterOptIn ? nowIso : undefined,
        joinedAt: nowIso,
      };
      setUsers((prev) => (prev.some((u) => u.id === newUser.id) ? prev : [...prev, newUser]));
      setCurrentUserId(newUser.id);

      // Persist the account first so the server can authenticate it, then open
      // the session cookie. Both are best-effort: offline, the account stays
      // local and signs in against the local collection.
      try {
        await fetch('/api/store/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: [newUser] }),
        });
      } catch {
        // Offline — local only.
      }
      try {
        await fetch('/api/auth/user/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, password }),
        });
      } catch {
        // Offline — local session only.
      }

      resyncPersonalKeys();
      showToast(
        newsletterOptIn
          ? `Welcome ${newUser.name}! Account created & newsletter subscribed.`
          : `Welcome to ${appearance.brandName}, ${newUser.name}`
      );

      // Request browser notification permission and show notification
      try {
        if (typeof Notification !== 'undefined') {
          const sendNotif = () => {
            new Notification(`Welcome, ${newUser.name}!`, {
              body: `Your ${appearance.brandName} account is active. Explore courses, tools & community.`,
              icon: '/icons/icon-192x192.png',
            });
          };
          if (Notification.permission === 'granted') {
            sendNotif();
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((perm) => {
              if (perm === 'granted') sendNotif();
            });
          }
        }
      } catch {
        // Notification API unavailable — silent fallback
      }
      return { ok: true, user: newUser };
    },
    [appearance.brandName, showToast, resyncPersonalKeys]
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
          ? 'Subscribed to DIGITAL WEALTH CREATORS weekly updates & event invites'
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
      fetch('/api/auth/user/logout', { method: 'POST' }).catch(() => {});
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
              ? { ...item, tierId, tierName, seats, variantId, variantName, sku, unitPrice, isPremium: Boolean(product.isPremium) }
              : item
          );
        }
        return [
          ...prev,
          { productId: product.id, tierId, tierName, seats, variantId, variantName, sku, unitPrice, isPremium: Boolean(product.isPremium) },
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
              isPremium: Boolean(p.isPremium),
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
      const userTier: MembershipTierId = userMem ? migrateLegacyTier(userMem.planId) : 'free';

      const enrichedCart = cart.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        return {
          ...item,
          isPremium: item.isPremium ?? prod?.isPremium ?? false,
        };
      });

      const totals = calculateExtendedCartTotals(
        enrichedCart,
        coupons,
        appliedCouponCode,
        userTier,
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
        const attr = attributeAffiliateReferral(
          activeReferralCode,
          { id: activeUser.id, email: activeUser.email },
          affiliates,
          totals.grandTotal
        );
        if (attr.attributed && attr.affiliateId && attr.affiliateCode) {
          const aff = affiliates.find((a) => a.id === attr.affiliateId);
          if (aff) {
            const conv: AffiliateConversion = {
              id: `aconv-${Date.now()}`,
              affiliateCode: attr.affiliateCode,
              affiliateUserId: aff.userId,
              orderId,
              buyerName: activeUser.name,
              orderTotal: totals.grandTotal,
              commissionAmount: attr.commissionAmount,
              status: isPendingTransfer ? 'pending' : 'approved',
              createdAt: nowIso,
            };
            setAffiliateConversions((prev) => [conv, ...prev]);
          }
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

  const completeFunnelOrder = useCallback(
    (payload: FunnelCheckoutPayload, order: Order) => {
      const nowIso = new Date().toISOString();
      const generatedLicenses: LicenseKey[] = [];

      if (order.status === 'completed') {
        order.items.forEach((item) => {
          if (item.productType === 'software') {
            generatedLicenses.push({
              id: `lic-${Date.now()}-${Math.floor(Math.random() * 9000)}`,
              key: generateLicenseKey('CM', `${order.id}-${item.productId}-${Date.now()}`),
              productId: item.productId,
              productTitle: item.productTitle,
              userId: order.userId,
              orderId: order.id,
              tierName: item.tierName ?? 'Commercial License',
              maxSeats: item.seats ?? 1,
              activatedDomains: [],
              status: 'active',
              createdAt: nowIso,
            });
          }
        });
      }

      const affCode = payload.affiliateCode || activeReferralCode;
      if (affCode && order.total > 0) {
        const attr = attributeAffiliateReferral(
          affCode,
          { id: order.userId, email: order.customerEmail },
          affiliates,
          order.total
        );
        if (attr.attributed && attr.affiliateId && attr.affiliateCode) {
          const aff = affiliates.find((a) => a.id === attr.affiliateId);
          if (aff) {
            const conv: AffiliateConversion = {
              id: `aconv-${Date.now()}`,
              affiliateCode: attr.affiliateCode,
              affiliateUserId: aff.userId,
              orderId: order.id,
              buyerName: order.customerName,
              orderTotal: order.total,
              commissionAmount: attr.commissionAmount,
              status: order.status === 'pending' ? 'pending' : 'approved',
              createdAt: nowIso,
            };
            setAffiliateConversions((prev) => [conv, ...prev]);
          }
        }
      }

      setOrders((prev) => [order, ...prev]);
      if (generatedLicenses.length > 0) {
        setLicenses((prev) => [...generatedLicenses, ...prev]);
      }
      if (order.status === 'completed') {
        setProducts((prev) =>
          prev.map((p) =>
            order.items.some((i) => i.productId === p.id)
              ? { ...p, studentsCount: p.studentsCount + 1 }
              : p
          )
        );
      }

      showToast(
        order.status === 'pending'
          ? `Order ${order.id} created — send transfer proof on WhatsApp`
          : `Order ${order.id} completed! Access unlocked in Library.`
      );

      return { ok: true, orderId: order.id };
    },
    [activeReferralCode, affiliates, showToast]
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
      const product = products.find((p) => p.id === productId);
      if (!product || product.type !== 'course') return null;

      const progress = progressList.find(
        (p) => p.userId === currentUser.id && p.productId === productId
      );
      if (!progress) return null;

      // Certificates are an achievement credential: they may only be issued
      // after every lecture in the curriculum has been completed.
      const completionPercent = calculateCourseProgressPercent(
        product,
        progress.completedLectureIds
      );
      if (completionPercent < 100) {
        showToast(
          `Complete 100% of this course to unlock your certificate (currently ${completionPercent}%).`
        );
        return null;
      }

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
    [currentUser, products, progressList, showToast]
  );

  const addLectureQuestion = useCallback(
    (productId: string, lectureId: string, question: string) => {
      if (!currentUser || !question.trim()) return null;
      const newQ = {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        lectureId,
        userName: currentUser.name,
        question: question.trim(),
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
      return newQ.id;
    },
    [currentUser, showToast]
  );

  const answerLectureQuestion = useCallback(
    (productId: string, questionId: string, answer: string) => {
      if (!currentUser || !answer.trim()) return;
      const now = new Date().toISOString();
      setProgressList((prev) =>
        prev.map((p) => {
          if (p.productId !== productId) return p;
          return {
            ...p,
            questions: p.questions.map((q) =>
              q.id === questionId ? { ...q, answer: answer.trim() } : q
            ),
            updatedAt: now,
          };
        })
      );
      showToast('Answer recorded');
    },
    [currentUser, showToast]
  );

  // Membership actions
  const subscribeMembership = useCallback(
    (
      planId: MembershipTierId,
      billingCycle: 'monthly' | 'annual' | 'masterclass' | 'onetime' | 'lifetime',
      options?: { paymentMethod?: PaymentMethod; paymentReference?: string; paystackVerified?: boolean }
    ) => {
      if (!currentUser) {
        return { ok: false, error: 'Please sign in first to activate your membership.' };
      }
      const plan = membershipPlans.find((p) => p.id === planId);
      if (!plan) return { ok: false, error: 'Membership plan not found.' };

      const paymentMethod = options?.paymentMethod ?? 'card';
      const isFreePlan = planId === 'free' || plan.monthlyPrice === 0;
      const status: UserMembership['status'] =
        isFreePlan || options?.paystackVerified === true ? 'active' : 'pending';
      const now = new Date();
      const renewDate = new Date(now);
      if (billingCycle === 'annual' || billingCycle === 'masterclass') {
        renewDate.setFullYear(renewDate.getFullYear() + 1);
      } else if (billingCycle === 'onetime' || billingCycle === 'lifetime') {
        renewDate.setFullYear(renewDate.getFullYear() + 99);
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
        commissionRate: DEFAULT_AFFILIATE_COMMISSION_PERCENT,
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
      const clamped = Math.max(1, Math.min(75, Math.round(rate)));
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
      const sanitized: StorefrontAppearance = {
        ...nextAppearance,
        brandName: (!nextAppearance.brandName || nextAppearance.brandName.toLowerCase().includes('coursemart'))
          ? 'DIGITAL WEALTH CREATORS'
          : nextAppearance.brandName,
      };
      setAppearance(sanitized);
      storageService.saveAppearance(sanitized);
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

  // Community Module Actions (R1)
  const sendCommunityMessage = useCallback(
    (channelId: string, content: string, replyToId?: string) => {
      if (!currentUser) {
        return { ok: false, error: 'Sign in to participate in community discussions.' };
      }
      const trimmed = content.trim();
      if (!trimmed) {
        return { ok: false, error: 'Message cannot be empty.' };
      }
      const channel = communityChannels.find((c) => c.id === channelId);
      if (!channel) {
        return { ok: false, error: 'Channel not found.' };
      }
      if (channel.isReadOnly && currentUser.role !== 'admin' && currentUser.role !== 'instructor') {
        return { ok: false, error: 'This channel is read-only. Only instructors and admins may post.' };
      }
      const now = new Date().toISOString();
      const newMessage: CommunityChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        channelId,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        userAvatar: currentUser.avatar,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        content: trimmed,
        replyToId,
        reactions: {},
        isPinned: false,
        isModerated: false,
        createdAt: now,
      };
      setCommunityMessages((prev) => [...prev, newMessage]);
      return { ok: true, message: newMessage };
    },
    [currentUser, communityChannels]
  );

  const toggleMessageReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!currentUser) {
        showToast('Sign in to react to messages.');
        return;
      }
      setCommunityMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const currentReactions = { ...(m.reactions || {}) };
          const users = currentReactions[emoji] ? [...currentReactions[emoji]] : [];
          const idx = users.indexOf(currentUser.id);
          if (idx >= 0) {
            users.splice(idx, 1);
          } else {
            users.push(currentUser.id);
          }
          if (users.length > 0) {
            currentReactions[emoji] = users;
          } else {
            delete currentReactions[emoji];
          }
          return { ...m, reactions: currentReactions };
        })
      );
    },
    [currentUser, showToast]
  );

  const deleteCommunityMessage = useCallback(
    (messageId: string) => {
      setCommunityMessages((prev) => prev.filter((m) => m.id !== messageId));
      showToast('Message deleted');
    },
    [showToast]
  );

  const pinCommunityMessage = useCallback(
    (messageId: string, isPinned?: boolean) => {
      setCommunityMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isPinned: isPinned !== undefined ? isPinned : !m.isPinned }
            : m
        )
      );
      showToast('Updated pinned message');
    },
    [showToast]
  );

  const createForumThread = useCallback(
    (input: {
      title: string;
      body?: string;
      content?: string;
      category: string;
      productId?: string;
      tags?: string[];
    }) => {
      if (!currentUser) {
        return { ok: false, error: 'Sign in to create discussion threads.' };
      }
      const title = input.title.trim();
      if (title.length < 5) {
        return { ok: false, error: 'Title must be at least 5 characters.' };
      }
      const rawBody = input.body || input.content || '';
      const body = rawBody.trim();
      if (body.length < 10) {
        return { ok: false, error: 'Body must be at least 10 characters.' };
      }
      const now = new Date().toISOString();
      const rawSlug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || `thread-${Date.now()}`;
      const newThread: CommunityForumThread = {
        id: `th-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        slug: rawSlug,
        title,
        body,
        content: body,
        category: input.category || 'General',
        productId: input.productId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        authorAvatar: currentUser.avatar,
        tags: (input.tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean),
        upvotes: 0,
        upvotedUserIds: [],
        viewsCount: 0,
        replyCount: 0,
        isPinned: false,
        pinned: false,
        isLocked: false,
        isSolved: false,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
      };
      setForumThreads((prev) => [newThread, ...prev]);
      showToast(`Discussion thread "${title}" published`);
      return { ok: true, thread: newThread };
    },
    [currentUser, showToast]
  );

  const updateForumThread = useCallback(
    (threadId: string, updates: Partial<CommunityForumThread>) => {
      setForumThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        )
      );
      showToast('Thread updated');
    },
    [showToast]
  );

  const deleteForumThread = useCallback(
    (threadId: string) => {
      setForumThreads((prev) => prev.filter((t) => t.id !== threadId));
      setForumReplies((prev) => prev.filter((r) => r.threadId !== threadId));
      showToast('Discussion thread deleted');
    },
    [showToast]
  );

  const toggleThreadPin = useCallback(
    (threadId: string) => {
      setForumThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, isPinned: !t.isPinned, pinned: !t.isPinned, updatedAt: new Date().toISOString() }
            : t
        )
      );
      showToast('Toggled thread pinned status');
    },
    [showToast]
  );

  const toggleThreadLock = useCallback(
    (threadId: string) => {
      setForumThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, isLocked: !t.isLocked, updatedAt: new Date().toISOString() }
            : t
        )
      );
      showToast('Toggled thread lock status');
    },
    [showToast]
  );

  const upvoteForumThread = useCallback(
    (threadId: string) => {
      if (!currentUser) {
        showToast('Sign in to upvote threads');
        return;
      }
      setForumThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t;
          const userList = t.upvotedUserIds ? [...t.upvotedUserIds] : [];
          const idx = userList.indexOf(currentUser.id);
          if (idx >= 0) {
            userList.splice(idx, 1);
            return {
              ...t,
              upvotedUserIds: userList,
              upvotes: Math.max(0, (t.upvotes || 1) - 1),
            };
          } else {
            userList.push(currentUser.id);
            return {
              ...t,
              upvotedUserIds: userList,
              upvotes: (t.upvotes || 0) + 1,
            };
          }
        })
      );
    },
    [currentUser, showToast]
  );

  const createForumReply = useCallback(
    (threadId: string, bodyText: string) => {
      if (!currentUser) {
        return { ok: false, error: 'Sign in to post replies.' };
      }
      const thread = forumThreads.find((t) => t.id === threadId);
      if (!thread) {
        return { ok: false, error: 'Discussion thread not found.' };
      }
      if (thread.isLocked) {
        return { ok: false, error: 'This thread is locked for replies.' };
      }
      const trimmed = bodyText.trim();
      if (!trimmed) {
        return { ok: false, error: 'Reply cannot be empty.' };
      }
      const now = new Date().toISOString();
      const newReply: CommunityForumReply = {
        id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        threadId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        authorAvatar: currentUser.avatar,
        body: trimmed,
        content: trimmed,
        upvotes: 0,
        upvotedUserIds: [],
        isSolution: false,
        isPinned: false,
        isModerated: false,
        createdAt: now,
      };
      setForumReplies((prev) => [...prev, newReply]);
      setForumThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, replyCount: (t.replyCount || 0) + 1, lastActivityAt: now, updatedAt: now }
            : t
        )
      );
      showToast('Reply posted');
      return { ok: true, reply: newReply };
    },
    [currentUser, forumThreads, showToast]
  );

  const updateForumReply = useCallback(
    (replyId: string, bodyText: string) => {
      const trimmed = bodyText.trim();
      if (!trimmed) return;
      setForumReplies((prev) =>
        prev.map((r) =>
          r.id === replyId ? { ...r, body: trimmed, content: trimmed, updatedAt: new Date().toISOString() } : r
        )
      );
      showToast('Reply updated');
    },
    [showToast]
  );

  const deleteForumReply = useCallback(
    (replyId: string) => {
      const reply = forumReplies.find((r) => r.id === replyId);
      setForumReplies((prev) => prev.filter((r) => r.id !== replyId));
      if (reply) {
        setForumThreads((prev) =>
          prev.map((t) =>
            t.id === reply.threadId
              ? { ...t, replyCount: Math.max(0, (t.replyCount || 1) - 1) }
              : t
          )
        );
      }
      showToast('Reply deleted');
    },
    [forumReplies, showToast]
  );

  const upvoteForumReply = useCallback(
    (replyId: string) => {
      if (!currentUser) {
        showToast('Sign in to upvote replies');
        return;
      }
      setForumReplies((prev) =>
        prev.map((r) => {
          if (r.id !== replyId) return r;
          const userList = r.upvotedUserIds ? [...r.upvotedUserIds] : [];
          const idx = userList.indexOf(currentUser.id);
          if (idx >= 0) {
            userList.splice(idx, 1);
            return {
              ...r,
              upvotedUserIds: userList,
              upvotes: Math.max(0, (r.upvotes || 1) - 1),
            };
          } else {
            userList.push(currentUser.id);
            return {
              ...r,
              upvotedUserIds: userList,
              upvotes: (r.upvotes || 0) + 1,
            };
          }
        })
      );
    },
    [currentUser, showToast]
  );

  const markAcceptedForumReply = useCallback(
    (threadId: string, replyId: string) => {
      const now = new Date().toISOString();
      setForumThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, isSolved: true, solutionReplyId: replyId, lastActivityAt: now } : t
        )
      );
      setForumReplies((prev) =>
        prev.map((r) =>
          r.threadId === threadId ? { ...r, isSolution: r.id === replyId } : r
        )
      );
      showToast('Marked verified solution');
    },
    [showToast]
  );

  const upsertCommunityChannel = useCallback(
    (channel: CommunityChannel) => {
      setCommunityChannels((prev) => {
        const exists = prev.some((c) => c.id === channel.id);
        return exists
          ? prev.map((c) => (c.id === channel.id ? channel : c))
          : [...prev, channel];
      });
      showToast(`Channel #${channel.slug} saved`);
    },
    [showToast]
  );

  const deleteCommunityChannel = useCallback(
    (channelId: string) => {
      setCommunityChannels((prev) => prev.filter((c) => c.id !== channelId));
      showToast('Channel deleted');
    },
    [showToast]
  );

  const isFacilitatorDateFree = useCallback(
    (dateStr: string, excludeBookingId?: string): boolean => {
      if (!dateStr) return false;
      const cleanDate = dateStr.trim();

      // 1. Check if calendar engagement is booked (ignoring entry created by this booking)
      const hasCalendarConflict = calendarEngagements.some(
        (eng) =>
          eng.date === cleanDate &&
          eng.type === 'booked' &&
          eng.id !== `cal-booking-${excludeBookingId}`
      );
      if (hasCalendarConflict) return false;

      // 2. Check if another booking has already been accepted/confirmed
      const hasAcceptedConflict = facilitatorBookings.some(
        (b) =>
          b.date === cleanDate &&
          (b.status === 'accepted' || b.status === 'confirmed') &&
          b.id !== excludeBookingId &&
          b.reference !== excludeBookingId
      );
      if (hasAcceptedConflict) return false;

      return true;
    },
    [calendarEngagements, facilitatorBookings]
  );

  const setFacilitatorBookingStatus = useCallback(
    (
      bookingId: string,
      newStatus: 'pending' | 'accepted' | 'declined' | 'confirmed'
    ): { success: boolean; error?: string } => {
      const target = facilitatorBookings.find(
        (b) => b.id === bookingId || b.reference === bookingId
      );
      if (!target) {
        showToast('Appointment not found.');
        return { success: false, error: 'Appointment not found.' };
      }

      const normalizedStatus = newStatus === 'confirmed' ? 'accepted' : newStatus;

      if (normalizedStatus === 'accepted') {
        // Enforce rule: "There should not be acceptance if the date is not free in the first instance"
        const free = isFacilitatorDateFree(target.date, target.id);
        if (!free) {
          const err = `Cannot accept appointment: Date ${target.date} is not free in the first instance. It is already committed to another engagement.`;
          showToast(err);
          return { success: false, error: err };
        }

        // Auto-lock this date on the facilitator availability calendar
        const calEntryId = `cal-booking-${target.id}`;
        setCalendarEngagements((prev) => {
          const filtered = prev.filter((e) => e.id !== calEntryId && e.date !== target.date);
          const newCalEntry: CalendarEngagement = {
            id: calEntryId,
            date: target.date,
            title: `${target.eventTitle} (${target.organization})`,
            type: 'booked',
            locationType: (target.locationType || 'Physical').toLowerCase() as any,
            organization: target.organization,
          };
          const nextCal = [...filtered, newCalEntry];
          storageService.saveCalendarEngagements(nextCal);
          return nextCal;
        });
      } else {
        // When declined or set to pending, release any auto-locked calendar engagement
        const calEntryId = `cal-booking-${target.id}`;
        setCalendarEngagements((prev) => {
          const filtered = prev.filter((e) => e.id !== calEntryId);
          storageService.saveCalendarEngagements(filtered);
          return filtered;
        });
      }

      // Update state and persistence
      setFacilitatorBookings((prev) => {
        const next = prev.map((b) =>
          b.id === target.id || b.reference === target.reference
            ? { ...b, status: normalizedStatus }
            : b
        );
        storageService.saveFacilitatorBookings(next);
        return next;
      });

      const msg =
        normalizedStatus === 'accepted'
          ? `Appointment ${target.reference} accepted! Date ${target.date} is locked on calendar.`
          : normalizedStatus === 'declined'
          ? `Appointment ${target.reference} declined. Date ${target.date} has been released.`
          : `Appointment ${target.reference} set to pending review.`;

      showToast(msg);
      return { success: true };
    },
    [facilitatorBookings, isFacilitatorDateFree, showToast]
  );

  const deleteFacilitatorBooking = useCallback(
    (id: string) => {
      const target = facilitatorBookings.find((b) => b.id === id || b.reference === id);
      if (target) {
        const calEntryId = `cal-booking-${target.id}`;
        setCalendarEngagements((prev) => {
          const filtered = prev.filter((e) => e.id !== calEntryId);
          storageService.saveCalendarEngagements(filtered);
          return filtered;
        });
      }
      storageService.deleteFacilitatorBooking(id);
      setFacilitatorBookings((prev) => prev.filter((b) => b.id !== id && b.reference !== id));
      showToast('Appointment record removed.');
    },
    [facilitatorBookings, showToast]
  );

  const submitFacilitatorBooking = useCallback(
    (
      input: FacilitatorBookingInput
    ): {
      success: boolean;
      booking?: FacilitatorBooking;
      whatsappUrl: string;
      error?: string;
    } => {
      const candidateDate = (input.date || '').trim();
      if (!candidateDate) {
        return { success: false, whatsappUrl: '', error: 'Event date is required.' };
      }

      // "There should not be acceptance if the date is not free in the first instance"
      if (!isFacilitatorDateFree(candidateDate)) {
        return {
          success: false,
          whatsappUrl: '',
          error: `Selected date (${candidateDate}) is not free in the first instance. It is already booked for another engagement. Please choose an open date from the calendar.`,
        };
      }

      const randomSuffix = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()
        .padStart(4, '0');
      const reference = `FAC-2026-${randomSuffix}`;
      const phoneValue = input.phone || input.phoneWhatsApp || '';

      const newBooking: FacilitatorBooking = {
        ...input,
        phone: phoneValue,
        phoneWhatsApp: phoneValue,
        id: `booking-${Date.now()}-${randomSuffix}`,
        reference,
        referenceCode: reference,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      const messageLines = [
        `*NEW EXECUTIVE FACILITATION INVITATION*`,
        `Ref: ${newBooking.reference}`,
        `--------------------------------------`,
        `*Applicant:* ${newBooking.name}`,
        `*Organization:* ${newBooking.organization}`,
        `*Email:* ${newBooking.email}`,
        `*Phone:* ${newBooking.phone}`,
        `*Event Title:* ${newBooking.eventTitle}`,
        `*Date:* ${newBooking.date}`,
        `*Venue:* ${newBooking.venue} (${newBooking.locationType})`,
        `*Scope:* ${newBooking.scope}`,
        `*Audience Size:* ~${newBooking.audienceSize}`,
        `*Objectives:* ${newBooking.objectives}`,
        `--------------------------------------`,
        `Sent from DIGITAL WEALTH CREATORS (DWC) Promoter Portal`,
      ];

      const whatsappUrl = buildWhatsAppUrl(messageLines.join('\n'), '2348034710699');
      newBooking.whatsAppDispatchUrl = whatsappUrl;

      storageService.saveFacilitatorBooking(newBooking);
      setFacilitatorBookings((prev) => [newBooking, ...prev]);

      return {
        success: true,
        booking: newBooking,
        whatsappUrl,
      };
    },
    [isFacilitatorDateFree]
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
    completeFunnelOrder,
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
    answerLectureQuestion,
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
    communityChannels,
    communityMessages,
    forumThreads,
    forumReplies,
    sendCommunityMessage,
    toggleMessageReaction,
    deleteCommunityMessage,
    pinCommunityMessage,
    createForumThread,
    updateForumThread,
    deleteForumThread,
    toggleThreadPin,
    toggleThreadLock,
    upvoteForumThread,
    createForumReply,
    updateForumReply,
    deleteForumReply,
    upvoteForumReply,
    markAcceptedForumReply,
    upsertCommunityChannel,
    deleteCommunityChannel,
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
    theme,
    toggleTheme,
    resetDemoDatabase,
    facilitatorBookings,
    calendarEngagements,
    isFacilitatorDateFree,
    submitFacilitatorBooking,
    setFacilitatorBookingStatus,
    updateFacilitatorBookingStatus: setFacilitatorBookingStatus,
    deleteFacilitatorBooking,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
