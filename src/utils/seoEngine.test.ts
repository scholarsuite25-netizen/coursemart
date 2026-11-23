import { describe, it, expect } from './testExpect.ts';
import {
  escapeXml,
  cleanBaseUrl,
  formatIsoDate,
  formatRfc822Date,
  generateSitemapXml,
  generateRobotsTxt,
  generateRssFeedXml,
  DEFAULT_BASE_URL,
} from './seoEngine.ts';
import type { Product, BlogPost } from '../types/marketplace.ts';
import type { DocumentTutorial } from '../types/tutorial.ts';

describe('SEO Engine: XML Escaping & Utilities', () => {
  it('escapeXml safely transforms XML special characters and handles nullish values', () => {
    expect(escapeXml('Rock & Roll <5> "Special" \'Edition\'')).toBe('Rock &amp; Roll &lt;5&gt; &quot;Special&quot; &apos;Edition&apos;');
    expect(escapeXml(null)).toBe('');
    expect(escapeXml(undefined)).toBe('');
    expect(escapeXml(12345)).toBe('12345');
    expect(escapeXml('SimpleText')).toBe('SimpleText');
  });

  it('cleanBaseUrl trims trailing slashes and falls back to default', () => {
    expect(cleanBaseUrl('https://example.com/')).toBe('https://example.com');
    expect(cleanBaseUrl('https://example.com///')).toBe('https://example.com');
    expect(cleanBaseUrl('')).toBe(DEFAULT_BASE_URL);
    expect(cleanBaseUrl(undefined)).toBe(DEFAULT_BASE_URL);
  });

  it('formatIsoDate formats dates to YYYY-MM-DD or defaults gracefully', () => {
    expect(formatIsoDate('2026-11-20T10:00:00Z')).toBe('2026-11-20');
    expect(formatIsoDate('invalid-date-string').length).toBe(10);
    expect(formatIsoDate(null).length).toBe(10);
  });

  it('formatRfc822Date produces valid RFC 822 UTC date strings', () => {
    const formatted = formatRfc822Date('2026-11-20T12:00:00Z');
    expect(formatted.includes('GMT') || formatted.includes('UTC') || formatted.includes('2026')).toBe(true);
    expect(formatRfc822Date(null).length).toBeGreaterThan(10);
  });
});

describe('SEO Engine: generateSitemapXml', () => {
  const dummyProducts: Product[] = [
    {
      id: 'prod-c1',
      slug: 'ai-engineering-mastery',
      title: 'AI Engineering Mastery',
      subtitle: 'Build Agents',
      description: 'Hands on course',
      type: 'course',
      category: 'AI',
      instructorId: 'inst-1',
      instructorName: 'Sarah AI',
      instructorRole: 'Lead',
      instructorAvatar: '',
      price: 15000,
      originalPrice: 20000,
      rating: 4.9,
      reviewCount: 40,
      studentsCount: 200,
      thumbnail: 'https://site.org/thumb.png',
      level: 'All Levels',
      language: 'English',
      updatedAt: '2026-11-18T00:00:00Z',
      status: 'published',
      featured: true,
      learningOutcomes: ['Build agents'],
      requirements: ['Basic JS'],
      formatLabel: 'Online Course',
    },
    {
      id: 'prod-d1',
      slug: 'draft-software',
      title: 'Draft Software',
      subtitle: 'Not released',
      description: 'Unpublished software',
      type: 'software',
      category: 'Developer Tools',
      instructorId: 'inst-1',
      instructorName: 'Dev',
      instructorRole: 'Engineer',
      instructorAvatar: '',
      price: 5000,
      originalPrice: 5000,
      rating: 0,
      reviewCount: 0,
      studentsCount: 0,
      thumbnail: '',
      level: 'Beginner',
      language: 'English',
      updatedAt: '2026-11-18T00:00:00Z',
      status: 'draft',
      featured: false,
      learningOutcomes: [],
      requirements: [],
      formatLabel: 'Software',
    },
  ];

  const dummyBlogs: BlogPost[] = [
    {
      id: 'b-1',
      slug: 'ai-agent-playbook',
      title: 'AI Agent Playbook 2026',
      subtitle: 'Next gen patterns',
      excerpt: 'Guide to autonomous AI architectures',
      category: 'AI',
      authorId: 'auth-1',
      authorName: 'Staff Lead',
      authorRole: 'Architect',
      authorAvatar: '',
      coverImage: 'https://site.org/cover.png',
      readTimeMinutes: 5,
      publishedAt: '2026-11-15T00:00:00Z',
      updatedAt: '2026-11-16T00:00:00Z',
      status: 'published',
      featured: true,
      tags: ['AI', 'Agents'],
      sections: [],
      relatedProductIds: [],
      comments: [],
    },
    {
      id: 'b-sched',
      slug: 'scheduled-post',
      title: 'Future Post',
      subtitle: '',
      excerpt: '',
      category: 'Mentorship',
      authorId: 'auth-1',
      authorName: 'Staff',
      authorRole: '',
      authorAvatar: '',
      coverImage: '',
      readTimeMinutes: 3,
      publishedAt: '',
      updatedAt: '',
      status: 'scheduled',
      featured: false,
      tags: [],
      sections: [],
      relatedProductIds: [],
      comments: [],
    },
  ];

  const dummyTutorials: DocumentTutorial[] = [
    {
      id: 'tut-1',
      slug: 'deploying-ai-microservices',
      title: 'Deploying AI Microservices',
      description: 'Complete guide to AI microservice deployment',
      authorName: 'DWC Team',
      difficulty: 'Advanced',
      steps: [],
      tags: ['AI', 'Deployment'],
      status: 'published',
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-18T00:00:00Z',
    },
  ];

  it('includes static routes, published products, blogs, and tutorials but excludes drafts and scheduled content', () => {
    const sitemap = generateSitemapXml(dummyProducts, dummyBlogs, dummyTutorials, 'https://digitalwealthcreators.org.ng');

    expect(sitemap.startsWith('<?xml')).toBe(true);
    expect(sitemap).toContain('<urlset');
    expect(sitemap).toContain('</urlset>');

    // Static routes
    expect(sitemap).toContain('<loc>https://digitalwealthcreators.org.ng</loc>');
    expect(sitemap).toContain('<priority>1.0</priority>');

    // Published course included
    expect(sitemap).toContain('<loc>https://digitalwealthcreators.org.ng/product/ai-engineering-mastery</loc>');
    expect(sitemap).toContain('<priority>0.9</priority>');

    // Draft product excluded
    expect(sitemap).not.toContain('draft-software');

    // Published blog & priority & lastmod
    expect(sitemap).toContain('<loc>https://digitalwealthcreators.org.ng/blog/ai-agent-playbook</loc>');
    expect(sitemap).toContain('<lastmod>2026-11-16</lastmod>');

    // Scheduled blog excluded
    expect(sitemap).not.toContain('scheduled-post');

    // Published tutorial
    expect(sitemap).toContain('<loc>https://digitalwealthcreators.org.ng/tutorials/deploying-ai-microservices</loc>');
    expect(sitemap).toContain('<priority>0.85</priority>');
  });
});

