import {
  DEFAULT_APPEARANCE,
  SEED_AFFILIATES,
  SEED_AFFILIATE_CONVERSIONS,
  SEED_BLOG_POSTS,
  SEED_COUPONS,
  SEED_EMAIL_CAMPAIGNS,
  SEED_EVENTS,
  SEED_EVENT_REGISTRATIONS,
  SEED_LICENSES,
  SEED_MEMBERSHIP_PLANS,
  SEED_ORDERS,
  SEED_PAYOUT_REQUESTS,
  SEED_PRODUCTS,
  SEED_PROGRESS,
  SEED_REVIEWS,
  SEED_SHOWCASE_SITES,
  SEED_SOCIAL_DRAFTS,
  SEED_USER_MEMBERSHIPS,
  SEED_USERS,
  SEED_WHATSAPP_GROUPS,
  SEED_COMMUNITY_CHANNELS,
  SEED_COMMUNITY_MESSAGES,
  SEED_FORUM_THREADS,
  SEED_FORUM_REPLIES,
} from '../data/seedData';
import type {
  AffiliateConversion,
  AffiliatePayoutRequest,
  AffiliateProfile,
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
  LicenseKey,
  MembershipPlan,
  Order,
  Product,
  ProductReview,
  ShowcaseSite,
  SocialPostDraft,
  StorefrontAppearance,
  UserAccount,
  UserMembership,
  WhatsAppGroup,
} from '../types/marketplace';
import type { CalendarEngagement, FacilitatorBooking } from '../types/promoter';

import {
  migrateLegacyTier,
  migrateUserMemberships,
} from '../utils/commerce';

export { migrateLegacyTier, migrateUserMemberships };

