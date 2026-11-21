import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFunnelOrderTotal,
  buildFunnelCheckoutPayload,
  getFunnelBySlug,
  interpolatePromptTemplate,
  interpolatePromptVariables,
  extractPromptVariables,
  isPromptVaultAccessible,
  filterPromptVault,
} from './funnelsAndVault';
import type {
  Product,
  PromptVaultItem,
  SalesFunnelConfig,
  UserAccount,
  UserMembership,
} from '../types/marketplace';

const mockProduct: Product = {
  id: 'prod-main-1',
  title: 'AI SaaS Accelerator Masterclass',
  slug: 'ai-saas-accelerator',
  type: 'course',
  price: 50000,
  originalPrice: 120000,
  rating: 4.9,
  reviewCount: 38,
  studentsCount: 340,
  instructorId: 'inst-1',
  instructorName: 'Dr. Elena Vance',
  instructorRole: 'Principal Systems Architect',
  instructorAvatar: '',
  thumbnail: '/assets/products/ai-saas.webp',
  subtitle: 'Build and launch production AI systems.',
  description: 'Detailed description...',
  level: 'Advanced',
  language: 'English',
  status: 'published',
  featured: true,
  category: 'AI & Machine Learning',
  updatedAt: '2026-03-01T00:00:00Z',
  learningOutcomes: ['Build RAG pipelines'],
  requirements: ['TypeScript familiarity'],
  formatLabel: 'Online Video Course',
};

const mockBumpProduct: Product = {
  id: 'prod-bump-1',
  title: 'Architecture Notion Blueprint',
  slug: 'architecture-notion-blueprint',
  type: 'ebook',
  price: 8500,
  originalPrice: 20000,
  rating: 4.8,
  reviewCount: 19,
  studentsCount: 150,
  instructorId: 'inst-1',
  instructorName: 'Dr. Elena Vance',
  instructorRole: 'Principal Systems Architect',
  instructorAvatar: '',
  thumbnail: '/assets/products/blueprint.webp',
  subtitle: 'Ready-to-use architecture specs.',
  description: 'Detailed specs...',
  level: 'All Levels',
  language: 'English',
  status: 'published',
  featured: false,
  category: 'Architecture',
  updatedAt: '2026-03-01T00:00:00Z',
  learningOutcomes: ['Spec design'],
  requirements: ['None'],
  formatLabel: 'Digital PDF & Templates',
};

const mockUpsellProduct: Product = {
  id: 'prod-upsell-1',
  title: 'GridForge Pro UI Kit',
  slug: 'gridforge-pro-ui-kit',
  type: 'software',
  price: 35000,
  originalPrice: 85000,
  rating: 5.0,
  reviewCount: 42,
  studentsCount: 220,
  instructorId: 'inst-1',
  instructorName: 'Dr. Elena Vance',
  instructorRole: 'Principal Systems Architect',
  instructorAvatar: '',
  thumbnail: '/assets/products/gridforge.webp',
  subtitle: 'Production React 19 UI system.',
  description: 'Detailed UI kit...',
  level: 'Intermediate',
  language: 'English',
  status: 'published',
  featured: false,
  category: 'Software & Tools',
  updatedAt: '2026-03-01T00:00:00Z',
  learningOutcomes: ['Full stack dashboard'],
  requirements: ['React'],
  formatLabel: 'Software License',
};

const mockFunnel: SalesFunnelConfig = {
  id: 'fnl-ai-saas',
  slug: 'ai-saas-accelerator',
  title: 'AI SaaS Accelerator Funnel',
  headline: 'Launch Your AI Application in 14 Days',
  subheadline: 'Zero fluff, production-ready fullstack architecture.',
  mainProductId: 'prod-main-1',
  mainProductPrice: 45000, // Funnel discounted price override
  badgeText: 'Limited Enrollment',
  orderBump: {
    productId: 'prod-bump-1',
    title: 'Architecture Notion Blueprint',
    price: 6500,
    originalPrice: 20000,
    description: 'Instant checklist and Notion RFC specs.',
  },
  upsell: {
    productId: 'prod-upsell-1',
    title: 'GridForge Pro UI Kit',
    price: 30000,
    originalPrice: 85000,
    headline: 'Exclusive VIP Upgrade: Accelerate UI Development by 10x',
    description: 'Claim lifetime commercial license to GridForge Pro.',
    benefits: ['60+ React components', 'Tailwind CSS v4 ready', 'Commercial license'],
  },
  active: true,
};

