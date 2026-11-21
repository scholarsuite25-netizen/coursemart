import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMediaSource, resolveMediaUrl, resolveDownloadUrl, getProviderLabel } from './mediaResolver.ts';

test('resolveMediaSource parses various YouTube URLs into embed sources', () => {
  const watchUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=emb_title';
  const resolvedWatch = resolveMediaSource(watchUrl);
  assert.equal(resolvedWatch.provider, 'youtube');
  assert.equal(resolvedWatch.mediaId, 'dQw4w9WgXcQ');
  assert.match(resolvedWatch.embedUrl ?? '', /embed\/dQw4w9WgXcQ/);
  assert.equal(resolvedWatch.isIframe, true);

  const shortUrl = 'https://youtu.be/dQw4w9WgXcQ?si=abcdef123';
  const resolvedShort = resolveMediaSource(shortUrl);
  assert.equal(resolvedShort.provider, 'youtube');
  assert.equal(resolvedShort.mediaId, 'dQw4w9WgXcQ');

  const shortsUrl = 'https://www.youtube.com/shorts/dQw4w9WgXcQ';
  const resolvedShorts = resolveMediaSource(shortsUrl);
  assert.equal(resolvedShorts.provider, 'youtube');
  assert.equal(resolvedShorts.mediaId, 'dQw4w9WgXcQ');
});

test('resolveMediaSource parses Google Drive video URLs into embeddable preview streams', () => {
  const driveViewUrl = 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I/view?usp=sharing';
  const resolved = resolveMediaSource(driveViewUrl);
  assert.equal(resolved.provider, 'google-drive');
  assert.equal(resolved.mediaId, '1A2B3C4D5E6F7G8H9I');
  assert.equal(resolved.embedUrl, 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I/preview');
  assert.equal(resolved.isIframe, true);
});

test('resolveMediaSource handles direct video and fallback canvas', () => {
  const directMp4 = 'https://cdn.example.com/videos/lesson1.mp4';
  const resolvedDirect = resolveMediaSource(directMp4);
  assert.equal(resolvedDirect.provider, 'direct');
  assert.equal(resolvedDirect.directUrl, directMp4);
  assert.equal(resolvedDirect.isIframe, false);

  const resolvedCanvas = resolveMediaSource('');
  assert.equal(resolvedCanvas.provider, 'canvas');
  assert.equal(resolvedCanvas.isIframe, false);
});

test('resolveDownloadUrl converts Google Drive view links to direct 1-click downloads', () => {
  const driveShareLink = 'https://drive.google.com/file/d/1X9Y8Z7W6V5U4T/view?usp=sharing';
  const directDownload = resolveDownloadUrl(driveShareLink);
  assert.equal(directDownload, 'https://drive.google.com/uc?export=download&id=1X9Y8Z7W6V5U4T');

  const regularLink = 'https://example.com/ebooks/vibe-coding.pdf';
  assert.equal(resolveDownloadUrl(regularLink), regularLink);

  const dropboxLink = 'https://www.dropbox.com/s/12345/pack.zip?dl=0';
  assert.equal(resolveDownloadUrl(dropboxLink), 'https://www.dropbox.com/s/12345/pack.zip?dl=1');
});

test('getProviderLabel returns readable provider names', () => {
  assert.equal(getProviderLabel('youtube'), 'YouTube Unlisted');
  assert.equal(getProviderLabel('google-drive'), 'Google Drive Video');
  assert.equal(getProviderLabel('vimeo'), 'Vimeo');
  assert.equal(getProviderLabel('direct'), 'Direct Video');
  assert.equal(getProviderLabel('canvas'), 'Canvas Narrator');
  assert.equal(resolveMediaUrl, resolveMediaSource);
});
