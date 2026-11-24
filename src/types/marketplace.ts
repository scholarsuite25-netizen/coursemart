export type UserRole = 'customer' | 'instructor' | 'admin' | 'student';

export type ProductType = 'course' | 'ebook' | 'software';

export type DigitalResourceSubType = 'ebook' | 'template' | 'toolkit';

export type ProductStatus = 'published' | 'draft';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';

export type BlogCategory =
  | 'AI'
  | 'Mentorship'
  | 'Leadership'
  | 'Vibe Coding'
  | 'Apps Deployment';

export type BlogStatus = 'published' | 'draft' | 'scheduled';

export type BlogBlockType = 'section' | 'image' | 'callout' | 'checklist' | 'quote' | 'code';

export interface BlogSection {
  id: string;
  blockType?: BlogBlockType;
  heading: string;
  body: string;
  codeSnippet?: string;
  pullQuote?: string;
  imageUrl?: string;
  imageCaption?: string;
  imageAlt?: string;
  imageAlign?: 'center' | 'wide' | 'left' | 'right';
  checklistItems?: string[];
  calloutTone?: 'info' | 'tip' | 'warning';
}

export interface BlogComment {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  body: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: BlogCategory;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  coverImage: string;
  readTimeMinutes: number;
  publishedAt: string;
  updatedAt: string;
  scheduledAt?: string;
  status: BlogStatus;
  featured: boolean;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  sections: BlogSection[];
  relatedProductIds: string[];
  comments: BlogComment[];
}

export interface CourseQuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CourseQuiz {
  id: string;
  title: string;
  passingScore: number;
  questions: CourseQuizQuestion[];
}

export interface LectureChapterMarker {
  timeSeconds: number;
  label: string;
}

export interface CourseLecture {
  id: string;
  title: string;
  durationMinutes: number;
  isPreview: boolean;
  lectureType?: 'video' | 'article' | 'exercise' | 'text' | 'mixed';
  summary: string;
  keyTakeaways: string[];
  description?: string;
  resourceFileName?: string;
  chapters?: LectureChapterMarker[];
  transcript?: string;
  videoUrl?: string;
  textContent?: string;
  downloadUrl?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  lectures: CourseLecture[];
  durationMinutes?: number;
  quiz?: CourseQuiz;
}

export interface CourseAnnouncement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface EbookChapter {
  id: string;
  number: number;
  title: string;
  pages: number;
  previewExcerpt: string;
}

export interface SoftwareLicenseTier {
  id: string;
  name: string;
  seats: number;
  priceMultiplier: number;
  description: string;
}

export interface SoftwareReleaseNote {
  version: string;
  date: string;
  highlights: string[];
}

export interface DigitalProductVariant {
  id: string;
  name: string;
  sku: string;
  format: string;
  priceDelta: number;
  licenseType: 'Personal' | 'Team' | 'Commercial Agency';
  downloadLimit: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type MembershipTierId = 'free' | 'paid';
export type LegacyMembershipTierId = 'starter' | 'pro' | 'vip' | 'enterprise';

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  type: ProductType;
  digitalSubType?: DigitalResourceSubType;
  category: string;
  instructorId: string;
  instructorName: string;
  instructorRole: string;
  instructorAvatar: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  studentsCount: number;
  thumbnail: string;
  galleryImages?: string[];
  level: DifficultyLevel;
  language: string;
  updatedAt: string;
  status: ProductStatus;
  isPublished?: boolean;
  featured: boolean;
  bestseller?: boolean;
  isPremium?: boolean;
  copyProtectionEnabled?: boolean;
  learningOutcomes: string[];
  requirements: string[];
  targetAudience?: string[];
  formatLabel: string;
  includedInMembershipTier?: MembershipTierId;
  bundleProductIds?: string[];
  downloadLimit?: number;
  downloadUrl?: string;
  variants?: DigitalProductVariant[];
  digitalResourceMeta?: {
    deliverableFormat: string;
    itemsCountLabel: string;
    compatibility: string;
    includedAssets: string[];
    downloadUrl?: string;
    sku?: string;
    version?: string;
    changelog?: SoftwareReleaseNote[];
  };
  courseData?: {
    totalHours: number;
    courseFormat?: 'video' | 'text' | 'mixed';
    modules: CourseModule[];
    announcements?: CourseAnnouncement[];
    promoHighlights?: string[];
  };
  ebookData?: {
    pages: number;
    formats: string[];
    isbn: string;
    fileSize: string;
    downloadUrl?: string;
    chapters: EbookChapter[];
  };
  softwareData?: {
    version: string;
    platforms: string[];
    fileSize: string;
    downloadUrl?: string;
    licenseTiers: SoftwareLicenseTier[];
    releases: SoftwareReleaseNote[];
  };
}

