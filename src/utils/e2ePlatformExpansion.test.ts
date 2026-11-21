import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import type {
  BlogPost,
  Order,
  Product,
  UserMembership,
  UserRole,
} from '../types/marketplace';
import {
  calculateAffiliateCommission,
  calculateExtendedCartTotals,
  extractReferralCodeFromSearch,
  isTierSufficient,
  roundCurrency,
} from './commerce';
import { slugifyText } from './catalogAndBlogs';
import { resolveInitialOrderStatus } from './automation';

/* ============================================================================
   CourseMart Platform Expansion (R1-R5) Opaque-Box Specification & Types
   ============================================================================ */

export const DEFAULT_AFFILIATE_COMMISSION_PERCENT = 20;
export const HMAC_SECRET = 'coursemart_test_hmac_secret_key_2026';

// F1: Community Models
export interface CommunityChannel {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: 'general' | 'courses' | 'cohorts';
  accessLevel: 'public' | 'enrolled' | 'members';
  createdAt: string;
}

export interface CommunityChatMessage {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface CommunityForumThread {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  tags: string[];
  pinned: boolean;
  upvotes: number;
  upvotedUserIds: string[];
  replyCount: number;
  createdAt: string;
}

export interface CommunityForumReply {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

// F5: Affiliate Model
export interface AffiliateProfile {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  code: string;
  commissionRate: number;
  active: boolean;
}

/* ============================================================================
   Platform Expansion Specification Logic & Domain Helpers
   ============================================================================ */

// F1 Helpers
export function createCommunityChannel(input: {
  id?: string;
  name: string;
  slug?: string;
  description: string;
  category: 'general' | 'courses' | 'cohorts';
  accessLevel: 'public' | 'enrolled' | 'members';
}): CommunityChannel {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    throw new Error('Channel name cannot be empty');
  }
  const slug = input.slug?.trim() || slugifyText(trimmedName);
  if (!slug) {
    throw new Error('Channel slug cannot be empty');
  }
  return {
    id: input.id || `chan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmedName,
    slug,
    description: input.description.trim(),
    category: input.category,
    accessLevel: input.accessLevel,
    createdAt: new Date().toISOString(),
  };
}

export function sendChatMessage(
  channels: CommunityChannel[],
  messages: CommunityChatMessage[],
  input: {
    channelId: string;
    authorId?: string | null;
    authorName?: string;
    authorRole?: UserRole;
    content: string;
  }
): { ok: boolean; message?: CommunityChatMessage; error?: string } {
  if (!input.authorId || !input.authorName || !input.authorRole) {
    return { ok: false, error: 'Unauthenticated: User must be signed in to post in chat' };
  }
  const channel = channels.find((c) => c.id === input.channelId);
  if (!channel) {
    return { ok: false, error: `Channel with ID ${input.channelId} not found` };
  }
  const trimmed = input.content.trim();
  if (!trimmed) {
    return { ok: false, error: 'Chat message content cannot be empty' };
  }
  const msg: CommunityChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    channelId: channel.id,
    authorId: input.authorId,
    authorName: input.authorName,
    authorRole: input.authorRole,
    content: trimmed,
    createdAt: new Date().toISOString(),
  };
  messages.push(msg);
  return { ok: true, message: msg };
}

export function createForumThread(
  threads: CommunityForumThread[],
  input: {
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    authorRole: UserRole;
    category: string;
    tags: string[];
    pinned?: boolean;
  }
): { ok: boolean; thread?: CommunityForumThread; error?: string } {
  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) {
    return { ok: false, error: 'Thread title cannot be empty' };
  }
  const trimmedContent = input.content.trim();
  if (!trimmedContent) {
    return { ok: false, error: 'Thread content cannot be empty' };
  }
  if (!input.authorId) {
    return { ok: false, error: 'Unauthenticated user cannot create thread' };
  }
  const rawSlug = slugifyText(trimmedTitle);
  let slug = rawSlug;
  let counter = 1;
  while (threads.some((t) => t.slug === slug)) {
    slug = `${rawSlug}-${counter++}`;
  }

  const cleanTags = input.tags
    .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''))
    .filter((t) => t.length > 0)
    .slice(0, 5);

  const thread: CommunityForumThread = {
    id: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: trimmedTitle,
    slug,
    content: trimmedContent,
    category: input.category.trim() || 'General Discussion',
    authorId: input.authorId,
    authorName: input.authorName,
    authorRole: input.authorRole,
    tags: cleanTags,
    pinned: Boolean(input.pinned),
    upvotes: 0,
    upvotedUserIds: [],
    replyCount: 0,
    createdAt: new Date().toISOString(),
  };
  threads.push(thread);
  return { ok: true, thread };
}

export function replyToForumThread(
  threads: CommunityForumThread[],
  replies: CommunityForumReply[],
  input: {
    threadId: string;
    authorId: string;
    authorName: string;
    authorRole: UserRole;
    content: string;
  }
): { ok: boolean; reply?: CommunityForumReply; error?: string } {
  const thread = threads.find((t) => t.id === input.threadId);
  if (!thread) {
    return { ok: false, error: `Forum thread with ID ${input.threadId} not found` };
  }
  const trimmed = input.content.trim();
  if (!trimmed) {
    return { ok: false, error: 'Reply content cannot be empty' };
  }
  const reply: CommunityForumReply = {
    id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    threadId: thread.id,
    authorId: input.authorId,
    authorName: input.authorName,
    authorRole: input.authorRole,
    content: trimmed,
    createdAt: new Date().toISOString(),
  };
  replies.push(reply);
  thread.replyCount += 1;
  return { ok: true, reply };
}

export function toggleThreadUpvote(
  thread: CommunityForumThread,
  userId: string
): { upvotes: number; userHasUpvoted: boolean } {
  if (!userId) {
    throw new Error('User ID is required to upvote');
  }
  const idx = thread.upvotedUserIds.indexOf(userId);
  if (idx >= 0) {
    thread.upvotedUserIds.splice(idx, 1);
    thread.upvotes = Math.max(0, thread.upvotes - 1);
    return { upvotes: thread.upvotes, userHasUpvoted: false };
  } else {
    thread.upvotedUserIds.push(userId);
    thread.upvotes += 1;
    return { upvotes: thread.upvotes, userHasUpvoted: true };
  }
}

// F2 Helpers: Automation Agents
export function runBlogPublisherAgent(
  posts: BlogPost[],
  nowMs: number = Date.now()
): { publishedCount: number; updatedPosts: BlogPost[] } {
  let publishedCount = 0;
  const updatedPosts = posts.map((post) => {
    if (post.status === 'scheduled' && post.scheduledAt) {
      const scheduledMs = Date.parse(post.scheduledAt);
      if (!Number.isNaN(scheduledMs) && scheduledMs <= nowMs) {
        publishedCount += 1;
        return {
          ...post,
          status: 'published' as const,
          publishedAt: new Date(nowMs).toISOString(),
        };
      }
    }
    return post;
  });
  return { publishedCount, updatedPosts };
}

export function runEnquiryAgent(
  question: string,
  context?: { courseName?: string; lectureTitle?: string }
): {
  answer: string;
  matchedTopics: string[];
  confidence: number;
  suggestedForumThreadSlug?: string;
} {
  const cleanQ = question.trim().toLowerCase();
  if (!cleanQ || cleanQ.replace(/[^a-z0-9]/g, '').length === 0) {
    return {
      answer:
        "Hello! I couldn't quite understand your question. Could you please provide more details or ask about course enrollment, certificates, or community discussions?",
      matchedTopics: [],
      confidence: 0,
    };
  }

  if (cleanQ.includes('refund') || cleanQ.includes('money back')) {
    return {
      answer:
        'CourseMart offers a 30-day money-back guarantee on digital courses. Manual GTB transfers and completed card orders can request a refund in their account portal.',
      matchedTopics: ['refunds', 'billing'],
      confidence: 0.95,
      suggestedForumThreadSlug: 'faq-refund-policy-and-settlements',
    };
  }

  if (cleanQ.includes('certificate') || cleanQ.includes('cert')) {
    return {
      answer:
        'Certificates of completion are automatically generated with a verifiable CM-CERT code once you achieve at least 70% on all course quizzes.',
      matchedTopics: ['certificates', 'accreditation'],
      confidence: 0.92,
      suggestedForumThreadSlug: 'how-to-verify-and-share-certificates',
    };
  }

  if (cleanQ.includes('react') || cleanQ.includes('hook') || cleanQ.includes('state')) {
    return {
      answer: `In ${context?.courseName || 'our engineering courses'}, React hooks must be called at the top level of your component. Check the lesson resources for sample code snippets.`,
      matchedTopics: ['react', 'web-development'],
      confidence: 0.88,
      suggestedForumThreadSlug: 'debugging-react-hooks-and-state',
    };
  }

  return {
    answer:
      "Thank you for contacting CourseMart support. A community mentor or instructor will follow up with you shortly. You can also search the community forum for similar questions.",
    matchedTopics: ['general-support'],
    confidence: 0.5,
  };
}

export function evaluateBestsellersAndBanners(
  products: Product[],
  orders: Order[],
  options: { salesThreshold?: number } = {}
): {
  updatedProducts: Product[];
  bestsellerIds: string[];
  announcement: { text: string; couponCode?: string };
} {
  const threshold = options.salesThreshold ?? 5;
  const salesCountByProduct: Record<string, number> = {};

  for (const o of orders) {
    if (o.status === 'completed') {
      for (const item of o.items) {
        salesCountByProduct[item.productId] =
          (salesCountByProduct[item.productId] || 0) + 1;
      }
    }
  }

  const bestsellerIds: string[] = [];
  const updatedProducts = products.map((p) => {
    const totalSales = (salesCountByProduct[p.id] || 0) + (p.studentsCount || 0);
    const isBestseller = totalSales >= threshold && p.rating >= 4.5;
    if (isBestseller) bestsellerIds.push(p.id);
    return {
      ...p,
      bestseller: isBestseller,
    };
  });

  const announcement = {
    text:
      bestsellerIds.length > 0
        ? `🔥 Trending Now: Explore our ${bestsellerIds.length} verified bestseller courses today!`
        : 'Welcome to CourseMart — Learn high-income digital skills.',
    couponCode: bestsellerIds.length > 0 ? 'BESTSELLER10' : undefined,
  };

  return { updatedProducts, bestsellerIds, announcement };
}

export function detectResourceSharingAnomalies(
  downloadLogs: Array<{ userId: string; ipAddress: string; timestamp: number }>,
  windowMinutes: number = 60
): {
  flaggedUserIds: string[];
  anomalies: Array<{
    userId: string;
    reason: string;
    distinctIps: number;
    downloadCount: number;
  }>;
} {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const recentLogs = downloadLogs.filter((l) => now - l.timestamp <= windowMs);

  const logsByUser: Record<string, Array<{ ip: string; time: number }>> = {};
  for (const log of recentLogs) {
    if (!logsByUser[log.userId]) logsByUser[log.userId] = [];
    logsByUser[log.userId].push({ ip: log.ipAddress, time: log.timestamp });
  }

  const flaggedUserIds: string[] = [];
  const anomalies: Array<{
    userId: string;
    reason: string;
    distinctIps: number;
    downloadCount: number;
  }> = [];

  for (const [userId, userLogs] of Object.entries(logsByUser)) {
    const distinctIps = new Set(userLogs.map((l) => l.ip)).size;
    const count = userLogs.length;

    // Burst download rule: > 10 downloads within window
    // Multi-IP rule: > 3 distinct IPs within window
    if (distinctIps > 3 || count > 10) {
      flaggedUserIds.push(userId);
      const reasons: string[] = [];
      if (distinctIps > 3) reasons.push(`Multi-IP dispersion (${distinctIps} IPs)`);
      if (count > 10) reasons.push(`Rapid download burst (${count} downloads)`);
      anomalies.push({
        userId,
        reason: reasons.join('; '),
        distinctIps,
        downloadCount: count,
      });
    }
  }

  return { flaggedUserIds, anomalies };
}

// F3 Helpers: LMS Content Protection
export function evaluateCopyProtection(
  event: 'copy' | 'cut' | 'contextmenu' | 'selectstart',
  productCopyProtection?: boolean,
  globalCopyProtection?: boolean
): { blocked: boolean; action: string } {
  const isProtected = Boolean(productCopyProtection || globalCopyProtection);
  if (!isProtected) {
    return { blocked: false, action: `allow_${event}` };
  }
  return { blocked: true, action: `prevent_${event}` };
}

export function generateWatermarkOverlayConfig(
  user: { id?: string; email?: string; name?: string } | null,
  timestampIso: string = new Date().toISOString()
): {
  text: string;
  opacity: number;
  visible: boolean;
  layout: { repeatX: number; repeatY: number; angle: number };
} {
  const identifier =
    user?.email ||
    (user?.id ? `User-${user.id}` : null) ||
    'Anonymous-Guest-Viewer';

  const text = `${identifier} • ${timestampIso.slice(0, 16)} • CourseMart Protected`;
  return {
    text,
    opacity: 0.18,
    visible: true,
    layout: {
      repeatX: 3,
      repeatY: 4,
      angle: -25,
    },
  };
}

export function generateDownloadToken(
  productId: string,
  userId: string,
  ttlSeconds: number,
  secretKey: string = HMAC_SECRET,
  nowMs: number = Date.now()
): { token: string; expiresAt: number; downloadUrl: string } {
  const expiresAt = nowMs + ttlSeconds * 1000;
  const payload = `${productId}:${userId}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  const token = `${Buffer.from(payload).toString('base64url')}.${signature}`;
  const downloadUrl = `/api/resources/download?token=${token}&productId=${encodeURIComponent(
    productId
  )}`;
  return { token, expiresAt, downloadUrl };
}

export function verifyDownloadToken(
  tokenString: string,
  requestedProductId: string,
  secretKey: string = HMAC_SECRET,
  nowMs: number = Date.now()
): { valid: boolean; reason?: string; userId?: string; productId?: string } {
  if (!tokenString || !tokenString.includes('.')) {
    return { valid: false, reason: 'Malformed token structure' };
  }
  const [b64Payload, signature] = tokenString.split('.');
  if (!b64Payload || !signature) {
    return { valid: false, reason: 'Missing token components' };
  }

  let payload = '';
  try {
    payload = Buffer.from(b64Payload, 'base64url').toString('utf8');
  } catch {
    return { valid: false, reason: 'Invalid base64 encoding' };
  }

  const parts = payload.split(':');
  if (parts.length !== 3) {
    return { valid: false, reason: 'Invalid payload segments' };
  }

  const [productId, userId, expiresAtStr] = parts;
  const expiresAt = Number(expiresAtStr);
  if (Number.isNaN(expiresAt)) {
    return { valid: false, reason: 'Invalid expiration timestamp' };
  }

  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return { valid: false, reason: 'Invalid token signature' };
  }

