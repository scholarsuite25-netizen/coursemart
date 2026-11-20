/**
 * Client/server-shared password hashing.
 *
 * Stored format: pbkdf2$<iterations>$<saltBase64Url>$<hashBase64Url>
 *
 * - New and migrated passwords are stored as PBKDF2-SHA256 (100k iterations)
 *   with a per-user random salt, never in plaintext.
 * - Legacy plaintext records (pre-migration seed/localStorage data) still
 *   verify via direct comparison so existing accounts keep working; callers
 *   should upgrade them with hashPassword() after a successful login.
 */

const PBKDF2_PREFIX = 'pbkdf2';
const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;
const textEncoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddedWithEq = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(paddedWithEq);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveBits(password: string, salt: string, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: base64UrlToBytes(salt), iterations, hash: 'SHA-256' },
    key,
    HASH_BITS
  );
  return new Uint8Array(bits);
}

export function isPasswordHashed(stored: string | undefined | null): boolean {
  return typeof stored === 'string' && stored.startsWith(`${PBKDF2_PREFIX}$`);
}

/** True when a stored password is a non-empty legacy plaintext record. */
export function needsPasswordUpgrade(stored: string | undefined | null): boolean {
  return Boolean(stored) && !isPasswordHashed(stored);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(SALT_BYTES)));
  const hash = await deriveBits(password, salt, PBKDF2_ITERATIONS);
  return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${salt}$${bytesToBase64Url(hash)}`;
}

export async function verifyPassword(
  password: string,
  stored: string | undefined | null
): Promise<boolean> {
  // Empty credentials are never valid (blocks blank-password accounts).
  if (!stored || !password) return false;

  if (!isPasswordHashed(stored)) {
    // Legacy plaintext record kept for backward compatibility.
    return stored === password;
  }

  const parts = stored.split('$');
  if (parts.length !== 4) return false;
  const [, iterationsRaw, salt, expectedHash] = parts;
  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations < 1_000 || !salt || !expectedHash) return false;

  const actual = bytesToBase64Url(await deriveBits(password, salt, iterations));
  if (actual.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}
