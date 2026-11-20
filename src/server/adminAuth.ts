import crypto from 'node:crypto';

export const ADMIN_SESSION_COOKIE_NAME = 'coursemart_admin_session';
export const DEFAULT_ADMIN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Ephemeral fallback secret for non-configured local dev only (rotates on restart)
const EPHEMERAL_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

export interface AdminSessionPayload {
  email: string;
  role: 'admin';
  iat: number;
  exp: number;
}

export function getAdminSessionSecret(env: NodeJS.ProcessEnv = process.env): string {
  const configured = (
    env.ADMIN_SESSION_SECRET ||
    env.SUPABASE_SECRET_KEY ||
    env.PAYSTACK_SECRET_KEY ||
    ''
  ).trim();
  return configured || EPHEMERAL_FALLBACK_SECRET;
}

function timingSafeEquals(a: string, b: string): boolean {
  const bufA = crypto.createHash('sha256').update(a).digest();
  const bufB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(bufA, bufB);
}

export function isProductionRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.VERCEL === '1' || env.VERCEL_ENV === 'production' || env.NODE_ENV === 'production';
}

export function verifyAdminCredentials(
  emailInput: string,
  passwordInput: string,
  env: NodeJS.ProcessEnv = process.env
): { ok: boolean; email?: string; error?: string; isPreviewFallback?: boolean } {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput;
  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' };
  }

  const configuredEmail = (env.ADMIN_EMAIL || 'admin@coursemart.io').trim().toLowerCase();
  const configuredPassword = (env.ADMIN_PASSWORD || '').trim();

  if (configuredPassword) {
    if (timingSafeEquals(email, configuredEmail) && timingSafeEquals(password, configuredPassword)) {
      return { ok: true, email: configuredEmail, isPreviewFallback: false };
    }
    return { ok: false, error: 'Invalid administrator email or password.' };
  }

  // In deployed production without ADMIN_PASSWORD configured, deny access safely.
  if (isProductionRuntime(env)) {
    return {
      ok: false,
      error:
        'ADMIN_PASSWORD is not configured in server environment variables. Set ADMIN_EMAIL and ADMIN_PASSWORD before logging in.',
    };
  }

  // Local non-production sandbox fallback (never exposed as one-click UI)
  if (timingSafeEquals(email, configuredEmail) && timingSafeEquals(password, 'admin1234')) {
    return { ok: true, email: configuredEmail, isPreviewFallback: true };
  }
  return { ok: false, error: 'Invalid administrator email or password.' };
}

export function createAdminSessionToken(
  email: string,
  secret: string,
  nowMs: number = Date.now(),
  ttlMs: number = DEFAULT_ADMIN_TTL_MS
): string {
  const payload: AdminSessionPayload = {
    email: email.trim().toLowerCase(),
    role: 'admin',
    iat: nowMs,
    exp: nowMs + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyAdminSessionToken(
  token: string | undefined,
  secret: string,
  nowMs: number = Date.now()
): AdminSessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as Partial<AdminSessionPayload>;
    if (
      decoded.role !== 'admin' ||
      typeof decoded.email !== 'string' ||
      typeof decoded.exp !== 'number' ||
      decoded.exp <= nowMs
    ) {
      return null;
    }
    return decoded as AdminSessionPayload;
  } catch {
    return null;
  }
}

export function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const rawVal = part.slice(idx + 1).trim();
    try {
      result[key] = decodeURIComponent(rawVal);
    } catch {
      result[key] = rawVal;
    }
  }
  return result;
}
