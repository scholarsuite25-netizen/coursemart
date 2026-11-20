import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  isPasswordHashed,
  needsPasswordUpgrade,
  verifyPassword,
} from './passwordHash';

test('hashPassword produces a pbkdf2 record that verifies and never contains the password', async () => {
  const stored = await hashPassword('correct-horse-battery');
  assert.equal(isPasswordHashed(stored), true);
  assert.equal(stored.includes('correct-horse-battery'), false);
  const parts = stored.split('$');
  assert.equal(parts.length, 4);
  assert.equal(parts[0], 'pbkdf2');
  assert.ok(Number(parts[1]) >= 100_000);

  assert.equal(await verifyPassword('correct-horse-battery', stored), true);
  assert.equal(await verifyPassword('wrong-password', stored), false);
});

test('hashPassword salts each record independently', async () => {
  const a = await hashPassword('same-input');
  const b = await hashPassword('same-input');
  assert.notEqual(a, b);
  assert.equal(await verifyPassword('same-input', a), true);
  assert.equal(await verifyPassword('same-input', b), true);
});

test('verifyPassword accepts legacy plaintext records for migration', async () => {
  assert.equal(await verifyPassword('demo1234', 'demo1234'), true);
  assert.equal(await verifyPassword('other', 'demo1234'), false);
  assert.equal(needsPasswordUpgrade('demo1234'), true);
  assert.equal(needsPasswordUpgrade(await hashPassword('demo1234')), false);
});

test('verifyPassword rejects empty credentials and malformed records', async () => {
  assert.equal(await verifyPassword('', ''), false);
  assert.equal(await verifyPassword('anything', ''), false);
  assert.equal(await verifyPassword('', 'pbkdf2$100000$abc$def'), false);
  assert.equal(await verifyPassword('x', 'pbkdf2$notanumber$salt$hash'), false);
  assert.equal(await verifyPassword('x', 'pbkdf2$100000$onlythreeparts'), false);
  assert.equal(await verifyPassword('x', ''), false);
});
