import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  publishToLinkedIn,
  publishToInstagram,
  publishToFacebook,
  formatYouTubeVideoMetadata,
  dispatchSignedSocialWebhook,
  publishSocialPost,
} from './socialSyndication';
import type { SocialPostDraft } from '../types/marketplace';

describe('Social Syndication Adapters', () => {
  describe('publishToLinkedIn', () => {
    it('dispatches commentary post with proper headers and author URN', async () => {
      let capturedUrl = '';
      let capturedHeaders: Record<string, string> = {};
      let capturedBody: any = null;

      const mockFetch: typeof fetch = async (input, init) => {
        capturedUrl = input.toString();
        capturedHeaders = (init?.headers as Record<string, string>) || {};
        capturedBody = JSON.parse(init?.body as string);
        return new Response(JSON.stringify({ id: 'urn:li:share:123' }), {
          status: 201,
          headers: { 'x-restli-id': 'urn:li:share:123' },
        });
      };

      const result = await publishToLinkedIn(
        { text: 'Building Autonomous AI Workflows' },
        { accessToken: 'li_token_123', authorUrn: 'urn:li:organization:dwc' },
        mockFetch
      );

      assert.equal(result.ok, true);
      assert.equal(result.shareUrn, 'urn:li:share:123');
      assert.equal(capturedUrl, 'https://api.linkedin.com/rest/posts');
      assert.equal(capturedHeaders['Authorization'], 'Bearer li_token_123');
      assert.equal(capturedHeaders['LinkedIn-Version'], '202401');
      assert.equal(capturedHeaders['X-Restli-Protocol-Version'], '2.0.0');
      assert.equal(capturedBody.author, 'urn:li:organization:dwc');
      assert.equal(capturedBody.commentary, 'Building Autonomous AI Workflows');
    });

    it('attaches article share object when targetUrl is provided', async () => {
      let capturedBody: any = null;

      const mockFetch: typeof fetch = async (_input, init) => {
        capturedBody = JSON.parse(init?.body as string);
        return new Response(JSON.stringify({ id: 'urn:li:share:456' }), { status: 201 });
      };

      const result = await publishToLinkedIn(
        {
          text: 'Check out the new course',
          targetUrl: 'https://digitalwealthcreators.org.ng/course/ai',
          title: 'AI Engineering 101',
          summary: 'Course summary here',
        },
        { accessToken: 'tok', authorUrn: 'urn:li:person:user' },
        mockFetch
      );

      assert.equal(result.ok, true);
      assert.ok(capturedBody.content?.article);
      assert.equal(capturedBody.content.article.source, 'https://digitalwealthcreators.org.ng/course/ai');
      assert.equal(capturedBody.content.article.title, 'AI Engineering 101');
      assert.equal(capturedBody.content.article.description, 'Course summary here');
    });

    it('truncates commentary exceeding 3,000 characters', async () => {
      let passedLength = 0;
      const mockFetch: typeof fetch = async (_input, init) => {
        const body = JSON.parse(init?.body as string);
        passedLength = body.commentary.length;
        return new Response(JSON.stringify({ id: 'urn:li:share:trunc' }), { status: 201 });
      };

      const longText = 'X'.repeat(3500);
      const res = await publishToLinkedIn(
        { text: longText },
        { accessToken: 'token', authorUrn: 'urn:li:person:u' },
        mockFetch
      );

      assert.equal(res.ok, true);
      assert.equal(passedLength, 3000);
    });

    it('handles HTTP 401 Unauthorized cleanly', async () => {
      const mockFetch: typeof fetch = async () =>
        new Response(JSON.stringify({ message: 'Expired token' }), { status: 401 });

      const res = await publishToLinkedIn(
        { text: 'Hello' },
        { accessToken: 'bad_token', authorUrn: 'urn:li:person:u' },
        mockFetch
      );

      assert.equal(res.ok, false);
      assert.equal(res.status, 401);
      assert.match(res.error || '', /401/i);
    });

    it('returns error when config credentials are missing', async () => {
      const res = await publishToLinkedIn(
        { text: 'Hello' },
        { accessToken: '', authorUrn: '' }
      );
      assert.equal(res.ok, false);
      assert.match(res.error || '', /required/i);
    });
  });

  describe('publishToInstagram', () => {
    it('executes 2-step media container and publish flow', async () => {
      let step1Called = false;
      let step2Called = false;
      let capturedContainerBody: any = null;
      let capturedPublishBody: any = null;

      const mockFetch: typeof fetch = async (input, init) => {
        const urlStr = input.toString();
        if (urlStr.endsWith('/media')) {
          step1Called = true;
          capturedContainerBody = JSON.parse(init?.body as string);
          return new Response(JSON.stringify({ id: 'ig_container_888' }), { status: 200 });
        }
        if (urlStr.endsWith('/media_publish')) {
          step2Called = true;
          capturedPublishBody = JSON.parse(init?.body as string);
          return new Response(JSON.stringify({ id: 'ig_post_999' }), { status: 200 });
        }
        return new Response('Not Found', { status: 404 });
      };

      const result = await publishToInstagram(
        {
          imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
          caption: 'Building AI on Instagram #Tech',
        },
        { accessToken: 'ig_token_abc', instagramAccountId: 'ig_user_100' },
        mockFetch
      );

      assert.equal(result.ok, true);
      assert.equal(result.postId, 'ig_post_999');
      assert.equal(result.containerId, 'ig_container_888');
      assert.equal(step1Called, true);
      assert.equal(step2Called, true);
      assert.equal(capturedContainerBody.image_url, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe');
      assert.equal(capturedContainerBody.caption, 'Building AI on Instagram #Tech');
      assert.equal(capturedPublishBody.creation_id, 'ig_container_888');
    });

    it('rejects missing or non-HTTPS media URLs', async () => {
      const emptyRes = await publishToInstagram(
        { imageUrl: '', caption: 'Caption' },
        { accessToken: 'token', instagramAccountId: 'acc' }
      );
      assert.equal(emptyRes.ok, false);
      assert.match(emptyRes.error || '', /public https/i);

      const httpRes = await publishToInstagram(
        { imageUrl: 'http://insecure.org/img.png', caption: 'Caption' },
        { accessToken: 'token', instagramAccountId: 'acc' }
      );
      assert.equal(httpRes.ok, false);
      assert.match(httpRes.error || '', /public https/i);
    });

    it('returns error when config is missing', async () => {
      const res = await publishToInstagram(
        { imageUrl: 'https://site.org/image.png', caption: 'Hello' },
        { accessToken: '', instagramAccountId: '' }
      );
      assert.equal(res.ok, false);
      assert.match(res.error || '', /required/i);
    });
  });

  describe('publishToFacebook', () => {
    it('executes Page feed post with message, link, and token', async () => {
      let capturedUrl = '';
      let capturedBody: any = null;

      const mockFetch: typeof fetch = async (input, init) => {
        capturedUrl = input.toString();
        capturedBody = JSON.parse(init?.body as string);
        return new Response(JSON.stringify({ id: 'fb_feed_post_777' }), { status: 200 });
      };

      const result = await publishToFacebook(
        { message: 'Check out our latest update!', link: 'https://digitalwealthcreators.org.ng' },
        { pageId: 'fb_page_dwc', pageAccessToken: 'fb_token_123' },
        mockFetch
      );

      assert.equal(result.ok, true);
      assert.equal(result.postId, 'fb_feed_post_777');
      assert.ok(capturedUrl.includes('/fb_page_dwc/feed'));
      assert.equal(capturedBody.message, 'Check out our latest update!');
      assert.equal(capturedBody.link, 'https://digitalwealthcreators.org.ng');
      assert.equal(capturedBody.access_token, 'fb_token_123');
    });

    it('rejects missing or empty pageAccessToken', async () => {
      const res = await publishToFacebook(
        { message: 'Hello Facebook' },
        { pageId: 'fb_page_1', pageAccessToken: '' }
      );
      assert.equal(res.ok, false);
      assert.match(res.error || '', /pageAccessToken is required/i);
    });

    it('rejects missing or empty pageId', async () => {
      const res = await publishToFacebook(
        { message: 'Hello Facebook' },
        { pageId: '', pageAccessToken: 'token' }
      );
      assert.equal(res.ok, false);
      assert.match(res.error || '', /pageId is required/i);
    });
  });

  describe('formatYouTubeVideoMetadata', () => {
    it('formats chapters and metadata correctly', () => {
      const meta = formatYouTubeVideoMetadata({
        title: 'Building Autonomous AI Workflows',
        description: 'Complete hands-on engineering walkthrough.',
        tags: ['autonomous ai', 'agents', 'typescript'],
        categoryId: '27',
        privacyStatus: 'public',
        chapters: [
          { timestamp: '00:00', title: 'Introduction & Setup' },
          { timestamp: '05:30', title: 'Architecture Patterns' },
        ],
      });

      assert.equal(meta.title, 'Building Autonomous AI Workflows');
      assert.ok(meta.description.includes('00:00 - Introduction & Setup'));
      assert.ok(meta.description.includes('05:30 - Architecture Patterns'));
      assert.deepEqual(meta.tags, ['autonomous ai', 'agents', 'typescript']);
      assert.equal(meta.categoryId, '27');
      assert.equal(meta.privacyStatus, 'public');
      assert.ok(meta.formattedChapters.includes('05:30 - Architecture Patterns'));
    });

    it('handles missing or empty chapters gracefully', () => {
      const meta = formatYouTubeVideoMetadata({
        title: 'Simple Video',
        description: 'No chapters description.',
        chapters: [],
      });

      assert.equal(meta.title, 'Simple Video');
      assert.equal(meta.formattedChapters, '');
      assert.equal(meta.description, 'No chapters description.');
      assert.deepEqual(meta.tags, ['digital wealth', 'ai engineering']);
    });
  });

  describe('dispatchSignedSocialWebhook', () => {
    it('signs payload with HMAC-SHA256 when secret is provided', async () => {
      let sentHeader = '';
      let sentBody = '';
      const secret = 'test-signing-key-xyz';

      const mockFetch: typeof fetch = async (_input, init) => {
        sentHeader = (init?.headers as Record<string, string>)?.['X-Social-Signature'] || '';
        sentBody = init?.body as string;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      };

      const draft: SocialPostDraft = {
        id: 'draft-test-1',
        sourceType: 'blog',
        sourceId: 'b-1',
        sourceTitle: 'Signed Post',
        platform: 'x',
        content: 'Testing signature',
        hashtags: ['Tech'],
        status: 'posted',
        generatedBy: 'template',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await dispatchSignedSocialWebhook(
        draft,
        'https://api.test.com/hook',
        secret,
        mockFetch
      );

      assert.equal(result.ok, true);
      assert.equal(sentHeader.startsWith('sha256='), true);
      const expectedHash = crypto.createHmac('sha256', secret).update(sentBody).digest('hex');
      assert.equal(sentHeader, `sha256=${expectedHash}`);
    });

    it('omits signature header when secret is omitted', async () => {
      let capturedHeaders: Record<string, string> = {};

      const mockFetch: typeof fetch = async (_input, init) => {
        capturedHeaders = (init?.headers as Record<string, string>) || {};
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      };

      const draft: SocialPostDraft = {
        id: 'draft-test-2',
        sourceType: 'blog',
        sourceId: 'b-2',
        sourceTitle: 'Unsigned Post',
        platform: 'linkedin',
        content: 'Unsigned test',
        hashtags: [],
        status: 'posted',
        generatedBy: 'template',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await dispatchSignedSocialWebhook(
        draft,
        'https://api.test.com/hook',
        undefined,
        mockFetch
      );

      assert.equal(result.ok, true);
      assert.equal(capturedHeaders['X-Social-Signature'], undefined);
    });

    it('handles HTTP 500 error cleanly without throwing', async () => {
      const mockFetch: typeof fetch = async () =>
        new Response('Internal Server Error', { status: 500 });

      const draft: SocialPostDraft = {
        id: 'draft-test-fail',
        sourceType: 'blog',
        sourceId: 'b-fail',
        sourceTitle: 'Failing Webhook Post',
        platform: 'linkedin',
        content: 'Will fail cleanly',
        hashtags: [],
        status: 'scheduled',
        generatedBy: 'template',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = await dispatchSignedSocialWebhook(
        draft,
        'https://api.test.com/fail',
        'sec',
        mockFetch
      );

      assert.equal(res.ok, false);
      assert.equal(res.status, 500);
    });
  });

  describe('publishSocialPost', () => {
    it('preserves exotic unicode and emojis across dispatch', async () => {
      let sentContent = '';

      const mockFetch: typeof fetch = async (_input, init) => {
        const body = JSON.parse(init?.body as string);
        sentContent = body.commentary;
        return new Response(JSON.stringify({ id: 'urn:li:share:emoji' }), { status: 201 });
      };

      const exoticContent = '🚀 Launch Day! Invest ₦50,000 to earn 300% ROI! 🔥💡🇳🇬';
      const draft: SocialPostDraft = {
        id: 'draft-emoji-1',
        sourceType: 'blog',
        sourceId: 'b-3',
        sourceTitle: 'Emoji Blog',
        platform: 'linkedin',
        content: exoticContent,
        hashtags: ['Tech'],
        status: 'draft',
        generatedBy: 'template',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = await publishSocialPost(draft, { fetchFn: mockFetch });
      assert.equal(res.ok, true);
      assert.equal(sentContent, exoticContent);
    });

    it('routes instagram drafts with image url', async () => {
      let instagramPayload: any = null;

      const mockFetch: typeof fetch = async (input, init) => {
        const urlStr = input.toString();
        if (urlStr.endsWith('/media')) {
          instagramPayload = JSON.parse(init?.body as string);
          return new Response(JSON.stringify({ id: 'container_test' }), { status: 200 });
        }
        return new Response(JSON.stringify({ id: 'ig_post_published' }), { status: 200 });
      };

      const draft: SocialPostDraft = {
        id: 'draft-ig',
        sourceType: 'blog',
        sourceId: 'b-ig',
        sourceTitle: 'Instagram Post',
        platform: 'instagram',
        content: 'Instagram caption #Tech',
        hashtags: ['Tech'],
        status: 'draft',
        generatedBy: 'template',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1',
      };

      const res = await publishSocialPost(draft, { fetchFn: mockFetch });
      assert.equal(res.ok, true);
      assert.equal(res.postId, 'ig_post_published');
      assert.equal(instagramPayload.image_url, 'https://images.unsplash.com/photo-1');
    });

    it('routes facebook drafts with link', async () => {
      let fbPayload: any = null;

      const mockFetch: typeof fetch = async (_input, init) => {
        fbPayload = JSON.parse(init?.body as string);
        return new Response(JSON.stringify({ id: 'fb_post_test' }), { status: 200 });
      };

      const draft: SocialPostDraft = {
        id: 'draft-fb',
        sourceType: 'blog',
        sourceId: 'b-fb',
        sourceTitle: 'Facebook Post',
        platform: 'facebook',
        content: 'Facebook post text',
        hashtags: ['Tech'],
        status: 'draft',
        generatedBy: 'template',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targetUrl: 'https://digitalwealthcreators.org.ng/blog/fb-post',
      };

      const res = await publishSocialPost(draft, { fetchFn: mockFetch });
      assert.equal(res.ok, true);
      assert.equal(res.postId, 'fb_post_test');
      assert.equal(fbPayload.link, 'https://digitalwealthcreators.org.ng/blog/fb-post');
    });
  });
});
