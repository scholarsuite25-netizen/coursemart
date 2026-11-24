import test, { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApiApp } from './createApp';

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
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe('POST /api/repurpose/youtube', () => {
  it('returns 401 when the caller has no admin session', async () => {
    const res = await fetch(`${baseUrl}/api/repurpose/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }),
    });
    assert.equal(res.status, 401);
  });

  it('returns 400 when youtubeUrl is missing or not a string', async () => {
    const res = await fetch(`${baseUrl}/api/repurpose/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-test': 'true' },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.ok, false);
    assert.match(data.error, /youtubeUrl is required/i);
  });

  it('returns 400 when youtubeUrl is not a valid YouTube URL', async () => {
    const res = await fetch(`${baseUrl}/api/repurpose/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-test': 'true' },
      body: JSON.stringify({ youtubeUrl: 'https://vimeo.com/12345678' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.ok, false);
    assert.match(data.error, /Invalid YouTube URL/i);
  });

  it('returns 200 with course package and social snippets on valid YouTube URL', async () => {
    const res = await fetch(`${baseUrl}/api/repurpose/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-test': 'true' },
      body: JSON.stringify({
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        customTitle: 'Autonomous Engineering Blueprint',
        targetPrice: 45000,
        category: 'AI & Engineering',
        level: 'Intermediate',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.videoId, 'dQw4w9WgXcQ');
    assert.equal(data.course.title, 'Autonomous Engineering Blueprint');
    assert.equal(data.course.price, 45000);
    assert.ok(data.course.modules.length >= 2);
    assert.ok(data.course.lessonNotes.includes('Key Concepts'));
    assert.ok(data.socialSnippets.facebook.includes('Autonomous Engineering Blueprint'));
    assert.ok(data.socialSnippets.linkedin.includes('Autonomous Engineering Blueprint'));
    assert.ok(data.socialSnippets.x.includes('Autonomous Engineering Blueprint'));
    assert.ok(data.socialSnippets.instagram.includes('Autonomous Engineering Blueprint'));
    assert.ok(data.socialSnippets.whatsapp_group.includes('Autonomous Engineering Blueprint'));
    assert.ok(data.socialSnippets.youtube.length > 0);
  });
});
