import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAdminSessionToken,
  parseCookieHeader,
  verifyAdminCredentials,
  verifyAdminSessionToken,
} from './adminAuth';

test('verifyAdminCredentials enforces configured env credentials and rejects invalid passwords', () => {
  const env = {
    NODE_ENV: 'production',
    ADMIN_EMAIL: 'ops@coursemart.ng',
    ADMIN_PASSWORD: 'Strong-Prod-Password-2026!',
  } as unknown as NodeJS.ProcessEnv;

  const valid = verifyAdminCredentials('ops@coursemart.ng', 'Strong-Prod-Password-2026!', env);
  assert.equal(valid.ok, true);
  assert.equal(valid.email, 'ops@coursemart.ng');

  const wrongPass = verifyAdminCredentials('ops@coursemart.ng', 'admin1234', env);
  assert.equal(wrongPass.ok, false);

  const wrongEmail = verifyAdminCredentials('admin@coursemart.io', 'Strong-Prod-Password-2026!', env);
  assert.equal(wrongEmail.ok, false);
});

test('verifyAdminCredentials blocks unset ADMIN_PASSWORD in production runtime', () => {
  const env = {
    NODE_ENV: 'production',
    VERCEL: '1',
  } as unknown as NodeJS.ProcessEnv;

  const res = verifyAdminCredentials('admin@coursemart.io', 'admin1234', env);
  assert.equal(res.ok, false);
  assert.match(res.error ?? '', /ADMIN_PASSWORD/i);
});

test('createAdminSessionToken and verifyAdminSessionToken validate HMAC signature and expiry', () => {
  const secret = 'test-signing-secret-xyz';
  const now = 1_700_000_000_000;
  const token = createAdminSessionToken('admin@coursemart.io', secret, now, 60_000);

  const valid = verifyAdminSessionToken(token, secret, now + 10_000);
  assert.equal(valid?.email, 'admin@coursemart.io');
  assert.equal(valid?.role, 'admin');

  assert.equal(verifyAdminSessionToken(token, 'wrong-secret', now + 10_000), null);
  assert.equal(verifyAdminSessionToken(token, secret, now + 60_001), null);
  assert.equal(verifyAdminSessionToken(`${token}tamper`, secret, now + 10_000), null);
});

test('parseCookieHeader extracts cookies safely', () => {
  const cookies = parseCookieHeader('foo=bar; coursemart_admin_session=abc.123; empty=');
  assert.equal(cookies.foo, 'bar');
  assert.equal(cookies.coursemart_admin_session, 'abc.123');
  assert.equal(cookies.empty, '');
});
