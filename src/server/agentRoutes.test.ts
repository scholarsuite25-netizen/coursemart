import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApiApp } from './createApp';
import type { BlogPost, Product, Order } from '../types/marketplace';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = createApiApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test('POST /api/agents/blog-publisher enforces authorization and publishes scheduled posts', async () => {
  const now = 1700000000000;
  const samplePosts: BlogPost[] = [
    {
      id: 'srv-post-1',
      title: 'Scheduled Blog 1',
      slug: 'scheduled-blog-1',
      subtitle: 'Sub 1',
      excerpt: 'Excerpt 1',
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
      scheduledAt: new Date(now - 5000).toISOString(),
      publishedAt: '',
      updatedAt: new Date(now - 10000).toISOString(),
    },
    {
      id: 'srv-post-2',
      title: 'Future Blog 2',
      slug: 'future-blog-2',
      subtitle: 'Sub 2',
      excerpt: 'Excerpt 2',
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
      scheduledAt: new Date(now + 600000).toISOString(),
      publishedAt: '',
      updatedAt: new Date(now - 10000).toISOString(),
    },
  ];

  // 1. Unauthorized request
  const unauthRes = await fetch(`${baseUrl}/api/agents/blog-publisher`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ posts: samplePosts }),
  });
  assert.equal(unauthRes.status, 401);

  // 2. Authorized request
  const authRes = await fetch(`${baseUrl}/api/agents/blog-publisher`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-test': 'true',
    },
    body: JSON.stringify({
      posts: samplePosts,
      now,
      generateSocialDrafts: true,
    }),
  });
  assert.equal(authRes.status, 200);
  const data = await authRes.json();
  assert.equal(data.ok, true);
  assert.equal(data.publishedCount, 1);
  assert.deepEqual(data.publishedPostIds, ['srv-post-1']);
  assert.ok(data.socialDraftsCreated > 0);
  assert.equal(data.updatedPosts[0].status, 'published');
  assert.equal(data.updatedPosts[1].status, 'scheduled');
});

