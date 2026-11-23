import crypto from 'node:crypto';
import type { SocialPostDraft } from '../types/marketplace';

export interface LinkedInPublishPayload {
  text: string;
  targetUrl?: string;
  title?: string;
  summary?: string;
}

export interface LinkedInConfig {
  accessToken: string;
  authorUrn: string;
}

export interface InstagramPublishPayload {
  imageUrl: string;
  caption: string;
}

export interface InstagramConfig {
  accessToken: string;
  instagramAccountId: string;
}

export interface FacebookPublishPayload {
  message: string;
  link?: string;
}

export interface FacebookConfig {
  pageId: string;
  pageAccessToken: string;
}

export interface YouTubeChapterMarker {
  timestamp: string;
  title: string;
}

export interface YouTubeSyndicationInput {
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
  chapters?: YouTubeChapterMarker[];
}

export interface YouTubeVideoMetadata {
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  privacyStatus: 'public' | 'unlisted' | 'private';
  formattedChapters: string;
}

export interface SocialPublishResult {
  ok: boolean;
  postId?: string;
  shareUrn?: string;
  containerId?: string;
  status?: number;
  error?: string;
}

export interface SocialDispatchOptions {
  fetchFn?: typeof fetch;
  secret?: string;
  linkedInConfig?: LinkedInConfig;
  instagramConfig?: InstagramConfig;
  facebookConfig?: FacebookConfig;
  webhookUrl?: string;
}

/**
 * Publishes a text post or rich article share to LinkedIn via the REST Posts API.
 * Automatically clamps commentary to 3,000 characters per LinkedIn specifications.
 */
export async function publishToLinkedIn(
  payload: LinkedInPublishPayload,
  config: LinkedInConfig,
  fetchFn?: typeof fetch
): Promise<SocialPublishResult> {
  if (!config || !config.accessToken || !config.authorUrn) {
    return { ok: false, error: 'LinkedIn accessToken and authorUrn are required' };
  }

  let text = payload.text || '';
  if (text.length > 3000) {
    text = text.slice(0, 3000);
  }

  const customFetch = fetchFn || fetch;
  const body: Record<string, any> = {
    author: config.authorUrn,
    commentary: text,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
  };

  if (payload.targetUrl) {
    body.content = {
      article: {
        source: payload.targetUrl,
        title: payload.title || 'Digital Wealth Creators Article',
        description: payload.summary || '',
      },
    };
  }

  try {
    const res = await customFetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return { ok: false, status: res.status, error: `LinkedIn API error HTTP ${res.status}` };
    }

    const data = await res.json().catch(() => ({}));
    const shareUrn = res.headers.get('x-restli-id') || data.id || 'urn:li:share:mock';
    return { ok: true, postId: shareUrn, shareUrn, status: res.status };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'LinkedIn network error';
    return { ok: false, error };
  }
}

/**
 * Publishes media to Instagram via Meta Graph API two-step container flow:
 * 1. POST /{ig_user_id}/media to create media container
 * 2. POST /{ig_user_id}/media_publish to publish container
 */
export async function publishToInstagram(
  payload: InstagramPublishPayload,
  config: InstagramConfig,
  fetchFn?: typeof fetch
): Promise<SocialPublishResult> {
  if (!payload.imageUrl || !/^https:\/\//i.test(payload.imageUrl)) {
    return { ok: false, error: 'Instagram requires a public HTTPS media URL' };
  }

  if (!config || !config.accessToken || !config.instagramAccountId) {
    return { ok: false, error: 'Instagram accessToken and instagramAccountId are required' };
  }

  const customFetch = fetchFn || fetch;

  try {
    // Step 1: Create media container
    const containerRes = await customFetch(
      `https://graph.facebook.com/v21.0/${config.instagramAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: payload.imageUrl,
          caption: payload.caption,
          access_token: config.accessToken,
        }),
      }
    );

    if (!containerRes.ok) {
      return {
        ok: false,
        status: containerRes.status,
        error: `Instagram container creation failed: HTTP ${containerRes.status}`,
      };
    }

    const containerData = await containerRes.json().catch(() => ({}));
    const containerId = containerData.id;

    // Step 2: Publish media container
    const publishRes = await customFetch(
      `https://graph.facebook.com/v21.0/${config.instagramAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: config.accessToken,
        }),
      }
    );

    if (!publishRes.ok) {
      return {
        ok: false,
        status: publishRes.status,
        error: `Instagram media publish failed: HTTP ${publishRes.status}`,
      };
    }

    const publishData = await publishRes.json().catch(() => ({}));
    return { ok: true, postId: publishData.id, containerId, status: publishRes.status };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Instagram network error';
    return { ok: false, error };
  }
}

/**
 * Publishes a status update or link to a Facebook Page via Meta Graph API POST /{page_id}/feed.
 */
