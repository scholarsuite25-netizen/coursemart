/**
 * Shared KV-sync policies for the Coursemart state store.
 *
 * The Supabase-backed `/api/store` routes and the client-side hydration layer
 * both rely on these pure helpers so that:
 *  - writes are scoped by session role (anonymous / user / instructor / admin),
 *  - reads are scoped the same way (PII is never served to anonymous callers),
 *  - merges are idempotent (upsert by id) with append-only rules where
 *    anonymous writers must never modify or wipe existing records.
 */

export interface WriteCtx {
  isAdmin: boolean;
  /** User-session role when present: 'customer' | 'instructor' | 'admin' */
  role: string | null;
  selfUserId?: string;
}

export interface ReadCtx {
  isAdmin: boolean;
  selfUserId?: string;
  selfEmail?: string;
}

export interface MergeResultOk {
  ok: true;
  value: unknown;
  added: number;
  skippedDuplicates: number;
  rejected: number;
}

export interface MergeResultErr {
  ok: false;
  status: number;
  error: string;
}

export type MergeResult = MergeResultOk | MergeResultErr;

export const MAX_COLLECTION_ITEMS = 20_000;
const MAX_ANON_REGISTRATION_ADDITIONS = 100;

/** Keys any visitor may read (catalog & public content). */
export const PUBLIC_READ_KEYS = new Set([
  'products',
  'coupons',
  'appearance',
  'events',
  'blog_posts',
  'whatsapp_groups',
  'showcase_sites',
  'membership_plans',
  'reviews',
  'event_registrations',
]);

/** Keys only an admin session may read. */
export const ADMIN_READ_KEYS = new Set(['social_drafts', 'email_campaigns']);

/** Keys only an admin session may write. */
export const ADMIN_WRITE_KEYS = new Set([
  'events',
  'coupons',
  'appearance',
  'whatsapp_groups',
  'showcase_sites',
  'membership_plans',
  'social_drafts',
  'email_campaigns',
  'blog_posts',
]);

/** Personal array keys: session-scoped, owner-filtered (admin sees/writes all). */
const PERSONAL_ARRAY_KEYS = new Set([
  'orders',
  'licenses',
  'user_memberships',
  'affiliates',
  'affiliate_conversions',
  'affiliate_payouts',
  'reviews',
]);

