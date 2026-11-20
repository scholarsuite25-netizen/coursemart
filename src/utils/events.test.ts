import test from 'node:test';
import assert from 'node:assert/strict';
import type { CoursemartEvent, EventRegistration } from '../types/marketplace.ts';
import {
  buildAttendeesCsv,
  buildEventIcsContent,
  buildPreEventAcknowledgementHtml,
  filterEvents,
  generateEventConfirmationCode,
  getEventSeatStats,
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
