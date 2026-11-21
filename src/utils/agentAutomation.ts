/**
 * Operational Automation Agents & Workflows (R2)
 *
 * Implements autonomous operations for:
 * 1. Scheduled Blog Post Publication & Social Distribution
 * 2. Autonomous Blog Draft Generation (Gemini AI + Deterministic Offline Fallback)
 * 3. Customer & LMS Student Enquiry Responder (FAQ & Lecture Q&A)
 * 4. Dynamic Site Catalog & Storefront Updates (Bestseller Badges & Banners)
 * 5. Resource Sharing Safeguards & Download Anomaly Auditing
 */

import type {
  BlogPost,
  BlogCategory,
  BlogSection,
  Order,
  Product,
  SocialPostDraft,
  UserRole,
} from '../types/marketplace';
import { buildDeterministicSocialDrafts } from './automation.ts';
import { slugifyText } from './catalogAndBlogs.ts';

/* ============================================================================
   1. Blog Publisher Agent
   ============================================================================ */

export interface ProcessScheduledBlogPostsResult {
  publishedCount: number;
  updatedPosts: BlogPost[];
  publishedPosts: BlogPost[];
  socialDrafts?: Array<Omit<SocialPostDraft, 'id' | 'status' | 'createdAt' | 'updatedAt'>>;
}

/**
 * Scans queued blog posts and automatically transitions posts where
 * `status === 'scheduled'` and `scheduledAt <= nowMs` to `status = 'published'`.
 * Optionally generates platform-native social media drafts.
 */
export function processScheduledBlogPosts(
  posts: BlogPost[],
  nowMs: number = Date.now(),
  options?: { generateSocial?: boolean }
): ProcessScheduledBlogPostsResult {
  const safePosts = (Array.isArray(posts) ? posts : []).filter(
    (p): p is BlogPost => Boolean(p && typeof p === 'object')
  );
  const generateSocial = options?.generateSocial ?? true;
  let publishedCount = 0;
  const publishedPosts: BlogPost[] = [];
  const allSocialDrafts: Array<Omit<SocialPostDraft, 'id' | 'status' | 'createdAt' | 'updatedAt'>> = [];

  const updatedPosts = safePosts.map((post) => {
    if (post && post.status === 'scheduled' && post.scheduledAt) {
      const scheduledMs = Date.parse(post.scheduledAt);
      if (!Number.isNaN(scheduledMs) && scheduledMs <= nowMs) {
        publishedCount += 1;
        const published: BlogPost = {
          ...post,
          status: 'published' as const,
          publishedAt: new Date(nowMs).toISOString(),
          updatedAt: new Date(nowMs).toISOString(),
        };
        publishedPosts.push(published);

        if (generateSocial) {
          const drafts = buildDeterministicSocialDrafts({
            sourceType: 'blog',
            sourceId: published.id,
            sourceTitle: published.title,
            summary: published.excerpt || published.title,
            category: published.category,
            targetPath: `/blog/${published.slug}`,
          });
          allSocialDrafts.push(...drafts);
        }

        return published;
      }
    }
    return post;
  });

  return {
    publishedCount,
    updatedPosts,
    publishedPosts,
    socialDrafts: generateSocial ? allSocialDrafts : undefined,
  };
}

/**
 * Exact signature matching E2E test suite helper for blog publishing.
 */
export function runBlogPublisherAgent(
  posts: BlogPost[],
  nowMs: number = Date.now()
): { publishedCount: number; updatedPosts: BlogPost[] } {
  const result = processScheduledBlogPosts(posts, nowMs, { generateSocial: false });
  return {
    publishedCount: result.publishedCount,
    updatedPosts: result.updatedPosts,
  };
}

/* ============================================================================
   2. Autonomous Blog Draft Generation Engine
   ============================================================================ */

export interface GenerateBlogDraftInput {
  topic: string;
  category?: BlogCategory;
  targetAudience?: string;
  keywords?: string[];
  author?: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  scheduledInHours?: number;
  relatedProductIds?: string[];
}

