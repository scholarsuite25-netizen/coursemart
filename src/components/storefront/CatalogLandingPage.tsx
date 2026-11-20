import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Code2,
  PlayCircle,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type {
  DifficultyLevel,
  DigitalResourceSubType,
  ProductFilterState,
} from '../../types/marketplace';
import {
  BLOG_CATEGORY_ITEMS,
  DIGITAL_SUBMENU_ITEMS,
  filterAndSortBlogPosts,
  filterProductsForCatalogPage,
  getDigitalSubmenuByType,
  type CatalogPageScope,
} from '../../utils/catalogAndBlogs';
import { ProductThumbnail } from '../common/ProductThumbnail';
import { ProductCard } from './ProductCard';

interface CatalogLandingPageProps {
  scope: CatalogPageScope;
}

export function CatalogLandingPage({ scope }: CatalogLandingPageProps) {
  const { products, blogPosts, navigate } = useStore();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [priceFilter, setPriceFilter] = useState<ProductFilterState['priceFilter']>('all');
  const [levelFilter, setLevelFilter] = useState<DifficultyLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<ProductFilterState['sortBy']>('popular');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const pageMeta = useMemo(() => {
    if (scope.kind === 'courses') {
      return {
        eyebrow: 'Video Learning Management System',
        title: 'Video Training Courses',
        description:
          'Structured multi-module video courses covering AI, Vibe Coding, Apps Deployment, Leadership, Mentorship, and Full-Stack Architecture.',
        breadcrumb: [{ label: 'Home', route: '/' }, { label: 'Courses' }],
      };
    }
    if (scope.kind === 'software') {
      return {
        eyebrow: 'Commercial Tools & Provisioned Keys',
        title: 'Software & Licensed Kits',
        description:
          'Production UI starter kits, CLI deployment inspectors, and developer tools with instant license key generation and domain seat activation.',
        breadcrumb: [{ label: 'Home', route: '/' }, { label: 'Software' }],
      };
    }
    if (scope.kind === 'digital-sub') {
      const subMeta = getDigitalSubmenuByType(scope.subType);
      return {
        eyebrow: 'Digital Products Resource',
        title: subMeta.headline,
        description: subMeta.description,
        breadcrumb: [
          { label: 'Home', route: '/' },
          { label: 'Digital Products', route: '/digital-products' },
          { label: subMeta.label },
        ],
      };
    }
    return {
      eyebrow: 'Instant Digital Downloads',
      title: 'Digital Products Hub',
      description:
        'Explore DRM-free eBooks, production Templates, and Apps Deployment & Leadership Toolkits.',
      breadcrumb: [{ label: 'Home', route: '/' }, { label: 'Digital Products' }],
    };
  }, [scope]);

  // All products available in the base scope (ignoring sidebar category filter so topic chips stay rich)
  const scopedBaseProducts = useMemo(
    () =>
      filterProductsForCatalogPage(products, scope, {
        category: 'All',
        minRating: 0,
        priceFilter: 'all',
        level: 'all',
        search: '',
        sortBy: 'popular',
      }),
    [products, scope]
  );

  const availableCategories = useMemo(() => {
    const set = new Set(scopedBaseProducts.map((p) => p.category));
    return ['All', ...Array.from(set)];
  }, [scopedBaseProducts]);

  const filteredProducts = useMemo(
    () =>
      filterProductsForCatalogPage(products, scope, {
        category: categoryFilter,
        minRating,
        priceFilter,
        level: levelFilter,
        search: searchQuery,
        sortBy,
      }),
    [products, scope, categoryFilter, minRating, priceFilter, levelFilter, searchQuery, sortBy]
  );

  const relatedBlogs = useMemo(() => {
    const published = filterAndSortBlogPosts(blogPosts);
    if (categoryFilter !== 'All') {
      const matching = published.filter(
        (b) => b.category.toLowerCase() === categoryFilter.toLowerCase()
      );
      if (matching.length > 0) return matching.slice(0, 3);
    }
    const scopedIds = new Set(scopedBaseProducts.map((p) => p.id));
    const linked = published.filter((b) =>
      b.relatedProductIds.some((id) => scopedIds.has(id))
    );
    return (linked.length > 0 ? linked : published).slice(0, 3);
  }, [blogPosts, categoryFilter, scopedBaseProducts]);

  const resetFilters = () => {
    setCategoryFilter('All');
    setSearchQuery('');
    setMinRating(0);
    setPriceFilter('all');
    setLevelFilter('all');
    setSortBy('popular');
  };

  const hasActiveFilters =
    categoryFilter !== 'All' ||
    searchQuery.trim() !== '' ||
    minRating > 0 ||
    priceFilter !== 'all' ||
    levelFilter !== 'all';

  const isDigitalPage = scope.kind === 'digital-hub' || scope.kind === 'digital-sub';

  return (
    <main className="pb-16">
      {/* Navy Blue & Gold Dedicated Page Header */}
      <section className="bg-[#0a192f] text-white border-b-2 border-[#d4af37]">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-10 lg:py-12 space-y-6">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300"
          >
            {pageMeta.breadcrumb.map((crumb, idx) => (
              <span key={crumb.label} className="inline-flex items-center gap-2">
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#d4af37]" />}
                {crumb.route ? (
                  <button
                    type="button"
                    onClick={() => navigate(crumb.route!)}
                    className="hover:text-[#f5c451] transition-colors cursor-pointer"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-[#f5c451]">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#f5c451]">
                {pageMeta.eyebrow}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white text-balance">
                {pageMeta.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {pageMeta.description}
              </p>
            </div>

            <div className="w-full lg:w-80 relative shrink-0">
              <Search className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filter ${pageMeta.title.toLowerCase()}...`}
                aria-label={`Search within ${pageMeta.title}`}
                className="w-full h-11 pl-10 pr-4 text-sm bg-[#112240] border border-[#2a436e] rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Digital Products Submenu Switcher Tabs (All, eBooks, Templates, Toolkits) */}
          {isDigitalPage && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/digital-products')}
                className={`px-4 py-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  scope.kind === 'digital-hub'
                    ? 'bg-[#d4af37] text-[#0a192f]'
                    : 'bg-[#112240] text-slate-200 border border-[#2a436e] hover:border-[#d4af37]'
                }`}
              >
                All Digital Products
              </button>
              {DIGITAL_SUBMENU_ITEMS.map((sub) => {
                const isActive =
                  scope.kind === 'digital-sub' && scope.subType === sub.subType;
                return (
                  <button
                    key={sub.subType}
                    type="button"
                    onClick={() => navigate(sub.route)}
                    className={`px-4 py-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#d4af37] text-[#0a192f]'
                        : 'bg-[#112240] text-slate-200 border border-[#2a436e] hover:border-[#d4af37]'
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Cross-Format Quick Links for Courses & Software pages */}
          {!isDigitalPage && (
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-slate-300">
              <button
                type="button"
                onClick={() => navigate('/courses')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer ${
                  scope.kind === 'courses'
                    ? 'bg-[#d4af37] text-[#0a192f] font-bold'
                    : 'bg-[#112240] hover:text-[#f5c451]'
                }`}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Courses</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/digital-products')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#112240] hover:text-[#f5c451] cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Digital Products (eBooks, Templates, Prompts, Toolkits)</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/software')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer ${
                  scope.kind === 'software'
                    ? 'bg-[#d4af37] text-[#0a192f] font-bold'
                    : 'bg-[#112240] hover:text-[#f5c451]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Software</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Catalog Toolbar + Filter Grid */}
      <section className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-8">
        {/* Topic Filter Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-1.5">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#0a192f] text-[#f5c451]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-md text-slate-800 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{mobileFiltersOpen ? 'Hide Filters' : 'Filters'}</span>
            </button>

            <span className="text-xs font-medium text-slate-600 tabular-nums">
              <strong className="text-slate-900">{filteredProducts.length}</strong> items
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#5624d0] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            <select
              aria-label="Sort results"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ProductFilterState['sortBy'])}
              className="h-9 px-3 text-xs font-semibold bg-white border border-slate-300 rounded-md text-slate-900"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest Releases</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Sidebar Facet Filters */}
          <aside
            className={`lg:col-span-3 space-y-6 ${
              mobileFiltersOpen ? 'block' : 'hidden lg:block'
            }`}
            aria-label="Resource filters"
          >
            <div className="border-b border-slate-200 pb-5">
              <h2 className="font-display text-sm font-bold text-slate-900 mb-3">
                Minimum Rating
              </h2>
              <div className="space-y-1.5">
                {[
                  { label: 'All Ratings', value: 0 },
                  { label: '4.5 & up', value: 4.5 },
                  { label: '4.8 & up', value: 4.8 },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="page-rating"
                      checked={minRating === opt.value}
                      onChange={() => setMinRating(opt.value)}
                      className="accent-[#0a192f]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-b border-slate-200 pb-5">
              <h2 className="font-display text-sm font-bold text-slate-900 mb-3">Price Range</h2>
              <div className="space-y-1.5">
                {[
                  { label: 'Any Price', value: 'all' },
                  { label: 'Under ₦30,000', value: 'under-30000' },
                  { label: '₦30,000 to ₦60,000', value: '30000-60000' },
                  { label: 'Over ₦60,000', value: 'over-60000' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="page-price"
                      checked={priceFilter === opt.value}
                      onChange={() =>
                        setPriceFilter(opt.value as ProductFilterState['priceFilter'])
                      }
                      className="accent-[#0a192f]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 mb-3">
                Difficulty / Scope
              </h2>
              <div className="space-y-1.5">
                {(
                  ['all', 'All Levels', 'Beginner', 'Intermediate', 'Advanced'] as Array<
                    DifficultyLevel | 'all'
                  >
                ).map((lvl) => (
                  <label
                    key={lvl}
                    className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="page-level"
                      checked={levelFilter === lvl}
                      onChange={() => setLevelFilter(lvl)}
                      className="accent-[#0a192f]"
                    />
                    <span>{lvl === 'all' ? 'All Levels & Scopes' : lvl}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="border border-slate-200 rounded-xl p-12 text-center bg-slate-50">
                <p className="font-display text-lg font-bold text-slate-900">
                  No matching items in this section
                </p>
                <p className="text-sm text-slate-600 mt-1.5">
                  Reset filters or explore sibling resources across Digital Products and Courses.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 px-5 py-2.5 text-xs font-bold text-[#0a192f] bg-[#d4af37] rounded-md cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Editorial Blogs Strip */}
      {relatedBlogs.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-14 mt-10 border-t border-slate-200">
          <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
                From the Engineering & Leadership Blog
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Deep-dive articles across {BLOG_CATEGORY_ITEMS.map((c) => c.category).join(', ')}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/blogs')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0a192f] hover:text-[#5624d0] cursor-pointer"
            >
              <span>Explore All Blogs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedBlogs.map((post) => (
              <article
                key={post.id}
                className="border border-slate-200 rounded-lg bg-white overflow-hidden flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="aspect-[4/3] w-full overflow-hidden bg-slate-100 cursor-pointer"
                >
                  <ProductThumbnail
                    src={post.coverImage}
                    alt={post.title}
                    type="ebook"
                    className="w-full h-full hover:scale-[1.02] transition-transform duration-300"
                  />
                </button>
                <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      {post.category} · {post.readTimeMinutes} min read
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/blog/${post.slug}`)}
                      className="text-left block w-full mt-1.5 cursor-pointer"
                    >
                      <h3 className="font-display text-base font-bold text-slate-900 leading-snug hover:text-[#5624d0]">
                        {post.title}
                      </h3>
                    </button>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{post.excerpt}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/blog/${post.slug}`)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0a192f] hover:text-[#5624d0] cursor-pointer self-start"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
