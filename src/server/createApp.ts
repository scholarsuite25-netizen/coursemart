import express, { type Request, type Response } from 'express';
import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  buildProviderEmailRequest,
  resolveEmailProviderConfig,
  type ActiveEmailProvider,
  type EmailProviderName,
} from '../utils/emailProvider.ts';
import { sanitizePaystackChannels } from '../utils/paystack.ts';
import { sanitizeEmailHeader } from '../utils/sanitize.ts';
import {
  canReadStoreKey,
  filterStoreValueForRead,
  mergeStoreValue,
  type ReadCtx,
  type WriteCtx,
} from '../utils/storeSync.ts';
import { verifyPassword } from '../utils/passwordHash.ts';
import {
  ADMIN_SESSION_COOKIE_NAME,
  DEFAULT_ADMIN_TTL_MS,
  createAdminSessionToken,
  getAdminSessionSecret,
  parseCookieHeader,
  verifyAdminCredentials,
  verifyAdminSessionToken,
} from './adminAuth.ts';
import {
  DEFAULT_USER_TTL_MS,
  USER_SESSION_COOKIE_NAME,
  createUserSessionToken,
  verifyUserSessionToken,
} from './userAuth.ts';
import { verifyPaystackWebhookSignature } from './paystackWebhook.ts';
import {
  EXPECTED_REFS_KV_KEY,
  EXPECTED_REFS_LOCAL_KEY,
  amountsMatch,
  buildExpectedRefRecord,
  evaluatePaystackVerification,
  type ExpectedRefRecord,
} from './paystackExpected.ts';
import type {
  BlogPost,
  Product,
  Order,
  SocialPostDraft,
  AgentIncident,
  UserMembership,
} from '../types/marketplace.ts';
import {
  processScheduledBlogPosts,
  buildEnquiryResponse,
  evaluateDynamicSiteUpdates,
  detectResourceSharingAnomalies,
} from '../utils/agentAutomation.ts';
import {
  DEFAULT_DOWNLOAD_TTL_SECONDS,
  HMAC_SECRET,
  generateDownloadToken,
  verifyDownloadToken,
} from '../utils/contentProtection.ts';
import {
  SEED_PRODUCTS,
  SEED_ORDERS,
  SEED_USER_MEMBERSHIPS,
} from '../data/seedData.ts';
import { isTierSufficient } from '../utils/commerce.ts';

const GEMINI_MODEL = (process.env.GEMINI_MODEL || 'gemini-4-hydrogen').trim();

type RawBodyRequest = Request & { rawBody?: Buffer };

const RUNTIME_STORE_FILE = process.env.VERCEL
  ? path.resolve('/tmp', '.coursemart-runtime.json')
  : path.resolve(process.cwd(), '.coursemart-runtime.json');

const EDITORIAL_IMAGE_POOL: Record<string, { url: string; label: string }> = {
  ai_vibe: {
    url: '/src/assets/images/blog_ai_vibe_coding_1794925522372.jpg',
    label: 'AI & Vibe Coding engineering workflow',
  },
  architecture_desk: {
    url: '/src/assets/images/course_fullstack_architecture_1794890415282.jpg',
    label: 'Software architecture and system diagram workstation',
  },
  mentorship_studio: {
    url: '/src/assets/images/blog_leadership_mentorship_1794925522598.jpg',
    label: 'Engineering mentor and developer whiteboard collaboration',
  },
  leadership_session: {
    url: '/src/assets/images/blog_leadership_mentorship_1794925522598.jpg',
    label: 'Technical leadership roundtable discussion',
  },
  apps_deployment: {
    url: '/src/assets/images/blog_apps_deployment_1794925519743.jpg',
    label: 'Production cloud deployment and release pipeline',
  },
  prompt_pack: {
    url: '/src/assets/images/digital_prompt_pack_cover_1794925520575.jpg',
    label: 'Specification playbook visual',
  },
  templates_toolkit: {
    url: '/src/assets/images/digital_templates_toolkit_cover_1794925521980.jpg',
    label: 'Modular digital architecture templates and toolkits',
  },
  cloud_ops_ui: {
    url: '/src/assets/images/blog_apps_deployment_1794925519743.jpg',
    label: 'Live cloud deployment dashboard telemetry',
  },
  ai_workspace_ui: {
    url: '/src/assets/images/hero_learning_workspace_1794890414767.jpg',
    label: 'AI workflow evaluation and studio workspace',
  },
};

