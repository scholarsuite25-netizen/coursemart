import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AFFILIATE_MIN_PAYOUT_NGN,
  DEFAULT_AFFILIATE_COMMISSION_PERCENT,
  attributeAffiliateReferral,
  attributeReferralSale,
  calculateAffiliateCommission,
  calculateAffiliateLedgerSummary,
  calculateCartTotals,
  calculateCourseProgressPercent,
  calculateModuleProgress,
  extractReferralCodeFromSearch,
  filterAndSortProducts,
  generateLicenseKey,
  getCountdownSecondsRemaining,
  getCourseProgressSummary,
  getDiscountPercent,
  isUnlockedByMembership,
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

test('DEFAULT_AFFILIATE_COMMISSION_PERCENT is 20 percent', () => {
  assert.equal(DEFAULT_AFFILIATE_COMMISSION_PERCENT, 20);
});

test('calculateAffiliateCommission calculates 20% by default, clamps between 0 and 75, handles zero/negative values, and rounds currency', () => {
  // Default 20%
  assert.equal(calculateAffiliateCommission(10000), 2000);
  assert.equal(calculateAffiliateCommission(65000), 13000);
  assert.equal(calculateAffiliateCommission(49.99), 10); // 9.998 rounded to 10

  // Custom commission rate
  assert.equal(calculateAffiliateCommission(10000, 25), 2500);

  // Clamping: max 75%
  assert.equal(calculateAffiliateCommission(10000, 90), 7500);
  // Clamping: min 0%
  assert.equal(calculateAffiliateCommission(10000, -10), 0);

  // Zero and negative order total
  assert.equal(calculateAffiliateCommission(0), 0);
  assert.equal(calculateAffiliateCommission(-500), 0);
});

test('attributeAffiliateReferral attributes independent sales and rejects self-referral, inactive or unknown codes', () => {
  const affiliates = [
    {
      id: 'aff-1',
      userId: 'user-aff-1',
      userName: 'John Doe',
      userEmail: 'john@partner.io',
      code: 'JOHN20',
      commissionRate: 20,
      active: true,
    },
    {
      id: 'aff-2',
      userId: 'user-aff-2',
      userName: 'Jane Smith',
      userEmail: 'jane@agency.com',
      code: 'JANE30',
      commissionRate: 30,
      active: false, // inactive
    },
  ];

  // 1. Independent sale attribution (case-insensitive code)
  const success1 = attributeAffiliateReferral(
    'john20',
    { id: 'user-buyer-1', email: 'buyer@example.com' },
    affiliates,
    50000
  );
  assert.equal(success1.attributed, true);
  assert.equal(success1.affiliateId, 'aff-1');
  assert.equal(success1.affiliateCode, 'JOHN20');
  assert.equal(success1.commissionAmount, 10000); // 20% of 50000

  // 2. Self-referral rejection by userId
  const selfUser = attributeAffiliateReferral(
    'JOHN20',
    { id: 'user-aff-1', email: 'different@example.com' },
    affiliates,
    50000
  );
  assert.equal(selfUser.attributed, false);
  assert.equal(selfUser.commissionAmount, 0);
  assert.match(selfUser.reason ?? '', /Self-referrals are strictly disallowed/);

  // 3. Self-referral rejection by case-insensitive email
  const selfEmail = attributeAffiliateReferral(
    'JOHN20',
    { id: 'another-user', email: 'JOHN@PARTNER.IO' },
    affiliates,
    50000
  );
  assert.equal(selfEmail.attributed, false);
  assert.equal(selfEmail.commissionAmount, 0);
  assert.match(selfEmail.reason ?? '', /Self-referrals are strictly disallowed/);

  // 4. Inactive affiliate rejection
  const inactiveAff = attributeAffiliateReferral(
    'JANE30',
    { id: 'user-buyer-2', email: 'buyer2@example.com' },
    affiliates,
    50000
  );
  assert.equal(inactiveAff.attributed, false);
  assert.equal(inactiveAff.commissionAmount, 0);
  assert.match(inactiveAff.reason ?? '', /Invalid or inactive/);

  // 5. Unknown referral code
  const unknown = attributeAffiliateReferral(
    'NONEXISTENT',
    { id: 'user-buyer-1', email: 'buyer@example.com' },
    affiliates,
    50000
  );
  assert.equal(unknown.attributed, false);
  assert.equal(unknown.commissionAmount, 0);

  // 6. Missing or empty code
  assert.equal(attributeAffiliateReferral('', null, affiliates, 50000).attributed, false);
  assert.equal(attributeAffiliateReferral(null, null, affiliates, 50000).attributed, false);
  assert.equal(attributeAffiliateReferral('   ', null, affiliates, 50000).attributed, false);
});

