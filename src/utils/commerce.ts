import type {
  CartItem,
  Coupon,
  CourseModule,
  MembershipTierId,
  Product,
  ProductFilterState,
  UserMembership,
} from '../types/marketplace';
import { formatNaira } from './currency.ts';

/**
 * Idempotent legacy membership tier migration function.
 * Normalizes legacy tiers ('pro', 'vip', 'enterprise', 'starter') to 'paid'.
 * Unassigned or unknown tiers default to 'free'.
 */
export function migrateLegacyTier(tier: MembershipTierId | string | null | undefined): 'free' | 'paid' {
  if (!tier) return 'free';
  const normalized = tier.toString().trim().toLowerCase();
  if (['paid', 'pro', 'vip', 'enterprise', 'starter'].includes(normalized)) {
    return 'paid';
  }
  return 'free';
}

/**
 * Idempotently migrates an array of UserMembership records to canonical 'free' | 'paid' tiers.
 */
export function migrateUserMemberships(memberships: UserMembership[]): UserMembership[] {
  if (!Array.isArray(memberships)) return [];
  return memberships.map((m) => {
    if (!m) return m;
    return {
      ...m,
      planId: migrateLegacyTier(m.planId),
    };
  });
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon: Coupon | null;
  couponError: string | null;
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function validateCouponCode(
  rawCode: string,
  coupons: Coupon[],
  subtotal: number,
  nowDate: Date = new Date()
): { coupon: Coupon | null; error: string | null } {
  const normalized = rawCode.trim().toUpperCase();
  if (!normalized) {
    return { coupon: null, error: null };
  }

  const found = coupons.find((c) => c.code.toUpperCase() === normalized);
  if (!found) {
    return { coupon: null, error: `Coupon "${normalized}" was not found.` };
  }
  if (!found.active) {
    return { coupon: null, error: `Coupon "${normalized}" is currently inactive.` };
  }
  if (found.usageCount >= found.maxUses) {
    return { coupon: null, error: `Coupon "${normalized}" has reached its redemption limit.` };
  }
  const expiry = new Date(found.expiresAt);
  if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < nowDate.getTime()) {
    return { coupon: null, error: `Coupon "${normalized}" has expired.` };
  }
  if (subtotal < found.minSpend) {
    return {
      coupon: null,
      error: `Minimum spend of ${formatNaira(found.minSpend)} required for "${normalized}".`,
    };
  }
  return { coupon: found, error: null };
}

export function calculateCartTotals(
  items: CartItem[],
  coupons: Coupon[],
  couponCodeInput: string,
  nowDate: Date = new Date()
): CartTotals {
  const subtotal = roundCurrency(
    items.reduce((sum, item) => sum + Math.max(0, item.unitPrice), 0)
  );

  if (items.length === 0) {
    return {
      subtotal: 0,
      discount: 0,
      total: 0,
      appliedCoupon: null,
      couponError: null,
    };
  }

  const { coupon, error } = validateCouponCode(
    couponCodeInput,
    coupons,
    subtotal,
    nowDate
  );

  if (!coupon) {
    return {
      subtotal,
      discount: 0,
      total: subtotal,
      appliedCoupon: null,
      couponError: error,
    };
  }

  const rawDiscount =
    coupon.discountType === 'percent'
      ? subtotal * (coupon.value / 100)
      : coupon.value;
  const discount = roundCurrency(Math.min(subtotal, Math.max(0, rawDiscount)));
  const total = roundCurrency(Math.max(0, subtotal - discount));

  return {
    subtotal,
    discount,
    total,
    appliedCoupon: coupon,
    couponError: null,
  };
}

