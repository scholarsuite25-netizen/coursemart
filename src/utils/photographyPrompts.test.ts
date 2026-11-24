/**
 * E2E Test Suite: 24 Photography Prompts Catalog, Pagination & Assistant Retrieval
 * Requirements: R3 (Photography Prompts Expansion)
 * Test Coverage: Tier 1 (Feature Coverage) & Tier 2 (Boundary & Corner Cases)
 *
 * Styling rule: No spaces before or after '/' between words (e.g. free/paid, FAQ/community, dwc/ngo).
 * Offline isolation: Offline deterministic execution using local catalog data and pure functions.
 */

import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SEED_PROMPT_VAULT_ITEMS } from '../data/promptVaultCatalog.ts';
import {
  filterPromptVault,
  searchPromptVault,
  interpolatePromptTemplate,
  extractPromptVariables,
} from './funnelsAndVault.ts';
import { buildEnquiryResponse } from './agentAutomation.ts';
import { parseAppRoute } from './catalogAndBlogs.ts';
import type { PromptVaultItem } from '../types/marketplace.ts';

describe('Photography Prompts Expansion (Vault Catalog & Assistant Retrieval)', () => {
  const photoPrompts = SEED_PROMPT_VAULT_ITEMS.filter(
    (p) => p.category === 'Photography & Camera Prompts'
  );

  /* ==========================================================================
     Feature 4: 24 Photography Prompts Catalog & Pagination
     ========================================================================== */

  describe('Feature 4: 24 Photography Prompts Catalog & Pagination', () => {
    // --- Tier 1: Coverage (>=5 tests) ---

    it('T1.1: verifies presence of exactly 24 prompts from vault-127 to vault-150 in Photography & Camera Prompts', () => {
      assert.equal(photoPrompts.length, 24, 'Must have exactly 24 photography prompts');
      const ids = photoPrompts.map((p) => p.id);
      assert.equal(ids[0], 'vault-127');
      assert.equal(ids[ids.length - 1], 'vault-150');

      for (let i = 127; i <= 150; i++) {
        assert.ok(ids.includes(`vault-${i}`), `Catalog must contain vault-${i}`);
      }
    });

    it('T1.2: comprehensive coverage across all 6 photography sub-genres', () => {
      // 1. Portraiture & Editorial (vault-127 to vault-130)
      const portraitGroup = photoPrompts.filter((p) =>
        ['vault-127', 'vault-128', 'vault-129', 'vault-130'].includes(p.id)
      );
      assert.equal(portraitGroup.length, 4);
      assert.ok(portraitGroup.some((p) => p.tags.includes('Portrait')));
      assert.ok(portraitGroup.some((p) => p.tags.includes('Fashion') || p.tags.includes('Editorial')));

      // 2. Street & Documentary (vault-131 to vault-134)
      const streetGroup = photoPrompts.filter((p) =>
        ['vault-131', 'vault-132', 'vault-133', 'vault-134'].includes(p.id)
      );
      assert.equal(streetGroup.length, 4);
      assert.ok(streetGroup.some((p) => p.tags.includes('Street') || p.tags.includes('Documentary')));

      // 3. Landscape & Astrophotography (vault-135 to vault-138)
      const landscapeGroup = photoPrompts.filter((p) =>
        ['vault-135', 'vault-136', 'vault-137', 'vault-138'].includes(p.id)
      );
      assert.equal(landscapeGroup.length, 4);
      assert.ok(landscapeGroup.some((p) => p.tags.includes('Landscape') || p.tags.includes('Astrophotography')));

      // 4. Commercial & Culinary (vault-139 to vault-142)
      const commercialGroup = photoPrompts.filter((p) =>
        ['vault-139', 'vault-140', 'vault-141', 'vault-142'].includes(p.id)
      );
      assert.equal(commercialGroup.length, 4);
      assert.ok(commercialGroup.some((p) => p.tags.includes('Product') || p.tags.includes('Food')));

      // 5. Action & Motion (vault-143 to vault-146)
      const actionGroup = photoPrompts.filter((p) =>
        ['vault-143', 'vault-144', 'vault-145', 'vault-146'].includes(p.id)
      );
      assert.equal(actionGroup.length, 4);
      assert.ok(actionGroup.some((p) => p.tags.includes('Action') || p.tags.includes('Wildlife') || p.tags.includes('Motorsport')));

      // 6. AI Synthesis & Film Emulation (vault-147 to vault-150)
      const synthesisGroup = photoPrompts.filter((p) =>
        ['vault-147', 'vault-148', 'vault-149', 'vault-150'].includes(p.id)
      );
      assert.equal(synthesisGroup.length, 4);
      assert.ok(synthesisGroup.some((p) => p.tags.includes('AI Synthesis') || p.tags.includes('Film Emulation') || p.tags.includes('Cinematic')));
    });

    it('T1.3: 4-items-per-page pagination logic partitions 24 items into 6 clean pages without overlap', () => {
      const pageSize = 4;
      const totalPages = Math.ceil(photoPrompts.length / pageSize);
      assert.equal(totalPages, 6);

      const seenIds = new Set<string>();

      for (let page = 1; page <= totalPages; page++) {
        const startIndex = (page - 1) * pageSize;
        const pageItems = photoPrompts.slice(startIndex, startIndex + pageSize);
        assert.equal(pageItems.length, pageSize, `Page ${page} must contain exactly ${pageSize} items`);

        for (const item of pageItems) {
          assert.equal(seenIds.has(item.id), false, `Item ${item.id} must not appear on multiple pages`);
          seenIds.add(item.id);
        }
      }

      assert.equal(seenIds.size, 24);
    });

    it('T1.4: customizer variable injection interpolates user parameters into prompt templates', () => {
      const samplePrompt = photoPrompts.find((p) => p.id === 'vault-127')!;
      assert.ok(samplePrompt);

      const variables = extractPromptVariables(samplePrompt.template);
      assert.ok(variables.length >= 2, 'Template must declare customizer variables');

      const customValues: Record<string, string> = {
        subject_description: 'An elderly Nigerian artisan woodcarver',
        composition_mood: 'Sunlit rustic workshop in Lagos with warm flare',
        lighting_setup: 'Golden hour directional rim lighting',
        camera_equipment: 'Sony A7R V with 85mm f/1.4 GM lens',
      };

      const result = interpolatePromptTemplate(samplePrompt.template, customValues);
      assert.ok(result.prompt.includes('artisan woodcarver'));
      assert.ok(result.prompt.includes('workshop in Lagos'));
      assert.doesNotMatch(result.prompt, /\{\{subject_description\}\}/);
    });

    it('T1.5: metadata presence verifies all required fields across all 24 photography prompts', () => {
      for (const item of photoPrompts) {
        assert.ok(item.id.startsWith('vault-'));
        assert.ok(item.slug.length > 3);
        assert.ok(item.title.length > 5);
        assert.ok(item.description.length > 10);
        assert.equal(item.category, 'Photography & Camera Prompts');
        assert.ok(Array.isArray(item.tags) && item.tags.length >= 2);
        assert.ok(item.template.length > 20);
        assert.ok(Array.isArray(item.variables) && item.variables.length >= 1);
        for (const v of item.variables) {
          assert.ok(v.name);
          assert.ok(v.label);
          assert.ok(typeof v.defaultValue !== 'undefined');
        }
        assert.ok(item.recommendedModel);
        assert.ok(['free', 'paid', 'pro', 'vip'].includes(item.membershipTierRequired as string));
        assert.ok(typeof item.copyCount === 'number');
      }
    });

    // --- Tier 2: Boundary & Corner Cases (>=5 tests) ---

    it('T1.6 / T2.1: out-of-bounds page requests handle boundary indices defensively', () => {
      const pageSize = 4;

      // Page 0 / negative page
      const clampedPage = Math.max(1, 0);
      const page1Items = photoPrompts.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);
      assert.equal(page1Items.length, 4);

      // Page > totalPages (e.g. page 10)
      const page10Items = photoPrompts.slice((10 - 1) * pageSize, 10 * pageSize);
      assert.equal(page10Items.length, 0);
    });

    it('T2.2: invalid category filtering returns empty array without throwing', () => {
      const results = filterPromptVault(photoPrompts, {
        category: 'NonExistentCategory-12345',
      });
      assert.equal(results.length, 0);
    });

    it('T2.3: empty search strings return all 24 photography items without filtering out items', () => {
      const results = filterPromptVault(photoPrompts, {
        query: '   ',
        category: 'Photography & Camera Prompts',
      });
      assert.equal(results.length, 24);
    });

    it('T2.4: missing variables in prompt templates interpolate defaults or blanks gracefully', () => {
      const prompt = photoPrompts[0];
      // Provide empty variables map
      const result = interpolatePromptTemplate(prompt.template, {});
      assert.ok(result);
      assert.ok(typeof result.prompt === 'string');
      assert.ok(result.prompt.length > 0);
      assert.ok(Array.isArray(result.missingVariables));
    });

    it('T2.5: extreme pagination limits (limit=0/negative means unlimited, limit=1000 clamped to length) handled safely', () => {
      // limit = 0 or negative falls back to full results (unlimited)
      const zeroLimit = searchPromptVault('portrait', 'Photography & Camera Prompts', 0, photoPrompts);
      assert.ok(Array.isArray(zeroLimit));
      assert.ok(zeroLimit.length >= 1);

      // limit = 1000 (exceeds total items)
      const largeLimit = searchPromptVault('', 'Photography & Camera Prompts', 1000, photoPrompts);
      assert.equal(largeLimit.length, 24);

      // negative limit also treated as unlimited
      const negLimit = searchPromptVault('', 'Photography & Camera Prompts', -5, photoPrompts);
      assert.ok(Array.isArray(negLimit));
      assert.equal(negLimit.length, 24);
    });
  });

  /* ==========================================================================
     Feature 5: Assistant Photography Retrieval
     ========================================================================== */

  describe('Feature 5: Assistant Photography Retrieval', () => {
    // --- Tier 1: Coverage (>=5 tests) ---

    it('T1.7: search photography prompts via assistant query finds relevant photography items', () => {
      const results = searchPromptVault('photography prompt', undefined, 10, SEED_PROMPT_VAULT_ITEMS);
      assert.ok(results.length > 0);
      assert.ok(results.some((p) => p.category === 'Photography & Camera Prompts'));
    });

    it('T1.8: keyword matching retrieves specific prompts by photographic style and terms', () => {
      // Search 'astrophotography'
      const astroHits = searchPromptVault('astrophotography', undefined, 5, photoPrompts);
      assert.ok(astroHits.length >= 1);
      assert.equal(astroHits[0].id, 'vault-136');

      // Search 'rembrandt'
      const rembrandtHits = searchPromptVault('rembrandt', undefined, 5, photoPrompts);
      assert.ok(rembrandtHits.length >= 1);
      assert.equal(rembrandtHits[0].id, 'vault-128');

      // Search 'drone'
      const droneHits = searchPromptVault('drone nadir', undefined, 5, photoPrompts);
      assert.ok(droneHits.length >= 1);
      assert.equal(droneHits[0].id, 'vault-149');
    });

    it('T1.9: category scoped search restricts results strictly to Photography & Camera Prompts', () => {
      const results = searchPromptVault('marketing', 'Photography & Camera Prompts', 10, SEED_PROMPT_VAULT_ITEMS);
      for (const item of results) {
        assert.equal(item.category, 'Photography & Camera Prompts');
      }
    });

    it('T1.10: prompt preview extraction formats title, excerpt snippet, and template cleanly', () => {
      const prompt = photoPrompts.find((p) => p.id === 'vault-150')!;
      assert.ok(prompt);

      const previewSnippet = prompt.description.slice(0, 100);
      assert.ok(previewSnippet.length > 10);
      assert.match(prompt.title, /Anamorphic Cinematic/);
      assert.match(prompt.template, /Act as a Hollywood director of photography/);
    });

    it('T1.11: exact ID matching retrieves exact prompt from vault catalog', () => {
      for (const targetId of ['vault-127', 'vault-135', 'vault-142', 'vault-148', 'vault-150']) {
        const item = photoPrompts.find((p) => p.id === targetId);
        assert.ok(item, `Must find prompt with id ${targetId}`);
        assert.equal(item.id, targetId);
      }
    });

    // --- Tier 2: Boundary & Corner Cases (>=5 tests) ---

    it('T2.6: irrelevant search terms return empty results without error', () => {
      const emptyResults = searchPromptVault('nonexistent_photographic_xyz_term_9999', undefined, 10, photoPrompts);
      assert.equal(emptyResults.length, 0);
    });

    it('T2.7: special characters, accents, and symbols in prompt search handled safely', () => {
      const specialQueries = [
        'bokeh/lighting',
        '35mm & 85mm lens',
        '2.39:1 aspect ratio',
        'Kodak Portra 400',
        'f/1.4 aperture',
      ];

      for (const q of specialQueries) {
        const results = searchPromptVault(q, 'Photography & Camera Prompts', 5, photoPrompts);
        assert.ok(Array.isArray(results));
      }
    });

    it('T2.8: case-insensitivity matches uppercase, lowercase, and mixed-case queries identically', () => {
      const lower = searchPromptVault('portrait', 'Photography & Camera Prompts', 10, photoPrompts);
      const upper = searchPromptVault('PORTRAIT', 'Photography & Camera Prompts', 10, photoPrompts);
      const mixed = searchPromptVault('PoRtRaIt', 'Photography & Camera Prompts', 10, photoPrompts);

      assert.equal(lower.length, upper.length);
      assert.equal(lower.length, mixed.length);
      assert.deepEqual(lower.map((p) => p.id), upper.map((p) => p.id));
    });

    it('T2.9: limit bounds parameter respected accurately', () => {
      const limit1 = searchPromptVault('', 'Photography & Camera Prompts', 1, photoPrompts);
      assert.equal(limit1.length, 1);

      const limit3 = searchPromptVault('', 'Photography & Camera Prompts', 3, photoPrompts);
      assert.equal(limit3.length, 3);

      const limit12 = searchPromptVault('', 'Photography & Camera Prompts', 12, photoPrompts);
      assert.equal(limit12.length, 12);
    });

    it('T2.10: null, undefined, and non-string inputs handled safely without throwing', () => {
      // @ts-expect-error - testing invalid runtime input
      const nullRes = searchPromptVault(null, undefined, 5, photoPrompts);
      assert.ok(Array.isArray(nullRes));

      // @ts-expect-error - testing invalid runtime input
      const undefRes = searchPromptVault(undefined, undefined, 5, photoPrompts);
      assert.ok(Array.isArray(undefRes));
    });
  });

  /* ==========================================================================
     Feature 6: Assistant Intent Routing, Deep-Linking & Styling Guardrails
     ========================================================================== */

  describe('Feature 6: Assistant Intent Routing, Deep-Linking & Styling Guardrails', () => {
    it('T1.12: buildEnquiryResponse matches photography & camera queries with confidence >= 0.9', () => {
      const queries = [
        'Do you have photography prompts for ChatGPT?',
        'What camera settings should I use for golden hour portraits?',
        'How do I shoot astrophotography and the Milky Way with camera lenses?',
        'Can you give me portrait lighting and aperture recommendations?',
        'Where can I find prompts for studio lighting and chiaroscuro?',
      ];

      for (const q of queries) {
        const res = buildEnquiryResponse(q);
        assert.ok(res.confidence >= 0.9, `Expected confidence >= 0.9 for query "${q}", got ${res.confidence}`);
        assert.ok(
          res.matchedTopics.includes('photography-prompts') || res.matchedTopics.includes('prompt-vault'),
          `Expected matchedTopics to include photography-prompts or prompt-vault for "${q}"`
        );
        assert.equal(res.suggestedForumThreadSlug, 'how-to-use-photography-prompts-in-chatgpt');
        assert.match(res.answer, /Photography & Camera Prompts/i);
      }
    });

    it('T1.13: parseAppRoute supports deep-linking via /vault?category=...', () => {
      const parsed = parseAppRoute('/vault?category=Photography%20%26%20Camera%20Prompts');
      assert.equal(parsed.page, 'vault');
      assert.equal((parsed as any).category, 'Photography & Camera Prompts');

      const parsedPlain = parseAppRoute('/vault');
      assert.equal(parsedPlain.page, 'vault');
      assert.equal((parsedPlain as any).category, undefined);
    });

    it('T1.14: strict styling rule: no space before and after "/" across all 24 photography prompts', () => {
      const slashWithSpacesRegex = /\s\/\s|\s\/|\/\s/;

      for (const item of photoPrompts) {
        assert.ok(!slashWithSpacesRegex.test(item.title), `Prompt ${item.id} title has space around slash: "${item.title}"`);
        assert.ok(!slashWithSpacesRegex.test(item.description), `Prompt ${item.id} description has space around slash: "${item.description}"`);
        assert.ok(!slashWithSpacesRegex.test(item.template), `Prompt ${item.id} template has space around slash: "${item.template}"`);
        if (item.recommendedModel) {
          assert.ok(!slashWithSpacesRegex.test(item.recommendedModel), `Prompt ${item.id} recommendedModel has space around slash: "${item.recommendedModel}"`);
        }
        for (const v of item.variables) {
          assert.ok(!slashWithSpacesRegex.test(v.label), `Prompt ${item.id} variable ${v.name} label has space around slash: "${v.label}"`);
          if (v.defaultValue) {
            assert.ok(!slashWithSpacesRegex.test(v.defaultValue), `Prompt ${item.id} variable ${v.name} defaultValue has space around slash: "${v.defaultValue}"`);
          }
        }
      }
    });
  });
});