test('POST /api/agents/enquiry answers public enquiries deterministically', async () => {
  // 1. Empty / whitespace question
  const emptyRes = await fetch(`${baseUrl}/api/agents/enquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: '   ' }),
  });
  assert.equal(emptyRes.status, 200);
  const emptyData = await emptyRes.json();
  assert.equal(emptyData.ok, true);
  assert.equal(emptyData.confidence, 0);
  assert.match(emptyData.answer, /couldn't quite understand/i);

  // 2. Refund query
  const refundRes = await fetch(`${baseUrl}/api/agents/enquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'How do I request a refund?' }),
  });
  assert.equal(refundRes.status, 200);
  const refundData = await refundRes.json();
  assert.equal(refundData.ok, true);
  assert.ok(refundData.confidence >= 0.9);
  assert.match(refundData.answer, /30-day money-back guarantee/i);
  assert.equal(refundData.suggestedForumThreadSlug, 'faq-refund-policy-and-settlements');

  // 3. React curriculum question with context
  const reactRes = await fetch(`${baseUrl}/api/agents/enquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'Where should I call my React state hook?',
      context: { courseName: 'Modern Full-Stack' },
    }),
  });
  assert.equal(reactRes.status, 200);
  const reactData = await reactRes.json();
  assert.equal(reactData.ok, true);
  assert.ok(reactData.confidence >= 0.85);
  assert.match(reactData.answer, /top level/i);
  assert.match(reactData.answer, /Modern Full-Stack/);
});

test('POST /api/agents/site-update evaluates bestsellers and announcements', async () => {
  const products: Product[] = [
    {
      id: 'srv-p1',
      title: 'Course One',
      slug: 'course-one',
      price: 10000,
      rating: 4.8,
      studentsCount: 15,
      status: 'published',
      category: 'AI',
      description: 'Desc',
      thumbnail: 'https://example.com/img.png',
      type: 'course',
      level: 'All Levels',
      subtitle: 'Sub 1',
      originalPrice: 15000,
      reviewCount: 10,
      language: 'English',
      featured: false,
      learningOutcomes: [],
      requirements: [],
      formatLabel: 'Video Course',
      instructorId: 'ins-1',
      instructorName: 'Instructor',
      instructorRole: 'Instructor',
      instructorAvatar: 'https://example.com/avatar.png',
      updatedAt: '2026-01-01',
    },
    {
      id: 'srv-p2',
      title: 'Course Two',
      slug: 'course-two',
      price: 10000,
      rating: 4.8,
      studentsCount: 0,
      status: 'published',
      category: 'AI',
      description: 'Desc',
      thumbnail: 'https://example.com/img.png',
      type: 'course',
      level: 'All Levels',
      subtitle: 'Sub 2',
      originalPrice: 15000,
      reviewCount: 0,
      language: 'English',
      featured: false,
      learningOutcomes: [],
      requirements: [],
      formatLabel: 'Video Course',
      instructorId: 'ins-1',
      instructorName: 'Instructor',
      instructorRole: 'Instructor',
      instructorAvatar: 'https://example.com/avatar.png',
      updatedAt: '2026-01-01',
    },
  ];

  const orders: Order[] = [
    {
      id: 'srv-ord-1',
      userId: 'u1',
      customerEmail: 'u1@example.com',
      customerName: 'User 1',
      items: [{ productId: 'srv-p1', productTitle: 'Course One', productType: 'course', price: 10000 }],
      subtotal: 10000,
      discount: 0,
      total: 10000,
      status: 'completed',
      paymentMethod: 'card',
      createdAt: '2026-01-01',
    },
  ];

  // 1. Unauthorized
  const unauth = await fetch(`${baseUrl}/api/agents/site-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products, orders }),
  });
  assert.equal(unauth.status, 401);

  // 2. Authorized
  const res = await fetch(`${baseUrl}/api/agents/site-update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-test': 'true',
    },
    body: JSON.stringify({
      products,
      orders,
      salesThreshold: 5,
      applyUpdates: false,
    }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.deepEqual(data.bestsellerIds, ['srv-p1']);
  assert.equal(data.bestsellerCount, 1);
  assert.equal(data.announcement.couponCode, 'BESTSELLER10');
  assert.match(data.announcement.text, /1 verified bestseller/);
});

test('POST /api/agents/security-scan audits logs and creates incident reports', async () => {
  const now = Date.now();
  const logs = [
    { userId: 'suspicious-1', ipAddress: '10.0.0.1', timestamp: now - 1000 },
    { userId: 'suspicious-1', ipAddress: '10.0.0.2', timestamp: now - 2000 },
    { userId: 'suspicious-1', ipAddress: '10.0.0.3', timestamp: now - 3000 },
    { userId: 'suspicious-1', ipAddress: '10.0.0.4', timestamp: now - 4000 },
    { userId: 'normal-user', ipAddress: '192.168.1.1', timestamp: now - 2000 },
  ];

  // 1. Unauthorized
  const unauth = await fetch(`${baseUrl}/api/agents/security-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs }),
  });
  assert.equal(unauth.status, 401);

  // 2. Authorized
  const res = await fetch(`${baseUrl}/api/agents/security-scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-test': 'true',
    },
    body: JSON.stringify({
      logs,
      windowMinutes: 60,
      autoRecordIncidents: true,
    }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.deepEqual(data.flaggedUserIds, ['suspicious-1']);
  assert.equal(data.anomalies.length, 1);
  assert.equal(data.anomalies[0].distinctIps, 4);
  assert.equal(data.incidentsCreated, 1);
});

test('POST /api/agents/* routes gracefully handle null/malformed payloads and reject substring collisions', async () => {
  // 1. Enquiry route rejects substring collisions
  const problemRes = await fetch(`${baseUrl}/api/agents/enquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'I have a problem with my code' }),
  });
  assert.equal(problemRes.status, 200);
  const problemData = await problemRes.json();
  assert.equal(problemData.ok, true);
  assert.equal(problemData.confidence, 0.5);
  assert.deepEqual(problemData.matchedTopics, ['general-support']);

  // 2. Blog publisher with null posts
  const blogNullRes = await fetch(`${baseUrl}/api/agents/blog-publisher`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-test': 'true',
    },
    body: JSON.stringify({ posts: [null, undefined] }),
  });
  assert.equal(blogNullRes.status, 200);
  const blogNullData = await blogNullRes.json();
  assert.equal(blogNullData.ok, true);
  assert.equal(blogNullData.publishedCount, 0);

  // 3. Site update with null orders and null items
  const siteNullRes = await fetch(`${baseUrl}/api/agents/site-update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-test': 'true',
    },
    body: JSON.stringify({
      products: [null],
      orders: [{ status: 'completed', items: [null] }],
      applyUpdates: false,
    }),
  });
  assert.equal(siteNullRes.status, 200);
  const siteNullData = await siteNullRes.json();
  assert.equal(siteNullData.ok, true);

  // 4. Security scan with null logs
  const secNullRes = await fetch(`${baseUrl}/api/agents/security-scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-test': 'true',
    },
    body: JSON.stringify({
      logs: [null, undefined, { userId: 123 }],
      autoRecordIncidents: false,
    }),
  });
  assert.equal(secNullRes.status, 200);
  const secNullData = await secNullRes.json();
  assert.equal(secNullData.ok, true);
  assert.equal(secNullData.flaggedUserIds.length, 0);
});
