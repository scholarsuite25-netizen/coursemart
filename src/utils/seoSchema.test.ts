import { describe, it, expect } from './testExpect.ts';
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildBreadcrumbListSchema,
  buildArticleSchema,
  buildCourseSchema,
  buildProductSchema,
  buildEventSchema,
  resolveImageUrl,
} from './seoSchema.ts';
import type { BlogPost, Product, CoursemartEvent } from '../types/marketplace.ts';

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

  const buildCoursemartEvent = (overrides: Partial<CoursemartEvent> = {}): CoursemartEvent => ({
    id: 'ev-1',
    slug: 'ai-automation-workshop-lagos',
    title: 'AI Automation Workshop',
    subtitle: 'Ship your first automation in a day',
    description: 'Hands-on workshop covering agent workflows and integrations.',
    format: 'workshop',
    category: 'AI',
    deliveryMode: 'In-Person Studio',
    locationOrLink: 'DWC Studio, Lagos',
    startAt: '2026-12-05T10:00:00.000Z',
    endAt: '2026-12-05T16:00:00.000Z',
    timezone: 'Africa/Lagos',
    speakerName: 'Ada Dev',
    speakerRole: 'Lead Engineer',
    speakerAvatar: '',
    coverImage: '/images/event-cover.png',
    price: 5000,
    isFree: false,
    capacity: 40,
    status: 'published',
    featured: true,
    agenda: ['Intro to agents', 'Live build'],
    preEventMaterials: [],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-02T00:00:00.000Z',
    ...overrides,
  });

  it('buildEventSchema builds schema.org Event with offline attendance for in-person events', () => {
    const event = buildCoursemartEvent();
    const schema = buildEventSchema(event, base);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Event');
    expect(schema.name).toBe('AI Automation Workshop');
    expect(schema.url).toBe(`${base}/events`);
    expect(schema.startDate).toBe('2026-12-05T10:00:00.000Z');
    expect(schema.endDate).toBe('2026-12-05T16:00:00.000Z');
    expect(schema.eventStatus).toBe('https://schema.org/EventScheduled');
    expect(schema.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode');
    expect(schema.location['@type']).toBe('Place');
    expect(schema.location.name).toBe('DWC Studio, Lagos');
    expect(schema.organizer.name).toBe('Digital Wealth Creators');
    expect(schema.image[0]).toBe(`${base}/images/event-cover.png`);
    expect(schema.offers.price).toBe(5000);
    expect(schema.offers.priceCurrency).toBe('NGN');
    expect(schema.offers.availability).toBe('https://schema.org/InStock');
  });

  it('buildEventSchema maps virtual/hybrid delivery, free pricing and sold-out capacity', () => {
    const virtual = buildCoursemartEvent({
      deliveryMode: 'Live Virtual (Zoom / Meet)',
      locationOrLink: 'https://meet.example.com/dwc',
      price: 0,
      isFree: true,
    });
    const virtualSchema = buildEventSchema(virtual, base);
    expect(virtualSchema.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
    expect(virtualSchema.location['@type']).toBe('VirtualLocation');
    expect(virtualSchema.location.url).toBe('https://meet.example.com/dwc');
    expect(virtualSchema.offers.price).toBe(0);
    expect(virtualSchema.offers.name).toBe('Free Registration');

    const hybrid = buildCoursemartEvent({ deliveryMode: 'Hybrid (In-Person + Live Stream)' });
    expect(buildEventSchema(hybrid, base).eventAttendanceMode).toBe(
      'https://schema.org/MixedEventAttendanceMode'
    );

    const soldOut = buildCoursemartEvent({ capacity: 0 });
    expect(buildEventSchema(soldOut, base).offers.availability).toBe(
      'https://schema.org/SoldOut'
    );
  });

  it('resolveImageUrl makes relative paths absolute and passes through absolute URLs', () => {
    expect(resolveImageUrl('/images/a.png', base)).toBe(`${base}/images/a.png`);
    expect(resolveImageUrl('images/a.png', base)).toBe(`${base}/images/a.png`);
    expect(resolveImageUrl('https://cdn.example.com/a.png', base)).toBe(
      'https://cdn.example.com/a.png'
    );
    expect(resolveImageUrl(undefined, base)).toBe(`${base}/logo.png`);
  });
});
