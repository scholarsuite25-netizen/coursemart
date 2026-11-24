import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApiApp } from './createApp.ts';

describe('Server SEO & Search Indexing Endpoints', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    const app = createApiApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('GET /sitemap.xml returns valid XML sitemap with status 200', async () => {
    const res = await fetch(`${baseUrl}/sitemap.xml`);
    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('xml'), `Expected xml content-type, got: ${contentType}`);
    const text = await res.text();
    assert.ok(text.startsWith('<?xml'), 'Must start with XML declaration');
    assert.ok(text.includes('<urlset'), 'Must contain urlset element');
    assert.ok(text.includes('</urlset>'), 'Must terminate with urlset closing tag');
  });

  it('GET /api/sitemap.xml also returns valid XML sitemap', async () => {
    const res = await fetch(`${baseUrl}/api/sitemap.xml`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('<urlset'));
  });

  it('GET /robots.txt returns valid robots specification with status 200', async () => {
    const res = await fetch(`${baseUrl}/robots.txt`);
    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('text/plain'), `Expected text/plain, got: ${contentType}`);
    const text = await res.text();
    assert.ok(text.includes('User-agent: *'));
    assert.ok(text.includes('Disallow: /admin'));
    assert.ok(text.includes('Disallow: /api/'));
    assert.ok(text.includes('Allow: /api/feed.xml'));
    assert.ok(text.includes('Sitemap:'));
  });

  it('GET /api/robots.txt also returns valid robots specification', async () => {
    const res = await fetch(`${baseUrl}/api/robots.txt`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('User-agent: *'));
  });

  it('GET /api/feed.xml and /rss.xml return valid RSS 2.0 channel', async () => {
    const res1 = await fetch(`${baseUrl}/api/feed.xml`);
    assert.equal(res1.status, 200);
    const text1 = await res1.text();
    assert.ok(text1.includes('<rss version="2.0"'));
    assert.ok(text1.includes('xmlns:atom="http://www.w3.org/2005/Atom"'));
    assert.ok(text1.includes('<channel>'));

    const res2 = await fetch(`${baseUrl}/rss.xml`);
    assert.equal(res2.status, 200);
    const text2 = await res2.text();
    assert.ok(text2.includes('<rss version="2.0"'));
    assert.ok(text2.includes('xmlns:atom="http://www.w3.org/2005/Atom"'));
  });

  it('POST /api/indexing/submit rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/indexing/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://digitalwealthcreators.org.ng/blog/article' }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.ok, false);
  });

  it('POST /api/indexing/submit processes submission for authorized administrator', async () => {
    const res = await fetch(`${baseUrl}/api/indexing/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-test': 'true',
      },
      body: JSON.stringify({
        url: 'https://digitalwealthcreators.org.ng/blog/live-article',
        type: 'URL_UPDATED',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.summary);
    assert.equal(data.summary.ok, true);
    assert.equal(data.summary.googleIndexing.length, 1);
    assert.equal(data.summary.googleIndexing[0].url, 'https://digitalwealthcreators.org.ng/blog/live-article');
  });
});
