import test from 'node:test';
import assert from 'node:assert/strict';
import type { CoursemartEvent, EventRegistration, PreEventMaterial } from '../types/marketplace.ts';
import {
  buildAttendeesCsv,
  buildEventIcsContent,
  buildPreEventAcknowledgementHtml,
  filterEvents,
  generateEventConfirmationCode,
  getEventSeatStats,
  isEventFree,
  validateEventPricing,
  validateEventRegistrationForm,
} from './events.ts';

const SAMPLE_EVENT: CoursemartEvent = {
  id: 'evt-test-1',
  slug: 'vibe-coding-sprint',
  title: 'Vibe Coding Production Sprint',
  subtitle: 'Hands-on AI workflow seminar',
  description: 'Full workshop details.',
  format: 'workshop',
  deliveryMode: 'Live Virtual (Zoom / Meet)',
  category: 'Vibe Coding',
  startAt: '2026-12-10T15:00:00Z',
  endAt: '2026-12-10T17:30:00Z',
  timezone: 'UTC',
  locationOrLink: 'https://meet.coursemart.io/vibe-sprint',
  speakerName: 'Elena Vance',
  speakerRole: 'Principal Engineer',
  speakerAvatar: '/assets/instructor.png',
  coverImage: '/assets/hero.png',
  capacity: 2,
  price: 0,
  status: 'published',
  featured: true,
  agenda: ['Kickoff architecture review', 'Live TypeScript build'],
  preEventMaterials: [
    {
      id: 'mat-1',
      title: 'Starter Repo & Checklist',
      type: 'checklist',
      summary: 'Install Node 22 before session starts.',
      urlOrNotes: 'npx tsx --version',
    },
  ],
  acknowledgementMessage: 'Welcome aboard! Review the starter checklist below before we start.',
  createdAt: '2026-11-01T10:00:00Z',
};

const SAMPLE_REGS: EventRegistration[] = [
  {
    id: 'reg-1',
    eventId: 'evt-test-1',
    eventTitle: 'Vibe Coding Production Sprint',
    confirmationCode: 'EVT-ABC123',
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    roleTitle: 'Staff Engineer',
    experienceLevel: 'Advanced',
    attendanceMode: 'Live Virtual',
    paymentStatus: 'free',
    newsletterOptIn: true,
    acknowledgementEmailStatus: 'in_app_ready',
    registeredAt: '2026-11-10T10:00:00Z',
  },
];

test('getEventSeatStats computes remaining capacity and full flag accurately', () => {
  const oneTaken = getEventSeatStats(SAMPLE_EVENT, SAMPLE_REGS);
  assert.equal(oneTaken.registeredCount, 1);
  assert.equal(oneTaken.remainingSeats, 1);
  assert.equal(oneTaken.isFull, false);
  assert.equal(oneTaken.percentFilled, 50);

  const twoTaken = getEventSeatStats(SAMPLE_EVENT, [
    ...SAMPLE_REGS,
    { ...SAMPLE_REGS[0], id: 'reg-2', email: 'grace@example.com' },
  ]);
  assert.equal(twoTaken.remainingSeats, 0);
  assert.equal(twoTaken.isFull, true);
  assert.equal(twoTaken.percentFilled, 100);
});

test('validateEventRegistrationForm enforces fields, duplicate email, and capacity', () => {
  const validResult = validateEventRegistrationForm(
    {
      fullName: 'Grace Hopper',
      email: 'grace@example.com',
      roleTitle: 'Systems Architect',
      experienceLevel: 'Advanced',
      attendanceMode: 'Live Virtual',
      newsletterOptIn: true,
    },
    SAMPLE_EVENT,
    SAMPLE_REGS
  );
  assert.equal(validResult.valid, true);

  const duplicateResult = validateEventRegistrationForm(
    {
      fullName: 'Ada Duplicate',
      email: 'ADA@example.com',
      roleTitle: 'Engineer',
      experienceLevel: 'Intermediate',
      attendanceMode: 'Live Virtual',
      newsletterOptIn: false,
    },
    SAMPLE_EVENT,
    SAMPLE_REGS
  );
  assert.equal(duplicateResult.valid, false);
  assert.match(duplicateResult.errors.email, /already registered/i);

  const fullResult = validateEventRegistrationForm(
    {
      fullName: 'Alan Turing',
      email: 'alan@example.com',
      roleTitle: 'Researcher',
      experienceLevel: 'Advanced',
      attendanceMode: 'Live Virtual',
      newsletterOptIn: true,
    },
    SAMPLE_EVENT,
    [
      ...SAMPLE_REGS,
      { ...SAMPLE_REGS[0], id: 'reg-2', email: 'grace@example.com' },
    ]
  );
  assert.equal(fullResult.valid, false);
  assert.match(fullResult.errors.capacity, /booked/i);
});

