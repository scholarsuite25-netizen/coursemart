import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isLoginBanned,
  recordFailedLoginAttempt,
  resetLoginThrottle,
  hashLoginAttemptKey,
  MAX_FAILED_LOGIN_ATTEMPTS,
} from './auditProtections';

function makeStore(): Map<string, unknown> {
  return new Map();
}

const read = (store: Map<string, unknown>) => (key: string): Promise<unknown | undefined> =>
  Promise.resolve(store.has(key) ? store.get(key) : undefined);

const write = (store: Map<string, unknown>) => (key: string, value: unknown): Promise<void> => {
  store.set(key, value);
  return Promise.resolve();
};

test('hashLoginAttemptKey is stable and distinct for different inputs', () => {
  const a1 = hashLoginAttemptKey('1.1.1.1', 'a@b.com');
  const a2 = hashLoginAttemptKey('1.1.1.1', 'a@b.com');
  const b = hashLoginAttemptKey('1.1.1.1', 'C@B.com');
  const c = hashLoginAttemptKey('2.2.2.2', 'a@b.com');
  assert.equal(a1, a2);
  assert.notEqual(a1, b, 'case-insensitive email hashed equal');
  assert.notEqual(a1, c, 'different IPs hash differently');
});

test('recordFailedLoginAttempt accumulates attempts and blocks after the threshold', async () => {
  const store = makeStore();
  const max = MAX_FAILED_LOGIN_ATTEMPTS;
  let blocked = false;
  for (let i = 0; i < max; i += 1) {
    const res = await recordFailedLoginAttempt('127.0.0.1', 'a@b.com', read(store), write(store));
    blocked = res.blocked;
  }
  assert.equal(blocked, true, 'blocks after MAX_FAILED_LOGIN_ATTEMPTS');
  const blocked2 = await isLoginBanned('127.0.0.1', 'a@b.com', read(store));
  assert.equal(blocked2, true);
});

test('resetLoginThrottle clears attempts and bans', async () => {
  const store = makeStore();
  for (let i = 0; i < MAX_FAILED_LOGIN_ATTEMPTS; i += 1) {
    await recordFailedLoginAttempt('127.0.0.1', 'a@b.com', read(store), write(store));
  }
  await resetLoginThrottle('127.0.0.1', 'a@b.com', read(store), write(store));
  const res = await recordFailedLoginAttempt('127.0.0.1', 'a@b.com', read(store), write(store));
  assert.equal(res.blocked, false);
  assert.equal(await isLoginBanned('127.0.0.1', 'a@b.com', read(store)), false);
});

test('recording attempts does not block for other users or IPs', async () => {
  const store = makeStore();
  for (let i = 0; i < MAX_FAILED_LOGIN_ATTEMPTS + 3; i += 1) {
    await recordFailedLoginAttempt('127.0.0.1', 'a@b.com', read(store), write(store));
  }
  assert.equal(await isLoginBanned('127.0.0.1', 'other@x.com', read(store)), false);
  assert.equal(await isLoginBanned('9.9.9.9', 'a@b.com', read(store)), false);
});
