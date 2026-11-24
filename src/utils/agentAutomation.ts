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
  Coupon,
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
            imageUrl: published.coverImage,
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
      heading: 'Introduction',
      body: `The field is evolving fast, and ${cleanTopic} is no exception — every engineer knows the ground moves under even the most "stable" fundamentals. This article is your practical, step-by-step guide to the core ideas you need, so you can skip theory and build real systems. You'll leave with a clear plan, reusable patterns, and a checklist of traps to avoid.`,
    },
    {
      id: `sec-${Date.now()}-2`,
      blockType: 'callout',
      heading: 'TL;DR — Key Takeaway',
      body: `If you take nothing else from this article, remember: the most effective approach to ${cleanTopic} starts with modeling your system boundaries and contracts before writing a single line of code.`,
      calloutTone: 'info',
    },
    {
      id: `sec-${Date.now()}-3`,
      blockType: 'section',
      heading: 'The Problems Behind the Symptoms',
      body: `Many technical issues surface as flaky behavior or hard-to-reproduce bugs. When ${cleanTopic} teams lose momentum, the usual culprits are usually: missing observability, weak guardrails, and unclear boundaries between teams.`,
    },
    {
      id: `sec-${Date.now()}-4`,
      blockType: 'section',
      heading: 'Step-by-Step Implementation',
      body: 'Follow these core practices for optimal outcomes:',
      checklistItems: [
        'Define the contract and its invariants first — schema, rate limits, and success criteria.',
        'Write the stub/skeleton so the architecture is visible before implementation.',
        'Implement the happy path, then the edge cases, then the failure modes.',
        'Ship and measure: instrumentation first, then alerts.',
      ],
    },
    {
      id: `sec-${Date.now()}-5`,
      blockType: 'section',
      heading: 'Case Study: Building a production-ready example',
      body: `Here's how to apply this in practice — we walk a real example of ${cleanTopic} from zero to production, with concrete patterns you can copy, including: API design, testing, documentation, and monitoring.`,
    },
    {
      id: `sec-${Date.now()}-6`,
      blockType: 'callout',
      heading: 'Warning callout (common mistake)',
      body: 'A very common mistake is to build a system that works on the happy path but has no story for when it breaks. Skip this, and your long-term maintenance costs grow fast. Many systems are abandoned faster than they are fixed — the ones with resilience built in survive longer.',
      calloutTone: 'warning',
    },
    {
      id: `sec-${Date.now()}-7`,
      blockType: 'section',
      heading: 'Conclusion & Next Steps',
      body: `By adopting these structured workflows for ${cleanTopic}, teams and individual builders can dramatically accelerate their time-to-market while keeping a solid foundation for the long term.`,
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
 * Generates a structured outline for an article from a topic and optional keywords.
 * The outline includes a title, 3-5 main sections, and a takeaway — used to
 * seed the article-generation flow (`generateArticleOutlineToArticle`).
 */
export function generateArticleOutline(
  topic: string,
  opts?: { keywords?: string[]; customTitle?: string; customSubtitle?: string }
): { title: string; sections: Array<{ id: string; heading: string; subheadings?: string[]; notes?: string }>; takeaway: string } {
  const cleanTopic = (topic || '').trim();
  if (!cleanTopic) {
    throw new Error('Topic is required to generate an article outline');
  }
  const keywords = Array.from(new Set(opts?.keywords?.filter(Boolean) || [cleanTopic, 'Guide', 'Best Practices']));
  const sectionSpecs: Array<{ id: string; heading: string; subheadings?: string[] }> = [
    { id: 's1', heading: 'Introduction' },
    {
      id: 's2',
      heading: `How to Get Started with ${keywords[0] || cleanTopic}`,
      subheadings: ['Install', 'Configuration', 'Basics', 'First steps'],
    },
    { id: 's3', heading: `Step-by-step Workflow` },
    { id: 's4', heading: `Common Mistakes & How to Avoid Them` },
    { id: 's5', heading: `Advanced Tips & Real-World Examples` },
    { id: 's6', heading: 'Conclusion & Summary' },
  ];
  return {
    title: opts?.customTitle || `${cleanTopic}: A Practical Guide`,
    sections: sectionSpecs,
    takeaway: `Key takeaway: always verify with tests and iterate — a small, focused plan beats a big, risky plan when building with ${keywords[0] || cleanTopic}.`,
  };
}

/**
 * Expands an outline into a full structured article (deterministic offline body).
 * Returns the same shape as `generateOfflineBlogDraftTemplate` so it can be
 * layered on top of the autonomous generator.
 */
export function generateArticleOutlineToArticle(
  topic: string,
  opts?: { keywords?: string[]; customTitle?: string; customSubtitle?: string; customExcerpt?: string }
): GeneratedBlogDraft {
  const outline = generateArticleOutline(topic, opts);
  const now = new Date();
  const slug = slugifyText(outline.title) || `article-${Date.now()}`;

  const bodySections: BlogSection[] = outline.sections.map((sec, idx) => ({
    id: `outline-${sec.id}-${idx + 1}`,
    blockType: 'section' as const,
    heading: sec.heading,
    body: `A practical guide to ${topic}. Key points, examples, and considerations.`,
  }));
  // Attach a closing callout from the outline takeaway
  bodySections.push({
    id: `outline-takeaway`,
    blockType: 'callout' as const,
    heading: 'Key Takeaway',
    body: outline.takeaway,
    calloutTone: 'info' as const,
  });

  const post: BlogPost = {
    id: `post-${Date.now()}-${slug.slice(0, 20)}`,
    slug,
    title: outline.title,
    subtitle: opts?.customSubtitle || `Actionable blueprints and technical architectures for modern builders.`,
    excerpt: opts?.customExcerpt || `Discover actionable strategies, technical architectures, and practical insights on ${topic}.`,
    category: 'AI',
    authorId: 'agent-blog-bot',
    authorName: 'CourseMart Editorial Agent',
    authorRole: 'Autonomous AI Editor',
    authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200',
    readTimeMinutes: 12,
    publishedAt: '',
    updatedAt: now.toISOString(),
    status: 'draft',
    featured: false,
    tags: Array.from(new Set([...(opts?.keywords || [topic]), 'Guide', 'Best Practices'])),
    seoTitle: `${outline.title} | CourseMart Insights`,
    seoDescription: `Master ${topic} with practical architectures and blueprints.`,
    focusKeyword: opts?.keywords?.[0] || topic,
    sections: bodySections,
    relatedProductIds: [],
    comments: [],
  };

  return {
    post,
    source: 'template_fallback',
    metadata: {
      generatedAt: now.toISOString(),
      targetAudience: 'Digital creators, developers, and entrepreneurs',
      wordCount: 120,
      estimatedReadTime: 2,
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
  userTier?: 'paid' | 'free' | 'anonymous';
}

export interface EnquiryResponse {
  answer: string;
  matchedTopics: string[];
  confidence: number;
  suggestedForumThreadSlug?: string;
  isTeaser?: boolean;
  userTier?: 'paid' | 'free' | 'anonymous';
  cta?: {
    text: string;
    link: string;
  };
}

export function formatEnquiryTieredResponse(
  response: EnquiryResponse,
  userTier: 'paid' | 'free' | 'anonymous' = 'anonymous'
): EnquiryResponse {
  if (userTier === 'paid') {
    return {
      ...response,
      isTeaser: false,
      userTier: 'paid',
      cta: undefined,
    };
  }

  return {
    ...response,
    isTeaser: true,
    userTier: userTier === 'free' ? 'free' : 'anonymous',
    cta: {
      text: 'Upgrade to Paid Membership to unlock unrestricted AI answers',
      link: '/membership',
    },
  };
}

/**
 * Semantic and deterministic enquiry responder. Analyzes questions for customer
 * support (refunds, certificates, payment types) and LMS student questions (React hooks, state).
 * Supports tiered answering: comprehensive for paid members, concise teaser for free/anonymous visitors.
 */
export function buildEnquiryResponse(
  question: string,
  context?: EnquiryContext
): EnquiryResponse {
  const cleanQ = typeof question === 'string' ? question.trim() : '';
  const userTier = context?.userTier || 'anonymous';
  const isPaid = userTier === 'paid';

  if (!cleanQ || cleanQ.replace(/[^a-zA-Z0-9]/g, '').length === 0) {
    const base: EnquiryResponse = {
      answer:
        "Hello! I couldn't quite understand your question. Could you please provide more details or ask about course enrollment, certificates, or community discussions?",
      matchedTopics: [],
      confidence: 0,
    };
    return formatEnquiryTieredResponse(base, userTier);
  }

  // 1. Refunds & Billing
  if (/\b(refund|refunds|money back)\b/i.test(cleanQ)) {
    const base: EnquiryResponse = {
      answer: isPaid
        ? 'CourseMart offers a 30-day money-back guarantee on digital courses. Manual GTB transfers and completed card orders can request a refund in their account portal. As an active paid member, your refund requests receive priority processing within 3-5 business days back to your original payment method upon order reference submission.'
        : 'CourseMart offers a 30-day money-back guarantee on digital courses. Manual GTB transfers and completed card orders can request a refund in their account portal.',
      matchedTopics: ['refunds', 'billing'],
      confidence: 0.95,
      suggestedForumThreadSlug: 'faq-refund-policy-and-settlements',
    };
    return formatEnquiryTieredResponse(base, userTier);
  }

  // 2. Certificates & Accreditation
  if (/\b(certificate|certificates|accreditation|cm-cert)\b/i.test(cleanQ)) {
    const base: EnquiryResponse = {
      answer: isPaid
        ? 'Certificates of completion are automatically generated with a verifiable CM-CERT code once you complete 100% of the course lectures across all modules. As an active paid member, you can also download high-resolution PDF credentials, export verifiable badges to your LinkedIn profile, and verify them via our public certification portal.'
        : 'Certificates of completion are automatically generated with a verifiable CM-CERT code once you complete 100% of the course lectures across all modules.',
      matchedTopics: ['certificates', 'accreditation'],
      confidence: 0.92,
      suggestedForumThreadSlug: 'how-to-verify-and-share-certificates',
    };
    return formatEnquiryTieredResponse(base, userTier);
  }

  // 3. React/Hooks/Web Dev Curriculum
  if (/\b(react|hooks?|usestate|useeffect|usecontext)\b/i.test(cleanQ)) {
    const base: EnquiryResponse = {
      answer: isPaid
        ? `In ${context?.courseName || 'our engineering courses'}, React hooks must be called at the top level of your component. Check the lesson resources for sample code snippets. Never call hooks inside loops, conditions, or nested functions to ensure that React preserves state correctly across multiple renders. For advanced state management, explore custom hooks and reducer patterns in the curriculum.`
        : `In ${context?.courseName || 'our engineering courses'}, React hooks must be called at the top level of your component. Check the lesson resources for sample code snippets.`,
      matchedTopics: ['react', 'web-development'],
      confidence: 0.88,
      suggestedForumThreadSlug: 'debugging-react-hooks-and-state',
    };
    return formatEnquiryTieredResponse(base, userTier);
  }

  // 4. Payment Methods: Paystack vs GTB
  if (/\b(paystack|payments?|gtb|bank transfer)\b/i.test(cleanQ)) {
    const base: EnquiryResponse = {
      answer: isPaid
        ? 'We support instant Card/Bank Transfer payments via Paystack (immediate unlock) and manual GTB bank transfers (requires admin payment verification before access is granted). Paid members also receive automatic discounts and saved checkout preferences for all future platform purchases.'
        : 'We support instant Card/Bank Transfer payments via Paystack (immediate unlock) and manual GTB bank transfers (requires admin payment verification before access is granted).',
      matchedTopics: ['payments', 'checkout'],
      confidence: 0.9,
      suggestedForumThreadSlug: 'payment-methods-paystack-vs-gtb',
    };
    return formatEnquiryTieredResponse(base, userTier);
  }

  // 5. Membership Tiers & VIP Access
  if (/\b(membership|memberships|vip|pro)\b/i.test(cleanQ)) {
    const base: EnquiryResponse = {
      answer: isPaid
        ? 'CourseMart memberships (Starter, Pro, and VIP) provide instant access to designated premium courses, full digital downloads, and member-only prompt vault access. As an active member, you enjoy unrestricted AI answers and complete access to all digital tools and masterclasses.'
        : 'CourseMart memberships (Starter, Pro, and VIP) provide instant access to designated premium courses, full digital downloads, and member-only prompt vault access.',
      matchedTopics: ['membership', 'subscriptions'],
      confidence: 0.9,
      suggestedForumThreadSlug: 'membership-tiers-and-benefits',
    };
    return formatEnquiryTieredResponse(base, userTier);
  }

  // 6. Vibe Coding & AI Software Engineering
  if (/\b(vibe\s*coding|vibe\s*code|specification[\s-]first|ai\s*engineering|ai\s*developer|prompt\s*engineering|autonomous\s*agents?)\b/i.test(cleanQ)) {
    const base: EnquiryResponse = {
      answer: isPaid
        ? 'Vibe coding is a modern specification-first development approach where builders use natural language prompts and clear architectural requirements to direct AI coding agents, focusing on rapid iteration, automated verification, and end-to-end execution rather than manual syntax. Master the full playbook in our AI & Vibe Coding Mastery cohort.'
        : 'Vibe coding is a modern specification-first development approach where builders use natural language prompts and clear architectural requirements to direct AI coding agents, focusing on rapid iteration, automated verification, and end-to-end execution rather than manual syntax.',
      matchedTopics: ['vibe-coding', 'ai-engineering'],
      confidence: 0.95,
      suggestedForumThreadSlug: 'getting-started-with-vibe-coding-and-ai',
    };
    return formatEnquiryTieredResponse(base, userTier);
  }

  // 7. Affiliate Marketing, Promoters & Commissions
  if (/\b(affiliates?|promoter|referrals?|commission|earn\s*money|make\s*money|monetiz\w*)\b/i.test(cleanQ)) {
    const base: EnquiryResponse = {
      answer: isPaid
        ? 'Digital Wealth Creators features a high-earning affiliate promoter program offering 20% to 50% commission per referral. Each promoter gets a unique tracking link, automated sales attribution, real-time analytics, and weekly payouts to their bank account. Paid members can access advanced promotional assets, custom campaign tracking, and prioritized affiliate payout processing in their partner dashboard.'
        : 'Digital Wealth Creators features a high-earning affiliate promoter program offering 20% to 50% commission per referral. Each promoter gets a unique tracking link, automated sales attribution, real-time analytics, and weekly payouts to their bank account.',
      matchedTopics: ['affiliate', 'monetization'],
      confidence: 0.94,
      suggestedForumThreadSlug: 'how-affiliate-commissions-and-payouts-work',
    };
    return formatEnquiryTieredResponse(base, userTier);
  }

  // 7.5 Photography & Camera Prompts (Member Vault & ChatGPT Blueprints)
  if (
    /\b(photograph(y|ic|er)?|photos?|cameras?|lighting|aperture|shutter(\s*speed)?|lenses|lens|portraits?|cinematic\s*shots?|golden\s*hour|rembrandt|chiaroscuro|astrophotography|macro\s*photo|film\s*emulation|midjourney\s*photo)\b/i.test(
      cleanQ
    )
  ) {
    const base: EnquiryResponse = {
      answer: isPaid
        ? 'The DWC VIP Prompt Vault includes a comprehensive Photography & Camera Prompts collection featuring 24 ChatGPT-engineered photography blueprints across 6 sub-genres: Portraiture & Editorial, Street & Documentary, Landscape & Astrophotography, Commercial & Culinary, Action & Motion, and AI Synthesis & Film Emulation. Each prompt includes parameterized variables for camera body, lens, aperture, shutter speed, ISO, lighting, and composition rules. As an active paid member, you enjoy full interactive access to customize, interpolate, and copy prompts directly to ChatGPT or your student dashboard.'
        : 'The DWC VIP Prompt Vault includes a comprehensive Photography & Camera Prompts collection featuring 24 ChatGPT-engineered photography blueprints across 6 sub-genres (Portraiture, Street, Landscape, Commercial, Action, and AI Synthesis) with parameterized camera settings, lighting setups, and composition rules.',
      matchedTopics: ['photography-prompts', 'prompt-vault', 'chatgpt-photography'],
      confidence: 0.95,
      suggestedForumThreadSlug: 'how-to-use-photography-prompts-in-chatgpt',
    };
    return formatEnquiryTieredResponse(base, userTier);
  }

  // 8. Prompt Vault & 150+ VIP Blueprints
  if (/\b(prompts?|vault|100\s*prompts?|105\s*prompts?|150\s*prompts?|blueprints?)\b/i.test(cleanQ)) {
    const base: EnquiryResponse = {
      answer: isPaid
        ? 'The DWC VIP Prompt Vault contains 150+ battle-tested executive AI prompts and blueprints for business growth, sales copy, social syndication, vibe coding, and professional photography. VIP members enjoy full instant access, and individual prompt packs can be downloaded in the Digital Store. Active paid members enjoy unrestricted instant access to all categories, dynamic bracketed variable customization in the prompt customizer, and 1-click clipboard exports for ChatGPT, Claude, and Gemini.'
        : 'The DWC VIP Prompt Vault contains 150+ battle-tested executive AI prompts and blueprints for business growth, sales copy, social syndication, vibe coding, and professional photography. VIP members enjoy full instant access, and individual prompt packs can be downloaded in the Digital Store.',
      matchedTopics: ['prompt-vault', 'digital-products'],
      confidence: 0.94,
      suggestedForumThreadSlug: 'how-to-use-the-105-prompt-vault',
    };
    return formatEnquiryTieredResponse(base, userTier);
  }

  // 9. Digital Products, eBooks & Templates
  if (/\b(digital\s*products?|ebooks?|handbooks?|notion\s*templates?|engineering\s*toolkits?|digital\s*downloads?)\b/i.test(cleanQ)) {
    const base: EnquiryResponse = {
      answer: isPaid
        ? 'Our Digital Products hub includes actionable eBooks, Notion templates, PRD specifications, and software starter kits. Purchases feature instant file downloads and perpetual updates in your personal library. Paid members receive 50% member discounts across the store and perpetual access to version updates.'
        : 'Our Digital Products hub includes actionable eBooks, Notion templates, PRD specifications, and software starter kits. Purchases feature instant file downloads and perpetual updates in your personal library.',
      matchedTopics: ['digital-products', 'ebooks'],
      confidence: 0.92,
      suggestedForumThreadSlug: 'accessing-digital-product-downloads',
    };
    return formatEnquiryTieredResponse(base, userTier);
  }

  // 10. Video Studio & YouTube Course Repurposer
  if (/\b(video\s*(generator|studio)|canvas\s*studio|youtube\s*(repurpos\w*|to\s*course)|slides?\s*to\s*video)\b/i.test(cleanQ)) {
    const base: EnquiryResponse = {
      answer: isPaid
        ? 'The DWC Canvas Video Studio enables 1-click in-browser 1280x720 video slide creation with synchronized speech and WebM export. Our YouTube Course Repurposer takes any video URL and converts it into a full interactive course curriculum with quizzes and summaries. Paid members enjoy unlimited video scene rendering, high-definition exports, and automated social snippet syndication.'
        : 'The DWC Canvas Video Studio enables 1-click in-browser 1280x720 video slide creation with synchronized speech and WebM export. Our YouTube Course Repurposer takes any video URL and converts it into a full interactive course curriculum with quizzes and summaries.',
      matchedTopics: ['video-generation', 'ai-tools'],
      confidence: 0.93,
      suggestedForumThreadSlug: 'generating-videos-and-repurposing-youtube-courses',
    };
    return formatEnquiryTieredResponse(base, userTier);
  }

  // 11. General "Explain"/"What is" queries for the platform
  if (
    /\b(explain|what\s+is|tell\s+me\s+about|overview\s+of)\s+(digital\s*wealth\s*creators|dwc|coursemart|this\s*platform|the\s*platform|your\s*services?)\b/i.test(cleanQ) ||
    /\b(how\s+does\s+this\s+platform\s+work|what\s+does\s+dwc\s+offer)\b/i.test(cleanQ)
  ) {
    const base: EnquiryResponse = {
      answer: isPaid
        ? 'Digital Wealth Creators (DWC) is a unified platform combining digital commerce, technical education, and AI automation. We empower creators and developers to master vibe coding, deploy software, sell digital assets, and monetize through high-ticket masterclasses and affiliate partnerships. As an active member, you have unrestricted access to all courses, member prompt vaults, community channels, and AI copilot tools.'
        : 'Digital Wealth Creators (DWC) is a unified platform combining digital commerce, technical education, and AI automation. We empower creators and developers to master vibe coding, deploy software, sell digital assets, and monetize through high-ticket masterclasses and affiliate partnerships.',
      matchedTopics: ['general-explanation', 'dwc-platform'],
      confidence: 0.9,
      suggestedForumThreadSlug: 'digital-wealth-creators-platform-overview',
    };
    return formatEnquiryTieredResponse(base, userTier);
  }

  // 12. General Support Fallback
  const fallbackBase: EnquiryResponse = {
    answer: isPaid
      ? 'Thank you for contacting CourseMart support. A community mentor or instructor will follow up with you shortly. You can also search the community forum for similar questions or ask our AI assistant for in-depth technical details on any topic.'
      : 'Thank you for contacting CourseMart support. A community mentor or instructor will follow up with you shortly. You can also search the community forum for similar questions.',
    matchedTopics: ['general-support'],
    confidence: 0.5,
  };
  return formatEnquiryTieredResponse(fallbackBase, userTier);
}

/**
 * Exact signature matching E2E test suite helper for enquiry agent.
 */
export function runEnquiryAgent(
  question: string,
  context?: EnquiryContext
): EnquiryResponse {
  return buildEnquiryResponse(question, context);
}

/* ============================================================================
   4. Dynamic Site Catalog & Bestseller Evaluation Engine
   ============================================================================ */

export interface DynamicSiteUpdateOptions {
  salesThreshold?: number; // default: 5
  minRatingThreshold?: number; // default: 4.5
  minOrderSales?: number; // default: 1 — a product needs at least one completed-order sale
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
  const minOrderSales = options?.minOrderSales ?? 1;
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
    const orderSales = salesCountByProduct[p.id] || 0;
    // Enrolment counts are a useful popularity signal, but they must never
    // promote a product that has not actually sold through the store. Without
    // the completed-order floor, seeded/cumulative enrolment numbers turn the
    // entire catalogue into "bestsellers".
    const totalSales = orderSales + (p.studentsCount || 0);
    const isBestseller =
      orderSales >= minOrderSales &&
      totalSales >= threshold &&
      (p.rating || 0) >= minRating;
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

/**
 * Coupon advertised by the bestseller automation. It is inserted into the
 * coupon store only when bestsellers exist, so the announcement never points
 * at an unredeemable code.
 */
export function buildBestsellerCoupon(now: Date = new Date()): Coupon {
  const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: 'coupon-bestseller10',
    code: 'BESTSELLER10',
    discountType: 'percent',
    value: 10,
    minSpend: 0,
    active: true,
    usageCount: 0,
    maxUses: 500,
    expiresAt,
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
