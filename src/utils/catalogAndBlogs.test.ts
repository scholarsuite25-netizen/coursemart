import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndSortBlogPosts,
  filterProductsForCatalogPage,
  getDigitalSubType,
  getMatchedProductsForBlog,
  parseAppRoute,
  slugifyText,
} from './catalogAndBlogs';
import type { BlogPost, Product } from '../types/marketplace';

const sampleProducts: Product[] = [
  {
    id: 'c1',
    slug: 'ai-agents-course',
    title: 'AI Agents Course',
    subtitle: 'Build reliable agents',
    description: 'Deep dive',
    type: 'course',
    category: 'AI',
    instructorId: 'i1',
    instructorName: 'Dr. Vance',
    instructorRole: 'Architect',
    instructorAvatar: '',
    price: 59,
    originalPrice: 99,
    rating: 4.9,
    reviewCount: 50,
    studentsCount: 400,
    thumbnail: '',
    level: 'Intermediate',
    language: 'English',
    updatedAt: '2026-11-10',
    status: 'published',
    featured: true,
    learningOutcomes: [],
    requirements: [],
    formatLabel: '10 Hours',
  },
  {
    id: 'dp-ebook',
    slug: 'mentorship-ebook',
    title: 'Mentorship Playbook',
    subtitle: 'Engineering mentorship manual',
    description: 'Manual',
    type: 'ebook',
    digitalSubType: 'ebook',
    category: 'Mentorship',
    instructorId: 'i1',
    instructorName: 'Dr. Vance',
    instructorRole: 'Architect',
    instructorAvatar: '',
    price: 25,
    originalPrice: 40,
    rating: 4.8,
    reviewCount: 20,
    studentsCount: 200,
    thumbnail: '',
    level: 'All Levels',
    language: 'English',
    updatedAt: '2026-11-05',
    status: 'published',
    featured: false,
    learningOutcomes: [],
    requirements: [],
    formatLabel: '180 Pages',
  },
  {
    id: 'dp-template',
    slug: 'vibe-coding-templates',
    title: 'Vibe Coding Architecture Templates',
    subtitle: 'Ship apps fast with structured architecture templates',
    description: 'Templates',
    type: 'ebook',
    digitalSubType: 'template',
    category: 'Vibe Coding',
    instructorId: 'i1',
    instructorName: 'Dr. Vance',
    instructorRole: 'Architect',
    instructorAvatar: '',
    price: 19,
    originalPrice: 39,
    rating: 4.9,
    reviewCount: 80,
    studentsCount: 750,
    thumbnail: '',
    level: 'Beginner',
    language: 'English',
    updatedAt: '2026-11-12',
    status: 'published',
    featured: true,
    learningOutcomes: [],
    requirements: [],
    formatLabel: '24 Templates · Notion / MD',
  },
  {
    id: 'sw-1',
    slug: 'deployguard-cli',
    title: 'DeployGuard CLI',
    subtitle: 'Preflight deployment tool',
    description: 'Software',
    type: 'software',
    category: 'Apps Deployment',
    instructorId: 'i1',
    instructorName: 'Marcus Chen',
    instructorRole: 'Staff Engineer',
    instructorAvatar: '',
    price: 75,
    originalPrice: 120,
    rating: 4.7,
    reviewCount: 30,
    studentsCount: 300,
    thumbnail: '',
    level: 'Intermediate',
    language: 'CLI',
    updatedAt: '2026-11-11',
    status: 'published',
    featured: false,
    learningOutcomes: [],
    requirements: [],
    formatLabel: 'v1.4.0 Binary',
  },
];

const sampleBlogs: BlogPost[] = [
  {
    id: 'b1',
    slug: 'vibe-coding-guardrails',
    title: 'Vibe Coding With Production Guardrails',
    subtitle: 'How to move at AI speed without shipping fragile spaghetti',
    excerpt: 'Structured specs turn prompt-driven coding into durable architecture.',
    category: 'Vibe Coding',
    authorId: 'i1',
    authorName: 'Dr. Vance',
    authorRole: 'Architect',
    authorAvatar: '',
    coverImage: '',
    readTimeMinutes: 7,
    publishedAt: '2026-11-14T10:00:00Z',
    updatedAt: '2026-11-14T10:00:00Z',
    status: 'published',
    featured: true,
    tags: ['ai', 'vibe coding', 'prompts'],
    sections: [],
    relatedProductIds: ['dp-template'],
    comments: [],
  },
  {
    id: 'b2',
    slug: 'zero-downtime-cloud-run',
    title: 'Zero-Downtime Apps Deployment Checklist',
    subtitle: 'Blue-green revisions and safe database migrations',
    excerpt: 'Deploy confidently every Friday.',
    category: 'Apps Deployment',
    authorId: 'i1',
    authorName: 'Marcus Chen',
    authorRole: 'Staff Engineer',
    authorAvatar: '',
    coverImage: '',
    readTimeMinutes: 9,
    publishedAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
    status: 'published',
    featured: false,
    tags: ['deployment', 'docker'],
    sections: [],
    relatedProductIds: [],
    comments: [],
  },
  {
    id: 'b3',
    slug: 'draft-leadership-notes',
    title: 'Internal Draft Post',
    subtitle: 'Draft subtitle',
    excerpt: 'Draft excerpt',
    category: 'Leadership',
    authorId: 'i1',
    authorName: 'Dr. Vance',
    authorRole: 'Architect',
    authorAvatar: '',
    coverImage: '',
    readTimeMinutes: 5,
    publishedAt: '2026-11-16T10:00:00Z',
    updatedAt: '2026-11-16T10:00:00Z',
    status: 'draft',
    featured: false,
    tags: [],
    sections: [],
    relatedProductIds: [],
    comments: [],
  },
];

