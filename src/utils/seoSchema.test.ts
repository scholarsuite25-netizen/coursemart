import { describe, it, expect } from './testExpect.ts';
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildBreadcrumbListSchema,
  buildArticleSchema,
  buildCourseSchema,
  buildProductSchema,
} from './seoSchema.ts';
import type { BlogPost, Product } from '../types/marketplace.ts';

describe('SEO Schema: Schema.org JSON-LD Generators', () => {
  const base = 'https://digitalwealthcreators.org.ng';

  it('buildOrganizationSchema returns valid Organization schema', () => {
    const org = buildOrganizationSchema(base);
    expect(org['@context']).toBe('https://schema.org');
    expect(org['@type']).toBe('Organization');
    expect(org.name).toBe('Digital Wealth Creators');
    expect(org.url).toBe(base);
    expect(Array.isArray(org.sameAs)).toBe(true);
    expect(org.sameAs.some((s: string) => s.includes('linkedin'))).toBe(true);
    expect(org.contactPoint['@type']).toBe('ContactPoint');
  });

  it('buildWebSiteSchema returns valid WebSite schema with Sitelinks SearchAction', () => {
    const site = buildWebSiteSchema(base);
    expect(site['@context']).toBe('https://schema.org');
    expect(site['@type']).toBe('WebSite');
    expect(site.name).toBe('Digital Wealth Creators');
    expect(site.potentialAction['@type']).toBe('SearchAction');
    expect(site.potentialAction.target.urlTemplate).toContain('/courses?q=');
  });

  it('buildBreadcrumbListSchema builds ordered ListItem sequence', () => {
    const crumbs = [
      { name: 'Home', url: '/' },
      { name: 'Courses', url: '/courses' },
      { name: 'AI Mastery', url: '/product/ai-mastery' },
    ];
    const schema = buildBreadcrumbListSchema(crumbs, base);
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement.length).toBe(3);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[0].item).toBe(`${base}/`);
    expect(schema.itemListElement[1].position).toBe(2);
    expect(schema.itemListElement[1].item).toBe(`${base}/courses`);
    expect(schema.itemListElement[2].position).toBe(3);
  });

  it('buildArticleSchema builds BlogPosting schema with author and publisher', () => {
    const post: BlogPost = {
      id: 'post-test',
      slug: 'neural-networks-101',
      title: 'Neural Networks 101',
      subtitle: 'A Primer',
      excerpt: 'Foundational concepts in deep learning',
      category: 'AI',
      authorId: 'auth-1',
      authorName: 'Dr. Jane AI',
      authorRole: 'Chief Scientist',
      authorAvatar: 'https://site.org/jane.png',
      coverImage: 'https://site.org/nn.png',
      readTimeMinutes: 7,
      publishedAt: '2026-11-20T10:00:00Z',
      updatedAt: '2026-11-21T10:00:00Z',
      status: 'published',
      featured: true,
      tags: ['AI', 'DeepLearning'],
      sections: [],
      relatedProductIds: [],
      comments: [],
    };

    const schema = buildArticleSchema(post, base);
    expect(schema['@type']).toBe('BlogPosting');
    expect(schema.headline).toBe('Neural Networks 101');
    expect(schema.author['@type']).toBe('Person');
    expect(schema.author.name).toBe('Dr. Jane AI');
    expect(schema.publisher['@type']).toBe('Organization');
    expect(schema.mainEntityOfPage['@id']).toBe(`${base}/blog/neural-networks-101`);
    expect(schema.image && schema.image[0]).toBe('https://site.org/nn.png');
  });

  it('buildArticleSchema omits image if coverImage is empty', () => {
    const post: BlogPost = {
      id: 'post-no-img',
      slug: 'no-image-article',
      title: 'No Image Article',
      subtitle: '',
      excerpt: 'Brief excerpt',
      category: 'AI',
      authorId: 'auth-1',
      authorName: 'Writer',
      authorRole: '',
      authorAvatar: '',
      coverImage: '',
      readTimeMinutes: 2,
      publishedAt: '2026-11-20T10:00:00Z',
      updatedAt: '2026-11-20T10:00:00Z',
      status: 'published',
      featured: false,
      tags: [],
      sections: [],
      relatedProductIds: [],
      comments: [],
    };

    const schema = buildArticleSchema(post, base);
    expect(schema.image).toBeUndefined();
  });

  it('buildArticleSchema defensively handles corrupted dates without throwing', () => {
    const postWithInvalidDate: BlogPost = {
      id: 'p-corrupted',
      slug: 'corrupted-date-post',
      title: 'Corrupted Date Post',
      subtitle: '',
      excerpt: '',
      category: 'AI',
      authorId: 'a1',
      authorName: 'Author',
      authorRole: '',
      authorAvatar: '',
      coverImage: { url: 'https://example.com/not-a-string' } as any,
      readTimeMinutes: 1,
      publishedAt: 'invalid-non-iso-date',
      updatedAt: 'another-corrupted-date',
      status: 'published',
      featured: false,
      tags: [],
      sections: [],
      relatedProductIds: [],
      comments: [],
    };

    const schema = buildArticleSchema(postWithInvalidDate, base);
    expect(schema['@type']).toBe('BlogPosting');
    expect(schema.datePublished).toBeUndefined();
    expect(schema.dateModified).toBeUndefined();
    expect(schema.image).toBeUndefined();
  });

  it('buildCourseSchema builds Course schema with offer and aggregateRating', () => {
    const course: Product = {
      id: 'c-1',
      slug: 'fullstack-vibe-coding',
      title: 'Fullstack Vibe Coding',
      subtitle: 'Build with AI',
      description: 'Course description',
      type: 'course',
      category: 'Software Engineering',
      instructorId: 'inst-1',
      instructorName: 'Cephas Omotoso',
      instructorRole: 'Lead Architect',
      instructorAvatar: 'https://site.org/cephas.png',
      price: 25000,
      originalPrice: 40000,
      rating: 4.95,
      reviewCount: 52,
      studentsCount: 310,
      thumbnail: 'https://site.org/course-thumb.png',
      level: 'All Levels',
      language: 'English',
      updatedAt: '2026-11-20T00:00:00Z',
      status: 'published',
      featured: true,
      learningOutcomes: ['Fullstack mastery'],
      requirements: ['TypeScript basics'],
      formatLabel: 'Masterclass Course',
      courseData: {
        totalHours: 18,
        modules: [],
      },
    };

    const schema = buildCourseSchema(course, base);
    expect(schema['@type']).toBe('Course');
    expect(schema.name).toBe('Fullstack Vibe Coding');
    expect(schema.offers['@type']).toBe('Offer');
    expect(schema.offers.price).toBe(25000);
    expect(schema.offers.priceCurrency).toBe('NGN');
    expect(schema.hasCourseInstance['@type']).toBe('CourseInstance');
    expect(schema.hasCourseInstance.courseWorkload).toBe('PT18H');
    expect(schema.aggregateRating['@type']).toBe('AggregateRating');
    expect(schema.aggregateRating.ratingValue).toBe(4.95);
    expect(schema.aggregateRating.reviewCount).toBe(52);
  });

  it('buildProductSchema builds SoftwareApplication schema for software products', () => {
    const sw: Product = {
      id: 'sw-1',
      slug: 'dwc-ai-toolkit',
      title: 'DWC AI Toolkit',
      subtitle: 'Desktop & Web CLI',
      description: 'Automation toolkit',
      type: 'software',
      category: 'Developer Tools',
      instructorId: 'inst-1',
      instructorName: 'DWC Labs',
      instructorRole: 'Engineering Team',
      instructorAvatar: '',
      price: 12000,
      originalPrice: 15000,
      rating: 4.8,
      reviewCount: 15,
      studentsCount: 100,
      thumbnail: 'https://site.org/sw-thumb.png',
      level: 'Advanced',
      language: 'English',
      updatedAt: '2026-11-20T00:00:00Z',
      status: 'published',
      featured: false,
      learningOutcomes: [],
      requirements: [],
      formatLabel: 'Software License',
    };

    const schema = buildProductSchema(sw, base);
    expect(schema['@type']).toBe('SoftwareApplication');
    expect(schema.applicationCategory).toBe('BusinessApplication');
    expect(schema.operatingSystem).toBe('Web / Cloud');
    expect(schema.offers.price).toBe(12000);
  });
});
