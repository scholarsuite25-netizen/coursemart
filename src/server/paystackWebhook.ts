import crypto from 'node:crypto';

/**
 * Verifies the HMAC-SHA512 x-paystack-signature header sent by Paystack webhooks
 * using a constant-time buffer comparison.
 */
export function verifyPaystackWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  secretKey: string | undefined
): boolean {
  if (!rawBody || !signatureHeader || !secretKey) {
    return false;
  }
  const expected = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
  const provided = signatureHeader.trim().toLowerCase();
  if (expected.length !== provided.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(provided, 'utf8'));
  } catch {
    return false;
  }
}