export function generateLicenseKey(
  prefix: string = 'CM',
  seedInput?: string
): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const cleanPrefix = prefix
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3) || 'CM';

  const makeSegment = (offset: number): string => {
    let out = '';
    for (let i = 0; i < 4; i++) {
      let idx: number;
      if (seedInput) {
        const charCode = seedInput.charCodeAt((offset * 4 + i) % seedInput.length);
        idx = (charCode * 31 + offset * 17 + i * 13) % alphabet.length;
      } else {
        idx = Math.floor(Math.random() * alphabet.length);
      }
      out += alphabet[idx];
    }
    return out;
  };

  return `${cleanPrefix}-${makeSegment(1)}-${makeSegment(2)}-${makeSegment(3)}-${makeSegment(4)}`;
}

export function getTotalLectureCount(product: Product): number {
  if (!product.courseData) return 0;
  return product.courseData.modules.reduce(
    (count, mod) => count + mod.lectures.length,
    0
  );
}

export function calculateCourseProgressPercent(
  product: Product,
  completedLectureIds: string[]
): number {
  const total = getTotalLectureCount(product);
  if (total === 0) return 0;
  const validIds = new Set(
    product.courseData!.modules.flatMap((m) => m.lectures.map((l) => l.id))
  );
  const completedCount = new Set(
    completedLectureIds.filter((id) => validIds.has(id))
  ).size;
  return Math.min(100, Math.round((completedCount / total) * 100));
}

export interface ModuleProgressStats {
  completedCount: number;
  totalCount: number;
  percent: number;
  isCompleted: boolean;
}

export function calculateModuleProgress(
  module: NonNullable<Product['courseData']>['modules'][number],
  completedLectureIds: string[]
): ModuleProgressStats {
  const totalCount = module.lectures.length;
  if (totalCount === 0) {
    return { completedCount: 0, totalCount: 0, percent: 0, isCompleted: false };
  }
  const completedSet = new Set(completedLectureIds);
  const completedCount = module.lectures.filter((l) => completedSet.has(l.id)).length;
  const percent = Math.round((completedCount / totalCount) * 100);
  return {
    completedCount,
    totalCount,
    percent,
    isCompleted: completedCount === totalCount,
  };
}

export function toggleModuleLecturesCompletion(
  module: NonNullable<Product['courseData']>['modules'][number],
  completedLectureIds: string[]
): string[] {
  const moduleLectureIds = module.lectures.map((l) => l.id);
  const moduleIdSet = new Set(moduleLectureIds);
  const currentSet = new Set(completedLectureIds);
  const allCompleted =
    moduleLectureIds.length > 0 && moduleLectureIds.every((id) => currentSet.has(id));

  if (allCompleted) {
    return completedLectureIds.filter((id) => !moduleIdSet.has(id));
  }
  const next = new Set(completedLectureIds);
  moduleLectureIds.forEach((id) => next.add(id));
  return Array.from(next);
}

export interface CourseProgressSummary {
  completedLectures: number;
  totalLectures: number;
  completedModules: number;
  totalModules: number;
  percent: number;
}

export function getCourseProgressSummary(
  product: Product,
  completedLectureIds: string[]
): CourseProgressSummary {
  if (!product.courseData) {
    return {
      completedLectures: 0,
      totalLectures: 0,
      completedModules: 0,
      totalModules: 0,
      percent: 0,
    };
  }
  const modules = product.courseData.modules;
  const validIds = new Set(modules.flatMap((m) => m.lectures.map((l) => l.id)));
  const completedSet = new Set(completedLectureIds.filter((id) => validIds.has(id)));
  const totalLectures = validIds.size;
  const completedLectures = completedSet.size;
  const totalModules = modules.length;
  const completedModules = modules.filter(
    (m) => m.lectures.length > 0 && m.lectures.every((l) => completedSet.has(l.id))
  ).length;
  const percent =
    totalLectures === 0 ? 0 : Math.min(100, Math.round((completedLectures / totalLectures) * 100));

  return {
    completedLectures,
    totalLectures,
    completedModules,
    totalModules,
    percent,
  };
}

