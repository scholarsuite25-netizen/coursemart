export type PaystackChannel =
  | 'card'
  | 'bank_transfer'
  | 'ussd'
  | 'bank'
  | 'qr'
  | 'mobile_money';

export type PaystackPaymentOptionId = 'all' | 'card' | 'bank_transfer' | 'ussd';

export interface PaystackPaymentOption {
  id: PaystackPaymentOptionId;
  label: string;
  subtitle: string;
  channels: PaystackChannel[];
}

export const ALLOWED_PAYSTACK_CHANNELS: ReadonlySet<PaystackChannel> = new Set([
  'card',
  'bank_transfer',
  'ussd',
  'bank',
  'qr',
  'mobile_money',
]);

export const PAYSTACK_PAYMENT_OPTIONS: PaystackPaymentOption[] = [
  {
    id: 'all',
    label: 'All Paystack Methods',
    subtitle: 'Card, Bank Transfer, USSD, Bank App & QR',
    channels: ['card', 'bank_transfer', 'ussd', 'bank', 'qr'],
  },
  {
    id: 'card',
    label: 'Debit / Credit Card',
    subtitle: 'Visa, Mastercard & Verve cards',
    channels: ['card'],
  },
  {
    id: 'bank_transfer',
    label: 'Paystack Bank Transfer',
    subtitle: 'Instant auto-verified virtual account',
    channels: ['bank_transfer'],
  },
  {
    id: 'ussd',
    label: 'USSD Code',
    subtitle: '*737#, *901#, *919#, *894# mobile banking',
    channels: ['ussd'],
  },
];

export function resolvePaystackChannels(optionId?: PaystackPaymentOptionId): PaystackChannel[] {
  const matched = PAYSTACK_PAYMENT_OPTIONS.find((opt) => opt.id === optionId);
  return matched ? [...matched.channels] : [...PAYSTACK_PAYMENT_OPTIONS[0].channels];
}

export function sanitizePaystackChannels(input: unknown): PaystackChannel[] {
  if (!Array.isArray(input) || input.length === 0) {
    return resolvePaystackChannels('all');
  }
  const filtered = input.filter(
    (item): item is PaystackChannel =>
      typeof item === 'string' && ALLOWED_PAYSTACK_CHANNELS.has(item as PaystackChannel)
  );
  return filtered.length > 0 ? Array.from(new Set(filtered)) : resolvePaystackChannels('all');
}

export function getPaystackOptionLabel(optionId?: PaystackPaymentOptionId): string {
  const matched = PAYSTACK_PAYMENT_OPTIONS.find((opt) => opt.id === optionId);
  return matched?.label ?? 'Paystack';
}
