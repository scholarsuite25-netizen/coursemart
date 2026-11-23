import type {
  FunnelCheckoutPayload,
  FunnelOrderTotals,
  MembershipTierId,
  Order,
  OrderItem,
  PaymentMethod,
  Product,
  PromptInterpolationResult,
  PromptVaultAccessResult,
  PromptVaultItem,
  SalesFunnelConfig,
  UserAccount,
  UserMembership,
} from '../types/marketplace';
import { roundCurrency, migrateLegacyTier } from './commerce.ts';
import { resolveInitialOrderStatus } from './automation.ts';

// ==========================================
// Sales Funnel Calculations
// ==========================================

export function calculateFunnelOrderTotal(
  mainOfferPrice: number,
  bumpSelected: boolean,
  bumpPrice: number,
  upsellSelected?: boolean,
  upsellPrice?: number
): FunnelOrderTotals;

export function calculateFunnelOrderTotal(
  mainProduct: Product | number,
  orderBumpSelected?: boolean | { selected: boolean; price: number },
  upsellSelected?: boolean | { selected: boolean; price: number } | number,
  discountPercent?: number
): FunnelOrderTotals;

export function calculateFunnelOrderTotal(
  main: Product | number,
  bump: boolean | { selected: boolean; price: number } = false,
  bumpOrUpsell: boolean | { selected: boolean; price: number } | number = false,
  upsellOrDiscount: boolean | number = false,
  maybeUpsellPrice: number = 0
): FunnelOrderTotals {
  // Main price resolution
  let safeMain = 0;
  if (typeof main === 'object' && main !== null) {
    safeMain = Math.max(0, Number(main.price) || 0);
  } else if (typeof main === 'number') {
    safeMain = Math.max(0, main);
  }

  let safeBump = 0;
  let safeUpsell = 0;
  let discountPercent = 0;

  // Detect signature 1: (mainPrice: number, bumpSelected: boolean, bumpPrice: number, upsellSelected?: boolean, upsellPrice?: number)
  if (
    typeof bump === 'boolean' &&
    typeof bumpOrUpsell === 'number' &&
    typeof upsellOrDiscount !== 'number'
  ) {
    safeBump = bump ? Math.max(0, bumpOrUpsell) : 0;
    const upsellSelected = Boolean(upsellOrDiscount);
    safeUpsell = upsellSelected ? Math.max(0, maybeUpsellPrice) : 0;
  } else {
    // Signature 2 with objects or discount
    // Order bump
    if (typeof bump === 'object' && bump !== null) {
      safeBump = bump.selected ? Math.max(0, Number(bump.price) || 0) : 0;
    } else if (typeof bump === 'boolean' && typeof bumpOrUpsell === 'number') {
      safeBump = bump ? Math.max(0, bumpOrUpsell) : 0;
    }

    // Upsell
    if (typeof bumpOrUpsell === 'object' && bumpOrUpsell !== null) {
      safeUpsell = bumpOrUpsell.selected ? Math.max(0, Number(bumpOrUpsell.price) || 0) : 0;
    } else if (
      typeof bumpOrUpsell === 'boolean' &&
      typeof upsellOrDiscount === 'number' &&
      typeof maybeUpsellPrice === 'number' &&
      maybeUpsellPrice > 0
    ) {
      // In case bumpOrUpsell is boolean upsellSelected and upsellOrDiscount is upsellPrice
      safeUpsell = bumpOrUpsell ? Math.max(0, upsellOrDiscount) : 0;
    }

    // Discount percentage
    if (typeof upsellOrDiscount === 'number') {
      discountPercent = upsellOrDiscount;
    }
  }

  const subtotal = roundCurrency(safeMain);
  const bumpAmount = roundCurrency(safeBump);
  const upsellAmount = roundCurrency(safeUpsell);
  const gross = roundCurrency(subtotal + bumpAmount + upsellAmount);

  if (discountPercent > 0) {
    const clampedDiscountRate = Math.min(100, Math.max(0, discountPercent)) / 100;
    const discount = roundCurrency(gross * clampedDiscountRate);
    const total = roundCurrency(Math.max(0, gross - discount));
    return {
      subtotal,
      bumpAmount,
      upsellAmount,
      discount,
      total,
    };
  }

  return {
    subtotal,
    bumpAmount,
    upsellAmount,
    total: gross,
  };
}

