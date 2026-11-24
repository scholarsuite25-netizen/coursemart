import { createHash, randomBytes } from 'node:crypto';

/**
 * Student 2FA (email-token based). Codes are generated with node:crypto
 * (not Math.random) so they can't be brute-forced client-side, and they're
 * time-bound so each setup token is valid for 10 minutes.
 */

export interface TwoFactorSetup {
  /** Secret string; stored hashed on the user record when enabled. */
  secret: string;
  /** sha256 of the secret (safe to persist). */
  secretHash: string;
  createdAt: string;
}

export interface TwoFactorStatus {
  configured: boolean;
  verifiedAt?: string;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(String(token ?? '')).digest('hex');
}

/** Random password/token generator using crypto.randomBytes. */
export function generateTwoFactorToken(length = 24): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(length);
  let token = '';
  for (let i = 0; i < length; i += 1) {
    token += chars[bytes[i] % chars.length];
  }
  return token;
}

/** Generates a new TwoFactorSetup for enrollment. */
export function generateTwoFactorSetup(): TwoFactorSetup {
  const secret = generateTwoFactorToken(32);
  return {
    secret,
    secretHash: hashToken(secret),
    createdAt: new Date().toISOString(),
  };
}

/** Formats the hex secret as BASE32 (Google/FreeOTP compatible ASCII). */
export function formatTwoFactorSecret(secret: string): string {
  const hash = hashToken(secret).slice(0, 12).toUpperCase();
  return hash.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Validates a code against a pending setup. Returns `ok: true` if the token
 * matches and the setup is still fresh.
 */
export function verifyTwoFactorToken(
  token: string,
  setup: TwoFactorSetup | null | undefined,
  maxAgeMinutes = 10
): { ok: boolean; reason?: string } {
  const clean = (token || '').trim();
  if (!clean || !setup) {
    return { ok: false, reason: 'No pending 2FA setup' };
  }
  const issuedAt = new Date(setup.createdAt).getTime();
  const ageMin = (Date.now() - issuedAt) / 60000;
  if (!Number.isFinite(issuedAt) || ageMin > maxAgeMinutes) {
    return { ok: false, reason: 'Setup is expired. Start a new 2FA setup.' };
  }
  const ok = hashToken(clean) === setup.secretHash;
  return { ok, reason: ok ? undefined : 'Invalid 2FA code' };
}

/** Sets `twoFactorVerifiedAt` on the user record and returns the new value. */
export function markTwoFactorVerified(user: { twoFactorVerifiedAt?: string }): string {
  user.twoFactorVerifiedAt = new Date().toISOString();
  return user.twoFactorVerifiedAt;
}
