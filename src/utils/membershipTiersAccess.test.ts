import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  calculateExtendedCartTotals,
  isTierSufficient,
  isUnlockedByMembership,
  migrateLegacyTier,
  migrateUserMemberships,
} from './commerce.ts';
import { storageService } from '../services/storageService.ts';
import type { CartItem, Coupon, Product, UserMembership } from '../types/marketplace.ts';

describe('Milestone 1: Free & Paid Membership Tiers, Access Control, 50% Discount & Legacy Migration', () => {
  /* ==========================================================================
     R1: Legacy Tier Migration & Canonical Tiers
     ========================================================================== */
  describe('R1. Legacy Tier Migration & Canonical Plans', () => {
    test('migrateLegacyTier normalizes all legacy tiers (pro, vip, enterprise, starter) to paid', () => {
      assert.equal(migrateLegacyTier('pro'), 'paid');
      assert.equal(migrateLegacyTier('vip'), 'paid');
      assert.equal(migrateLegacyTier('enterprise'), 'paid');
      assert.equal(migrateLegacyTier('starter'), 'paid');
      assert.equal(migrateLegacyTier('paid'), 'paid');

      // Case-insensitivity and whitespace trimming
      assert.equal(migrateLegacyTier('  PRO  '), 'paid');
      assert.equal(migrateLegacyTier('VIP'), 'paid');
      assert.equal(migrateLegacyTier('Enterprise'), 'paid');
      assert.equal(migrateLegacyTier('Starter'), 'paid');
    });

    test('migrateLegacyTier defaults unassigned, null, empty, and unknown tiers to free', () => {
      assert.equal(migrateLegacyTier('free'), 'free');
      assert.equal(migrateLegacyTier(null), 'free');
      assert.equal(migrateLegacyTier(undefined), 'free');
      assert.equal(migrateLegacyTier(''), 'free');
      assert.equal(migrateLegacyTier('unknown_tier'), 'free');
      assert.equal(migrateLegacyTier('guest'), 'free');
    });

    test('migrateUserMemberships idempotently converts legacy user memberships to paid', () => {
      const legacyList: UserMembership[] = [
        {
          id: 'mem-1',
          userId: 'user-1',
          planId: 'starter' as any,
          billingCycle: 'monthly',
          status: 'active',
          startedAt: '2026-01-01',
          renewsAt: '2026-02-01',
        },
        {
          id: 'mem-2',
          userId: 'user-2',
          planId: 'pro' as any,
          billingCycle: 'annual',
          status: 'active',
          startedAt: '2026-01-01',
          renewsAt: '2027-01-01',
        },
        {
          id: 'mem-3',
          userId: 'user-3',
          planId: 'vip' as any,
          billingCycle: 'monthly',
          status: 'cancelled',
          startedAt: '2026-01-01',
          renewsAt: '2026-02-01',
        },
        {
          id: 'mem-4',
          userId: 'user-4',
          planId: 'enterprise' as any,
          billingCycle: 'annual',
          status: 'active',
          startedAt: '2026-01-01',
          renewsAt: '2027-01-01',
        },
        {
          id: 'mem-5',
          userId: 'user-5',
          planId: 'free',
          billingCycle: 'monthly',
          status: 'active',
          startedAt: '2026-01-01',
          renewsAt: '2026-02-01',
        },
      ];

      const migrated = migrateUserMemberships(legacyList);
      assert.equal(migrated.length, 5);
      assert.equal(migrated[0].planId, 'paid');
      assert.equal(migrated[1].planId, 'paid');
      assert.equal(migrated[2].planId, 'paid');
      assert.equal(migrated[3].planId, 'paid');
      assert.equal(migrated[4].planId, 'free');

      // Preserves metadata
      assert.equal(migrated[0].userId, 'user-1');
      assert.equal(migrated[2].status, 'cancelled');
    });

    test('storageService maintains exactly two canonical plans: free and paid', () => {
      const plans = storageService.getMembershipPlans();
      assert.equal(plans.length, 2);
      const planIds = plans.map((p) => p.id);
      assert.ok(planIds.includes('free'));
      assert.ok(planIds.includes('paid'));

      const freePlan = plans.find((p) => p.id === 'free')!;
      assert.equal(freePlan.monthlyPrice, 0);
      assert.equal(freePlan.annualPrice, 0);
      assert.equal(freePlan.storeDiscountPercent, 0);

      const paidPlan = plans.find((p) => p.id === 'paid')!;
      assert.equal(paidPlan.annualPrice, 10000); // ₦10,000/yr without masterclass training
      assert.equal(paidPlan.masterclassPrice, 25000); // ₦25,000/yr with master class online training
      assert.equal(paidPlan.storeDiscountPercent, 50); // 50% discount on premium products
      assert.equal(paidPlan.includesMasterclassTraining, true);
    });
  });

  /* ==========================================================================
     R2: Tier Access Control
     ========================================================================== */
  describe('R2. Tier Access Control & Sufficiency', () => {
    test('isTierSufficient enforces hierarchy between Free and Paid tiers', () => {
      // Paid tier is sufficient for Free and Paid requirements
      assert.equal(isTierSufficient('paid', 'free'), true);
      assert.equal(isTierSufficient('paid', 'paid'), true);

      // Free tier is sufficient only for Free requirements
      assert.equal(isTierSufficient('free', 'free'), true);
      assert.equal(isTierSufficient('free', 'paid'), false);

      // Handles legacy tier strings by normalizing to paid
      assert.equal(isTierSufficient('pro', 'free'), true);
      assert.equal(isTierSufficient('vip', 'paid'), true);
      assert.equal(isTierSufficient('enterprise', 'paid'), true);
      assert.equal(isTierSufficient('starter', 'free'), true);

      // Null and undefined safety
      assert.equal(isTierSufficient(null, 'paid'), false);
      assert.equal(isTierSufficient(undefined, 'paid'), false);
      assert.equal(isTierSufficient('paid', undefined), false);
    });

    test('isUnlockedByMembership allows Free items to all users regardless of tier or auth', () => {
      const freeItemByPrice: Partial<Product> = {
        id: 'prod-free-0',
        price: 0,
        isPremium: false,
      };
      const freeItemByTier: Partial<Product> = {
        id: 'prod-free-1',
        price: 5000,
        includedInMembershipTier: 'free',
        isPremium: false,
      };

      // Authenticated with Free membership
      assert.equal(isUnlockedByMembership(freeItemByPrice, { status: 'active', planId: 'free' }), true);
      assert.equal(isUnlockedByMembership(freeItemByTier, { status: 'active', planId: 'free' }), true);

      // Authenticated with Paid membership
      assert.equal(isUnlockedByMembership(freeItemByPrice, { status: 'active', planId: 'paid' }), true);
      assert.equal(isUnlockedByMembership(freeItemByTier, { status: 'active', planId: 'paid' }), true);

      // Unauthenticated / null membership
      assert.equal(isUnlockedByMembership(freeItemByPrice, null), true);
      assert.equal(isUnlockedByMembership(freeItemByTier, null), true);
      assert.equal(isUnlockedByMembership(freeItemByPrice, undefined), true);
    });

    test('isUnlockedByMembership unlocks standard paid items for Paid members, blocks Free members', () => {
      const standardPaidCourse: Partial<Product> = {
        id: 'prod-course-paid-1',
        price: 45000,
        includedInMembershipTier: 'paid',
        isPremium: false,
      };

      // Paid member has access
      assert.equal(
        isUnlockedByMembership(standardPaidCourse, { status: 'active', planId: 'paid' }),
        true
      );

      // Legacy tier member (e.g. 'pro', 'starter') has access
      assert.equal(
        isUnlockedByMembership(standardPaidCourse, { status: 'active', planId: 'pro' as any }),
        true
      );
      assert.equal(
        isUnlockedByMembership(standardPaidCourse, { status: 'active', planId: 'starter' as any }),
        true
      );

      // Free member is blocked
      assert.equal(
        isUnlockedByMembership(standardPaidCourse, { status: 'active', planId: 'free' }),
        false
      );

      // Inactive, pending, cancelled, or missing memberships are blocked
      assert.equal(
        isUnlockedByMembership(standardPaidCourse, { status: 'pending', planId: 'paid' }),
        false
      );
      assert.equal(
        isUnlockedByMembership(standardPaidCourse, { status: 'cancelled', planId: 'paid' }),
        false
      );
      assert.equal(isUnlockedByMembership(standardPaidCourse, null), false);
      assert.equal(isUnlockedByMembership(standardPaidCourse, undefined), false);
    });

    test('isUnlockedByMembership never auto-unlocks isPremium products (requires checkout purchase)', () => {
      const premiumProduct: Partial<Product> = {
        id: 'prod-premium-1',
        price: 65000,
        includedInMembershipTier: 'paid',
        isPremium: true,
      };

      // Both Free and Paid members must purchase premium items at checkout
      assert.equal(
        isUnlockedByMembership(premiumProduct, { status: 'active', planId: 'paid' }),
        false
      );
      assert.equal(
        isUnlockedByMembership(premiumProduct, { status: 'active', planId: 'free' }),
        false
      );
      assert.equal(
        isUnlockedByMembership(premiumProduct, { status: 'active', planId: 'vip' as any }),
        false
      );
      assert.equal(isUnlockedByMembership(premiumProduct, null), false);
    });
  });

  /* ==========================================================================
     R3: Premium Product Discount at Checkout
     ========================================================================== */
  describe('R3. 50% Premium Product Discount at Checkout', () => {
    test('Paid tier member receives exactly 50% discount on single premium product', () => {
      const items: CartItem[] = [
        {
          productId: 'prod-ebook-1',
          unitPrice: 30000,
          isPremium: true,
        },
      ];

      const totals = calculateExtendedCartTotals(items, [], '', 'paid', 0);
      assert.equal(totals.subtotal, 30000);
      assert.equal(totals.membershipDiscount, 15000); // 50% of 30,000
      assert.equal(totals.grandTotal, 15000);
    });

    test('Free tier member pays full price (0% discount) on premium product', () => {
      const items: CartItem[] = [
        {
          productId: 'prod-ebook-1',
          unitPrice: 30000,
          isPremium: true,
        },
      ];

      const totals = calculateExtendedCartTotals(items, [], '', 'free', 0);
      assert.equal(totals.subtotal, 30000);
      assert.equal(totals.membershipDiscount, 0); // 0% discount
      assert.equal(totals.grandTotal, 30000);
    });

    test('Mixed cart: Paid member receives 50% discount strictly on premium items, not on standard items', () => {
      const items: CartItem[] = [
        {
          productId: 'prod-prem-course',
          unitPrice: 60000,
          isPremium: true,
        },
        {
          productId: 'prod-std-course',
          unitPrice: 20000,
          isPremium: false,
        },
      ];

      const totals = calculateExtendedCartTotals(items, [], '', 'paid', 0);
      assert.equal(totals.subtotal, 80000);
      // 50% applies to 60,000 premium item = 30,000; 20,000 standard item gets 0 discount
      assert.equal(totals.membershipDiscount, 30000);
      assert.equal(totals.grandTotal, 50000);
    });

    test('Stacking 50% premium discount with coupon code: coupon applies first, then 50% member discount', () => {
      const items: CartItem[] = [
        {
          productId: 'prod-prem-course',
          unitPrice: 50000,
          isPremium: true,
        },
      ];
      const coupons: Coupon[] = [
        {
          id: 'c-10',
          code: 'DISCOUNT10',
          discountType: 'percent',
          value: 10,
          minSpend: 10000,
          active: true,
          usageCount: 0,
          maxUses: 100,
          expiresAt: '2030-01-01',
        },
      ];

      const totals = calculateExtendedCartTotals(items, coupons, 'DISCOUNT10', 'paid', 0);
      assert.equal(totals.subtotal, 50000);
      assert.equal(totals.discount, 5000); // 10% coupon off 50,000 = 5,000 -> 45,000 net
      assert.equal(totals.membershipDiscount, 22500); // 50% off 45,000 net = 22,500
      assert.equal(totals.grandTotal, 22500);
    });

    test('50% premium discount with sales tax calculation', () => {
      const items: CartItem[] = [
        {
          productId: 'prod-prem-handbook',
          unitPrice: 40000,
          isPremium: true,
        },
      ];

      // 7.5% VAT
      const totals = calculateExtendedCartTotals(items, [], '', 'paid', 0.075);
      assert.equal(totals.subtotal, 40000);
      assert.equal(totals.membershipDiscount, 20000);
      // Taxable amount: 20,000. 7.5% of 20,000 = 1,500.
      assert.equal(totals.taxAmount, 1500);
      assert.equal(totals.grandTotal, 21500);
    });

    test('Legacy tier names (pro, vip, starter, enterprise) qualify for the 50% premium discount', () => {
      const items: CartItem[] = [
        {
          productId: 'prod-prem-1',
          unitPrice: 50000,
          isPremium: true,
        },
      ];

      for (const legacyTier of ['pro', 'vip', 'starter', 'enterprise']) {
        const totals = calculateExtendedCartTotals(items, [], '', legacyTier, 0);
        assert.equal(totals.membershipDiscount, 25000, `Legacy tier ${legacyTier} should qualify for 50% discount`);
        assert.equal(totals.grandTotal, 25000);
      }
    });
  });
});
