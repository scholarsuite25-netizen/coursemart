import type { CoursemartEvent, EventFormat, EventRegistration } from '../types/marketplace';
import { escapeHtml } from './sanitize.ts';

export const EVENT_FORMAT_META: Record<
  EventFormat,
  { label: string; pluralLabel: string; badgeClass: string }
> = {
  'online-course': {
    label: 'Online Course Cohort',
    pluralLabel: 'Online Courses',
    badgeClass: 'bg-indigo-100 text-indigo-900',
  },
  seminar: {
    label: 'Executive Seminar',
    pluralLabel: 'Seminars',
    badgeClass: 'bg-amber-100 text-amber-900',
  },
  workshop: {
    label: 'Hands-On Workshop',
    pluralLabel: 'Workshops',
    badgeClass: 'bg-emerald-100 text-emerald-900',
  },
};

/**
 * Determines whether an event is free of charge.
 * Returns true if price is 0 (or negative) or if the event is explicitly marked free.
 */
export function isEventFree(
  event: (Pick<CoursemartEvent, 'price'> & { isFree?: boolean }) | { price?: number; isFree?: boolean }
): boolean {
  if ('isFree' in event && event.isFree === true) {
    return true;
  }
  if (typeof event.price === 'number') {
    return event.price <= 0;
  }
  return false;
}

/**
 * Validates event pricing configuration for free/paid events.
 * If isFree is true, valid is always true.
 * If isFree is false, requires price > 0, otherwise returns valid: false with an error message.
 */
export function validateEventPricing(
  isFree: boolean,
  price: number
): { valid: boolean; error?: string } {
  if (isFree) {
    return { valid: true };
  }
  if (typeof price === 'number' && !Number.isNaN(price) && price > 0) {
    return { valid: true };
  }
  return {
    valid: false,
    error: 'Paid events require a ticket fee greater than ₦0. Please enter a valid ticket fee or switch to Free Admission.',
  };
}

export interface EventSeatStats {
  registeredCount: number;
  remainingSeats: number;
  isFull: boolean;
  percentFilled: number;
}

export function getEventSeatStats(
  event: CoursemartEvent,
  registrations: EventRegistration[]
): EventSeatStats {
  const registeredCount = registrations.filter((r) => r.eventId === event.id).length;
  const capacity = Math.max(1, event.capacity);
  const remainingSeats = Math.max(0, capacity - registeredCount);
  const percentFilled = Math.min(100, Math.round((registeredCount / capacity) * 100));
  return {
    registeredCount,
    remainingSeats,
    isFull: remainingSeats === 0,
    percentFilled,
  };
}

export interface EventRegistrationInput {
  fullName: string;
  email: string;
  phone?: string;
  organization?: string;
  roleTitle: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  attendanceMode: 'Live Virtual' | 'In-Person' | 'On-Demand Replay';
  learningGoals?: string;
  newsletterOptIn: boolean;
}