export interface GeneratedBlogDraft {
  post: BlogPost;
  source: 'gemini' | 'template_fallback';
  metadata: {
    generatedAt: string;
    targetAudience: string;
    wordCount: number;
    estimatedReadTime: number;
  };
}

/**
 * Offline deterministic blog post generator that produces rich, publication-ready
 * articles without invoking live AI model APIs (enforcing zero-token leakage).
 */
export function generateOfflineBlogDraftTemplate(
  input: GenerateBlogDraftInput
): GeneratedBlogDraft {
  const cleanTopic = (input.topic || '').trim();
  if (!cleanTopic) {
    throw new Error('Topic is required to generate blog draft');
  }

  const category: BlogCategory = input.category || 'AI';
  const slug = slugifyText(cleanTopic) || `article-${Date.now()}`;
  const targetAudience = input.targetAudience || 'Digital creators, developers, and entrepreneurs';
  const author = input.author || {
    id: 'agent-blog-bot',
    name: 'CourseMart Editorial Agent',
    role: 'Autonomous AI Editor',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
  };

  const keywords = input.keywords && input.keywords.length > 0
    ? input.keywords
    : ['CourseMart', 'AI', 'Digital Skills', 'Future of Work'];

  const now = new Date();
  const scheduledAt = typeof input.scheduledInHours === 'number' && input.scheduledInHours > 0
    ? new Date(now.getTime() + input.scheduledInHours * 3600 * 1000).toISOString()
    : undefined;

  const sections: BlogSection[] = [
    {
      id: `sec-${Date.now()}-1`,
      blockType: 'section',
      heading: 'Executive Summary',
      body: `In today's fast-evolving technological landscape, mastering ${cleanTopic} has become an indispensable advantage for modern professionals. This comprehensive guide outlines the foundational principles, tactical workflows, and real-world deployment strategies essential for lasting impact.`,
    },
    {
      id: `sec-${Date.now()}-2`,
      blockType: 'callout',
      heading: 'The Architectural Landscape',
      body: `When building and scaling digital products in ${category}, consistency and resilience dictate long-term success. Rather than relying on guesswork, top performers standardize their pipelines through modular, reusable patterns.`,
      calloutTone: 'tip',
    },
    {
      id: `sec-${Date.now()}-3`,
      blockType: 'checklist',
      heading: 'Practical Implementation Steps',
      body: 'Follow these core practices for optimal outcomes:',
      checklistItems: [
        'Discovery & Requirements Analysis',
        'Iterative Deployment with Automated Testing',
        'Continuous Auditing & Security Protection',
      ],
    },
    {
      id: `sec-${Date.now()}-4`,
      blockType: 'section',
      heading: 'Conclusion & Next Steps',
      body: `By adopting these structured workflows for ${cleanTopic}, teams and individual builders can dramatically accelerate their time-to-market while maintaining ironclad quality standards.`,
    },
  ];

  const totalWords = sections.reduce(
    (acc, sec) => acc + (sec.heading + ' ' + sec.body).split(/\s+/).length,
    cleanTopic.split(/\s+/).length
  );
  const estimatedReadTime = Math.max(1, Math.ceil(totalWords / 200));

  const post: BlogPost = {
    id: `post-${Date.now()}-${slug.slice(0, 20)}`,
    slug,
    title: cleanTopic,
    subtitle: `Actionable blueprints and technical architectures for ${targetAudience}`,
    excerpt: `Discover actionable strategies, technical architectures, and practical insights on ${cleanTopic} designed for ${targetAudience}.`,
    category,
    authorId: author.id,
    authorName: author.name,
    authorRole: author.role,
    authorAvatar: author.avatar || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200',
    readTimeMinutes: estimatedReadTime,
    publishedAt: '',
    updatedAt: now.toISOString(),
    scheduledAt,
    status: scheduledAt ? 'scheduled' : 'draft',
    featured: false,
    tags: Array.from(new Set([...keywords, category])),
    seoTitle: `${cleanTopic} | CourseMart Insights`,
    seoDescription: `Master ${cleanTopic} with practical architectures and blueprints designed for ${targetAudience}.`,
    focusKeyword: keywords[0] || cleanTopic,
    sections,
    relatedProductIds: input.relatedProductIds || [],
    comments: [],
  };

  return {
    post,
    source: 'template_fallback',
    metadata: {
      generatedAt: now.toISOString(),
      targetAudience,
      wordCount: totalWords,
      estimatedReadTime,
    },
  };
}

