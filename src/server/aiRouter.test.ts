import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
import {
  generateAiCompletion,
  GROQ_FREE_MODELS,
  GEMINI_STUDIO_FREE_MODELS,
  OPENROUTER_FREE_MODELS,
} from './aiRouter.ts';
import { archiveAssistantAnswerToCommunity } from '../utils/community.ts';

test('AI Router exports free-tier model pools matching zero-cost specifications', () => {
  assert.ok(GROQ_FREE_MODELS.includes('models/qwen3-27b-groq'));
  assert.ok(GROQ_FREE_MODELS.includes('models/gpt-oss-120b-groq'));
  assert.ok(GROQ_FREE_MODELS.includes('models/gpt-oss-20b-groq'));

  assert.ok(GEMINI_STUDIO_FREE_MODELS.includes('models/gemini-3-8-flash-free'));
  assert.ok(GEMINI_STUDIO_FREE_MODELS.includes('models/gemini-3-5-flash-free'));
  assert.ok(GEMINI_STUDIO_FREE_MODELS.includes('models/gemini-3-1-flash-lite-free'));

  assert.ok(OPENROUTER_FREE_MODELS.includes('models/cohere-code-free'));
  assert.ok(OPENROUTER_FREE_MODELS.includes('models/gemma-4-31b-free'));
  assert.ok(OPENROUTER_FREE_MODELS.includes('models/ling-flash-free'));
  assert.ok(OPENROUTER_FREE_MODELS.includes('models/nemotron-lightning-free'));
});

test('generateAiCompletion routes fast tier to Groq models with zero-cost confirmation', async () => {
  const mockFetch: typeof fetch = async (input, init) => {
    const urlStr = String(input);
    assert.match(urlStr, /localhost:8080/);
    assert.match(urlStr, /models\/qwen3-27b-groq/);

    const body = JSON.parse(String(init?.body));
    assert.ok(body.contents[0].parts[0].text.includes('Explain event streaming'));

    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Event streaming is a software architecture pattern where components communicate via append-only event logs.',
                },
              ],
            },
          },
        ],
      }),
    } as any;
  };

  const result = await generateAiCompletion({
    prompt: 'Explain event streaming architecture',
    modelTier: 'fast',
    mockFetch,
  });

  assert.equal(result.isZeroCost, true);
  assert.equal(result.modelUsed, 'models/qwen3-27b-groq');
  assert.equal(result.fallbackOccurred, false);
  assert.match(result.text, /Event streaming is a software architecture pattern/);
});

test('generateAiCompletion automatically fails over from Groq (429) to Gemini AI Studio (200)', async () => {
  const attemptedUrls: string[] = [];

  const mockFetch: typeof fetch = async (input) => {
    const urlStr = String(input);
    attemptedUrls.push(urlStr);

    // Groq models return 429 rate limit
    if (urlStr.includes('qwen3-27b-groq') || urlStr.includes('gpt-oss-120b-groq') || urlStr.includes('gpt-oss-20b-groq')) {
      return {
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Groq rate limit exceeded' } }),
      } as any;
    }

    // Gemini Studio model succeeds
    if (urlStr.includes('gemini-3-8-flash-free')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Failover response from Gemini 3.8 Flash Free tier.',
                  },
                ],
              },
            },
          ],
        }),
      } as any;
    }

    return {
      ok: false,
      status: 500,
      json: async () => ({ error: 'Unhandled mock model' }),
    } as any;
  };

  const result = await generateAiCompletion({
    prompt: 'How to deploy Next.js with Vercel',
    modelTier: 'fast',
    mockFetch,
  });

  assert.equal(result.isZeroCost, true);
  assert.equal(result.modelUsed, 'models/gemini-3-8-flash-free');
  assert.equal(result.fallbackOccurred, true);
  assert.equal(result.text, 'Failover response from Gemini 3.8 Flash Free tier.');
  assert.ok(attemptedUrls.some((u) => u.includes('qwen3-27b-groq')));
  assert.ok(attemptedUrls.some((u) => u.includes('gemini-3-8-flash-free')));
});

