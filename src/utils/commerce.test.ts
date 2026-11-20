import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AFFILIATE_MIN_PAYOUT_NGN,
  calculateAffiliateLedgerSummary,
  calculateCartTotals,
  calculateCourseProgressPercent,
  calculateModuleProgress,
  filterAndSortProducts,
  generateLicenseKey,
  getCountdownSecondsRemaining,
  getCourseProgressSummary,
  getDiscountPercent,
  toggleModuleLecturesCompletion,
  validateAuthForm,
} from './commerce';
import type { CartItem, Coupon, Product, ProductFilterState } from '../types/marketplace';

const sampleCoupons: Coupon[] = [
  {
    id: 'c1',
    code: 'LEARN20',
    discountType: 'percent',
    value: 20,
    minSpend: 30,
    active: true,
    usageCount: 4,
    maxUses: 100,
    expiresAt: '2028-12-31T23:59:59Z',
  },
  {
    id: 'c2',
    code: 'FLAT15',
    discountType: 'fixed',
    value: 15,
    minSpend: 20,
    active: true,
    usageCount: 0,
    maxUses: 50,
    expiresAt: '2028-12-31T23:59:59Z',
  },
  {
    id: 'c3',
    code: 'EXPIRED10',
    discountType: 'percent',
    value: 10,
    minSpend: 0,
    active: true,
    usageCount: 0,
    maxUses: 50,
    expiresAt: '2020-01-01T00:00:00Z',
  },
];

test('calculateCartTotals applies percentage coupon accurately', () => {
  const items: CartItem[] = [
    { productId: 'p1', unitPrice: 49.99 },
    { productId: 'p2', unitPrice: 29.01 },
  ];
  const result = calculateCartTotals(
    items,
    sampleCoupons,
    'learn20',
    new Date('2026-11-16T00:00:00Z')
  );
  assert.equal(result.subtotal, 79);
  assert.equal(result.discount, 15.8);
  assert.equal(result.total, 63.2);
  assert.equal(result.couponError, null);
  assert.equal(result.appliedCoupon?.code, 'LEARN20');
});

test('calculateCartTotals rejects expired or minSpend-unmet coupons', () => {
  const items: CartItem[] = [{ productId: 'p1', unitPrice: 19 }];
  const minSpendFail = calculateCartTotals(
    items,
    sampleCoupons,
    'LEARN20',
    new Date('2026-11-16T00:00:00Z')
  );
  assert.equal(minSpendFail.discount, 0);
  assert.match(minSpendFail.couponError ?? '', /Minimum spend/);

  const expiredFail = calculateCartTotals(
    items,
    sampleCoupons,
    'EXPIRED10',
    new Date('2026-11-16T00:00:00Z')
  );
  assert.equal(expiredFail.discount, 0);
  assert.match(expiredFail.couponError ?? '', /expired/);
});

