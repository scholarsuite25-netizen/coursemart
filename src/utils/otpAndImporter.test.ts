import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWhatsAppRawText, MemoryOtpStore, OtpManager } from './otpAndImporter.ts';

test('parseWhatsAppRawText extracts phone numbers, names, and emails from raw text', () => {
  const sampleWhatsAppText = `
    [10/11/2026, 10:15 AM] Messages and calls are end-to-end encrypted.
    Chidi Okafor: +234 803 471 0699
    Amaka Eze: amaka.eze@example.com
    +2349012345678 ~Tunde Bakare
    +1 (555) 234-5678
    student4@yahoo.com
  `;

  const parsed = parseWhatsAppRawText(sampleWhatsAppText);
  assert.ok(parsed.length >= 4, `Expected at least 4 contacts, got ${parsed.length}`);

  const chidi = parsed.find((p) => p.phone?.includes('2348034710699'));
  assert.ok(chidi, 'Chidi phone number should be parsed');

  const amaka = parsed.find((p) => p.email === 'amaka.eze@example.com');
  assert.ok(amaka, 'Amaka email should be parsed');

  const tunde = parsed.find((p) => p.phone?.includes('2349012345678'));
  assert.ok(tunde, 'Tunde phone number should be parsed');
});

test('OtpManager generates 6-digit numeric OTP and verifies successfully', async () => {
  const manager = new OtpManager();
  const email = 'student@digitalwealthcreators.ng';

  const otp = await manager.generateOtp(email, 60000);
  assert.equal(otp.length, 6, 'OTP must be 6 digits');
  assert.match(otp, /^\d{6}$/, 'OTP must be all numeric digits');

  const wrongRes = await manager.verifyOtp(email, '000000');
  assert.equal(wrongRes.ok, false);
  assert.match(wrongRes.error ?? '', /incorrect/i);

  const validRes = await manager.verifyOtp(email, otp);
  assert.equal(validRes.ok, true);

  // Once used, cannot be replayed
  const replayRes = await manager.verifyOtp(email, otp);
  assert.equal(replayRes.ok, false);
});

test('OtpManager enforces expiration and max attempts', async () => {
  const manager = new OtpManager();
  const email = 'expired@example.com';

  // Negative TTL to simulate immediate expiration
  const expiredOtp = await manager.generateOtp(email, -1000);
  const expRes = await manager.verifyOtp(email, expiredOtp);
  assert.equal(expRes.ok, false);
  assert.match(expRes.error ?? '', /expired/i);

  // Max 5 attempts
  const email2 = 'bruteforce@example.com';
  await manager.generateOtp(email2, 60000);
  for (let i = 0; i < 5; i++) {
    await manager.verifyOtp(email2, '111111');
  }
  const blockedRes = await manager.verifyOtp(email2, '111111');
  assert.equal(blockedRes.ok, false);
  assert.match(blockedRes.error ?? '', /too many/i);
});

test('OtpManager persists codes through a shared store (KV-backed in production)', async () => {
  const store = new MemoryOtpStore();
  const writer = new OtpManager(store);
  const reader = new OtpManager(store);

  const otp = await writer.generateOtp('persisted@example.com', 60000);
  const result = await reader.verifyOtp('persisted@example.com', otp);
  assert.equal(result.ok, true, 'A second manager sharing the store must verify the code');
});

test('OtpManager prunes only expired records', async () => {
  const store = new MemoryOtpStore();
  const manager = new OtpManager(store);

  await manager.generateOtp('expired@example.com', -1000);
  await manager.generateOtp('active@example.com', 60000);

  const removed = await manager.pruneExpired();
  assert.equal(removed, 1, 'Only the expired record should be pruned');

  const activeOtp = await manager.generateOtp('active2@example.com', 60000);
  const activeResult = await manager.verifyOtp('active2@example.com', activeOtp);
  assert.equal(activeResult.ok, true);
});

test('OtpManager clears codes on demand', async () => {
  const manager = new OtpManager();
  const otp = await manager.generateOtp('clear-me@example.com', 60000);

  await manager.clearOtp('clear-me@example.com');
  const result = await manager.verifyOtp('clear-me@example.com', otp);
  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /no verification code/i);
});