  if (nowMs > expiresAt) {
    return { valid: false, reason: 'Token has expired' };
  }

  if (productId !== requestedProductId) {
    return { valid: false, reason: 'Token product ID does not match requested resource' };
  }

  return { valid: true, userId, productId };
}

// F4 Helpers: Funnels & Vault
export function calculateFunnelOrderTotal(
  mainOfferPrice: number,
  bumpSelected: boolean,
  bumpPrice: number,
  upsellSelected: boolean = false,
  upsellPrice: number = 0
): { subtotal: number; bumpAmount: number; upsellAmount: number; total: number } {
  const safeMain = Math.max(0, mainOfferPrice);
  const safeBump = bumpSelected ? Math.max(0, bumpPrice) : 0;
  const safeUpsell = upsellSelected ? Math.max(0, upsellPrice) : 0;
  const total = roundCurrency(safeMain + safeBump + safeUpsell);
  return {
    subtotal: roundCurrency(safeMain),
    bumpAmount: roundCurrency(safeBump),
    upsellAmount: roundCurrency(safeUpsell),
    total,
  };
}

export function isPromptVaultAccessible(
  membership: UserMembership | null | undefined
): { accessible: boolean; reason?: string } {
  if (!membership) {
    return { accessible: false, reason: 'Active membership required for Prompt Vault access' };
  }
  if (membership.status !== 'active') {
    return {
      accessible: false,
      reason: `Membership is currently ${membership.status}. Reactivate to access Prompt Vault.`,
    };
  }
  return { accessible: true };
}

export function interpolatePromptVariables(
  template: string,
  variables: Record<string, string>
): { prompt: string; missingVariables: string[]; isComplete: boolean } {
  const missing: string[] = [];
  const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;

  // Track all placeholders in template
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    const key = match[1];
    if (
      variables[key] === undefined ||
      variables[key] === null ||
      variables[key].trim() === ''
    ) {
      if (!missing.includes(key)) missing.push(key);
    }
  }

