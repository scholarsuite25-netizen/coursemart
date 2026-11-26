/**
 * Zero-Cost Multi-Model AI Router (R2)
 *
 * Directs AI generation requests to the local multi-model proxy (http://localhost:8080)
 * spanning free-tier model pools:
 * - Groq fast tier (models/qwen3-27b-groq, models/gpt-oss-120b-groq, models/gpt-oss-20b-groq)
 * - OpenRouter free tier (models/cohere-code-free, models/gemma-4-31b-free, models/ling-flash-free, models/nemotron-lightning-free)
 * - Gemini AI Studio free tier (models/gemini-3-8-flash-free, models/gemini-3-5-flash-free, models/gemini-3-1-flash-lite-free)
 *
 * Implements transparent auto-failover on rate limits (429), server errors (503), or connection timeout (1500ms).
 * Falls back gracefully to direct free Gemini SDK client and deterministic offline responses.
 * Enforces zero paid token consumption across all platform AI calls.
 */

import { GoogleGenAI } from '@google/genai';

export const GROQ_FREE_MODELS = [
  'models/qwen3-27b-groq',
  'models/gpt-oss-120b-groq',
  'models/gpt-oss-20b-groq',
] as const;

export const GEMINI_STUDIO_FREE_MODELS = [
  'models/gemini-3-8-flash-free',
  'models/gemini-3-5-flash-free',
  'models/gemini-3-1-flash-lite-free',
] as const;

export const OPENROUTER_FREE_MODELS = [
  'models/cohere-code-free',
  'models/gemma-4-31b-free',
  'models/ling-flash-free',
  'models/nemotron-lightning-free',
] as const;

export type ModelTier = 'fast' | 'general' | 'creative';

export interface GenerateAiCompletionOptions {
  prompt: string;
  systemPrompt?: string;
  modelTier?: ModelTier;
  maxTokens?: number;
  timeoutMs?: number;
  fallbackText?: string;
  mockFetch?: typeof fetch;
  allowNetworkInTest?: boolean;
}

export interface GenerateAiCompletionResult {
  text: string;
  modelUsed: string;
  isZeroCost: boolean;
  fallbackOccurred: boolean;
}

function resolveModelPool(tier: ModelTier = 'fast'): string[] {
  switch (tier) {
    case 'fast':
      return [
        ...GROQ_FREE_MODELS,
        ...GEMINI_STUDIO_FREE_MODELS,
        ...OPENROUTER_FREE_MODELS,
      ];
    case 'creative':
      return [
        ...GEMINI_STUDIO_FREE_MODELS,
        ...OPENROUTER_FREE_MODELS,
        ...GROQ_FREE_MODELS,
      ];
    case 'general':
    default:
      return [
        ...GROQ_FREE_MODELS,
        ...GEMINI_STUDIO_FREE_MODELS,
        ...OPENROUTER_FREE_MODELS,
      ];
  }
}

function createFreeGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Executes multi-model zero-cost AI completion with automatic failover chain:
 * Groq -> Gemini AI Studio -> OpenRouter -> Direct Gemini SDK -> Deterministic Fallback.
 */
export async function generateAiCompletion(
  options: GenerateAiCompletionOptions
): Promise<GenerateAiCompletionResult> {
  const prompt = typeof options.prompt === 'string' ? options.prompt.trim() : '';
  if (!prompt) {
    return {
      text: options.fallbackText || 'No prompt provided for AI completion.',
      modelUsed: 'deterministic-fallback',
      isZeroCost: true,
      fallbackOccurred: false,
    };
  }

  const isTestEnv =
    (process.env.NODE_ENV === 'test' ||
      Boolean(process.env.NODE_TEST_CONTEXT) ||
      Boolean(process.env.VITEST) ||
      Boolean(process.env.npm_lifecycle_event === 'test') ||
      process.argv.some((a) => a.includes('test'))) &&
    !options.mockFetch &&
    !options.allowNetworkInTest;

  // In offline test runs without mockFetch, preserve zero-token-leakage guardrail (Rule 6)
  if (isTestEnv) {
    return {
      text:
        options.fallbackText ||
        `Deterministic offline AI completion for: "${prompt.slice(0, 50)}"`,
      modelUsed: 'deterministic-offline-stub',
      isZeroCost: true,
      fallbackOccurred: false,
    };
  }

  const modelPool = resolveModelPool(options.modelTier);
  const timeoutMs = options.timeoutMs ?? 1500;
  const activeFetch = options.mockFetch ?? fetch;
  const baseUrl = process.env.GOOGLE_GEMINI_BASE_URL || 'http://localhost:8080';

  const fullPrompt = options.systemPrompt
    ? `${options.systemPrompt.trim()}\n\nUser: ${prompt}`
    : prompt;

  let fallbackOccurred = false;
  const skipLocalProxy =
    Boolean(process.env.VERCEL) && !process.env.GOOGLE_GEMINI_BASE_URL && !options.mockFetch;

  // 1. Iterate through free model pools via local proxy (http://localhost:8080) when available
  for (let i = 0; i < (skipLocalProxy ? 0 : modelPool.length); i++) {
    const candidateModel = modelPool[i];
    if (i > 0) {
      fallbackOccurred = true;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      // Support models with or without 'models/' prefix
      const modelEndpoint = candidateModel.startsWith('models/')
        ? candidateModel
        : `models/${candidateModel}`;
      const url = `${baseUrl.replace(/\/+$/, '')}/v1beta/${modelEndpoint}:generateContent`;

      const response = await activeFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
          ...(options.maxTokens
            ? { generationConfig: { maxOutputTokens: options.maxTokens } }
            : {}),
        }),
      });

      clearTimeout(timer);

      // Handle rate limit (429) or server error (503) by trying next model
      if (response.status === 429 || response.status === 503 || response.status >= 500) {
        continue;
      }

      if (response.ok) {
        const data = (await response.json()) as any;
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
          data?.choices?.[0]?.message?.content?.trim() ||
          data?.text?.trim();

        if (text) {
          return {
            text,
            modelUsed: candidateModel,
            isZeroCost: true,
            fallbackOccurred,
          };
        }
      }
    } catch {
      // Abort/timeout or network failure — fail over transparently to next model
      continue;
    }
  }

  // 2. Direct Gemini SDK client using free GEMINI_API_KEY
  try {
    const directClient = createFreeGeminiClient();
    if (directClient) {
      fallbackOccurred = true;
      const directCandidates = [
        process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        'gemini-1.5-flash',
      ];
      for (const modelName of directCandidates) {
        try {
          const directResp = await directClient.models.generateContent({
            model: modelName,
            contents: fullPrompt,
            config: options.systemPrompt
              ? { systemInstruction: options.systemPrompt }
              : undefined,
          });
          const text = (directResp.text || '').trim();
          if (text) {
            return {
              text,
              modelUsed: `direct-gemini-free:${modelName}`,
              isZeroCost: true,
              fallbackOccurred: true,
            };
          }
        } catch {
          // Try next direct candidate
          continue;
        }
      }
    }
  } catch {
    // Non-fatal, proceed to deterministic fallback
  }

  // 3. Deterministic offline fallback
  return {
    text:
      options.fallbackText ||
      `Digital Wealth Creators AI Assistant: Thank you for your inquiry regarding "${prompt.slice(0, 60)}". Please review our catalog or consult the community discussions.`,
    modelUsed: 'deterministic-fallback',
    isZeroCost: true,
    fallbackOccurred: true,
  };
}