test('generateAiCompletion fails over across Groq and Gemini Studio (503) to OpenRouter free tier', async () => {
  const mockFetch: typeof fetch = async (input) => {
    const urlStr = String(input);

    // Groq models return 429
    if (urlStr.includes('groq')) {
      return { ok: false, status: 429, json: async () => ({}) } as any;
    }

    // Gemini Studio models return 503
    if (urlStr.includes('gemini-3-8-flash-free') || urlStr.includes('gemini-3-5-flash-free') || urlStr.includes('gemini-3-1-flash-lite-free')) {
      return { ok: false, status: 503, json: async () => ({}) } as any;
    }

    // OpenRouter free model succeeds
    if (urlStr.includes('cohere-code-free')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Cohere Code Free tier response.' }],
              },
            },
          ],
        }),
      } as any;
    }

    return { ok: false, status: 500, json: async () => ({}) } as any;
  };

  const result = await generateAiCompletion({
    prompt: 'Write a TypeScript interface for order cart',
    modelTier: 'fast',
    mockFetch,
  });

  assert.equal(result.isZeroCost, true);
  assert.equal(result.modelUsed, 'models/cohere-code-free');
  assert.equal(result.fallbackOccurred, true);
  assert.equal(result.text, 'Cohere Code Free tier response.');
});

test('generateAiCompletion handles connection timeout by failing over to next free model', async () => {
  let callCount = 0;

  const mockFetch: typeof fetch = async (input, init) => {
    callCount += 1;
    const urlStr = String(input);

    if (callCount === 1) {
      // Simulate timeout abort
      const signal = init?.signal;
      if (signal?.aborted) {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        throw err;
      }
      throw new Error('Connection timed out');
    }

    // Second call succeeds
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'Second model responded after first timed out.' }],
            },
          },
        ],
      }),
    } as any;
  };

  const result = await generateAiCompletion({
    prompt: 'Timeout resilience check',
    timeoutMs: 50,
    mockFetch,
  });

  assert.equal(result.isZeroCost, true);
  assert.equal(result.fallbackOccurred, true);
  assert.equal(result.text, 'Second model responded after first timed out.');
});

test('generateAiCompletion respects test environment offline isolation with deterministic response', async () => {
  // In test environment without mockFetch, returns offline stub without burning live tokens
  const result = await generateAiCompletion({
    prompt: 'Offline test isolation query without mock',
  });

  assert.equal(result.isZeroCost, true);
  assert.equal(result.modelUsed, 'deterministic-offline-stub');
  assert.ok(result.text.includes('Deterministic offline AI completion'));
});

test('archiveAssistantAnswerToCommunity creates validated forum thread for high-value Q&A', async () => {
  // 1. Rejects short/shallow questions (< 15 chars)
  const shallow = await archiveAssistantAnswerToCommunity('short?', 'A brief reply');
  assert.equal(shallow, null);

  // 2. Creates structured thread for substantive question and comprehensive answer
  const thread = await archiveAssistantAnswerToCommunity(
    'How do I implement idempotent database transactions in Node.js?',
    'To implement idempotent database transactions, leverage PostgreSQL advisory locks or unique idempotency keys in your transaction table.',
    ['architecture', 'database']
  );
  assert.ok(thread);
  assert.equal(thread.authorId, 'dwc-ai-assistant');
  assert.equal(thread.authorName, 'DWC AI Assistant');
  assert.equal(thread.authorRole, 'instructor');
  assert.equal(thread.isSolved, true);
  assert.equal(thread.category, 'FAQ');
  assert.ok(thread.tags.includes('faq'));
  assert.ok(thread.tags.includes('assistant-archive'));
  assert.ok(thread.tags.includes('architecture'));
  assert.match(thread.slug, /how-do-i-implement-idempotent-database-transactions/);

  // 3. Detects duplicates when thread with matching slug exists
  const duplicate = await archiveAssistantAnswerToCommunity(
    'How do I implement idempotent database transactions in Node.js?',
    'Another answer',
    ['architecture'],
    [thread]
  );
  assert.equal(duplicate, null);
});
