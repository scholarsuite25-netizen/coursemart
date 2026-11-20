import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  USER_SESSION_COOKIE_NAME,
  createUserSessionToken,
  verifyUserSessionToken,
} from './userAuth';

test('user session tokens validate signature, role and expiry', () => {
  const secret = 'user-session-secret-abc';
  const now = 1_700_000_000_000;
  const token = createUserSessionToken('user-student-1', 'Student@Example.com', 'customer', secret, now, 60_000);

  const valid = verifyUserSessionToken(token, secret, now + 1_000);
  assert.equal(valid?.sub, 'user-student-1');
  assert.equal(valid?.email, 'student@example.com');
  assert.equal(valid?.role, 'customer');

  assert.equal(verifyUserSessionToken(token, 'wrong-secret', now + 1_000), null);
  assert.equal(verifyUserSessionToken(token, secret, now + 60_001), null);
  assert.equal(verifyUserSessionToken(`${token}tampered`, secret, now + 1_000), null);
  assert.equal(verifyUserSessionToken(undefined, secret, now), null);
});

test('user session tokens reject unknown roles and malformed payloads', () => {
  const secret = 's3cret';
  const now = 1_700_000_000_000;
  const forged = Buffer.from(
    JSON.stringify({ sub: 'u', email: 'e@x.com', role: 'superuser', iat: now, exp: now + 60_000 }),
    'utf8'
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(forged).digest('base64url');
  assert.equal(verifyUserSessionToken(`${forged}.${sig}`, secret, now + 1), null);
});

test('cookie name constant is exported for route wiring', () => {
  assert.equal(USER_SESSION_COOKIE_NAME, 'coursemart_user_session');
});
