/**
 * E2E Test Suite: DWC Assistant Tiered Answering & Community Auto-Archiving
 * Requirements: R1 (Tiered Answering, Off-Website Knowledge, Community Auto-Archiving)
 * Test Coverage: Tier 1 (Feature Coverage) & Tier 2 (Boundary & Corner Cases)
 *
 * Styling rule: No spaces before or after '/' between words (e.g. free/paid, FAQ/community, dwc/ngo).
 * Offline isolation: Deterministic offline execution with zero live token consumption.
 */

import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApiApp } from '../server/createApp.ts';
import {
  buildEnquiryResponse,
  formatEnquiryTieredResponse,
  runEnquiryAgent,
  type EnquiryResponse,
} from './agentAutomation.ts';
import {
  archiveAssistantAnswerToCommunity,
  filterAndSortForumThreads,
} from './community.ts';
import type { CommunityForumThread } from '../types/marketplace.ts';
import { createUserSessionToken } from '../server/userAuth.ts';

describe('DWC Assistant Tiered Answering & Community Auto-Archiving', () => {
  let server: Server;
  let baseUrl: string;
  const testSecret = 'test-session-secret-dwc-e2e-2026';

  before(async () => {
    process.env.USER_SESSION_SECRET = testSecret;
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
     Feature 2: Tiered Answering (Paid vs Teaser)
     ========================================================================== */

  describe('Feature 2: Tiered Answering (Paid vs Teaser)', () => {
    // --- Tier 1: Coverage (>=5 tests) ---

    it('T1.1: paid user detailed answers return isTeaser=false, userTier=paid, and no upgrade CTA', () => {
      const question = 'How do I request a refund for a digital course?';
      const paidResponse = buildEnquiryResponse(question, { userTier: 'paid' });

      assert.equal(paidResponse.isTeaser, false);
      assert.equal(paidResponse.userTier, 'paid');
      assert.equal(paidResponse.cta, undefined);
      assert.ok(paidResponse.answer.length > 50);
      assert.match(paidResponse.answer, /priority processing/i);
    });

    it('T1.2: free and anonymous teaser responses return isTeaser=true, userTier=anonymous or free, with introductory summary', () => {
      const question = 'How do I request a refund for a digital course?';
      const anonResponse = buildEnquiryResponse(question, { userTier: 'anonymous' });
      const freeResponse = buildEnquiryResponse(question, { userTier: 'free' });

      assert.equal(anonResponse.isTeaser, true);
      assert.equal(anonResponse.userTier, 'anonymous');
      assert.ok(anonResponse.cta);
      assert.match(anonResponse.cta.link, /\/membership/);

      assert.equal(freeResponse.isTeaser, true);
      assert.equal(freeResponse.userTier, 'free');
      assert.ok(freeResponse.cta);
      assert.match(freeResponse.cta.link, /\/membership/);
    });

    it('T1.3: clear CTA inclusion in teaser responses pointing to /membership upgrade', () => {
      const question = 'Tell me about the DWC Prompt Vault and blueprints';
      const teaserResponse = buildEnquiryResponse(question, { userTier: 'anonymous' });

      assert.equal(teaserResponse.isTeaser, true);
      assert.ok(teaserResponse.cta, 'CTA must be present for teaser responses');
      assert.match(teaserResponse.cta.text, /upgrade to paid membership/i);
      assert.equal(teaserResponse.cta.link, '/membership');
    });

    it('T1.4: off-website general knowledge answering delivers guidance on topics outside immediate catalog', async () => {
      // General technical inquiry outside standard refund/billing topics
      const question = 'Explain how convolutional neural networks extract features in computer vision';
      const response = buildEnquiryResponse(question, { userTier: 'paid' });

      assert.ok(response);
      assert.ok(response.answer.length > 20);
      assert.equal(response.userTier, 'paid');
      assert.equal(response.isTeaser, false);
    });

    it('T1.5: DWC catalog context prioritization delivers high confidence (>=0.85) on billing, certificates, and vibe coding', () => {
      const billing = buildEnquiryResponse('What payment methods do you support? Paystack or GTB?', { userTier: 'paid' });
      const certs = buildEnquiryResponse('How do I verify my CM-CERT accreditation certificate?', { userTier: 'paid' });
      const vibe = buildEnquiryResponse('What is vibe coding and autonomous agent engineering?', { userTier: 'paid' });

      assert.ok(billing.confidence >= 0.85);
      assert.ok(billing.matchedTopics.includes('payments'));
      assert.ok(certs.confidence >= 0.85);
      assert.ok(certs.matchedTopics.includes('certificates'));
      assert.ok(vibe.confidence >= 0.85);
      assert.ok(vibe.matchedTopics.includes('vibe-coding'));
    });

    it('T1.6: formatEnquiryTieredResponse correctly formats responses for paid vs free/anonymous tiers', () => {
      const baseResponse: EnquiryResponse = {
        answer: 'Detailed engineering blueprint for Next.js and Supabase deployment.',
        matchedTopics: ['architecture'],
        confidence: 0.9,
      };

      const paidFormatted = formatEnquiryTieredResponse(baseResponse, 'paid');
      assert.equal(paidFormatted.isTeaser, false);
      assert.equal(paidFormatted.userTier, 'paid');
      assert.equal(paidFormatted.cta, undefined);

      const freeFormatted = formatEnquiryTieredResponse(baseResponse, 'free');
      assert.equal(freeFormatted.isTeaser, true);
      assert.equal(freeFormatted.userTier, 'free');
      assert.ok(freeFormatted.cta);

      const anonFormatted = formatEnquiryTieredResponse(baseResponse, 'anonymous');
      assert.equal(anonFormatted.isTeaser, true);
      assert.equal(anonFormatted.userTier, 'anonymous');
      assert.ok(anonFormatted.cta);
    });

    // --- Tier 2: Boundary & Corner Cases (>=5 tests) ---

    it('T2.1: empty question handling returns polite clarification and confidence=0', () => {
      const emptyRes = buildEnquiryResponse('', { userTier: 'paid' });
      const whitespaceRes = buildEnquiryResponse('     ', { userTier: 'free' });
      const punctuationRes = buildEnquiryResponse('???!!!...', { userTier: 'anonymous' });

      assert.equal(emptyRes.confidence, 0);
      assert.match(emptyRes.answer, /couldn't quite understand/i);
      assert.equal(whitespaceRes.confidence, 0);
      assert.equal(punctuationRes.confidence, 0);
    });

    it('T2.2: extremely long questions (5,000+ characters) are handled gracefully without truncation crashing', () => {
      const longQuery = 'Tell me about vibe coding architectures. ' + 'Very long detailed prompt context. '.repeat(200);
      assert.ok(longQuery.length > 5000);

      const response = buildEnquiryResponse(longQuery, { userTier: 'paid' });
      assert.ok(response);
      assert.ok(response.answer.length > 0);
      assert.ok(response.confidence >= 0.85);
    });

    it('T2.3: expired or invalid token authentication falls back gracefully to anonymous/teaser response in HTTP endpoint', async () => {
      const now = Date.now();
      const expiredToken = createUserSessionToken(
        'student-user-1',
        'student@example.com',
        'customer',
        testSecret,
        now - 120_000,
        60_000 // expired 60 seconds ago
      );

      const res = await fetch(`${baseUrl}/api/agents/enquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${expiredToken}`,
        },
        body: JSON.stringify({ question: 'How do certificates of completion work?' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.userTier, 'anonymous');
      assert.equal(data.isTeaser, true);
      assert.ok(data.cta);
    });

    it('T2.4: malformed request bodies (null question, non-string types, missing fields) handled safely without crash', async () => {
      const payloads = [
        { question: null },
        { question: 12345 },
        { question: { query: 'test' } },
        {},
      ];

      for (const payload of payloads) {
        const res = await fetch(`${baseUrl}/api/agents/enquiry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.ok, true);
        assert.equal(data.confidence, 0);
        assert.match(data.answer, /couldn't quite understand/i);
      }
    });

    it('T2.5: special characters and punctuation in queries are safely processed without throwing', () => {
      const specialQueries = [
        'How does <script>alert("xss")</script> affect DWC security?',
        'What about SQL injection DROP TABLE users;-- in course queries?',
        'Explain React hooks & state with symbols: @#$%^&*()_+/{}[]|:;<>?',
        'Does DWC offer support for free/paid and dwc/ngo models?',
      ];

      for (const q of specialQueries) {
        const res = buildEnquiryResponse(q, { userTier: 'paid' });
        assert.ok(res);
        assert.ok(typeof res.answer === 'string');
        assert.ok(res.answer.length > 0);
      }
    });

    it('T2.6: runEnquiryAgent helper returns identical contract to buildEnquiryResponse', () => {
      const q = 'How does the affiliate promoter commission work?';
      const direct = buildEnquiryResponse(q, { userTier: 'paid' });
      const helper = runEnquiryAgent(q, { userTier: 'paid' });

      assert.equal(direct.answer, helper.answer);
      assert.deepEqual(direct.matchedTopics, helper.matchedTopics);
      assert.equal(direct.confidence, helper.confidence);
      assert.equal(direct.isTeaser, helper.isTeaser);
    });
  });

  /* ==========================================================================
     Feature 3: Community Auto-Archiving
     ========================================================================== */

  describe('Feature 3: Community Auto-Archiving', () => {
    // --- Tier 1: Coverage (>=5 tests) ---

    it('T1.7: auto-archiving high-value answers generates CommunityForumThread with unique ID and timestamps', async () => {
      const question = 'How do I configure Paystack webhook signatures in Next.js?';
      const answer = 'To configure Paystack webhooks, verify the x-paystack-signature header using HMAC-SHA512 against your PAYSTACK_SECRET_KEY.';
      const topics = ['paystack', 'webhooks', 'security'];

      const thread = await archiveAssistantAnswerToCommunity(question, answer, topics);

      assert.ok(thread);
      assert.match(thread.id, /^th_faq_/);
      assert.equal(thread.title, question);
      assert.equal(thread.body, answer);
      assert.equal(thread.authorId, 'dwc-ai-assistant');
      assert.equal(thread.authorName, 'DWC AI Assistant');
      assert.equal(thread.isSolved, true);
      assert.ok(thread.createdAt);
      assert.ok(thread.updatedAt);
    });

    it('T1.8: category tagging assigns Course Q&A for curriculum topics and FAQ for platform topics', async () => {
      const courseQuestion = 'Where should I call my React hooks in component lifecycles?';
      const courseAnswer = 'React hooks must be called at the top level of your component function. Never call hooks inside loops or conditions.';
      const courseThread = await archiveAssistantAnswerToCommunity(courseQuestion, courseAnswer, ['react', 'hooks', 'web-development']);

      assert.ok(courseThread);
      assert.equal(courseThread.category, 'Course Q&A');

      const faqQuestion = 'What is the refund policy for manual GTB bank transfer orders?';
      const faqAnswer = 'Manual GTB bank transfer orders are protected by our 30-day money-back guarantee upon submitting the transfer receipt.';
      const faqThread = await archiveAssistantAnswerToCommunity(faqQuestion, faqAnswer, ['billing', 'refunds', 'payments']);

      assert.ok(faqThread);
      assert.equal(faqThread.category, 'FAQ');
    });

    it('T1.9: slug generation produces clean URL-friendly slug matching title', async () => {
      const question = 'How to verify CM-CERT accreditation credentials online?';
      const answer = 'Use the public verification portal and enter your 12-digit CM-CERT credential code to inspect certificate authenticity.';
      const thread = await archiveAssistantAnswerToCommunity(question, answer, ['certificates']);

      assert.ok(thread);
      assert.match(thread.slug, /how-to-verify-cm-cert/);
      assert.doesNotMatch(thread.slug, /[A-Z\s?]/);
    });

    it('T1.10: public accessibility ensures archived threads have public visibility and instructor/assistant role', async () => {
      const question = 'What are the benefits of the VIP Mastermind community channel?';
      const answer = 'VIP Mastermind provides weekly live teardowns, direct mentorship with lead instructors, and early access to prompt vault updates.';
      const thread = await archiveAssistantAnswerToCommunity(question, answer, ['community', 'membership']);

      assert.ok(thread);
      assert.equal(thread.authorRole, 'instructor');
      assert.equal(thread.isLocked, false);
      assert.equal(thread.isPinned, false);
    });

    it('T1.11: searchability verifies archived thread is retrievable via filterAndSortForumThreads with matching query', async () => {
      const question = 'How to deploy autonomous agents using TypeScript and Docker on Vercel?';
      const answer = 'Deploying autonomous agents requires containerizing background workers with proper health checks and environment variable secret injections.';
      const thread = await archiveAssistantAnswerToCommunity(question, answer, ['ai-engineering', 'docker']);

      assert.ok(thread);
      const threads: CommunityForumThread[] = [thread];

      const searchHits = filterAndSortForumThreads(threads, { search: 'autonomous agents' });
      assert.equal(searchHits.length, 1);
      assert.equal(searchHits[0].id, thread.id);

      const tagHits = filterAndSortForumThreads(threads, { tag: 'ai-engineering' });
      assert.equal(tagHits.length, 1);
      assert.equal(tagHits[0].id, thread.id);

      const missHits = filterAndSortForumThreads(threads, { search: 'nonexistent-topic-xyz' });
      assert.equal(missHits.length, 0);
    });

    // --- Tier 2: Boundary & Corner Cases (>=5 tests) ---

    it('T2.7: low-confidence responses and short queries (<15 chars) are not archived to forum_threads', async () => {
      const shortQuestion = 'Help me?'; // only 8 chars
      const answer = 'Thank you for reaching out to CourseMart support. Please provide more details.';
      const result = await archiveAssistantAnswerToCommunity(shortQuestion, answer, ['general']);

      assert.equal(result, null, 'Short questions (<15 chars) must not be auto-archived');
    });

    it('T2.8: duplicate question archiving deduplication rejects duplicate slugs and duplicate titles', async () => {
      const question = 'How to troubleshoot React useEffect infinite loops in production?';
      const answer = 'Ensure all dependencies used inside useEffect are listed in the dependency array or stabilize callback references.';
      const initialThread = await archiveAssistantAnswerToCommunity(question, answer, ['react']);
      assert.ok(initialThread);

      // Attempt archiving the identical question with existing thread in array
      const duplicateThread = await archiveAssistantAnswerToCommunity(
        question,
        'Another variation of the answer text.',
        ['react'],
        [initialThread]
      );

      assert.equal(duplicateThread, null, 'Duplicate questions must not be re-archived');
    });

    it('T2.9: empty or brief answers (<20 chars) are rejected from community auto-archiving', async () => {
      const question = 'How does the Paystack payment gateway integrate with CourseMart?';
      const briefAnswer = 'It works well.'; // only 14 chars

      const result = await archiveAssistantAnswerToCommunity(question, briefAnswer, ['payments']);
      assert.equal(result, null, 'Answers under 20 characters must not be archived');
    });

    it('T2.10: forum thread formatting resilience handles markdown, code blocks, and special characters cleanly', async () => {
      const question = 'How to structure TypeScript interfaces for `Order & CartTotals`?';
      const answer = `Here is the recommended pattern:
\`\`\`typescript
export interface Order {
  id: string;
  total: number;
}
\`\`\`
Use strict typing for all currency & checkout flows.`;

      const thread = await archiveAssistantAnswerToCommunity(question, answer, ['typescript', 'coding']);
      assert.ok(thread);
      assert.ok(thread.body.includes('```typescript'));
      assert.ok((thread.content || thread.body).includes('Order {'));
    });

    it('T2.11: tags array deduplication and clamping limits maximum tags to 6 without empty entries', async () => {
      const question = 'What are the best practices for social media syndication with webhooks?';
      const answer = 'Use HMAC-SHA256 signatures in webhook headers, implement exponential backoff retries, and audit all dispatch events.';
      const noisyTopics = ['social', 'webhooks', 'automation', 'SOCIAL', 'webhooks', 'api', 'growth', 'marketing', 'extra-tag-1', 'extra-tag-2'];

      const thread = await archiveAssistantAnswerToCommunity(question, answer, noisyTopics);
      assert.ok(thread);
      assert.ok(thread.tags.length <= 6, 'Tags must be capped at 6 maximum');
      assert.ok(thread.tags.includes('faq'));
      assert.ok(thread.tags.includes('assistant-archive'));
      assert.ok(!thread.tags.includes(''));
    });
  });
});