test('generateEventConfirmationCode and calendar/CSV builders emit valid formatted artifacts', () => {
  const code = generateEventConfirmationCode(SAMPLE_EVENT.id, 'grace@example.com');
  assert.match(code, /^EVT-[A-Z0-9]{6}$/);

  const ics = buildEventIcsContent(SAMPLE_EVENT, code);
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /SUMMARY:Vibe Coding Production Sprint/);
  assert.match(ics, /STATUS:CONFIRMED/);
  assert.match(ics, /END:VCALENDAR/);

  const csv = buildAttendeesCsv(SAMPLE_EVENT, SAMPLE_REGS);
  assert.match(csv, /Confirmation Code/);
  assert.match(csv, /"EVT-ABC123"/);
  assert.match(csv, /"ada@example\.com"/);

  const ack = buildPreEventAcknowledgementHtml(SAMPLE_EVENT, SAMPLE_REGS[0]);
  assert.match(ack.subject, /EVT-ABC123/);
  assert.match(ack.html, /Starter Repo &amp; Checklist/);
  assert.match(ack.html, /Ada Lovelace/);

  const xssAck = buildPreEventAcknowledgementHtml(SAMPLE_EVENT, {
    ...SAMPLE_REGS[0],
    fullName: '<script>alert(1)</script>',
  });
  assert.doesNotMatch(xssAck.html, /<script>/);
  assert.match(xssAck.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('filterEvents excludes drafts by default and filters by format and query', () => {
  const draftEvent: CoursemartEvent = {
    ...SAMPLE_EVENT,
    id: 'evt-draft',
    status: 'draft',
    format: 'seminar',
  };
  const publicOnly = filterEvents([SAMPLE_EVENT, draftEvent], { format: 'all' });
  assert.equal(publicOnly.length, 1);
  assert.equal(publicOnly[0].id, SAMPLE_EVENT.id);

  const allWithDraft = filterEvents([SAMPLE_EVENT, draftEvent], { includeDrafts: true });
  assert.equal(allWithDraft.length, 2);

  const searchMiss = filterEvents([SAMPLE_EVENT], { search: 'nonexistent-topic' });
  assert.equal(searchMiss.length, 0);
});

test('isEventFree correctly detects free/paid events across pricing and explicit flags', () => {
  // Free events with price: 0
  assert.equal(isEventFree({ price: 0 }), true);
  assert.equal(isEventFree({ price: 0, isFree: true }), true);

  // Paid events with positive prices
  assert.equal(isEventFree({ price: 25000 }), false);
  assert.equal(isEventFree({ price: 25000, isFree: false }), false);

  // Negative prices (treated as free)
  assert.equal(isEventFree({ price: -100 }), true);

  // Undefined price
  assert.equal(isEventFree({ price: undefined }), false);
  assert.equal(isEventFree({}), false);

  // Explicit isFree flag overrides
  assert.equal(isEventFree({ price: 25000, isFree: true }), true);
  assert.equal(isEventFree({ isFree: true }), true);
  assert.equal(isEventFree({ price: 15000, isFree: false }), false);
  assert.equal(isEventFree({ isFree: false }), false);
});

test('validateEventPricing validates free/paid pricing thresholds and error messages', () => {
  // Free events (isFree = true) are always valid regardless of price value
  const freeZero = validateEventPricing(true, 0);
  assert.equal(freeZero.valid, true);
  assert.equal(freeZero.error, undefined);

  const freeNonZero = validateEventPricing(true, 100);
  assert.equal(freeNonZero.valid, true);

  const freeNegative = validateEventPricing(true, -50);
  assert.equal(freeNegative.valid, true);

  // Paid events (isFree = false) require price > 0
  const paidPositive = validateEventPricing(false, 25000);
  assert.equal(paidPositive.valid, true);
  assert.equal(paidPositive.error, undefined);

  const paidZero = validateEventPricing(false, 0);
  assert.equal(paidZero.valid, false);
  assert.match(paidZero.error || '', /greater than/i);

  const paidNegative = validateEventPricing(false, -500);
  assert.equal(paidNegative.valid, false);
  assert.match(paidNegative.error || '', /greater than/i);

  const paidNan = validateEventPricing(false, Number.NaN);
  assert.equal(paidNan.valid, false);
  assert.match(paidNan.error || '', /greater than/i);
});

test('multi-material pre-event kit supports pdf, slides, repo, checklist, and video types', () => {
  const materials: PreEventMaterial[] = [
    {
      id: 'mat-pdf-1',
      title: 'Architectural Blueprint PDF',
      type: 'pdf',
      urlOrNotes: 'https://cdn.coursemart.io/materials/blueprint.pdf',
      summary: 'High-resolution architecture diagram and technical specifications.',
    },
    {
      id: 'mat-slides-2',
      title: 'Session Keynote Deck',
      type: 'slides',
      urlOrNotes: 'https://slides.coursemart.io/deck-vibe.key',
      summary: 'Interactive keynote slides covering core architectural patterns.',
    },
    {
      id: 'mat-repo-3',
      title: 'Starter Template Monorepo',
      type: 'repo',
      urlOrNotes: 'https://github.com/digitalwealthcreators/starter-kit',
      summary: 'Production template scaffold with TypeScript and Vite preconfigured.',
    },
    {
      id: 'mat-check-4',
      title: 'Dev Environment Checklist',
      type: 'checklist',
      urlOrNotes: 'Verify Node 22, Git 2.45, and pnpm 9 are installed.',
      summary: 'Mandatory prerequisites to complete prior to workshop kickoff.',
    },
    {
      id: 'mat-vid-5',
      title: 'Setup Walkthrough Video',
      type: 'video',
      urlOrNotes: 'https://vimeo.com/coursemart/walkthrough-preview',
      summary: 'A 5-minute pre-event onboarding screencast.',
    },
  ];

  assert.equal(materials.length, 5);
  const types = materials.map((m) => m.type);
  assert.deepEqual(types, ['pdf', 'slides', 'repo', 'checklist', 'video']);

  const multiMatEvent: CoursemartEvent = {
    ...SAMPLE_EVENT,
    id: 'evt-multi-kit',
    title: 'Enterprise Architecture Workshop',
    preEventMaterials: materials,
  };

  // Verify ICS calendar generator reflects all materials
  const ics = buildEventIcsContent(multiMatEvent, 'EVT-TEST-MULTI');
  assert.match(ics, /Architectural Blueprint PDF/);
  assert.match(ics, /Session Keynote Deck/);
  assert.match(ics, /Starter Template Monorepo/);
  assert.match(ics, /Dev Environment Checklist/);
  assert.match(ics, /Setup Walkthrough Video/);

  // Verify HTML acknowledgement includes all materials and types
  const ack = buildPreEventAcknowledgementHtml(multiMatEvent, SAMPLE_REGS[0]);
  assert.match(ack.html, /PDF/);
  assert.match(ack.html, /SLIDES/);
  assert.match(ack.html, /REPO/);
  assert.match(ack.html, /CHECKLIST/);
  assert.match(ack.html, /VIDEO/);
  assert.match(ack.html, /blueprint\.pdf/);
  assert.match(ack.html, /starter-kit/);
});

test('event registration paymentStatus resolves correctly for free vs paid checkout flows', () => {
  const freeEvent: CoursemartEvent = {
    ...SAMPLE_EVENT,
    price: 0,
    isFree: true,
  };

  const paidEvent: CoursemartEvent = {
    ...SAMPLE_EVENT,
    id: 'evt-paid-1',
    price: 35000,
    isFree: false,
  };

  // Simulation of free registration logic from EventsPage.tsx
  const resolvePaymentInfo = (
    event: CoursemartEvent,
    method?: 'paystack' | 'gtb_whatsapp',
    gtbRef?: string
  ): { paymentStatus: EventRegistration['paymentStatus']; paymentReference?: string } => {
    if (isEventFree(event)) {
      return { paymentStatus: 'free' };
    }
    if (method === 'gtb_whatsapp') {
      return { paymentStatus: 'pending_gtb', paymentReference: gtbRef || 'GTB-TRANSFER-123' };
    }
    return { paymentStatus: 'pending_paystack', paymentReference: 'EVT-PSK-REF-999' };
  };

  const freeResult = resolvePaymentInfo(freeEvent);
  assert.equal(freeResult.paymentStatus, 'free');
  assert.equal(freeResult.paymentReference, undefined);

  const paidPaystackResult = resolvePaymentInfo(paidEvent, 'paystack');
  assert.equal(paidPaystackResult.paymentStatus, 'pending_paystack');
  assert.equal(paidPaystackResult.paymentReference, 'EVT-PSK-REF-999');

  const paidGtbResult = resolvePaymentInfo(paidEvent, 'gtb_whatsapp', 'GTB-SENDER-ADA');
  assert.equal(paidGtbResult.paymentStatus, 'pending_gtb');
  assert.equal(paidGtbResult.paymentReference, 'GTB-SENDER-ADA');
});
