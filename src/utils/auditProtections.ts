import { createHash } from 'node:crypto';

/**
 * Audit bot protection (server-side login brute-force defense).
 *
 * Tracks failed login attempts in the KV store, keyed by a hash of (IP, email).
 * After repeated failures within a window, the key is banned for a lockout period.
 * Exported for wiring into login routes (createApp.ts).
 */

export const MAX_FAILED_LOGIN_ATTEMPTS = 8;
export const LOGIN_ATTEMPT_WINDOW_HOURS = 12;
export const LOGIN_LOCKOUT_HOURS = 24;

export interface LoginAttemptState {
  attempts: Record<string, { firstFailedAt: string; lastFailedAt: string; count: number }>;
  bannedUntil: Record<string, string>;
}

export function hashLoginAttemptKey(ip: string, email: string): string {
  const raw = `${(ip || '').trim()}::${(email || '').trim().toLowerCase()}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

function isFresh(key: string, bannedUntil: Record<string, string>, now: Date): boolean {
  return new Date(bannedUntil[key]).getTime() > now.getTime();
}

export type KVReader = (key: string) => Promise<unknown | undefined>;
export type KVWriter = (key: string, value: unknown) => Promise<void>;

export async function isLoginBanned(
  ip: string,
  email: string,
  read: KVReader,
  now: Date = new Date()
): Promise<boolean> {
  const key = hashLoginAttemptKey(ip, email);
  const banned = (await read('audit_login_banned')) as Record<string, string> | null;
  if (banned && isFresh(key, banned, now)) {
    return true;
  }
  return false;
}

export async function recordFailedLoginAttempt(
  ip: string,
  email: string,
  read: KVReader,
  write: KVWriter,
  now: Date = new Date()
): Promise<{ blocked: boolean; attempts: number }> {
  const key = hashLoginAttemptKey(ip, email);
  const state = (await read('audit_login_attempts')) as LoginAttemptState | null;
  const attempts = state?.attempts || {};
  const entry = attempts[key] || { firstFailedAt: now.toISOString(), lastFailedAt: now.toISOString(), count: 0 };
  const hoursSinceFirst = (now.getTime() - new Date(entry.firstFailedAt).getTime()) / 3_600_000;
  entry.count = hoursSinceFirst > LOGIN_ATTEMPT_WINDOW_HOURS ? 1 : entry.count + 1;
  entry.firstFailedAt = hoursSinceFirst > LOGIN_ATTEMPT_WINDOW_HOURS ? now.toISOString() : entry.firstFailedAt;
  entry.lastFailedAt = now.toISOString();
  attempts[key] = entry;
  await write('audit_login_attempts', { attempts } as LoginAttemptState);

  if (entry.count >= MAX_FAILED_LOGIN_ATTEMPTS) {
    const until = new Date(now.getTime() + LOGIN_LOCKOUT_HOURS * 3_600_000).toISOString();
    const banned = ((await read('audit_login_banned')) as Record<string, string> | null) || {};
    banned[key] = until;
    await write('audit_login_banned', banned);
    return { blocked: true, attempts: entry.count };
  }
  return { blocked: false, attempts: entry.count };
}

export async function resetLoginThrottle(
  ip: string,
  email: string,
  read: KVReader,
  write: KVWriter
): Promise<void> {
  const key = hashLoginAttemptKey(ip, email);
  const attempts = ((await read('audit_login_attempts')) as LoginAttemptState | null)?.attempts || {};
  delete attempts[key];
  await write('audit_login_attempts', { attempts } as LoginAttemptState);
  const banned = ((await read('audit_login_banned')) as Record<string, string> | null) || {};
  delete banned[key];
  await write('audit_login_banned', banned);
}
