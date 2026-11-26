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
  SEED_GROUP_MEMBERSHIPS,
  SEED_GROUP_MEMBERSHIP_SEATS,
} from '../data/seedData';
import { REAL_WEALTH_TUTORIALS } from '../data/realWealthContent';
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
  GroupMembership,
  GroupMembershipSeat,
  LicenseKey,
  MembershipPlan,
  Order,
  Product,
  ProductReview,
  ShowcaseSite,
  SocialPostDraft,
  StorefrontAppearance,
  PromptVaultItem,
  SavedCustomizedPrompt,
  UserAccount,
  UserMembership,
  WhatsAppGroup,
} from '../types/marketplace';
import type { CalendarEngagement, FacilitatorBooking } from '../types/promoter';
import type { DocumentTutorial } from '../types/tutorial';

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
  APPEARANCE: 'cm_db_appearance_dwc_v1',
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
  GROUP_MEMBERSHIPS: 'cm_db_group_memberships_v1',
  GROUP_MEMBERSHIP_SEATS: 'cm_db_group_membership_seats_v1',
  COMMUNITY_MESSAGES: 'cm_db_community_messages_v1',
  FORUM_THREADS: 'cm_db_forum_threads_v1',
  FORUM_REPLIES: 'cm_db_forum_replies_v1',
  FACILITATOR_BOOKINGS: 'cm_db_facilitator_bookings_v1',
  CALENDAR_ENGAGEMENTS: 'cm_db_calendar_engagements_v1',
  TUTORIALS: 'cm_db_tutorials_v1',
  PROMPT_VAULT_CATEGORIES: 'cm_db_prompt_categories_v1',
  PROMPT_VAULT_ITEMS: 'cm_db_prompt_vault_items_v1',
  STUDENT_SAVED_PROMPTS: 'cm_db_student_saved_prompts_v1',
  ACTIVE_REFERRAL_CODE: 'cm_session_ref_code_v1',
  CART: 'cm_session_cart_ngn_v1',
  WISHLIST: 'cm_session_wishlist_v1',
  AUTH_USER_ID: 'cm_session_user_id_v1',
  DELETED_CONTENT_IDS: 'cm_db_deleted_content_ids_v1',
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