function ownerOf(key: string, item: unknown): string | null {
  if (!item || typeof item !== 'object') return null;
  const rec = item as Record<string, unknown>;
  if (key === 'affiliate_conversions' || key === 'affiliate_payouts') {
    return typeof rec.affiliateUserId === 'string' ? rec.affiliateUserId : null;
  }
  return typeof rec.userId === 'string' ? rec.userId : null;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function err(status: number, error: string): MergeResultErr {
  return { ok: false, status, error };
}

function ok(
  value: unknown,
  added: number,
  skippedDuplicates = 0,
  rejected = 0
): MergeResultOk {
  return { ok: true, value, added, skippedDuplicates, rejected };
}

export function mergeByKey<T>(
  existing: T[],
  incoming: T[],
  keyOf: (item: T) => string
): { value: T[]; added: number } {
  const incomingByKey = new Map<string, T>();
  for (const item of incoming) {
    incomingByKey.set(keyOf(item), item);
  }
  const existingKeys = new Set(existing.map(keyOf));
  const updated = existing.map((item) => incomingByKey.get(keyOf(item)) ?? item);
  const additions = incoming.filter((item) => !existingKeys.has(keyOf(item)));
  return { value: [...updated, ...additions], added: additions.length };
}

export interface MergeByIdOptions {
  /** Require a non-empty string id; invalid incoming records are dropped. */
  requireId?: boolean;
}

export function mergeById<T extends { id?: string }>(
  existing: T[],
  incoming: T[],
  options: MergeByIdOptions = { requireId: true }
): { value: T[]; added: number; rejected: number } {
  const requireId = options.requireId !== false;
  let rejected = 0;
  const usable = incoming.filter((item) => {
    if (requireId && !isNonEmptyString(item?.id)) {
      rejected += 1;
      return false;
    }
    return true;
  });
  const { value, added } = mergeByKey(existing, usable, (item) => item.id as string);
  return { value, added, rejected };
}

function mergeUsers(
  existing: unknown[],
  incoming: unknown[],
  ctx: WriteCtx
): MergeResult {
  const existingUsers = existing.filter(
    (u): u is Record<string, unknown> => Boolean(u) && typeof u === 'object' && isNonEmptyString((u as Record<string, unknown>).id)
  );
  const byId = new Map(existingUsers.map((u) => [u.id as string, u]));
  const merged = new Map<string, Record<string, unknown>>();
  for (const u of existingUsers) {
    merged.set(u.id as string, u);
  }

  let added = 0;
  let rejected = 0;
  let updated = 0;

  for (const raw of incoming) {
    if (!raw || typeof raw !== 'object' || !isNonEmptyString((raw as Record<string, unknown>).id)) {
      rejected += 1;
      continue;
    }
    const rec = { ...(raw as Record<string, unknown>) };
    const id = rec.id as string;
    const prev = byId.get(id);
    const password = typeof rec.password === 'string' ? rec.password : '';

    if (!prev) {
      // Never introduce accounts that cannot be authenticated server-side.
      if (!password) {
        rejected += 1;
        continue;
      }
      merged.set(id, rec);
      added += 1;
      continue;
    }

    const isSelf = Boolean(ctx.selfUserId) && id === ctx.selfUserId;
    const mayUpdate = ctx.isAdmin || isSelf;
    if (!mayUpdate) {
      // Anonymous/other writers may add accounts but never modify existing ones.
      continue;
    }
    if (!password && typeof prev.password === 'string' && prev.password) {
      rec.password = prev.password; // never blank out an existing credential
    }
    merged.set(id, rec);
    updated += 1;
  }

  const value = Array.from(merged.values());
  if (value.length > MAX_COLLECTION_ITEMS) {
    return err(409, `Store key "users" exceeds the ${MAX_COLLECTION_ITEMS} item cap.`);
  }
  return ok(value, added, 0, rejected);
}

const EVENT_REGISTRATION_CONTACT_FIELDS = [
  'fullName',
  'email',
  'phone',
  'organization',
  'roleTitle',
  'learningGoals',
  'newsletterOptIn',
  'confirmationCode',
] as const;

export function sanitizeEventRegistrations(value: unknown): unknown[] {
  const list = Array.isArray(value) ? value : [];
  return list.map((raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const rec = { ...(raw as Record<string, unknown>) };
    for (const field of EVENT_REGISTRATION_CONTACT_FIELDS) {
      delete rec[field];
    }
    return rec;
  });
}

function isValidRegistrationShape(raw: unknown): raw is Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return false;
  const rec = raw as Record<string, unknown>;
  return (
    isNonEmptyString(rec.id) &&
    isNonEmptyString(rec.eventId) &&
    isNonEmptyString(rec.email) &&
    isNonEmptyString(rec.fullName)
  );
}

function mergeEventRegistrations(
  existing: unknown[],
  incoming: unknown[],
  ctx: WriteCtx
): MergeResult {
  if (ctx.isAdmin) {
    if (incoming.length > MAX_COLLECTION_ITEMS) {
      return err(409, `Store key "event_registrations" exceeds the ${MAX_COLLECTION_ITEMS} item cap.`);
    }
    return ok(incoming, 0);
  }

  // Anonymous & signed-in writers: append-only. Existing records can never be
  // modified or wiped by a partial collection overwrite (P4 fix).
  const existingIds = new Set(
    existing
      .filter(isValidRegistrationShape)
      .map((r) => r.id as string)
  );
  const existingEmailByEvent = new Map<string, Set<string>>();
  for (const r of existing.filter(isValidRegistrationShape)) {
    const eventId = r.eventId as string;
    const email = (r.email as string).trim().toLowerCase();
    if (!existingEmailByEvent.has(eventId)) existingEmailByEvent.set(eventId, new Set());
    existingEmailByEvent.get(eventId)!.add(email);
  }

  let added = 0;
  let skippedDuplicates = 0;
  let rejected = 0;
  const additions: unknown[] = [];

  for (const raw of incoming) {
    if (!isValidRegistrationShape(raw)) {
      rejected += 1;
      continue;
    }
    const id = raw.id as string;
    if (existingIds.has(id)) continue; // idempotent re-push of an existing record
    const eventId = raw.eventId as string;
    const email = (raw.email as string).trim().toLowerCase();
    const emailsForEvent = existingEmailByEvent.get(eventId) ?? new Set<string>();
    if (emailsForEvent.has(email)) {
      skippedDuplicates += 1;
      continue;
    }
    if (additions.length >= MAX_ANON_REGISTRATION_ADDITIONS) {
      rejected += 1;
      continue;
    }
    emailsForEvent.add(email);
    existingEmailByEvent.set(eventId, emailsForEvent);
    existingIds.add(id);
    additions.push({ ...(raw as Record<string, unknown>), email });
    added += 1;
  }

  const value = [...existing, ...additions];
  if (value.length > MAX_COLLECTION_ITEMS) {
    return err(409, `Store key "event_registrations" exceeds the ${MAX_COLLECTION_ITEMS} item cap.`);
  }
  return ok(value, added, skippedDuplicates, rejected);
}