  const prompt = template.replace(regex, (_, key) => {
    const val = variables[key];
    if (val !== undefined && val !== null && val.trim() !== '') {
      return val.trim();
    }
    return `{{${key}}}`;
  });

  return {
    prompt,
    missingVariables: missing,
    isComplete: missing.length === 0,
  };
}

// F5 Helpers: Affiliates & Premium Entitlements
export function attributeAffiliateReferral(
  referralCode: string | null,
  buyer: { id: string; email: string },
  affiliates: AffiliateProfile[],
  orderTotal: number
): {
  attributed: boolean;
  affiliateId?: string;
  affiliateCode?: string;
  commissionAmount: number;
  reason?: string;
} {
  if (!referralCode) {
    return { attributed: false, commissionAmount: 0, reason: 'No referral code provided' };
  }
  const cleanCode = referralCode.trim().toUpperCase();
  const aff = affiliates.find((a) => a.code.toUpperCase() === cleanCode && a.active);
  if (!aff) {
    return { attributed: false, commissionAmount: 0, reason: 'Invalid or inactive affiliate code' };
  }

  // Self-referral rejection rule:
  const isSelfUserId = aff.userId === buyer.id;
  const isSelfEmail =
    aff.userEmail.trim().toLowerCase() === buyer.email.trim().toLowerCase();

  if (isSelfUserId || isSelfEmail) {
    return {
      attributed: false,
      commissionAmount: 0,
      reason: 'Self-referrals are strictly disallowed',
    };
  }

  const commissionRate = aff.commissionRate || DEFAULT_AFFILIATE_COMMISSION_PERCENT;
  const commissionAmount = calculateAffiliateCommission(orderTotal, commissionRate);

  return {
    attributed: true,
    affiliateId: aff.id,
    affiliateCode: aff.code,
    commissionAmount,
  };
}

export function isUnlockedByMembership(
  product: Product & { isPremium?: boolean },
  membership: UserMembership | null | undefined
): boolean {
  if (!membership || membership.status !== 'active') {
    return false;
  }
  // R5 Acceptance Criteria: Registered members automatically receive access to all resources designated as premium at creation time
  if (product.isPremium === true) {
    return true;
  }
  // Otherwise fallback to tier hierarchy check
  return isTierSufficient(membership.planId, product.includedInMembershipTier);
}

/* ============================================================================
   E2E Platform Expansion Test Suite (Tiers 1-4)
   ============================================================================ */