test('attributeReferralSale alias supports both numeric order total and order object signature', () => {
  const affiliates = [
    {
      id: 'aff-1',
      userId: 'user-aff-1',
      userName: 'John Doe',
      userEmail: 'john@partner.io',
      code: 'JOHN20',
      commissionRate: 20,
      active: true,
    },
  ];

  // Numeric order total
  const resNum = attributeReferralSale(
    100000,
    'JOHN20',
    affiliates,
    { id: 'buyer-99', email: 'buyer99@gmail.com' }
  );
  assert.equal(resNum.attributed, true);
  assert.equal(resNum.commissionAmount, 20000);

  // Object order signature
  const resObj = attributeReferralSale(
    { id: 'ORD-999', total: 60000, userId: 'buyer-99', customerEmail: 'buyer99@gmail.com' },
    'JOHN20',
    affiliates
  );
  assert.equal(resObj.attributed, true);
  assert.equal(resObj.commissionAmount, 12000);

  // Self-referral via object order
  const resSelf = attributeReferralSale(
    { id: 'ORD-1000', total: 60000, userId: 'user-aff-1', customerEmail: 'other@gmail.com' },
    'JOHN20',
    affiliates
  );
  assert.equal(resSelf.attributed, false);
});

test('isUnlockedByMembership enforces Free vs Paid tier access control and gates isPremium resources', () => {
  const premiumProduct = {
    id: 'prod-prem-1',
    isPremium: true,
    price: 65000,
    includedInMembershipTier: 'paid' as const,
  };
  const standardPaidProduct = {
    id: 'prod-paid-1',
    isPremium: false,
    price: 45000,
    includedInMembershipTier: 'paid' as const,
  };
  const freeProduct = {
    id: 'prod-free-1',
    isPremium: false,
    price: 0,
    includedInMembershipTier: 'free' as const,
  };

  // 1. Premium products require checkout purchase (not unlocked for free by membership)
  assert.equal(isUnlockedByMembership(premiumProduct, { status: 'active', planId: 'paid' }), false);
  assert.equal(isUnlockedByMembership(premiumProduct, { status: 'active', planId: 'free' }), false);

  // 2. Standard paid products unlocked for Paid member, locked for Free member
  assert.equal(isUnlockedByMembership(standardPaidProduct, { status: 'active', planId: 'paid' }), true);
  assert.equal(isUnlockedByMembership(standardPaidProduct, { status: 'active', planId: 'free' }), false);

  // 3. Free products unlocked for Free and Paid members alike, as well as null membership
  assert.equal(isUnlockedByMembership(freeProduct, { status: 'active', planId: 'free' }), true);
  assert.equal(isUnlockedByMembership(freeProduct, { status: 'active', planId: 'paid' }), true);
  assert.equal(isUnlockedByMembership(freeProduct, null), true);

  // 4. Inactive, pending, cancelled, or missing membership rejects access to paid products
  assert.equal(isUnlockedByMembership(standardPaidProduct, null), false);
  assert.equal(isUnlockedByMembership(standardPaidProduct, undefined), false);
  assert.equal(isUnlockedByMembership(standardPaidProduct, { status: 'cancelled', planId: 'paid' }), false);
  assert.equal(isUnlockedByMembership(standardPaidProduct, { status: 'pending', planId: 'paid' }), false);

  // 5. Null product handles safely
  assert.equal(isUnlockedByMembership(null, { status: 'active', planId: 'paid' }), false);
});

