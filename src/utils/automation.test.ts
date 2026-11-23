import test from 'node:test';
import assert from 'node:assert/strict';
import type { EventRegistration, UserAccount } from '../types/marketplace.ts';
import {
  buildDeterministicSocialDrafts,
  buildPlatformShareIntentUrl,
  getOptedInSubscribers,
  resolveBroadcastRecipients,
  resolveInitialOrderStatus,
} from './automation.ts';

const USERS: UserAccount[] = [
  {
    id: 'u1',
    name: 'Alice OptedIn',
    email: 'Alice@Example.com',
    password: 'pw',
    role: 'customer',
    newsletterOptIn: true,
    joinedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u2',
    name: 'Bob Declined',
    email: 'bob@example.com',
    password: 'pw',
    role: 'customer',
    newsletterOptIn: false,
    joinedAt: '2026-01-02T00:00:00Z',
  },
];

const REGISTRATIONS: EventRegistration[] = [
  {
    id: 'r1',
    eventId: 'evt-1',
    eventTitle: 'Seminar A',
    confirmationCode: 'EVT-111111',
    fullName: 'Alice Duplicate',
    email: 'alice@example.com',
    roleTitle: 'Engineer',
    experienceLevel: 'Intermediate',
    attendanceMode: 'Live Virtual',
    paymentStatus: 'free',
    newsletterOptIn: true,
    acknowledgementEmailStatus: 'in_app_ready',
    registeredAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'r2',
    eventId: 'evt-1',
    eventTitle: 'Seminar A',
    confirmationCode: 'EVT-222222',
    fullName: 'Carol Conference',
    email: 'carol@example.com',
    roleTitle: 'Director',
    experienceLevel: 'Advanced',
    attendanceMode: 'Live Virtual',
    paymentStatus: 'free',
    newsletterOptIn: true,
    acknowledgementEmailStatus: 'in_app_ready',
    registeredAt: '2026-02-01T12:00:00Z',
  },
  {
    id: 'r3',
    eventId: 'evt-2',
    eventTitle: 'Seminar B',
    confirmationCode: 'EVT-333333',
    fullName: 'David OptedOut',
    email: 'david@example.com',
    roleTitle: 'Founder',
    experienceLevel: 'Beginner',
    attendanceMode: 'Live Virtual',
    paymentStatus: 'free',
    newsletterOptIn: false,
    acknowledgementEmailStatus: 'in_app_ready',
    registeredAt: '2026-02-02T00:00:00Z',
  },
  {
    id: 'r4',
    eventId: 'evt-1',
    eventTitle: 'Seminar A',
    confirmationCode: 'EVT-444444',
    fullName: 'Alice Upper',
    email: 'ALICE@EXAMPLE.COM',
    roleTitle: 'Founder',
    experienceLevel: 'Beginner',
    attendanceMode: 'Live Virtual',
    paymentStatus: 'free',
    newsletterOptIn: true,
    acknowledgementEmailStatus: 'in_app_ready',
    registeredAt: '2026-02-02T00:00:00Z',
  },
];

test('Option C payment safety: GTB manual transfer stays pending, unverified Paystack/Card stays pending, verified Paystack/Card completes', () => {
  assert.equal(resolveInitialOrderStatus('gtb_whatsapp', true), 'pending');
  assert.equal(resolveInitialOrderStatus('gtb_whatsapp', false), 'pending');
  assert.equal(resolveInitialOrderStatus('paystack', false), 'pending');
  assert.equal(resolveInitialOrderStatus('paystack', true), 'completed');
  assert.equal(resolveInitialOrderStatus('paystack'), 'pending');
  assert.equal(resolveInitialOrderStatus('card', false), 'pending');
  assert.equal(resolveInitialOrderStatus('card', true), 'completed');
  assert.equal(resolveInitialOrderStatus('card'), 'pending');
});

test('getOptedInSubscribers respects consent toggles and deduplicates emails case-insensitively', () => {
  const subs = getOptedInSubscribers(USERS, REGISTRATIONS);
  assert.equal(subs.length, 2);
  assert.deepEqual(
    subs.map((s) => s.email),
    ['alice@example.com', 'carol@example.com']
  );
});

test('resolveBroadcastRecipients filters event attendees cleanly', () => {
  const optedIn = resolveBroadcastRecipients('newsletter_opted_in', USERS, REGISTRATIONS);
  assert.equal(optedIn.length, 2);

  const eventAudience = resolveBroadcastRecipients(
    'event_registrants',
    USERS,
    REGISTRATIONS,
    'evt-1'
  );
  assert.equal(eventAudience.length, 2);

  const missingEventAudience = resolveBroadcastRecipients(
    'event_registrants',
    USERS,
    REGISTRATIONS,
    'evt-missing'
  );
  assert.equal(missingEventAudience.length, 0);
});

test('buildDeterministicSocialDrafts generates drafts for all 6 platforms', () => {
  const drafts = buildDeterministicSocialDrafts({
    sourceType: 'event',
    sourceId: 'evt-1',
    sourceTitle: 'AI Deployment Workshop',
    summary: 'Learn full-stack Vercel + Supabase deployment.',
    targetPath: '/events',
    category: 'Apps Deployment',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
  });

  assert.equal(drafts.length, 6);
  assert.deepEqual(
    drafts.map((d) => d.platform),
    ['linkedin', 'x', 'instagram', 'facebook', 'youtube', 'whatsapp_group']
  );
  assert.match(drafts[5].content, /manual/i);

  const waUrl = buildPlatformShareIntentUrl('whatsapp_group', 'Hello', 'https://coursemart.io');
  assert.match(waUrl || '', /^https:\/\/wa\.me\/\?text=/);

  const fbUrl = buildPlatformShareIntentUrl('facebook', 'Hello', 'https://coursemart.io');
  assert.equal(fbUrl, 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fcoursemart.io');
});