test('1. calculateFunnelOrderTotal: calculates main offer price when no bump and no upsell selected', () => {
  const result = calculateFunnelOrderTotal(15000, false, 4500, false, 8000);
  assert.equal(result.subtotal, 15000);
  assert.equal(result.bumpAmount, 0);
  assert.equal(result.upsellAmount, 0);
  assert.equal(result.total, 15000);
});

test('2. calculateFunnelOrderTotal: calculates total with 1-click order bump selected', () => {
  const result = calculateFunnelOrderTotal(15000, true, 4500);
  assert.equal(result.subtotal, 15000);
  assert.equal(result.bumpAmount, 4500);
  assert.equal(result.upsellAmount, 0);
  assert.equal(result.total, 19500);
});

test('3. calculateFunnelOrderTotal: calculates total with both order bump and upsell selected', () => {
  const result = calculateFunnelOrderTotal(15000, true, 4500, true, 8000);
  assert.equal(result.subtotal, 15000);
  assert.equal(result.bumpAmount, 4500);
  assert.equal(result.upsellAmount, 8000);
  assert.equal(result.total, 27500);
});

test('4. calculateFunnelOrderTotal: ignores order bump and upsell amounts when unselected', () => {
  const result = calculateFunnelOrderTotal(25000, false, 5000, false, 12000);
  assert.equal(result.subtotal, 25000);
  assert.equal(result.bumpAmount, 0);
  assert.equal(result.upsellAmount, 0);
  assert.equal(result.total, 25000);
});

test('5. calculateFunnelOrderTotal: handles zero-price order bump without math errors', () => {
  const result = calculateFunnelOrderTotal(12000, true, 0);
  assert.equal(result.subtotal, 12000);
  assert.equal(result.bumpAmount, 0);
  assert.equal(result.total, 12000);
});

test('6. calculateFunnelOrderTotal: clamps negative prices cleanly to zero', () => {
  const result = calculateFunnelOrderTotal(-5000, true, -2000, true, -1000);
  assert.equal(result.subtotal, 0);
  assert.equal(result.bumpAmount, 0);
  assert.equal(result.upsellAmount, 0);
  assert.equal(result.total, 0);
});

test('7. calculateFunnelOrderTotal: applies percentage coupon / discount correctly across composite total', () => {
  // Gross = 20000 + 4000 + 6000 = 30000. 10% discount = 3000. Total = 27000.
  const result = calculateFunnelOrderTotal(
    20000,
    { selected: true, price: 4000 },
    { selected: true, price: 6000 },
    10
  );
  assert.equal(result.subtotal, 20000);
  assert.equal(result.bumpAmount, 4000);
  assert.equal(result.upsellAmount, 6000);
  assert.equal(result.discount, 3000);
  assert.equal(result.total, 27000);
});

test('8. calculateFunnelOrderTotal: supports Product object parameters in overloaded signature', () => {
  const result = calculateFunnelOrderTotal(
    mockProduct,
    { selected: true, price: mockBumpProduct.price },
    { selected: false, price: mockUpsellProduct.price }
  );
  assert.equal(result.subtotal, 50000);
  assert.equal(result.bumpAmount, 8500);
  assert.equal(result.upsellAmount, 0);
  assert.equal(result.total, 58500);
});