export function filterAndSortProducts(
  products: Product[],
  filters: ProductFilterState,
  includeDrafts: boolean = false
): Product[] {
  const query = filters.search.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (!includeDrafts && product.status !== 'published') {
      return false;
    }
    if (filters.type !== 'all' && product.type !== filters.type) {
      return false;
    }
    if (filters.category !== 'All' && product.category !== filters.category) {
      return false;
    }
    if (product.rating < filters.minRating) {
      return false;
    }
    if (filters.level !== 'all' && product.level !== filters.level) {
      return false;
    }
    if (filters.priceFilter === 'under-30000' && product.price >= 30000) {
      return false;
    }
    if (
      filters.priceFilter === '30000-60000' &&
      (product.price < 30000 || product.price > 60000)
    ) {
      return false;
    }
    if (filters.priceFilter === 'over-60000' && product.price <= 60000) {
      return false;
    }
    if (query) {
      const haystack = [
        product.title,
        product.subtitle,
        product.category,
        product.instructorName,
        product.type,
        product.formatLabel,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered];
  switch (filters.sortBy) {
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      sorted.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      break;
    case 'popular':
    default:
      sorted.sort((a, b) => b.studentsCount - a.studentsCount);
      break;
  }

  return sorted;
}

export function validateAuthForm(
  email: string,
  password: string,
  name?: string,
  isRegister: boolean = false
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  if (isRegister && (!name || name.trim().length < 2)) {
    errors.name = 'Full name must be at least 2 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getDiscountPercent(price: number, originalPrice: number): number {
  if (originalPrice <= 0 || price >= originalPrice) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export interface ExtendedCartTotals extends CartTotals {
  membershipDiscount: number;
  taxAmount: number;
  grandTotal: number;
}

export function calculateExtendedCartTotals(
  items: CartItem[],
  coupons: Coupon[],
  couponCodeInput: string,
  membershipDiscountOrTier: number | string = 0,
  taxRate: number = 0,
  nowDate: Date = new Date()
): ExtendedCartTotals {
  const base = calculateCartTotals(items, coupons, couponCodeInput, nowDate);
  if (items.length === 0) {
    return {
      ...base,
      membershipDiscount: 0,
      taxAmount: 0,
      grandTotal: 0,
    };
  }

  const afterCoupon = base.total;
  let membershipDiscount = 0;

  const isTierString = typeof membershipDiscountOrTier === 'string';
  const normalizedTier = isTierString ? migrateLegacyTier(membershipDiscountOrTier) : null;
  const isPaidTier = normalizedTier === 'paid';
  const hasPremiumFlagInCart = items.some((item) => item.isPremium !== undefined);

  if (isTierString || (hasPremiumFlagInCart && membershipDiscountOrTier === 50)) {
    // Tier-based discount:
    // Paid members receive a 50% discount on premium products (isPremium === true).
    // Free members pay full price (0% discount).
    if (isPaidTier || membershipDiscountOrTier === 50) {
      const couponRatio = base.subtotal > 0 ? (base.subtotal - base.discount) / base.subtotal : 1;
      for (const item of items) {
        if (item.isPremium === true) {
          const itemNetPrice = Math.max(0, item.unitPrice * couponRatio);
          const itemDiscount = roundCurrency(itemNetPrice * 0.5);
          membershipDiscount += itemDiscount;
        }
      }
      membershipDiscount = roundCurrency(Math.min(afterCoupon, membershipDiscount));
    } else {
      membershipDiscount = 0;
    }
  } else if (typeof membershipDiscountOrTier === 'number') {
    // Backward compatibility: scalar discount percent applied across the whole cart
    const clampedMemberPct = Math.max(0, Math.min(80, membershipDiscountOrTier));
    membershipDiscount = roundCurrency(afterCoupon * (clampedMemberPct / 100));
  }

  const taxableAmount = roundCurrency(Math.max(0, afterCoupon - membershipDiscount));
  const taxAmount = roundCurrency(taxableAmount * Math.max(0, taxRate));
  const grandTotal = roundCurrency(taxableAmount + taxAmount);

  return {
    ...base,
    membershipDiscount,
    taxAmount,
    total: grandTotal,
    grandTotal,
  };
}

export function calculateBundlePrice(products: Product[], discountPercent: number = 15): {
  regularTotal: number;
  bundleTotal: number;
  savings: number;
} {
  const regularTotal = roundCurrency(products.reduce((sum, p) => sum + p.price, 0));
  const bundleTotal = roundCurrency(regularTotal * (1 - discountPercent / 100));
  const savings = roundCurrency(regularTotal - bundleTotal);
  return { regularTotal, bundleTotal, savings };
}

export const CERTIFICATE_PASS_MARK = 80;

export function gradeModuleQuiz(
  questions: Array<{ id: string; correctIndex: number }>,
  answersByQuestionId: Record<string, number>,
  passingScore: number = CERTIFICATE_PASS_MARK
): {
  scorePercent: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
} {
  const totalQuestions = questions.length;
  if (totalQuestions === 0) {
    return { scorePercent: 100, passed: true, correctCount: 0, totalQuestions: 0 };
  }
  const correctCount = questions.filter(
    (q) => answersByQuestionId[q.id] === q.correctIndex
  ).length;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);
  const effectivePass = Math.max(passingScore, CERTIFICATE_PASS_MARK);
  return {
    scorePercent,
    passed: scorePercent >= effectivePass,
    correctCount,
    totalQuestions,
  };
}

export function shuffleQuestionOptionIndices(optionCount: number): number[] {
  const indices = Array.from({ length: optionCount }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

export interface QuizScoreRecord {
  scorePercent: number;
  passed: boolean;
}

export function isModuleCompleted(
  mod: CourseModule,
  completedLectureIds: string[],
  quizScoresByModule?: Record<string, QuizScoreRecord>
): boolean {
  const allLecturesDone =
    mod.lectures.length === 0 ||
    mod.lectures.every((l) => completedLectureIds.includes(l.id));
  if (!allLecturesDone) return false;

  if (mod.quiz && mod.quiz.questions.length > 0) {
    const required = Math.max(mod.quiz.passingScore ?? CERTIFICATE_PASS_MARK, CERTIFICATE_PASS_MARK);
    const score = quizScoresByModule?.[mod.id];
    return Boolean(score && score.passed && score.scorePercent >= required);
  }
  return true;
}

export function isModuleUnlocked(
  modules: CourseModule[],
  moduleIndex: number,
  completedLectureIds: string[],
  quizScoresByModule?: Record<string, QuizScoreRecord>
): boolean {
  if (moduleIndex <= 0) return true;
  for (let i = 0; i < moduleIndex; i++) {
    if (!isModuleCompleted(modules[i], completedLectureIds, quizScoresByModule)) {
      return false;
    }
  }
  return true;
}

export function isLectureUnlocked(
  modules: CourseModule[],
  lectureId: string,
  completedLectureIds: string[],
  quizScoresByModule?: Record<string, QuizScoreRecord>
): boolean {
  for (let mIdx = 0; mIdx < modules.length; mIdx++) {
    const mod = modules[mIdx];
    const lIdx = mod.lectures.findIndex((l) => l.id === lectureId);
    if (lIdx === -1) continue;

    if (!isModuleUnlocked(modules, mIdx, completedLectureIds, quizScoresByModule)) {
      return false;
    }
    if (lIdx === 0) return true;
    return completedLectureIds.includes(mod.lectures[lIdx - 1].id);
  }
  return false;
}

export function isModuleQuizUnlocked(
  modules: CourseModule[],
  moduleIndex: number,
  completedLectureIds: string[],
  quizScoresByModule?: Record<string, QuizScoreRecord>
): boolean {
  const mod = modules[moduleIndex];
  if (!mod) return false;
  if (!isModuleUnlocked(modules, moduleIndex, completedLectureIds, quizScoresByModule)) {
    return false;
  }
  return mod.lectures.every((l) => completedLectureIds.includes(l.id));
}

export function canIssueCourseCertificate(
  product: Product,
  completedLectureIds: string[],
  quizScoresByModule?: Record<string, QuizScoreRecord>
): {
  eligible: boolean;
  completionPercent: number;
  unpassedQuizModules: string[];
  reason?: string;
} {
  const completionPercent = calculateCourseProgressPercent(product, completedLectureIds);
  const modules = product.courseData?.modules ?? [];

  if (modules.length === 0) {
    return {
      eligible: false,
      completionPercent: 0,
      unpassedQuizModules: [],
      reason: 'This course has no curriculum modules yet.',
    };
  }

  if (completionPercent < 100) {
    return {
      eligible: false,
      completionPercent,
      unpassedQuizModules: [],
      reason: `Complete 100% of all course lessons sequentially (currently ${completionPercent}%).`,
    };
  }

  const unpassedQuizModules = modules
    .filter((mod) => {
      if (!mod.quiz || mod.quiz.questions.length === 0) return false;
      const required = Math.max(mod.quiz.passingScore ?? CERTIFICATE_PASS_MARK, CERTIFICATE_PASS_MARK);
      const score = quizScoresByModule?.[mod.id];
      return !(score && score.passed && score.scorePercent >= required);
    })
    .map((m) => m.title);

  if (unpassedQuizModules.length > 0) {
    return {
      eligible: false,
      completionPercent,
      unpassedQuizModules,
      reason: `Pass all module quizzes with at least ${CERTIFICATE_PASS_MARK}% to unlock your certificate (pending: ${unpassedQuizModules.join(', ')}).`,
    };
  }

  return {
    eligible: true,
    completionPercent: 100,
    unpassedQuizModules: [],
  };
}

export function generateCertificateCode(userId: string, productId: string): string {
  const raw = `${userId}-${productId}`.toUpperCase();
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  const hex = hash.toString(16).toUpperCase().padStart(8, '0');
  return `CM-CERT-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

export function isTierSufficient(
  userTier: MembershipTierId | string | null | undefined,
  requiredTier: MembershipTierId | string | undefined
): boolean {
  if (!userTier || !requiredTier) return false;
  const normalizedUser = migrateLegacyTier(userTier);
  const normalizedReq = migrateLegacyTier(requiredTier);
  const rank: Record<'free' | 'paid', number> = {
    free: 1,
    paid: 2,
  };
  return rank[normalizedUser] >= rank[normalizedReq];
}

export function isUnlockedByMembership(
  product: (Product | { price?: number; isPremium?: boolean; includedInMembershipTier?: any }) | null | undefined,
  membership: (UserMembership | { status?: string; planId?: any }) | null | undefined
): boolean {
  if (!product) return false;

  // 1. Free items are accessible to everyone (Free and Paid members alike)
  if (product.price === 0 || product.includedInMembershipTier === 'free') {
    return true;
  }

  // 2. Active membership is required for paid items
  if (!membership || membership.status !== 'active') {
    return false;
  }

  // 3. Premium products require checkout purchase (Paid members get 50% discount at checkout, not free unlock)
  if (product.isPremium === true) {
    return false;
  }

  // 4. Paid tier members have access to all items marked as included in paid membership
  const userTier = migrateLegacyTier(membership.planId);
  if (userTier === 'paid') {
    if (product.includedInMembershipTier === 'paid') {
      return true;
    }
    if (product.includedInMembershipTier) {
      return isTierSufficient(userTier, product.includedInMembershipTier);
    }
    return false;
  }

  // Free tier members only have access to items toggled as free
  return false;
}

export const DEFAULT_AFFILIATE_COMMISSION_PERCENT = 10;

export function calculateAffiliateCommission(
  orderTotal: number,
  commissionRatePercent: number = DEFAULT_AFFILIATE_COMMISSION_PERCENT
): number {
  const clampedRate = Math.max(0, Math.min(75, commissionRatePercent));
  return roundCurrency(Math.max(0, orderTotal) * (clampedRate / 100));
}

export function attributeAffiliateReferral(
  referralCode: string | null | undefined,
  buyer: { id?: string; email?: string } | null | undefined,
  affiliates: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    code: string;
    commissionRate?: number;
    active: boolean;
  }>,
  orderTotal: number,
  existingConversions?: Array<{
    buyerName?: string;
    buyerEmail?: string;
    affiliateUserId?: string;
    status?: string;
  }>
): {
  attributed: boolean;
  affiliateId?: string;
  affiliateCode?: string;
  commissionAmount: number;
  reason?: string;
} {
  if (!referralCode || typeof referralCode !== 'string') {
    return { attributed: false, commissionAmount: 0, reason: 'No referral code provided' };
  }
  const cleanCode = referralCode.trim().toUpperCase();
  if (!cleanCode) {
    return { attributed: false, commissionAmount: 0, reason: 'Empty referral code' };
  }
  const aff = affiliates.find((a) => a.code.toUpperCase() === cleanCode && a.active);
  if (!aff) {
    return { attributed: false, commissionAmount: 0, reason: 'Invalid or inactive affiliate code' };
  }
  if (buyer) {
    // 1. Strict Grade-A Anti-Fraud Security: Self-Referral Prevention
    const isSelfId = Boolean(buyer.id && buyer.id === aff.userId);
    const isSelfEmail = Boolean(
      buyer.email &&
        aff.userEmail &&
        buyer.email.trim().toLowerCase() === aff.userEmail.trim().toLowerCase()
    );
    if (isSelfId || isSelfEmail) {
      return {
        attributed: false,
        commissionAmount: 0,
        reason: 'Fraud prevention: Self-referrals are strictly disallowed to prevent manipulation. Affiliates cannot earn commission on their own purchases.',
      };
    }

    // 2. Strict One-Time Commission Policy: Affiliate does not earn more than once on a customer introduced
    if (existingConversions && Array.isArray(existingConversions) && existingConversions.length > 0) {
      const cleanBuyerEmail = buyer.email?.trim().toLowerCase();
      const hasPriorConversion = existingConversions.some((c) => {
        if (!c || c.status === 'declined') return false;
        const matchesEmail = cleanBuyerEmail && c.buyerEmail?.trim().toLowerCase() === cleanBuyerEmail;
        return Boolean(matchesEmail);
      });
      if (hasPriorConversion) {
        return {
          attributed: false,
          commissionAmount: 0,
          reason: 'First-purchase only policy: Affiliate commission is credited once per introduced customer and does not apply to repeat or recurring purchases.',
        };
      }
    }
  }
  const commissionRate = aff.commissionRate ?? DEFAULT_AFFILIATE_COMMISSION_PERCENT;
  const commissionAmount = calculateAffiliateCommission(orderTotal, commissionRate);
  return {
    attributed: true,
    affiliateId: aff.id,
    affiliateCode: aff.code,
    commissionAmount,
  };
}

export function attributeReferralSale(
  order: { id?: string; total?: number; userId?: string; customerEmail?: string } | number,
  affiliateCode: string | null | undefined,
  affiliatesList: any[],
  buyerUser?: { id?: string; email?: string; name?: string },
  existingConversions?: Array<{
    buyerName?: string;
    buyerEmail?: string;
    affiliateUserId?: string;
    status?: string;
  }>
) {
  const orderTotal = typeof order === 'number' ? order : (order?.total ?? 0);
  const buyer =
    buyerUser ||
    (typeof order === 'object' ? { id: order.userId, email: order.customerEmail } : undefined);
  return attributeAffiliateReferral(affiliateCode, buyer, affiliatesList, orderTotal, existingConversions);
}

export function extractReferralCodeFromSearch(search: string): string | null {
  if (!search) return null;
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const raw = params.get('ref') || params.get('aff');
  const ref = raw?.trim().toUpperCase();
  if (!ref || ref.length < 3 || ref.length > 32) return null;
  return ref.replace(/[^A-Z0-9_-]/g, '') || null;
}

export function getRatingBreakdown(
  reviews: Array<{ rating: number }>,
  fallbackAverage: number = 4.8
): Array<{ stars: number; count: number; percent: number }> {
  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) {
    const s = Math.min(5, Math.max(1, Math.round(r.rating)));
    counts[s] += 1;
  }
  const total = reviews.length;
  if (total === 0) {
    const highShare = fallbackAverage >= 4.7 ? 74 : 62;
    return [
      { stars: 5, count: 0, percent: highShare },
      { stars: 4, count: 0, percent: 20 },
      { stars: 3, count: 0, percent: 100 - highShare - 20 - 2 },
      { stars: 2, count: 0, percent: 1 },
      { stars: 1, count: 0, percent: 1 },
    ];
  }
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars],
    percent: Math.round((counts[stars] / total) * 100),
  }));
}

export const AFFILIATE_MIN_PAYOUT_NGN = 10_000;
export const AFFILIATE_HOLD_DAYS = 7;

export interface AffiliateLedgerSummary {
  lifetimeApprovedEarned: number;
  pendingHoldEarned: number;
  declinedEarned: number;
  settledPaidOut: number;
  pendingWithdrawals: number;
  totalWithdrawnOrReserved: number;
  availableBalance: number;
  minPayoutNgn: number;
  holdDays: number;
  canRequestPayout: boolean;
  convRate: number;
}

export function calculateAffiliateLedgerSummary(
  conversions: Array<{ status: 'pending' | 'approved' | 'paid' | 'declined'; commissionAmount: number }>,
  payouts: Array<{ status: 'pending' | 'paid' | 'declined'; amount: number }>,
  clicks: number = 0
): AffiliateLedgerSummary {
  const lifetimeApprovedEarned = roundCurrency(
    conversions
      .filter((c) => c.status === 'approved' || c.status === 'paid')
      .reduce((sum, c) => sum + c.commissionAmount, 0)
  );
  const pendingHoldEarned = roundCurrency(
    conversions
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + c.commissionAmount, 0)
  );
  const declinedEarned = roundCurrency(
    conversions
      .filter((c) => c.status === 'declined')
      .reduce((sum, c) => sum + c.commissionAmount, 0)
  );
  const settledPaidOut = roundCurrency(
    payouts
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0)
  );
  const pendingWithdrawals = roundCurrency(
    payouts
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0)
  );
  const totalWithdrawnOrReserved = roundCurrency(settledPaidOut + pendingWithdrawals);
  const availableBalance = roundCurrency(
    Math.max(0, lifetimeApprovedEarned - totalWithdrawnOrReserved)
  );
  const convRate = clicks > 0 ? Math.round((conversions.length / clicks) * 1000) / 10 : 0;

  return {
    lifetimeApprovedEarned,
    pendingHoldEarned,
    declinedEarned,
    settledPaidOut,
    pendingWithdrawals,
    totalWithdrawnOrReserved,
    availableBalance,
    minPayoutNgn: AFFILIATE_MIN_PAYOUT_NGN,
    holdDays: AFFILIATE_HOLD_DAYS,
    canRequestPayout: availableBalance >= AFFILIATE_MIN_PAYOUT_NGN,
    convRate,
  };
}

export function getCountdownSecondsRemaining(
  endsAtIso: string | undefined,
  nowMs: number = Date.now()
): number {
  if (!endsAtIso) return 0;
  const targetMs = Date.parse(endsAtIso);
  if (Number.isNaN(targetMs) || targetMs <= nowMs) return 0;
  return Math.floor((targetMs - nowMs) / 1000);
}

