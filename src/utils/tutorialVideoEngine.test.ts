import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getVideoNarratorConfig,
  renderSceneToCanvas,
  exportTutorialVideo,
} from './tutorialVideoEngine';
import type { VideoScene } from '../types/tutorial';

describe('Tutorial Video Engine', () => {
  it('getVideoNarratorConfig declares standard 1280x720 24fps configuration', () => {
    const config = getVideoNarratorConfig();
    assert.equal(config.width, 1280);
    assert.equal(config.height, 720);
    assert.equal(config.fps, 24);
    assert.equal(config.audioChannels, 2);
    assert.equal(config.mimeType, 'video/webm');
  });

  it('renderSceneToCanvas executes without throwing on mock 2D context', () => {
    const mockCtx: any = {
      save: () => {},
      restore: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      measureText: (text: string) => ({ width: text.length * 8 }),
      beginPath: () => {},
      closePath: () => {},
      roundRect: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      createLinearGradient: () => ({
        addColorStop: () => {},
      }),
      createRadialGradient: () => ({
        addColorStop: () => {},
      }),
    };

    const scene: VideoScene = {
      sceneIndex: 0,
      sceneNumber: 1,
      title: 'Architectural Foundations',
      visualHeadline: 'Core Microservices Architecture',
      narrationScript: 'In this step we examine the primary building blocks of autonomous systems.',
      startSeconds: 0,
      durationSeconds: 12,
      layout: 'code-walkthrough',
      codeSnippet: 'export function launchService() {\n  return true;\n}',
      calloutNote: 'Always verify TLS certificates in production.',
    };

    assert.doesNotThrow(() => {
      renderSceneToCanvas(mockCtx, scene, {
        activeAudioLevel: 0.8,
        playbackProgress: 0.35,
        watermarkText: 'Digital Wealth Creators',
      });
    });
  });

  it('exportTutorialVideo returns fallback WebM Blob in Node environment', async () => {
    const mockCanvas: any = {};
    const scenes: VideoScene[] = [
      {
        sceneIndex: 0,
        title: 'Intro',
        visualHeadline: 'Introduction',
        narrationScript: 'Welcome to this guide.',
        startSeconds: 0,
        durationSeconds: 10,
        layout: 'summary',
      },
    ];

    const blob = await exportTutorialVideo(mockCanvas, scenes);
    assert.equal(blob.type, 'video/webm');
    assert.ok(blob.size > 0);
  });
});