const STORAGE_KEYS = {
  PRODUCTS: 'cm_db_products_ngn_v1',
  BLOGS: 'cm_db_blogs_v3',
  BLOG_BOOKMARKS: 'cm_db_blog_bookmarks_v1',
  USERS: 'cm_db_users_v2',
  ORDERS: 'cm_db_orders_ngn_v1',
  LICENSES: 'cm_db_licenses_v1',
  COUPONS: 'cm_db_coupons_ngn_v1',
  REVIEWS: 'cm_db_reviews_v1',
  PROGRESS: 'cm_db_progress_v2',
  APPEARANCE: 'cm_db_appearance_v3',
  WHATSAPP_GROUPS: 'cm_db_whatsapp_groups_v1',
  MEMBERSHIP_PLANS: 'cm_db_membership_plans_ngn_v1',
  USER_MEMBERSHIPS: 'cm_db_user_memberships_ngn_v1',
  AFFILIATES: 'cm_db_affiliates_v1',
  AFFILIATE_CONVERSIONS: 'cm_db_affiliate_conversions_ngn_v1',
  AFFILIATE_PAYOUTS: 'cm_db_affiliate_payouts_ngn_v1',
  SHOWCASE_SITES: 'cm_db_showcase_sites_v1',
  EVENTS: 'cm_db_events_ngn_v1',
  EVENT_REGISTRATIONS: 'cm_db_event_registrations_v1',
  SOCIAL_DRAFTS: 'cm_db_social_drafts_v1',
  EMAIL_CAMPAIGNS: 'cm_db_email_campaigns_v1',
  COMMUNITY_CHANNELS: 'cm_db_community_channels_v1',
  COMMUNITY_MESSAGES: 'cm_db_community_messages_v1',
  FORUM_THREADS: 'cm_db_forum_threads_v1',
  FORUM_REPLIES: 'cm_db_forum_replies_v1',
  FACILITATOR_BOOKINGS: 'cm_db_facilitator_bookings_v1',
  CALENDAR_ENGAGEMENTS: 'cm_db_calendar_engagements_v1',
  ACTIVE_REFERRAL_CODE: 'cm_session_ref_code_v1',
  CART: 'cm_session_cart_ngn_v1',
  WISHLIST: 'cm_session_wishlist_v1',
  AUTH_USER_ID: 'cm_session_user_id_v1',
} as const;

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      window.localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export const SEED_CALENDAR_ENGAGEMENTS: CalendarEngagement[] = [
  {
    id: 'cal-eng-1',
    date: '2026-11-28',
    title: 'Abeokuta Polo Club Follow-Up & Youth Tech Cohort 2 Review',
    type: 'booked',
    locationType: 'physical',
    organization: 'Abeokuta Polo Club / Ogun State Youth Tech Foundation',
    timeSlot: '10:00 AM - 2:00 PM WAT',
  },
  {
    id: 'cal-eng-2',
    date: '2026-12-05',
    title: 'Chrisland University Vibe Coding & AI Literacy Guest Lecture',
    type: 'booked',
    locationType: 'physical',
    organization: 'Chrisland University (Dept. of Computer Science & Mass Comm)',
    timeSlot: '11:00 AM - 1:30 PM WAT',
  },
  {
    id: 'cal-eng-3',
    date: '2026-12-12',
    title: 'Bowen University Higher Ed Governance Advisory & Council Session',
    type: 'booked',
    locationType: 'hybrid',
    organization: 'Bowen University',
    timeSlot: '9:00 AM - 1:00 PM WAT',
  },
  {
    id: 'cal-eng-4',
    date: '2026-12-18',
    title: 'Dominion University Registry Operations & Digital Records Workshop',
    type: 'booked',
    locationType: 'physical',
    organization: 'Dominion University',
    timeSlot: '10:00 AM - 3:00 PM WAT',
  },
  {
    id: 'cal-eng-5',
    date: '2027-01-15',
    title: 'Atiba University Digital Infrastructure & E-Library Briefing',
    type: 'booked',
    locationType: 'hybrid',
    organization: 'Atiba University',
    timeSlot: '11:00 AM - 2:00 PM WAT',
  },
  {
    id: 'cal-eng-6',
    date: '2026-12-01',
    title: 'Open Slot: Keynotes, Executive Masterclasses & AI Curriculum Advisory',
    type: 'available',
    locationType: 'virtual',
  },
  {
    id: 'cal-eng-7',
    date: '2026-12-10',
    title: 'Open Slot: Corporate Governance & Institutional Strategy Consultation',
    type: 'available',
    locationType: 'hybrid',
  },
  {
    id: 'cal-eng-8',
    date: '2026-12-15',
    title: 'Open Slot: Hands-On Vibe Coding & Software Architecture Workshop',
    type: 'available',
    locationType: 'physical',
  },
  {
    id: 'cal-eng-9',
    date: '2026-12-20',
    title: 'Open Slot: Executive Panel & Smart Campus Technology Architecture',
    type: 'available',
    locationType: 'virtual',
  },
];

export const SEED_FACILITATOR_BOOKINGS: FacilitatorBooking[] = [
  {
    id: 'booking-seed-sample-01',
    reference: 'FAC-2026-001A',
    referenceCode: 'FAC-2026-001A',
    name: 'Prof. Babatunde Adeleke',
    organization: 'Ogun State Higher Education Consortium',
    email: 'babatunde.adeleke@highered.org.ng',
    phone: '+234 802 345 6789',
    phoneWhatsApp: '+234 802 345 6789',
    eventTitle: 'Higher Education Digital Transformation & AI Leadership Summit',
    date: '2026-12-15',
    venue: 'Executive Senate Chamber / Live Virtual Stream',
    locationType: 'Hybrid',
    scope: 'Keynote',
    audienceSize: '200',
    objectives:
      'Keynote on Management Consultancy, Virtual Library Management Systems, ICT for Higher Institutions, and Higher Ed Portal Architecture.',
    createdAt: '2026-11-20T10:00:00.000Z',
    status: 'pending',
  },
];