export interface CartItem {
  productId: string;
  tierId?: string;
  tierName?: string;
  seats?: number;
  variantId?: string;
  variantName?: string;
  sku?: string;
  unitPrice: number;
  isPremium?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  value: number;
  minSpend: number;
  active: boolean;
  usageCount: number;
  maxUses: number;
  expiresAt: string;
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  productType: ProductType;
  price: number;
  tierName?: string;
  seats?: number;
  variantName?: string;
  sku?: string;
}

export type OrderStatus = 'completed' | 'pending' | 'refunded';

export type PaymentMethod = 'paystack' | 'card' | 'gtb_whatsapp';

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  membershipDiscount?: number;
  taxAmount?: number;
  couponCode?: string;
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  senderName?: string;
  orderNotes?: string;
  affiliateCode?: string;
  refundStatus?: 'none' | 'requested' | 'approved' | 'declined';
  refundReason?: string;
  downloadCounts?: Record<string, number>;
  createdAt: string;
}

export interface WhatsAppGroup {
  id: string;
  name: string;
  description: string;
  inviteUrl: string;
  category: 'course' | 'ebook' | 'software' | 'vip' | 'general';
  productId?: string;
  membersCount: number;
  maxMembers: number;
  active: boolean;
  visibility: 'public' | 'enrolled_only';
  createdAt: string;
}

// ==========================================
// In-Platform Community Module (R1)
// ==========================================

export type CommunityChannelCategory =
  | 'general'
  | 'announcements'
  | 'course'
  | 'software'
  | 'vip';

export type CommunityVisibility = 'public' | 'enrolled_only' | 'members_only';

