export type EmailProviderName = 'emailbump' | 'resend' | 'brevo';
export type ActiveEmailProvider = EmailProviderName | 'none';

export interface EmailProviderResolution {
  provider: ActiveEmailProvider;
  configuredProviders: EmailProviderName[];
  apiKey: string | null;
  apiUrl: string | null;
  fromAddress: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface ProviderHttpRequest {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

const DEFAULT_EMAILBUMP_URL = 'https://emailbump.com/api/v1/emails';
const DEFAULT_FROM_ADDRESS = 'Digital Wealth Creators <onboarding@resend.dev>';

function cleanKey(value: string | undefined): string | null {
  const trimmed = (value || '').trim();
  return trimmed.length > 5 ? trimmed : null;
}

export function normalizePreferredProvider(
  raw: string | undefined
): EmailProviderName | null {
  const v = (raw || '').trim().toLowerCase();
  if (v === 'emailbump' || v === 'emailbumb') return 'emailbump';
  if (v === 'resend') return 'resend';
  if (v === 'brevo') return 'brevo';
  return null;
}

export function resolveEmailProviderConfig(
  env: Record<string, string | undefined>,
  preferredOverride?: string
): EmailProviderResolution {
  const emailbumpKey = cleanKey(env.EMAILBUMP_API_KEY) || cleanKey(env.EMAILBUMB_API_KEY);
  const resendKey = cleanKey(env.RESEND_API_KEY);
  const brevoKey = cleanKey(env.BREVO_API_KEY);

  const configuredProviders: EmailProviderName[] = [];
  if (emailbumpKey) configuredProviders.push('emailbump');
  if (resendKey) configuredProviders.push('resend');
  if (brevoKey) configuredProviders.push('brevo');

  const fromAddress = (env.EMAIL_FROM || '').trim() || DEFAULT_FROM_ADDRESS;
  const emailbumpUrl = (env.EMAILBUMP_API_URL || '').trim() || DEFAULT_EMAILBUMP_URL;

  const preferred =
    normalizePreferredProvider(preferredOverride) ||
    normalizePreferredProvider(env.EMAIL_PROVIDER);

  const keyByProvider: Record<EmailProviderName, string | null> = {
    emailbump: emailbumpKey,
    resend: resendKey,
    brevo: brevoKey,
  };

  let active: ActiveEmailProvider = 'none';
  if (preferred && keyByProvider[preferred]) {
    active = preferred;
  } else if (configuredProviders.length > 0) {
    active = configuredProviders[0];
  }

  return {
    provider: active,
    configuredProviders,
    apiKey: active === 'none' ? null : keyByProvider[active],
    apiUrl:
      active === 'emailbump'
        ? emailbumpUrl
        : active === 'resend'
        ? 'https://api.resend.com/emails'
        : active === 'brevo'
        ? 'https://api.brevo.com/v3/smtp/email'
        : null,
    fromAddress,
  };
}

export function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseSenderAddress(fromAddress: string): { name: string; email: string } {
  const match = fromAddress.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim() || 'Digital Wealth Creators',
      email: match[2].trim(),
    };
  }
  return {
    name: 'Digital Wealth Creators',
    email: fromAddress.trim(),
  };
}

export function buildProviderEmailRequest(
  resolution: EmailProviderResolution,
  recipient: EmailRecipient,
  subject: string,
  html: string
): ProviderHttpRequest {
  if (resolution.provider === 'none' || !resolution.apiKey || !resolution.apiUrl) {
    throw new Error('No active email provider configured.');
  }

  if (resolution.provider === 'emailbump') {
    return {
      url: resolution.apiUrl,
      headers: {
        Authorization: `Bearer ${resolution.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        from: resolution.fromAddress,
        to: [recipient.email],
        subject,
        html,
        text: stripHtmlToPlainText(html),
      },
    };
  }

  if (resolution.provider === 'resend') {
    return {
      url: resolution.apiUrl,
      headers: {
        Authorization: `Bearer ${resolution.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        from: resolution.fromAddress,
        to: [recipient.email],
        subject,
        html,
      },
    };
  }

  const sender = parseSenderAddress(resolution.fromAddress);
  return {
    url: resolution.apiUrl,
    headers: {
      'api-key': resolution.apiKey,
      'Content-Type': 'application/json',
    },
    body: {
      sender,
      to: [{ email: recipient.email, name: recipient.name || recipient.email }],
      subject,
      htmlContent: html,
    },
  };
}
