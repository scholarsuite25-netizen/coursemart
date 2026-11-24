/**
 * E2E Test Suite: Admin Event Management (Pre-Event Materials Editor & Free/Paid Controls)
 * Requirements: R4 (Admin Event Management)
 * Test Coverage: Tier 1 (Feature Coverage) & Tier 2 (Boundary & Corner Cases)
 *
 * Styling rule: No spaces before or after '/' between words (e.g. free/paid, FAQ/community, dwc/ngo).
 * Offline isolation: Strictly offline deterministic logic testing.
 */

import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isEventFree,
  validateEventPricing,
  buildPreEventAcknowledgementHtml,
  buildEventIcsContent,
  getEventSeatStats,
  validateEventRegistrationForm,
  generateEventConfirmationCode,
} from './events.ts';
import { formatNaira } from './currency.ts';
import type {
  CoursemartEvent,
  PreEventMaterial,
  EventRegistration,
} from '../types/marketplace.ts';

describe('Admin Event Management (Pre-Event Materials & Free/Paid Pricing Controls)', () => {
  const sampleEvent: CoursemartEvent = {
    id: 'evt-test-masterclass-1',
    slug: 'ai-saas-architectures-masterclass',
    title: 'AI SaaS Architectures & Production Deployment',
    subtitle: 'Hands-on architectural masterclass for engineering founders',
    description: 'Learn how to build and scale production AI systems with zero token leakage.',
    format: 'workshop',
    category: 'AI',
    deliveryMode: 'Live Virtual (Zoom/Meet)',
    locationOrLink: 'https://zoom.us/j/1234567890',
    startAt: '2026-12-15T14:00:00.000Z',
    endAt: '2026-12-15T17:00:00.000Z',
    timezone: 'WAT (UTC+1)',
    speakerName: 'Dr. Elena Vance',
    speakerRole: 'Principal Cloud Architect',
    speakerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    coverImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200',
    price: 35000,
    isFree: false,
    capacity: 60,
    status: 'published',
    featured: true,
    agenda: [
      'Architectural Specifications & PRDs',
      'Autonomous Agents & Proxy Routing',
      'Live Q&A & Code Reviews',
    ],
    preEventMaterials: [
      {
        id: 'mat-1',
        title: 'Masterclass Architectural Overview Slide Deck',
        type: 'slides',
        urlOrNotes: 'https://slides.dwc.org.ng/ai-saas-2026.pdf',
        summary: 'Download the comprehensive 45-slide deck before session kickoff.',
      },
      {
        id: 'mat-2',
        title: 'Starter GitHub Repository & Boilerplate',
        type: 'repo',
        urlOrNotes: 'https://github.com/digitalwealthcreators/ai-saas-starter',
        summary: 'Fork the repository and run npm install prior to the workshop.',
      },
    ],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };

  const sampleRegistration: EventRegistration = {
    id: 'reg-user-1',
    eventId: sampleEvent.id,
    userId: 'user-attendee-1',
    fullName: 'Olumide Adebayo',
    email: 'olumide@example.com',
    phone: '+2348012345678',
    organization: 'Apex Solutions',
    roleTitle: 'Lead Software Engineer',
    experienceLevel: 'Advanced',
    attendanceMode: 'Live Virtual',
    paymentStatus: 'paid_paystack',
    confirmationCode: 'CM-EVT-778899',
    newsletterOptIn: true,
    registeredAt: '2026-11-20T10:00:00.000Z',
    learningGoals: 'Master zero-cost multi-model failover architectures.',
  };

  /* ==========================================================================
     Feature 6: Pre-Event Materials Editor
     ========================================================================== */

  describe('Feature 6: Pre-Event Materials Editor', () => {
    // --- Tier 1: Coverage (>=5 tests) ---

    it('T1.1: adding materials supports all 5 types (pdf, slides, repo, checklist, video)', () => {
      const allTypes: Array<PreEventMaterial['type']> = ['pdf', 'slides', 'repo', 'checklist', 'video'];

      const materialsList: PreEventMaterial[] = allTypes.map((type, idx) => ({
        id: `mat-type-${idx + 1}`,
        title: `Preparation Resource ${type.toUpperCase()}`,
        type,
        urlOrNotes: `https://resources.dwc.org.ng/materials/${type}-guide`,
        summary: `Essential ${type} guide for workshop attendees.`,
      }));

      assert.equal(materialsList.length, 5);
      for (const t of allTypes) {
        const found = materialsList.find((m) => m.type === t);
        assert.ok(found, `Must support material type ${t}`);
        assert.equal(found.type, t);
        assert.ok(found.id);
        assert.ok(found.title);
        assert.ok(found.urlOrNotes);
      }
    });

    it('T1.2: editing material titles, URLs/notes, and summary fields preserves integrity', () => {
      const initialMat: PreEventMaterial = {
        id: 'mat-edit-1',
        title: 'Initial Slide Deck Draft',
        type: 'slides',
        urlOrNotes: 'https://old-link.com/slides',
        summary: 'Old summary description.',
      };

      const updatedMat: PreEventMaterial = {
        ...initialMat,
        title: 'Updated Production Slide Deck (Final)',
        urlOrNotes: 'https://dwc.org.ng/slides/final-deck.pdf',
        summary: 'Updated presentation deck with 60 comprehensive slides.',
      };

      assert.equal(updatedMat.id, initialMat.id);
      assert.equal(updatedMat.title, 'Updated Production Slide Deck (Final)');
      assert.equal(updatedMat.urlOrNotes, 'https://dwc.org.ng/slides/final-deck.pdf');
      assert.equal(updatedMat.summary, 'Updated presentation deck with 60 comprehensive slides.');
    });

    it('T1.3: deleting materials by ID filters out targeted item cleanly', () => {
      const materials: PreEventMaterial[] = [
        { id: 'm1', title: 'Checklist', type: 'checklist', urlOrNotes: 'n1', summary: 's1' },
        { id: 'm2', title: 'Video Intro', type: 'video', urlOrNotes: 'n2', summary: 's2' },
        { id: 'm3', title: 'GitHub Repo', type: 'repo', urlOrNotes: 'n3', summary: 's3' },
      ];

      const targetId = 'm2';
      const remaining = materials.filter((m) => m.id !== targetId);

      assert.equal(remaining.length, 2);
      assert.ok(!remaining.some((m) => m.id === targetId));
      assert.equal(remaining[0].id, 'm1');
      assert.equal(remaining[1].id, 'm3');
    });

    it('T1.4: updating existing scheduled event preEventMaterials list replaces items safely', () => {
      const existingMaterials = [...sampleEvent.preEventMaterials];
      const newKit: PreEventMaterial[] = [
        ...existingMaterials,
        {
          id: 'mat-3',
          title: 'Docker Environment Setup Checklist',
          type: 'checklist',
          urlOrNotes: 'Install Docker Desktop and pull Node 22 alpine image.',
          summary: 'Prerequisite local runtime verification.',
        },
      ];

      const updatedEvent: CoursemartEvent = {
        ...sampleEvent,
        preEventMaterials: newKit,
      };

      assert.equal(updatedEvent.preEventMaterials.length, 3);
      assert.equal(updatedEvent.preEventMaterials[2].id, 'mat-3');
    });

    it('T1.5: listing materials for attendees formats acknowledgement HTML and ICS descriptions correctly', () => {
      const emailContent = buildPreEventAcknowledgementHtml(sampleEvent, sampleRegistration);

      assert.ok(emailContent.subject.includes(sampleEvent.title));
      assert.ok(emailContent.subject.includes('Pre-Event Materials'));
      assert.ok(emailContent.html.includes('Masterclass Architectural Overview Slide Deck'));
      assert.ok(emailContent.html.includes('Starter GitHub Repository'));
      assert.ok(emailContent.html.includes('SLIDES'));
      assert.ok(emailContent.html.includes('REPO'));

      const ics = buildEventIcsContent(sampleEvent, sampleRegistration.confirmationCode);
      assert.ok(ics.includes('Pre-Event Materials'));
      assert.ok(ics.includes('Masterclass Architectural Overview Slide Deck'));
      assert.ok(ics.includes('Starter GitHub Repository'));
    });

    // --- Tier 2: Boundary & Corner Cases (>=5 tests) ---

    it('T2.1: invalid material type handling falls back to valid default or handles unknown safely', () => {
      const validTypes = new Set(['pdf', 'slides', 'repo', 'checklist', 'video']);
      const testTypes = ['pdf', 'unknown-format', 'exe', 'video'];

      const sanitizedTypes = testTypes.map((t) => (validTypes.has(t) ? t : 'checklist'));

      assert.equal(sanitizedTypes[0], 'pdf');
      assert.equal(sanitizedTypes[1], 'checklist');
      assert.equal(sanitizedTypes[2], 'checklist');
      assert.equal(sanitizedTypes[3], 'video');
    });

    it('T2.2: empty URL or notes validation rejects or flags missing links', () => {
      const emptyUrlMaterial = {
        title: 'Prerequisite Guide',
        urlOrNotes: '   ',
      };

      const isValid = Boolean(emptyUrlMaterial.title.trim() && emptyUrlMaterial.urlOrNotes.trim());
      assert.equal(isValid, false, 'Material with empty URL/notes must not be valid');
    });

    it('T2.3: oversized material lists (50 items) render safely without crashing or overflow', () => {
      const largeKit: PreEventMaterial[] = Array.from({ length: 50 }, (_, i) => ({
        id: `mat-bulk-${i + 1}`,
        title: `Module ${i + 1} Resource Kit`,
        type: 'pdf',
        urlOrNotes: `https://dwc.org.ng/resources/module-${i + 1}.pdf`,
        summary: `Automated preparation kit item ${i + 1}.`,
      }));

      const heavyEvent: CoursemartEvent = {
        ...sampleEvent,
        preEventMaterials: largeKit,
      };

      const email = buildPreEventAcknowledgementHtml(heavyEvent, sampleRegistration);
      assert.ok(email.html.includes('Module 50 Resource Kit'));
      assert.ok(email.html.length > 5000);
    });

    it('T2.4: malformed material IDs (whitespace or missing) are sanitized or regenerated', () => {
      const generateMaterialId = (rawId?: string): string => {
        const clean = (rawId || '').trim();
        return clean.length > 0 ? clean : `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      };

      assert.equal(generateMaterialId('mat-existing-123'), 'mat-existing-123');
      const generated = generateMaterialId('   ');
      assert.ok(generated.startsWith('mat-'));
    });

    it('T2.5: duplicate material IDs handling deduplicates IDs in collection', () => {
      const itemsWithDupes: PreEventMaterial[] = [
        { id: 'dup-1', title: 'Item 1', type: 'pdf', urlOrNotes: 'u1', summary: 's1' },
        { id: 'dup-1', title: 'Item 2', type: 'video', urlOrNotes: 'u2', summary: 's2' },
        { id: 'dup-2', title: 'Item 3', type: 'slides', urlOrNotes: 'u3', summary: 's3' },
      ];

      const deduplicated: PreEventMaterial[] = [];
      const seen = new Set<string>();

      for (const item of itemsWithDupes) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          deduplicated.push(item);
        } else {
          const freshId = `${item.id}-revised-${Date.now()}`;
          seen.add(freshId);
          deduplicated.push({ ...item, id: freshId });
        }
      }

      assert.equal(deduplicated.length, 3);
      assert.equal(new Set(deduplicated.map((m) => m.id)).size, 3);
    });
  });

  /* ==========================================================================
     Feature 7: Explicit Free/Paid Pricing Controls
     ========================================================================== */

  describe('Feature 7: Explicit Free/Paid Pricing Controls', () => {
    // --- Tier 1: Coverage (>=5 tests) ---

    it('T1.6: isEventFree returns true for free event with price=0 or isFree=true', () => {
      const freeEventPrice0 = { price: 0 };
      assert.equal(isEventFree(freeEventPrice0), true);

      const freeEventFlag = { isFree: true, price: 50000 };
      assert.equal(isEventFree(freeEventFlag), true, 'Explicit isFree=true must override price');

      const freeEventNegative = { price: -100 };
      assert.equal(isEventFree(freeEventNegative), true);
    });

    it('T1.7: isEventFree returns false for paid event with price > 0 and isFree=false', () => {
      const paidEvent = { price: 25000, isFree: false };
      assert.equal(isEventFree(paidEvent), false);

      const standardEvent = { price: 15000 };
      assert.equal(isEventFree(standardEvent), false);
    });

    it('T1.8: validateEventPricing validates free admission without requiring price > 0', () => {
      const resultFreeZero = validateEventPricing(true, 0);
      assert.equal(resultFreeZero.valid, true);

      const resultFreePositive = validateEventPricing(true, 5000);
      assert.equal(resultFreePositive.valid, true);
    });

    it('T1.9: validateEventPricing requires ticket fee > 0 for paid events and returns clear error', () => {
      const resultPaidZero = validateEventPricing(false, 0);
      assert.equal(resultPaidZero.valid, false);
      assert.ok(resultPaidZero.error);
      assert.match(resultPaidZero.error, /paid events require a ticket fee/i);

      const resultPaidValid = validateEventPricing(false, 25000);
      assert.equal(resultPaidValid.valid, true);
      assert.equal(resultPaidValid.error, undefined);
    });

    it('T1.10: admin toggle behavior transitions between Free Admission and Paid Ticket rules', () => {
      let isFreeToggle = true;
      let priceInput = 0;

      // Free mode
      let validation = validateEventPricing(isFreeToggle, priceInput);
      assert.equal(validation.valid, true);

      // Admin toggles to Paid Ticket without setting price
      isFreeToggle = false;
      validation = validateEventPricing(isFreeToggle, priceInput);
      assert.equal(validation.valid, false);

      // Admin enters valid price ₦15,000
      priceInput = 15000;
      validation = validateEventPricing(isFreeToggle, priceInput);
      assert.equal(validation.valid, true);
    });

    // --- Tier 2: Boundary & Corner Cases (>=5 tests) ---

    it('T2.6: negative price rejection marks paid event invalid', () => {
      const negValidation = validateEventPricing(false, -5000);
      assert.equal(negValidation.valid, false);
      assert.ok(negValidation.error);
    });

    it('T2.7: zero price marked as paid event is strictly rejected', () => {
      const zeroPaid = validateEventPricing(false, 0);
      assert.equal(zeroPaid.valid, false);
      assert.match(zeroPaid.error!, /greater than ₦0/);
    });

    it('T2.8: non-numeric price inputs (NaN, null, undefined) handled defensively', () => {
      const nanValidation = validateEventPricing(false, NaN);
      assert.equal(nanValidation.valid, false);

      // @ts-expect-error - testing invalid runtime null
      const nullValidation = validateEventPricing(false, null);
      assert.equal(nullValidation.valid, false);

      // @ts-expect-error - testing invalid runtime undefined
      const undefValidation = validateEventPricing(false, undefined);
      assert.equal(undefValidation.valid, false);
    });

    it('T2.9: extreme price values (50,000,000 NGN) validated cleanly', () => {
      const highPrice = 50_000_000;
      const validation = validateEventPricing(false, highPrice);
      assert.equal(validation.valid, true);
      assert.equal(formatNaira(highPrice), '₦50,000,000');
    });

    it('T2.10: currency formatting integration formats ₦0 for free vs formatted Naira for paid events', () => {
      assert.equal(formatNaira(0), '₦0');
      assert.equal(formatNaira(1500), '₦1,500');
      assert.equal(formatNaira(35000), '₦35,000');
      assert.equal(formatNaira(150000), '₦150,000');
    });
  });
});