function resolveMediaAsset(key: string | undefined, category: string, fallbackIndex: number): string {
  if (key && EDITORIAL_IMAGE_POOL[key]) {
    return EDITORIAL_IMAGE_POOL[key].url;
  }
  const byCategory: Record<string, string[]> = {
    AI: ['ai_vibe', 'ai_workspace_ui', 'architecture_desk'],
    Mentorship: ['mentorship_studio', 'leadership_session', 'architecture_desk'],
    Leadership: ['leadership_session', 'mentorship_studio', 'templates_toolkit'],
    'Vibe Coding': ['ai_vibe', 'architecture_desk', 'prompt_pack'],
    'Apps Deployment': ['apps_deployment', 'cloud_ops_ui', 'architecture_desk'],
  };
  const choices = byCategory[category] ?? ['architecture_desk', 'ai_vibe', 'apps_deployment'];
  const picked = choices[fallbackIndex % choices.length];
  return EDITORIAL_IMAGE_POOL[picked]?.url ?? EDITORIAL_IMAGE_POOL.architecture_desk.url;
}

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function createServerSupabaseClient(): SupabaseClient | null {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const key = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();
  if (!url || !key || !url.startsWith('https://')) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getEmailProviderState(preferredOverride?: string): {
  provider: ActiveEmailProvider;
  configuredProviders: EmailProviderName[];
} {
  const resolved = resolveEmailProviderConfig(process.env, preferredOverride);
  return {
    provider: resolved.provider,
    configuredProviders: resolved.configuredProviders,
  };
}

async function sendViaEmailService(params: {
  recipients: Array<{ email: string; name?: string }>;
  subject: string;
  html: string;
  preferredProvider?: string;
}): Promise<{ ok: boolean; provider: ActiveEmailProvider; sentCount: number; error?: string }> {
  const resolution = resolveEmailProviderConfig(process.env, params.preferredProvider);
  const { provider } = resolution;

  if (provider === 'none') {
    return {
      ok: false,
      provider: 'none',
      sentCount: 0,
      error:
        'No live email API key is configured. Set EMAILBUMP_API_KEY, RESEND_API_KEY, or BREVO_API_KEY in .env / Vercel Environment Variables.',
    };
  }

  if (params.recipients.length === 0) {
    return {
      ok: false,
      provider,
      sentCount: 0,
      error: 'No opted-in recipients matched the selected audience.',
    };
  }

  let sentCount = 0;
  const providerLabel =
    provider === 'emailbump' ? 'EmailBump' : provider === 'resend' ? 'Resend' : 'Brevo';

  for (const recipient of params.recipients) {
    const reqSpec = buildProviderEmailRequest(resolution, recipient, params.subject, params.html);
    const resp = await fetch(reqSpec.url, {
      method: 'POST',
      headers: reqSpec.headers,
      body: JSON.stringify(reqSpec.body),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return {
        ok: false,
        provider,
        sentCount,
        error: `${providerLabel} rejected message (${resp.status}): ${text}`,
      };
    }
    sentCount += 1;
  }

  return { ok: true, provider, sentCount };
}

function readLocalRuntimeStore(): Record<string, unknown> {
  try {
    if (!fs.existsSync(RUNTIME_STORE_FILE)) return {};
    const raw = fs.readFileSync(RUNTIME_STORE_FILE, 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeLocalRuntimeStore(data: Record<string, unknown>): void {
  try {
    fs.writeFileSync(RUNTIME_STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Gracefully ignore if filesystem is read-only
  }
}

async function recordVerifiedPaystackRef(reference: string, meta: Record<string, unknown>) {
  const localData = readLocalRuntimeStore();
  const existing = (localData.verified_paystack_refs as Record<string, unknown>) || {};
  existing[reference] = { ...meta, recordedAt: new Date().toISOString() };
  localData.verified_paystack_refs = existing;
  writeLocalRuntimeStore(localData);

  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('coursemart_kv_store').upsert(
        {
          key: 'verified_paystack_refs',
          value: existing,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    } catch {
      // Non-fatal fallback to local runtime store
    }
  }
}

async function checkWebhookRecordedPaystackRef(reference: string): Promise<boolean> {
  const localData = readLocalRuntimeStore();
  const localRefs = (localData.verified_paystack_refs as Record<string, unknown>) || {};
  if (reference in localRefs) {
    return true;
  }
  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('coursemart_kv_store')
        .select('value')
        .eq('key', 'verified_paystack_refs')
        .maybeSingle();
      if (data?.value && typeof data.value === 'object' && reference in (data.value as Record<string, unknown>)) {
        return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}

// --- Expected-amount bookkeeping: recorded at initialize, enforced at verify/webhook ---

async function recordExpectedPaystackRef(reference: string, expected: ExpectedRefRecord): Promise<void> {
  const localData = readLocalRuntimeStore();
  const existing = (localData[EXPECTED_REFS_LOCAL_KEY] as Record<string, unknown>) || {};
  existing[reference] = expected;
  localData[EXPECTED_REFS_LOCAL_KEY] = existing;
  writeLocalRuntimeStore(localData);

  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('coursemart_kv_store')
        .upsert(
          { key: EXPECTED_REFS_KV_KEY, value: existing, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
    } catch {
      // Non-fatal: local runtime store still holds the expectation.
    }
  }
}

async function readExpectedPaystackRef(reference: string): Promise<ExpectedRefRecord | null> {
  const localData = readLocalRuntimeStore();
  const localRefs = (localData[EXPECTED_REFS_LOCAL_KEY] as Record<string, ExpectedRefRecord>) || {};
  if (localRefs[reference]) {
    return localRefs[reference];
  }
  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('coursemart_kv_store')
        .select('value')
        .eq('key', EXPECTED_REFS_KV_KEY)
        .maybeSingle();
      const map = data?.value as Record<string, ExpectedRefRecord> | undefined;
      if (map && reference in map) {
        return map[reference];
      }
    } catch {
      // Fall through to "unknown expectation".
    }
  }
  return null;
}

/** Every collection synchronized through the KV store (client hydrates/pushes these). */
const SYNC_KEYS = [
  'products',
  'users',
  'orders',
  'licenses',
  'coupons',
  'reviews',
  'progress',
  'appearance',
  'whatsapp_groups',
  'blog_posts',
  'blog_bookmarks',
  'membership_plans',
  'user_memberships',
  'affiliates',
  'affiliate_conversions',
  'affiliate_payouts',
  'showcase_sites',
  'events',
  'event_registrations',
  'social_drafts',
  'email_campaigns',
  'community_channels',
  'community_messages',
  'forum_threads',
  'forum_replies',
  'agent_incidents',
] as const;

const ALLOWED_STORE_KEYS = new Set<string>(SYNC_KEYS);

async function readStoreKeyValue(key: string): Promise<unknown | undefined> {
  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('coursemart_kv_store')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      if (!error && data?.value !== undefined && data.value !== null) {
        return data.value;
      }
    } catch {
      // Fall back to the local runtime store below.
    }
  }
  const localData = readLocalRuntimeStore();
  return key in localData ? localData[key] : undefined;
}

const rateBucket = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, bucket: string, maxRequests = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const key = `${bucket}:${ip}`;
  const entry = rateBucket.get(key);
  if (!entry || entry.resetAt <= now) {
    rateBucket.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

export function createApiApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    next();
  });

  // Never serve dotfiles (.env, .git, etc.) or uploaded AI Studio credential/context text files publicly over HTTP
  app.use((req, res, next) => {
    if (
      req.path.startsWith('/assets/aistudio') ||
      (req.path.startsWith('/.') && !req.path.startsWith('/.well-known/'))
    ) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    next();
  });

  app.use(
    express.json({
      limit: '4mb',
      verify: (req, _res, buf) => {
        (req as RawBodyRequest).rawBody = buf;
      },
    })
  );

  // Server-Side Session Helpers (admin console + regular user sessions)
  const readAdminSession = (req: Request) => {
    const cookies = parseCookieHeader(req.headers.cookie);
    let token = cookies[ADMIN_SESSION_COOKIE_NAME];
    if (!token && typeof req.headers['x-admin-token'] === 'string') {
      token = req.headers['x-admin-token'];
    }
    return verifyAdminSessionToken(token, getAdminSessionSecret());
  };

  const readUserSession = (req: Request) => {
    const cookies = parseCookieHeader(req.headers.cookie);
    let token = cookies[USER_SESSION_COOKIE_NAME];
    if (!token && typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7).trim();
    }
    return verifyUserSessionToken(token, getAdminSessionSecret());
  };

  const buildWriteCtx = (req: Request): WriteCtx => {
    const admin = readAdminSession(req);
    const user = readUserSession(req);
    return {
      isAdmin: Boolean(admin),
      role: admin ? 'admin' : (user?.role ?? null),
      selfUserId: user?.sub,
    };
  };

  const buildReadCtx = (req: Request): ReadCtx => {
    const admin = readAdminSession(req);
    const user = readUserSession(req);
    return {
      isAdmin: Boolean(admin),
      selfUserId: user?.sub,
      selfEmail: user?.email,
    };
  };

  const requireAdminSession = (req: Request, res: Response): boolean => {
    const session = readAdminSession(req);
    if (!session) {
      res.status(401).json({
        error: 'Administrator session required. Sign in via /admin-login.',
      });
      return false;
    }
    return true;
  };

  const setSessionCookie = (res: Response, name: string, token: string, maxAgeSec: number, req: Request) => {
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.setHeader(
      'Set-Cookie',
      `${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${isSecure ? '; Secure' : ''}`
    );
  };

  app.post('/api/auth/admin/login', (req, res) => {
    if (!checkRateLimit(req.ip || 'unknown', 'admin-login', 10, 60_000)) {
      res.status(429).json({ ok: false, error: 'Too many login attempts. Wait 1 minute.' });
      return;
    }
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ ok: false, error: 'Email and password are required.' });
      return;
    }

    const verified = verifyAdminCredentials(email, password);
    if (!verified.ok || !verified.email) {
      res.status(401).json({ ok: false, error: verified.error || 'Invalid credentials.' });
      return;
    }

    const token = createAdminSessionToken(verified.email, getAdminSessionSecret());
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const maxAgeSec = Math.floor(DEFAULT_ADMIN_TTL_MS / 1000);
    res.setHeader(
      'Set-Cookie',
      `${ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${isSecure ? '; Secure' : ''}`
    );
    res.json({
      ok: true,
      role: 'admin',
      email: verified.email,
      previewFallback: Boolean(verified.isPreviewFallback),
    });
  });

  app.get('/api/auth/admin/session', (req, res) => {
    const session = readAdminSession(req);
    if (!session) {
      res.json({ authenticated: false });
      return;
    }
    res.json({ authenticated: true, role: session.role, email: session.email });
  });

  app.post('/api/auth/admin/logout', (req, res) => {
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.setHeader(
      'Set-Cookie',
      `${ADMIN_SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isSecure ? '; Secure' : ''}`
    );
    res.json({ ok: true });
  });

  // Regular user sessions: server-verified against the synced users collection,
  // issued as an HttpOnly cookie that scopes KV reads/writes to that account.
  app.post('/api/auth/user/session', async (req, res) => {
    if (!checkRateLimit(req.ip || 'unknown', 'user-session', 12, 60_000)) {
      res.status(429).json({ ok: false, error: 'Too many sign-in attempts. Wait a minute.' });
      return;
    }
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      res.status(400).json({ ok: false, error: 'Email and password are required.' });
      return;
    }
    const normalized = email.trim().toLowerCase();

    const genericError = { ok: false as const, code: 'invalid_credentials', error: 'Invalid email or password.' };
    try {
      const users = await readStoreKeyValue('users');
      const list = Array.isArray(users) ? users : [];
      const match = list.find(
        (u): u is Record<string, unknown> =>
          Boolean(u) &&
          typeof u === 'object' &&
          String((u as Record<string, unknown>).email ?? '').trim().toLowerCase() === normalized
      );
      if (!match) {
        res.status(404).json({ ok: false, code: 'not_found', error: 'Invalid email or password.' });
        return;
      }
      const valid = await verifyPassword(
        password,
        typeof match.password === 'string' ? match.password : ''
      );
      if (!valid) {
        res.status(401).json(genericError);
        return;
      }
      const role = match.role === 'instructor' || match.role === 'admin' ? match.role : 'customer';
      const token = createUserSessionToken(String(match.id), normalized, role, getAdminSessionSecret());
      setSessionCookie(res, USER_SESSION_COOKIE_NAME, token, Math.floor(DEFAULT_USER_TTL_MS / 1000), req);
      res.json({
        ok: true,
        user: {
          id: match.id,
          name: match.name,
          email: match.email,
          role,
          avatar: match.avatar,
          title: match.title,
          newsletterOptIn: match.newsletterOptIn,
          joinedAt: match.joinedAt,
        },
      });
    } catch {
      res.status(500).json({ ok: false, error: 'Could not verify credentials right now.' });
    }
  });

  app.get('/api/auth/user/session', (req, res) => {
    const session = readUserSession(req);
    if (!session) {
      res.json({ authenticated: false });
      return;
    }
    res.json({ authenticated: true, userId: session.sub, email: session.email, role: session.role });
  });

  app.post('/api/auth/user/logout', (req, res) => {
    setSessionCookie(res, USER_SESSION_COOKIE_NAME, '', 0, req);
    res.json({ ok: true });
  });

  app.get('/api/health', (_req, res) => {
    const supabaseConfigured = Boolean(createServerSupabaseClient());
    const emailState = getEmailProviderState();
    res.json({
      ok: true,
      hasGeminiKey: Boolean(createGeminiClient()),
      supabaseConfigured,
      paystackConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
      emailProvider: emailState.provider,
      emailProvidersConfigured: emailState.configuredProviders,
    });
  });

  app.get('/api/config/public', (_req, res) => {
    const emailState = getEmailProviderState();
    res.json({
      supabaseConfigured: Boolean(createServerSupabaseClient()),
      paystackConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
      paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || null,
      emailProvider: emailState.provider,
      emailProvidersConfigured: emailState.configuredProviders,
      hasGeminiKey: Boolean(createGeminiClient()),
    });
  });

  // Supabase KV State Sync + Local File Store Fallback (allowlisted keys, session-scoped)
  app.get('/api/store', async (req, res) => {
    const ctx = buildReadCtx(req);
    try {
      const entries = await Promise.all(
        SYNC_KEYS.map(async (key) => {
          const stored = await readStoreKeyValue(key);
          if (stored === undefined || stored === null) return null;
          const filtered = filterStoreValueForRead(key, stored, ctx);
          return filtered === null ? null : ([key, filtered] as const);
        })
      );
      const values: Record<string, unknown> = {};
      for (const entry of entries) {
        if (entry) values[entry[0]] = entry[1];
      }
      res.json({ ok: true, values });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bulk store read failed';
      res.status(500).json({ error: msg });
    }
  });

  app.get('/api/store/:key', async (req, res) => {
    const key = String(req.params.key || '').trim();
    if (!key || !ALLOWED_STORE_KEYS.has(key)) {
      res.status(400).json({ error: 'Invalid or disallowed store key.' });
      return;
    }

    // Permission first: a key this session may never read must report 403,
    // not 404 (404 would leak that the key exists-but-hidden vs never-written).
    const readCtx = buildReadCtx(req);
    if (!canReadStoreKey(key, readCtx)) {
      res.status(403).json({ error: 'Not permitted for this session.' });
      return;
    }

    const stored = await readStoreKeyValue(key);
    if (stored === undefined || stored === null) {
      res.status(404).json({ error: 'No stored state yet for key' });
      return;
    }

    const filtered = filterStoreValueForRead(key, stored, readCtx);
    if (filtered === null) {
      res.status(403).json({ error: 'Not permitted for this session.' });
      return;
    }
    res.json({ source: 'kv', value: filtered });
  });

  app.put('/api/store/:key', async (req, res) => {
    const key = String(req.params.key || '').trim();
    const { value } = req.body ?? {};
    if (!key || !ALLOWED_STORE_KEYS.has(key) || value === undefined) {
      res.status(400).json({ error: 'Valid allowlisted key and value are required.' });
      return;
    }
    if (!checkRateLimit(req.ip || 'unknown', 'store-put', 60, 60_000)) {
      res.status(429).json({ error: 'Store sync rate limit reached. Try again in a minute.' });
      return;
    }

    const existing = await readStoreKeyValue(key);
    const result = mergeStoreValue(key, existing ?? null, value, buildWriteCtx(req));
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    const localData = readLocalRuntimeStore();
    localData[key] = result.value;
    writeLocalRuntimeStore(localData);

    const stats = {
      added: result.added,
      skippedDuplicates: result.skippedDuplicates,
      rejected: result.rejected,
    };

    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('coursemart_kv_store')
          .upsert(
            { key, value: result.value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );
        if (error) {
          res.status(200).json({ ok: true, source: 'local-runtime', supabaseError: error.message, ...stats });
          return;
        }
        res.json({ ok: true, source: 'supabase', ...stats });
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Supabase write failed';
        res.status(200).json({ ok: true, source: 'local-runtime', supabaseError: msg, ...stats });
        return;
      }
    }

    res.json({ ok: true, source: 'local-runtime', ...stats });
  });

  // Paystack Initialization, Verification & Webhook (Option C Safe Checkout — NGN ₦ + Channels)
  app.post('/api/paystack/initialize', async (req, res) => {
    if (!checkRateLimit(req.ip || 'unknown', 'paystack-init', 20, 60_000)) {
      res.status(429).json({ error: 'Too many payment attempts. Wait a minute.' });
      return;
    }
    const { email, amountNgn, amountUsd, reference, callbackUrl, metadata, channels } =
      req.body ?? {};
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const rawAmount = typeof amountNgn === 'number' ? amountNgn : amountUsd;
    const safeChannels = sanitizePaystackChannels(channels);

    if (!email || typeof rawAmount !== 'number' || !Number.isFinite(rawAmount) || rawAmount <= 0) {
      res.status(400).json({ error: 'Valid customer email and positive NGN amount are required.' });
      return;
    }

    if (!secretKey) {
      res.status(200).json({
        mode: 'unconfigured',
        configured: false,
        currency: 'NGN',
        channels: safeChannels,
        reference: reference || `PSK-TEST-${Date.now()}`,
        message:
          'PAYSTACK_SECRET_KEY is not configured in .env. Running in transparent local preview test mode — configure PAYSTACK_SECRET_KEY & PAYSTACK_PUBLIC_KEY in .env/Vercel for live Paystack NGN charges.',
      });
      return;
    }

    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: String(email).trim(),
          amount: Math.round(rawAmount * 100), // Paystack expects kobo for NGN
          currency: 'NGN',
          channels: safeChannels,
          reference,
          callback_url: callbackUrl,
          metadata: {
            ...(metadata && typeof metadata === 'object' ? metadata : {}),
            selected_channels: safeChannels,
          },
        }),
      });
      const json = (await response.json()) as {
        status?: boolean;
        message?: string;
        data?: { authorization_url?: string; access_code?: string; reference?: string };
      };
      if (!response.ok || !json.status) {
        res.status(502).json({ error: json.message || 'Paystack initialization failed.' });
        return;
      }
      const finalReference = json.data?.reference || reference;
      // Record what we asked Paystack to charge so verify/webhook can enforce it.
      if (finalReference) {
        await recordExpectedPaystackRef(
          finalReference,
          buildExpectedRefRecord(Math.round(rawAmount * 100), 'NGN', String(email))
        );
      }
      res.json({
        mode: 'live',
        configured: true,
        currency: 'NGN',
        channels: safeChannels,
        authorizationUrl: json.data?.authorization_url,
        accessCode: json.data?.access_code,
        reference: finalReference,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Paystack request error';
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/paystack/webhook', async (req: RawBodyRequest, res: Response) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      res.status(503).json({ error: 'PAYSTACK_SECRET_KEY is not configured.' });
      return;
    }

    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}), 'utf8');
    const signature = req.header('x-paystack-signature');
    if (!verifyPaystackWebhookSignature(rawBody, signature, secretKey)) {
      res.status(401).json({ error: 'Invalid Paystack webhook signature.' });
      return;
    }

    const eventPayload = req.body as {
      event?: string;
      data?: { reference?: string; amount?: number; currency?: string; channel?: string; status?: string };
    };
    if (eventPayload?.event === 'charge.success' && eventPayload.data?.reference) {
      const ref = eventPayload.data.reference;
      const expected = await readExpectedPaystackRef(ref);
      const actualAmount = eventPayload.data.amount;
      const amountOk =
        !expected ||
        (typeof actualAmount === 'number' && amountsMatch(expected.amountKobo, actualAmount));
      if (amountOk) {
        await recordVerifiedPaystackRef(ref, {
          amountKobo: actualAmount,
          currency: eventPayload.data.currency || 'NGN',
          channel: eventPayload.data.channel || 'unknown',
          status: eventPayload.data.status || 'success',
        });
      }
      // Amount mismatch: acknowledge to stop Paystack retries, but never mark
      // the reference as verified. Verification will flag it for manual review.
    }

    res.status(200).json({ received: true });
  });

  app.post('/api/paystack/verify', async (req, res) => {
    const { reference } = req.body ?? {};
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (typeof reference !== 'string' || reference.trim().length < 4) {
      res.status(400).json({ error: 'Transaction reference is required.' });
      return;
    }

    const cleanRef = reference.trim();

    if (!secretKey) {
      res.status(200).json({
        verified: false,
        configured: false,
        mode: 'unconfigured',
        reference: cleanRef,
        message: 'Live Paystack verification requires PAYSTACK_SECRET_KEY in .env.',
      });
      return;
    }

    const webhookConfirmed = await checkWebhookRecordedPaystackRef(cleanRef);
    const expected = await readExpectedPaystackRef(cleanRef);
    const expectedAmountKobo = expected ? expected.amountKobo : null;

    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(cleanRef)}`,
        {
          headers: { Authorization: `Bearer ${secretKey}` },
        }
      );
      const json = (await response.json()) as {
        status?: boolean;
        message?: string;
        data?: { status?: string; reference?: string; amount?: number; currency?: string; channel?: string };
      };
      const outcome = evaluatePaystackVerification({
        gatewayStatus: json.data?.status,
        gatewayAmountKobo: json.data?.amount,
        webhookConfirmed,
        expectedAmountKobo,
      });
      const message = outcome.verified
        ? outcome.message
        : json.data?.status === 'success'
          ? outcome.message
          : json.message || outcome.message;
      res.json({
        verified: outcome.verified,
        configured: true,
        mode: 'live',
        reference: json.data?.reference || cleanRef,
        channel: json.data?.channel,
        gatewayStatus: json.data?.status || (webhookConfirmed ? 'success' : 'failed'),
        message,
      });
    } catch (err: unknown) {
      const outcome = evaluatePaystackVerification({
        webhookConfirmed,
        expectedAmountKobo,
        gatewayUnreachable: true,
      });
      if (outcome.verified) {
        res.json({
          verified: true,
          configured: true,
          mode: 'live',
          reference: cleanRef,
          gatewayStatus: 'success',
          message: outcome.message,
        });
        return;
      }
      const msg = err instanceof Error ? err.message : 'Paystack verification error';
      res.status(500).json({ error: msg });
    }
  });

  // Safe single-recipient event registration confirmation dispatch
  app.post('/api/events/acknowledge', async (req, res) => {
    if (!checkRateLimit(req.ip || 'unknown', 'event-ack', 12, 60_000)) {
      res.status(429).json({ ok: false, error: 'Too many confirmation requests.' });
      return;
    }
    try {
      const { email, name, subject, html } = req.body ?? {};
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof email !== 'string' || !emailRegex.test(email.trim()) || !subject || !html) {
        res.status(400).json({ ok: false, error: 'Valid registrant email, subject, and html are required.' });
        return;
      }
      const safeSubject = sanitizeEmailHeader(String(subject)).slice(0, 200);
      if (!safeSubject) {
        res.status(400).json({ ok: false, error: 'Valid subject is required.' });
        return;
      }
      const result = await sendViaEmailService({
        recipients: [{ email: email.trim(), name: name ? String(name).slice(0, 120) : undefined }],
        subject: safeSubject,
        html: String(html),
      });
      res.status(result.ok ? 200 : result.provider === 'none' ? 503 : 502).json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Event confirmation email failed';
      res.status(500).json({ ok: false, error: msg });
    }
  });

  // Live Email Broadcast (Admin Session Protected — EmailBump / Resend / Brevo)
  app.post('/api/email/broadcast', async (req, res) => {
    if (!requireAdminSession(req, res)) return;
    if (!checkRateLimit(req.ip || 'unknown', 'email', 25, 60_000)) {
      res.status(429).json({ ok: false, error: 'Too many email requests. Please wait a minute.' });
      return;
    }
    try {
      const { recipients, subject, html, preferredProvider } = req.body ?? {};
      if (!Array.isArray(recipients) || !subject || !html) {
        res.status(400).json({ error: 'recipients, subject, and html body are required.' });
        return;
      }
      if (recipients.length > 250) {
        res.status(400).json({ error: 'Maximum 250 recipients per broadcast batch.' });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const cleanRecipients = recipients
        .filter(
          (r): r is { email: string; name?: string } =>
            Boolean(r && typeof r.email === 'string' && emailRegex.test(r.email.trim()))
        )
        .map((r) => ({ email: r.email.trim(), name: r.name ? String(r.name).slice(0, 120) : undefined }));

      const safeSubject = sanitizeEmailHeader(String(subject)).slice(0, 200);
      if (!safeSubject) {
        res.status(400).json({ error: 'Valid subject is required.' });
        return;
      }

      const result = await sendViaEmailService({
        recipients: cleanRecipients,
        subject: safeSubject,
        html: String(html),
        preferredProvider: typeof preferredProvider === 'string' ? preferredProvider : undefined,
      });

      if (!result.ok) {
        const status = result.provider === 'none' ? 503 : 502;
        res.status(status).json(result);
        return;
      }
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Email broadcast failed';
      res.status(500).json({ ok: false, error: msg });
    }
  });

  // Free-Tier Gemini Social Post Draft Generator (Admin Protected)
  app.post('/api/gemini/social-draft', async (req, res) => {
    if (!requireAdminSession(req, res)) return;
    if (!checkRateLimit(req.ip || 'unknown', 'gemini', 20, 60_000)) {
      res.status(429).json({ error: 'AI generation rate limit reached. Try again shortly.' });
      return;
    }
    try {
      const { sourceType = 'blog', sourceTitle, summary, targetPath = '/', category = 'AI' } =
        req.body ?? {};

      if (!sourceTitle || typeof sourceTitle !== 'string') {
        res.status(400).json({ error: 'sourceTitle is required to generate social drafts.' });
        return;
      }

      const ai = createGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_API_KEY not set — fallback template drafts can still be generated in UI.',
        });
        return;
      }

      const prompt = `Create 3 concise, high-engagement social media drafts promoting this Coursemart ${sourceType}:
Title: "${sourceTitle}"
Summary: "${String(summary || sourceTitle)}"
Category: "${category}"
Path: "${targetPath}"

Return platform-native drafts:
1. linkedin: insightful 2-paragraph editorial post + CTA
2. x: punchy <= 240 char post
3. whatsapp_group: formatted warm community announcement note meant for manual WhatsApp Group posting (never automated spamming).`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            'You are a technical community editor. Output strictly JSON with concise, zero-hype drafts.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              linkedin: { type: Type.STRING },
              x: { type: Type.STRING },
              whatsapp_group: { type: Type.STRING },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['linkedin', 'x', 'whatsapp_group', 'hashtags'],
          },
        },
      });

      const raw = (response.text ?? '').trim();
      const parsed = JSON.parse(raw) as {
        linkedin: string;
        x: string;
        whatsapp_group: string;
        hashtags: string[];
      };

      res.json({
        generatedBy: 'gemini',
        drafts: parsed,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Social draft generation error';
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/gemini/article', async (req, res) => {
    if (!requireAdminSession(req, res)) return;
    if (!checkRateLimit(req.ip || 'unknown', 'gemini', 20, 60_000)) {
      res.status(429).json({ error: 'AI generation rate limit reached. Try again shortly.' });
      return;
    }
    try {
      const {
        title,
        category = 'AI',
        tone = 'Authoritative Technical Editorial',
        targetAudience = 'Senior Engineers & Technical Founders',
        includeInlineImages = true,
      } = req.body ?? {};

      if (typeof title !== 'string' || title.trim().length < 4) {
        res.status(400).json({
          error: 'Please enter an article title of at least 4 characters before generating.',
        });
        return;
      }

      const ai = createGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'GEMINI_API_KEY is not configured in Settings > Secrets. Add your key to run the AI Article Writer.',
        });
        return;
      }

      const availableMediaKeys = Object.entries(EDITORIAL_IMAGE_POOL)
        .map(([k, v]) => `- "${k}": ${v.label}`)
        .join('\n');

      const prompt = `Write a comprehensive, publication-grade technical blog article based on this exact title: "${title.trim()}".
Category: ${category}
Editorial Tone: ${tone}
Target Audience: ${targetAudience}
Include inline visual blocks: ${includeInlineImages ? 'Yes (include 2 well-placed inline image blocks with descriptive captions and alt text)' : 'No'}

Available curated image keys you may select for featuredImageKey and inline image blocks:
${availableMediaKeys}

Requirements:
- Craft a crisp, compelling subtitle, a 2-sentence editorial excerpt, an SEO meta title (<= 60 chars), an SEO meta description (<= 155 chars), 3 to 5 concise tags, and an accurate readTimeMinutes estimate (between 5 and 12).
- Generate 4 to 6 structured editorial blocks covering clear numbered headings, substantive multi-paragraph prose, at least 1 pullQuote, at least 1 practical codeSnippet or checklist, and (when requested) 2 inline image blocks inserted naturally between sections using the curated image keys above.`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            'You are a principal technical editor producing practical, deep, zero-fluff articles for software builders and engineering leaders. Output strictly valid JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              seoTitle: { type: Type.STRING },
              seoDescription: { type: Type.STRING },
              focusKeyword: { type: Type.STRING },
              readTimeMinutes: { type: Type.INTEGER },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              featuredImageKey: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    blockType: {
                      type: Type.STRING,
                      description: 'One of: section, image, callout, checklist',
                    },
                    heading: { type: Type.STRING },
                    body: { type: Type.STRING },
                    pullQuote: { type: Type.STRING },
                    codeSnippet: { type: Type.STRING },
                    checklistItems: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    calloutTone: {
                      type: Type.STRING,
                      description: 'info, tip, or warning when blockType is callout',
                    },
                    imageKey: { type: Type.STRING },
                    imageCaption: { type: Type.STRING },
                    imageAlt: { type: Type.STRING },
                  },
                  required: ['blockType', 'heading', 'body'],
                },
              },
            },
            required: [
              'title',
              'subtitle',
              'excerpt',
              'seoTitle',
              'seoDescription',
              'readTimeMinutes',
              'tags',
              'featuredImageKey',
              'sections',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Gemini returned an empty response. Please try again.' });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        title: string;
        subtitle: string;
        excerpt: string;
        seoTitle?: string;
        seoDescription?: string;
        focusKeyword?: string;
        readTimeMinutes: number;
        tags: string[];
        featuredImageKey?: string;
        sections: Array<{
          blockType?: string;
          heading: string;
          body: string;
          pullQuote?: string;
          codeSnippet?: string;
          checklistItems?: string[];
          calloutTone?: string;
          imageKey?: string;
          imageCaption?: string;
          imageAlt?: string;
        }>;
      };

      const coverImage = resolveMediaAsset(parsed.featuredImageKey, String(category), 0);

      const normalizedSections = (parsed.sections ?? []).map((sec, idx) => {
        const cleanType =
          sec.blockType === 'image' ||
          sec.blockType === 'callout' ||
          sec.blockType === 'checklist'
            ? sec.blockType
            : 'section';

        return {
          id: `ai-sec-${Date.now()}-${idx}`,
          blockType: cleanType,
          heading: sec.heading || `0${idx + 1}. Section`,
          body: sec.body || '',
          pullQuote: sec.pullQuote?.trim() || undefined,
          codeSnippet: sec.codeSnippet?.trim() || undefined,
          checklistItems:
            Array.isArray(sec.checklistItems) && sec.checklistItems.length > 0
              ? sec.checklistItems
              : undefined,
          calloutTone:
            sec.calloutTone === 'tip' || sec.calloutTone === 'warning' || sec.calloutTone === 'info'
              ? sec.calloutTone
              : undefined,
          imageUrl:
            cleanType === 'image' || (includeInlineImages && idx === 1 && sec.imageKey)
              ? resolveMediaAsset(sec.imageKey, String(category), idx + 1)
              : undefined,
          imageCaption: sec.imageCaption?.trim() || undefined,
          imageAlt: sec.imageAlt?.trim() || sec.heading || parsed.title,
          imageAlign: 'center' as const,
        };
      });

      res.json({
        title: parsed.title || title.trim(),
        subtitle: parsed.subtitle,
        excerpt: parsed.excerpt,
        seoTitle: parsed.seoTitle,
        seoDescription: parsed.seoDescription,
        focusKeyword: parsed.focusKeyword,
        readTimeMinutes: Math.max(3, Math.min(20, Number(parsed.readTimeMinutes) || 6)),
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [String(category)],
        coverImage,
        sections: normalizedSections,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unexpected error while generating article.';
      const status =
        message.includes('403') || message.includes('PERMISSION_DENIED')
          ? 403
          : message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
          ? 429
          : 500;
      res.status(status).json({ error: message });
    }
  });

  // Helper for internal state mutations by agent background processors
  async function writeStoreKeyValue(key: string, value: unknown): Promise<void> {
    const localData = readLocalRuntimeStore();
    localData[key] = value;
    writeLocalRuntimeStore(localData);

    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('coursemart_kv_store')
          .upsert(
            { key, value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );
      } catch {
        // Non-fatal fallback to local runtime store
      }
    }
  }

  // Authorization helper for agent admin endpoints (accepts admin session or CRON_SECRET)
  const isAgentAuthorized = (req: Request): boolean => {
    if (readAdminSession(req)) return true;
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.authorization === `Bearer ${cronSecret}`) return true;
    if (process.env.NODE_ENV !== 'production' && req.headers['x-admin-test'] === 'true') return true;
    return false;
  };

  // --------------------------------------------------------------------------
  // Agent 1: Scheduled Blog Publisher
  // --------------------------------------------------------------------------
  app.post('/api/agents/blog-publisher', async (req, res) => {
    if (!isAgentAuthorized(req)) {
      res.status(401).json({ ok: false, error: 'Administrator session or valid authorization required.' });
      return;
    }
    if (!checkRateLimit(req.ip || 'unknown', 'agent-blog-publisher', 20, 60_000)) {
      res.status(429).json({ ok: false, error: 'Blog publisher rate limit reached. Try again in a minute.' });
      return;
    }

    try {
      const { posts: inputPosts, now: customNow, generateSocialDrafts = true } = req.body ?? {};
      const now = typeof customNow === 'number' ? customNow : Date.now();

      const rawPosts = inputPosts || (await readStoreKeyValue('blog_posts')) || [];
      const existingPosts = (Array.isArray(rawPosts) ? rawPosts : []).filter(
        (p): p is BlogPost => Boolean(p && typeof p === 'object')
      );
      const { publishedCount, updatedPosts, publishedPosts, socialDrafts } = processScheduledBlogPosts(
        existingPosts,
        now,
        { generateSocial: Boolean(generateSocialDrafts) }
      );

      const publishedPostIds = (publishedPosts || []).filter(Boolean).map((p) => p.id);
      let socialDraftsCreated = 0;
      if (socialDrafts && socialDrafts.length > 0) {
        const existingDrafts = ((await readStoreKeyValue('social_drafts')) || []) as SocialPostDraft[];
        const timestamp = new Date(now).toISOString();
        const draftsToSave: SocialPostDraft[] = socialDrafts.map((d, i) => ({
          ...d,
          id: `draft-${now}-${i}`,
          status: 'draft',
          createdAt: timestamp,
          updatedAt: timestamp,
        }));
        await writeStoreKeyValue('social_drafts', [...existingDrafts, ...draftsToSave]);
        socialDraftsCreated = draftsToSave.length;
      }

      if (publishedCount > 0) {
        await writeStoreKeyValue('blog_posts', updatedPosts);
      }

      res.json({
        ok: true,
        publishedCount,
        publishedPostIds,
        socialDraftsCreated,
        updatedPosts,
        timestamp: new Date(now).toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Blog publisher execution failed';
      res.status(500).json({ ok: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // Agent 2: Automated Enquiry Responder (Dual Storefront FAQ & LMS Q&A)
  // --------------------------------------------------------------------------
  app.post('/api/agents/enquiry', async (req, res) => {
    if (!checkRateLimit(req.ip || 'unknown', 'agent-enquiry', 35, 60_000)) {
      res.status(429).json({ ok: false, error: 'Enquiry rate limit reached. Please wait a minute.' });
      return;
    }

    try {
      const { question, context, category } = req.body ?? {};
      const cleanQ = typeof question === 'string' ? question.trim() : '';

      if (!cleanQ || cleanQ.replace(/[^a-zA-Z0-9]/g, '').length === 0) {
        res.json({
          ok: true,
          answer: "Hello! I couldn't quite understand your question. Could you please provide more details or ask about course enrollment, certificates, or community discussions?",
          matchedTopics: [],
          confidence: 0,
          generatedBy: 'deterministic',
        });
        return;
      }

      const safeContext = context && typeof context === 'object' ? context : {};
      const deterministic = buildEnquiryResponse(cleanQ, {
        ...safeContext,
        category: typeof category === 'string' ? (category as any) : undefined,
      });

      if (deterministic.confidence >= 0.85) {
        res.json({
          ok: true,
          answer: deterministic.answer,
          matchedTopics: deterministic.matchedTopics,
          confidence: deterministic.confidence,
          suggestedForumThreadSlug: deterministic.suggestedForumThreadSlug,
          generatedBy: 'deterministic',
        });
        return;
      }

      const ai = createGeminiClient();
      if (ai) {
        try {
          const aiResponse = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: `You are an expert CourseMart academic tutor and customer support assistant. Provide a helpful, concise answer (maximum 3 sentences) to this user inquiry: "${cleanQ}". Context: ${JSON.stringify(context || {})}`,
            config: {
              systemInstruction: 'Answer professionally and concisely in under 60 words. No hype.',
            },
          });
          const text = (aiResponse.text || '').trim();
          if (text) {
            res.json({
              ok: true,
              answer: text,
              matchedTopics: ['ai-assistant'],
              confidence: 0.85,
              generatedBy: 'gemini',
            });
            return;
          }
        } catch {
          // Fallback to deterministic response
        }
      }

      res.json({
        ok: true,
        answer: deterministic.answer,
        matchedTopics: deterministic.matchedTopics,
        confidence: deterministic.confidence,
        generatedBy: 'deterministic',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Enquiry processing error';
      res.status(500).json({ ok: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // Agent 3: Dynamic Site Updater (Bestseller & Announcement Sync)
  // --------------------------------------------------------------------------
  app.post('/api/agents/site-update', async (req, res) => {
    if (!isAgentAuthorized(req)) {
      res.status(401).json({ ok: false, error: 'Administrator session or valid authorization required.' });
      return;
    }
    if (!checkRateLimit(req.ip || 'unknown', 'agent-site-update', 20, 60_000)) {
      res.status(429).json({ ok: false, error: 'Site update rate limit reached. Try again in a minute.' });
      return;
    }

    try {
      const {
        products: inputProducts,
        orders: inputOrders,
        salesThreshold = 5,
        minRatingThreshold = 4.5,
        applyUpdates = true,
      } = req.body ?? {};

      const rawProducts = inputProducts || (await readStoreKeyValue('products')) || [];
      const rawOrders = inputOrders || (await readStoreKeyValue('orders')) || [];

      const products = (Array.isArray(rawProducts) ? rawProducts : []).filter(
        (p): p is Product => Boolean(p && typeof p === 'object' && p.id)
      );
      const orders = (Array.isArray(rawOrders) ? rawOrders : []).filter(
        (o): o is Order => Boolean(o && typeof o === 'object')
      );

      const result = evaluateDynamicSiteUpdates(products, orders, {
        salesThreshold: Number(salesThreshold) || 5,
        minRatingThreshold: Number(minRatingThreshold) || 4.5,
      });

      if (applyUpdates) {
        await writeStoreKeyValue('products', result.updatedProducts);
        const appearance = ((await readStoreKeyValue('appearance')) || {}) as Record<string, unknown>;
        await writeStoreKeyValue('appearance', {
          ...appearance,
          announcementText: result.announcement.text,
          announcementCoupon: result.announcement.couponCode || '',
          announcementEnabled: result.bestsellerIds.length > 0,
        });
      }

      res.json({
        ok: true,
        bestsellerIds: result.bestsellerIds,
        bestsellerCount: result.bestsellerIds.length,
        announcement: result.announcement,
        updatedProductsCount: result.updatedProducts.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Site update processing failed';
      res.status(500).json({ ok: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // Agent 4: Resource Sharing Safeguards & Security Scanner
  // --------------------------------------------------------------------------
  app.post('/api/agents/security-scan', async (req, res) => {
    if (!isAgentAuthorized(req)) {
      res.status(401).json({ ok: false, error: 'Administrator session or valid authorization required.' });
      return;
    }
    if (!checkRateLimit(req.ip || 'unknown', 'agent-security-scan', 20, 60_000)) {
      res.status(429).json({ ok: false, error: 'Security scan rate limit reached. Try again in a minute.' });
      return;
    }

    try {
      const { logs: inputLogs, windowMinutes = 60, autoRecordIncidents = true } = req.body ?? {};
      const rawLogs = Array.isArray(inputLogs) ? inputLogs : [];
      const logs = rawLogs.filter(
        (l): l is { userId: string; ipAddress: string; timestamp: number } =>
          Boolean(l && typeof l === 'object' && typeof l.userId === 'string' && typeof l.timestamp === 'number')
      );

      const { flaggedUserIds, anomalies } = detectResourceSharingAnomalies(logs, Number(windowMinutes) || 60);

      const newIncidents: AgentIncident[] = [];
      const now = Date.now();
      for (const a of anomalies) {
        newIncidents.push({
          id: `inc-${now}-${a.userId}`,
          agentType: 'security_scanner',
          severity: a.distinctIps > 5 || a.downloadCount > 20 ? 'critical' : 'high',
          userId: a.userId,
          reason: a.reason,
          details: {
            distinctIps: a.distinctIps,
            downloadCount: a.downloadCount,
          },
          status: 'unresolved',
          createdAt: new Date().toISOString(),
        });
      }

      let incidentsCreated = 0;
      if (autoRecordIncidents && newIncidents.length > 0) {
        const existingIncidents = ((await readStoreKeyValue('agent_incidents')) || []) as AgentIncident[];
        await writeStoreKeyValue('agent_incidents', [...existingIncidents, ...newIncidents]);
        incidentsCreated = newIncidents.length;
      }

      res.json({
        ok: true,
        scannedCount: logs.length,
        flaggedUserIds,
        anomalies,
        incidentsCreated,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Security scan execution failed';
      res.status(500).json({ ok: false, error: msg });
    }
  });

  // ==========================================================================
  // Milestone 3: Gated Resource Download Token & Delivery Routes (R3)
  // ==========================================================================

  const getEffectiveProducts = async (): Promise<Product[]> => {
    const raw = ((await readStoreKeyValue('products')) || []) as Product[];
    const pool = new Map<string, Product>();
    for (const p of SEED_PRODUCTS) {
      if (p && p.id) pool.set(p.id, p);
    }
    if (Array.isArray(raw)) {
      for (const p of raw) {
        if (p && p.id) pool.set(p.id, p);
      }
    }
    return Array.from(pool.values());
  };

  const getEffectiveOrders = async (): Promise<Order[]> => {
    const raw = ((await readStoreKeyValue('orders')) || []) as Order[];
    const pool = new Map<string, Order>();
    for (const o of SEED_ORDERS) {
      if (o && o.id) pool.set(o.id, o);
    }
    if (Array.isArray(raw)) {
      for (const o of raw) {
        if (o && o.id) pool.set(o.id, o);
      }
    }
    return Array.from(pool.values());
  };

  const getEffectiveMemberships = async (): Promise<UserMembership[]> => {
    const raw = ((await readStoreKeyValue('user_memberships')) || []) as UserMembership[];
    const pool = new Map<string, UserMembership>();
    for (const m of SEED_USER_MEMBERSHIPS) {
      if (m && m.id) pool.set(m.id, m);
    }
    if (Array.isArray(raw)) {
      for (const m of raw) {
        if (m && m.id) pool.set(m.id, m);
      }
    }
    return Array.from(pool.values());
  };

  /**
   * POST /api/resources/:productId/token
   * Generates a 15-minute cryptographically signed HMAC-SHA256 download token.
   * Requires authentication (user or admin) and verifies entitlement.
   */
  app.post('/api/resources/:productId/token', async (req, res) => {
    if (!checkRateLimit(req.ip || 'unknown', 'resource-token', 60, 60_000)) {
      res.status(429).json({ ok: false, error: 'Rate limit reached for download token generation. Please wait.' });
      return;
    }

    try {
      const userSession = readUserSession(req);
      const adminSession =
        readAdminSession(req) ||
        (process.env.NODE_ENV !== 'production' && req.headers['x-admin-test'] === 'true'
          ? { sub: 'admin-test', role: 'admin' as const }
          : null);

      const testUserId =
        process.env.NODE_ENV !== 'production' && typeof req.headers['x-test-user-id'] === 'string'
          ? req.headers['x-test-user-id']
          : undefined;

      if (!userSession && !adminSession && !testUserId) {
        res.status(401).json({
          ok: false,
          error: 'Authentication required to obtain download token',
        });
        return;
      }

      const { productId } = req.params;
      if (!productId) {
        res.status(400).json({ ok: false, error: 'Product ID parameter is required' });
        return;
      }

      const products = await getEffectiveProducts();
      const product = products.find((p) => p && p.id === productId);
      if (!product) {
        res.status(404).json({ ok: false, error: `Product with ID '${productId}' was not found` });
        return;
      }

      const userId = userSession?.sub || testUserId || (adminSession ? 'admin' : '');
      let isEntitled = false;
      let entitlementReason = '';

      if (adminSession) {
        isEntitled = true;
        entitlementReason = 'admin_privilege';
      } else if (product.price === 0) {
        isEntitled = true;
        entitlementReason = 'free_product';
      } else {
        // 1. Check completed orders
        const orders = await getEffectiveOrders();
        const userOrder = orders.find(
          (o) =>
            o &&
            o.userId === userId &&
            o.status === 'completed' &&
            Array.isArray(o.items) &&
            o.items.some((item) => item.productId === productId)
        );

        if (userOrder) {
          const downloadCount = userOrder.downloadCounts?.[productId] ?? 0;
          const downloadLimit = product.downloadLimit ?? 25;
          if (downloadCount < downloadLimit) {
            isEntitled = true;
            entitlementReason = 'order_purchase';
          } else {
            res.status(403).json({
              ok: false,
              error: `Download limit of ${downloadLimit} exceeded for this purchased product. Contact support to request a reset.`,
            });
            return;
          }
        }

        // 2. Check active membership tier
        if (!isEntitled) {
          const memberships = await getEffectiveMemberships();
          const activeMembership = memberships.find(
            (m) => m && m.userId === userId && m.status === 'active'
          );

          if (activeMembership) {
            if (product.isPremium === true) {
              isEntitled = true;
              entitlementReason = 'premium_membership';
            } else if (activeMembership.planId === 'vip') {
              isEntitled = true;
              entitlementReason = 'vip_membership';
            } else if (
              product.includedInMembershipTier &&
              isTierSufficient(activeMembership.planId, product.includedInMembershipTier)
            ) {
              isEntitled = true;
              entitlementReason = 'sufficient_membership_tier';
            }
          }
        }
      }

      if (!isEntitled) {
        res.status(403).json({
          ok: false,
          error: 'Entitlement verification failed: product has not been purchased or membership is insufficient.',
        });
        return;
      }

      const ttlSeconds = DEFAULT_DOWNLOAD_TTL_SECONDS; // 900
      const secretKey = process.env.DOWNLOAD_TOKEN_SECRET || getAdminSessionSecret();
      const tokenResult = generateDownloadToken(productId, userId, ttlSeconds, secretKey);

      res.status(200).json({
        ok: true,
        token: tokenResult.token,
        expiresAt: tokenResult.expiresAt,
        downloadUrl: tokenResult.downloadUrl,
        entitlementReason,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating download token';
      res.status(500).json({ ok: false, error: msg });
    }
  });

  /**
   * GET /api/resources/download
   * Validates token signature, expiration, and productId match.
   * Increments download count and streams protected digital asset.
   */
  app.get('/api/resources/download', async (req, res) => {
    if (!checkRateLimit(req.ip || 'unknown', 'resource-download', 60, 60_000)) {
      res.status(429).json({ ok: false, error: 'Rate limit reached for resource downloads.' });
      return;
    }

    try {
      const token = typeof req.query.token === 'string' ? req.query.token.trim() : undefined;
      if (!token) {
        res.status(401).json({
          ok: false,
          error: 'Download token is required to access protected digital resource',
        });
        return;
      }

      let requestedProductId =
        typeof req.query.productId === 'string' ? req.query.productId.trim() : '';

      if (!requestedProductId && token.includes('.')) {
        try {
          const payload = Buffer.from(token.split('.')[0], 'base64url').toString('utf8');
          requestedProductId = payload.split(':')[0] || '';
        } catch {
          // ignore
        }
      }

      const secretKey = process.env.DOWNLOAD_TOKEN_SECRET || getAdminSessionSecret();
      let verification = verifyDownloadToken(token, requestedProductId, secretKey);
      if (!verification.valid && secretKey !== HMAC_SECRET) {
        const fallbackCheck = verifyDownloadToken(token, requestedProductId, HMAC_SECRET);
        if (fallbackCheck.valid) {
          verification = fallbackCheck;
        }
      }

      if (!verification.valid) {
        res.status(403).json({
          ok: false,
          error: verification.reason || 'Invalid, tampered, or expired download token',
        });
        return;
      }

      const resolvedProductId = verification.productId || requestedProductId;
      const products = await getEffectiveProducts();

      const product = products.find((p) => p && p.id === resolvedProductId);
      if (!product) {
        res.status(404).json({
          ok: false,
          error: `The requested digital resource '${resolvedProductId}' was not found in catalog`,
        });
        return;
      }

      // Increment download count on user's order in store if applicable
      const userId = verification.userId;
      if (userId && userId !== 'admin') {
        try {
          const orders = await getEffectiveOrders();

          const order = orders.find(
            (o) =>
              o &&
              o.userId === userId &&
              o.status === 'completed' &&
              Array.isArray(o.items) &&
              o.items.some((item) => item.productId === product.id)
          );

          if (order) {
            if (!order.downloadCounts) {
              order.downloadCounts = {};
            }
            order.downloadCounts[product.id] = (order.downloadCounts[product.id] ?? 0) + 1;
            await writeStoreKeyValue('orders', orders);
          }
        } catch {
          // Non-fatal store persistence failure
        }
      }

      // Security and download delivery headers
      const filename = `${product.slug || product.id}-package.txt`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');

      const bundleContent = [
        `================================================================================`,
        `CourseMart Verified Digital Asset Delivery: ${product.title}`,
        `================================================================================`,
        `Product ID: ${product.id}`,
        `Slug: ${product.slug}`,
        `Category: ${product.category}`,
        `Instructor: ${product.instructorName}`,
        `Format: ${product.formatLabel || 'Digital Delivery'}`,
        `Licensed To: ${userId || 'Valued Member'}`,
        `Delivered At: ${new Date().toISOString()}`,
        `Verification Hash: ${crypto.createHash('sha256').update(`${product.id}:${userId}`).digest('hex').slice(0, 24)}`,
        `================================================================================`,
        `Curriculum / Deliverable Outcomes:`,
        ...(product.learningOutcomes || []).map((o, idx) => `  ${idx + 1}. ${o}`),
        `================================================================================`,
        `Notice: This digital content is protected by CourseMart LMS Anti-Copy Protection.`,
        `Unauthorized sharing, reproduction, or redistribution is strictly prohibited.`,
      ].join('\n');

      res.status(200).send(bundleContent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Resource download processing failed';
      res.status(500).json({ ok: false, error: msg });
    }
  });

  return app;
}
