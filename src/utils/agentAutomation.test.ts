import test from 'node:test';
import assert from 'node:assert/strict';
import {
  processScheduledBlogPosts,
  runBlogPublisherAgent,
  generateOfflineBlogDraftTemplate,
  generateArticleOutline,
  generateArticleOutlineToArticle,
  generateAutonomousBlogDraft,
  buildEnquiryResponse,
  runEnquiryAgent,
  evaluateDynamicSiteUpdates,
  evaluateBestsellersAndBanners,
  detectResourceSharingAnomalies,
} from './agentAutomation';
import type { BlogPost, Product, Order } from '../types/marketplace';

test('processScheduledBlogPosts and runBlogPublisherAgent publish past-date posts and handle edge cases', () => {
  const now = 1700000000000;
  const samplePosts: BlogPost[] = [
    {
      id: 'post-1',
      title: 'Past Scheduled Post',
      slug: 'past-scheduled-post',
      subtitle: 'Sub 1',
      excerpt: 'Past scheduled excerpt',
      category: 'AI',
      tags: ['AI'],
      authorId: 'u1',
      authorName: 'Author One',
      authorRole: 'Instructor',
      authorAvatar: 'https://example.com/avatar.png',
      coverImage: 'https://example.com/cover.png',
      readTimeMinutes: 5,
      sections: [],
      relatedProductIds: [],
      comments: [],
      status: 'scheduled',
      featured: false,
      scheduledAt: new Date(now - 10000).toISOString(),
      publishedAt: '',
      updatedAt: new Date(now - 20000).toISOString(),
    },
    {
      id: 'post-2',
      title: 'Future Scheduled Post',
      slug: 'future-scheduled-post',
      subtitle: 'Sub 2',
      excerpt: 'Future scheduled excerpt',
      category: 'Vibe Coding',
      tags: ['Coding'],
      authorId: 'u1',
      authorName: 'Author One',
      authorRole: 'Instructor',
      authorAvatar: 'https://example.com/avatar.png',
      coverImage: 'https://example.com/cover.png',
      readTimeMinutes: 5,
      sections: [],
      relatedProductIds: [],
      comments: [],
      status: 'scheduled',
      featured: false,
      scheduledAt: new Date(now + 3600000).toISOString(), // 1 hour in future
      publishedAt: '',
      updatedAt: new Date(now - 10000).toISOString(),
    },
    {
      id: 'post-3',
      title: 'Draft Post',
      slug: 'draft-post',
      subtitle: 'Sub 3',
      excerpt: 'Draft excerpt',
      category: 'Apps Deployment',
      tags: ['DevOps'],
      authorId: 'u1',
      authorName: 'Author One',
      authorRole: 'Instructor',
      authorAvatar: 'https://example.com/avatar.png',
      coverImage: 'https://example.com/cover.png',
      readTimeMinutes: 5,
      sections: [],
      relatedProductIds: [],
      comments: [],
      status: 'draft',
      featured: false,
      publishedAt: '',
      updatedAt: new Date(now - 10000).toISOString(),
    },
    {
      id: 'post-4',
      title: 'Corrupt Date Scheduled Post',
      slug: 'corrupt-date-post',
      subtitle: 'Sub 4',
      excerpt: 'Corrupt excerpt',
      category: 'Leadership',
      tags: ['Leadership'],
      authorId: 'u1',
      authorName: 'Author One',
      authorRole: 'Instructor',
      authorAvatar: 'https://example.com/avatar.png',
      coverImage: 'https://example.com/cover.png',
      readTimeMinutes: 5,
      sections: [],
      relatedProductIds: [],
      comments: [],
      status: 'scheduled',
      featured: false,
      scheduledAt: 'invalid-non-iso-timestamp',
      publishedAt: '',
      updatedAt: new Date(now - 10000).toISOString(),
    },
  ];

  // Run full process with social drafts
  const fullResult = processScheduledBlogPosts(samplePosts, now, { generateSocial: true });
  assert.equal(fullResult.publishedCount, 1);
  assert.equal(fullResult.publishedPosts.length, 1);
  assert.equal(fullResult.publishedPosts[0].id, 'post-1');
  assert.equal(fullResult.publishedPosts[0].status, 'published');
  assert.equal(fullResult.publishedPosts[0].publishedAt, new Date(now).toISOString());

  // Check that future post, draft, and corrupt date post remained unchanged
  const post2 = fullResult.updatedPosts.find((p) => p.id === 'post-2');
  assert.equal(post2?.status, 'scheduled');

  const post3 = fullResult.updatedPosts.find((p) => p.id === 'post-3');
  assert.equal(post3?.status, 'draft');

  const post4 = fullResult.updatedPosts.find((p) => p.id === 'post-4');
  assert.equal(post4?.status, 'scheduled');

  // Verify social drafts generated
  assert.ok(fullResult.socialDrafts);
  assert.ok(fullResult.socialDrafts.length >= 2);
  assert.ok(fullResult.socialDrafts.some((d) => d.platform === 'linkedin'));
  assert.ok(fullResult.socialDrafts.some((d) => d.platform === 'x'));

  // Test exact E2E alias
  const aliasResult = runBlogPublisherAgent(samplePosts, now);
  assert.equal(aliasResult.publishedCount, 1);
  assert.equal(aliasResult.updatedPosts[0].status, 'published');
});