describe('SEO Engine: generateRobotsTxt', () => {
  it('generates compliant robots.txt with disallows, public feed allowances, and sitemap reference', () => {
    const robots = generateRobotsTxt('https://digitalwealthcreators.org.ng/');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Disallow: /vault');
    expect(robots).toContain('Disallow: /learn/');
    expect(robots).toContain('Disallow: /api/');
    expect(robots).toContain('Allow: /api/feed.xml');
    expect(robots).toContain('Allow: /api/rss.xml');
    expect(robots).toContain('Sitemap: https://digitalwealthcreators.org.ng/sitemap.xml');
    expect(robots).toContain('Host: digitalwealthcreators.org.ng');
  });
});

describe('SEO Engine: generateRssFeedXml', () => {
  it('generates compliant RSS 2.0 feed with atom link and valid items', () => {
    const blogs: BlogPost[] = [
      {
        id: 'rss-b1',
        slug: 'rss-article',
        title: 'RSS Feed Article & Guide',
        subtitle: 'Sub heading',
        excerpt: 'Summary of article',
        category: 'AI',
        authorId: 'a1',
        authorName: 'Author',
        authorRole: 'Role',
        authorAvatar: '',
        coverImage: '',
        readTimeMinutes: 4,
        publishedAt: '2026-11-20T12:00:00Z',
        updatedAt: '2026-11-20T12:00:00Z',
        status: 'published',
        featured: false,
        tags: ['RSS'],
        sections: [],
        relatedProductIds: [],
        comments: [],
      },
    ];

    const rss = generateRssFeedXml(blogs, [], 'https://digitalwealthcreators.org.ng');
    expect(rss).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
    expect(rss).toContain('<channel>');
    expect(rss).toContain('<title>RSS Feed Article &amp; Guide</title>');
    expect(rss).toContain('<link>https://digitalwealthcreators.org.ng/blog/rss-article</link>');
    expect(rss).toContain('<category>AI</category>');
    expect(rss).toContain('</channel>');
  });

  it('declares atom namespace on root rss tag for strict XML validation', () => {
    const rss = generateRssFeedXml([], [], 'https://digitalwealthcreators.org.ng');
    expect(rss).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
    expect(rss).toContain('<atom:link href="https://digitalwealthcreators.org.ng/api/feed.xml" rel="self" type="application/rss+xml" />');
  });

  it('avoids double XML escaping in item links when slug contains ampersand', () => {
    const blog: BlogPost = {
      id: 'blog-amp',
      slug: 'tech&ai-trends',
      title: 'Tech & AI Trends',
      subtitle: '',
      excerpt: 'Exciting trends',
      category: 'AI',
      authorId: 'a1',
      authorName: 'Author',
      authorRole: '',
      authorAvatar: '',
      coverImage: '',
      readTimeMinutes: 3,
      publishedAt: '2026-11-20T12:00:00Z',
      updatedAt: '2026-11-20T12:00:00Z',
      status: 'published',
      featured: false,
      tags: [],
      sections: [],
      relatedProductIds: [],
      comments: [],
    };
    const product: Product = {
      id: 'prod-amp',
      slug: 'hardware&gadgets',
      title: 'Hardware & Gadgets',
      subtitle: '',
      description: 'Gadgets',
      type: 'course',
      category: 'Hardware',
      instructorId: 'inst-1',
      instructorName: 'Instructor',
      instructorRole: '',
      instructorAvatar: '',
      price: 1000,
      originalPrice: 1000,
      rating: 5,
      reviewCount: 1,
      studentsCount: 1,
      thumbnail: '',
      level: 'All Levels',
      language: 'English',
      updatedAt: '2026-11-20T12:00:00Z',
      status: 'published',
      featured: false,
      learningOutcomes: [],
      requirements: [],
      formatLabel: 'Course',
    };

    const rss = generateRssFeedXml([blog], [product], 'https://digitalwealthcreators.org.ng');
    expect(rss.includes('&amp;amp;')).toBe(false);
    expect(rss).toContain('/blog/tech%26ai-trends');
    expect(rss).toContain('/product/hardware%26gadgets');
  });
});