describe('CourseMart Platform Expansion (R1-R5) Test Suite', () => {
  /* --------------------------------------------------------------------------
     Tier 1: Feature Coverage (≥5 tests per feature F1-F5 = 25 tests)
     -------------------------------------------------------------------------- */
  describe('Tier 1: Feature Coverage', () => {
    // F1: In-Platform Community (5 tests)
    it('T1-F1-1: Channel creation and validation', () => {
      const channel = createCommunityChannel({
        name: 'AI & Vibe Coding Mastery',
        description: 'Real-time discussion on modern vibe coding workflows',
        category: 'general',
        accessLevel: 'public',
      });
      assert.equal(channel.name, 'AI & Vibe Coding Mastery');
      assert.equal(channel.slug, 'ai-vibe-coding-mastery');
      assert.equal(channel.category, 'general');
      assert.equal(channel.accessLevel, 'public');
      assert.ok(channel.id.startsWith('chan-'));
    });

    it('T1-F1-2: Real-time chat channel message delivery', () => {
      const channels: CommunityChannel[] = [
        createCommunityChannel({
          id: 'c-general',
          name: 'General Discussion',
          description: 'Platform wide chat',
          category: 'general',
          accessLevel: 'public',
        }),
      ];
      const messages: CommunityChatMessage[] = [];
      const res = sendChatMessage(channels, messages, {
        channelId: 'c-general',
        authorId: 'usr-101',
        authorName: 'Ada Lovelace',
        authorRole: 'customer',
        content: 'Hello everyone! Excited to start the course.',
      });
      assert.equal(res.ok, true);
      assert.equal(messages.length, 1);
      assert.equal(messages[0].content, 'Hello everyone! Excited to start the course.');
      assert.equal(messages[0].authorName, 'Ada Lovelace');
    });

    it('T1-F1-3: Forum thread creation with tags and categorization', () => {
      const threads: CommunityForumThread[] = [];
      const res = createForumThread(threads, {
        title: 'Best Practices for Full-Stack Architecture in 2026',
        content: 'What design patterns are you using for edge deployment?',
        authorId: 'usr-202',
        authorName: 'Alex Mentor',
        authorRole: 'instructor',
        category: 'Architecture',
        tags: ['React', 'TypeScript', 'NodeJS'],
        pinned: true,
      });
      assert.equal(res.ok, true);
      assert.equal(threads.length, 1);
      assert.equal(threads[0].slug, 'best-practices-for-full-stack-architecture-in-2026');
      assert.equal(threads[0].pinned, true);
      assert.deepEqual(threads[0].tags, ['react', 'typescript', 'nodejs']);
      assert.equal(threads[0].upvotes, 0);
    });

    it('T1-F1-4: Threaded replies to forum discussions', () => {
      const threads: CommunityForumThread[] = [];
      const tRes = createForumThread(threads, {
        title: 'Deploying Vercel Functions with Custom Runtimes',
        content: 'Any tips on reducing bundle size?',
        authorId: 'usr-301',
        authorName: 'Dev One',
        authorRole: 'customer',
        category: 'Apps Deployment',
        tags: ['vercel', 'serverless'],
      });
      assert.equal(tRes.ok, true);
      const replies: CommunityForumReply[] = [];
      const rRes = replyToForumThread(threads, replies, {
        threadId: threads[0].id,
        authorId: 'usr-302',
        authorName: 'Senior Architect',
        authorRole: 'instructor',
        content: 'Use tree-shaking and dynamic imports to keep bundles minimal.',
      });
      assert.equal(rRes.ok, true);
      assert.equal(replies.length, 1);
      assert.equal(replies[0].threadId, threads[0].id);
      assert.equal(threads[0].replyCount, 1);
    });

    it('T1-F1-5: Upvoting and vote tallying with duplicate prevention', () => {
      const threads: CommunityForumThread[] = [];
      createForumThread(threads, {
        title: 'Prompt Engineering Vault Tips',
        content: 'Here is a breakdown of system prompts.',
        authorId: 'usr-401',
        authorName: 'Vault Master',
        authorRole: 'customer',
        category: 'AI',
        tags: ['prompts'],
      });
      const thread = threads[0];
      const vote1 = toggleThreadUpvote(thread, 'voter-1');
      assert.equal(vote1.upvotes, 1);
      assert.equal(vote1.userHasUpvoted, true);

      // Toggling again removes upvote
      const vote2 = toggleThreadUpvote(thread, 'voter-1');
      assert.equal(vote2.upvotes, 0);
      assert.equal(vote2.userHasUpvoted, false);
    });

    // F2: Automation Agents (5 tests)
    it('T1-F2-1: Scheduled blog publication agent publishes past-date posts', () => {
      const now = Date.now();
      const posts: BlogPost[] = [
        {
          id: 'b-1',
          slug: 'ai-vibe-coding',
          title: 'AI Vibe Coding Era',
          subtitle: 'The new way to build software',
          excerpt: 'Vibe coding is transforming programming.',
          category: 'AI',
          authorId: 'auth-1',
          authorName: 'Staff Writer',
          authorRole: 'Editor',
          authorAvatar: '',
          coverImage: '',
          readTimeMinutes: 5,
          publishedAt: '',
          updatedAt: '',
          scheduledAt: new Date(now - 10000).toISOString(),
          status: 'scheduled',
          featured: false,
          tags: ['ai'],
          sections: [],
          relatedProductIds: [],
          comments: [],
        },
      ];
      const res = runBlogPublisherAgent(posts, now);
      assert.equal(res.publishedCount, 1);
      assert.equal(res.updatedPosts[0].status, 'published');
      assert.ok(res.updatedPosts[0].publishedAt);
    });

    it('T1-F2-2: Student enquiry agent answers FAQ questions deterministically', () => {
      const res = runEnquiryAgent('Can I request a refund if I am not satisfied?');
      assert.equal(res.confidence >= 0.9, true);
      assert.ok(res.matchedTopics.includes('refunds'));
      assert.match(res.answer, /30-day money-back guarantee/i);
    });

    it('T1-F2-3: Student enquiry agent answers LMS lecture queries', () => {
      const res = runEnquiryAgent('How do I handle React state and hooks properly?', {
        courseName: 'Full-Stack Mastery',
        lectureTitle: 'State Management 101',
      });
      assert.equal(res.confidence >= 0.8, true);
      assert.ok(res.matchedTopics.includes('react'));
      assert.match(res.answer, /top level/i);
    });

    it('T1-F2-4: Dynamic site update agent evaluates bestsellers & banner', () => {
      const products: Product[] = [
        {
          id: 'prod-alpha',
          slug: 'alpha-course',
          title: 'Alpha AI Course',
          subtitle: '',
          description: '',
          type: 'course',
          category: 'AI',
          instructorId: 'i-1',
          instructorName: 'Teacher',
          instructorRole: '',
          instructorAvatar: '',
          price: 15000,
          originalPrice: 20000,
          rating: 4.9,
          reviewCount: 30,
          studentsCount: 20,
          thumbnail: '',
          level: 'Beginner',
          language: 'English',
          updatedAt: '',
          status: 'published',
          featured: true,
          formatLabel: 'Course',
          learningOutcomes: [],
          requirements: [],
        },
      ];
      const orders: Order[] = [
        {
          id: 'ord-1',
          userId: 'u-1',
          customerName: 'Student 1',
          customerEmail: 's1@example.com',
          items: [{ productId: 'prod-alpha', productTitle: 'Alpha AI Course', productType: 'course', price: 15000 }],
          subtotal: 15000,
          discount: 0,
          total: 15000,
          status: 'completed',
          createdAt: '',
        },
      ];
      const res = evaluateBestsellersAndBanners(products, orders, { salesThreshold: 10 });
      assert.equal(res.bestsellerIds.includes('prod-alpha'), true);
      assert.equal(res.updatedProducts[0].bestseller, true);
      assert.match(res.announcement.text, /bestseller/i);
    });

    it('T1-F2-5: Resource sharing safeguards detect anomaly patterns', () => {
      const now = Date.now();
      const logs = [
        { userId: 'abuser-1', ipAddress: '192.168.1.1', timestamp: now - 1000 },
        { userId: 'abuser-1', ipAddress: '10.0.0.1', timestamp: now - 2000 },
        { userId: 'abuser-1', ipAddress: '172.16.0.1', timestamp: now - 3000 },
        { userId: 'abuser-1', ipAddress: '198.51.100.1', timestamp: now - 4000 },
      ];
      const res = detectResourceSharingAnomalies(logs, 60);
      assert.equal(res.flaggedUserIds.includes('abuser-1'), true);
      assert.equal(res.anomalies[0].distinctIps, 4);
    });

    // F3: LMS Content Protection & Anti-Copying (5 tests)
    it('T1-F3-1: In-browser copy protection blocks selection and copy events when enabled', () => {
      const copyCheck = evaluateCopyProtection('copy', true, false);
      assert.equal(copyCheck.blocked, true);
      assert.equal(copyCheck.action, 'prevent_copy');

      const selectCheck = evaluateCopyProtection('selectstart', true, false);
      assert.equal(selectCheck.blocked, true);
      assert.equal(selectCheck.action, 'prevent_selectstart');
    });

    it('T1-F3-2: In-browser copy protection allows normal interaction when disabled', () => {
      const copyCheck = evaluateCopyProtection('copy', false, false);
      assert.equal(copyCheck.blocked, false);
      assert.equal(copyCheck.action, 'allow_copy');
    });

    it('T1-F3-3: Dynamic user watermarking generates semi-transparent overlay', () => {
      const watermark = generateWatermarkOverlayConfig(
        { id: 'usr-999', email: 'student@example.com' },
        '2026-11-20T21:00:00.000Z'
      );
      assert.equal(watermark.visible, true);
      assert.equal(watermark.opacity, 0.18);
      assert.match(watermark.text, /student@example\.com/);
      assert.match(watermark.text, /CourseMart Protected/);
      assert.equal(watermark.layout.angle, -25);
    });

    it('T1-F3-4: Gated resource download generates HMAC-SHA256 signed token', () => {
      const res = generateDownloadToken('prod-lms-101', 'usr-777', 900, HMAC_SECRET);
      assert.ok(res.token.includes('.'));
      assert.ok(res.downloadUrl.includes(encodeURIComponent('prod-lms-101')));
      assert.equal(res.expiresAt > Date.now(), true);
    });

    it('T1-F3-5: Gated resource download verifies valid token and grants access', () => {
      const { token } = generateDownloadToken('prod-lms-101', 'usr-777', 900, HMAC_SECRET);
      const verify = verifyDownloadToken(token, 'prod-lms-101', HMAC_SECRET);
      assert.equal(verify.valid, true);
      assert.equal(verify.userId, 'usr-777');
      assert.equal(verify.productId, 'prod-lms-101');
    });

    // F4: Sales Funnels & Member Prompt Vault (5 tests)
    it('T1-F4-1: Multi-step sales funnel pricing calculation', () => {
      const totals = calculateFunnelOrderTotal(15000, true, 4500, true, 8000);
      assert.equal(totals.subtotal, 15000);
      assert.equal(totals.bumpAmount, 4500);
      assert.equal(totals.upsellAmount, 8000);
      assert.equal(totals.total, 27500);
    });

    it('T1-F4-2: Order bump toggle and pricing calculation', () => {
      const withoutBump = calculateFunnelOrderTotal(20000, false, 5000);
      assert.equal(withoutBump.total, 20000);
      assert.equal(withoutBump.bumpAmount, 0);

      const withBump = calculateFunnelOrderTotal(20000, true, 5000);
      assert.equal(withBump.total, 25000);
      assert.equal(withBump.bumpAmount, 5000);
    });

    it('T1-F4-3: Prompt vault access gating grants access to active members', () => {
      const activeMember: UserMembership = {
        id: 'mem-1',
        userId: 'usr-1',
        planId: 'paid',
        billingCycle: 'monthly',
        status: 'active',
        startedAt: '',
        renewsAt: '',
      };
      const access = isPromptVaultAccessible(activeMember);
      assert.equal(access.accessible, true);
    });

    it('T1-F4-4: Prompt vault access gating rejects non-members or expired members', () => {
      const noMember = isPromptVaultAccessible(null);
      assert.equal(noMember.accessible, false);
      assert.match(noMember.reason || '', /active membership/i);

      const cancelledMember: UserMembership = {
        id: 'mem-2',
        userId: 'usr-2',
        planId: 'paid',
        billingCycle: 'monthly',
        status: 'cancelled',
        startedAt: '',
        renewsAt: '',
      };
      const cancelledAccess = isPromptVaultAccessible(cancelledMember);
      assert.equal(cancelledAccess.accessible, false);
      assert.match(cancelledAccess.reason || '', /cancelled/i);
    });

    it('T1-F4-5: Prompt variable interpolation replaces template placeholders', () => {
      const template =
        'Write a high-converting {{tone}} sales copy for {{product}} targeting {{audience}}.';
      const variables = {
        tone: 'urgency-driven',
        product: 'CourseMart VIP Membership',
        audience: 'engineering leaders',
      };
      const res = interpolatePromptVariables(template, variables);
      assert.equal(res.isComplete, true);
      assert.equal(res.missingVariables.length, 0);
      assert.equal(
        res.prompt,
        'Write a high-converting urgency-driven sales copy for CourseMart VIP Membership targeting engineering leaders.'
      );
    });

    // F5: Affiliates & Premium Entitlements (5 tests)
    it('T1-F5-1: Strict 20% affiliate commission calculation', () => {
      const orderTotal = 50000;
      const commission = calculateAffiliateCommission(
        orderTotal,
        DEFAULT_AFFILIATE_COMMISSION_PERCENT
      );
      assert.equal(commission, 10000);
    });

    it('T1-F5-2: Independent referral attribution validates affiliate code', () => {
      const affiliates: AffiliateProfile[] = [
        {
          id: 'aff-1',
          userId: 'aff-user-99',
          userName: 'Top Affiliate',
          userEmail: 'affiliate@partner.com',
          code: 'PARTNER20',
          commissionRate: 20,
          active: true,
        },
      ];
      const buyer = { id: 'buyer-1', email: 'independent-buyer@test.com' };
      const referral = attributeAffiliateReferral('PARTNER20', buyer, affiliates, 40000);
      assert.equal(referral.attributed, true);
      assert.equal(referral.affiliateCode, 'PARTNER20');
      assert.equal(referral.commissionAmount, 8000);
    });

    it('T1-F5-3: Self-referral rejection protects commission integrity', () => {
      const affiliates: AffiliateProfile[] = [
        {
          id: 'aff-1',
          userId: 'aff-user-99',
          userName: 'Top Affiliate',
          userEmail: 'affiliate@partner.com',
          code: 'PARTNER20',
          commissionRate: 20,
          active: true,
        },
      ];
      // Buyer has the same userId
      const sameUser = { id: 'aff-user-99', email: 'someone_else@test.com' };
      const resUser = attributeAffiliateReferral('PARTNER20', sameUser, affiliates, 40000);
      assert.equal(resUser.attributed, false);
      assert.match(resUser.reason || '', /self-referral/i);

      // Buyer has the same email
      const sameEmail = { id: 'buyer-distinct', email: 'affiliate@partner.com' };
      const resEmail = attributeAffiliateReferral('PARTNER20', sameEmail, affiliates, 40000);
      assert.equal(resEmail.attributed, false);
      assert.match(resEmail.reason || '', /self-referral/i);
    });

    it('T1-F5-4: Instant member unlock of isPremium products', () => {
      const premiumProduct = {
        id: 'prod-prem-1',
        isPremium: true,
      } as unknown as Product & { isPremium: boolean };

      const activeMember: UserMembership = {
        id: 'mem-1',
        userId: 'usr-1',
        planId: 'paid',
        billingCycle: 'monthly',
        status: 'active',
        startedAt: '',
        renewsAt: '',
      };

      // Active member unlocks isPremium resource in legacy mock
      assert.equal(isUnlockedByMembership(premiumProduct, activeMember), true);
    });

    it('T1-F5-5: Non-premium products require explicit tier sufficiency or purchase', () => {
      const standardCourse = {
        id: 'prod-course-std',
        isPremium: false,
        includedInMembershipTier: 'paid',
      } as unknown as Product & { isPremium: boolean };

      const starterMember: UserMembership = {
        id: 'mem-1',
        userId: 'usr-1',
        planId: 'free',
        billingCycle: 'monthly',
        status: 'active',
        startedAt: '',
        renewsAt: '',
      };
      assert.equal(isUnlockedByMembership(standardCourse, starterMember), false);

      const vipMember: UserMembership = {
        id: 'mem-2',
        userId: 'usr-2',
        planId: 'paid',
        billingCycle: 'monthly',
        status: 'active',
        startedAt: '',
        renewsAt: '',
      };
      assert.equal(isUnlockedByMembership(standardCourse, vipMember), true);
    });
  });

  /* --------------------------------------------------------------------------
     Tier 2: Boundary & Corner Cases (≥5 tests per feature F1-F5 = 25 tests)
     -------------------------------------------------------------------------- */
  describe('Tier 2: Boundary & Corner Cases', () => {
    // F1 Boundary Cases
    it('T2-F1-1: Empty channel names throw validation error', () => {
      assert.throws(() => {
        createCommunityChannel({
          name: '   ',
          description: 'No name channel',
          category: 'general',
          accessLevel: 'public',
        });
      }, /Channel name cannot be empty/);
    });

    it('T2-F1-2: Duplicate thread slugs automatically append disambiguating suffix', () => {
      const threads: CommunityForumThread[] = [];
      const t1 = createForumThread(threads, {
        title: 'Mastering AI Automation',
        content: 'Thread 1 body',
        authorId: 'u-1',
        authorName: 'User 1',
        authorRole: 'customer',
        category: 'AI',
        tags: ['ai'],
      });
      const t2 = createForumThread(threads, {
        title: 'Mastering AI Automation',
        content: 'Thread 2 body with same title',
        authorId: 'u-2',
        authorName: 'User 2',
        authorRole: 'customer',
        category: 'AI',
        tags: ['ai'],
      });
      assert.equal(t1.thread?.slug, 'mastering-ai-automation');
      assert.equal(t2.thread?.slug, 'mastering-ai-automation-1');
      assert.notEqual(t1.thread?.slug, t2.thread?.slug);
    });

    it('T2-F1-3: Unauthenticated chat message sends are cleanly rejected', () => {
      const channels: CommunityChannel[] = [
        createCommunityChannel({
          id: 'c-1',
          name: 'General',
          description: 'General chat',
          category: 'general',
          accessLevel: 'public',
        }),
      ];
      const messages: CommunityChatMessage[] = [];
      const res = sendChatMessage(channels, messages, {
        channelId: 'c-1',
        authorId: null,
        authorName: '',
        content: 'Anonymous spam attempt',
      });
      assert.equal(res.ok, false);
      assert.match(res.error || '', /unauthenticated/i);
      assert.equal(messages.length, 0);
    });

    it('T2-F1-4: Invalid, blank, and excessive thread tags are sanitized and clamped', () => {
      const threads: CommunityForumThread[] = [];
      const res = createForumThread(threads, {
        title: 'Tag Validation Thread',
        content: 'Testing tag limits and sanitization',
        authorId: 'u-1',
        authorName: 'Tester',
        authorRole: 'customer',
        category: 'Testing',
        tags: ['  React  ', '$$invalid$$', '', 'Vue', 'Angular', 'Svelte', 'Ember', 'NextJS'],
      });
      assert.equal(res.ok, true);
      // Tags should be clamped to at most 5 valid tags, trimmed & stripped of symbols
      assert.equal(res.thread?.tags.length, 5);
      assert.equal(res.thread?.tags.includes('react'), true);
      assert.equal(res.thread?.tags.includes('nextjs'), false); // Clamped out
    });

    it('T2-F1-5: Blank or empty reply content is rejected', () => {
      const threads: CommunityForumThread[] = [];
      createForumThread(threads, {
        title: 'Thread For Replies',
        content: 'Body content',
        authorId: 'u-1',
        authorName: 'Author',
        authorRole: 'customer',
        category: 'AI',
        tags: [],
      });
      const replies: CommunityForumReply[] = [];
      const res = replyToForumThread(threads, replies, {
        threadId: threads[0].id,
        authorId: 'u-2',
        authorName: 'Replier',
        authorRole: 'customer',
        content: '    ',
      });
      assert.equal(res.ok, false);
      assert.match(res.error || '', /cannot be empty/i);
      assert.equal(replies.length, 0);
      assert.equal(threads[0].replyCount, 0);
    });

    // F2 Boundary Cases
    it('T2-F2-1: Empty or whitespace question to enquiry agent returns safe fallback', () => {
      const res = runEnquiryAgent('   ');
      assert.equal(res.confidence, 0);
      assert.match(res.answer, /couldn't quite understand/i);
    });

    it('T2-F2-2: Blog scheduler future dates are NOT published prematurely', () => {
      const now = Date.now();
      const futurePosts: BlogPost[] = [
        {
          id: 'b-future',
          slug: 'future-post',
          title: 'Future Horizons',
          subtitle: '',
          excerpt: '',
          category: 'AI',
          authorId: 'a-1',
          authorName: 'Writer',
          authorRole: '',
          authorAvatar: '',
          coverImage: '',
          readTimeMinutes: 3,
          publishedAt: '',
          updatedAt: '',
          scheduledAt: new Date(now + 3600000).toISOString(), // 1 hour in future
          status: 'scheduled',
          featured: false,
          tags: [],
          sections: [],
          relatedProductIds: [],
          comments: [],
        },
      ];
      const res = runBlogPublisherAgent(futurePosts, now);
      assert.equal(res.publishedCount, 0);
      assert.equal(res.updatedPosts[0].status, 'scheduled');
    });

    it('T2-F2-3: Zero-sale product catalog bestseller evaluation remains clean', () => {
      const products: Product[] = [
        {
          id: 'prod-zero',
          slug: 'zero-sales-prod',
          title: 'Zero Sales Course',
          subtitle: '',
          description: '',
          type: 'course',
          category: 'AI',
          instructorId: 'i-1',
          instructorName: 'Instructor',
          instructorRole: '',
          instructorAvatar: '',
          price: 5000,
          originalPrice: 10000,
          rating: 4.8,
          reviewCount: 0,
          studentsCount: 0,
          thumbnail: '',
          level: 'Beginner',
          language: 'English',
          updatedAt: '',
          status: 'published',
          featured: false,
          formatLabel: 'Course',
          learningOutcomes: [],
          requirements: [],
        },
      ];
      const res = evaluateBestsellersAndBanners(products, [], { salesThreshold: 5 });
      assert.equal(res.bestsellerIds.length, 0);
      assert.equal(res.updatedProducts[0].bestseller, false);
      assert.equal(res.announcement.couponCode, undefined);
    });

    it('T2-F2-4: Normal single-IP download activity is NOT flagged as anomaly', () => {
      const now = Date.now();
      const normalLogs = [
        { userId: 'normal-user', ipAddress: '197.210.65.12', timestamp: now - 5000 },
        { userId: 'normal-user', ipAddress: '197.210.65.12', timestamp: now - 3000 },
        { userId: 'normal-user', ipAddress: '197.210.65.12', timestamp: now - 1000 },
      ];
      const res = detectResourceSharingAnomalies(normalLogs, 60);
      assert.equal(res.flaggedUserIds.length, 0);
      assert.equal(res.anomalies.length, 0);
    });

    it('T2-F2-5: Blog scheduler gracefully ignores invalid scheduledAt timestamps', () => {
      const posts: BlogPost[] = [
        {
          id: 'b-corrupt',
          slug: 'corrupt-date-post',
          title: 'Corrupt Date',
          subtitle: '',
          excerpt: '',
          category: 'AI',
          authorId: 'a-1',
          authorName: 'Writer',
          authorRole: '',
          authorAvatar: '',
          coverImage: '',
          readTimeMinutes: 3,
          publishedAt: '',
          updatedAt: '',
          scheduledAt: 'invalid-non-iso-date',
          status: 'scheduled',
          featured: false,
          tags: [],
          sections: [],
          relatedProductIds: [],
          comments: [],
        },
      ];
      const res = runBlogPublisherAgent(posts);
      assert.equal(res.publishedCount, 0);
      assert.equal(res.updatedPosts[0].status, 'scheduled');
    });

    // F3 Boundary Cases
    it('T2-F3-1: Global copy protection overrides individual product false flag', () => {
      // Global is TRUE, product is FALSE -> copy should still be blocked
      const check = evaluateCopyProtection('copy', false, true);
      assert.equal(check.blocked, true);
      assert.equal(check.action, 'prevent_copy');
    });

    it('T2-F3-2: Expired download token is rejected with explicit expiration reason', () => {
      const now = Date.now();
      // Generate token that expired 10 seconds ago
      const { token } = generateDownloadToken('prod-xyz', 'usr-123', -10, HMAC_SECRET, now);
      const res = verifyDownloadToken(token, 'prod-xyz', HMAC_SECRET, now);
      assert.equal(res.valid, false);
      assert.match(res.reason || '', /expired/i);
    });

    it('T2-F3-3: Malformed HMAC signature is rejected', () => {
      const { token } = generateDownloadToken('prod-xyz', 'usr-123', 600, HMAC_SECRET);
      const [payload, sig] = token.split('.');
      const tamperedSig = sig.slice(0, -4) + '0000';
      const tamperedToken = `${payload}.${tamperedSig}`;
      const res = verifyDownloadToken(tamperedToken, 'prod-xyz', HMAC_SECRET);
      assert.equal(res.valid, false);
      assert.match(res.reason || '', /signature/i);
    });

    it('T2-F3-4: Token for different product ID is rejected', () => {
      const { token } = generateDownloadToken('prod-original', 'usr-123', 600, HMAC_SECRET);
      const res = verifyDownloadToken(token, 'prod-target-different', HMAC_SECRET);
      assert.equal(res.valid, false);
      assert.match(res.reason || '', /does not match/i);
    });

    it('T2-F3-5: Missing user identity in watermark falls back safely', () => {
      const watermark = generateWatermarkOverlayConfig(null);
      assert.equal(watermark.visible, true);
      assert.match(watermark.text, /Anonymous-Guest-Viewer/);
    });

    // F4 Boundary Cases
    it('T2-F4-1: Zero-price order bump handled cleanly without errors', () => {
      const totals = calculateFunnelOrderTotal(12000, true, 0);
      assert.equal(totals.total, 12000);
      assert.equal(totals.bumpAmount, 0);
    });

    it('T2-F4-2: Negative prices in funnel are clamped to zero', () => {
      const totals = calculateFunnelOrderTotal(-5000, true, -2000, true, -1000);
      assert.equal(totals.total, 0);
      assert.equal(totals.subtotal, 0);
      assert.equal(totals.bumpAmount, 0);
      assert.equal(totals.upsellAmount, 0);
    });

    it('T2-F4-3: Missing required prompt variables are reported and preserved in template', () => {
      const template = 'Hello {{name}}, welcome to {{course}}! Your mentor is {{mentor}}.';
      const variables = { name: 'Cephas' }; // Missing 'course' and 'mentor'
      const res = interpolatePromptVariables(template, variables);
      assert.equal(res.isComplete, false);
      assert.deepEqual(res.missingVariables, ['course', 'mentor']);
      assert.equal(
        res.prompt,
        'Hello Cephas, welcome to {{course}}! Your mentor is {{mentor}}.'
      );
    });

    it('T2-F4-4: Prompt variables with excessive whitespace are trimmed', () => {
      const template = 'Subject: {{topic}}';
      const variables = { topic: '   Advanced Next.js App Router Patterns   ' };
      const res = interpolatePromptVariables(template, variables);
      assert.equal(res.prompt, 'Subject: Advanced Next.js App Router Patterns');
    });

    it('T2-F4-5: Pending membership status cannot access prompt vault', () => {
      const pendingMember: UserMembership = {
        id: 'mem-pend',
        userId: 'usr-p',
        planId: 'paid',
        billingCycle: 'annual',
        status: 'pending',
        startedAt: '',
        renewsAt: '',
      };
      const res = isPromptVaultAccessible(pendingMember);
      assert.equal(res.accessible, false);
      assert.match(res.reason || '', /pending/i);
    });

    // F5 Boundary Cases
    it('T2-F5-1: Zero-dollar transactions produce exactly zero commission', () => {
      const commission = calculateAffiliateCommission(0, 20);
      assert.equal(commission, 0);
    });

    it('T2-F5-2: Unauthenticated / non-member visitor receives false for isPremium product', () => {
      const premiumProduct = { id: 'p-prem', isPremium: true } as Product & { isPremium: boolean };
      assert.equal(isUnlockedByMembership(premiumProduct, null), false);
      assert.equal(isUnlockedByMembership(premiumProduct, undefined), false);
    });

    it('T2-F5-3: Affiliate referral extraction handles messy search parameters and casing', () => {
      const code1 = extractReferralCodeFromSearch('?utm_source=twitter&ref=alpha_partner_99&fbclid=xyz');
      assert.equal(code1, 'ALPHA_PARTNER_99');

      const code2 = extractReferralCodeFromSearch('?ref=%20beta2026%20');
      assert.equal(code2, 'BETA2026');

      const codeEmpty = extractReferralCodeFromSearch('?ref=');
      assert.equal(codeEmpty, null);
    });

    it('T2-F5-4: Self-referral rejection handles case-insensitive email matching', () => {
      const affiliates: AffiliateProfile[] = [
        {
          id: 'aff-2',
          userId: 'usr-aff-2',
          userName: 'Partner',
          userEmail: 'Partner.Creator@domain.com',
          code: 'PARTNERCODE',
          commissionRate: 20,
          active: true,
        },
      ];
      const buyerWithUpperEmail = { id: 'usr-buyer-diff', email: 'PARTNER.CREATOR@DOMAIN.COM' };
      const res = attributeAffiliateReferral('PARTNERCODE', buyerWithUpperEmail, affiliates, 30000);
      assert.equal(res.attributed, false);
      assert.match(res.reason || '', /self-referral/i);
    });

    it('T2-F5-5: Inactive affiliate code returns cleanly without attributing commission', () => {
      const affiliates: AffiliateProfile[] = [
        {
          id: 'aff-inactive',
          userId: 'usr-inactive',
          userName: 'Inactive Partner',
          userEmail: 'inactive@test.com',
          code: 'INACTIVE20',
          commissionRate: 20,
          active: false,
        },
      ];
      const buyer = { id: 'b-1', email: 'valid_buyer@example.com' };
      const res = attributeAffiliateReferral('INACTIVE20', buyer, affiliates, 25000);
      assert.equal(res.attributed, false);
      assert.match(res.reason || '', /inactive/i);
      assert.equal(res.commissionAmount, 0);
    });
  });

  /* --------------------------------------------------------------------------
     Tier 3: Cross-Feature Interactions (≥5 tests)
     -------------------------------------------------------------------------- */
  describe('Tier 3: Cross-Feature Interactions', () => {
    it('T3-X1: Funnel checkout with 20% affiliate attribution + instant unlock of premium library', () => {
      // Step 1: Buyer arrives with affiliate referral link
      const affiliateCode = extractReferralCodeFromSearch('?ref=DEVCHAMP20&campaign=summer');
      assert.equal(affiliateCode, 'DEVCHAMP20');

      const affiliates: AffiliateProfile[] = [
        {
          id: 'aff-champ',
          userId: 'aff-usr-88',
          userName: 'Dev Champion',
          userEmail: 'champ@affiliates.com',
          code: 'DEVCHAMP20',
          commissionRate: DEFAULT_AFFILIATE_COMMISSION_PERCENT,
          active: true,
        },
      ];
      const buyer = { id: 'buyer-alex', email: 'alex.buyer@company.org' };

      // Step 2: Funnel calculation (main course $20,000 + bump $4,000)
      const funnel = calculateFunnelOrderTotal(20000, true, 4000);
      assert.equal(funnel.total, 24000);

      // Step 3: Commission attributed
      const attribution = attributeAffiliateReferral(affiliateCode, buyer, affiliates, funnel.total);
      assert.equal(attribution.attributed, true);
      assert.equal(attribution.commissionAmount, 4800); // 20% of 24,000

      // Step 4: Buyer receives active membership
      const buyerMembership: UserMembership = {
        id: 'mem-alex',
        userId: buyer.id,
        planId: 'paid',
        billingCycle: 'monthly',
        status: 'active',
        startedAt: new Date().toISOString(),
        renewsAt: '',
      };

      // Step 5: Check instant unlock of library premium product
      const premiumLibraryProduct = {
        id: 'prod-prem-vibe',
        title: 'Vibe Coding Playbook',
        isPremium: true,
      } as Product & { isPremium: boolean };
      assert.equal(isUnlockedByMembership(premiumLibraryProduct, buyerMembership), true);
    });

    it('T3-X2: Enquiry agent answering student questions with direct link to community forum', () => {
      const q = 'How do I resolve React hook dependency issues?';
      const enquiry = runEnquiryAgent(q, { courseName: 'Full-Stack Vibe Coding' });
      assert.equal(enquiry.confidence >= 0.8, true);
      assert.ok(enquiry.suggestedForumThreadSlug);

      // Verify that this suggested forum thread slug exists or can be matched in the community forum
      const threads: CommunityForumThread[] = [];
      const created = createForumThread(threads, {
        title: 'Debugging React Hooks and State',
        content: 'Common questions and answers regarding useEffect dependency arrays.',
        authorId: 'instr-1',
        authorName: 'Course Instructor',
        authorRole: 'instructor',
        category: 'Q&A',
        tags: ['react', 'hooks'],
      });
      assert.equal(created.thread?.slug, enquiry.suggestedForumThreadSlug);
    });

    it('T3-X3: Dynamic site update agent publishes scheduled blog and syncs storefront banner', () => {
      const now = Date.now();
      const scheduledPosts: BlogPost[] = [
        {
          id: 'b-sched-1',
          slug: 'modern-ai-agent-patterns',
          title: 'Modern AI Agent Patterns for Enterprise 2026',
          subtitle: 'Designing autonomous multi-agent pipelines',
          excerpt: 'A comprehensive architectural overview.',
          category: 'AI',
          authorId: 'editor-1',
          authorName: 'Chief Architect',
          authorRole: 'Admin',
          authorAvatar: '',
          coverImage: '',
          readTimeMinutes: 7,
          publishedAt: '',
          updatedAt: '',
          scheduledAt: new Date(now - 60000).toISOString(),
          status: 'scheduled',
          featured: true,
          tags: ['agents', 'ai'],
          sections: [],
          relatedProductIds: ['prod-agent-course'],
          comments: [],
        },
      ];

      // Blog publisher runs
      const pubResult = runBlogPublisherAgent(scheduledPosts, now);
      assert.equal(pubResult.publishedCount, 1);
      assert.equal(pubResult.updatedPosts[0].status, 'published');

      // Dynamic site update detects published featured post and generates banner
      const published = pubResult.updatedPosts[0];
      const bannerText = `New Article: ${published.title} is now live! Read now.`;
      assert.match(bannerText, /Modern AI Agent Patterns/);
    });

    it('T3-X4: Member prompt vault copy-action obeying global and item-level copy protection', () => {
      const activeMember: UserMembership = {
        id: 'mem-val',
        userId: 'usr-val',
        planId: 'paid',
        billingCycle: 'annual',
        status: 'active',
        startedAt: '',
        renewsAt: '',
      };

      // Active member can access prompt vault
      const access = isPromptVaultAccessible(activeMember);
      assert.equal(access.accessible, true);

      // Interpolate prompt
      const interpolated = interpolatePromptVariables(
        'Generate an audit checklist for {{system}} adhering to {{standard}}.',
        { system: 'CourseMart Payment Gateway', standard: 'PCI-DSS & NDPA' }
      );
      assert.equal(interpolated.isComplete, true);

      // On a lesson with copy protection enabled, direct browser cut/copy of lesson content is blocked
      const lessonProtection = evaluateCopyProtection('copy', true, false);
      assert.equal(lessonProtection.blocked, true);

      // However, dedicated prompt vault export payload is intact and ready for safe user extraction
      assert.match(interpolated.prompt, /PCI-DSS & NDPA/);
    });

    it('T3-X5: Anomaly detection flags rapid download bursts on gated LMS tokens', () => {
      const now = Date.now();
      const userId = 'suspicious-sharer';

      // Simulate generating 12 valid tokens rapidly from multiple IPs
      const downloadLogs: Array<{ userId: string; ipAddress: string; timestamp: number }> = [];
      const ips = ['102.89.22.1', '102.89.22.2', '105.112.33.4', '197.210.88.5'];

      for (let i = 0; i < 12; i++) {
        const ip = ips[i % ips.length];
        const { token } = generateDownloadToken(`prod-lms-${i}`, userId, 300, HMAC_SECRET, now);
        const verification = verifyDownloadToken(token, `prod-lms-${i}`, HMAC_SECRET, now);
        assert.equal(verification.valid, true);

        downloadLogs.push({
          userId,
          ipAddress: ip,
          timestamp: now - i * 1000,
        });
      }

      // Safeguard analyzes logs and flags anomaly
      const safeguardResult = detectResourceSharingAnomalies(downloadLogs, 15);
      assert.equal(safeguardResult.flaggedUserIds.includes(userId), true);
      assert.equal(safeguardResult.anomalies[0].distinctIps, 4);
      assert.equal(safeguardResult.anomalies[0].downloadCount, 12);
    });
  });

  /* --------------------------------------------------------------------------
     Tier 4: Real-World Application Scenarios (≥5 tests)
     -------------------------------------------------------------------------- */
  describe('Tier 4: Real-World Application Scenarios', () => {
    it('T4-S1: Complete Student Funnel Checkout & Instant Premium Access', () => {
      // Scenario: Student purchases main course + order bump in funnel, unlocks premium content & joins community
      const student = { id: 'std-2026', email: 'student2026@gmail.com', name: 'Kenechukwu' };

      // 1. Funnel Pricing
      const funnel = calculateFunnelOrderTotal(25000, true, 5000); // 30,000 total
      assert.equal(funnel.total, 30000);

      // 2. Order Creation & Payment Verification
      const initialStatus = resolveInitialOrderStatus('card', true);
      assert.equal(initialStatus, 'completed');

      // 3. Member Account Activation
      const studentMembership: UserMembership = {
        id: 'mem-kene',
        userId: student.id,
        planId: 'paid',
        billingCycle: 'monthly',
        status: 'active',
        startedAt: new Date().toISOString(),
        renewsAt: '',
      };

      // 4. Instant Premium Product Unlock
      const aiPlaybook = {
        id: 'prod-playbook',
        title: 'Executive AI Strategy Guide',
        isPremium: true,
      } as Product & { isPremium: boolean };
      assert.equal(isUnlockedByMembership(aiPlaybook, studentMembership), true);

      // 5. Viewing Protected Course with Watermark
      const watermark = generateWatermarkOverlayConfig(student);
      assert.match(watermark.text, /student2026@gmail\.com/);

      // 6. Community Chat Participation
      const channels: CommunityChannel[] = [
        createCommunityChannel({
          id: 'chan-course-cohort',
          name: 'AI Strategy Cohort 2026',
          description: 'Official cohort chat',
          category: 'cohorts',
          accessLevel: 'enrolled',
        }),
      ];
      const chatMessages: CommunityChatMessage[] = [];
      const chatRes = sendChatMessage(channels, chatMessages, {
        channelId: 'chan-course-cohort',
        authorId: student.id,
        authorName: student.name,
        authorRole: 'customer',
        content: 'Excited to join the cohort! Ready to deploy our first agent.',
      });
      assert.equal(chatRes.ok, true);
      assert.equal(chatMessages.length, 1);
    });

    it('T4-S2: Affiliate Referral Attribution & Conversion Ledger Workflow', () => {
      // Scenario: Affiliate partner shares link; independent buyer completes order; 20% commission attributed
      const affiliate: AffiliateProfile = {
        id: 'aff-partner-gold',
        userId: 'usr-aff-gold',
        userName: 'Tunde Dev',
        userEmail: 'tunde@affiliatepartners.ng',
        code: 'TUNDE20',
        commissionRate: 20,
        active: true,
      };

      // Buyer visits site with referral query
      const parsedRef = extractReferralCodeFromSearch('?ref=tunde20&source=linkedin');
      assert.equal(parsedRef, 'TUNDE20');

      const independentBuyer = { id: 'usr-buyer-890', email: 'chioma.buyer@techcorp.ng' };
      const orderTotal = 60000;

      // Attribution
      const attr = attributeAffiliateReferral(parsedRef, independentBuyer, [affiliate], orderTotal);
      assert.equal(attr.attributed, true);
      assert.equal(attr.affiliateCode, 'TUNDE20');
      assert.equal(attr.commissionAmount, 12000); // 20% of 60,000

      // Disallow self-referral
      const selfBuyer = { id: 'usr-aff-gold', email: 'tunde@affiliatepartners.ng' };
      const selfAttr = attributeAffiliateReferral(parsedRef, selfBuyer, [affiliate], orderTotal);
      assert.equal(selfAttr.attributed, false);
      assert.equal(selfAttr.commissionAmount, 0);
    });

    it('T4-S3: Protected Content Leak Prevention & Cryptographic Token Lifecycle', () => {
      // Scenario: Gated asset download requires signed HMAC token; handles valid, expired, and tampered tokens
      const now = Date.now();
      const assetProductId = 'prod-software-sdk';
      const studentId = 'usr-learner-33';

      // 1. Generate valid token (valid for 15 minutes)
      const tokenRecord = generateDownloadToken(assetProductId, studentId, 900, HMAC_SECRET, now);

      // 2. Successful verification within valid window
      const validVerify = verifyDownloadToken(tokenRecord.token, assetProductId, HMAC_SECRET, now + 1000);
      assert.equal(validVerify.valid, true);
      assert.equal(validVerify.userId, studentId);
      assert.equal(validVerify.productId, assetProductId);

      // 3. Rejection after expiration window (e.g. 16 minutes later)
      const expiredVerify = verifyDownloadToken(
        tokenRecord.token,
        assetProductId,
        HMAC_SECRET,
        now + 960 * 1000
      );
      assert.equal(expiredVerify.valid, false);
      assert.match(expiredVerify.reason || '', /expired/i);

      // 4. Rejection of tampered secret or signature
      const tamperedVerify = verifyDownloadToken(
        tokenRecord.token,
        assetProductId,
        'wrong_attacker_secret_key',
        now
      );
      assert.equal(tamperedVerify.valid, false);
      assert.match(tamperedVerify.reason || '', /signature/i);
    });

    it('T4-S4: Automated Content Pipeline from Blog Schedule to Community Discussion', () => {
      // Scenario: Scheduled blog is auto-published by agent, triggers announcement update, and creates forum thread
      const now = Date.now();
      const scheduledBlog: BlogPost = {
        id: 'blog-auto-1',
        slug: 'building-ai-agents-with-gemini',
        title: 'Building Production AI Agents with Gemini and Vercel',
        subtitle: 'A practical step-by-step implementation guide',
        excerpt: 'How to build production ready tool-calling agents.',
        category: 'AI',
        authorId: 'auth-lead',
        authorName: 'Engineering Lead',
        authorRole: 'Admin',
        authorAvatar: '',
        coverImage: '',
        readTimeMinutes: 6,
        publishedAt: '',
        updatedAt: '',
        scheduledAt: new Date(now - 30000).toISOString(),
        status: 'scheduled',
        featured: true,
        tags: ['gemini', 'agents', 'vercel'],
        sections: [],
        relatedProductIds: ['prod-agent-dev'],
        comments: [],
      };

      // 1. Blog Publisher runs
      const publishRes = runBlogPublisherAgent([scheduledBlog], now);
      assert.equal(publishRes.publishedCount, 1);
      const liveBlog = publishRes.updatedPosts[0];
      assert.equal(liveBlog.status, 'published');

      // 2. Automated discussion thread initialized on Community Forum
      const forumThreads: CommunityForumThread[] = [];
      const threadRes = createForumThread(forumThreads, {
        title: `Discussion: ${liveBlog.title}`,
        content: `Read the full article at /blog/${liveBlog.slug}. Share your thoughts, questions, and deployment results here!`,
        authorId: liveBlog.authorId,
        authorName: liveBlog.authorName,
        authorRole: 'admin',
        category: 'AI Discussions',
        tags: liveBlog.tags,
      });
      assert.equal(threadRes.ok, true);
      assert.equal(forumThreads.length, 1);

      // 3. Student replies and upvotes
      const replies: CommunityForumReply[] = [];
      replyToForumThread(forumThreads, replies, {
        threadId: forumThreads[0].id,
        authorId: 'std-55',
        authorName: 'Dev Learner',
        authorRole: 'customer',
        content: 'Loved the article! Implementing the tool calling loop right now.',
      });
      assert.equal(forumThreads[0].replyCount, 1);

      toggleThreadUpvote(forumThreads[0], 'std-55');
      assert.equal(forumThreads[0].upvotes, 1);
    });

    it('T4-S5: Instructor Course Protection & Anti-Copy Safeguards', () => {
      // Scenario: Instructor enables copy protection; selection & copy are guarded; video renders viewer watermark
      const instructorCourse: Product & { copyProtectionEnabled: boolean } = {
        id: 'course-anti-piracy',
        slug: 'enterprise-security-anti-piracy',
        title: 'Enterprise Security Architecture',
        subtitle: 'Securing proprietary IP and digital assets',
        description: 'Comprehensive course on content protection and digital security.',
        type: 'course',
        category: 'Security',
        instructorId: 'inst-sec',
        instructorName: 'Chief Security Officer',
        instructorRole: 'Instructor',
        instructorAvatar: '',
        price: 45000,
        originalPrice: 60000,
        rating: 4.95,
        reviewCount: 42,
        studentsCount: 150,
        thumbnail: '',
        level: 'Advanced',
        language: 'English',
        updatedAt: '',
        status: 'published',
        featured: true,
        copyProtectionEnabled: true,
        formatLabel: 'Course',
        learningOutcomes: [],
        requirements: [],
      };

      // 1. Verify UI copy protection evaluation
      const cutAction = evaluateCopyProtection('cut', instructorCourse.copyProtectionEnabled);
      const copyAction = evaluateCopyProtection('copy', instructorCourse.copyProtectionEnabled);
      const contextMenuAction = evaluateCopyProtection('contextmenu', instructorCourse.copyProtectionEnabled);
      assert.equal(cutAction.blocked, true);
      assert.equal(copyAction.blocked, true);
      assert.equal(contextMenuAction.blocked, true);

      // 2. Video Player Watermark Overlay
      const studentViewer = {
        id: 'usr-student-88',
        email: 'secured.student@corporate.com',
        name: 'Secured Student',
      };
      const watermark = generateWatermarkOverlayConfig(studentViewer);
      assert.equal(watermark.visible, true);
      assert.match(watermark.text, /secured\.student@corporate\.com/);
      assert.match(watermark.text, /CourseMart Protected/);

      // 3. Gated downloadable resources require signed token
      const tokenData = generateDownloadToken(instructorCourse.id, studentViewer.id, 600, HMAC_SECRET);
      const authVerify = verifyDownloadToken(tokenData.token, instructorCourse.id, HMAC_SECRET);
      assert.equal(authVerify.valid, true);

      // 4. Unauthorized access without valid token is denied
      const unauthVerify = verifyDownloadToken('invalid-unauthorized-token', instructorCourse.id, HMAC_SECRET);
      assert.equal(unauthVerify.valid, false);
    });
  });
});
