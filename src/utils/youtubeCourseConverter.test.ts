import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractYouTubeVideoId,
  convertYouTubeUrlToCourse,
} from './youtubeCourseConverter.ts';

test('extractYouTubeVideoId parses standard, shortened, and embed links', () => {
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(
    extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=42'),
    'dQw4w9WgXcQ'
  );
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(extractYouTubeVideoId('https://example.com/not-youtube'), null);
  assert.equal(extractYouTubeVideoId(''), null);
});

test('convertYouTubeUrlToCourse transforms YouTube URL into structured course & social assets', () => {
  const result = convertYouTubeUrlToCourse({
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    customTitle: 'Building Autonomous AI Workflows',
    targetPrice: 35000,
    category: 'Vibe Coding & AI',
  });

  assert.equal(result.title, 'Building Autonomous AI Workflows');
  assert.equal(result.videoId, 'dQw4w9WgXcQ');
  assert.equal(result.price, 35000);
  assert.equal(result.originalPrice, 56000);
  assert.equal(result.category, 'Vibe Coding & AI');
  assert.equal(result.modules.length, 3);
  assert.equal(result.modules[0].lectures.length, 2);
  assert.match(result.embedUrl, /https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);

  // Marketing assets
  assert.match(result.marketingAssets.facebookPost, /Building Autonomous AI Workflows/);
  assert.match(result.marketingAssets.linkedInPost, /Leadership/);
  assert.match(result.marketingAssets.youtubeMetadata.seoTitle, /Building Autonomous AI Workflows/);
  assert.ok(result.marketingAssets.youtubeMetadata.timestamps.length >= 3);
});

test('convertYouTubeUrlToCourse throws cleanly on invalid URL', () => {
  assert.throws(() => {
    convertYouTubeUrlToCourse({ youtubeUrl: 'https://invalid-url.com' });
  }, /Invalid YouTube URL/);
});