/**
 * Autonomous blog draft engine. Attempts live generation if Gemini client is provided;
 * automatically falls back to deterministic template generation offline.
 */
export async function generateAutonomousBlogDraft(
  input: GenerateBlogDraftInput,
  geminiClient?: any
): Promise<GeneratedBlogDraft> {
  if (!input.topic || !input.topic.trim()) {
    throw new Error('Topic is required to generate blog draft');
  }

  if (geminiClient && typeof geminiClient.models?.generateContent === 'function') {
    try {
      const prompt = `Write a professional blog post outline with sections about: "${input.topic}". Category: ${input.category || 'AI'}. Target Audience: ${input.targetAudience || 'Developers'}.`;
      const response = await geminiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response?.text;
      if (typeof text === 'string' && text.trim().length > 50) {
        const slug = slugifyText(input.topic);
        const totalWords = text.trim().split(/\s+/).length;
        const estimatedReadTime = Math.max(1, Math.ceil(totalWords / 200));
        const now = new Date();
        const scheduledAt = typeof input.scheduledInHours === 'number' && input.scheduledInHours > 0
          ? new Date(now.getTime() + input.scheduledInHours * 3600 * 1000).toISOString()
          : undefined;

        const category: BlogCategory = input.category || 'AI';
        const post: BlogPost = {
          id: `post-${Date.now()}-${slug.slice(0, 20)}`,
          slug,
          title: input.topic.trim(),
          subtitle: `A detailed exploration of ${input.topic}`,
          excerpt: `A detailed exploration of ${input.topic} covering foundational concepts and advanced tactics.`,
          category,
          authorId: input.author?.id || 'agent-gemini',
          authorName: input.author?.name || 'CourseMart AI Co-Pilot',
          authorRole: input.author?.role || 'Autonomous Writer',
          authorAvatar: input.author?.avatar || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
          coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200',
          readTimeMinutes: estimatedReadTime,
          publishedAt: '',
          updatedAt: now.toISOString(),
          scheduledAt,
          status: scheduledAt ? 'scheduled' : 'draft',
          featured: false,
          tags: input.keywords || ['AI', 'Tech'],
          seoTitle: `${input.topic} | CourseMart`,
          seoDescription: `Read about ${input.topic} on CourseMart.`,
          focusKeyword: input.keywords?.[0] || input.topic,
          sections: [
            {
              id: `sec-${Date.now()}-1`,
              blockType: 'section',
              heading: 'Overview',
              body: text.trim(),
            },
          ],
          relatedProductIds: input.relatedProductIds || [],
          comments: [],
        };

        return {
          post,
          source: 'gemini',
          metadata: {
            generatedAt: now.toISOString(),
            targetAudience: input.targetAudience || 'General',
            wordCount: totalWords,
            estimatedReadTime,
          },
        };
      }
    } catch {
      // Fallback to offline template on network/rate-limit error
    }
  }

  return generateOfflineBlogDraftTemplate(input);
}

/* ============================================================================
   3. Automated Enquiry Agent
   ============================================================================ */

export interface EnquiryContext {
  courseName?: string;
  lectureTitle?: string;
  category?: string;
  userRole?: UserRole;
  currentUrl?: string;
}

export interface EnquiryResponse {
  answer: string;
  matchedTopics: string[];
  confidence: number;
  suggestedForumThreadSlug?: string;
}

/**
 * Semantic and deterministic enquiry responder. Analyzes questions for customer
 * support (refunds, certificates, payment types) and LMS student questions (React hooks, state).
 */