test('generateOfflineBlogDraftTemplate and generateAutonomousBlogDraft produce structured blog articles', async () => {
  // Empty topic throws error
  assert.throws(() => generateOfflineBlogDraftTemplate({ topic: '   ' }), {
    message: /Topic is required/,
  });

  // Offline deterministic generation
  const offlineDraft = generateOfflineBlogDraftTemplate({
    topic: 'Mastering AI Agent Automation in 2026',
    category: 'AI',
    keywords: ['AI Agents', 'Automation', 'Workflows'],
    scheduledInHours: 24,
    relatedProductIds: ['course-ai-101'],
  });

  assert.equal(offlineDraft.source, 'template_fallback');
  assert.ok(offlineDraft.post.id.startsWith('post-'));
  assert.equal(offlineDraft.post.title, 'Mastering AI Agent Automation in 2026');
  assert.equal(offlineDraft.post.slug, 'mastering-ai-agent-automation-in-2026');
  assert.equal(offlineDraft.post.status, 'scheduled');
  assert.ok(offlineDraft.post.scheduledAt);
  assert.ok(offlineDraft.post.sections.length >= 2);
  assert.ok(offlineDraft.post.sections.some((s) => s.heading.includes('Introduction')));
  assert.ok(offlineDraft.post.sections.some((s) => s.heading === 'Conclusion & Next Steps'));
  assert.ok(offlineDraft.post.sections.some((s) => s.blockType === 'callout'));
  assert.ok(offlineDraft.metadata.wordCount > 30);
  assert.ok(offlineDraft.metadata.estimatedReadTime >= 1);
  assert.deepEqual(offlineDraft.post.relatedProductIds, ['course-ai-101']);

  // Autonomous generator without Gemini falls back gracefully
  const draftNoGemini = await generateAutonomousBlogDraft({
    topic: 'Building Micro-SaaS with Vibe Coding',
    category: 'Vibe Coding',
  });
  assert.equal(draftNoGemini.source, 'template_fallback');
  assert.equal(draftNoGemini.post.status, 'draft');

  // Autonomous generator with simulated Gemini error falls back gracefully
  const mockFailingGemini = {
    models: {
      generateContent: async () => {
        throw new Error('Simulated 429 quota exhaustion');
      },
    },
  };
  const draftFallback = await generateAutonomousBlogDraft(
    { topic: 'Resilient Microservices Architecture', category: 'Apps Deployment' },
    mockFailingGemini
  );
  assert.equal(draftFallback.source, 'template_fallback');
  assert.equal(draftFallback.post.title, 'Resilient Microservices Architecture');

  // Autonomous generator with working Gemini mock
  const mockWorkingGemini = {
    models: {
      generateContent: async () => ({
        text: 'Artificial Intelligence is transforming workflows worldwide with automated pipelines and zero latency across modern computing.',
      }),
    },
  };
  const draftSuccess = await generateAutonomousBlogDraft(
    { topic: 'High Performance AI', category: 'AI' },
    mockWorkingGemini
  );
  assert.equal(draftSuccess.source, 'gemini');
  assert.equal(draftSuccess.post.title, 'High Performance AI');
  assert.ok(draftSuccess.post.sections[0].body.includes('Artificial Intelligence is transforming workflows'));
});

