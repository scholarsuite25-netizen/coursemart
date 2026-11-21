/**
 * LMS Content Protection & Anti-Copying Utilities (R3)
 *
 * Implements:
 * 1. In-browser copy prevention evaluation (copy, cut, contextmenu, selectstart)
 * 2. Dynamic viewer watermark overlay configuration
 * 3. Cryptographic HMAC-SHA256 download token generation & verification
 * 4. In-stream vector canvas watermark formatting (24fps slide render pipeline)
 */

import crypto from 'node:crypto';

export const HMAC_SECRET = 'coursemart_test_hmac_secret_key_2026';
export const DEFAULT_DOWNLOAD_TTL_SECONDS = 900; // 15 minutes

export type CopyProtectionEvent = 'copy' | 'cut' | 'contextmenu' | 'selectstart';

export interface CopyProtectionEvaluationResult {
  blocked: boolean;
  action: string;
}

/**
 * Determines whether in-browser copy or clipboard actions should be blocked.
 * Global appearance toggle overrides individual product toggles.
 */
export function evaluateCopyProtection(
  event: CopyProtectionEvent,
  productCopyProtection?: boolean,
  globalCopyProtection?: boolean
): CopyProtectionEvaluationResult {
  const isProtected = Boolean(productCopyProtection || globalCopyProtection);
  if (!isProtected) {
    return { blocked: false, action: `allow_${event}` };
  }
  return { blocked: true, action: `prevent_${event}` };
}

/**
 * Evaluates whether copy protection is active based on product or global storefront settings.
 */
export function isCopyProtectionActive(
  productCopyProtection?: boolean,
  globalCopyProtection?: boolean
): boolean {
  return Boolean(productCopyProtection || globalCopyProtection);
}

export interface WatermarkOverlayConfig {
  text: string;
  opacity: number;
  visible: boolean;
  layout: {
    repeatX: number;
    repeatY: number;
    angle: number;
  };
}

/**
 * Generates dynamic user-identifying watermark configuration.
 * Formats viewer identity, timestamp slice, and tamper-resistant brand stamp.
 * Falls back to 'Anonymous-Guest-Viewer' when user identity is null/empty.
 */
export function generateWatermarkOverlayConfig(
  user: { id?: string; email?: string; name?: string } | null,
  timestampIso: string = new Date().toISOString()
): WatermarkOverlayConfig {
  const identifier =
    user?.email ||
    (user?.id ? `User-${user.id}` : null) ||
    'Anonymous-Guest-Viewer';

  const text = `${identifier} • ${timestampIso.slice(0, 16)} • CourseMart Protected`;
  return {
    text,
    opacity: 0.18,
    visible: true,
    layout: {
      repeatX: 3,
      repeatY: 4,
      angle: -25,
    },
  };
}

export interface DownloadTokenResult {
  token: string;
  expiresAt: number;
  downloadUrl: string;
}

/**
 * Generates an HMAC-SHA256 signed download token for gated resource access.
 * Token structure: `<base64url(payload)>.<signature>`
 * Payload format: `${productId}:${userId}:${expiresAt}`
 */
export function generateDownloadToken(
  productId: string,
  userId: string,
  ttlSeconds: number = DEFAULT_DOWNLOAD_TTL_SECONDS,
  secretKey: string = HMAC_SECRET,
  nowMs: number = Date.now()
): DownloadTokenResult {
  const expiresAt = nowMs + ttlSeconds * 1000;
  const payload = `${productId}:${userId}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  const token = `${Buffer.from(payload).toString('base64url')}.${signature}`;
  const downloadUrl = `/api/resources/download?token=${token}&productId=${encodeURIComponent(
    productId
  )}`;
  return { token, expiresAt, downloadUrl };
}

export interface VerifyDownloadTokenResult {
  valid: boolean;
  reason?: string;
  userId?: string;
  productId?: string;
}

/**
 * Cryptographically verifies a download token using constant-time signature comparison.
 * Checks structure, base64 payload integrity, HMAC-SHA256 signature, expiry, and product ID match.
 */
export function verifyDownloadToken(
  tokenString: string,
  requestedProductId: string,
  secretKey: string = HMAC_SECRET,
  nowMs: number = Date.now()
): VerifyDownloadTokenResult {
  if (!tokenString || typeof tokenString !== 'string' || !tokenString.includes('.')) {
    return { valid: false, reason: 'Malformed token structure' };
  }

  const [b64Payload, signature] = tokenString.split('.');
  if (!b64Payload || !signature) {
    return { valid: false, reason: 'Missing token components' };
  }

  let payload = '';
  try {
    payload = Buffer.from(b64Payload, 'base64url').toString('utf8');
  } catch {
    return { valid: false, reason: 'Invalid base64 encoding' };
  }

  const parts = payload.split(':');
  if (parts.length !== 3) {
    return { valid: false, reason: 'Invalid payload segments' };
  }

  const [productId, userId, expiresAtStr] = parts;
  const expiresAt = Number(expiresAtStr);
  if (Number.isNaN(expiresAt)) {
    return { valid: false, reason: 'Invalid expiration timestamp' };
  }

  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return { valid: false, reason: 'Invalid token signature' };
  }

  if (nowMs > expiresAt) {
    return { valid: false, reason: 'Token has expired' };
  }

  if (productId !== requestedProductId) {
    return { valid: false, reason: 'Token product ID does not match requested resource' };
  }

  return { valid: true, userId, productId };
}

/**
 * Draws a subtle repeating diagonal vector watermark directly onto a 2D canvas context.
 * Used for in-stream vector lecture frame baking at 24fps with sinusoidal harmonic drift.
 */
export function formatCanvasWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
  options?: {
    opacity?: number;
    angle?: number;
    driftOffset?: number;
  }
): void {
  if (!ctx || !text) return;

  const opacity = options?.opacity ?? 0.18;
  const angleDeg = options?.angle ?? -25;
  const drift = options?.driftOffset ?? 0;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Subtle sinusoidal harmonic drift
  const driftX = Math.sin(drift * 0.05) * 20;
  const driftY = Math.cos(drift * 0.05) * 12;

  const stepX = 320;
  const stepY = 180;
  const angleRad = (angleDeg * Math.PI) / 180;

  for (let x = -width * 0.5; x < width * 1.5; x += stepX) {
    for (let y = -height * 0.5; y < height * 1.5; y += stepY) {
      ctx.save();
      ctx.translate(x + driftX, y + driftY);
      ctx.rotate(angleRad);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }

  ctx.restore();
}
