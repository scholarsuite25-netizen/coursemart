export type UserRole = 'customer' | 'instructor' | 'admin';

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
  lectureType?: 'video' | 'article' | 'exercise';
  summary: string;
  keyTakeaways: string[];
  resourceFileName?: string;
  chapters?: LectureChapterMarker[];
  transcript?: string;
  videoUrl?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  lectures: CourseLecture[];
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

export type MembershipTierId = 'starter' | 'pro' | 'vip';

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
  featured: boolean;
  bestseller?: boolean;
  learningOutcomes: string[];
  requirements: string[];
  targetAudience?: string[];
  formatLabel: string;
  includedInMembershipTier?: MembershipTierId;
  bundleProductIds?: string[];
  downloadLimit?: number;
  variants?: DigitalProductVariant[];
  digitalResourceMeta?: {
    deliverableFormat: string;
    itemsCountLabel: string;
    compatibility: string;
    includedAssets: string[];
    sku?: string;
    version?: string;
    changelog?: SoftwareReleaseNote[];
  };
  courseData?: {
    totalHours: number;
    modules: CourseModule[];
    announcements?: CourseAnnouncement[];
    promoHighlights?: string[];
  };
  ebookData?: {
    pages: number;
    formats: string[];
    isbn: string;
    fileSize: string;
    chapters: EbookChapter[];
  };
  softwareData?: {
    version: string;
    platforms: string[];
    fileSize: string;
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
  newsletterOptIn?: boolean;
  newsletterOptedInAt?: string;
  joinedAt: string;
}

export interface MembershipPlan {
  id: MembershipTierId;
  name: string;
  audienceLabel: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  storeDiscountPercent: number;
  courseAccessLabel: string;
  digitalAccessLabel: string;
  supportLevel: string;
  featured?: boolean;
  perks: string[];
}

export interface UserMembership {
  id: string;
  userId: string;
  planId: MembershipTierId;
  billingCycle: 'monthly' | 'annual';
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
  capacity: number;
  status: 'published' | 'draft' | 'completed';
  featured: boolean;
  agenda: string[];
  preEventMaterials: PreEventMaterial[];
  acknowledgementMessage: string;
  createdAt: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
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
  acknowledgementEmailStatus: 'sent_via_esp' | 'queued_no_esp_key' | 'in_app_ready';
  registeredAt: string;
}

export type SocialPlatform = 'linkedin' | 'x' | 'whatsapp_group';

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

