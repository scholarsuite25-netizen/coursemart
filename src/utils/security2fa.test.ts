import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateTwoFactorSetup,
  generateTwoFactorToken,
  hashToken,
  formatTwoFactorSecret,
  verifyTwoFactorToken,
  markTwoFactorVerified,
} from './security2fa';

test('generateTwoFactorToken returns distinct uppercase alphanumeric tokens of expected length', () => {
  const t1 = generateTwoFactorToken(24);
  const t2 = generateTwoFactorToken(24);
  assert.equal(t1.length, 24);
  assert.match(t1, /^[A-Z2-9]+$/);
  assert.notEqual(t1, t2, 'tokens are random');
});

test('generateTwoFactorSetup creates fresh setup with hashed secret', () => {
  const setup = generateTwoFactorSetup();
  assert.ok(setup.secret);
  assert.equal(setup.secretHash, hashToken(setup.secret));
  assert.ok(new Date(setup.createdAt).getTime() > 0);
});

test('formatTwoFactorSecret produces BASE32-ish groups for display', () => {
  const formatted = formatTwoFactorSecret(generateTwoFactorSetup().secret);
  assert.match(formatted, /^([A-Z2-9]{4} ?)+$/);
});

test('verifyTwoFactorToken validates codes within maxAge, rejects stale/invalid/null setups', () => {
  const setup = generateTwoFactorSetup();

  const ok = verifyTwoFactorToken(setup.secret, setup, 10);
  assert.deepEqual(ok.ok, true, 'correct code passes');

  const wrong = verifyTwoFactorToken('WRONGCODE00', setup, 10);
  assert.equal(wrong.ok, false, 'wrong code fails');
  assert.ok(wrong.reason, 'has reason');

  const stale = { ...setup, createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() };
  const expired = verifyTwoFactorToken(setup.secret, stale, 10);
  assert.equal(expired.ok, false, 'stale setup rejected');
  assert.match(expired.reason || '', /expired/i);

  const noSetup = verifyTwoFactorToken('ABCD', null);
  assert.equal(noSetup.ok, false);
});

test('markTwoFactorVerified sets twoFactorVerifiedAt on the user', () => {
  const user: { twoFactorVerifiedAt?: string } = {};
  const ts = markTwoFactorVerified(user);
  assert.equal(user.twoFactorVerifiedAt, ts);
  assert.ok(ts);
});