const baseFilter = {
  category: 'All',
  minRating: 0,
  priceFilter: 'all' as const,
  level: 'all' as const,
  search: '',
  sortBy: 'popular' as const,
};

test('parseAppRoute resolves separate pages for Courses, Digital Products submenus, Software, and Blogs', () => {
  assert.deepEqual(parseAppRoute('/courses'), { page: 'courses' });
  assert.deepEqual(parseAppRoute('/digital-products'), { page: 'digital-hub' });
  assert.deepEqual(parseAppRoute('/digital-products/ebooks'), {
    page: 'digital-sub',
    subType: 'ebook',
    slug: 'ebooks',
  });
  assert.deepEqual(parseAppRoute('/digital-products/templates'), {
    page: 'digital-sub',
    subType: 'template',
    slug: 'templates',
  });
  assert.deepEqual(parseAppRoute('/software'), { page: 'software' });
  assert.deepEqual(parseAppRoute('/blogs'), { page: 'blogs-hub' });
  assert.deepEqual(parseAppRoute('/blogs/category/vibe-coding'), {
    page: 'blogs-category',
    category: 'Vibe Coding',
    slug: 'vibe-coding',
  });
  assert.deepEqual(parseAppRoute('/blog/vibe-coding-guardrails'), {
    page: 'blog-detail',
    slug: 'vibe-coding-guardrails',
  });
});

test('filterProductsForCatalogPage isolates courses, digital hub, digital subtypes, and software', () => {
  const courses = filterProductsForCatalogPage(sampleProducts, { kind: 'courses' }, baseFilter);
  assert.equal(courses.length, 1);
  assert.equal(courses[0].id, 'c1');

  const digitalAll = filterProductsForCatalogPage(
    sampleProducts,
    { kind: 'digital-hub' },
    baseFilter
  );
  assert.equal(digitalAll.length, 2);

  const templates = filterProductsForCatalogPage(
    sampleProducts,
    { kind: 'digital-sub', subType: 'template' },
    baseFilter
  );
  assert.equal(templates.length, 1);
  assert.equal(templates[0].id, 'dp-template');
  assert.equal(getDigitalSubType(templates[0]), 'template');

  const software = filterProductsForCatalogPage(sampleProducts, { kind: 'software' }, baseFilter);
  assert.equal(software.length, 1);
  assert.equal(software[0].id, 'sw-1');
});

test('filterAndSortBlogPosts excludes drafts by default and filters by category and search', () => {
  const published = filterAndSortBlogPosts(sampleBlogs);
  assert.equal(published.length, 2);
  assert.equal(published[0].id, 'b1');

  const withDrafts = filterAndSortBlogPosts(sampleBlogs, { includeDrafts: true });
  assert.equal(withDrafts.length, 3);

  const deployOnly = filterAndSortBlogPosts(sampleBlogs, { category: 'Apps Deployment' });
  assert.equal(deployOnly.length, 1);
  assert.equal(deployOnly[0].id, 'b2');

  const searchResult = filterAndSortBlogPosts(sampleBlogs, { search: 'guardrails' });
  assert.equal(searchResult.length, 1);
  assert.equal(searchResult[0].id, 'b1');
});

test('getMatchedProductsForBlog combines explicit relatedProductIds and category matches', () => {
  const matchedB1 = getMatchedProductsForBlog(sampleBlogs[0], sampleProducts, 3);
  assert.equal(matchedB1[0].id, 'dp-template');
  assert.ok(matchedB1.some((p) => p.id === 'c1'));

  const matchedB2 = getMatchedProductsForBlog(sampleBlogs[1], sampleProducts, 3);
  assert.equal(matchedB2.length, 1);
  assert.equal(matchedB2[0].id, 'sw-1');
});

test('slugifyText builds clean URL slugs', () => {
  assert.equal(slugifyText('Vibe Coding: Apps & AI!'), 'vibe-coding-apps-ai');
});

test('parseAppRoute resolves community routes and subViews', () => {
  const rootComm = parseAppRoute('/community');
  assert.deepEqual(rootComm, { page: 'community', subView: undefined, channelId: undefined, threadId: undefined });

  const chatComm = parseAppRoute('/community/chat');
  assert.deepEqual(chatComm, { page: 'community', subView: 'chat' });

  const chanComm = parseAppRoute('/community/channels/general');
  assert.deepEqual(chanComm, { page: 'community', subView: 'chat', channelId: 'general' });

  const forumsComm = parseAppRoute('/community/forums');
  assert.deepEqual(forumsComm, { page: 'community', subView: 'forums' });

  const threadComm = parseAppRoute('/community/threads/thread-123');
  assert.deepEqual(threadComm, { page: 'community', subView: 'thread', threadId: 'thread-123' });

  const queryComm = parseAppRoute('/community?tab=chat&channel=chan-1');
  assert.deepEqual(queryComm, { page: 'community', subView: 'chat', channelId: 'chan-1', threadId: undefined });
});

test('parseAppRoute resolves sales funnel and member prompt vault routes', () => {
  assert.deepEqual(parseAppRoute('/vault'), { page: 'vault' });
  assert.deepEqual(parseAppRoute('/vault/'), { page: 'vault' });
  assert.deepEqual(parseAppRoute('/funnel/ai-saas-accelerator'), {
    page: 'funnel',
    slug: 'ai-saas-accelerator',
  });
  assert.deepEqual(parseAppRoute('/funnel/fullstack-typescript-bundle?ref=DEVCHAMP20'), {
    page: 'funnel',
    slug: 'fullstack-typescript-bundle',
  });
  assert.deepEqual(parseAppRoute('/funnel'), {
    page: 'funnel',
    slug: 'ai-saas-accelerator',
  });
});

