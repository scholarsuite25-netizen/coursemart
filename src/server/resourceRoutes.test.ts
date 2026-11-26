import test, { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApiApp } from './createApp';
import { createUserSessionToken } from './userAuth';
import {
  DEFAULT_DOWNLOAD_TTL_SECONDS,
  HMAC_SECRET,
  generateDownloadToken,
} from '../utils/contentProtection';
import {
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionToken,
  getAdminSessionSecret,
} from './adminAuth';

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

describe('Resource Download Token & Gated Asset Delivery Routes (R3)', () => {
  describe('POST /api/resources/:productId/token', () => {
    it('returns 401 Unauthorized when request has no authentication session', async () => {
      const res = await fetch(`${baseUrl}/api/resources/prod-course-1/token`, {
        method: 'POST',
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.ok, false);
      assert.match(data.error, /authentication required/i);
    });

    it('returns 404 Not Found when product ID does not exist in store catalog', async () => {
      const res = await fetch(`${baseUrl}/api/resources/prod-nonexistent-999/token`, {
        method: 'POST',
        headers: {
          'x-admin-test': 'true',
        },
      });
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.ok, false);
      assert.match(data.error, /not found/i);
    });

    it('returns 403 Forbidden when authenticated user lacks purchase entitlement or membership', async () => {
      const userToken = createUserSessionToken(
        'usr-unauthorized-stranger',
        'stranger@example.com',
        'customer'
      );

      const res = await fetch(`${baseUrl}/api/resources/prod-sw-1/token`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.ok, false);
      assert.match(data.error, /entitlement verification failed/i);
    });

    it('returns 200 and issues signed token for administrator session', async () => {
      const res = await fetch(`${baseUrl}/api/resources/prod-course-1/token`, {
        method: 'POST',
        headers: {
          'x-admin-test': 'true',
        },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.ok(typeof data.token === 'string' && data.token.includes('.'));
      assert.ok(data.expiresAt > Date.now());
      assert.match(data.downloadUrl, /^\/api\/resources\/download\?token=/);
      assert.match(data.downloadUrl, /productId=prod-course-1/);
      assert.equal(data.entitlementReason, 'admin_privilege');
    });

    it('returns 200 and issues token when user holds completed order for product', async () => {
      const studentToken = createUserSessionToken(
        'user-student-1',
        'student@coursemart.local',
        'customer'
      );

      const res = await fetch(`${baseUrl}/api/resources/prod-course-1/token`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${studentToken}`,
        },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.ok(data.token.includes('.'));
      assert.equal(data.entitlementReason, 'order_purchase');
    });

    it('returns 200 and issues token when user holds active membership covering product tier', async () => {
      // user-student-1 has 'starter' membership in seed data; prod-course-2 has includedInMembershipTier: 'starter'
      const studentToken = createUserSessionToken(
        'user-student-1',
        'student@coursemart.local',
        'customer'
      );

      const res = await fetch(`${baseUrl}/api/resources/prod-course-2/token`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${studentToken}`,
        },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.ok(data.token.includes('.'));
    });

    it('returns 200 and issues token when product is free (price === 0)', async () => {
      // First save a free product in the runtime store
      const freeProduct = {
        id: 'prod-free-starter-pack',
        slug: 'free-starter-pack',
        title: 'Free Community Starter Pack',
        subtitle: 'Free resource for all enrolled and registered students',
        description: 'Starter files and templates.',
        type: 'software' as const,
        category: 'Free Tools',
        instructorId: 'ins-1',
        instructorName: 'Elena Rostova',
        instructorRole: 'Lead',
        instructorAvatar: '',
        price: 0,
        originalPrice: 0,
        rating: 5,
        reviewCount: 1,
        studentsCount: 10,
        thumbnail: '',
        level: 'Beginner' as const,
        language: 'English',
        updatedAt: '2026-11-20',
        status: 'published' as const,
        featured: false,
        learningOutcomes: ['Free setup'],
        requirements: [],
        formatLabel: 'Free ZIP',
      };

      // Save via store PUT route with admin session
      const adminToken = createAdminSessionToken('admin-test', getAdminSessionSecret());
      const putRes = await fetch(`${baseUrl}/api/store/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${ADMIN_SESSION_COOKIE_NAME}=${adminToken}`,
        },
        body: JSON.stringify({ value: [freeProduct] }),
      });
      assert.equal(putRes.status, 200);

      const studentToken = createUserSessionToken(
        'user-registered-guest',
        'guest@coursemart.local',
        'customer'
      );

      const res = await fetch(`${baseUrl}/api/resources/prod-free-starter-pack/token`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${studentToken}`,
        },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.entitlementReason, 'free_product');
      assert.ok(data.token.includes('.'));
    });
  });

  describe('GET /api/resources/download', () => {
    it('returns 401 Unauthorized when token query param is missing', async () => {
      const res = await fetch(`${baseUrl}/api/resources/download?productId=prod-course-1`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.ok, false);
      assert.match(data.error, /token is required/i);
    });

    it('returns 403 Forbidden when token is expired', async () => {
      const expired = generateDownloadToken(
        'prod-course-1',
        'usr-any',
        -20,
        getAdminSessionSecret()
      );

      const res = await fetch(`${baseUrl}${expired.downloadUrl}`);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.ok, false);
      assert.match(data.error, /expired/i);
    });

    it('returns 403 Forbidden when token signature has been tampered with', async () => {
      const valid = generateDownloadToken(
        'prod-course-1',
        'usr-any',
        900,
        getAdminSessionSecret()
      );
      const [payload, sig] = valid.token.split('.');
      const corruptedSig = sig.slice(0, -1) + (sig.endsWith('0') ? '1' : '0');
      const tamperedUrl = `/api/resources/download?token=${payload}.${corruptedSig}&productId=prod-course-1`;

      const res = await fetch(`${baseUrl}${tamperedUrl}`);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.ok, false);
      assert.match(data.error, /signature/i);
    });

    it('returns 403 Forbidden when token was issued for product A but requested for product B', async () => {
      const validForCourse1 = generateDownloadToken(
        'prod-course-1',
        'usr-any',
        900,
        getAdminSessionSecret()
      );
      const spoofedUrl = `/api/resources/download?token=${validForCourse1.token}&productId=prod-course-2`;

      const res = await fetch(`${baseUrl}${spoofedUrl}`);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.ok, false);
      assert.match(data.error, /does not match/i);
    });

    it('returns 404 Not Found when token is valid but target product does not exist in store', async () => {
      const validForGhost = generateDownloadToken(
        'prod-ghost-missing',
        'usr-any',
        900,
        getAdminSessionSecret()
      );

      const res = await fetch(`${baseUrl}${validForGhost.downloadUrl}`);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.ok, false);
      assert.match(data.error, /not found/i);
    });

    it('returns 200 with security headers and protected digital deliverable on valid token', async () => {
      // 1. Request token as admin
      const tokenRes = await fetch(`${baseUrl}/api/resources/prod-course-1/token`, {
        method: 'POST',
        headers: { 'x-admin-test': 'true' },
      });
      assert.equal(tokenRes.status, 200);
      const tokenData = await tokenRes.json();

      // 2. Access download URL
      const dlRes = await fetch(`${baseUrl}${tokenData.downloadUrl}`);
      assert.equal(dlRes.status, 200);

      // Verify security and content delivery headers
      const disp = dlRes.headers.get('content-disposition');
      assert.ok(disp && disp.includes('attachment'));
      assert.ok(disp && disp.includes('filename='));

      assert.equal(dlRes.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(dlRes.headers.get('cache-control'), 'private, no-store');
      assert.match(dlRes.headers.get('content-type') || '', /text\/plain/);

      // Verify deliverable content
      const body = await dlRes.text();
      assert.match(body, /(CourseMart|DIGITAL WEALTH CREATORS) Verified Digital/i);
      assert.match(body, /Product ID: prod-course-1/);
      assert.match(body, /(CourseMart|DIGITAL WEALTH CREATORS).*Anti-Copy Protection/i);
    });
  });
});