test('extractReferralCodeFromSearch parses both ?ref= and ?aff= query parameters', () => {
  assert.equal(extractReferralCodeFromSearch('?ref=alex20'), 'ALEX20');
  assert.equal(extractReferralCodeFromSearch('?aff=partner50'), 'PARTNER50');
  assert.equal(extractReferralCodeFromSearch('search=course&aff=PROMO_CODE'), 'PROMO_CODE');
  assert.equal(extractReferralCodeFromSearch('?ref=ab'), null); // too short (<3)
  assert.equal(extractReferralCodeFromSearch(''), null);
});

test('attributeAffiliateReferral rejects self-referral when buyer email has leading/trailing whitespace and mixed casing', () => {
  const affiliates = [
    {
      id: 'aff-3',
      userId: 'user-aff-3',
      userName: 'Tunde Mark',
      userEmail: 'tunde@growthlabs.ng',
      code: 'GROWTH20',
      commissionRate: 20,
      active: true,
    },
  ];
  const res = attributeAffiliateReferral(
    'growth20',
    { id: 'user-buyer-other', email: '   TUNDE@GrowthLabs.NG   ' },
    affiliates,
    75000
  );
  assert.equal(res.attributed, false);
  assert.equal(res.commissionAmount, 0);
  assert.match(res.reason ?? '', /Self-referrals are strictly disallowed/);
});

test('attributeAffiliateReferral applies custom affiliate commission rate when configured', () => {
  const affiliates = [
    {
      id: 'aff-super',
      userId: 'user-super',
      userName: 'Super Affiliate',
      userEmail: 'super@ambassador.com',
      code: 'SUPER35',
      commissionRate: 35,
      active: true,
    },
  ];
  const res = attributeAffiliateReferral(
    'SUPER35',
    { id: 'buyer-random', email: 'random@gmail.com' },
    affiliates,
    40000
  );
  assert.equal(res.attributed, true);
  assert.equal(res.commissionAmount, 14000); // 35% of 40000
});

test('isUnlockedByMembership returns false when product has isPremium: false and no membership tier configured', () => {
  const nonMemberProduct = {
    id: 'prod-regular',
    isPremium: false,
    includedInMembershipTier: undefined,
  };
  assert.equal(
    isUnlockedByMembership(nonMemberProduct, { status: 'active', planId: 'vip' }),
    false
  );
});

test('isUnlockedByMembership validates tier hierarchy for free vs paid products', () => {
  const freeProduct = { id: 'p-free', isPremium: false, price: 0, includedInMembershipTier: 'free' as const };
  const paidProduct = { id: 'p-paid', isPremium: false, price: 40000, includedInMembershipTier: 'paid' as const };

  // Paid member can unlock both free and paid products
  assert.equal(isUnlockedByMembership(freeProduct, { status: 'active', planId: 'paid' }), true);
  assert.equal(isUnlockedByMembership(paidProduct, { status: 'active', planId: 'paid' }), true);

  // Free member can only unlock free product
  assert.equal(isUnlockedByMembership(freeProduct, { status: 'active', planId: 'free' }), true);
  assert.equal(isUnlockedByMembership(paidProduct, { status: 'active', planId: 'free' }), false);
});

test('extractReferralCodeFromSearch trims query string whitespace and handles raw search params without leading question mark', () => {
  assert.equal(extractReferralCodeFromSearch('ref=PARTNER20'), 'PARTNER20');
  assert.equal(extractReferralCodeFromSearch('aff=SUMMER_DEAL'), 'SUMMER_DEAL');
  assert.equal(extractReferralCodeFromSearch('other=1&ref=CLEAN_CODE&foo=bar'), 'CLEAN_CODE');
});



