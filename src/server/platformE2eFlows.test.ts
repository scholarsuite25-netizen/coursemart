/**
 * Comprehensive E2E Integration Suite: Pairwise Combinations & Real-World Application Scenarios
 * Requirements: R1, R2, R3, R4
 * Test Coverage: Tier 3 (Pairwise Combinations) & Tier 4 (Real-World Scenarios)
 *
 * Styling rule: No spaces before or after '/' between words (e.g. free/paid, FAQ/community, dwc/ngo).
 * Offline isolation: Strictly offline deterministic execution; zero live paid tokens consumed.
 */

import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApiApp } from './createApp.ts';
import {
  buildEnquiryResponse,
  formatEnquiryTieredResponse,
} from '../utils/agentAutomation.ts';
import {
  archiveAssistantAnswerToCommunity,
  filterAndSortForumThreads,
} from '../utils/community.ts';
import {
  searchPromptVault,
  filterPromptVault,
  interpolatePromptTemplate,
} from '../utils/funnelsAndVault.ts';
import { SEED_PROMPT_VAULT_ITEMS } from '../data/promptVaultCatalog.ts';
import {
  isEventFree,
  validateEventPricing,
  buildPreEventAcknowledgementHtml,
  buildEventIcsContent,
  validateEventRegistrationForm,
  generateEventConfirmationCode,
} from '../utils/events.ts';
import { generateAiCompletion } from './aiRouter.ts';
import { createUserSessionToken } from './userAuth.ts';
import type {
  CoursemartEvent,
  EventRegistration,
  CommunityForumThread,
  PreEventMaterial,
} from '../types/marketplace.ts';