test('generateArticleOutline produces a titled outline with sections and takeaway', () => {
  assert.throws(() => generateArticleOutline('   '), { message: /Topic is required/ });
  const outline = generateArticleOutline('AI SaaS Automation', { keywords: ['AI SaaS', 'Automation', '2026'] });
  assert.ok(outline.title.length > 0);
  assert.ok(outline.sections.length >= 4);
  assert.ok(outline.takeaway.length > 0);
  assert.ok(outline.sections.some((s) => s.heading.toLowerCase().includes('introduction')));
});

test('generateArticleOutlineToArticle turns an outline into a structured blog article', () => {
  const draft = generateArticleOutlineToArticle('AI SaaS Automation');
  assert.equal(draft.source, 'template_fallback');
  assert.ok(draft.post.title.includes('AI SaaS Automation'));
  assert.ok(draft.post.slug.length > 0);
  assert.ok(draft.post.sections.length >= 5);
  assert.ok(draft.post.sections.some((s) => s.blockType === 'callout'));
  assert.equal(draft.post.status, 'draft');
  assert.ok(draft.post.seoTitle?.includes('AI SaaS Automation'));
});

test('buildEnquiryResponse and runEnquiryAgent handle customer and student queries', () => {
  // Empty / whitespace query
  const emptyRes = buildEnquiryResponse('   ');
  assert.equal(emptyRes.confidence, 0);
  assert.match(emptyRes.answer, /couldn't quite understand/i);
  assert.equal(emptyRes.matchedTopics.length, 0);

  // Refund query
  const refundRes = buildEnquiryResponse('Can I get a refund if the course is not for me?');
  assert.ok(refundRes.confidence >= 0.9);
  assert.ok(refundRes.matchedTopics.includes('refunds'));
  assert.match(refundRes.answer, /30-day money-back guarantee/i);
  assert.equal(refundRes.suggestedForumThreadSlug, 'faq-refund-policy-and-settlements');

  // Certificate query
  const certRes = buildEnquiryResponse('How do I receive my verified completion certificate?');
  assert.ok(certRes.confidence >= 0.9);
  assert.ok(certRes.matchedTopics.includes('certificates'));
  assert.match(certRes.answer, /CM-CERT/);
  assert.equal(certRes.suggestedForumThreadSlug, 'how-to-verify-and-share-certificates');

  // React & Hooks query with context
  const reactRes = buildEnquiryResponse('Where should I call my React hooks and useState?', {
    courseName: 'Full-Stack Mastery',
  });
  assert.ok(reactRes.confidence >= 0.85);
  assert.ok(reactRes.matchedTopics.includes('react'));
  assert.match(reactRes.answer, /top level/i);
  assert.match(reactRes.answer, /Full-Stack Mastery/);
  assert.equal(reactRes.suggestedForumThreadSlug, 'debugging-react-hooks-and-state');

  // Payment methods: Paystack vs GTB
  const payRes = buildEnquiryResponse('What payment options do you support? Can I pay via GTB transfer?');
  assert.ok(payRes.confidence >= 0.9);
  assert.ok(payRes.matchedTopics.includes('payments'));
  assert.match(payRes.answer, /Paystack/i);
  assert.match(payRes.answer, /GTB/i);

  // Membership & VIP access
  const memberRes = buildEnquiryResponse('Tell me about the VIP membership and prompt vault.');
  assert.ok(memberRes.confidence >= 0.9);
  assert.ok(memberRes.matchedTopics.includes('membership'));
  assert.match(memberRes.answer, /Starter, Pro, and VIP/i);

  // Unrecognized query fallback
  const fallbackRes = buildEnquiryResponse('What is the weather like in Lagos right now?');
  assert.equal(fallbackRes.confidence, 0.5);
  assert.ok(fallbackRes.matchedTopics.includes('general-support'));
  assert.match(fallbackRes.answer, /contacting CourseMart support/i);

  // Test exact E2E alias
  const aliasRes = runEnquiryAgent('Can I request a refund?', { courseName: 'Test Course' });
  assert.ok(aliasRes.confidence >= 0.9);
  assert.equal(aliasRes.suggestedForumThreadSlug, 'faq-refund-policy-and-settlements');
});

test('evaluateDynamicSiteUpdates and evaluateBestsellersAndBanners assign bestsellers and sync banners', () => {
  const products: Product[] = [
    {
      id: 'prod-alpha',
      title: 'Top Course Alpha',
      slug: 'top-course-alpha',
      subtitle: 'Sub',
      originalPrice: 15000,
      reviewCount: 10,
      language: 'English',
      featured: false,
      learningOutcomes: [],
      requirements: [],
      formatLabel: 'Video Course',
      instructorId: 'ins-1',
      instructorName: 'Instructor Alpha',
      instructorRole: 'Instructor',
      instructorAvatar: 'https://example.com/avatar.png',
      price: 15000,
      rating: 4.9,
      studentsCount: 10,
      status: 'published',
      category: 'AI',
      description: 'Desc',
      thumbnail: 'https://example.com/img.png',
      type: 'course',
      level: 'All Levels',
      updatedAt: '2026-01-01',
    },
    {
      id: 'prod-beta',
      title: 'Low Rating Course Beta',
      slug: 'low-rating-course-beta',
      subtitle: 'Sub',
      originalPrice: 15000,
      reviewCount: 10,
      language: 'English',
      featured: false,
      learningOutcomes: [],
      requirements: [],
      formatLabel: 'Video Course',
      instructorId: 'ins-1',
      instructorName: 'Instructor Alpha',
      instructorRole: 'Instructor',
      instructorAvatar: 'https://example.com/avatar.png',
      price: 10000,
      rating: 4.0, // Below 4.5 threshold
      studentsCount: 20,
      status: 'published',
      category: 'AI',
      description: 'Desc',
      thumbnail: 'https://example.com/img.png',
      type: 'course',
      level: 'All Levels',
      updatedAt: '2026-01-01',
    },
    {
      id: 'prod-gamma',
      title: 'New Course Gamma',
      slug: 'new-course-gamma',
      subtitle: 'Sub',
      originalPrice: 15000,
      reviewCount: 10,
      language: 'English',
      featured: false,
      learningOutcomes: [],
      requirements: [],
      formatLabel: 'Video Course',
      instructorId: 'ins-1',
      instructorName: 'Instructor Alpha',
      instructorRole: 'Instructor',
      instructorAvatar: 'https://example.com/avatar.png',
      price: 8000,
      rating: 4.8,
      studentsCount: 0, // 0 sales
      status: 'published',
      category: 'AI',
      description: 'Desc',
      thumbnail: 'https://example.com/img.png',
      type: 'course',
      level: 'All Levels',
      updatedAt: '2026-01-01',
    },
  ];

  const orders: Order[] = [
    {
      id: 'ord-1',
      userId: 'usr-1',
      customerEmail: 'u1@example.com',
      customerName: 'User One',
      items: [
        { productId: 'prod-alpha', productTitle: 'Top Course Alpha', productType: 'course', price: 15000 },
        { productId: 'prod-alpha', productTitle: 'Top Course Alpha', productType: 'course', price: 15000 },
      ],
      subtotal: 30000,
      discount: 0,
      total: 30000,
      status: 'completed',
      paymentMethod: 'card',
      createdAt: '2026-01-02',
    },
    {
      id: 'ord-2',
      userId: 'usr-2',
      customerEmail: 'u2@example.com',
      customerName: 'User Two',
      items: [
        { productId: 'prod-alpha', productTitle: 'Top Course Alpha', productType: 'course', price: 15000 },
      ],
      subtotal: 15000,
      discount: 0,
      total: 15000,
      status: 'pending', // Pending orders should not count toward sales
      paymentMethod: 'gtb_whatsapp',
      createdAt: '2026-01-02',
    },
  ];

  // prod-alpha totalSales = 2 (orders) + 10 (students) = 12 (>= 5, rating 4.9 >= 4.5) => bestseller: true
  // prod-beta totalSales = 20, but rating 4.0 (< 4.5) => bestseller: false
  // prod-gamma totalSales = 0 (< 5) => bestseller: false

  const result = evaluateDynamicSiteUpdates(products, orders, { salesThreshold: 5 });
  assert.deepEqual(result.bestsellerIds, ['prod-alpha']);
  assert.equal(result.updatedProducts.find((p) => p.id === 'prod-alpha')?.bestseller, true);
  assert.equal(result.updatedProducts.find((p) => p.id === 'prod-beta')?.bestseller, false);
  assert.equal(result.updatedProducts.find((p) => p.id === 'prod-gamma')?.bestseller, false);
  assert.match(result.announcement.text, /1 verified bestseller/);
  assert.equal(result.announcement.couponCode, 'BESTSELLER10');
  assert.equal(result.metrics.bestsellersCount, 1);
  assert.equal(result.metrics.completedOrdersCount, 1);

  // When no bestsellers meet the threshold
  const emptyResult = evaluateDynamicSiteUpdates(products, [], { salesThreshold: 50 });
  assert.equal(emptyResult.bestsellerIds.length, 0);
  assert.equal(emptyResult.announcement.couponCode, undefined);
  assert.match(emptyResult.announcement.text, /Welcome to CourseMart/);

  // Test alias
  const aliasRes = evaluateBestsellersAndBanners(products, orders, { salesThreshold: 5 });
  assert.deepEqual(aliasRes.bestsellerIds, ['prod-alpha']);
  assert.equal(aliasRes.announcement.couponCode, 'BESTSELLER10');
});

test('bestsellers require real completed-order sales even when enrolment counts are high', () => {
  const makeProduct = (id: string, studentsCount: number): Product => ({
    id,
    title: `Course ${id}`,
    slug: `course-${id}`,
    subtitle: 'Sub',
    originalPrice: 10000,
    reviewCount: 50,
    language: 'English',
    featured: false,
    learningOutcomes: [],
    requirements: [],
    formatLabel: 'Video Course',
    instructorId: 'ins-1',
    instructorName: 'Instructor',
    instructorRole: 'Instructor',
    instructorAvatar: 'https://example.com/avatar.png',
    price: 10000,
    rating: 5,
    studentsCount,
    status: 'published',
    category: 'AI',
    description: 'Desc',
    thumbnail: 'https://example.com/img.png',
    type: 'course',
    level: 'All Levels',
    updatedAt: '2026-01-01',
  });

  const makeOrder = (id: string, productId: string): Order => ({
    id,
    userId: 'usr-1',
    customerEmail: 'u1@example.com',
    customerName: 'User One',
    items: [
      { productId, productTitle: 'Course', productType: 'course', price: 10000 },
    ],
    subtotal: 10000,
    discount: 0,
    total: 10000,
    status: 'completed',
    paymentMethod: 'card',
    createdAt: '2026-01-02',
  });

  const products = [
    makeProduct('prod-one', 5000),
    makeProduct('prod-two', 1200),
    makeProduct('prod-three', 800),
  ];

  // High cumulative enrolment counts alone must never flag the catalogue.
  const noOrders = evaluateDynamicSiteUpdates(products, [], { salesThreshold: 5 });
  assert.deepEqual(noOrders.bestsellerIds, []);
  assert.equal(noOrders.announcement.couponCode, undefined);

  // A single completed-order sale is enough to qualify a product that also
  // clears the popularity and rating thresholds.
  const withSale = evaluateDynamicSiteUpdates(products, [makeOrder('ord-1', 'prod-two')], {
    salesThreshold: 5,
  });
  assert.deepEqual(withSale.bestsellerIds, ['prod-two']);
  assert.equal(withSale.announcement.couponCode, 'BESTSELLER10');
  assert.equal(withSale.updatedProducts.find((p) => p.id === 'prod-two')?.bestseller, true);
  assert.equal(withSale.updatedProducts.find((p) => p.id === 'prod-one')?.bestseller, false);
});

test('detectResourceSharingAnomalies audits download logs for multi-IP dispersion and bursts', () => {
  const realNow = Date.now();
  const realLogs = [
    { userId: 'flagged-1', ipAddress: '1.1.1.1', timestamp: realNow - 1000 },
    { userId: 'flagged-1', ipAddress: '2.2.2.2', timestamp: realNow - 2000 },
    { userId: 'flagged-1', ipAddress: '3.3.3.3', timestamp: realNow - 3000 },
    { userId: 'flagged-1', ipAddress: '4.4.4.4', timestamp: realNow - 4000 },

    ...Array.from({ length: 11 }, (_, i) => ({
      userId: 'flagged-burst',
      ipAddress: '5.5.5.5',
      timestamp: realNow - (i * 500 + 500),
    })),

    { userId: 'clean-user', ipAddress: '9.9.9.9', timestamp: realNow - 1000 },
    { userId: 'clean-user', ipAddress: '9.9.9.9', timestamp: realNow - 2000 },

    // Old logs > 30 mins
    { userId: 'old-user', ipAddress: '8.8.8.1', timestamp: realNow - 3600000 },
    { userId: 'old-user', ipAddress: '8.8.8.2', timestamp: realNow - 3600000 },
    { userId: 'old-user', ipAddress: '8.8.8.3', timestamp: realNow - 3600000 },
    { userId: 'old-user', ipAddress: '8.8.8.4', timestamp: realNow - 3600000 },
  ];

  const result = detectResourceSharingAnomalies(realLogs, 30);
  assert.ok(result.flaggedUserIds.includes('flagged-1'));
  assert.ok(result.flaggedUserIds.includes('flagged-burst'));
  assert.equal(result.flaggedUserIds.includes('clean-user'), false);
  assert.equal(result.flaggedUserIds.includes('old-user'), false);

  const anomaly1 = result.anomalies.find((a) => a.userId === 'flagged-1');
  assert.ok(anomaly1);
  assert.equal(anomaly1?.distinctIps, 4);
  assert.match(anomaly1?.reason || '', /Multi-IP dispersion \(4 IPs\)/);

  const anomalyBurst = result.anomalies.find((a) => a.userId === 'flagged-burst');
  assert.ok(anomalyBurst);
  assert.equal(anomalyBurst?.downloadCount, 11);
  assert.match(anomalyBurst?.reason || '', /Rapid download burst \(11 downloads\)/);
});

test('adversarial regression: enquiry agent rejects substring collisions and operational functions resist corrupt/null data', () => {
  // 1. Vocabulary substring collisions that previously caused false positives
  const falsePositiveQueries = [
    {
      query: 'I have a problem with my code',
      reason: 'Should not trigger membership due to "pro" substring',
    },
    {
      query: 'How do I create a new project?',
      reason: 'Should not trigger membership due to "pro" substring',
    },
    {
      query: 'Where can I download the product?',
      reason: 'Should not trigger membership due to "pro" substring',
    },
    {
      query: 'Can you recommend a good program?',
      reason: 'Should not trigger membership due to "pro" substring',
    },
    {
      query: 'My professor asked me to do this',
      reason: 'Should not trigger membership due to "pro" substring',
    },
    {
      query: 'Can I get a bank statement?',
      reason: 'Should not trigger React hooks due to "state" substring',
    },
    {
      query: 'I am based in the United States',
      reason: 'Should not trigger React hooks due to "state" substring',
    },
    {
      query: 'This is a real estate course',
      reason: 'Should not trigger React hooks due to "state" substring',
    },
    {
      query: 'Will there be a live concert?',
      reason: 'Should not trigger certificates due to "cert" substring',
    },
    {
      query: 'I certainly enjoyed this course',
      reason: 'Should not trigger certificates due to "cert" substring',
    },
    {
      query: 'This is uncertain',
      reason: 'Should not trigger certificates due to "cert" substring',
    },
  ];

  for (const { query, reason } of falsePositiveQueries) {
    const res = buildEnquiryResponse(query);
    assert.equal(
      res.confidence,
      0.5,
      `Expected confidence 0.5 for query: "${query}" (${reason}) but got ${res.confidence}`
    );
    assert.deepEqual(
      res.matchedTopics,
      ['general-support'],
      `Expected matchedTopics ['general-support'] for query: "${query}" (${reason}) but got ${JSON.stringify(res.matchedTopics)}`
    );
    assert.match(
      res.answer,
      /CourseMart support/i,
      `Expected general support fallback message for query: "${query}"`
    );
  }

  // 2. Legitimate queries match expected topics
  const genuineMembership = buildEnquiryResponse('What are the benefits of Pro?');
  assert.equal(genuineMembership.confidence, 0.9);
  assert.ok(genuineMembership.matchedTopics.includes('membership'));

  const genuineHook = buildEnquiryResponse('How do I use the useEffect hook?');
  assert.equal(genuineHook.confidence, 0.88);
  assert.ok(genuineHook.matchedTopics.includes('react'));

  const genuineCert = buildEnquiryResponse('When is my CM-CERT issued?');
  assert.equal(genuineCert.confidence, 0.92);
  assert.ok(genuineCert.matchedTopics.includes('certificates'));

  // 3. Null-safety in processScheduledBlogPosts
  assert.doesNotThrow(() => {
    const res = processScheduledBlogPosts([null as any]);
    assert.equal(res.publishedCount, 0);
  });
  assert.doesNotThrow(() => {
    const res = processScheduledBlogPosts(null as any);
    assert.equal(res.publishedCount, 0);
  });

  // 4. Null-safety in evaluateDynamicSiteUpdates
  assert.doesNotThrow(() => {
    const res = evaluateDynamicSiteUpdates([], [{ status: 'completed', items: [null as any] } as any]);
    assert.equal(res.bestsellerIds.length, 0);
  });
  assert.doesNotThrow(() => {
    const res = evaluateDynamicSiteUpdates([null as any], [null as any]);
    assert.equal(res.bestsellerIds.length, 0);
  });
  assert.doesNotThrow(() => {
    const res = evaluateDynamicSiteUpdates(null as any, null as any);
    assert.equal(res.bestsellerIds.length, 0);
  });

  // 5. Null-safety in detectResourceSharingAnomalies
  assert.doesNotThrow(() => {
    const res = detectResourceSharingAnomalies([null as any]);
    assert.equal(res.flaggedUserIds.length, 0);
  });
  assert.doesNotThrow(() => {
    const res = detectResourceSharingAnomalies([
      { userId: 'u1', ipAddress: '1.2.3.4', timestamp: 'invalid' as any },
      null as any,
      undefined as any,
    ]);
    assert.equal(res.flaggedUserIds.length, 0);
  });
  assert.doesNotThrow(() => {
    const res = detectResourceSharingAnomalies(null as any);
    assert.equal(res.flaggedUserIds.length, 0);
  });
});
