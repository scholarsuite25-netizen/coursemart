import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { triggerFileDownload, triggerDirectLinkDownload } from './fileDownloader.ts';

describe('fileDownloader', () => {
  it('safely handles non-DOM environments without crashing', () => {
    // In node test environment where window/document might be mock or undefined
    assert.doesNotThrow(() => {
      triggerFileDownload('test.txt', 'Sample download content', 'text/plain');
    });
  });

  it('safely handles direct link downloads without crashing', () => {
    assert.doesNotThrow(() => {
      triggerDirectLinkDownload('https://drive.google.com/uc?export=download&id=123', 'pack.zip');
    });
  });
});