function mergeBlogBookmarks(existing: unknown, incoming: unknown, ctx: WriteCtx): MergeResult {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return err(400, 'blog_bookmarks must be an object of userId -> postIds.');
  }
  const incomingMap = incoming as Record<string, unknown>;
  if (ctx.isAdmin) {
    return ok(incomingMap, 0);
  }
  if (!ctx.selfUserId) {
    return err(401, 'Sign-in session required to update saved articles.');
  }
  const existingMap =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const own = Array.isArray(incomingMap[ctx.selfUserId]) ? incomingMap[ctx.selfUserId] : existingMap[ctx.selfUserId];
  return ok({ ...existingMap, [ctx.selfUserId]: own ?? [] }, 0);
}

function mergeProgress(existing: unknown[], incoming: unknown[], ctx: WriteCtx): MergeResult {
  const keyOf = (item: Record<string, unknown>) =>
    `${String(item.userId)}::${String(item.productId)}`;
  const validIncoming = incoming.filter(
    (i): i is Record<string, unknown> =>
      Boolean(i) && typeof i === 'object' && isNonEmptyString((i as Record<string, unknown>).userId) && isNonEmptyString((i as Record<string, unknown>).productId)
  );
  if (!ctx.isAdmin) {
    if (!ctx.selfUserId) {
      return err(401, 'Sign-in session required to sync course progress.');
    }
    const own = validIncoming.filter((i) => i.userId === ctx.selfUserId);
    const { value, added } = mergeByKey(existing as Record<string, unknown>[], own, keyOf);
    if (value.length > MAX_COLLECTION_ITEMS) {
      return err(409, `Store key "progress" exceeds the ${MAX_COLLECTION_ITEMS} item cap.`);
    }
    return ok(value, added, 0, incoming.length - validIncoming.length);
  }
  const { value, added } = mergeByKey(existing as Record<string, unknown>[], validIncoming, keyOf);
  if (value.length > MAX_COLLECTION_ITEMS) {
    return err(409, `Store key "progress" exceeds the ${MAX_COLLECTION_ITEMS} item cap.`);
  }
  return ok(value, added, 0, incoming.length - validIncoming.length);
}

function mergeProducts(existing: unknown[], incoming: unknown[], ctx: WriteCtx): MergeResult {
  const cleaned = incoming.filter(
    (p): p is Record<string, unknown> =>
      Boolean(p) && typeof p === 'object' && isNonEmptyString((p as Record<string, unknown>).id)
  );
  if (ctx.isAdmin) {
    if (cleaned.length > MAX_COLLECTION_ITEMS) {
      return err(409, `Store key "products" exceeds the ${MAX_COLLECTION_ITEMS} item cap.`);
    }
    // Admin's collection is authoritative (propagates deletions).
    return ok(cleaned, 0, 0, incoming.length - cleaned.length);
  }
  if (ctx.role === 'instructor' && ctx.selfUserId) {
    const own = cleaned.filter((p) => p.instructorId === ctx.selfUserId);
    const { value, added, rejected } = mergeById(existing as Array<{ id?: string }>, own);
    if (value.length > MAX_COLLECTION_ITEMS) {
      return err(409, `Store key "products" exceeds the ${MAX_COLLECTION_ITEMS} item cap.`);
    }
    return ok(value, added, 0, rejected + (incoming.length - cleaned.length));
  }
  return err(403, 'Instructor or administrator session required to update products.');
}

/**
 * Merge an incoming value for `key` against the stored value under `ctx`.
 * Returns the persisted value or a status/error the route should return.
 */