export const SEED_TUTORIALS: DocumentTutorial[] = [
  ...REAL_WEALTH_TUTORIALS,
  {
    id: 'tut-ai-agents-automation',
    slug: 'building-autonomous-multi-model-ai-agents-with-typescript',
    title: 'Building Autonomous Multi-Model AI Agents with TypeScript',
    subtitle: 'From local semantic proxies to offline-deterministic test harnesses',
    description:
      'A comprehensive, production-grade guide to engineering autonomous multi-agent systems with loopback failover and zero token waste.',
    category: 'AI & Engineering',
    authorId: 'user-admin-1',
    authorName: 'Chief AI Architect',
    authorRole: 'Lead Systems Architect',
    authorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
    coverImage:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=630&fit=crop',
    difficulty: 'intermediate',
    readTimeMinutes: 12,
    estimatedMinutes: 12,
    status: 'draft',
    featured: true,
    publishedAt: '2026-11-20T10:00:00.000Z',
    createdAt: '2026-11-20T10:00:00.000Z',
    updatedAt: '2026-11-22T14:30:00.000Z',
    tags: ['AI Agents', 'TypeScript', 'System Architecture', 'Automation'],
    seoTitle: 'Building Autonomous Multi-Model AI Agents with TypeScript',
    seoDescription:
      'Master autonomous multi-model agent engineering with TypeScript, deterministic mocks, and zero-token semantic caching.',
    steps: [
      {
        id: 'tut-step-1-1',
        stepNumber: 1,
        title: 'Architecting the Local Semantic AI Proxy',
        description:
          'Configure an HTTP reverse proxy that intercepts all model calls and evaluates deterministic SHA-256 prompt hashes to guarantee zero token leakage.',
        codeSnippet: `import http from 'node:http';\nimport crypto from 'node:crypto';\n\nconst cache = new Map<string, string>();\n\nexport function createSemanticProxy(port = 8080) {\n  return http.createServer(async (req, res) => {\n    // Intercept and cache requests\n  }).listen(port);\n}`,
        codeLanguage: 'ts',
        calloutType: 'tip',
        calloutNote: 'Always verify port 8080 availability before binding the proxy service.',
        checklist: [
          'Set GOOGLE_GEMINI_BASE_URL',
          'Verify SHA-256 prompt hashing',
          'Validate 4096 output token clamp',
        ],
        durationMinutes: 4,
      },
      {
        id: 'tut-step-1-2',
        stepNumber: 2,
        title: 'Implementing Fallback Model Failover Matrix',
        description:
          'Establish a priority ladder cascading from high-speed Groq and OpenRouter free tiers to Gemini AI Studio to eliminate 429 rate limit outages.',
        codeSnippet: `const MODEL_FALLBACK_CHAIN = [\n  'qwen/qwen3.8-27b',\n  'openai/gpt-oss-120b',\n  'gemini-3.8-flash'\n];`,
        codeLanguage: 'ts',
        calloutType: 'info',
        calloutNote: 'Transparent failovers preserve caller state without triggering exception cascades.',
        checklist: ['Map provider rate limit codes', 'Construct exponential backoff retry handler'],
        durationMinutes: 4,
      },
      {
        id: 'tut-step-1-3',
        stepNumber: 3,
        title: 'Offline Deterministic Test Isolation',
        description:
          'Ensure that all unit and integration test runners mock external network endpoints completely, maintaining zero API token consumption during test runs.',
        codeSnippet: `import test from 'node:test';\nimport assert from 'node:assert/strict';\n\ntest('offline agent execution', async () => {\n  // Deterministic local mock\n});`,
        codeLanguage: 'ts',
        calloutType: 'warning',
        calloutNote: 'Never allow CI or test processes to dial live billable API endpoints.',
        checklist: ['Stub fetch in test suite setup', 'Run test runner offline with exit code 0'],
        durationMinutes: 4,
      },
    ],
  },
  {
    id: 'tut-seo-indexing-masterclass',
    slug: 'automated-search-indexing-technical-seo-pipeline-architecture',
    title: 'Automated Search Indexing & Technical SEO Pipeline Architecture',
    subtitle: 'From dynamic sitemaps and JSON-LD schema to Google Indexing API automation',
    description:
      'Learn how to construct a fully automated, crawler-compliant technical SEO pipeline with dynamic XML feeds, WebSub notifications, and instant search engine pings.',
    category: 'SEO & Growth',
    authorId: 'user-admin-1',
    authorName: 'Cephas Growth Lead',
    authorRole: 'Platform Lead',
    authorAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
    coverImage:
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&h=630&fit=crop',
    difficulty: 'beginner',
    readTimeMinutes: 8,
    estimatedMinutes: 8,
    status: 'published',
    featured: true,
    publishedAt: '2026-11-21T08:00:00.000Z',
    createdAt: '2026-11-21T08:00:00.000Z',
    updatedAt: '2026-11-22T16:00:00.000Z',
    tags: ['SEO', 'Search Indexing', 'JSON-LD', 'Google API'],
    seoTitle: 'Automated Search Indexing & Technical SEO Pipeline Architecture',
    seoDescription:
      'Step-by-step guide to automated search indexing, dynamic XML sitemaps, JSON-LD Schema.org markup, and WebSub syndication.',
    steps: [
      {
        id: 'tut-step-2-1',
        stepNumber: 1,
        title: 'Dynamic XML Sitemap and Robots.txt Generation',
        description:
          'Implement streaming XML sitemaps that aggregate published courses, blog posts, and tutorials with accurate lastmod dates and priority weights.',
        codeSnippet: `export function generateSitemapXml(products, blogPosts, tutorials, baseUrl) {\n  // Build XML with valid namespaces and strict escaping\n}`,
        codeLanguage: 'ts',
        calloutType: 'info',
        calloutNote:
          'Always strictly escape XML entities (&, <, >, ", \') to avoid XML parsing errors.',
        checklist: ['Set proper Content-Type header', 'Filter only published content items'],
        durationMinutes: 4,
      },
      {
        id: 'tut-step-2-2',
        stepNumber: 2,
        title: 'Automating Google Indexing API & WebSub Hub Notifications',
        description:
          'Dispatch URL_UPDATED and URL_DELETED payloads upon content publication so search crawlers index updates within minutes.',
        codeSnippet: `await publishGoogleIndexingNotification(url, 'URL_UPDATED', credentials);`,
        codeLanguage: 'ts',
        calloutType: 'tip',
        calloutNote: 'WebSub hub pings notify RSS readers and syndicators immediately.',
        checklist: ['Configure service account credentials', 'Add rate limiting to dispatch endpoint'],
        durationMinutes: 4,
      },
    ],
  },
];

