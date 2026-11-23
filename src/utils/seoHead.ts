import { useEffect } from 'react';
import { cleanBaseUrl } from './seoEngine.ts';

export interface SeoHeadConfig {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: 'website' | 'article' | 'book' | 'profile' | string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  jsonLd?: Record<string, any> | Array<Record<string, any>> | null;
}

export const DEFAULT_SITE_TITLE = 'DIGITAL WEALTH CREATORS (DWC) — Marketplace & Learning Platform';
export const DEFAULT_SITE_DESCRIPTION =
  'DIGITAL WEALTH CREATORS (DWC) — Digital marketplace and LMS platform for video courses, digital products (eBooks, templates, toolkits), licensed software, community, and mastermind training.';
export const DEFAULT_SITE_URL = cleanBaseUrl();

function updateOrCreateMeta(
  attrName: 'name' | 'property',
  attrValue: string,
  content?: string
): void {
  if (typeof document === 'undefined') return;
  if (!content) return;

  let el = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (el) {
    el.setAttribute('content', content);
  } else {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    el.setAttribute('content', content);
    el.setAttribute('data-dwc-seo', 'true');
    document.head.appendChild(el);
  }
}

function updateOrCreateCanonical(url?: string): void {
  if (typeof document === 'undefined') return;
  const targetUrl = url || DEFAULT_SITE_URL;

  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (el) {
    el.setAttribute('href', targetUrl);
  } else {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    el.setAttribute('href', targetUrl);
    el.setAttribute('data-dwc-seo', 'true');
    document.head.appendChild(el);
  }
}

function updateOrCreateJsonLd(
  jsonLdData?: Record<string, any> | Array<Record<string, any>> | null,
  scriptId = 'dwc-seo-jsonld'
): void {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById(scriptId);
  if (!jsonLdData) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  const jsonString = JSON.stringify(jsonLdData);
  if (existing) {
    existing.textContent = jsonString;
  } else {
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.setAttribute('data-dwc-seo', 'true');
    script.textContent = jsonString;
    document.head.appendChild(script);
  }
}

export function applySeoHead(config: SeoHeadConfig): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const prevTitle = document.title;

  // Title formatting
  const formattedTitle = config.title
    ? config.title.toLowerCase().includes('digital wealth creators')
      ? config.title
      : `${config.title} | Digital Wealth Creators`
    : DEFAULT_SITE_TITLE;
  document.title = formattedTitle;

  // Meta description
  const description = config.description || DEFAULT_SITE_DESCRIPTION;
  updateOrCreateMeta('name', 'description', description);

  // Canonical URL
  updateOrCreateCanonical(config.canonical);

  // OpenGraph metadata
  updateOrCreateMeta('property', 'og:title', config.ogTitle || formattedTitle);
  updateOrCreateMeta('property', 'og:description', config.ogDescription || description);
  updateOrCreateMeta('property', 'og:type', config.ogType || 'website');
  updateOrCreateMeta('property', 'og:url', config.ogUrl || config.canonical || DEFAULT_SITE_URL);
  if (config.ogImage) {
    updateOrCreateMeta('property', 'og:image', config.ogImage);
  }

  // Twitter metadata
  updateOrCreateMeta('name', 'twitter:card', config.twitterCard || 'summary_large_image');
  updateOrCreateMeta('name', 'twitter:title', config.ogTitle || formattedTitle);
  updateOrCreateMeta('name', 'twitter:description', config.ogDescription || description);
  if (config.ogImage) {
    updateOrCreateMeta('name', 'twitter:image', config.ogImage);
  }

  // JSON-LD structured data
  updateOrCreateJsonLd(config.jsonLd);

  // Return cleanup function
  return () => {
    document.title = prevTitle || DEFAULT_SITE_TITLE;

    // Remove any elements dynamically created by DWC SEO
    const dynamicElements = document.querySelectorAll('[data-dwc-seo="true"]');
    dynamicElements.forEach((el) => el.remove());

    // Reset default tags if modified
    const defaultCanonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (defaultCanonical && !defaultCanonical.hasAttribute('data-dwc-seo')) {
      defaultCanonical.setAttribute('href', DEFAULT_SITE_URL);
    }

    const defaultDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (defaultDesc && !defaultDesc.hasAttribute('data-dwc-seo')) {
      defaultDesc.setAttribute('content', DEFAULT_SITE_DESCRIPTION);
    }
  };
}

export function useSeoHead(config: SeoHeadConfig): void {
  const jsonLdSerialized = config.jsonLd ? JSON.stringify(config.jsonLd) : null;

  useEffect(() => {
    const cleanup = applySeoHead(config);
    return cleanup;
  }, [
    config.title,
    config.description,
    config.canonical,
    config.ogTitle,
    config.ogDescription,
    config.ogType,
    config.ogImage,
    config.ogUrl,
    config.twitterCard,
    jsonLdSerialized,
  ]);
}