export async function publishToFacebook(
  payload: FacebookPublishPayload,
  config: FacebookConfig,
  fetchFn?: typeof fetch
): Promise<SocialPublishResult> {
  if (!config || !config.pageAccessToken || !config.pageAccessToken.trim()) {
    return { ok: false, error: 'Facebook pageAccessToken is required' };
  }

  if (!config.pageId || !config.pageId.trim()) {
    return { ok: false, error: 'Facebook pageId is required' };
  }

  const customFetch = fetchFn || fetch;

  try {
    const body: Record<string, any> = {
      message: payload.message,
      access_token: config.pageAccessToken,
    };
    if (payload.link) {
      body.link = payload.link;
    }

    const res = await customFetch(`https://graph.facebook.com/v21.0/${config.pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return { ok: false, status: res.status, error: `Facebook API returned HTTP ${res.status}` };
    }

    const data = await res.json().catch(() => ({}));
    return { ok: true, postId: data.id, status: res.status };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Facebook network error';
    return { ok: false, error };
  }
}

/**
 * Formats YouTube video upload metadata including tags, category ID, privacy status,
 * and structured chapter timestamps appended to the video description.
 */
export function formatYouTubeVideoMetadata(input: YouTubeSyndicationInput): YouTubeVideoMetadata {
  const tags =
    Array.isArray(input.tags) && input.tags.length > 0
      ? input.tags
      : ['digital wealth', 'ai engineering'];
  const categoryId = input.categoryId || '27';
  const privacyStatus = input.privacyStatus || 'public';

  let formattedChapters = '';
  if (Array.isArray(input.chapters) && input.chapters.length > 0) {
    formattedChapters = input.chapters.map((c) => `${c.timestamp} - ${c.title}`).join('\n');
  }

  const fullDescription = formattedChapters
    ? `${input.description}\n\nTimestamps:\n${formattedChapters}`
    : input.description;

  return {
    title: input.title,
    description: fullDescription,
    tags,
    categoryId,
    privacyStatus,
    formattedChapters,
  };
}

/**
 * Dispatches a draft payload to an outbound webhook, optionally cryptographically
 * signing the body with HMAC-SHA256 in the X-Social-Signature header.
 */
export async function dispatchSignedSocialWebhook(
  draft: SocialPostDraft,
  webhookUrl: string,
  secret?: string,
  fetchFn?: typeof fetch
): Promise<SocialPublishResult> {
  const customFetch = fetchFn || fetch;
  const bodyString = JSON.stringify(draft);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (secret) {
    const signature = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
    headers['X-Social-Signature'] = `sha256=${signature}`;
  }

  try {
    const res = await customFetch(webhookUrl, {
      method: 'POST',
      headers,
      body: bodyString,
    });
    return {
      ok: res.ok,
      status: res.status,
      ...(res.ok ? {} : { error: `Webhook returned HTTP ${res.status}` }),
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Webhook network error';
    return { ok: false, error };
  }
}

/**
 * Universal social publisher that automatically routes to the appropriate direct adapter
 * (LinkedIn, Instagram, Facebook) or outbound signed webhook based on draft platform.
 */
export async function publishSocialPost(
  draft: SocialPostDraft,
  options: SocialDispatchOptions = {}
): Promise<SocialPublishResult> {
  if (draft.platform === 'linkedin') {
    const linkedInConfig: LinkedInConfig = options.linkedInConfig || {
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN || 'mock_token',
      authorUrn: process.env.LINKEDIN_AUTHOR_URN || 'urn:li:person:mock',
    };
    return publishToLinkedIn(
      {
        text: draft.content,
        targetUrl: draft.targetUrl,
        title: draft.sourceTitle,
      },
      linkedInConfig,
      options.fetchFn
    );
  }

  if (draft.platform === 'instagram') {
    const instagramConfig: InstagramConfig = options.instagramConfig || {
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || 'mock_token',
      instagramAccountId: process.env.INSTAGRAM_ACCOUNT_ID || '123',
    };
    const imageUrl =
      draft.imageUrl ||
      draft.mediaUrl ||
      'https://site.org/img.png';
    return publishToInstagram(
      {
        imageUrl,
        caption: draft.content,
      },
      instagramConfig,
      options.fetchFn
    );
  }

  if (draft.platform === 'facebook') {
    const facebookConfig: FacebookConfig = options.facebookConfig || {
      pageId: process.env.FACEBOOK_PAGE_ID || 'fb_page_1',
      pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || 'fb_token',
    };
    return publishToFacebook(
      {
        message: draft.content,
        link: draft.targetUrl,
      },
      facebookConfig,
      options.fetchFn
    );
  }

  // Default webhook dispatch (for 'x', 'whatsapp_group', 'youtube', or webhook fallback)
  const webhookUrl =
    options.webhookUrl ||
    process.env.SOCIAL_DISPATCH_WEBHOOK_URL ||
    'https://api.site.org/webhook/social';
  const secret = options.secret || process.env.SOCIAL_WEBHOOK_SECRET;

  return dispatchSignedSocialWebhook(draft, webhookUrl, secret, options.fetchFn);
}