export function validateEventRegistrationForm(
  input: EventRegistrationInput,
  event: CoursemartEvent,
  existingRegistrations: EventRegistration[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const cleanName = input.fullName.trim();
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanRole = input.roleTitle.trim();

  if (cleanName.length < 2) {
    errors.fullName = 'Please enter your full name (at least 2 characters).';
  }
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    errors.email = 'Please enter a valid email address.';
  } else if (
    existingRegistrations.some(
      (r) => r.eventId === event.id && r.email.trim().toLowerCase() === cleanEmail
    )
  ) {
    errors.email = 'This email is already registered for this event.';
  }

  if (cleanRole.length < 2) {
    errors.roleTitle = 'Please share your role or background (e.g., Developer, Founder).';
  }

  const seats = getEventSeatStats(event, existingRegistrations);
  if (seats.isFull) {
    errors.capacity = 'All live seats for this event are currently booked.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function generateEventConfirmationCode(eventId: string, email: string): string {
  const seed = `${eventId}-${email.trim().toLowerCase()}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return `EVT-${hash.toString(36).toUpperCase().slice(0, 6).padStart(6, '0')}`;
}

export function filterEvents(
  events: CoursemartEvent[],
  options: {
    format?: EventFormat | 'all';
    search?: string;
    includeDrafts?: boolean;
  } = {}
): CoursemartEvent[] {
  const { format = 'all', search = '', includeDrafts = false } = options;
  const q = search.trim().toLowerCase();

  return events
    .filter((ev) => {
      if (!includeDrafts && ev.status === 'draft') return false;
      if (format !== 'all' && ev.format !== format) return false;
      if (q) {
        const hay = [ev.title, ev.subtitle, ev.speakerName, ev.category, ev.deliveryMode]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

function toIcsTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '20261201T100000Z';
  }
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function buildEventIcsContent(
  event: CoursemartEvent,
  confirmationCode?: string
): string {
  const materialsSummary = event.preEventMaterials
    .map((m, i) => `${i + 1}. ${m.title}: ${m.urlOrNotes}`)
    .join('\\n');

  const desc = [
    event.subtitle,
    confirmationCode ? `Confirmation Code: ${confirmationCode}` : '',
    `Speaker: ${event.speakerName} (${event.speakerRole})`,
    materialsSummary ? `Pre-Event Materials:\\n${materialsSummary}` : '',
  ]
    .filter(Boolean)
    .join('\\n\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Coursemart//Event Management//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}-${confirmationCode || 'invite'}@coursemart.io`,
    `DTSTAMP:${toIcsTimestamp(new Date().toISOString())}`,
    `DTSTART:${toIcsTimestamp(event.startAt)}`,
    `DTEND:${toIcsTimestamp(event.endAt)}`,
    `SUMMARY:${event.title.replace(/[\r\n]+/g, ' ')}`,
    `DESCRIPTION:${desc.replace(/\r?\n/g, '\\n')}`,
    `LOCATION:${event.locationOrLink.replace(/[\r\n]+/g, ' ')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function buildAttendeesCsv(
  event: CoursemartEvent,
  registrations: EventRegistration[]
): string {
  const rows = [
    [
      'Confirmation Code',
      'Event',
      'Full Name',
      'Email',
      'Phone',
      'Organization',
      'Role',
      'Experience',
      'Attendance Mode',
      'Payment Status',
      'Newsletter Opt-In',
      'Pre-Event Materials Sent',
      'Registered At',
      'Goals',
    ],
    ...registrations.map((r) => [
      r.confirmationCode,
      event.title,
      r.fullName,
      r.email,
      r.phone || '',
      r.organization || '',
      r.roleTitle,
      r.experienceLevel,
      r.attendanceMode,
      r.paymentStatus,
      r.newsletterOptIn ? 'Yes' : 'No',
      r.preEventMaterialsSentAt || 'No',
      r.registeredAt,
      r.learningGoals || '',
    ]),
  ];

  return rows
    .map((cols) =>
      cols
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');
}

export function buildPreEventAcknowledgementHtml(
  event: CoursemartEvent,
  registration: EventRegistration
): { subject: string; html: string } {
  const startReadable = new Date(event.startAt).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const materialsRows = event.preEventMaterials
    .map(
      (m) =>
        `<li style="margin-bottom:8px;"><strong>${escapeHtml(m.title)}</strong> (${escapeHtml(m.type.toUpperCase())}): ${escapeHtml(m.summary)}<br/><span style="color:#1e3a8a;font-size:13px;">${escapeHtml(m.urlOrNotes)}</span></li>`
    )
    .join('');

  const agendaRows = event.agenda.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  return {
    subject: `[${registration.confirmationCode}] Confirmed: ${event.title} + Pre-Event Materials`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <div style="background:#0a192f;color:#ffffff;padding:24px;border-bottom:4px solid #d4af37;">
          <p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#f5c451;font-weight:bold;">Coursemart Event Confirmation</p>
          <h1 style="margin:8px 0 0;font-size:22px;">${escapeHtml(event.title)}</h1>
        </div>
        <div style="padding:24px;line-height:1.6;">
          <p>Hi <strong>${escapeHtml(registration.fullName)}</strong>,</p>
          <p>${escapeHtml(event.acknowledgementMessage || 'Your seat is reserved! Review your pre-event preparation materials below.')}</p>
          <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:16px;margin:16px 0;">
            <p style="margin:0 0 6px;"><strong>Confirmation Code:</strong> ${escapeHtml(registration.confirmationCode)}</p>
            <p style="margin:0 0 6px;"><strong>Date & Time:</strong> ${escapeHtml(startReadable)} (${escapeHtml(event.timezone)})</p>
            <p style="margin:0 0 6px;"><strong>Attendance Mode:</strong> ${escapeHtml(registration.attendanceMode)}</p>
            <p style="margin:0;"><strong>Access/Venue:</strong> ${escapeHtml(event.locationOrLink)}</p>
          </div>
          <h2 style="font-size:16px;color:#0a192f;margin-top:20px;">Pre-Event Preparation Materials</h2>
          <ul>${materialsRows}</ul>
          <h2 style="font-size:16px;color:#0a192f;margin-top:20px;">Session Agenda</h2>
          <ol>${agendaRows}</ol>
          <p style="font-size:12px;color:#64748b;margin-top:24px;">Need human support? Reply to this email or message us directly via our official support desk.</p>
        </div>
      </div>
    `,
  };
}
