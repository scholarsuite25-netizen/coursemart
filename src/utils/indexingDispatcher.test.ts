import { describe, it, expect } from './testExpect.ts';
import {
  publishGoogleIndexingNotification,
  pingWebSubHubs,
  pingSearchEngines,
  dispatchSearchIndexing,
  DEFAULT_WEBSUB_HUBS,
} from './indexingDispatcher.ts';

describe('Search Indexing Dispatcher', () => {
  it('publishGoogleIndexingNotification rejects non-HTTP/HTTPS schemes', async () => {
    const res = await publishGoogleIndexingNotification('ftp://example.com/file', 'URL_UPDATED', { token: 'tok' });
    expect(res.ok).toBe(false);
    expect(/invalid url/i.test(res.error || '')).toBe(true);
  });

  it('publishGoogleIndexingNotification rejects invalid notification types', async () => {
    const res = await publishGoogleIndexingNotification('https://example.com/post', 'INVALID_TYPE' as any, { token: 'tok' });
    expect(res.ok).toBe(false);
    expect(/invalid notification type/i.test(res.error || '')).toBe(true);
  });

  it('publishGoogleIndexingNotification reports missing credentials when null is provided', async () => {
    const res = await publishGoogleIndexingNotification('https://example.com/post', 'URL_UPDATED', null);
    expect(res.ok).toBe(false);
    expect(/missing indexing credentials/i.test(res.error || '')).toBe(true);
  });

  it('publishGoogleIndexingNotification performs offline simulation when credentials are omitted', async () => {
    const res = await publishGoogleIndexingNotification('https://example.com/post', 'URL_UPDATED');
    expect(res.ok).toBe(true);
    expect(res.simulated).toBe(true);
    expect(res.message?.includes('Simulated')).toBe(true);
  });

  it('publishGoogleIndexingNotification executes HTTP request with mockFetch and valid payload', async () => {
    let capturedUrl = '';
    let capturedHeaders: any = {};
    let capturedBody: any = {};

    const mockFetch: typeof fetch = async (input, init) => {
      capturedUrl = input.toString();
      capturedHeaders = init?.headers;
      capturedBody = JSON.parse(init?.body as string);
      return new Response(JSON.stringify({ ok: true, urlNotificationMetadata: { url: capturedBody.url } }), {
        status: 200,
      });
    };

    const res = await publishGoogleIndexingNotification(
      'https://digitalwealthcreators.org.ng/blog/ai-future',
      'URL_UPDATED',
      { accessToken: 'test_token_abc' },
      mockFetch
    );

    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(capturedUrl).toBe('https://indexing.googleapis.com/v3/urlNotifications:publish');
    expect((capturedHeaders as any)['Authorization']).toBe('Bearer test_token_abc');
    expect(capturedBody.url).toBe('https://digitalwealthcreators.org.ng/blog/ai-future');
    expect(capturedBody.type).toBe('URL_UPDATED');
  });

  it('publishGoogleIndexingNotification gracefully handles HTTP 429 rate limits', async () => {
    const mockFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ error: 'Too Many Requests' }), { status: 429 });

    const res = await publishGoogleIndexingNotification(
      'https://digitalwealthcreators.org.ng/blog/post',
      'URL_UPDATED',
      { token: 'any' },
      mockFetch
    );

    expect(res.ok).toBe(false);
    expect(res.status).toBe(429);
    expect(/rate limit/i.test(res.error || '')).toBe(true);
  });

  it('publishGoogleIndexingNotification handles non-JSON HTTP 500 HTML responses', async () => {
    const mockFetch: typeof fetch = async () =>
      new Response('<html><body>500 Internal Server Error</body></html>', {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      });

    const res = await publishGoogleIndexingNotification(
      'https://digitalwealthcreators.org.ng/blog/test',
      'URL_UPDATED',
      { token: 'secret-tok' },
      mockFetch
    );

    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
    expect(res.error).toBe('HTTP error 500');
    expect(typeof res.data).toBe('string');
    expect((res.data as string)).toContain('500 Internal Server Error');
  });

  it('pingWebSubHubs sends form-urlencoded notification to default hubs', async () => {
    const requestedUrls: string[] = [];
    const bodies: string[] = [];

    const mockFetch: typeof fetch = async (input, init) => {
      requestedUrls.push(input.toString());
      bodies.push(init?.body as string);
      return new Response(null, { status: 204 });
    };

    const results = await pingWebSubHubs('https://digitalwealthcreators.org.ng/api/feed.xml', [], mockFetch);
    expect(results.length).toBe(DEFAULT_WEBSUB_HUBS.length);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(bodies[0]).toContain('hub.mode=publish');
    expect(bodies[0]).toContain(encodeURIComponent('https://digitalwealthcreators.org.ng/api/feed.xml'));
  });

  it('pingSearchEngines sends requests to Google and Bing ping endpoints', async () => {
    const pingedEngines: string[] = [];

    const mockFetch: typeof fetch = async (input) => {
      pingedEngines.push(input.toString());
      return new Response('OK', { status: 200 });
    };

    const results = await pingSearchEngines('https://digitalwealthcreators.org.ng/sitemap.xml', mockFetch);
    expect(results.length).toBe(2);
    expect(results.every((r) => r.ok && r.status === 200)).toBe(true);
    expect(pingedEngines.some((u) => u.includes('google.com/ping'))).toBe(true);
    expect(pingedEngines.some((u) => u.includes('bing.com/ping'))).toBe(true);
  });

  it('dispatchSearchIndexing coordinates and aggregates indexing submissions', async () => {
    const mockFetch: typeof fetch = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });

    const summary = await dispatchSearchIndexing({
      urls: ['https://digitalwealthcreators.org.ng/blog/post-1', 'https://digitalwealthcreators.org.ng/blog/post-2'],
      feedUrl: 'https://digitalwealthcreators.org.ng/api/feed.xml',
      sitemapUrl: 'https://digitalwealthcreators.org.ng/sitemap.xml',
      fetchFn: mockFetch,
    });

    expect(summary.ok).toBe(true);
    expect(summary.googleIndexing.length).toBe(2);
    expect(summary.webSubPings.length).toBeGreaterThan(0);
    expect(summary.searchEnginePings.length).toBe(2);
    expect(summary.timestamp).toBeTruthy();
  });
});
