import test from 'node:test';
import assert from 'node:assert/strict';
import {
  amountsMatch,
  buildExpectedRefRecord,
  evaluatePaystackVerification,
} from './paystackExpected';

test('buildExpectedRefRecord normalizes kobo amounts and email', () => {
  const rec = buildExpectedRefRecord(49_999.6, 'NGN', ' Buyer@Example.com ', '2026-01-01T00:00:00.000Z');
  assert.equal(rec.amountKobo, 50_000);
  assert.equal(rec.currency, 'NGN');
  assert.equal(rec.email, 'buyer@example.com');
  assert.equal(rec.recordedAt, '2026-01-01T00:00:00.000Z');
});

test('amountsMatch compares rounded kobo and rejects non-positive or invalid amounts', () => {
  assert.equal(amountsMatch(500_000, 500_000), true);
  assert.equal(amountsMatch(500_000.4, 500_000), true);
  assert.equal(amountsMatch(500_000, 100_000), false);
  assert.equal(amountsMatch(0, 0), false);
  assert.equal(amountsMatch(-1, -1), false);
  assert.equal(amountsMatch(Number.NaN, 100), false);
});

test('gateway settlement verifies only when the amount matches the expectation', () => {
  const good = evaluatePaystackVerification({
    gatewayStatus: 'success',
    gatewayAmountKobo: 500_000,
    webhookConfirmed: false,
    expectedAmountKobo: 500_000,
  });
  assert.equal(good.verified, true);
  assert.match(good.message, /Paystack API/i);

  const mismatch = evaluatePaystackVerification({
    gatewayStatus: 'success',
    gatewayAmountKobo: 10_000,
    webhookConfirmed: true,
    expectedAmountKobo: 500_000,
  });
  assert.equal(mismatch.verified, false, 'amount mismatch must win over webhook confirmation');
  assert.match(mismatch.message, /amount/i);

  const missingAmount = evaluatePaystackVerification({
    gatewayStatus: 'success',
    gatewayAmountKobo: undefined,
    webhookConfirmed: false,
    expectedAmountKobo: 500_000,
  });
  assert.equal(missingAmount.verified, false);
});

test('no recorded expectation keeps legacy verification behaviour', () => {
  assert.equal(
    evaluatePaystackVerification({
      gatewayStatus: 'success',
      gatewayAmountKobo: 1,
      webhookConfirmed: false,
      expectedAmountKobo: null,
    }).verified,
    true
  );
  assert.equal(
    evaluatePaystackVerification({
      gatewayStatus: 'failed',
      webhookConfirmed: false,
      expectedAmountKobo: null,
    }).verified,
    false
  );
  assert.equal(
    evaluatePaystackVerification({
      gatewayStatus: 'success',
      webhookConfirmed: false,
    }).verified,
    true
  );
});

test('webhook confirmation verifies when the gateway API is unreachable', () => {
  const viaWebhook = evaluatePaystackVerification({
    webhookConfirmed: true,
    gatewayUnreachable: true,
    expectedAmountKobo: 100,
  });
  assert.equal(viaWebhook.verified, true);
  assert.match(viaWebhook.message, /webhook/i);

  const unreachableNoWebhook = evaluatePaystackVerification({
    webhookConfirmed: false,
    gatewayUnreachable: true,
    expectedAmountKobo: 100,
  });
  assert.equal(unreachableNoWebhook.verified, false);
});
