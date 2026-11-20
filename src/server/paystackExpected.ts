/**
 * Paystack expected-amount bookkeeping (P2 fix).
 *
 * When a transaction is initialized the server records the expected amount in
 * kobo per reference (local runtime store + Supabase KV). Verification and
 * webhook handling then refuse to mark a payment settled when the gateway
 * reports a different amount than the one we asked Paystack to charge.
 */

export interface ExpectedRefRecord {
  amountKobo: number;
  currency: string;
  email?: string;
  recordedAt: string;
}

export const EXPECTED_REFS_LOCAL_KEY = 'paystack_expected_refs';
export const EXPECTED_REFS_KV_KEY = 'paystack_expected_refs';

export function buildExpectedRefRecord(
  amountKobo: number,
  currency: string,
  email?: string,
  nowIso: string = new Date().toISOString()
): ExpectedRefRecord {
  return {
    amountKobo: Math.round(amountKobo),
    currency,
    email: email ? email.trim().toLowerCase() : undefined,
    recordedAt: nowIso,
  };
}

export function amountsMatch(expectedKobo: number, actualKobo: number): boolean {
  if (!Number.isFinite(expectedKobo) || !Number.isFinite(actualKobo)) return false;
  if (expectedKobo <= 0 || actualKobo <= 0) return false;
  return Math.round(expectedKobo) === Math.round(actualKobo);
}

export interface VerifyInput {
  /** Paystack verify `data.status` when the gateway call succeeded. */
  gatewayStatus?: string | undefined;
  /** Paystack verify `data.amount` (kobo) when the gateway call succeeded. */
  gatewayAmountKobo?: number | undefined;
  /** True when the signed webhook already recorded this reference as settled. */
  webhookConfirmed: boolean;
  /** Amount (kobo) we initialized Paystack for, when known. */
  expectedAmountKobo?: number | null | undefined;
  /** True when the Paystack verify API call itself failed. */
  gatewayUnreachable?: boolean;
}

export interface VerifyOutcome {
  verified: boolean;
  message: string;
}

export function evaluatePaystackVerification(input: VerifyInput): VerifyOutcome {
  const expected = input.expectedAmountKobo ?? null;
  const gatewayPaid = input.gatewayStatus === 'success';

  if (gatewayPaid) {
    if (expected !== null) {
      const actual = input.gatewayAmountKobo;
      if (typeof actual !== 'number' || !amountsMatch(expected, actual)) {
        return {
          verified: false,
          message:
            'Payment settled for an amount that does not match this transaction ' +
            `expected ${(expected / 100).toFixed(2)} NGN. Manual review required.`,
        };
      }
    }
    return { verified: true, message: 'Verified via Paystack API' };
  }

  if (input.gatewayUnreachable) {
    if (input.webhookConfirmed) {
      // The webhook only records references whose amount matched at event time.
      return { verified: true, message: 'Verified via Paystack Webhook' };
    }
    return { verified: false, message: 'Paystack verification error' };
  }

  if (input.webhookConfirmed) {
    return { verified: true, message: 'Verified via Paystack Webhook' };
  }

  return { verified: false, message: 'Transaction not completed yet' };
}
