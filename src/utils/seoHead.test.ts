import { describe, it, expect } from './testExpect.ts';
import {
  applySeoHead,
  DEFAULT_SITE_TITLE,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_URL,
} from './seoHead.ts';

describe('Client SEO Head Manager', () => {
  it('applySeoHead operates safely in Node environment without global document', () => {
    const cleanup = applySeoHead({
      title: 'Headless Test Title',
      description: 'Headless Test Description',
    });
    expect(typeof cleanup).toBe('function');
    expect(() => cleanup()).not.toThrow();
  });

  it('applySeoHead updates document title, canonical link, and JSON-LD when DOM is present', () => {
    const headChildren: any[] = [];
    const mockDocument: any = {
      title: 'Original Title',
      head: {
        appendChild: (el: any) => headChildren.push(el),
      },
      querySelector: (selector: string) => {
        if (selector === 'link[rel="canonical"]') {
          return headChildren.find((el) => el.tagName === 'LINK' && el.rel === 'canonical') || null;
        }
        if (selector === 'meta[name="description"]') {
          return headChildren.find((el) => el.tagName === 'META' && el.name === 'description') || null;
        }
        return null;
      },
      querySelectorAll: (selector: string) => {
        if (selector === '[data-dwc-seo="true"]') {
          return headChildren.filter((el) => el.attributes?.['data-dwc-seo'] === 'true');
        }
        return [];
      },
      getElementById: (id: string) => {
        return headChildren.find((el) => el.id === id) || null;
      },
      createElement: (tag: string) => {
        const el: any = {
          tagName: tag.toUpperCase(),
          attributes: {},
          setAttribute: (k: string, v: string) => {
            el.attributes[k] = v;
            if (k === 'href') el.href = v;
            if (k === 'content') el.content = v;
            if (k === 'name') el.name = v;
            if (k === 'property') el.property = v;
            if (k === 'rel') el.rel = v;
          },
          getAttribute: (k: string) => el.attributes[k],
          hasAttribute: (k: string) => k in el.attributes,
          remove: () => {
            const idx = headChildren.indexOf(el);
            if (idx >= 0) headChildren.splice(idx, 1);
          },
        };
        return el;
      },
    };

    (globalThis as any).document = mockDocument;

    try {
      const cleanup = applySeoHead({
        title: 'Vibe Coding Playbook',
        description: 'Master autonomous engineering with AI',
        canonical: 'https://digitalwealthcreators.org.ng/blog/vibe-coding-playbook',
        jsonLd: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: 'Vibe Coding' },
      });

      expect(mockDocument.title).toContain('Vibe Coding Playbook');
      const canonicalEl = headChildren.find((el) => el.tagName === 'LINK' && el.rel === 'canonical');
      expect(canonicalEl).toBeTruthy();
      expect(canonicalEl.href).toBe('https://digitalwealthcreators.org.ng/blog/vibe-coding-playbook');

      const jsonLdScript = headChildren.find((el) => el.tagName === 'SCRIPT' && el.id === 'dwc-seo-jsonld');
      expect(jsonLdScript).toBeTruthy();
      expect(jsonLdScript.textContent).toContain('BlogPosting');

      cleanup();
      expect(mockDocument.title).toBe('Original Title');
      const jsonLdAfterCleanup = headChildren.find((el) => el.id === 'dwc-seo-jsonld');
      expect(jsonLdAfterCleanup).toBeUndefined();
    } finally {
      delete (globalThis as any).document;
    }
  });

  it('exports expected constants', () => {
    expect(typeof DEFAULT_SITE_TITLE).toBe('string');
    expect(typeof DEFAULT_SITE_DESCRIPTION).toBe('string');
    expect(typeof DEFAULT_SITE_URL).toBe('string');
    expect(DEFAULT_SITE_URL).toContain('digitalwealthcreators');
  });
});
