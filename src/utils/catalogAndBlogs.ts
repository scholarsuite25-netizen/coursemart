import type {
  BlogCategory,
  BlogPost,
  DigitalResourceSubType,
  Product,
  ProductFilterState,
} from '../types/marketplace';
import { filterAndSortProducts } from './commerce.ts';

export interface DigitalSubmenuMeta {
  subType: DigitalResourceSubType;
  slug: string;
  route: string;
  label: string;
  singularLabel: string;
  headline: string;
  description: string;
}

export const DIGITAL_SUBMENU_ITEMS: DigitalSubmenuMeta[] = [
  {
    subType: 'ebook',
    slug: 'ebooks',
    route: '/digital-products/ebooks',
    label: 'eBooks',
    singularLabel: 'eBook',
    headline: 'Technical & Strategic eBooks',
    description:
      'DRM-free field manuals in PDF, EPUB, and MOBI covering TypeScript, AI systems, engineering leadership, and SaaS economics.',
  },
  {
    subType: 'template',
    slug: 'templates',
    route: '/digital-products/templates',
    label: 'Templates',
    singularLabel: 'Template',
    headline: 'Production Architecture & Team Templates',
    description:
      'Ready-to-clone Notion workspaces, deployment blueprints, system RFCs, and mentorship review templates built for fast execution.',
  },
  {
    subType: 'toolkit',
    slug: 'toolkits',
    route: '/digital-products/toolkits',
    label: 'Toolkits',
    singularLabel: 'Toolkit',
    headline: 'Deployment, Ops & Leadership Toolkits',
    description:
      'Curated checklists, Terraform/Docker starter scripts, release runbooks, and engineering manager playbooks ready to deploy.',
  },
];

export interface BlogCategoryMeta {
  category: BlogCategory;
  slug: string;
  route: string;
  description: string;
}

export const BLOG_CATEGORY_ITEMS: BlogCategoryMeta[] = [
  {
    category: 'AI',
    slug: 'ai',
    route: '/blogs/category/ai',
    description:
      'Practical guides on LLM architecture, agent orchestration, evaluation harnesses, and production AI reliability.',
  },
  {
    category: 'Mentorship',
    slug: 'mentorship',
    route: '/blogs/category/mentorship',
    description:
      'Actionable coaching systems, structured 1-on-1 agendas, code review feedback loops, and career growth roadmaps.',
  },
  {
    category: 'Leadership',
    slug: 'leadership',
    route: '/blogs/category/leadership',
    description:
      'Staff+ technical influence, engineering org design, decision memos, and building high-trust delivery cultures.',
  },
  {
    category: 'Vibe Coding',
    slug: 'vibe-coding',
    route: '/blogs/category/vibe-coding',
    description:
      'High-velocity AI-assisted software crafting: specification-first prompting, rapid prototyping, and architecture guardrails.',
  },
  {
    category: 'Apps Deployment',
    slug: 'apps-deployment',
    route: '/blogs/category/apps-deployment',
    description:
      'Zero-downtime releases, container hardening, Cloud Run / edge hosting, environment secrets, and observability.',
  },
];

export const ALL_PRODUCT_TOPICS: string[] = [
  'AI',
  'Mentorship',
  'Leadership',
  'Vibe Coding',
  'Apps Deployment',
  'Software Engineering',
  'Design & UI Systems',
  'Data & Infrastructure',
  'Developer Tools',
  'Business & Product',
];

export function getDigitalSubType(product: Product): DigitalResourceSubType {
  return product.digitalSubType ?? 'ebook';
}

export function getDigitalSubmenuBySlug(slug: string): DigitalSubmenuMeta | undefined {
  return DIGITAL_SUBMENU_ITEMS.find((item) => item.slug === slug);
}

export function getDigitalSubmenuByType(subType: DigitalResourceSubType): DigitalSubmenuMeta {
  return (
    DIGITAL_SUBMENU_ITEMS.find((item) => item.subType === subType) ?? DIGITAL_SUBMENU_ITEMS[0]
  );
}

export function getBlogCategoryBySlug(slug: string): BlogCategoryMeta | undefined {
  return BLOG_CATEGORY_ITEMS.find((item) => item.slug === slug.toLowerCase());
}

export function getBlogCategoryMeta(category: BlogCategory): BlogCategoryMeta {
  return (
    BLOG_CATEGORY_ITEMS.find((item) => item.category === category) ?? BLOG_CATEGORY_ITEMS[0]
  );
}

export function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export type CatalogPageScope =
  | { kind: 'courses' }
  | { kind: 'digital-hub' }
  | { kind: 'digital-sub'; subType: DigitalResourceSubType }
  | { kind: 'software' };