test('9. buildFunnelCheckoutPayload: builds complete checkout payload including bump and upsell order items', () => {
  const user = { id: 'user-buyer-1', name: 'Alex Rivera', email: 'alex@example.com' };
  const { orderId, order, payload } = buildFunnelCheckoutPayload({
    funnel: mockFunnel,
    mainProduct: mockProduct,
    orderBumpProduct: mockBumpProduct,
    orderBumpSelected: true,
    upsellProduct: mockUpsellProduct,
    upsellSelected: true,
    user,
    options: {
      paymentMethod: 'paystack',
      paystackVerified: true,
      paymentReference: 'PST_REF_12345',
      affiliateCode: 'VIPREF',
    },
  });

  assert.match(orderId, /^ORD-FNL-/);
  assert.equal(order.items.length, 3);
  assert.equal(order.items[0].productId, 'prod-main-1');
  assert.equal(order.items[0].price, 45000); // from funnel price override
  assert.equal(order.items[1].productId, 'prod-bump-1');
  assert.equal(order.items[1].price, 6500); // from funnel orderBump price
  assert.equal(order.items[2].productId, 'prod-upsell-1');
  assert.equal(order.items[2].price, 30000); // from funnel upsell price
  assert.equal(order.total, 81500);
  assert.equal(order.status, 'completed');
  assert.equal(order.affiliateCode, 'VIPREF');

  assert.equal(payload.total, 81500);
  assert.equal(payload.customer.email, 'alex@example.com');
  assert.equal(payload.items.length, 3);
});

test('10. buildFunnelCheckoutPayload: builds checkout payload with main offer only when addons are declined', () => {
  const user = { id: 'user-buyer-2', name: 'Sam Taylor', email: 'sam@example.com' };
  const { order, payload } = buildFunnelCheckoutPayload({
    funnel: mockFunnel,
    mainProduct: mockProduct,
    orderBumpProduct: mockBumpProduct,
    orderBumpSelected: false,
    upsellProduct: mockUpsellProduct,
    upsellSelected: false,
    user,
  });

  assert.equal(order.items.length, 1);
  assert.equal(order.items[0].productId, 'prod-main-1');
  assert.equal(order.total, 45000);
  assert.equal(payload.bumpAmount, 0);
  assert.equal(payload.upsellAmount, 0);
  assert.equal(payload.total, 45000);
});

test('11. buildFunnelCheckoutPayload: assigns correct initial order status based on payment method and verification', () => {
  const user = { id: 'user-3', name: 'Chris Doe', email: 'chris@example.com' };

  // Manual GTB bank transfer -> always pending
  const gtbResult = buildFunnelCheckoutPayload({
    funnel: mockFunnel,
    mainProduct: mockProduct,
    orderBumpSelected: false,
    upsellSelected: false,
    user,
    options: { paymentMethod: 'gtb_whatsapp', paystackVerified: true },
  });
  assert.equal(gtbResult.order.status, 'pending');

  // Unverified Paystack -> pending
  const paystackUnverified = buildFunnelCheckoutPayload({
    funnel: mockFunnel,
    mainProduct: mockProduct,
    orderBumpSelected: false,
    upsellSelected: false,
    user,
    options: { paymentMethod: 'paystack', paystackVerified: false },
  });
  assert.equal(paystackUnverified.order.status, 'pending');

  // Verified Paystack -> completed
  const paystackVerified = buildFunnelCheckoutPayload({
    funnel: mockFunnel,
    mainProduct: mockProduct,
    orderBumpSelected: false,
    upsellSelected: false,
    user,
    options: { paymentMethod: 'paystack', paystackVerified: true },
  });
  assert.equal(paystackVerified.order.status, 'completed');
});

test('12. getFunnelBySlug: retrieves active funnel by exact or case-insensitive slug', () => {
  const funnels = [mockFunnel];
  const found = getFunnelBySlug(funnels, 'ai-saas-accelerator');
  assert.ok(found);
  assert.equal(found?.id, 'fnl-ai-saas');

  const foundUpper = getFunnelBySlug(funnels, 'AI-SAAS-ACCELERATOR');
  assert.ok(foundUpper);
  assert.equal(foundUpper?.id, 'fnl-ai-saas');
});

