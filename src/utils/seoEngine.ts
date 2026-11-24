import type { Product, BlogPost } from '../types/marketplace.ts';
import type { DocumentTutorial } from '../types/tutorial.ts';

export const DEFAULT_BASE_URL = 'https://digitalwealthcreators.org.ng';

export interface SitemapRouteEntry {
  path: string;
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

export const STATIC_SITEMAP_ROUTES: SitemapRouteEntry[] = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/courses', priority: 0.9, changefreq: 'daily' },
  { path: '/software', priority: 0.8, changefreq: 'weekly' },
  { path: '/digital-products', priority: 0.8, changefreq: 'weekly' },
  { path: '/blogs', priority: 0.8, changefreq: 'daily' },
  { path: '/tutorials', priority: 0.8, changefreq: 'daily' },
  { path: '/community', priority: 0.7, changefreq: 'daily' },
  { path: '/events', priority: 0.7, changefreq: 'weekly' },
  { path: '/membership', priority: 0.8, changefreq: 'monthly' },
  { path: '/showcase', priority: 0.6, changefreq: 'monthly' },
  { path: '/affiliates', priority: 0.5, changefreq: 'monthly' },
];

export function cleanBaseUrl(baseUrl?: string): string {
  if (!baseUrl || !baseUrl.trim()) return DEFAULT_BASE_URL;
  return baseUrl.trim().replace(/\/+$/, '');
}

export function escapeXml(unsafe: unknown): string {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatIsoDate(dateVal?: string | number | Date | null): string {
  if (!dateVal) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export function formatRfc822Date(dateVal?: string | number | Date | null): string {
  if (!dateVal) return new Date().toUTCString();
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return new Date().toUTCString();
    return d.toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

export function generateSitemapXml(
  products: Product[] = [],
  blogPosts: BlogPost[] = [],
  tutorials: DocumentTutorial[] = [],
  baseUrl?: string
): string {
  const base = cleanBaseUrl(baseUrl);
  const nowIso = formatIsoDate(new Date());

  const urls: string[] = [];

  // Static routes
  for (const route of STATIC_SITEMAP_ROUTES) {
    const pathStr = route.path === '/' ? '' : route.path;
    urls.push(
      `  <url>\n    <loc>${escapeXml(`${base}${pathStr}`)}</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority.toFixed(1)}</priority>\n  </url>`
    );
  }

  // Published products
  for (const product of products) {
    if (!product || (product.status && product.status !== 'published')) continue;
    const slug = product.slug || product.id;
    const loc = `${base}/product/${escapeXml(slug)}`;
    const priority = product.type === 'course' || product.featured || product.bestseller ? '0.9' : '0.8';
    const lastmod = formatIsoDate(product.updatedAt);
    urls.push(
      `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    );
  }

  // Published blog posts (strictly exclude draft or scheduled)
  for (const post of blogPosts) {
    if (!post || post.status !== 'published') continue;
    const slug = post.slug || post.id;
    const loc = `${base}/blog/${escapeXml(slug)}`;
    const priority = post.featured ? '0.85' : '0.8';
    const lastmod = formatIsoDate(post.updatedAt || post.publishedAt);
    urls.push(
      `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    );
  }

  // Published tutorials
  if (Array.isArray(tutorials)) {
    for (const tut of tutorials) {
      if (!tut || (tut.status && tut.status !== 'published')) continue;
      const slug = tut.slug || tut.id;
      const loc = `${base}/tutorials/${escapeXml(slug)}`;
      const lastmod = formatIsoDate(tut.updatedAt || tut.createdAt);
      urls.push(
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>`
      );
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

export function generateRobotsTxt(baseUrl?: string): string {
  const base = cleanBaseUrl(baseUrl);
  let host = 'digitalwealthcreators.org.ng';
  try {
    const parsed = new URL(base);
    host = parsed.host;
  } catch {
    // fallback
  }

  return `# Digital Wealth Creators (DWC) Robots Specification
User-agent: *
Allow: /

# Private & Administrative Routes
Disallow: /admin
Disallow: /admin/
Disallow: /admin-login
Disallow: /instructor
Disallow: /instructor/
Disallow: /vault
Disallow: /vault/
Disallow: /learn/
Disallow: /api/

# Public API Feeds & Syndication
Allow: /api/feed.xml
Allow: /api/rss.xml

# Sitemap Reference
Sitemap: ${base}/sitemap.xml
Host: ${host}
`;
}

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  rawDate: number;
  category?: string;
  guid: string;
}

export function generateRssFeedXml(
  blogPosts: BlogPost[] = [],
  products: Product[] = [],
  baseUrl?: string
): string {
  const base = cleanBaseUrl(baseUrl);
  const nowRfc = formatRfc822Date(new Date());

  const items: RssItem[] = [];

  // Blog posts
  for (const post of blogPosts) {
    if (!post || post.status !== 'published') continue;
    const slug = post.slug || post.id;
    const link = `${base}/blog/${encodeURIComponent(slug)}`;
    const dateStr = post.publishedAt || post.updatedAt || '';
    const rawDate = dateStr ? new Date(dateStr).getTime() : 0;
    const pubDate = formatRfc822Date(dateStr);
    const description = post.excerpt || post.subtitle || 'Article on Digital Wealth Creators';

    items.push({
      title: post.title,
      link,
      description,
      pubDate,
      rawDate: isNaN(rawDate) ? 0 : rawDate,
      category: post.category,
      guid: link,
    });
  }

  // Products
  for (const product of products) {
    if (!product || (product.status && product.status !== 'published')) continue;
    const slug = product.slug || product.id;
    const link = `${base}/product/${encodeURIComponent(slug)}`;
    const dateStr = product.updatedAt || '';
    const rawDate = dateStr ? new Date(dateStr).getTime() : 0;
    const pubDate = formatRfc822Date(dateStr);
    const description = product.subtitle || product.description || product.title;

    items.push({
      title: product.title,
      link,
      description,
      pubDate,
      rawDate: isNaN(rawDate) ? 0 : rawDate,
      category: product.category,
      guid: link,
    });
  }

  // Sort descending by rawDate, take top 50
  items.sort((a, b) => b.rawDate - a.rawDate);
  const topItems = items.slice(0, 50);

  const xmlItems = topItems.map((item) => {
    const categoryTag = item.category ? `\n      <category>${escapeXml(item.category)}</category>` : '';
    return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${item.pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>${categoryTag}
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Digital Wealth Creators (DWC) — Updates &amp; Knowledge Feed</title>
    <link>${escapeXml(base)}</link>
    <description>Digital marketplace and LMS platform for courses, software, tutorials, and masterclasses.</description>
    <language>en-us</language>
    <lastBuildDate>${nowRfc}</lastBuildDate>
    <atom:link href="${escapeXml(`${base}/api/feed.xml`)}" rel="self" type="application/rss+xml" />
${xmlItems.join('\n')}
  </channel>
</rss>`;
}
