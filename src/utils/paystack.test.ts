import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  PAYSTACK_PAYMENT_OPTIONS,
  getPaystackOptionLabel,
  resolvePaystackChannels,
  sanitizePaystackChannels,
} from './paystack.ts';
import { verifyPaystackWebhookSignature } from '../server/paystackWebhook.ts';

test('PAYSTACK_PAYMENT_OPTIONS and resolvePaystackChannels expose Card, Bank Transfer, USSD, and All options', () => {
  assert.equal(PAYSTACK_PAYMENT_OPTIONS.length, 4);
  assert.deepEqual(resolvePaystackChannels('card'), ['card']);
  assert.deepEqual(resolvePaystackChannels('bank_transfer'), ['bank_transfer']);
  assert.deepEqual(resolvePaystackChannels('ussd'), ['ussd']);
  assert.deepEqual(resolvePaystackChannels('all'), ['card', 'bank_transfer', 'ussd', 'bank', 'qr']);
  assert.equal(getPaystackOptionLabel('bank_transfer'), 'Paystack Bank Transfer');
});

test('sanitizePaystackChannels strips invalid values and deduplicates channels', () => {
  assert.deepEqual(sanitizePaystackChannels(['card', 'card', 'evil_channel']), ['card']);
  assert.deepEqual(sanitizePaystackChannels(['invalid']), ['card', 'bank_transfer', 'ussd', 'bank', 'qr']);
  assert.deepEqual(sanitizePaystackChannels(undefined), ['card', 'bank_transfer', 'ussd', 'bank', 'qr']);
});

test('verifyPaystackWebhookSignature validates valid HMAC-SHA512 signatures and rejects tampered payloads', () => {
  const secret = 'sk_test_example_secret_123456';
  const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'CM-12345', amount: 6500000 } });
  const validSig = crypto.createHmac('sha512', secret).update(payload).digest('hex');

  assert.equal(verifyPaystackWebhookSignature(payload, validSig, secret), true);
  assert.equal(verifyPaystackWebhookSignature(payload + ' ', validSig, secret), false);
  assert.equal(verifyPaystackWebhookSignature(payload, 'deadbeef', secret), false);
  assert.equal(verifyPaystackWebhookSignature(payload, validSig, ''), false);
});