test('13. getFunnelBySlug: returns undefined for non-existent or inactive funnel slugs', () => {
  const funnels: SalesFunnelConfig[] = [
    mockFunnel,
    { ...mockFunnel, id: 'fnl-inactive', slug: 'inactive-funnel', active: false },
  ];
  assert.equal(getFunnelBySlug(funnels, 'non-existent'), undefined);
  assert.equal(getFunnelBySlug(funnels, 'inactive-funnel'), undefined);
});

test('14. interpolatePromptTemplate: replaces all variables when complete dictionary is provided', () => {
  const template = 'Act as {{role}} in {{domain}}. Produce {{output_format}}.';
  const variables = {
    role: 'Principal Architect',
    domain: 'Fintech distributed systems',
    output_format: 'an RFC specification document',
  };

  const result = interpolatePromptTemplate(template, variables);
  assert.equal(
    result.prompt,
    'Act as Principal Architect in Fintech distributed systems. Produce an RFC specification document.'
  );
  assert.equal(result.isComplete, true);
  assert.deepEqual(result.missingVariables, []);
});

test('15. interpolatePromptTemplate: reports missing variables and preserves placeholders in incomplete templates', () => {
  const template = 'Write a {{tone}} email to {{audience}} pitching {{product}}.';
  const variables = {
    tone: 'persuasive',
    // audience is omitted
    product: '', // empty string counts as missing
  };

  const result = interpolatePromptVariables(template, variables);
  assert.equal(result.prompt, 'Write a persuasive email to {{audience}} pitching {{product}}.');
  assert.equal(result.isComplete, false);
  assert.deepEqual(result.missingVariables, ['audience', 'product']);
});

test('16. interpolatePromptTemplate: trims excessive whitespace from variable values', () => {
  const template = 'Target industry: {{industry}}. Tone: {{tone}}.';
  const variables = {
    industry: '   Healthcare SaaS   ',
    tone: '  Authoritative and Empathetic   ',
  };

  const result = interpolatePromptTemplate(template, variables);
  assert.equal(result.prompt, 'Target industry: Healthcare SaaS. Tone: Authoritative and Empathetic.');
  assert.equal(result.isComplete, true);
});

test('17. extractPromptVariables: extracts list of unique variable keys from template string', () => {
  const template =
    '{{role}} must analyze {{system}} for {{target_kpi}}. If {{system}} fails, notify {{role}}.';
  const vars = extractPromptVariables(template);
  assert.deepEqual(vars, ['role', 'system', 'target_kpi']);
});

test('18. isPromptVaultAccessible: allows active membership; rejects null, cancelled, or pending memberships (1-arg)', () => {
  const activeMembership: UserMembership = {
    id: 'm1',
    userId: 'u1',
    planId: 'paid',
    billingCycle: 'monthly',
    status: 'active',
    startedAt: '2026-01-01',
    renewsAt: '2026-12-31',
  };

  const cancelledMembership: UserMembership = {
    ...activeMembership,
    status: 'cancelled',
  };

  const pendingMembership: UserMembership = {
    ...activeMembership,
    status: 'pending',
  };

  assert.deepEqual(isPromptVaultAccessible(activeMembership), { accessible: true });

  const nullResult = isPromptVaultAccessible(null);
  assert.equal(nullResult.accessible, false);
  assert.equal(nullResult.reason, 'Active membership required for Prompt Vault access');

  const cancelledResult = isPromptVaultAccessible(cancelledMembership);
  assert.equal(cancelledResult.accessible, false);
  assert.equal(
    cancelledResult.reason,
    'Membership is currently cancelled. Reactivate to access Prompt Vault.'
  );

  const pendingResult = isPromptVaultAccessible(pendingMembership);
  assert.equal(pendingResult.accessible, false);
  assert.equal(
    pendingResult.reason,
    'Membership is currently pending. Reactivate to access Prompt Vault.'
  );
});