export function mergeStoreValue(
  key: string,
  existing: unknown,
  incoming: unknown,
  ctx: WriteCtx
): MergeResult {
  if (incoming === undefined || incoming === null) {
    return err(400, 'A "value" payload is required.');
  }

  if (key === 'event_registrations') {
    if (!Array.isArray(incoming)) return err(400, 'event_registrations must be an array.');
    const existingArr = Array.isArray(existing) ? existing : [];
    return mergeEventRegistrations(existingArr, incoming, ctx);
  }

  if (key === 'users') {
    if (!Array.isArray(incoming)) return err(400, 'users must be an array.');
    const existingArr = Array.isArray(existing) ? existing : [];
    return mergeUsers(existingArr, incoming, ctx);
  }

  if (key === 'blog_bookmarks') {
    return mergeBlogBookmarks(existing, incoming, ctx);
  }

  if (key === 'progress') {
    if (!Array.isArray(incoming)) return err(400, 'progress must be an array.');
    const existingArr = Array.isArray(existing) ? existing : [];
    return mergeProgress(existingArr, incoming, ctx);
  }

  if (key === 'products') {
    if (!Array.isArray(incoming)) return err(400, 'products must be an array.');
    const existingArr = Array.isArray(existing) ? existing : [];
    return mergeProducts(existingArr, incoming, ctx);
  }

  if (ADMIN_WRITE_KEYS.has(key)) {
    if (!ctx.isAdmin) {
      return err(403, 'Administrator session required for this store key.');
    }
    if (Array.isArray(incoming) && incoming.length > MAX_COLLECTION_ITEMS) {
      return err(409, `Store key "${key}" exceeds the ${MAX_COLLECTION_ITEMS} item cap.`);
    }
    return ok(incoming, 0);
  }

  if (PERSONAL_ARRAY_KEYS.has(key)) {
    if (!Array.isArray(incoming)) return err(400, `"${key}" must be an array.`);
    if (!ctx.isAdmin && !ctx.selfUserId) {
      return err(401, 'Sign-in session required to sync this data.');
    }
    const existingArr = Array.isArray(existing) ? existing : [];
    let allowed = incoming;
    if (!ctx.isAdmin) {
      allowed = incoming.filter((item) => ownerOf(key, item) === ctx.selfUserId);
    }
    const { value, added, rejected } = mergeById(existingArr, allowed);
    if (value.length > MAX_COLLECTION_ITEMS) {
      return err(409, `Store key "${key}" exceeds the ${MAX_COLLECTION_ITEMS} item cap.`);
    }
    return ok(value, added, 0, rejected + (incoming.length - allowed.length));
  }

  return err(400, `Unsupported store key "${key}".`);
}

/**
 * Filter a stored value for reading under `ctx`.
 * Returns `null` when the caller may not read the key at all.
 */
export function filterStoreValueForRead(
  key: string,
  value: unknown,
  ctx: ReadCtx
): unknown | null {
  if (ADMIN_READ_KEYS.has(key)) {
    return ctx.isAdmin ? value : null;
  }

  if (PUBLIC_READ_KEYS.has(key)) {
    if (key === 'event_registrations' && !ctx.isAdmin) {
      // Attendee contact details are admin-only; everyone else gets a
      // capacity-safe, PII-stripped view (server enforces duplicate emails).
      return sanitizeEventRegistrations(value);
    }
    return value;
  }

  if (key === 'users') {
    if (ctx.isAdmin) return value;
    if (!ctx.selfUserId || !Array.isArray(value)) return null;
    // A signed-in user may read only their own account record.
    return value.filter(
      (u) =>
        Boolean(u) &&
        typeof u === 'object' &&
        (u as Record<string, unknown>).id === ctx.selfUserId
    );
  }

  if (key === 'blog_bookmarks') {
    if (ctx.isAdmin) return value;
    if (!ctx.selfUserId || !value || typeof value !== 'object' || Array.isArray(value)) return null;
    const map = value as Record<string, unknown>;
    return { [ctx.selfUserId]: map[ctx.selfUserId] ?? [] };
  }

  if (key === 'progress') {
    if (ctx.isAdmin) return value;
    if (!ctx.selfUserId || !Array.isArray(value)) return null;
    return value.filter((item) => ownerOf(key, item) === ctx.selfUserId);
  }

  if (PERSONAL_ARRAY_KEYS.has(key)) {
    if (ctx.isAdmin) return value;
    if (!ctx.selfUserId || !Array.isArray(value)) return null;
    return value.filter((item) => ownerOf(key, item) === ctx.selfUserId);
  }

  return null;
}
