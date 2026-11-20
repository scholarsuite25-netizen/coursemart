import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAffiliateCommission,
  calculateBundlePrice,
  calculateExtendedCartTotals,
  extractReferralCodeFromSearch,
  generateCertificateCode,
  getRatingBreakdown,
  gradeModuleQuiz,
  isTierSufficient,
} from './commerce';
import {
  applyInlineMarkdownToken,
  calculateArticleWordCount,
  calculateReadTimeMinutes,
  runBlogSeoAudit,
} from './editorial';
import { parseAppRoute } from './catalogAndBlogs';
import type { CartItem, Coupon, Product } from '../types/marketplace';

test('gradeModuleQuiz scores answers and checks pass threshold', () => {
  const questions = [
    { id: 'q1', correctIndex: 1 },
    { id: 'q2', correctIndex: 0 },
    { id: 'q3', correctIndex: 2 },
  ];
  const pass = gradeModuleQuiz(questions, { q1: 1, q2: 0, q3: 2 }, 70);
  assert.equal(pass.scorePercent, 100);
  assert.equal(pass.passed, true);

  const fail = gradeModuleQuiz(questions, { q1: 1, q2: 2, q3: 0 }, 70);
  assert.equal(fail.scorePercent, 33);
  assert.equal(fail.passed, false);
});

test('generateCertificateCode produces deterministic verification format', () => {
  const codeA = generateCertificateCode('user-1', 'prod-course-1');
  const codeB = generateCertificateCode('user-1', 'prod-course-1');
  assert.equal(codeA, codeB);
  assert.match(codeA, /^CM-CERT-[A-F0-9]{4}-[A-F0-9]{4}$/);
});

test('membership tier hierarchy and extended cart discount stack accurately', () => {
  assert.equal(isTierSufficient('vip', 'pro'), true);
  assert.equal(isTierSufficient('starter', 'pro'), false);
  assert.equal(isTierSufficient('pro', 'pro'), true);

  const items: CartItem[] = [{ productId: 'p1', unitPrice: 100 }];
  const coupons: Coupon[] = [
    {
      id: 'c1',
      code: 'SAVE10',
      discountType: 'percent',
      value: 10,
      minSpend: 20,
      active: true,
      usageCount: 0,
      maxUses: 100,
      expiresAt: '2030-01-01',
    },
  ];
  const totals = calculateExtendedCartTotals(items, coupons, 'SAVE10', 20, 0.05);
  // 100 - 10% coupon = 90; 20% member discount on 90 = 18 -> 72; 5% tax on 72 = 3.6 -> 75.6
  assert.equal(totals.discount, 10);
  assert.equal(totals.membershipDiscount, 18);
  assert.equal(totals.taxAmount, 3.6);
  assert.equal(totals.grandTotal, 75.6);
});

test('affiliate referral parsing and commission math', () => {
  assert.equal(extractReferralCodeFromSearch('?ref=alex2026&utm=home'), 'ALEX2026');
  assert.equal(extractReferralCodeFromSearch('?foo=bar'), null);
  assert.equal(calculateAffiliateCommission(120, 25), 30);
});

test('bundle pricing and rating breakdown compute cleanly', () => {
  const bundleProds = [
    { price: 50 } as Product,
    { price: 50 } as Product,
  ];
  const bundle = calculateBundlePrice(bundleProds, 15);
  assert.equal(bundle.regularTotal, 100);
  assert.equal(bundle.bundleTotal, 85);
  assert.equal(bundle.savings, 15);

  const breakdown = getRatingBreakdown([{ rating: 5 }, { rating: 5 }, { rating: 4 }, { rating: 3 }]);
  assert.equal(breakdown[0].stars, 5);
  assert.equal(breakdown[0].percent, 50);
});

test('editorial helpers compute word count, read time, SEO audit, and inline formatting', () => {
  const sections = [
    {
      id: 's1',
      blockType: 'section' as const,
      heading: '01. Production AI Patterns',
      body: 'word '.repeat(160),
      imageUrl: '/src/assets/images/test.jpg',
    },
  ];
  const words = calculateArticleWordCount(sections, 'Quick summary');
  assert.ok(words >= 164);
  assert.equal(calculateReadTimeMinutes(420), 2);

  const seo = runBlogSeoAudit({
    title: 'Production AI Architecture Patterns for Teams',
    seoDescription: 'A comprehensive engineering field guide for shipping reliable AI applications into production safely.',
    excerpt: 'Quick summary',
    coverImage: '/src/assets/images/cover.jpg',
    sections,
    focusKeyword: 'Production AI',
  });
  assert.equal(seo.score, 100);

  const formatted = applyInlineMarkdownToken('Hello world', 6, 11, '**');
  assert.equal(formatted.nextText, 'Hello **world**');
});

test('parseAppRoute resolves membership, affiliates, and showcase', () => {
  assert.deepEqual(parseAppRoute('/membership'), { page: 'membership' });
  assert.deepEqual(parseAppRoute('/affiliates'), { page: 'affiliates' });
  assert.deepEqual(parseAppRoute('/showcase'), { page: 'showcase' });
});