test('19. isPromptVaultAccessible: enforces authenticated user and active membership (2-arg form)', () => {
  const user: UserAccount = {
    id: 'u-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'hashed-password',
    role: 'customer',
    joinedAt: '2026-01-01',
  };

  const membership: UserMembership = {
    id: 'm-1',
    userId: 'u-1',
    planId: 'paid',
    billingCycle: 'annual',
    status: 'active',
    startedAt: '2026-01-01',
    renewsAt: '2027-01-01',
  };

  assert.deepEqual(isPromptVaultAccessible(user, membership), { accessible: true });

  const noUserResult = isPromptVaultAccessible(null, membership);
  assert.equal(noUserResult.accessible, false);
  assert.equal(noUserResult.reason, 'Please sign in to access the Member Prompt Vault.');

  const noMembershipResult = isPromptVaultAccessible(user, null);
  assert.equal(noMembershipResult.accessible, false);
  assert.equal(noMembershipResult.reason, 'Active membership required for Prompt Vault access');
});

test('20. filterPromptVault: filters prompt vault items by category and query, prioritizing featured items', () => {
  const prompts: PromptVaultItem[] = [
    {
      id: 'p-1',
      slug: 'b2b-cold-email',
      title: 'B2B Cold Outreach Sequence',
      description: 'High converting cold email for enterprise buyers',
      category: 'Copywriting & Marketing',
      tags: ['Email', 'Outreach', 'B2B'],
      template: 'Write a cold email to {{lead_name}} at {{company}}...',
      variables: [],
      isFeatured: false,
      createdAt: '2026-01-01',
    },
    {
      id: 'p-2',
      slug: 'fullstack-spec-prompt',
      title: 'Architecture Specification Generator',
      description: 'Generates end-to-end architecture RFC for engineering teams',
      category: 'AI Engineering & Coding',
      tags: ['Architecture', 'RFC', 'Engineering'],
      template: 'Draft an RFC for {{system_name}}...',
      variables: [],
      isFeatured: true,
      createdAt: '2026-01-02',
    },
    {
      id: 'p-3',
      slug: 'landing-page-pas',
      title: 'Action-Oriented Landing Page Hero Copy',
      description: 'PAS formula landing page headline and subheadline generator',
      category: 'Copywriting & Marketing',
      tags: ['Landing Page', 'Copywriting', 'Conversion'],
      template: 'Write a landing page hero for {{product}}...',
      variables: [],
      isFeatured: true,
      createdAt: '2026-01-03',
    },
  ];

  // Category filter
  const copywritingOnly = filterPromptVault(prompts, { category: 'Copywriting & Marketing' });
  assert.equal(copywritingOnly.length, 2);
  assert.equal(copywritingOnly[0].id, 'p-3'); // isFeatured first
  assert.equal(copywritingOnly[1].id, 'p-1');

  // Query filter
  const rfcSearch = filterPromptVault(prompts, { query: 'RFC' });
  assert.equal(rfcSearch.length, 1);
  assert.equal(rfcSearch[0].id, 'p-2');

  // 'All' category returns all items with featured first
  const allPrompts = filterPromptVault(prompts, { category: 'All' });
  assert.equal(allPrompts.length, 3);
  assert.ok(allPrompts[0].isFeatured);
  assert.ok(allPrompts[1].isFeatured);
  assert.ok(!allPrompts[2].isFeatured);
});

test('21. interpolatePromptTemplate: safely handles prototype property collisions without throwing', () => {
  const template = 'Prototype collision: {{toString}} and {{valueOf}} and {{hasOwnProperty}}.';
  const result = interpolatePromptTemplate(template, {});

  assert.equal(result.isComplete, false);
  assert.equal(result.prompt, 'Prototype collision: {{toString}} and {{valueOf}} and {{hasOwnProperty}}.');
  assert.deepEqual(result.missingVariables, ['toString', 'valueOf', 'hasOwnProperty']);

  // When own property is explicitly defined on the dictionary
  const resolvedResult = interpolatePromptTemplate(template, {
    toString: 'custom_to_string',
    valueOf: 'custom_value_of',
    hasOwnProperty: 'custom_has_own',
  });
  assert.equal(resolvedResult.isComplete, true);
  assert.equal(resolvedResult.prompt, 'Prototype collision: custom_to_string and custom_value_of and custom_has_own.');
  assert.deepEqual(resolvedResult.missingVariables, []);
});

