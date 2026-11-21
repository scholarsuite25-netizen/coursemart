import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DOWNLOAD_TTL_SECONDS,
  HMAC_SECRET,
  evaluateCopyProtection,
  formatCanvasWatermark,
  generateDownloadToken,
  generateWatermarkOverlayConfig,
  isCopyProtectionActive,
  verifyDownloadToken,
} from './contentProtection';

describe('LMS Content Protection Unit Tests (R3)', () => {
  describe('evaluateCopyProtection & isCopyProtectionActive', () => {
    it('blocks copy, cut, contextmenu, and selectstart when product protection is enabled', () => {
      const events = ['copy', 'cut', 'contextmenu', 'selectstart'] as const;
      for (const ev of events) {
        const res = evaluateCopyProtection(ev, true, false);
        assert.equal(res.blocked, true);
        assert.equal(res.action, `prevent_${ev}`);
      }
    });

    it('allows copy events when protection is disabled on both product and storefront', () => {
      const events = ['copy', 'cut', 'contextmenu', 'selectstart'] as const;
      for (const ev of events) {
        const res = evaluateCopyProtection(ev, false, false);
        assert.equal(res.blocked, false);
        assert.equal(res.action, `allow_${ev}`);
      }
    });

    it('global copy protection overrides individual product false flag', () => {
      const res = evaluateCopyProtection('copy', false, true);
      assert.equal(res.blocked, true);
      assert.equal(res.action, 'prevent_copy');
    });

    it('isCopyProtectionActive reflects truthiness of either flag', () => {
      assert.equal(isCopyProtectionActive(false, false), false);
      assert.equal(isCopyProtectionActive(true, false), true);
      assert.equal(isCopyProtectionActive(false, true), true);
      assert.equal(isCopyProtectionActive(true, true), true);
      assert.equal(isCopyProtectionActive(undefined, undefined), false);
    });
  });

  describe('generateWatermarkOverlayConfig', () => {
    it('generates config with user email and timestamp', () => {
      const cfg = generateWatermarkOverlayConfig(
        { id: 'usr-100', email: 'dev@coursemart.com', name: 'Dev Student' },
        '2026-11-20T22:30:00.000Z'
      );

      assert.equal(cfg.visible, true);
      assert.equal(cfg.opacity, 0.18);
      assert.equal(cfg.layout.repeatX, 3);
      assert.equal(cfg.layout.repeatY, 4);
      assert.equal(cfg.layout.angle, -25);
      assert.match(cfg.text, /dev@coursemart\.com/);
      assert.match(cfg.text, /2026-11-20T22:30/);
      assert.match(cfg.text, /CourseMart Protected/);
    });

    it('falls back to User-<id> when email is missing', () => {
      const cfg = generateWatermarkOverlayConfig(
        { id: 'usr-555', name: 'No Email User' },
        '2026-11-20T22:30:00.000Z'
      );
      assert.match(cfg.text, /^User-usr-555 •/);
    });

    it('falls back to Anonymous-Guest-Viewer when user is null or empty', () => {
      const nullCfg = generateWatermarkOverlayConfig(null, '2026-11-20T22:30:00.000Z');
      assert.match(nullCfg.text, /^Anonymous-Guest-Viewer •/);

      const emptyCfg = generateWatermarkOverlayConfig({}, '2026-11-20T22:30:00.000Z');
      assert.match(emptyCfg.text, /^Anonymous-Guest-Viewer •/);
    });
  });

  describe('generateDownloadToken and verifyDownloadToken', () => {
    it('generates a valid token and verifies it successfully', () => {
      const now = Date.now();
      const tokenResult = generateDownloadToken(
        'prod-course-101',
        'usr-888',
        DEFAULT_DOWNLOAD_TTL_SECONDS,
        HMAC_SECRET,
        now
      );

      assert.ok(tokenResult.token.includes('.'));
      assert.equal(tokenResult.expiresAt, now + DEFAULT_DOWNLOAD_TTL_SECONDS * 1000);
      assert.match(tokenResult.downloadUrl, /^\/api\/resources\/download\?token=/);
      assert.match(tokenResult.downloadUrl, /productId=prod-course-101/);

      const verification = verifyDownloadToken(
        tokenResult.token,
        'prod-course-101',
        HMAC_SECRET,
        now + 1000
      );
      assert.equal(verification.valid, true);
      assert.equal(verification.productId, 'prod-course-101');
      assert.equal(verification.userId, 'usr-888');
    });

    it('rejects expired tokens', () => {
      const now = 1700000000000;
      const expired = generateDownloadToken('prod-lms-2', 'usr-1', -10, HMAC_SECRET, now);

      const verification = verifyDownloadToken('prod-lms-2', expired.token, HMAC_SECRET, now);
      // Notice: parameter order test
      const res = verifyDownloadToken(expired.token, 'prod-lms-2', HMAC_SECRET, now);
      assert.equal(res.valid, false);
      assert.match(res.reason || '', /expired/i);
    });

    it('rejects tampered signature tokens', () => {
      const tokenResult = generateDownloadToken('prod-lms-3', 'usr-2', 900, HMAC_SECRET);
      const [payload, sig] = tokenResult.token.split('.');
      // Tamper signature by changing last character
      const tamperedSig = sig.slice(0, -1) + (sig.slice(-1) === 'a' ? 'b' : 'a');
      const tamperedToken = `${payload}.${tamperedSig}`;

      const res = verifyDownloadToken(tamperedToken, 'prod-lms-3', HMAC_SECRET);
      assert.equal(res.valid, false);
      assert.match(res.reason || '', /signature/i);
    });

    it('rejects product ID mismatch', () => {
      const tokenResult = generateDownloadToken('prod-course-alpha', 'usr-9', 900, HMAC_SECRET);
      const res = verifyDownloadToken(tokenResult.token, 'prod-course-beta', HMAC_SECRET);
      assert.equal(res.valid, false);
      assert.match(res.reason || '', /does not match/i);
    });

    it('rejects tokens signed with a different secret', () => {
      const tokenResult = generateDownloadToken(
        'prod-course-alpha',
        'usr-9',
        900,
        'secret_one'
      );
      const res = verifyDownloadToken(tokenResult.token, 'prod-course-alpha', 'secret_two');
      assert.equal(res.valid, false);
      assert.match(res.reason || '', /signature/i);
    });

    it('handles malformed token structures gracefully', () => {
      assert.equal(verifyDownloadToken('', 'prod-1').valid, false);
      assert.equal(verifyDownloadToken('no-dot-token', 'prod-1').valid, false);
      assert.equal(verifyDownloadToken('.signatureOnly', 'prod-1').valid, false);
      assert.equal(verifyDownloadToken('payloadOnly.', 'prod-1').valid, false);
      assert.equal(verifyDownloadToken('bad!payload.sig', 'prod-1').valid, false);

      // Payload with wrong segment count
      const badSegPayload = Buffer.from('prod:user', 'utf8').toString('base64url');
      assert.equal(verifyDownloadToken(`${badSegPayload}.abcdef`, 'prod-1').valid, false);

      // Payload with non-numeric expiry
      const badExpPayload = Buffer.from('prod:user:notanumber', 'utf8').toString('base64url');
      assert.equal(verifyDownloadToken(`${badExpPayload}.abcdef`, 'prod-1').valid, false);
    });

    it('supports unicode user identifiers and special product slugs', () => {
      const tokenResult = generateDownloadToken(
        'prod-course-⚡-ai-2026',
        'usr-cephas-🇳🇬',
        900,
        HMAC_SECRET
      );
      const res = verifyDownloadToken(tokenResult.token, 'prod-course-⚡-ai-2026', HMAC_SECRET);
      assert.equal(res.valid, true);
      assert.equal(res.userId, 'usr-cephas-🇳🇬');
      assert.equal(res.productId, 'prod-course-⚡-ai-2026');
    });
  });

  describe('formatCanvasWatermark', () => {
    it('executes canvas rendering commands without crashing', () => {
      const saveCalls: number[] = [];
      const restoreCalls: number[] = [];
      const fillTextCalls: Array<{ text: string; x: number; y: number }> = [];

      const mockCtx = {
        save: () => saveCalls.push(1),
        restore: () => restoreCalls.push(1),
        translate: () => {},
        rotate: () => {},
        fillText: (text: string, x: number, y: number) => {
          fillTextCalls.push({ text, x, y });
        },
        globalAlpha: 1,
        fillStyle: '',
        font: '',
        textAlign: '',
        textBaseline: '',
      } as unknown as CanvasRenderingContext2D;

      formatCanvasWatermark(mockCtx, 1280, 720, 'Student • CourseMart', {
        opacity: 0.2,
        angle: -25,
        driftOffset: 45,
      });

      assert.ok(saveCalls.length > 0);
      assert.equal(saveCalls.length, restoreCalls.length);
      assert.ok(fillTextCalls.length > 0);
      assert.equal(fillTextCalls[0].text, 'Student • CourseMart');
    });

    it('handles null or empty ctx/text without throwing', () => {
      assert.doesNotThrow(() => {
        formatCanvasWatermark(null as any, 100, 100, 'Test');
        formatCanvasWatermark({} as any, 100, 100, '');
      });
    });
  });
});
