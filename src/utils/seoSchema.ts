import type { Product, BlogPost, CoursemartEvent } from '../types/marketplace.ts';
import { cleanBaseUrl } from './seoEngine.ts';

export function buildOrganizationSchema(baseUrl?: string): Record<string, any> {
  const base = cleanBaseUrl(baseUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Digital Wealth Creators',
    alternateName: 'DWC',
    url: base,
    logo: `${base}/logo.png`,
    sameAs: [
      'https://t.me/digitalwealthcreators',
      'https://wa.me/2348034710699',
      'https://linkedin.com/company/digitalwealthcreators',
      'https://instagram.com/digitalwealthcreators',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+2348034710699',
      contactType: 'Customer Support',
      availableLanguage: ['English'],
    },
  };
}

export function buildWebSiteSchema(baseUrl?: string): Record<string, any> {
  const base = cleanBaseUrl(baseUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Digital Wealth Creators',
    url: base,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/courses?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbListSchema(
  crumbs: BreadcrumbItem[] = [],
  baseUrl?: string
): Record<string, any> {
  const base = cleanBaseUrl(baseUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, idx) => {
      const itemUrl = crumb.url.startsWith('http://') || crumb.url.startsWith('https://')
        ? crumb.url
        : `${base}${crumb.url.startsWith('/') ? '' : '/'}${crumb.url}`;
      return {
        '@type': 'ListItem',
        position: idx + 1,
        name: crumb.name,
        item: itemUrl,
      };
    }),
  };
}

function toSafeIsoDate(dateVal?: string | number | Date | null): string | undefined {
  if (!dateVal) return undefined;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
  } catch {
    return undefined;
  }
}

export function resolveImageUrl(imagePath?: unknown, base?: string): string {
  const defaultImage = `${base}/logo.png`;
  if (!imagePath || typeof imagePath !== 'string') return defaultImage;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  return `${base}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
}

export function buildArticleSchema(post: BlogPost, baseUrl?: string): Record<string, any> {
  const base = cleanBaseUrl(baseUrl);
  const slug = post.slug || post.id;
  const canonicalUrl = `${base}/blog/${encodeURIComponent(slug)}`;
  const datePublished = toSafeIsoDate(post.publishedAt);
  const dateModified = toSafeIsoDate(post.updatedAt || post.publishedAt);
  const hasCoverImage = typeof post.coverImage === 'string' && post.coverImage.trim().length > 0;
  const imageUrl = hasCoverImage ? resolveImageUrl(post.coverImage, base) : undefined;

  const keywords = Array.isArray(post.tags) && post.tags.length > 0
    ? post.tags.join(', ')
    : post.focusKeyword || undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    ...(post.subtitle ? { alternativeHeadline: post.subtitle } : {}),
    description: post.seoDescription || post.excerpt || post.subtitle || post.title,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    author: {
      '@type': 'Person',
      name: post.authorName || 'DWC Editorial Team',
      ...(post.authorRole ? { jobTitle: post.authorRole } : {}),
      ...(post.authorAvatar ? { image: resolveImageUrl(post.authorAvatar, base) } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Digital Wealth Creators',
      url: base,
      logo: {
        '@type': 'ImageObject',
        url: `${base}/logo.png`,
      },
    },
    ...(keywords ? { keywords } : {}),
    ...(post.category ? { articleSection: post.category } : {}),
  };
}

export function buildCourseSchema(product: Product, baseUrl?: string): Record<string, any> {
  const base = cleanBaseUrl(baseUrl);
  const slug = product.slug || product.id;
  const url = `${base}/product/${encodeURIComponent(slug)}`;
  const imageUrl = resolveImageUrl(product.thumbnail, base);

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: product.title,
    description: product.description || product.subtitle || product.title,
    provider: {
      '@type': 'Organization',
      name: 'Digital Wealth Creators',
      sameAs: base,
    },
    instructor: {
      '@type': 'Person',
      name: product.instructorName || 'Lead Specialist',
      ...(product.instructorRole ? { jobTitle: product.instructorRole } : {}),
      ...(product.instructorAvatar ? { image: resolveImageUrl(product.instructorAvatar, base) } : {}),
    },
    offers: {
      '@type': 'Offer',
      category: product.price === 0 ? 'Free' : 'Paid',
      price: product.price,
      priceCurrency: 'NGN',
      availability: 'https://schema.org/InStock',
      url,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      ...(product.courseData?.totalHours ? { courseWorkload: `PT${product.courseData.totalHours}H` } : {}),
    },
    image: [imageUrl],
  };

  if (product.rating > 0 && (product.reviewCount || 0) > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function buildProductSchema(product: Product, baseUrl?: string): Record<string, any> {
  const base = cleanBaseUrl(baseUrl);
  const slug = product.slug || product.id;
  const url = `${base}/product/${encodeURIComponent(slug)}`;
  const imageUrl = resolveImageUrl(product.thumbnail, base);
  const isSoftware = product.type === 'software';

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': isSoftware ? 'SoftwareApplication' : 'Product',
    name: product.title,
    description: product.description || product.subtitle || product.title,
    brand: {
      '@type': 'Brand',
      name: 'Digital Wealth Creators',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'NGN',
      availability: 'https://schema.org/InStock',
      url,
    },
    image: [imageUrl],
  };

  if (isSoftware) {
    schema.applicationCategory = 'BusinessApplication';
    schema.operatingSystem = 'Web / Cloud';
  }

  if (product.rating > 0 && (product.reviewCount || 0) > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function buildEventSchema(event: CoursemartEvent, baseUrl?: string): Record<string, any> {
  const base = cleanBaseUrl(baseUrl);
  const eventUrl = `${base}/events`;
  const imageUrl = resolveImageUrl(event.coverImage, base);
  const isVirtual =
    event.deliveryMode === 'Live Virtual (Zoom / Meet)' ||
    event.deliveryMode === 'Live Virtual (Zoom/Meet)';
  const isHybrid = event.deliveryMode === 'Hybrid (In-Person + Live Stream)';

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.subtitle || event.description || event.title,
    url: eventUrl,
    startDate: event.startAt,
    endDate: event.endAt,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: isVirtual
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : isHybrid
        ? 'https://schema.org/MixedEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
    image: [imageUrl],
    organizer: {
      '@type': 'Organization',
      name: 'Digital Wealth Creators',
      url: base,
    },
    location: isVirtual
      ? { '@type': 'VirtualLocation', name: event.locationOrLink, url: event.locationOrLink }
      : {
          '@type': 'Place',
          name: event.locationOrLink,
          address: { '@type': 'PostalAddress', addressCountry: 'NG' },
        },
  };

  const isFree = event.isFree === true || event.price === 0;
  schema.offers = {
    '@type': 'Offer',
    name: isFree ? 'Free Registration' : 'Paid Registration',
    price: isFree ? 0 : event.price,
    priceCurrency: 'NGN',
    availability: (event.capacity ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
    url: eventUrl,
    validFrom: event.createdAt,
  };

  return schema;
}
