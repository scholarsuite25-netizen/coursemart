import { randomInt } from 'node:crypto';

export interface ParsedWhatsAppContact {
  raw: string;
  name?: string;
  phone?: string;
  email?: string;
}

/**
 * Parses raw text copied from WhatsApp (chat exports, member info lists, or mixed text)
 * and extracts valid phone numbers, emails, and student names.
 */
export function parseWhatsAppRawText(text: string): ParsedWhatsAppContact[] {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split(/[\r\n]+/);
  const results: ParsedWhatsAppContact[] = [];
  const seenKeys = new Set<string>();

  // Phone regex supporting Nigerian and international formats:
  // e.g. +234 803 471 0699, +2348034710699, 08034710699, +1 555 123 4567
  const phoneRegex = /(?:\+?\d{1,4}[ -]?)?(?:0|\(?\d{2,3}\)?)[ -]?\d{3,4}[ -]?\d{3,4}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip WhatsApp system metadata lines
    if (
      trimmed.includes('Messages and calls are end-to-end encrypted') ||
      trimmed.includes('created group') ||
      trimmed.includes('added you') ||
      trimmed.includes('changed the group')
    ) {
      continue;
    }

    const emails = trimmed.match(emailRegex) || [];
    const phones = trimmed.match(phoneRegex) || [];

    // Filter phones to reasonable digit lengths (7 to 15 digits)
    const cleanPhones = phones.filter((p) => {
      const digits = p.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    });

    if (emails.length > 0 || cleanPhones.length > 0) {
      const email = emails[0]?.toLowerCase();
      const phone = cleanPhones[0]?.replace(/[^\d+]/g, '');

      // Attempt to extract name if the line is formatted like:
      // "John Doe: +234803..." or "+234803... ~John Doe" or "John Doe <john@gmail.com>"
      let name: string | undefined;
      const stripped = trimmed
        .replace(emailRegex, '')
        .replace(phoneRegex, '')
        .replace(/[~:\-–—<>()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (stripped.length >= 2 && stripped.length <= 60 && !/^\d+$/.test(stripped)) {
        name = stripped;
      }

      const dedupeKey = (email || phone || trimmed).toLowerCase();
      if (!seenKeys.has(dedupeKey)) {
        seenKeys.add(dedupeKey);
        results.push({
          raw: trimmed,
          name,
          phone,
          email,
        });
      }
    } else if (trimmed.length >= 2 && trimmed.length <= 60 && !trimmed.includes(':') && !/^\d+$/.test(trimmed)) {
      // Possible standalone name in contact roster
      const dedupeKey = trimmed.toLowerCase();
      if (!seenKeys.has(dedupeKey)) {
        seenKeys.add(dedupeKey);
        results.push({
          raw: trimmed,
          name: trimmed,
        });
      }
    }
  }

  return results;
}

/**
 * OTP storage contract. The server uses a KV-backed implementation so codes
 * survive restarts and are visible across serverless instances; tests use the
 * in-memory implementation.
 */
export interface OtpRecord {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
}

export interface OtpStore {
  readAll(): Promise<Record<string, OtpRecord>>;
  writeAll(records: Record<string, OtpRecord>): Promise<void>;
}

export class MemoryOtpStore implements OtpStore {
  private records: Record<string, OtpRecord> = {};

  async readAll(): Promise<Record<string, OtpRecord>> {
    return { ...this.records };
  }

  async writeAll(records: Record<string, OtpRecord>): Promise<void> {
    this.records = { ...records };
  }
}

export class OtpManager {
  private store: OtpStore;

  constructor(store: OtpStore = new MemoryOtpStore()) {
    this.store = store;
  }

  /**
   * Generates a cryptographically random 6-digit numeric OTP valid for the
   * given TTL (default 10 minutes) and persists it through the configured store.
   */
  async generateOtp(email: string, ttlMs = 10 * 60 * 1000): Promise<string> {
    const normalized = email.trim().toLowerCase();
    const digits = randomInt(100000, 1000000).toString();
    const records = await this.store.readAll();
    records[normalized] = {
      code: digits,
      email: normalized,
      expiresAt: Date.now() + ttlMs,
      attempts: 0,
    };
    await this.store.writeAll(records);
    return digits;
  }

  /**
   * Verifies an OTP for given email.
   * Enforces max 5 attempts and expiry. Clears OTP on success.
   */
  async verifyOtp(email: string, inputCode: string): Promise<{ ok: boolean; error?: string }> {
    const normalized = email.trim().toLowerCase();
    const records = await this.store.readAll();
    const record = records[normalized];

    if (!record) {
      return { ok: false, error: 'No verification code found for this email. Request a new code.' };
    }

    if (Date.now() > record.expiresAt) {
      delete records[normalized];
      await this.store.writeAll(records);
      return { ok: false, error: 'Verification code has expired. Please request a new one.' };
    }

    if (record.attempts >= 5) {
      delete records[normalized];
      await this.store.writeAll(records);
      return { ok: false, error: 'Too many incorrect attempts. Please request a new code.' };
    }

    record.attempts += 1;

    if (record.code !== inputCode.trim()) {
      await this.store.writeAll(records);
      return { ok: false, error: 'Incorrect verification code. Please check and try again.' };
    }

    // Success — delete so it cannot be reused
    delete records[normalized];
    await this.store.writeAll(records);
    return { ok: true };
  }

  async clearOtp(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const records = await this.store.readAll();
    if (normalized in records) {
      delete records[normalized];
      await this.store.writeAll(records);
    }
  }

  /** Removes expired records (called by the daily maintenance cron). */
  async pruneExpired(now = Date.now()): Promise<number> {
    const records = await this.store.readAll();
    let removed = 0;
    for (const [email, record] of Object.entries(records)) {
      if (!record || now > record.expiresAt) {
        delete records[email];
        removed += 1;
      }
    }
    if (removed > 0) {
      await this.store.writeAll(records);
    }
    return removed;
  }
}