describe('DWC Platform End-to-End Integration Flows', () => {
  let server: Server;
  let baseUrl: string;
  const testSecret = 'e2e-integration-flow-secret-2026';

  before(async () => {
    process.env.USER_SESSION_SECRET = testSecret;
    process.env.NODE_ENV = 'test';
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

  /* ==========================================================================
     Tier 3: Pairwise Combinations (>=7 tests)
     ========================================================================== */

  describe('Tier 3: Pairwise Combinations', () => {
    it('Pairwise 1: Prompt search via assistant with free vs paid tier', async () => {
      const promptQuery = 'Tell me about the DWC Prompt Vault and blueprints';

      // 1. Free/anonymous visitor enquiry
      const anonRes = await fetch(`${baseUrl}/api/agents/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: promptQuery }),
      });
      assert.equal(anonRes.status, 200);
      const anonData = await anonRes.json();
      assert.equal(anonData.userTier, 'anonymous');
      assert.equal(anonData.isTeaser, true);
      assert.ok(anonData.cta);
      assert.match(anonData.cta.link, /\/membership/);

      // 2. Authenticated paid member enquiry
      const paidToken = createUserSessionToken(
        'user-paid-1',
        'paid.member@example.com',
        'customer',
        testSecret,
        Date.now(),
        3600_000
      );

      // Deterministic tiered helper verification for paid tier
      const paidDirect = buildEnquiryResponse(promptQuery, { userTier: 'paid' });
      assert.equal(paidDirect.userTier, 'paid');
      assert.equal(paidDirect.isTeaser, false);
      assert.equal(paidDirect.cta, undefined);
      assert.ok(paidDirect.answer.length > 50);
      assert.match(paidDirect.answer, /105 battle-tested/i);
    });

    it('Pairwise 2: Auto-archiving photography prompt query to community forum', async () => {
      const photographyQuestion = 'What camera settings and rim lighting setup work best for golden hour portraits?';
      const detailedAnswer = 'For golden hour portraits, position the subject with their back to the low sun, use an 85mm lens at f/1.4 to f/2.0 with a circular polarizer, and expose for the face while catching warm rim light on the hair and shoulders.';
      const topics = ['photography', 'lighting', 'portrait'];

      const thread = await archiveAssistantAnswerToCommunity(photographyQuestion, detailedAnswer, topics);

      assert.ok(thread);
      assert.equal(thread.category, 'FAQ');
      assert.ok(thread.tags.includes('photography'));
      assert.ok(thread.tags.includes('faq'));
      assert.match(thread.slug, /what-camera-settings/);
      assert.equal(thread.isSolved, true);
    });

    it('Pairwise 3: Free vs paid event registration and access to pre-event materials', () => {
      // 1. Free event
      const freeEvent: CoursemartEvent = {
        id: 'evt-free-cohort',
        slug: 'free-open-source-ai-workshop',
        title: 'Open-Source AI & Agent Workflows Workshop',
        subtitle: 'Community workshop on building autonomous agents',
        description: 'Free interactive session.',
        format: 'workshop',
        category: 'AI',
        deliveryMode: 'Live Virtual (Zoom/Meet)',
        locationOrLink: 'https://zoom.us/j/community-free',
        startAt: '2026-12-10T16:00:00.000Z',
        endAt: '2026-12-10T18:00:00.000Z',
        timezone: 'WAT (UTC+1)',
        speakerName: 'S. B. Omotoso',
        speakerRole: 'Lead Instructor',
        speakerAvatar: 'https://example.com/avatar.png',
        coverImage: 'https://example.com/cover.png',
        price: 0,
        isFree: true,
        capacity: 100,
        status: 'published',
        featured: true,
        agenda: ['Setup', 'Hands-on Lab', 'Q&A'],
        preEventMaterials: [
          {
            id: 'mat-free-1',
            title: 'Free Workshop Preparation Checklist',
            type: 'checklist',
            urlOrNotes: 'Review pre-event setup guide',
            summary: 'Ensure Node 22 and Git are installed.',
          },
        ],
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      };

      assert.equal(isEventFree(freeEvent), true);
      assert.equal(validateEventPricing(true, 0).valid, true);

      // 2. Paid event
      const paidEvent: CoursemartEvent = {
        ...freeEvent,
        id: 'evt-paid-masterclass',
        title: 'Executive AI Architecture Masterclass',
        price: 45000,
        isFree: false,
        preEventMaterials: [
          {
            id: 'mat-paid-1',
            title: 'Masterclass Slides Deck',
            type: 'slides',
            urlOrNotes: 'https://slides.dwc.org.ng/deck.pdf',
            summary: 'Comprehensive 60-slide deck.',
          },
        ],
      };

      assert.equal(isEventFree(paidEvent), false);
      assert.equal(validateEventPricing(false, 45000).valid, true);
      assert.equal(validateEventPricing(false, 0).valid, false);
    });

    it('Pairwise 4: AI router failover during assistant enquiry request', async () => {
      let proxyAttempts = 0;

      const mockFetch: typeof fetch = async (input) => {
        proxyAttempts++;
        if (proxyAttempts === 1) {
          // Primary free model returns 429
          return new Response(JSON.stringify({ error: { code: 429, message: 'Too many requests' } }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Here is the comprehensive answer to your inquiry, served via transparent failover.' }],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await generateAiCompletion({
        prompt: 'How do I scale autonomous agent workflows in Node.js?',
        mockFetch,
      });

      assert.equal(result.isZeroCost, true);
      assert.equal(result.fallbackOccurred, true);
      assert.match(result.text, /transparent failover/);
      assert.ok(proxyAttempts >= 2);
    });

    it('Pairwise 5: Event materials download with free admission user session', () => {
      const freeEvent: CoursemartEvent = {
        id: 'evt-free-webinar',
        slug: 'free-webinar',
        title: 'Free Digital Skills Masterclass',
        subtitle: 'Learn monetization and affiliate growth',
        description: 'Free session for creators.',
        format: 'seminar',
        category: 'Business & Strategy',
        deliveryMode: 'Live Virtual (Zoom/Meet)',
        locationOrLink: 'https://meet.google.com/xyz',
        startAt: '2026-12-20T10:00:00.000Z',
        endAt: '2026-12-20T12:00:00.000Z',
        timezone: 'WAT (UTC+1)',
        speakerName: 'Dr. Elena Vance',
        speakerRole: 'Lead Instructor',
        speakerAvatar: 'https://example.com/avatar.png',
        coverImage: 'https://example.com/cover.png',
        price: 0,
        isFree: true,
        capacity: 200,
        status: 'published',
        featured: false,
        agenda: ['Keynote', 'Q&A'],
        preEventMaterials: [
          {
            id: 'm-free-1',
            title: 'Affiliate Playbook PDF',
            type: 'pdf',
            urlOrNotes: 'https://dwc.org.ng/resources/affiliate-playbook.pdf',
            summary: 'Blueprint for earning commissions.',
          },
          {
            id: 'm-free-2',
            title: 'Setup Checklist',
            type: 'checklist',
            urlOrNotes: 'https://dwc.org.ng/checklist',
            summary: 'Prerequisite checklist.',
          },
        ],
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      };

      const reg: EventRegistration = {
        id: 'reg-free-1',
        eventId: freeEvent.id,
        fullName: 'Aisha Bello',
        email: 'aisha@example.com',
        roleTitle: 'Content Creator',
        experienceLevel: 'Beginner',
        attendanceMode: 'Live Virtual',
        paymentStatus: 'free',
        confirmationCode: 'CM-FREE-112233',
        newsletterOptIn: true,
        registeredAt: '2026-11-24T00:00:00.000Z',
      };

      const ack = buildPreEventAcknowledgementHtml(freeEvent, reg);
      assert.ok(ack.subject.includes('Confirmed: Free Digital Skills Masterclass'));
      assert.ok(ack.html.includes('Affiliate Playbook PDF'));
      assert.ok(ack.html.includes('Setup Checklist'));

      const ics = buildEventIcsContent(freeEvent, reg.confirmationCode);
      assert.ok(ics.includes('Affiliate Playbook PDF'));
    });

    it('Pairwise 6: Community forum thread retrieval from assistant suggestion with photography tags', async () => {
      const q = 'How to capture high-fashion editorial runway photos with flash?';
      const a = 'Use high-speed sync (HSS) with a beauty dish or deep parabolic umbrella, shoot at f/4 to f/5.6 to maintain model sharpness, and sync flash to second curtain.';
      const tags = ['photography', 'fashion', 'editorial'];

      const thread = await archiveAssistantAnswerToCommunity(q, a, tags);
      assert.ok(thread);

      const catalog: CommunityForumThread[] = [thread];
      const foundByTag = filterAndSortForumThreads(catalog, { tag: 'fashion' });
      assert.equal(foundByTag.length, 1);
      assert.equal(foundByTag[0].id, thread.id);

      const foundBySearch = filterAndSortForumThreads(catalog, { search: 'runway photos' });
      assert.equal(foundBySearch.length, 1);
      assert.equal(foundBySearch[0].id, thread.id);
    });

    it('Pairwise 7: Zero-cost router under high load combined with prompt vault lookup', async () => {
      const mockFetch: typeof fetch = async () => {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Deterministic load test completion.' }],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      // Run 10 concurrent prompt vault searches and AI router completions
      const operations = Array.from({ length: 10 }, async (_, i) => {
        const prompts = searchPromptVault('portrait', 'Photography & Camera Prompts', 2, SEED_PROMPT_VAULT_ITEMS);
        const ai = await generateAiCompletion({
          prompt: `Operation ${i}: Summarize prompt ${prompts[0]?.title || 'general'}`,
          mockFetch,
        });
        return { promptCount: prompts.length, aiText: ai.text, isZeroCost: ai.isZeroCost };
      });

      const results = await Promise.all(operations);
      assert.equal(results.length, 10);
      for (const r of results) {
        assert.ok(r.promptCount > 0);
        assert.equal(r.isZeroCost, true);
        assert.match(r.aiText, /load test completion/);
      }
    });
  });

  /* ==========================================================================
     Tier 4: Real-World Application Scenarios (>=5 tests)
     ========================================================================== */

  describe('Tier 4: Real-World Application Scenarios', () => {
    it('Scenario 1: Anonymous visitor asks technical question -> receives teaser & upgrade CTA -> registers as paid member -> receives comprehensive guide -> question auto-archived in community FAQ', async () => {
      const techQuestion = 'How do I request a refund for a digital course?';

      // Step 1 & 2: Anonymous visitor receives teaser and upgrade CTA
      const anonEnquiry = buildEnquiryResponse(techQuestion, { userTier: 'anonymous' });
      assert.equal(anonEnquiry.isTeaser, true);
      assert.equal(anonEnquiry.userTier, 'anonymous');
      assert.ok(anonEnquiry.cta);
      assert.equal(anonEnquiry.cta.link, '/membership');

      // Step 3: Visitor registers and becomes paid member
      const paidUserTier: 'paid' = 'paid';

      // Step 4: Member re-queries and receives comprehensive answer with priority refund terms
      const paidEnquiry = buildEnquiryResponse(techQuestion, { userTier: paidUserTier });
      assert.equal(paidEnquiry.isTeaser, false);
      assert.equal(paidEnquiry.userTier, 'paid');
      assert.equal(paidEnquiry.cta, undefined);
      assert.match(paidEnquiry.answer, /priority processing within 3-5 business days/i);

      // Step 5: High-value question & answer is auto-archived in community FAQ
      const archivedThread = await archiveAssistantAnswerToCommunity(
        techQuestion,
        paidEnquiry.answer,
        paidEnquiry.matchedTopics
      );
      assert.ok(archivedThread);
      assert.equal(archivedThread.category, 'FAQ');
      assert.match(archivedThread.slug, /how-do-i-request-a-refund/);
      assert.equal(archivedThread.isSolved, true);
    });

    it('Scenario 2: Paid member searches Member Prompt Vault for portrait photography prompts -> customizes parameters -> retrieves ChatGPT prompt -> queries assistant for camera settings advice using zero-cost router', async () => {
      // Step 1: Paid member searches Member Prompt Vault for portrait prompts
      const searchResults = searchPromptVault('portrait', 'Photography & Camera Prompts', 5, SEED_PROMPT_VAULT_ITEMS);
      assert.ok(searchResults.length >= 1);

      // Step 2: Member selects vault-127 (Golden Hour Portrait)
      const selectedPrompt = searchResults.find((p) => p.id === 'vault-127');
      assert.ok(selectedPrompt);

      // Step 3: Member customizes parameters in PromptCustomizerModal
      const customized = interpolatePromptTemplate(selectedPrompt.template, {
        subject_description: 'Young Nigerian entrepreneur in traditional agbada',
        environment: 'Lekki shoreline during golden hour sunset',
        lighting_setup: 'Warm directional rim lighting with subtle fill reflector',
        camera_equipment: 'Canon EOS R5 with 85mm f/1.2L lens',
      });
      assert.ok(customized.prompt.includes('Young Nigerian entrepreneur'));
      assert.ok(customized.prompt.includes('Lekki shoreline'));
      assert.equal(customized.missingVariables.length, 0);

      // Step 4 & 5: Member queries assistant for camera settings using zero-cost router
      const mockFetch: typeof fetch = async () => {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Recommended settings: f/1.4, 1/500s shutter speed, ISO 100, WB 5600K.' }],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const aiResponse = await generateAiCompletion({
        prompt: `Recommend camera settings for: ${customized.prompt.slice(0, 100)}`,
        modelTier: 'fast',
        mockFetch,
      });

      assert.equal(aiResponse.isZeroCost, true);
      assert.match(aiResponse.text, /ISO 100/);
    });

    it('Scenario 3: Admin creates new paid masterclass event -> configures pre-event kit (PDF slides + GitHub repo) -> sets ticket price -> validates pricing -> attendee registers and accesses pre-event kit', () => {
      // Step 1: Admin configures new paid masterclass
      const isFreeAdmission = false;
      const ticketPrice = 30000;

      // Step 2: Configure pre-event preparation kit
      const prepKit: PreEventMaterial[] = [
        {
          id: 'mat-slides-1',
          title: 'Full-Stack Vibe Coding Slide Deck',
          type: 'slides',
          urlOrNotes: 'https://slides.dwc.org.ng/vibe-coding-2026.pdf',
          summary: 'Review slides 1-20 before kickoff.',
        },
        {
          id: 'mat-repo-1',
          title: 'Workshop Starter GitHub Repository',
          type: 'repo',
          urlOrNotes: 'https://github.com/digitalwealthcreators/vibe-starter',
          summary: 'Clone repo and verify local npm test passes.',
        },
      ];

      // Step 3: Admin validates pricing
      const pricingValidation = validateEventPricing(isFreeAdmission, ticketPrice);
      assert.equal(pricingValidation.valid, true);

      const masterclassEvent: CoursemartEvent = {
        id: 'evt-masterclass-paid-1',
        slug: 'vibe-coding-full-stack-masterclass',
        title: 'Full-Stack Vibe Coding & Agent Deployment Masterclass',
        subtitle: 'Intensive 4-hour live implementation lab',
        description: 'Complete hands-on guide to production agents.',
        format: 'online-course',
        category: 'AI',
        deliveryMode: 'Live Virtual (Zoom/Meet)',
        locationOrLink: 'https://zoom.us/j/paid-masterclass-777',
        startAt: '2026-12-18T14:00:00.000Z',
        endAt: '2026-12-18T18:00:00.000Z',
        timezone: 'WAT (UTC+1)',
        speakerName: 'Dr. Elena Vance',
        speakerRole: 'Lead Instructor',
        speakerAvatar: 'https://example.com/elena.jpg',
        coverImage: 'https://example.com/cover.jpg',
        price: ticketPrice,
        isFree: isFreeAdmission,
        capacity: 50,
        status: 'published',
        featured: true,
        agenda: ['Theory', 'Building', 'Deploying'],
        preEventMaterials: prepKit,
        createdAt: '2026-11-20T00:00:00.000Z',
        updatedAt: '2026-11-20T00:00:00.000Z',
      };

      assert.equal(isEventFree(masterclassEvent), false);

      // Step 4: Attendee registers
      const attendeeReg: EventRegistration = {
        id: 'reg-attendee-paid',
        eventId: masterclassEvent.id,
        fullName: 'Chidi Okonkwo',
        email: 'chidi@example.com',
        roleTitle: 'Senior Backend Engineer',
        experienceLevel: 'Advanced',
        attendanceMode: 'Live Virtual',
        paymentStatus: 'paid_paystack',
        confirmationCode: generateEventConfirmationCode(masterclassEvent.id, 'chidi@example.com'),
        newsletterOptIn: true,
        registeredAt: '2026-11-24T12:00:00.000Z',
      };

      // Step 5: Attendee accesses pre-event kit via confirmation acknowledgement
      const confirmation = buildPreEventAcknowledgementHtml(masterclassEvent, attendeeReg);
      assert.ok(confirmation.html.includes('Full-Stack Vibe Coding Slide Deck'));
      assert.ok(confirmation.html.includes('Workshop Starter GitHub Repository'));
    });

    it('Scenario 4: Admin creates free community workshop -> sets free admission (price = 0) -> configures checklist pre-event kit -> free user registers without payment checkout -> accesses pre-event preparation materials', () => {
      // Step 1: Admin sets free admission
      const isFreeAdmission = true;
      const ticketPrice = 0;

      const pricingValidation = validateEventPricing(isFreeAdmission, ticketPrice);
      assert.equal(pricingValidation.valid, true);

      // Step 2: Pre-event checklist kit
      const freeKit: PreEventMaterial[] = [
        {
          id: 'mat-free-chk-1',
          title: 'Free Workshop Prerequisites & Environment Checklist',
          type: 'checklist',
          urlOrNotes: 'Ensure Node.js 22 LTS, Git, and VS Code are installed.',
          summary: 'Prerequisite checklist for all registered attendees.',
        },
      ];

      const freeWorkshop: CoursemartEvent = {
        id: 'evt-free-workshop-1',
        slug: 'free-getting-started-with-ai',
        title: 'Getting Started with AI: Free Hands-On Workshop',
        subtitle: 'Zero-barrier workshop for creators and engineers',
        description: 'Complete introductory lab.',
        format: 'workshop',
        category: 'AI',
        deliveryMode: 'Live Virtual (Zoom/Meet)',
        locationOrLink: 'https://zoom.us/j/free-workshop-001',
        startAt: '2026-12-22T15:00:00.000Z',
        endAt: '2026-12-22T17:00:00.000Z',
        timezone: 'WAT (UTC+1)',
        speakerName: 'S. B. Omotoso',
        speakerRole: 'Lead Instructor',
        speakerAvatar: 'https://example.com/avatar.png',
        coverImage: 'https://example.com/cover.png',
        price: 0,
        isFree: true,
        capacity: 150,
        status: 'published',
        featured: false,
        agenda: ['Welcome', 'Live Demo', 'Q&A'],
        preEventMaterials: freeKit,
        createdAt: '2026-11-20T00:00:00.000Z',
        updatedAt: '2026-11-20T00:00:00.000Z',
      };

      assert.equal(isEventFree(freeWorkshop), true);

      // Step 3: Free user registers without payment
      const formValidation = validateEventRegistrationForm(
        {
          fullName: 'Grace Nwosu',
          email: 'grace@example.com',
          roleTitle: 'Aspiring Developer',
          experienceLevel: 'Beginner',
          attendanceMode: 'Live Virtual',
          newsletterOptIn: true,
        },
        freeWorkshop,
        []
      );
      assert.equal(formValidation.valid, true);

      const freeRegistration: EventRegistration = {
        id: 'reg-free-grace',
        eventId: freeWorkshop.id,
        fullName: 'Grace Nwosu',
        email: 'grace@example.com',
        roleTitle: 'Aspiring Developer',
        experienceLevel: 'Beginner',
        attendanceMode: 'Live Virtual',
        paymentStatus: 'free',
        confirmationCode: generateEventConfirmationCode(freeWorkshop.id, 'grace@example.com'),
        newsletterOptIn: true,
        registeredAt: new Date().toISOString(),
      };

      assert.equal(freeRegistration.paymentStatus, 'free');

      // Step 4: Accesses pre-event preparation materials
      const ack = buildPreEventAcknowledgementHtml(freeWorkshop, freeRegistration);
      assert.ok(ack.html.includes('Free Workshop Prerequisites & Environment Checklist'));
      assert.ok(ack.html.includes('CHECKLIST'));
    });

    it('Scenario 5: System-wide zero-cost resilience journey: Assistant experiences simulated proxy 429 spike -> transparently fails over to secondary free model -> answers user query -> auto-archives to forum -> user visits forum thread', async () => {
      let callCount = 0;
      const question = 'How do I resolve Next.js 15 server component hydration mismatches?';

      const mockFetch: typeof fetch = async () => {
        callCount++;
        // First model fails with 429 rate limit spike
        if (callCount === 1) {
          return new Response(
            JSON.stringify({ error: { code: 429, message: 'Provider rate limit exceeded' } }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // Secondary free model answers reliably
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: 'Hydration mismatches in Next.js 15 occur when server-rendered HTML differs from the client render tree. Use suppressHydrationWarning for timestamp displays or move non-deterministic logic to useEffect.',
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      // Step 1: AI Router completes query through failover
      const completion = await generateAiCompletion({
        prompt: question,
        mockFetch,
      });

      assert.equal(completion.isZeroCost, true);
      assert.equal(completion.fallbackOccurred, true);
      assert.match(completion.text, /Hydration mismatches in Next.js 15/);
      assert.equal(callCount, 2, 'Must have failed over on 429');

      // Step 2: High-value question & answer auto-archived to forum
      const archivedThread = await archiveAssistantAnswerToCommunity(
        question,
        completion.text,
        ['nextjs', 'react', 'web-development']
      );

      assert.ok(archivedThread);
      assert.equal(archivedThread.category, 'Course Q&A');
      assert.ok(archivedThread.slug.includes('hydration-mismatches'));

      // Step 3: User visits community discussions and retrieves the thread
      const publicThreads: CommunityForumThread[] = [archivedThread];
      const retrieved = filterAndSortForumThreads(publicThreads, {
        search: 'hydration mismatches',
      });

      assert.equal(retrieved.length, 1);
      assert.equal(retrieved[0].id, archivedThread.id);
      assert.equal(retrieved[0].title, question);
      assert.equal(retrieved[0].body, completion.text);
      assert.equal(retrieved[0].isSolved, true);
    });
  });
});