test('22. interpolatePromptTemplate: converts non-string values and handles null/undefined templates safely', () => {
  // Non-string values (numbers, booleans)
  const template = 'Batch of {{count}} items. Live status: {{active}}.';
  const result = interpolatePromptTemplate(template, {
    count: 42 as any,
    active: true as any,
  });
  assert.equal(result.isComplete, true);
  assert.equal(result.prompt, 'Batch of 42 items. Live status: true.');

  // Null and undefined template
  const nullResult = interpolatePromptTemplate(null, {});
  assert.equal(nullResult.prompt, '');
  assert.equal(nullResult.isComplete, true);
  assert.deepEqual(nullResult.missingVariables, []);

  const undefResult = interpolatePromptTemplate(undefined, {});
  assert.equal(undefResult.prompt, '');
  assert.equal(undefResult.isComplete, true);

  // Undefined variables object
  const noVarsResult = interpolatePromptTemplate('Hello {{name}}', undefined as any);
  assert.equal(noVarsResult.prompt, 'Hello {{name}}');
  assert.equal(noVarsResult.isComplete, false);
  assert.deepEqual(noVarsResult.missingVariables, ['name']);

  // extractPromptVariables with null/undefined
  assert.deepEqual(extractPromptVariables(null), []);
  assert.deepEqual(extractPromptVariables(undefined), []);
});

test('23. calculateFunnelOrderTotal: applies discount percentage when upsell is boolean false or unselected', () => {
  // Bug reported by challenger: bump object, upsell false, discount 10%
  const result = calculateFunnelOrderTotal(10000, { selected: true, price: 2000 }, false, 10);
  assert.equal(result.subtotal, 10000);
  assert.equal(result.bumpAmount, 2000);
  assert.equal(result.upsellAmount, 0);
  assert.equal(result.discount, 1200);
  assert.equal(result.total, 10800);

  // Both bump and upsell false with discount
  const mainOnlyDiscount = calculateFunnelOrderTotal(10000, false, false, 20);
  assert.equal(mainOnlyDiscount.subtotal, 10000);
  assert.equal(mainOnlyDiscount.bumpAmount, 0);
  assert.equal(mainOnlyDiscount.upsellAmount, 0);
  assert.equal(mainOnlyDiscount.discount, 2000);
  assert.equal(mainOnlyDiscount.total, 8000);

  // Overloaded with Product object and upsell false with discount
  const productDiscount = calculateFunnelOrderTotal(mockProduct, { selected: true, price: 5000 }, false, 10);
  assert.equal(productDiscount.subtotal, 50000);
  assert.equal(productDiscount.bumpAmount, 5000);
  assert.equal(productDiscount.upsellAmount, 0);
  assert.equal(productDiscount.discount, 5500);
  assert.equal(productDiscount.total, 49500);
});

test('24. filterPromptVault: defensively handles items with undefined tags or missing fields without throwing', () => {
  const itemWithoutTags: any = {
    id: 'p-no-tags',
    title: 'Prompt Without Tags',
    description: 'Defensive test prompt',
    template: 'Test {{var}}',
    category: 'Productivity',
  };

  // Searching when item has no tags property
  const searchResult = filterPromptVault([itemWithoutTags], { query: 'test' });
  assert.equal(searchResult.length, 1);
  assert.equal(searchResult[0].id, 'p-no-tags');

  // Query mismatch
  const noMatch = filterPromptVault([itemWithoutTags], { query: 'nonexistent-query' });
  assert.equal(noMatch.length, 0);

  // Null or empty inputs
  assert.deepEqual(filterPromptVault(null as any), []);
  assert.deepEqual(filterPromptVault(undefined as any), []);
});