export function buildEnquiryResponse(
  question: string,
  context?: EnquiryContext
): EnquiryResponse {
  const cleanQ = typeof question === 'string' ? question.trim() : '';

  if (!cleanQ || cleanQ.replace(/[^a-zA-Z0-9]/g, '').length === 0) {
    return {
      answer:
        "Hello! I couldn't quite understand your question. Could you please provide more details or ask about course enrollment, certificates, or community discussions?",
      matchedTopics: [],
      confidence: 0,
    };
  }

  // 1. Refunds & Billing
  if (/\b(refund|refunds|money back)\b/i.test(cleanQ)) {
    return {
      answer:
        'CourseMart offers a 30-day money-back guarantee on digital courses. Manual GTB transfers and completed card orders can request a refund in their account portal.',
      matchedTopics: ['refunds', 'billing'],
      confidence: 0.95,
      suggestedForumThreadSlug: 'faq-refund-policy-and-settlements',
    };
  }

  // 2. Certificates & Accreditation
  if (/\b(certificate|certificates|accreditation|cm-cert)\b/i.test(cleanQ)) {
    return {
      answer:
        'Certificates of completion are automatically generated with a verifiable CM-CERT code once you achieve at least 70% on all course quizzes.',
      matchedTopics: ['certificates', 'accreditation'],
      confidence: 0.92,
      suggestedForumThreadSlug: 'how-to-verify-and-share-certificates',
    };
  }

  // 3. React / Hooks / Web Dev Curriculum
  if (/\b(react|hooks?|usestate|useeffect|usecontext)\b/i.test(cleanQ)) {
    return {
      answer: `In ${context?.courseName || 'our engineering courses'}, React hooks must be called at the top level of your component. Check the lesson resources for sample code snippets.`,
      matchedTopics: ['react', 'web-development'],
      confidence: 0.88,
      suggestedForumThreadSlug: 'debugging-react-hooks-and-state',
    };
  }

  // 4. Payment Methods: Paystack vs GTB
  if (/\b(paystack|payments?|gtb|bank transfer)\b/i.test(cleanQ)) {
    return {
      answer:
        'We support instant Card/Bank Transfer payments via Paystack (immediate unlock) and manual GTB bank transfers (requires admin payment verification before access is granted).',
      matchedTopics: ['payments', 'checkout'],
      confidence: 0.9,
      suggestedForumThreadSlug: 'payment-methods-paystack-vs-gtb',
    };
  }

  // 5. Membership Tiers & VIP Access
  if (/\b(membership|memberships|vip|pro)\b/i.test(cleanQ)) {
    return {
      answer:
        'CourseMart memberships (Starter, Pro, and VIP) provide instant access to designated premium courses, full digital downloads, and member-only prompt vault access.',
      matchedTopics: ['membership', 'subscriptions'],
      confidence: 0.9,
      suggestedForumThreadSlug: 'membership-tiers-and-benefits',
    };
  }

  // 6. General Support Fallback
  return {
    answer:
      'Thank you for contacting CourseMart support. A community mentor or instructor will follow up with you shortly. You can also search the community forum for similar questions.',
    matchedTopics: ['general-support'],
    confidence: 0.5,
  };
}

/**
 * Exact signature matching E2E test suite helper for enquiry agent.
 */
export function runEnquiryAgent(
  question: string,
  context?: { courseName?: string; lectureTitle?: string }
): {
  answer: string;
  matchedTopics: string[];
  confidence: number;
  suggestedForumThreadSlug?: string;
} {
  return buildEnquiryResponse(question, context);
}

/* ============================================================================
   4. Dynamic Site Catalog & Bestseller Evaluation Engine
   ============================================================================ */

export interface DynamicSiteUpdateOptions {
  salesThreshold?: number; // default: 5
  minRatingThreshold?: number; // default: 4.5
  upcomingEventTitle?: string;
  upcomingEventDate?: string;
}

export interface DynamicSiteUpdateResult {
  updatedProducts: Product[];
  bestsellerIds: string[];
  announcement: {
    text: string;
    couponCode?: string;
  };
  metrics: {
    totalOrdersAnalyzed: number;
    completedOrdersCount: number;
    totalProductsCount: number;
    bestsellersCount: number;
  };
}

/**
 * Analyzes completed orders and student enrollments to dynamically assign `bestseller: boolean`
 * to high-performing products. Generates synchronized storefront announcements and promotional coupons.
 */