export const storageService = {
  getDeletedIds: (): Set<string> => {
    const list = readStorage<string[]>(STORAGE_KEYS.DELETED_CONTENT_IDS, []);
    return new Set(Array.isArray(list) ? list : []);
  },
  recordDeletedId: (id: string): void => {
    const list = readStorage<string[]>(STORAGE_KEYS.DELETED_CONTENT_IDS, []);
    const set = new Set(Array.isArray(list) ? list : []);
    set.add(id);
    writeStorage(STORAGE_KEYS.DELETED_CONTENT_IDS, Array.from(set));
  },

  getProducts: (): Product[] => {
    const list = readStorage(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
    if (!Array.isArray(list)) return [];
    const deletedIds = storageService.getDeletedIds();
    const seedStatusMap = new Map(SEED_PRODUCTS.map((p) => [p.id, p.status]));
    const existingIds = new Set(list.map((p) => p.id));
    const missing = SEED_PRODUCTS.filter((p) => !existingIds.has(p.id) && !deletedIds.has(p.id));
    const combined = missing.length > 0 ? [...missing, ...list] : list;
    return combined
      .filter((p) => !deletedIds.has(p.id))
      .map((p) => {
        const seedStatus = seedStatusMap.get(p.id);
        const effectiveStatus = seedStatus === 'draft' ? 'draft' : p.status;
        let item = p.status !== effectiveStatus ? { ...p, status: effectiveStatus } : p;
        if (item && item.includedInMembershipTier && ['starter', 'pro', 'vip', 'enterprise'].includes(item.includedInMembershipTier as string)) {
          return {
            ...item,
            includedInMembershipTier: migrateLegacyTier(item.includedInMembershipTier),
          };
        }
        return item;
      });
  },
  saveProducts: (products: Product[]): void => writeStorage(STORAGE_KEYS.PRODUCTS, products),

  getBlogPosts: (): BlogPost[] => {
    const list = readStorage(STORAGE_KEYS.BLOGS, SEED_BLOG_POSTS);
    if (!Array.isArray(list)) return [];
    const deletedIds = storageService.getDeletedIds();
    const seedStatusMap = new Map(SEED_BLOG_POSTS.map((b) => [b.id, b.status]));
    const existingIds = new Set(list.map((b) => b.id));
    const missing = SEED_BLOG_POSTS.filter((b) => !existingIds.has(b.id) && !deletedIds.has(b.id));
    const combined = missing.length > 0 ? [...missing, ...list] : list;
    return combined
      .filter((b) => !deletedIds.has(b.id))
      .map((b) => {
        const seedStatus = seedStatusMap.get(b.id);
        const effectiveStatus = seedStatus === 'draft' ? 'draft' : b.status;
        return b.status !== effectiveStatus ? { ...b, status: effectiveStatus } : b;
      });
  },
  saveBlogPosts: (posts: BlogPost[]): void => writeStorage(STORAGE_KEYS.BLOGS, posts),

  getTutorials: (): DocumentTutorial[] => {
    const list = readStorage(STORAGE_KEYS.TUTORIALS, SEED_TUTORIALS);
    if (!Array.isArray(list)) return [];
    const deletedIds = storageService.getDeletedIds();
    const seedStatusMap = new Map(SEED_TUTORIALS.map((t) => [t.id, t.status]));
    const existingIds = new Set(list.map((t) => t.id));
    const missing = SEED_TUTORIALS.filter((t) => !existingIds.has(t.id) && !deletedIds.has(t.id));
    const combined = missing.length > 0 ? [...missing, ...list] : list;
    return combined
      .filter((t) => !deletedIds.has(t.id))
      .map((t) => {
        const seedStatus = seedStatusMap.get(t.id);
        const effectiveStatus = seedStatus === 'draft' ? 'draft' : t.status;
        return t.status !== effectiveStatus ? { ...t, status: effectiveStatus } : t;
      });
  },
  saveTutorials: (tutorials: DocumentTutorial[]): void =>
    writeStorage(STORAGE_KEYS.TUTORIALS, tutorials),

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
    if (typeof window !== 'undefined') {
      try {
        ['cm_db_appearance_v1', 'cm_db_appearance_v2', 'cm_db_appearance_v3'].forEach((k) => {
          const item = window.localStorage.getItem(k);
          if (item && item.toLowerCase().includes('coursemart')) {
            window.localStorage.removeItem(k);
          }
        });
      } catch {
        // Safe storage fallback
      }
    }
    const raw = readStorage(STORAGE_KEYS.APPEARANCE, DEFAULT_APPEARANCE);
    if (!raw || !raw.brandName || raw.brandName.toLowerCase().includes('coursemart')) {
      const refreshed: StorefrontAppearance = {
        ...DEFAULT_APPEARANCE,
        ...raw,
        brandName: 'DIGITAL WEALTH CREATORS',
        heroTitle: (!raw?.heroTitle || raw.heroTitle.toLowerCase().includes('coursemart'))
          ? DEFAULT_APPEARANCE.heroTitle
          : raw.heroTitle,
        heroSubtitle: (!raw?.heroSubtitle || raw.heroSubtitle.toLowerCase().includes('coursemart'))
          ? DEFAULT_APPEARANCE.heroSubtitle
          : raw.heroSubtitle,
      };
      writeStorage(STORAGE_KEYS.APPEARANCE, refreshed);
      return refreshed;
    }
    return raw;
  },
  saveAppearance: (appearance: StorefrontAppearance): void => {
    const sanitized: StorefrontAppearance = {
      ...appearance,
      brandName: (!appearance.brandName || appearance.brandName.toLowerCase().includes('coursemart'))
        ? 'DIGITAL WEALTH CREATORS'
        : appearance.brandName,
    };
    writeStorage(STORAGE_KEYS.APPEARANCE, sanitized);
  },

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

  getEvents: (): CoursemartEvent[] => {
    const list = readStorage(STORAGE_KEYS.EVENTS, SEED_EVENTS);
    if (!Array.isArray(list)) return [];
    const deletedIds = storageService.getDeletedIds();
    const seedStatusMap = new Map(SEED_EVENTS.map((e) => [e.id, e.status]));
    const existingIds = new Set(list.map((e) => e.id));
    const missing = SEED_EVENTS.filter((e) => !existingIds.has(e.id) && !deletedIds.has(e.id));
    const combined = missing.length > 0 ? [...missing, ...list] : list;
    return combined
      .filter((e) => !deletedIds.has(e.id))
      .map((e) => {
        const seedStatus = seedStatusMap.get(e.id);
        const effectiveStatus = seedStatus === 'draft' ? 'draft' : e.status;
        return e.status !== effectiveStatus ? { ...e, status: effectiveStatus } : e;
      });
  },
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

  getGroupMemberships: (): GroupMembership[] =>
    readStorage(STORAGE_KEYS.GROUP_MEMBERSHIPS, SEED_GROUP_MEMBERSHIPS),
  saveGroupMemberships: (list: GroupMembership[]): void =>
    writeStorage(STORAGE_KEYS.GROUP_MEMBERSHIPS, list),

  getGroupMembershipSeats: (): GroupMembershipSeat[] =>
    readStorage(STORAGE_KEYS.GROUP_MEMBERSHIP_SEATS, SEED_GROUP_MEMBERSHIP_SEATS),
  saveGroupMembershipSeats: (list: GroupMembershipSeat[]): void =>
    writeStorage(STORAGE_KEYS.GROUP_MEMBERSHIP_SEATS, list),

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

  getPromptVaultCategories: (): string[] =>
    readStorage(STORAGE_KEYS.PROMPT_VAULT_CATEGORIES, [
      'Copywriting & Marketing',
      'AI Engineering & Coding',
      'Business & Strategy',
      'Content Creation',
      'Productivity',
      'LMS & Education',
      'Photography & Camera Prompts',
    ]),
  savePromptVaultCategories: (list: string[]): void =>
    writeStorage(STORAGE_KEYS.PROMPT_VAULT_CATEGORIES, list),

  getCustomPromptVaultItems: (): PromptVaultItem[] =>
    readStorage(STORAGE_KEYS.PROMPT_VAULT_ITEMS, []),
  saveCustomPromptVaultItems: (list: PromptVaultItem[]): void =>
    writeStorage(STORAGE_KEYS.PROMPT_VAULT_ITEMS, list),

  getStudentSavedPrompts: (): SavedCustomizedPrompt[] =>
    readStorage(STORAGE_KEYS.STUDENT_SAVED_PROMPTS, []),
  saveStudentSavedPrompts: (list: SavedCustomizedPrompt[]): void =>
    writeStorage(STORAGE_KEYS.STUDENT_SAVED_PROMPTS, list),

  resetAllDemoData: (): void => {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(k));
  },
};
