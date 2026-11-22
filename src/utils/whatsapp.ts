import { formatNaira } from './currency.ts';

export const TINTOL_PAYMENT_DETAILS = {
  bankName: 'GTB',
  bankFullName: 'Guaranty Trust Bank (GTB)',
  accountNumber: '0029103844',
  accountName: 'Tintol Business Services',
  phoneDigits: '2348034710699',
  phoneE164: '+2348034710699',
  phoneDisplay: '+234 803 471 0699',
} as const;

export function buildCallUrl(phoneDigits: string = TINTOL_PAYMENT_DETAILS.phoneDigits): string {
  const clean = phoneDigits.replace(/[^0-9+]/g, '');
  const withPlus = clean.startsWith('+') ? clean : `+${clean}`;
  return `tel:${withPlus}`;
}

export function buildWhatsAppUrl(
  message?: string,
  phoneDigits: string = TINTOL_PAYMENT_DETAILS.phoneDigits
): string {
  const cleanDigits = phoneDigits.replace(/[^0-9]/g, '');
  const base = `https://wa.me/${cleanDigits}`;
  if (!message || !message.trim()) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

export interface BankTransferProofInput {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: string[];
  total: number;
  paymentReference?: string;
}

export function buildBankTransferWhatsAppMessage(input: BankTransferProofInput): string {
  const lines = [
    `Hello ${TINTOL_PAYMENT_DETAILS.accountName},`,
    `I have completed a GTB bank transfer for my order:`,
    `Order ID: ${input.orderId}`,
    `Customer: ${input.customerName} (${input.customerEmail})`,
    `Items: ${input.items.join(', ')}`,
    `Amount Paid: ${formatNaira(input.total)}`,
    `Destination: ${TINTOL_PAYMENT_DETAILS.bankName} · ${TINTOL_PAYMENT_DETAILS.accountNumber} (${TINTOL_PAYMENT_DETAILS.accountName})`,
  ];

  if (input.paymentReference?.trim()) {
    lines.push(`Transfer Ref / Sender: ${input.paymentReference.trim()}`);
  }

  lines.push('Please verify my payment receipt and unlock access. Thank you!');
  return lines.join('\n');
}

export const TELEGRAM_DETAILS = {
  channelUrl: 'https://t.me/digitalwealthcreators',
  communityUrl: 'https://t.me/digitalwealthcreators',
  supportUrl: 'https://t.me/digitalwealthcreators',
  handle: '@digitalwealthcreators',
} as const;

export function buildTelegramUrl(handleOrPath: string = 'digitalwealthcreators'): string {
  const clean = handleOrPath.replace(/^@/, '').trim();
  return `https://t.me/${clean}`;
}

export function buildProductShareUrl(
  channel: 'whatsapp' | 'x' | 'linkedin' | 'telegram',
  title: string,
  targetUrl: string
): string {
  const text = `Check out "${title}" — ${targetUrl}`;
  switch (channel) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(text)}`;
    case 'telegram':
      return `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(
        `Check out "${title}"`
      )}`;
    case 'x':
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Check out "${title}"`
      )}&url=${encodeURIComponent(targetUrl)}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        targetUrl
      )}`;
  }
}

export function isValidWhatsAppInviteUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return /^https:\/\/(chat\.whatsapp\.com|wa\.me)\/[A-Za-z0-9_-]{6,}/.test(trimmed);
}