export interface CommunityChannel {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: CommunityChannelCategory;
  visibility: CommunityVisibility;
  accessLevel?: 'public' | 'enrolled' | 'members' | CommunityVisibility;
  productId?: string;
  isReadOnly?: boolean;
  isArchived?: boolean;
  icon?: string;
  memberCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityChatMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  authorId?: string;
  authorName?: string;
  authorRole?: UserRole;
  content: string;
  replyToId?: string;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  isPinned?: boolean;
  isModerated?: boolean;
  moderationReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ForumCategory =
  | 'Architecture & Systems'
  | 'AI & Vibe Coding'
  | 'Course Q&A'
  | 'Career & Leadership'
  | 'Showcase & Feedback'
  | 'Announcements';

export interface CommunityForumThread {
  id: string;
  slug: string;
  title: string;
  body: string;
  content?: string;
  category: ForumCategory | string;
  productId?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  tags: string[];
  upvotes: number;
  upvotedUserIds: string[];
  viewsCount: number;
  replyCount: number;
  isPinned: boolean;
  pinned?: boolean;
  isLocked: boolean;
  isSolved: boolean;
  solutionReplyId?: string;
  isModerated?: boolean;
  moderationReason?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export interface CommunityForumReply {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  body: string;
  content?: string;
  upvotes: number;
  upvotedUserIds: string[];
  isSolution?: boolean;
  isPinned?: boolean;
  isModerated?: boolean;
  moderationReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunitySummaryStats {
  totalChannels: number;
  totalMessages: number;
  totalThreads: number;
  totalReplies: number;
  solvedThreadsCount: number;
}

export interface LicenseKey {
  id: string;
  key: string;
  productId: string;
  productTitle: string;
  userId: string;
  orderId: string;
  tierName: string;
  maxSeats: number;
  activatedDomains: string[];
  status: 'active' | 'revoked';
  createdAt: string;
}

export interface LectureQuestion {
  id: string;
  lectureId: string;
  userName: string;
  question: string;
  answer?: string;
  createdAt: string;
}

export interface TimestampedNote {
  id: string;
  timeLabel: string;
  text: string;
  createdAt: string;
}

export interface ModuleQuizResult {
  scorePercent: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  completedAt: string;
}

export interface CourseProgress {
  userId: string;
  productId: string;
  completedLectureIds: string[];
  lastLectureId?: string;
  notesByLecture: Record<string, string>;
  timestampedNotesByLecture?: Record<string, TimestampedNote[]>;
  quizScoresByModule?: Record<string, ModuleQuizResult>;
  certificateCode?: string;
  questions: LectureQuestion[];
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  title?: string;
  status?: 'active' | 'suspended' | string;
  newsletterOptIn?: boolean;
  newsletterOptedInAt?: string;
  purchasedProductIds?: string[];
  enrolledCourseIds?: string[];
  createdAt?: string;
  joinedAt: string;
}

export interface MembershipPlan {
  id: MembershipTierId;
  name: string;
  audienceLabel: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number; // ₦10,000 for a year
  masterclassPrice?: number; // ₦25,000 for one year access to all resources and master class online training
  oneTimePrice?: number; // Compatibility alias
  includesOnlineTraining?: boolean;
  includesMasterclassTraining?: boolean;
  storeDiscountPercent: number;
  courseAccessLabel: string;
  digitalAccessLabel: string;
  supportLevel: string;
  featured?: boolean;
  perks: string[];
}

export type MembershipBillingCycle =
  | 'annual'
  | 'masterclass'
  | 'onetime'
  | 'monthly'
  | 'lifetime';

export interface UserMembership {
  id: string;
  userId: string;
  planId: MembershipTierId;
  billingCycle: MembershipBillingCycle;
  status: 'active' | 'pending' | 'cancelled';
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  startedAt: string;
  renewsAt: string;
}

export interface AffiliateProfile {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  code: string;
  commissionRate: number;
  clicks: number;
  payoutMethod: 'GTB Bank Transfer' | 'Bank Wire' | 'WhatsApp Settlement';
  bankDetails: string;
  active: boolean;
  joinedAt: string;
}

export type Affiliate = AffiliateProfile;

export interface AffiliateConversion {
  id: string;
  affiliateCode: string;
  affiliateUserId: string;
  orderId: string;
  buyerName: string;
  orderTotal: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'declined';
  createdAt: string;
}

export interface AffiliateCommissionRecord extends AffiliateConversion {
  amount?: number;
}

export interface AffiliatePayoutRequest {
  id: string;
  affiliateUserId: string;
  affiliateName: string;
  affiliateCode: string;
  amount: number;
  bankDetails: string;
  status: 'pending' | 'paid' | 'declined';
  requestedAt: string;
  processedAt?: string;
}

export interface ShowcaseSite {
  id: string;
  name: string;
  url: string;
  image: string;
  active: boolean;
  order: number;
  createdAt: string;
}

export interface StorefrontAppearance {
  brandName: string;
  accentTheme: 'indigo' | 'emerald' | 'cobalt';
  announcementEnabled: boolean;
  announcementText: string;
  announcementCoupon: string;
  announcementCountdownEnabled: boolean;
  announcementEndsAt?: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  showFeaturedSection: boolean;
  showCatalogSection: boolean;
  showTrustStrip: boolean;
  sectionOrder: Array<'featured' | 'catalog' | 'trust'>;
  globalCopyProtection?: boolean;
}

export interface ProductFilterState {
  type: ProductType | 'all';
  category: string;
  minRating: number;
  priceFilter: 'all' | 'under-30000' | '30000-60000' | 'over-60000';
  level: DifficultyLevel | 'all';
  search: string;
  sortBy: 'popular' | 'rating' | 'price-asc' | 'price-desc' | 'newest';
}

export type EventFormat = 'online-course' | 'seminar' | 'workshop';

export type EventDeliveryMode =
  | 'Live Virtual (Zoom / Meet)'
  | 'Live Virtual (Zoom/Meet)'
  | 'Hybrid (In-Person + Live Stream)'
  | 'In-Person Studio';

export interface PreEventMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'slides' | 'repo' | 'checklist' | 'video';
  urlOrNotes: string;
  summary: string;
}

export interface CoursemartEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  format: EventFormat;
  category: string;
  deliveryMode: EventDeliveryMode;
  locationOrLink: string;
  startAt: string;
  endAt: string;
  timezone: string;
  speakerName: string;
  speakerRole: string;
  speakerAvatar: string;
  coverImage: string;
  price: number;
  isFree?: boolean;
  capacity: number;
  status: 'published' | 'draft' | 'completed';
  featured: boolean;
  agenda: string[];
  preEventMaterials: PreEventMaterial[];
  acknowledgementMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

export type EventItem = CoursemartEvent;

export interface EventRegistration {
  id: string;
  userId?: string;
  eventId: string;
  eventTitle?: string;
  fullName: string;
  email: string;
  phone?: string;
  organization?: string;
  roleTitle: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  attendanceMode: 'Live Virtual' | 'In-Person' | 'On-Demand Replay';
  learningGoals?: string;
  newsletterOptIn: boolean;
  confirmationCode: string;
  paymentStatus: 'free' | 'paid_paystack' | 'pending_paystack' | 'pending_gtb';
  paymentReference?: string;
  preEventMaterialsSentAt?: string;
  acknowledgementEmailStatus?: 'sent_via_esp' | 'queued_no_esp_key' | 'in_app_ready';
  registeredAt: string;
}

export type SocialPlatform =
  | 'linkedin'
  | 'x'
  | 'whatsapp_group'
  | 'instagram'
  | 'facebook'
  | 'youtube';

export interface SocialPostDraft {
  id: string;
  sourceType: 'blog' | 'product' | 'event';
  sourceId: string;
  sourceTitle: string;
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  status: 'draft' | 'scheduled' | 'posted';
  scheduledFor?: string;
  generatedBy: 'gemini' | 'template';
  createdAt: string;
  updatedAt: string;
  targetUrl?: string;
  imageUrl?: string;
  mediaUrl?: string;
  error?: string;
  dispatchedAt?: string;
  externalPostId?: string;
}

export type EmailBroadcastAudience =
  | 'newsletter_opted_in'
  | 'event_registrants';

export interface EmailBroadcastCampaign {
  id: string;
  subject: string;
  preheader: string;
  bodyHtml: string;
  audience: EmailBroadcastAudience;
  eventIdFilter?: string;
  recipientCount: number;
  provider: 'emailbump' | 'resend' | 'brevo' | 'draft_only';
  status: 'sent' | 'draft' | 'failed';
  errorMessage?: string;
  createdAt: string;
  sentAt?: string;
}

export interface PublicServerConfig {
  supabaseConfigured: boolean;
  paystackConfigured: boolean;
  paystackPublicKey: string | null;
  emailProvider: 'emailbump' | 'resend' | 'brevo' | 'none';
  emailProvidersConfigured?: Array<'emailbump' | 'resend' | 'brevo'>;
  hasGeminiKey: boolean;
}

// ==========================================
// Operational Automation Agents (R2)
// ==========================================

export type AgentTaskType =
  | 'blog_publisher'
  | 'enquiry_responder'
  | 'site_updater'
  | 'security_scanner';

export type AgentRunStatus = 'idle' | 'running' | 'success' | 'error';

export interface AgentIncident {
  id: string;
  agentType: 'security_scanner' | 'blog_publisher' | 'site_updater';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  reason: string;
  details?: {
    distinctIps?: number;
    downloadCount?: number;
    ipAddresses?: string[];
    productId?: string;
    licenseKey?: string;
    [key: string]: unknown;
  };
  status: 'unresolved' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
}

export interface BlogPublisherResult {
  publishedCount: number;
  publishedPostIds: string[];
  socialDraftsCreated?: number;
  updatedPosts?: BlogPost[];
  timestamp?: string;
}

export interface EnquiryAgentRequest {
  question: string;
  category?: string;
  context?: {
    courseName?: string;
    lectureTitle?: string;
    productId?: string;
    lectureId?: string;
  };
}

export interface EnquiryAgentResponse {
  answer: string;
  matchedTopics: string[];
  confidence: number;
  suggestedForumThreadSlug?: string;
  generatedBy?: 'gemini' | 'deterministic';
}

export interface SiteUpdateResult {
  bestsellerIds: string[];
  bestsellerCount: number;
  announcement: {
    text: string;
    couponCode?: string;
  };
  updatedProducts?: Product[];
  timestamp?: string;
}

export interface SecurityScanAnomaly {
  userId: string;
  reason: string;
  distinctIps: number;
  downloadCount: number;
  ipAddresses?: string[];
}

export interface SecurityScanResult {
  flaggedUserIds: string[];
  anomalies: SecurityScanAnomaly[];
  scannedCount?: number;
  incidentsCreated?: number;
  timestamp?: string;
}

// ==========================================
// Sales Funnels & Member Prompt Vault (R4)
// ==========================================

export type SalesFunnelStep = 'offer' | 'checkout' | 'upsell' | 'confirmation';

export interface SalesFunnelOrderBump {
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  description: string;
  highlightText?: string;
  thumbnail?: string;
}

export interface SalesFunnelUpsell {
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  headline: string;
  description: string;
  benefits: string[];
  thumbnail?: string;
  declineText?: string;
}

export interface SalesFunnelSocialProof {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
  rating?: number;
}

export interface SalesFunnelConfig {
  id: string;
  slug: string;
  title: string;
  headline: string;
  subheadline?: string;
  videoUrl?: string;
  videoPoster?: string;
  mainProductId: string;
  mainProductPrice?: number; // Override price or defaults to product price
  badgeText?: string;
  features?: string[];
  orderBump?: SalesFunnelOrderBump;
  upsell?: SalesFunnelUpsell;
  socialProof?: SalesFunnelSocialProof[];
  guaranteeBadge?: string;
  active: boolean;
  createdAt?: string;
}

export interface FunnelOrderTotals {
  subtotal: number;
  bumpAmount: number;
  upsellAmount: number;
  discount?: number;
  total: number;
}

export interface FunnelCheckoutPayload {
  funnelId: string;
  funnelSlug: string;
  items: OrderItem[];
  subtotal: number;
  bumpAmount: number;
  upsellAmount: number;
  discount: number;
  total: number;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  senderName?: string;
  orderNotes?: string;
  affiliateCode?: string;
  status: OrderStatus;
}

export interface PromptVariable {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  description?: string;
  type?: 'text' | 'textarea' | 'select';
  options?: string[];
}

export type PromptVaultCategory =
  | 'All'
  | 'Copywriting & Marketing'
  | 'AI Engineering & Coding'
  | 'Business & Strategy'
  | 'Content Creation'
  | 'Productivity'
  | 'LMS & Education'
  | 'Photography & Camera Prompts';

export interface PromptVaultItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: PromptVaultCategory | string;
  tags: string[];
  template: string;
  variables: PromptVariable[];
  sampleOutput?: string;
  recommendedModel?: string;
  membershipTierRequired?: MembershipTierId;
  isFeatured?: boolean;
  copyCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PromptInterpolationResult {
  prompt: string;
  missingVariables: string[];
  isComplete: boolean;
}

export interface PromptVaultAccessResult {
  accessible: boolean;
  reason?: string;
}

export interface SavedCustomizedPrompt {
  id: string;
  originalPromptId?: string;
  title: string;
  category: string;
  customizedPrompt: string;
  formValues?: Record<string, string>;
  savedAt: string;
  notes?: string;
}



