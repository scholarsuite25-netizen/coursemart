import crypto from 'node:crypto';
import { getAdminSessionSecret } from './adminAuth.ts';

export const USER_SESSION_COOKIE_NAME = 'coursemart_user_session';
export const DEFAULT_USER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type UserSessionRole = 'customer' | 'instructor' | 'admin';

export interface UserSessionPayload {
  sub: string;
  email: string;
  role: UserSessionRole;
  iat: number;
  exp: number;
}

export function createUserSessionToken(
  userId: string,
  email: string,
  role: UserSessionRole,
  secret: string = getAdminSessionSecret(),
  nowMs: number = Date.now(),
  ttlMs: number = DEFAULT_USER_TTL_MS
): string {
  const payload: UserSessionPayload = {
    sub: userId,
    email: email.trim().toLowerCase(),
    role,
    iat: nowMs,
    exp: nowMs + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyUserSessionToken(
  token: string | undefined,
  secret: string = getAdminSessionSecret(),
  nowMs: number = Date.now()
): UserSessionPayload | null {
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
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<UserSessionPayload>;
    if (
      typeof decoded.sub !== 'string' ||
      typeof decoded.email !== 'string' ||
      (decoded.role !== 'customer' && decoded.role !== 'instructor' && decoded.role !== 'admin') ||
      typeof decoded.exp !== 'number' ||
      decoded.exp <= nowMs
    ) {
      return null;
    }
    return decoded as UserSessionPayload;
  } catch {
    return null;
  }
}