test('generateLicenseKey creates structured 4-segment keys', () => {
  const key = generateLicenseKey('CM', 'order-123-user-456');
  assert.match(key, /^CM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
});

test('calculateCourseProgressPercent computes percentage from valid lecture IDs only', () => {
  const mockCourse = {
    id: 'course-1',
    courseData: {
      totalHours: 4,
      modules: [
        {
          id: 'm1',
          title: 'Intro',
          lectures: [
            { id: 'l1', title: 'One', durationMinutes: 10, isPreview: true, summary: '', keyTakeaways: [] },
            { id: 'l2', title: 'Two', durationMinutes: 10, isPreview: false, summary: '', keyTakeaways: [] },
          ],
        },
        {
          id: 'm2',
          title: 'Core',
          lectures: [
            { id: 'l3', title: 'Three', durationMinutes: 15, isPreview: false, summary: '', keyTakeaways: [] },
            { id: 'l4', title: 'Four', durationMinutes: 15, isPreview: false, summary: '', keyTakeaways: [] },
          ],
        },
      ],
    },
  } as unknown as Product;

  assert.equal(calculateCourseProgressPercent(mockCourse, ['l1', 'l3', 'stale-id']), 50);
  assert.equal(calculateCourseProgressPercent(mockCourse, ['l1', 'l2', 'l3', 'l4']), 100);
});

test('module progress helpers compute stats and toggle all module lectures cleanly', () => {
  const mod1 = {
    id: 'm1',
    title: 'Intro',
    lectures: [
      { id: 'l1', title: 'One', durationMinutes: 10, isPreview: true, summary: '', keyTakeaways: [] },
      { id: 'l2', title: 'Two', durationMinutes: 10, isPreview: false, summary: '', keyTakeaways: [] },
    ],
  };
  const mod2 = {
    id: 'm2',
    title: 'Core',
    lectures: [
      { id: 'l3', title: 'Three', durationMinutes: 15, isPreview: false, summary: '', keyTakeaways: [] },
      { id: 'l4', title: 'Four', durationMinutes: 15, isPreview: false, summary: '', keyTakeaways: [] },
    ],
  };
  const course = {
    id: 'course-1',
    courseData: { totalHours: 2, modules: [mod1, mod2] },
  } as unknown as Product;

  assert.deepEqual(calculateModuleProgress(mod1, ['l1']), {
    completedCount: 1,
    totalCount: 2,
    percent: 50,
    isCompleted: false,
  });

  // Completing mod1 adds l2 while preserving l3 from mod2
  const afterComplete = toggleModuleLecturesCompletion(mod1, ['l1', 'l3']);
  assert.deepEqual(afterComplete.sort(), ['l1', 'l2', 'l3']);

  const summary = getCourseProgressSummary(course, afterComplete);
  assert.deepEqual(summary, {
    completedLectures: 3,
    totalLectures: 4,
    completedModules: 1,
    totalModules: 2,
    percent: 75,
  });

  // Toggling mod1 again unmarks mod1 lectures while preserving mod2
  const afterUnmark = toggleModuleLecturesCompletion(mod1, afterComplete);
  assert.deepEqual(afterUnmark, ['l3']);
});

test('filterAndSortProducts excludes drafts on storefront and filters by type/search', () => {
  const products = [
    {
      id: '1',
      title: 'TypeScript Architecture',
      subtitle: 'Scalable systems',
      type: 'course',
      category: 'Engineering',
      instructorName: 'Elena',
      price: 59,
      originalPrice: 129,
      rating: 4.9,
      reviewCount: 400,
      studentsCount: 1500,
      level: 'Advanced',
      status: 'published',
      updatedAt: '2026-10-01',
      formatLabel: '14h Video',
    },
    {
      id: '2',
      title: 'Draft eBook',
      subtitle: 'Hidden',
      type: 'ebook',
      category: 'Engineering',
      instructorName: 'Elena',
      price: 25,
      originalPrice: 49,
      rating: 4.5,
      reviewCount: 10,
      studentsCount: 50,
      level: 'Beginner',
      status: 'draft',
      updatedAt: '2026-10-10',
      formatLabel: 'PDF/EPUB',
    },
  ] as unknown as Product[];

  const filters: ProductFilterState = {
    type: 'all',
    category: 'All',
    minRating: 0,
    priceFilter: 'all',
    level: 'all',
    search: 'TypeScript',
    sortBy: 'popular',
  };

  const results = filterAndSortProducts(products, filters, false);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, '1');
});

test('validateAuthForm checks email, password length, and registration name', () => {
  const invalid = validateAuthForm('bad-email', '123', '', true);
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.password);
  assert.ok(invalid.errors.name);

  const valid = validateAuthForm('student@coursemart.io', 'demo1234', 'Alex Rivera', true);
  assert.equal(valid.valid, true);
});

test('getDiscountPercent calculates savings cleanly', () => {
  assert.equal(getDiscountPercent(49, 129), 62);
  assert.equal(getDiscountPercent(50, 50), 0);
});

test('calculateAffiliateLedgerSummary reconciles approved earnings, paid payouts, pending withdrawals, and threshold', () => {
  const summary = calculateAffiliateLedgerSummary(
    [
      { status: 'paid', commissionAmount: 45000 },
      { status: 'approved', commissionAmount: 32000 },
      { status: 'pending', commissionAmount: 16250 },
      { status: 'declined', commissionAmount: 5000 },
    ],
    [
      { status: 'paid', amount: 45000 },
      { status: 'pending', amount: 10000 },
      { status: 'declined', amount: 12000 },
    ],
    200
  );

  assert.equal(summary.lifetimeApprovedEarned, 77000);
  assert.equal(summary.settledPaidOut, 45000);
  assert.equal(summary.pendingWithdrawals, 10000);
  assert.equal(summary.totalWithdrawnOrReserved, 55000);
  assert.equal(summary.availableBalance, 22000);
  assert.equal(summary.pendingHoldEarned, 16250);
  assert.equal(summary.declinedEarned, 5000);
  assert.equal(summary.minPayoutNgn, AFFILIATE_MIN_PAYOUT_NGN);
  assert.equal(summary.canRequestPayout, true);
  assert.equal(summary.convRate, 2);
});

test('getCountdownSecondsRemaining returns deterministic remaining seconds without resetting', () => {
  const now = Date.parse('2026-11-20T00:00:00Z');
  assert.equal(getCountdownSecondsRemaining('2026-11-20T01:00:00Z', now), 3600);
  assert.equal(getCountdownSecondsRemaining('2026-11-19T23:59:59Z', now), 0);
  assert.equal(getCountdownSecondsRemaining(undefined, now), 0);
});