export const storageService = {
  getProducts: (): Product[] => {
    const list = readStorage(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
    if (!Array.isArray(list)) return [];
    return list.map((p) => {
      if (p && p.includedInMembershipTier && ['starter', 'pro', 'vip', 'enterprise'].includes(p.includedInMembershipTier as string)) {
        return {
          ...p,
          includedInMembershipTier: migrateLegacyTier(p.includedInMembershipTier),
        };
      }
      return p;
    });
  },
  saveProducts: (products: Product[]): void => writeStorage(STORAGE_KEYS.PRODUCTS, products),

  getBlogPosts: (): BlogPost[] => readStorage(STORAGE_KEYS.BLOGS, SEED_BLOG_POSTS),
  saveBlogPosts: (posts: BlogPost[]): void => writeStorage(STORAGE_KEYS.BLOGS, posts),

  getBlogBookmarksMap: (): Record<string, string[]> =>
    readStorage(STORAGE_KEYS.BLOG_BOOKMARKS, { 'user-student-1': ['blog-1'] }),
  saveBlogBookmarksMap: (map: Record<string, string[]>): void =>
    writeStorage(STORAGE_KEYS.BLOG_BOOKMARKS, map),

  getUsers: (): UserAccount[] => readStorage(STORAGE_KEYS.USERS, SEED_USERS),
  saveUsers: (users: UserAccount[]): void => writeStorage(STORAGE_KEYS.USERS, users),

  getOrders: (): Order[] => readStorage(STORAGE_KEYS.ORDERS, SEED_ORDERS),
  saveOrders: (orders: Order[]): void => writeStorage(STORAGE_KEYS.ORDERS, orders),

  getLicenses: (): LicenseKey[] => readStorage(STORAGE_KEYS.LICENSES, SEED_LICENSES),
  saveLicenses: (licenses: LicenseKey[]): void => writeStorage(STORAGE_KEYS.LICENSES, licenses),

  getCoupons: (): Coupon[] => readStorage(STORAGE_KEYS.COUPONS, SEED_COUPONS),
  saveCoupons: (coupons: Coupon[]): void => writeStorage(STORAGE_KEYS.COUPONS, coupons),

  getReviews: (): ProductReview[] => readStorage(STORAGE_KEYS.REVIEWS, SEED_REVIEWS),
  saveReviews: (reviews: ProductReview[]): void => writeStorage(STORAGE_KEYS.REVIEWS, reviews),

  getProgressList: (): CourseProgress[] => readStorage(STORAGE_KEYS.PROGRESS, SEED_PROGRESS),
  saveProgressList: (progress: CourseProgress[]): void =>
    writeStorage(STORAGE_KEYS.PROGRESS, progress),

  getAppearance: (): StorefrontAppearance => {
    const raw = readStorage(STORAGE_KEYS.APPEARANCE, DEFAULT_APPEARANCE);
    if (!raw || !raw.brandName || raw.brandName === 'Coursemart') {
      const refreshed: StorefrontAppearance = {
        ...DEFAULT_APPEARANCE,
        ...raw,
        brandName: 'DIGITAL WEALTH CREATORS',
      };
      writeStorage(STORAGE_KEYS.APPEARANCE, refreshed);
      return refreshed;
    }
    return raw;
  },
  saveAppearance: (appearance: StorefrontAppearance): void =>
    writeStorage(STORAGE_KEYS.APPEARANCE, appearance),

  getWhatsAppGroups: (): WhatsAppGroup[] =>
    readStorage(STORAGE_KEYS.WHATSAPP_GROUPS, SEED_WHATSAPP_GROUPS),
  saveWhatsAppGroups: (groups: WhatsAppGroup[]): void =>
    writeStorage(STORAGE_KEYS.WHATSAPP_GROUPS, groups),

  getMembershipPlans: (): MembershipPlan[] => {
    const raw = readStorage(STORAGE_KEYS.MEMBERSHIP_PLANS, SEED_MEMBERSHIP_PLANS);
    const hasLegacyPlans =
      Array.isArray(raw) &&
      raw.some((p) => p && ['starter', 'pro', 'vip', 'enterprise'].includes(p.id as string));
    const hasOutdatedPricing =
      Array.isArray(raw) &&
      raw.some(
        (p) =>
          p &&
          p.id === 'paid' &&
          (p.annualPrice !== 10000 || p.masterclassPrice !== 25000 || !p.includesMasterclassTraining)
      );
    if (hasLegacyPlans || hasOutdatedPricing || !Array.isArray(raw) || raw.length === 0) {
      writeStorage(STORAGE_KEYS.MEMBERSHIP_PLANS, SEED_MEMBERSHIP_PLANS);
      return SEED_MEMBERSHIP_PLANS;
    }
    return raw;
  },
  saveMembershipPlans: (plans: MembershipPlan[]): void =>
    writeStorage(STORAGE_KEYS.MEMBERSHIP_PLANS, plans),

  getUserMemberships: (): UserMembership[] => {
    const raw = readStorage(STORAGE_KEYS.USER_MEMBERSHIPS, SEED_USER_MEMBERSHIPS);
    const migrated = migrateUserMemberships(raw);
    return migrated;
  },
  saveUserMemberships: (list: UserMembership[]): void => {
    const migrated = migrateUserMemberships(list);
    writeStorage(STORAGE_KEYS.USER_MEMBERSHIPS, migrated);
  },

  getAffiliates: (): AffiliateProfile[] =>
    readStorage(STORAGE_KEYS.AFFILIATES, SEED_AFFILIATES),
  saveAffiliates: (list: AffiliateProfile[]): void =>
    writeStorage(STORAGE_KEYS.AFFILIATES, list),

  getAffiliateConversions: (): AffiliateConversion[] =>
    readStorage(STORAGE_KEYS.AFFILIATE_CONVERSIONS, SEED_AFFILIATE_CONVERSIONS),
  saveAffiliateConversions: (list: AffiliateConversion[]): void =>
    writeStorage(STORAGE_KEYS.AFFILIATE_CONVERSIONS, list),

  getAffiliatePayouts: (): AffiliatePayoutRequest[] =>
    readStorage(STORAGE_KEYS.AFFILIATE_PAYOUTS, SEED_PAYOUT_REQUESTS),
  saveAffiliatePayouts: (list: AffiliatePayoutRequest[]): void =>
    writeStorage(STORAGE_KEYS.AFFILIATE_PAYOUTS, list),

  getShowcaseSites: (): ShowcaseSite[] =>
    readStorage(STORAGE_KEYS.SHOWCASE_SITES, SEED_SHOWCASE_SITES),
  saveShowcaseSites: (list: ShowcaseSite[]): void =>
    writeStorage(STORAGE_KEYS.SHOWCASE_SITES, list),

  getEvents: (): CoursemartEvent[] =>
    readStorage(STORAGE_KEYS.EVENTS, SEED_EVENTS),
  saveEvents: (list: CoursemartEvent[]): void =>
    writeStorage(STORAGE_KEYS.EVENTS, list),

  getEventRegistrations: (): EventRegistration[] =>
    readStorage(STORAGE_KEYS.EVENT_REGISTRATIONS, SEED_EVENT_REGISTRATIONS),
  saveEventRegistrations: (list: EventRegistration[]): void =>
    writeStorage(STORAGE_KEYS.EVENT_REGISTRATIONS, list),

  getSocialDrafts: (): SocialPostDraft[] =>
    readStorage(STORAGE_KEYS.SOCIAL_DRAFTS, SEED_SOCIAL_DRAFTS),
  saveSocialDrafts: (list: SocialPostDraft[]): void =>
    writeStorage(STORAGE_KEYS.SOCIAL_DRAFTS, list),

  getEmailCampaigns: (): EmailBroadcastCampaign[] =>
    readStorage(STORAGE_KEYS.EMAIL_CAMPAIGNS, SEED_EMAIL_CAMPAIGNS),
  saveEmailCampaigns: (list: EmailBroadcastCampaign[]): void =>
    writeStorage(STORAGE_KEYS.EMAIL_CAMPAIGNS, list),

  getCommunityChannels: (): CommunityChannel[] =>
    readStorage(STORAGE_KEYS.COMMUNITY_CHANNELS, SEED_COMMUNITY_CHANNELS),
  saveCommunityChannels: (list: CommunityChannel[]): void =>
    writeStorage(STORAGE_KEYS.COMMUNITY_CHANNELS, list),

  getCommunityMessages: (): CommunityChatMessage[] =>
    readStorage(STORAGE_KEYS.COMMUNITY_MESSAGES, SEED_COMMUNITY_MESSAGES),
  saveCommunityMessages: (list: CommunityChatMessage[]): void =>
    writeStorage(STORAGE_KEYS.COMMUNITY_MESSAGES, list),

  getForumThreads: (): CommunityForumThread[] =>
    readStorage(STORAGE_KEYS.FORUM_THREADS, SEED_FORUM_THREADS),
  saveForumThreads: (list: CommunityForumThread[]): void =>
    writeStorage(STORAGE_KEYS.FORUM_THREADS, list),

  getForumReplies: (): CommunityForumReply[] =>
    readStorage(STORAGE_KEYS.FORUM_REPLIES, SEED_FORUM_REPLIES),
  saveForumReplies: (list: CommunityForumReply[]): void =>
    writeStorage(STORAGE_KEYS.FORUM_REPLIES, list),

  getActiveReferralCode: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(STORAGE_KEYS.ACTIVE_REFERRAL_CODE);
    } catch {
      return null;
    }
  },
  setActiveReferralCode: (code: string | null): void => {
    if (typeof window === 'undefined') return;
    try {
      if (code) {
        window.localStorage.setItem(STORAGE_KEYS.ACTIVE_REFERRAL_CODE, code);
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.ACTIVE_REFERRAL_CODE);
      }
    } catch {
      // ignore
    }
  },

  getCart: (): CartItem[] => readStorage(STORAGE_KEYS.CART, []),
  saveCart: (cart: CartItem[]): void => writeStorage(STORAGE_KEYS.CART, cart),

  getWishlist: (): string[] => readStorage(STORAGE_KEYS.WISHLIST, ['prod-course-2']),
  saveWishlist: (ids: string[]): void => writeStorage(STORAGE_KEYS.WISHLIST, ids),

  getCurrentUserId: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(STORAGE_KEYS.AUTH_USER_ID);
    } catch {
      return null;
    }
  },
  setCurrentUserId: (userId: string | null): void => {
    if (typeof window === 'undefined') return;
    try {
      if (userId) {
        window.localStorage.setItem(STORAGE_KEYS.AUTH_USER_ID, userId);
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.AUTH_USER_ID);
      }
    } catch {
      // ignore
    }
  },

  getCalendarEngagements: (): CalendarEngagement[] =>
    readStorage(STORAGE_KEYS.CALENDAR_ENGAGEMENTS, SEED_CALENDAR_ENGAGEMENTS),
  saveCalendarEngagements: (engagements: CalendarEngagement[]): void =>
    writeStorage(STORAGE_KEYS.CALENDAR_ENGAGEMENTS, engagements),

  getFacilitatorBookings: (): FacilitatorBooking[] =>
    readStorage<FacilitatorBooking[]>(STORAGE_KEYS.FACILITATOR_BOOKINGS, SEED_FACILITATOR_BOOKINGS),
  saveFacilitatorBooking: (booking: FacilitatorBooking): void => {
    const current = readStorage<FacilitatorBooking[]>(STORAGE_KEYS.FACILITATOR_BOOKINGS, []);
    const index = current.findIndex((b) => b.id === booking.id || b.reference === booking.reference);
    const updated =
      index >= 0
        ? current.map((b) => (b.id === booking.id || b.reference === booking.reference ? booking : b))
        : [...current, booking];
    writeStorage(STORAGE_KEYS.FACILITATOR_BOOKINGS, updated);
  },
  saveFacilitatorBookings: (bookings: FacilitatorBooking[]): void =>
    writeStorage(STORAGE_KEYS.FACILITATOR_BOOKINGS, bookings),
  deleteFacilitatorBooking: (id: string): void => {
    const current = readStorage<FacilitatorBooking[]>(STORAGE_KEYS.FACILITATOR_BOOKINGS, []);
    const updated = current.filter((b) => b.id !== id && b.reference !== id);
    writeStorage(STORAGE_KEYS.FACILITATOR_BOOKINGS, updated);
  },

  resetAllDemoData: (): void => {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(k));
  },
};
