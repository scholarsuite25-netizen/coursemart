import express, { type Request, type Response } from 'express';
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
  ADMIN_SESSION_COOKIE_NAME,
  DEFAULT_ADMIN_TTL_MS,
  createAdminSessionToken,
  getAdminSessionSecret,
  parseCookieHeader,
  verifyAdminCredentials,
  verifyAdminSessionToken,
} from './adminAuth.ts';
import { verifyPaystackWebhookSignature } from './paystackWebhook.ts';

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
    url: '/src/assets/images/blog_inline_architecture_1794932926034.jpg',
    label: 'Software architecture and system diagram workstation',
  },
  mentorship_studio: {
    url: '/src/assets/images/blog_inline_team_mentorship_1794932927655.jpg',
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
    url: '/src/assets/images/showcase_cloud_ops_1794932925707.jpg',
    label: 'Live cloud deployment dashboard telemetry',
  },
  ai_workspace_ui: {
    url: '/src/assets/images/showcase_ai_workspace_1794932924628.jpg',
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

const ALLOWED_STORE_KEYS = new Set([
  'events',
  'event_registrations',
  'social_drafts',
  'email_campaigns',
]);

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

  // Server-Side Admin Session Helpers
  const ADMIN_PROTECTED_KEYS = new Set(['events', 'social_drafts', 'email_campaigns']);

  const readAdminSession = (req: Request) => {
    const cookies = parseCookieHeader(req.headers.cookie);
    const token = cookies[ADMIN_SESSION_COOKIE_NAME];
    return verifyAdminSessionToken(token, getAdminSessionSecret());
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

  // Supabase KV State Sync + Local File Store Fallback (allowlisted keys only)
  app.get('/api/store/:key', async (req, res) => {
    const key = String(req.params.key || '').trim();
    if (!key || !ALLOWED_STORE_KEYS.has(key)) {
      res.status(400).json({ error: 'Invalid or disallowed store key.' });
      return;
    }
    if ((key === 'social_drafts' || key === 'email_campaigns') && !requireAdminSession(req, res)) {
      return;
    }

    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('coursemart_kv_store')
          .select('value, updated_at')
          .eq('key', key)
          .maybeSingle();

        if (!error && data) {
          res.json({ source: 'supabase', value: data.value, updatedAt: data.updated_at });
          return;
        }
      } catch (err) {
        console.warn('Supabase read fallback:', err);
      }
    }

    const localData = readLocalRuntimeStore();
    if (key in localData) {
      res.json({ source: 'local-runtime', value: localData[key] });
      return;
    }
    res.status(404).json({ error: 'No stored state yet for key' });
  });

  app.put('/api/store/:key', async (req, res) => {
    const key = String(req.params.key || '').trim();
    const { value } = req.body ?? {};
    if (!key || !ALLOWED_STORE_KEYS.has(key) || value === undefined) {
      res.status(400).json({ error: 'Valid allowlisted key and value are required.' });
      return;
    }
    if (ADMIN_PROTECTED_KEYS.has(key) && !requireAdminSession(req, res)) {
      return;
    }

    const localData = readLocalRuntimeStore();
    localData[key] = value;
    writeLocalRuntimeStore(localData);

    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('coursemart_kv_store')
          .upsert(
            { key, value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );
        if (error) {
          res.status(200).json({ ok: true, source: 'local-runtime', supabaseError: error.message });
          return;
        }
        res.json({ ok: true, source: 'supabase' });
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Supabase write failed';
        res.status(200).json({ ok: true, source: 'local-runtime', supabaseError: msg });
        return;
      }
    }

    res.json({ ok: true, source: 'local-runtime' });
  });

  // Paystack Initialization, Verification & Webhook (Option C Safe Checkout — NGN ₦ + Channels)
  app.post('/api/paystack/initialize', async (req, res) => {
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
      res.json({
        mode: 'live',
        configured: true,
        currency: 'NGN',
        channels: safeChannels,
        authorizationUrl: json.data?.authorization_url,
        accessCode: json.data?.access_code,
        reference: json.data?.reference || reference,
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
      await recordVerifiedPaystackRef(eventPayload.data.reference, {
        amountKobo: eventPayload.data.amount,
        currency: eventPayload.data.currency || 'NGN',
        channel: eventPayload.data.channel || 'unknown',
        status: eventPayload.data.status || 'success',
      });
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
      const paid = Boolean((json.status && json.data?.status === 'success') || webhookConfirmed);
      res.json({
        verified: paid,
        configured: true,
        mode: 'live',
        reference: json.data?.reference || cleanRef,
        channel: json.data?.channel,
        gatewayStatus: json.data?.status || (webhookConfirmed ? 'success' : 'failed'),
        message: paid ? 'Verified via Paystack API' : json.message || 'Transaction not completed yet',
      });
    } catch (err: unknown) {
      if (webhookConfirmed) {
        res.json({
          verified: true,
          configured: true,
          mode: 'live',
          reference: cleanRef,
          gatewayStatus: 'success',
          message: 'Verified via Paystack Webhook',
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
        model: 'gemini-4-hydrogen',
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
        model: 'gemini-4-hydrogen',
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

  return app;
}