export function filterProductsForCatalogPage(
  products: Product[],
  scope: CatalogPageScope,
  filters: Omit<ProductFilterState, 'type'>
): Product[] {
  const baseFiltered = filterAndSortProducts(
    products,
    {
      ...filters,
      type:
        scope.kind === 'courses'
          ? 'course'
          : scope.kind === 'software'
          ? 'software'
          : 'ebook',
    },
    false
  );

  if (scope.kind === 'digital-sub') {
    return baseFiltered.filter((p) => getDigitalSubType(p) === scope.subType);
  }
  return baseFiltered;
}

export function filterAndSortBlogPosts(
  posts: BlogPost[],
  options: {
    category?: BlogCategory | 'all';
    search?: string;
    includeDrafts?: boolean;
  } = {}
): BlogPost[] {
  const { category = 'all', search = '', includeDrafts = false } = options;
  const q = search.trim().toLowerCase();

  return posts
    .filter((post) => {
      if (!includeDrafts && post.status !== 'published') return false;
      if (category !== 'all' && post.category !== category) return false;
      if (q) {
        const haystack = [
          post.title,
          post.subtitle,
          post.excerpt,
          post.category,
          post.authorName,
          post.tags.join(' '),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

export function getMatchedProductsForBlog(
  post: BlogPost,
  products: Product[],
  maxCount: number = 4
): Product[] {
  const published = products.filter((p) => p.status === 'published');
  const explicit = post.relatedProductIds
    .map((id) => published.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const explicitIds = new Set(explicit.map((p) => p.id));

  const categoryMatches = published.filter(
    (p) => !explicitIds.has(p.id) && p.category.toLowerCase() === post.category.toLowerCase()
  );

  const tagSet = new Set(post.tags.map((t) => t.toLowerCase()));
  const secondaryMatches = published.filter((p) => {
    if (explicitIds.has(p.id) || categoryMatches.some((c) => c.id === p.id)) return false;
    const text = `${p.title} ${p.subtitle} ${p.category}`.toLowerCase();
    return Array.from(tagSet).some((tag) => text.includes(tag));
  });

  return [...explicit, ...categoryMatches, ...secondaryMatches].slice(0, maxCount);
}

export function getRelatedBlogPosts(
  currentPost: BlogPost,
  allPosts: BlogPost[],
  maxCount: number = 3
): BlogPost[] {
  const publishedOthers = allPosts.filter(
    (p) => p.status === 'published' && p.id !== currentPost.id
  );
  const sameCategory = publishedOthers.filter((p) => p.category === currentPost.category);
  const differentCategory = publishedOthers.filter((p) => p.category !== currentPost.category);
  return [...sameCategory, ...differentCategory].slice(0, maxCount);
}

export function getBlogPostsForProduct(
  product: Product,
  allPosts: BlogPost[],
  maxCount: number = 3
): BlogPost[] {
  const published = allPosts.filter((p) => p.status === 'published');
  const direct = published.filter((post) => post.relatedProductIds.includes(product.id));
  const directIds = new Set(direct.map((p) => p.id));
  const byCategory = published.filter(
    (post) =>
      !directIds.has(post.id) &&
      post.category.toLowerCase() === product.category.toLowerCase()
  );
  return [...direct, ...byCategory].slice(0, maxCount);
}

export type ParsedAppRoute =
  | { page: 'home' }
  | { page: 'courses' }
  | { page: 'digital-hub' }
  | { page: 'digital-sub'; subType: DigitalResourceSubType; slug: string }
  | { page: 'software' }
  | { page: 'membership' }
  | { page: 'affiliates' }
  | { page: 'showcase' }
  | { page: 'events' }
  | { page: 'promoter' }
  | { page: 'verify-certificate'; certificateId?: string }
  | { page: 'blogs-hub' }
  | { page: 'blogs-category'; category: BlogCategory; slug: string }
  | { page: 'blog-detail'; slug: string }
  | { page: 'product'; slug: string }
  | { page: 'library' }
  | { page: 'instructor' }
  | { page: 'admin' }
  | { page: 'login' }
  | { page: 'admin-login' }
  | { page: 'learn'; productId: string }
  | { page: 'funnel'; slug: string }
  | { page: 'vault'; category?: string }
  | { page: 'tutorials-hub' }
  | { page: 'tutorial-detail'; slug: string }
  | {
      page: 'community';
      subView?: 'chat' | 'forums' | 'thread' | 'leaderboard';
      channelId?: string;
      threadId?: string;
    };

export function parseAppRoute(route: string): ParsedAppRoute {
  const cleanPath = route.split('?')[0].replace(/\/+$/, '') || '/';
  const queryPart = route.includes('?') ? route.split('?')[1] : '';
  const searchParams = new URLSearchParams(queryPart);

  if (cleanPath === '/community' || cleanPath.startsWith('/community/')) {
    const tabParam = searchParams.get('tab') as 'chat' | 'forums' | null;
    const channelParam = searchParams.get('channel') || undefined;
    const threadParam = searchParams.get('thread') || undefined;

    if (cleanPath.startsWith('/community/threads/')) {
      return {
        page: 'community',
        subView: 'thread',
        threadId: cleanPath.replace('/community/threads/', ''),
      };
    }
    if (cleanPath.startsWith('/community/thread/')) {
      return {
        page: 'community',
        subView: 'thread',
        threadId: cleanPath.replace('/community/thread/', ''),
      };
    }
    if (cleanPath.startsWith('/community/channels/')) {
      return {
        page: 'community',
        subView: 'chat',
        channelId: cleanPath.replace('/community/channels/', ''),
      };
    }
    if (cleanPath === '/community/forums' || cleanPath === '/community/forum') {
      return { page: 'community', subView: 'forums' };
    }
    if (cleanPath === '/community/leaderboard') {
      return { page: 'community', subView: 'leaderboard' };
    }
    if (cleanPath === '/community/chat') {
      return { page: 'community', subView: 'chat' };
    }

    return {
      page: 'community',
      subView: tabParam ?? (threadParam ? 'thread' : channelParam ? 'chat' : undefined),
      channelId: channelParam,
      threadId: threadParam,
    };
  }

  if (cleanPath === '/login') return { page: 'login' };
  if (cleanPath === '/admin-login') return { page: 'admin-login' };
  if (cleanPath === '/admin' || cleanPath.startsWith('/admin/')) return { page: 'admin' };
  if (cleanPath === '/vault' || cleanPath.startsWith('/vault/')) {
    const categoryParam = searchParams.get('category') || undefined;
    return categoryParam ? { page: 'vault', category: categoryParam } : { page: 'vault' };
  }
  if (cleanPath === '/tutorials') return { page: 'tutorials-hub' };
  if (cleanPath.startsWith('/tutorials/')) {
    const slug = cleanPath.replace('/tutorials/', '').trim();
    return slug ? { page: 'tutorial-detail', slug } : { page: 'tutorials-hub' };
  }
  if (cleanPath.startsWith('/tutorial/')) {
    const slug = cleanPath.replace('/tutorial/', '').trim();
    return slug ? { page: 'tutorial-detail', slug } : { page: 'tutorials-hub' };
  }
  if (cleanPath.startsWith('/funnel/')) {
    const slug = cleanPath.replace('/funnel/', '').trim();
    return { page: 'funnel', slug: slug || 'ai-saas-accelerator' };
  }
  if (cleanPath === '/funnel') return { page: 'funnel', slug: 'ai-saas-accelerator' };
  if (cleanPath === '/library') return { page: 'library' };
  if (cleanPath === '/instructor') return { page: 'instructor' };
  if (cleanPath === '/membership') return { page: 'membership' };
  if (cleanPath === '/affiliates') return { page: 'affiliates' };
  if (cleanPath === '/showcase') return { page: 'showcase' };
  if (cleanPath === '/events') return { page: 'events' };
  if (
    cleanPath === '/promoter' ||
    cleanPath === '/facilitator' ||
    cleanPath === '/speaker' ||
    cleanPath.startsWith('/promoter/') ||
    cleanPath.startsWith('/facilitator/') ||
    cleanPath.startsWith('/speaker/')
  ) {
    return { page: 'promoter' };
  }
  if (cleanPath === '/verify-certificate' || cleanPath.startsWith('/verify-certificate/')) {
    const certParam =
      searchParams.get('id') ||
      searchParams.get('cert') ||
      cleanPath.replace(/^\/verify-certificate\/?/, '') ||
      undefined;
    return { page: 'verify-certificate', certificateId: certParam || undefined };
  }
  if (cleanPath.startsWith('/learn/')) {
    return { page: 'learn', productId: cleanPath.replace('/learn/', '') };
  }
  if (cleanPath.startsWith('/product/')) {
    return { page: 'product', slug: cleanPath.replace('/product/', '') };
  }
  if (cleanPath === '/courses') return { page: 'courses' };
  if (cleanPath === '/software') return { page: 'software' };
  if (cleanPath === '/digital-products') return { page: 'digital-hub' };
  if (cleanPath.startsWith('/digital-products/')) {
    const subSlug = cleanPath.replace('/digital-products/', '');
    const meta = getDigitalSubmenuBySlug(subSlug);
    if (meta) {
      return { page: 'digital-sub', subType: meta.subType, slug: meta.slug };
    }
    return { page: 'digital-hub' };
  }
  if (cleanPath === '/blogs') return { page: 'blogs-hub' };
  if (cleanPath.startsWith('/blogs/category/')) {
    const catSlug = cleanPath.replace('/blogs/category/', '');
    const meta = getBlogCategoryBySlug(catSlug);
    if (meta) {
      return { page: 'blogs-category', category: meta.category, slug: meta.slug };
    }
    return { page: 'blogs-hub' };
  }
  if (cleanPath.startsWith('/blog/')) {
    return { page: 'blog-detail', slug: cleanPath.replace('/blog/', '') };
  }

  return { page: 'home' };
}