export function evaluateDynamicSiteUpdates(
  products: Product[],
  orders: Order[],
  options?: DynamicSiteUpdateOptions
): DynamicSiteUpdateResult {
  const safeProducts = (Array.isArray(products) ? products : []).filter(
    (p): p is Product => Boolean(p && typeof p === 'object' && p.id)
  );
  const safeOrders = (Array.isArray(orders) ? orders : []).filter(
    (o): o is Order => Boolean(o && typeof o === 'object')
  );

  const threshold = options?.salesThreshold ?? 5;
  const minRating = options?.minRatingThreshold ?? 4.5;
  const salesCountByProduct: Record<string, number> = {};

  let completedOrdersCount = 0;
  for (const o of safeOrders) {
    if (o.status === 'completed' && Array.isArray(o.items)) {
      completedOrdersCount += 1;
      for (const item of o.items) {
        if (item && typeof item === 'object' && item.productId) {
          salesCountByProduct[item.productId] = (salesCountByProduct[item.productId] || 0) + 1;
        }
      }
    }
  }

  const bestsellerIds: string[] = [];
  const updatedProducts = safeProducts.map((p) => {
    const totalSales = (salesCountByProduct[p.id] || 0) + (p.studentsCount || 0);
    const isBestseller = totalSales >= threshold && (p.rating || 0) >= minRating;
    if (isBestseller) {
      bestsellerIds.push(p.id);
    }
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

  return {
    updatedProducts,
    bestsellerIds,
    announcement,
    metrics: {
      totalOrdersAnalyzed: safeOrders.length,
      completedOrdersCount,
      totalProductsCount: safeProducts.length,
      bestsellersCount: bestsellerIds.length,
    },
  };
}

/**
 * Exact signature matching E2E test suite helper for bestsellers and banners.
 */
export function evaluateBestsellersAndBanners(
  products: Product[],
  orders: Order[],
  options: { salesThreshold?: number } = {}
): {
  updatedProducts: Product[];
  bestsellerIds: string[];
  announcement: { text: string; couponCode?: string };
} {
  const result = evaluateDynamicSiteUpdates(products, orders, options);
  return {
    updatedProducts: result.updatedProducts,
    bestsellerIds: result.bestsellerIds,
    announcement: result.announcement,
  };
}

/* ============================================================================
   5. Resource Sharing Safeguards & Anomaly Detection
   ============================================================================ */

export interface DownloadLogEntry {
  userId: string;
  ipAddress: string;
  timestamp: number;
  productId?: string;
  licenseKey?: string;
  userAgent?: string;
}

export interface ResourceSharingAnomalyReport {
  userId: string;
  reason: string;
  distinctIps: number;
  downloadCount: number;
}

/**
 * Audits asset download logs within a sliding time window. Flags users exhibiting
 * multi-IP dispersion (>3 distinct IPs) or rapid download bursts (>10 downloads).
 */
export function detectResourceSharingAnomalies(
  downloadLogs: Array<{ userId: string; ipAddress: string; timestamp: number }>,
  windowMinutes: number = 60
): {
  flaggedUserIds: string[];
  anomalies: ResourceSharingAnomalyReport[];
} {
  const now = Date.now();
  const windowMs = (Number(windowMinutes) || 60) * 60 * 1000;
  const safeLogs = (Array.isArray(downloadLogs) ? downloadLogs : []).filter(
    (l): l is { userId: string; ipAddress: string; timestamp: number } =>
      Boolean(
        l &&
          typeof l === 'object' &&
          typeof l.userId === 'string' &&
          l.userId.trim().length > 0 &&
          typeof l.ipAddress === 'string' &&
          typeof l.timestamp === 'number' &&
          !Number.isNaN(l.timestamp) &&
          now - l.timestamp <= windowMs
      )
  );

  const logsByUser: Record<string, Array<{ ip: string; time: number }>> = {};
  for (const log of safeLogs) {
    if (!logsByUser[log.userId]) {
      logsByUser[log.userId] = [];
    }
    logsByUser[log.userId].push({ ip: log.ipAddress, time: log.timestamp });
  }

  const flaggedUserIds: string[] = [];
  const anomalies: ResourceSharingAnomalyReport[] = [];

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