export interface BuildFunnelCheckoutParams {
  funnel: SalesFunnelConfig;
  mainProduct: Product;
  orderBumpProduct?: Product | null;
  orderBumpSelected: boolean;
  upsellProduct?: Product | null;
  upsellSelected: boolean;
  user: { id: string; name: string; email: string };
  options?: {
    paymentMethod?: PaymentMethod;
    paymentReference?: string;
    senderName?: string;
    orderNotes?: string;
    affiliateCode?: string;
    discountPercent?: number;
    paystackVerified?: boolean;
  };
}

export function buildFunnelCheckoutPayload(params: BuildFunnelCheckoutParams): {
  orderId: string;
  order: Order;
  payload: FunnelCheckoutPayload;
} {
  const {
    funnel,
    mainProduct,
    orderBumpProduct,
    orderBumpSelected,
    upsellProduct,
    upsellSelected,
    user,
    options,
  } = params;

  const mainPrice =
    funnel.mainProductPrice !== undefined ? funnel.mainProductPrice : mainProduct.price;
  const bumpPrice = funnel.orderBump?.price ?? orderBumpProduct?.price ?? 0;
  const upsellPrice = funnel.upsell?.price ?? upsellProduct?.price ?? 0;

  const totals = options?.discountPercent
    ? calculateFunnelOrderTotal(
        mainPrice,
        { selected: orderBumpSelected, price: bumpPrice },
        { selected: upsellSelected, price: upsellPrice },
        options.discountPercent
      )
    : calculateFunnelOrderTotal(
        mainPrice,
        orderBumpSelected,
        bumpPrice,
        upsellSelected,
        upsellPrice
      );

  const items: OrderItem[] = [
    {
      productId: mainProduct.id,
      productTitle: mainProduct.title,
      productType: mainProduct.type,
      price: roundCurrency(Math.max(0, mainPrice)),
    },
  ];

  if (orderBumpSelected && totals.bumpAmount > 0) {
    items.push({
      productId: funnel.orderBump?.productId || orderBumpProduct?.id || `${funnel.id}-bump`,
      productTitle: funnel.orderBump?.title || orderBumpProduct?.title || 'Order Bump Addon',
      productType: orderBumpProduct?.type || 'ebook',
      price: totals.bumpAmount,
    });
  }

  if (upsellSelected && totals.upsellAmount > 0) {
    items.push({
      productId: funnel.upsell?.productId || upsellProduct?.id || `${funnel.id}-upsell`,
      productTitle: funnel.upsell?.title || upsellProduct?.title || 'VIP Upsell Offer',
      productType: upsellProduct?.type || 'course',
      price: totals.upsellAmount,
    });
  }

  const paymentMethod: PaymentMethod = options?.paymentMethod || 'card';
  const status = resolveInitialOrderStatus(paymentMethod, options?.paystackVerified);

  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderId = `ORD-FNL-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

  const payload: FunnelCheckoutPayload = {
    funnelId: funnel.id,
    funnelSlug: funnel.slug,
    items,
    subtotal: totals.subtotal,
    bumpAmount: totals.bumpAmount,
    upsellAmount: totals.upsellAmount,
    discount: totals.discount ?? 0,
    total: totals.total,
    customer: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    paymentMethod,
    paymentReference: options?.paymentReference,
    senderName: options?.senderName,
    orderNotes: options?.orderNotes,
    affiliateCode: options?.affiliateCode,
    status,
  };

  const order: Order = {
    id: orderId,
    userId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    items,
    subtotal: totals.subtotal,
    discount: totals.discount ?? 0,
    total: totals.total,
    status,
    paymentMethod,
    paymentReference: options?.paymentReference,
    senderName: options?.senderName,
    orderNotes: options?.orderNotes,
    affiliateCode: options?.affiliateCode,
    createdAt: new Date().toISOString(),
  };

  return { orderId, order, payload };
}

export function getFunnelBySlug(
  funnels: SalesFunnelConfig[],
  slug: string
): SalesFunnelConfig | undefined {
  if (!slug || !funnels || !Array.isArray(funnels)) return undefined;
  const cleanSlug = slug.trim().toLowerCase();
  return funnels.find(
    (f) => f.slug.trim().toLowerCase() === cleanSlug && f.active !== false
  );
}

// ==========================================
// Member Prompt Vault Logic
// ==========================================

export function interpolatePromptTemplate(
  template?: string | null,
  variables: Record<string, unknown> = {}
): PromptInterpolationResult {
  if (!template) {
    return {
      prompt: '',
      missingVariables: [],
      isComplete: true,
    };
  }

  const safeVars = variables && typeof variables === 'object' ? variables : {};
  const missing: string[] = [];
  const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;

  // Track all placeholders in template
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    const key = match[1];
    const hasProp = Object.prototype.hasOwnProperty.call(safeVars, key);
    if (!hasProp) {
      if (!missing.includes(key)) missing.push(key);
    } else {
      const val = (safeVars as Record<string, unknown>)[key];
      if (val === undefined || val === null || String(val).trim() === '') {
        if (!missing.includes(key)) missing.push(key);
      }
    }
  }

  const prompt = template.replace(regex, (_, key) => {
    const hasProp = Object.prototype.hasOwnProperty.call(safeVars, key);
    if (hasProp) {
      const val = (safeVars as Record<string, unknown>)[key];
      if (val !== undefined && val !== null) {
        const trimmed = String(val).trim();
        if (trimmed !== '') {
          return trimmed;
        }
      }
    }
    return `{{${key}}}`;
  });

  return {
    prompt,
    missingVariables: missing,
    isComplete: missing.length === 0,
  };
}

export const interpolatePromptVariables = interpolatePromptTemplate;

export function extractPromptVariables(template?: string | null): string[] {
  if (!template) return [];
  const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
  const vars: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    const key = match[1];
    if (!vars.includes(key)) {
      vars.push(key);
    }
  }
  return vars;
}

export function isPromptVaultAccessible(
  userOrMembership?: UserAccount | UserMembership | null,
  maybeMembership?: UserMembership | null
): PromptVaultAccessResult {
  // If 2 arguments were passed: (user, membership)
  if (arguments.length >= 2) {
    const user = userOrMembership as UserAccount | null | undefined;
    const membership = maybeMembership;
    if (!user) {
      return { accessible: false, reason: 'Please sign in to access the Member Prompt Vault.' };
    }
    if (!membership) {
      return { accessible: false, reason: 'Active membership required for Prompt Vault access' };
    }
    if (membership.status !== 'active') {
      return {
        accessible: false,
        reason: `Membership is currently ${membership.status}. Reactivate to access Prompt Vault.`,
      };
    }
    const tier = migrateLegacyTier(membership.planId);
    if (tier !== 'paid') {
      return {
        accessible: false,
        reason: 'Paid membership required for full Prompt Vault access',
      };
    }
    return { accessible: true };
  }

  // 1 argument passed: (membership)
  const membership = userOrMembership as UserMembership | null | undefined;
  if (!membership) {
    return { accessible: false, reason: 'Active membership required for Prompt Vault access' };
  }
  if (membership.status !== 'active') {
    return {
      accessible: false,
      reason: `Membership is currently ${membership.status}. Reactivate to access Prompt Vault.`,
    };
  }
  const tier = migrateLegacyTier(membership.planId);
  if (tier !== 'paid') {
    return {
      accessible: false,
      reason: 'Paid membership required for full Prompt Vault access',
    };
  }
  return { accessible: true };
}

export function filterPromptVault(
  prompts: PromptVaultItem[],
  options?: {
    query?: string;
    category?: string;
    tier?: MembershipTierId;
  }
): PromptVaultItem[] {
  if (!prompts || !Array.isArray(prompts)) return [];
  const query = options?.query?.trim().toLowerCase() || '';
  const category = options?.category?.trim() || '';

  return prompts
    .filter((item) => {
      if (!item) return false;

      // Category filter with alias normalization
      if (category && category !== 'All') {
        const normalizeCategory = (c: string): string => {
          const l = c.trim().toLowerCase();
          if (l.includes('vibe') || l.includes('coding') || l.includes('engineering')) return 'ai engineering & coding';
          if (l.includes('leadership') || l.includes('strategy') || l.includes('business')) return 'business & strategy';
          if (l.includes('social') || l.includes('content')) return 'content creation';
          if (l.includes('architecture') || l.includes('productivity')) return 'productivity';
          if (l.includes('lms') || l.includes('education')) return 'lms & education';
          return l;
        };

        const targetNorm = normalizeCategory(category);
        const itemNorm = normalizeCategory(item.category || '');

        const exactMatch = Boolean(item.category && item.category.toLowerCase() === category.toLowerCase());
        const aliasMatch = Boolean(targetNorm === itemNorm);

        if (!exactMatch && !aliasMatch) {
          return false;
        }
      }

      // Query filter
      if (query) {
        const titleMatch = Boolean(item.title && item.title.toLowerCase().includes(query));
        const descMatch = Boolean(item.description && item.description.toLowerCase().includes(query));
        const templateMatch = Boolean(item.template && item.template.toLowerCase().includes(query));
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const tagsMatch = tags.some(
          (tag) => typeof tag === 'string' && tag.toLowerCase().includes(query)
        );
        if (!titleMatch && !descMatch && !templateMatch && !tagsMatch) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // Featured first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      // Then alphabetically by title
      const titleA = a.title || '';
      const titleB = b.title || '';
      return titleA.localeCompare(titleB);
    });
}

export interface SynthesizeStandardPromptInput {
  idea: string;
  persona?: string;
  audience?: string;
  tone?: string;
  constraints?: string;
  outputFormat?: string;
}

/**
 * Standard Prompt Engineering Synthesizer (CO-STAR / CREATE framework).
 * Transforms vague requirements into a production-grade prompt with variable brackets.
 */
export function synthesizeStandardPrompt(input: SynthesizeStandardPromptInput): string {
  const role = input.persona?.trim() || 'Principal Domain Strategist & Master Execution Assistant';
  const task = (input.idea || '').trim();
  const audience = input.audience?.trim() || '{{target_audience}}';
  const tone = input.tone?.trim() || 'authoritative, structured, concise, and conversion-focused';
  const constraints = input.constraints?.trim() || 'Zero conversational filler, concrete actionable steps, strict verification checks';
  const format = input.outputFormat?.trim() || 'Structured Markdown with numbered sections, checklist, and key metrics';

  return `# ROLE & PERSONA
Act as an elite ${role} with 15+ years of verified production experience.

# PRIMARY OBJECTIVE
Execute the following directive with high precision:
"${task}"

# CONTEXT & TARGET AUDIENCE
- Target Audience: ${audience}
- Business Domain: {{business_domain}}
- Primary Value Proposition: {{primary_value_prop}}

# CONSTRAINTS & QUALITY GUARDRAILS
1. Communication Tone: ${tone}.
2. Quality Boundaries: ${constraints}.
3. Reusability: Strictly retain bracketed variable tokens {{variable_name}} for dynamic customization.
4. Completeness: Ensure all recommendations are immediately executable without ambiguity.

# STEP-BY-STEP WORKFLOW
1. Discovery & Analysis: Assess {{current_baseline}} against industry best practices.
2. Formulation: Construct a multi-tier solution addressing {{primary_pain_point}}.
3. Execution Blueprint: Detail concrete implementation steps, timelines, and deliverables.
4. Validation & Auditing: Provide a verification rubric to validate successful outcomes.

# OUTPUT FORMAT & DELIVERABLES
Deliver the final response in ${format}, concluding with a concrete action item and measurable KPI.`;
}
