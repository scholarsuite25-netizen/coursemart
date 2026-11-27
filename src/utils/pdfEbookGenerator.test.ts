import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateEbookPdf } from './pdfEbookGenerator.ts';
import type { Product } from '../types/marketplace';

describe('pdfEbookGenerator', () => {
  const mockProduct: Product = {
    id: 'prod-ebook-enquiry-to-customer',
    slug: 'from-enquiry-to-customer-sales-systems-nigeria',
    title: 'FROM ENQUIRY TO CUSTOMER: Customer Communication, Follow-Up and Sales Systems for Nigerian Entrepreneurs',
    subtitle: 'A practical guide for small-business owners, online vendors, freelancers and service providers',
    description: 'Comprehensive guide to customer conversion systems for Nigerian businesses.',
    type: 'ebook',
    digitalSubType: 'ebook',
    category: 'Wealth Creation',
    instructorId: 'inst-omotoso',
    instructorName: 'S. B. OMOTOSO, FCIA',
    instructorRole: 'Managing Consultant, Tintol Business Services (Scholar Suite)',
    instructorAvatar: '/images/avatars/omotoso.jpg',
    price: 5000,
    originalPrice: 15000,
    rating: 4.98,
    reviewCount: 312,
    studentsCount: 2450,
    thumbnail: '/images/ebooks/from-enquiry-to-customer-cover.png',
    level: 'All Levels',
    language: 'English',
    updatedAt: '2026-11-27',
    status: 'published',
    featured: true,
    formatLabel: 'Complete 180-Page Verified PDF Book',
    learningOutcomes: [
      'Master the 5 stages of customer journey in Nigeria',
      'Deploy the 7-stage WhatsApp Business pipeline',
      'Comply with NDPA 2023 and FCCPA 2018',
    ],
    requirements: ['Any PDF reader'],
  };

  it('generates a multi-page PDF book with front cover, chapters, and back cover', () => {
    const doc = generateEbookPdf(mockProduct, {
      id: 'usr-test',
      name: 'Adewale Johnson',
      email: 'adewale@example.com',
      role: 'customer',
      password: 'test-hash-password',
      joinedAt: '2026-11-01',
      createdAt: '2026-11-01',
    });

    const pageCount = doc.getNumberOfPages();
    assert.ok(pageCount >= 18, `Expected at least 18 pages, got ${pageCount}`);

    const pdfBlob = doc.output('arraybuffer');
    assert.ok(pdfBlob.byteLength > 10_000, 'Expected PDF byte length > 10KB');
  });

  it('generates a fallback PDF for other general digital ebooks on the platform', () => {
    const genericEbook: Product = {
      ...mockProduct,
      id: 'prod-ebook-sample',
      slug: 'sample-digital-guide',
      title: 'Sample Digital Guide',
      ebookData: {
        pages: 50,
        formats: ['PDF'],
        isbn: '978-978-000-000-0',
        fileSize: '5MB',
        chapters: [
          { id: 'ch-1', number: 1, title: 'Introduction to Business', pages: 10, previewExcerpt: 'Sample text.' },
          { id: 'ch-2', number: 2, title: 'Strategic Planning', pages: 15, previewExcerpt: 'Sample text 2.' },
        ],
      },
    };

    const doc = generateEbookPdf(genericEbook);
    assert.ok(doc.getNumberOfPages() >= 4, 'Expected at least 4 pages for sample ebook');
  });
});
