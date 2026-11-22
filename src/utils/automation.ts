import type {
  EmailBroadcastAudience,
  EventRegistration,
  OrderStatus,
  PaymentMethod,
  SocialPlatform,
  SocialPostDraft,
  UserAccount,
} from '../types/marketplace';

export interface OptedInSubscriber {
  email: string;
  name: string;
  source: 'account' | 'event';
}

/**
 * Payment Safety (Option C):
 * Instant Paystack/Card checkout unlocks access only upon verified card/Paystack transaction.
 * Manual GTB transfers MUST remain `pending` until human admin manually verifies bank settlement.
 */
export function resolveInitialOrderStatus(
  paymentMethod: PaymentMethod,
  paystackVerified: boolean = false
): OrderStatus {
  if (paymentMethod === 'gtb_whatsapp') {
    return 'pending';
  }
  if (paymentMethod === 'paystack' || paymentMethod === 'card') {
    return paystackVerified === true ? 'completed' : 'pending';
  }
  return 'pending';
}

export function getOptedInSubscribers(
  users: UserAccount[],
  registrations: EventRegistration[]
): OptedInSubscriber[] {
  const byEmail = new Map<string, OptedInSubscriber>();

  for (const user of users) {
    if (user.newsletterOptIn) {
      const normalized = user.email.trim().toLowerCase();
      if (normalized) {
        byEmail.set(normalized, {
          email: normalized,
          name: user.name,
          source: 'account',
        });
      }
    }
  }

  for (const reg of registrations) {
    if (reg.newsletterOptIn) {
      const normalized = reg.email.trim().toLowerCase();
      if (normalized && !byEmail.has(normalized)) {
        byEmail.set(normalized, {
          email: normalized,
          name: reg.fullName,
          source: 'event',
        });
      }
    }
  }

  return Array.from(byEmail.values());
}

export function resolveBroadcastRecipients(
  audience: EmailBroadcastAudience,
  users: UserAccount[],
  registrations: EventRegistration[],
  eventIdFilter?: string
): Array<{ email: string; name: string }> {
  if (audience === 'newsletter_opted_in') {
    return getOptedInSubscribers(users, registrations).map(({ email, name }) => ({
      email,
      name,
    }));
  }

  if (audience === 'event_registrants') {
    const map = new Map<string, string>();
    for (const reg of registrations) {
      if (eventIdFilter && reg.eventId !== eventIdFilter) continue;
      const email = reg.email.trim().toLowerCase();
      if (email) map.set(email, reg.fullName);
    }
    return Array.from(map.entries()).map(([email, name]) => ({ email, name }));
  }

  // Fallback: all registered account holders who haven't explicitly opted out (only used for transactional announcements)
  return users
    .filter((u) => Boolean(u.newsletterOptIn))
    .map((u) => ({ email: u.email.trim().toLowerCase(), name: u.name }));
}

export function buildDeterministicSocialDrafts(input: {
  sourceType: SocialPostDraft['sourceType'];
  sourceId: string;
  sourceTitle: string;
  summary: string;
  targetPath: string;
  category?: string;
}): Array<Omit<SocialPostDraft, 'id' | 'status' | 'createdAt' | 'updatedAt'>> {
  const baseTag = (input.category || 'Engineering').replace(/[^a-zA-Z0-9]/g, '');
  const nowHashtags = ['#DigitalWealthCreators', `#${baseTag || 'Tech'}`, '#VibeCoding'];

  return [
    {
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceTitle: input.sourceTitle,
      platform: 'linkedin',
      content: `${input.sourceTitle}\n\n${input.summary}\n\nExplore full details and resources on DIGITAL WEALTH CREATORS: ${input.targetPath}`,
      hashtags: [...nowHashtags, '#SoftwareArchitecture'],
      generatedBy: 'template',
    },
    {
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceTitle: input.sourceTitle,
      platform: 'x',
      content: `New on DIGITAL WEALTH CREATORS: ${input.sourceTitle} — ${input.summary.slice(0, 140)} ${input.targetPath}`,
      hashtags: nowHashtags,
      generatedBy: 'template',
    },
    {
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceTitle: input.sourceTitle,
      platform: 'whatsapp_group',
      content: `*${input.sourceTitle}*\n\n${input.summary}\n\nOpen here: ${input.targetPath}\n\n_(Copy & paste manually into your official WhatsApp Community group — zero automated blasting)_`,
      hashtags: [],
      generatedBy: 'template',
    },
  ];
}

export function buildPlatformShareIntentUrl(
  platform: SocialPlatform,
  text: string,
  url: string
): string | null {
  if (platform === 'x') {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  }
  if (platform === 'linkedin') {
    return `https://www.linkedin.com/feed/?shareActive=true&mini=true&text=${encodeURIComponent(`${text}\n\n${url}`)}`;
  }
  // WhatsApp group posts stay strictly manual copy/paste or user-initiated composer
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
}
