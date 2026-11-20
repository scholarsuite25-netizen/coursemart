import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  ChevronRight,
  MessageSquare,
  Search,
  ShoppingCart,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { BlogCategory } from '../../types/marketplace';
import {
  BLOG_CATEGORY_ITEMS,
  filterAndSortBlogPosts,
  getBlogCategoryMeta,
} from '../../utils/catalogAndBlogs';
import { formatNaira } from '../../utils/currency';
import { formatProductTypeLabel } from '../../utils/theme';
import { ProductThumbnail } from '../common/ProductThumbnail';
import { ShareButton } from '../common/ShareButton';

interface BlogsPageProps {
  activeCategory?: BlogCategory;
}

export function BlogsPage({ activeCategory }: BlogsPageProps) {
  const {
    blogPosts,
    products,
    bookmarkedBlogIds,
    toggleBlogBookmark,
    addToCart,
    navigate,
  } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const categoryMeta = activeCategory ? getBlogCategoryMeta(activeCategory) : null;

  const filteredPosts = useMemo(
    () =>
      filterAndSortBlogPosts(blogPosts, {
        category: activeCategory ?? 'all',
        search: searchQuery,
      }),
    [blogPosts, activeCategory, searchQuery]
  );

  const leadPost = filteredPosts[0] ?? null;
  const secondaryPosts = filteredPosts.slice(1);

  const matchedProducts = useMemo(() => {
    const published = products.filter((p) => p.status === 'published');
    if (activeCategory) {
      const exact = published.filter(
        (p) => p.category.toLowerCase() === activeCategory.toLowerCase()
      );
      if (exact.length > 0) return exact.slice(0, 4);
    }
    const topicSet = new Set(BLOG_CATEGORY_ITEMS.map((c) => c.category.toLowerCase()));
    return published.filter((p) => topicSet.has(p.category.toLowerCase())).slice(0, 4);
  }, [products, activeCategory]);

  return (
    <main className="pb-16 bg-white">
      {/* Navy Blue & Gold Editorial Masthead */}
      <section className="bg-[#0a192f] text-white border-b-2 border-[#d4af37]">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-10 lg:py-12 space-y-6">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs font-semibold text-slate-300"
          >
            <button
              type="button"
              onClick={() => navigate('/')}
              className="hover:text-[#f5c451] cursor-pointer"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#d4af37]" />
            <button
              type="button"
              onClick={() => navigate('/blogs')}
              className={`cursor-pointer ${
                !activeCategory ? 'text-[#f5c451]' : 'hover:text-[#f5c451]'
              }`}
            >
              Blogs
            </button>
            {activeCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="text-[#f5c451]">{activeCategory}</span>
              </>
            )}
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#f5c451]">
                Editorial Publication · Insights for Builders & Leaders
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white text-balance">
                {activeCategory ? `${activeCategory} Journal` : 'Coursemart Editorial Blogs'}
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {categoryMeta
                  ? categoryMeta.description
                  : 'Deep architectural essays, hands-on playbooks, and deployment guides across AI, Mentorship, Leadership, Vibe Coding, and Apps Deployment.'}
              </p>
            </div>

            <div className="w-full lg:w-80 relative shrink-0">
              <Search className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, topics, or authors..."
                aria-label="Search blog articles"
                className="w-full h-11 pl-10 pr-4 text-sm bg-[#112240] border border-[#2a436e] rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Dedicated Category Page Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/blogs')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                !activeCategory
                  ? 'bg-[#d4af37] text-[#0a192f]'
                  : 'bg-[#112240] text-slate-200 border border-[#2a436e] hover:border-[#d4af37]'
              }`}
            >
              All Categories
            </button>
            {BLOG_CATEGORY_ITEMS.map((cat) => (
              <button
                key={cat.category}
                type="button"
                onClick={() => navigate(cat.route)}
                className={`px-4 py-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeCategory === cat.category
                    ? 'bg-[#d4af37] text-[#0a192f]'
                    : 'bg-[#112240] text-slate-200 border border-[#2a436e] hover:border-[#d4af37]'
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-10 space-y-12">
        {/* Empty State */}
        {filteredPosts.length === 0 ? (
          <div className="border border-slate-200 rounded-xl p-12 text-center bg-slate-50">
            <h2 className="font-display text-lg font-bold text-slate-900">
              No articles match your filter
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Clear your search term or browse all five editorial topics.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                navigate('/blogs');
              }}
              className="mt-5 px-5 py-2.5 text-xs font-bold text-[#0a192f] bg-[#d4af37] rounded-md cursor-pointer"
            >
              View All Articles
            </button>
          </div>
        ) : (
          <>
            {/* Tier 1: Lead Featured Story */}
            {leadPost && (
              <section
                aria-label="Featured article"
                className="grid grid-cols-1 lg:grid-cols-12 border border-slate-200 rounded-xl overflow-hidden bg-white items-stretch"
              >
                <div className="lg:col-span-6 bg-slate-100">
                  <button
                    type="button"
                    onClick={() => navigate(`/blog/${leadPost.slug}`)}
                    className="w-full h-full block cursor-pointer"
                  >
                    <ProductThumbnail
                      src={leadPost.coverImage}
                      alt={leadPost.title}
                      type="ebook"
                      className="w-full h-full min-h-[260px] lg:min-h-[360px]"
                    />
                  </button>
                </div>

                <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                      <span className="font-bold text-[#0a192f]">{leadPost.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{leadPost.publishedAt.slice(0, 10)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{leadPost.readTimeMinutes} min read</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/blog/${leadPost.slug}`)}
                      className="text-left block cursor-pointer"
                    >
                      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight hover:text-[#5624d0] transition-colors text-balance">
                        {leadPost.title}
                      </h2>
                    </button>

                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      {leadPost.excerpt}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={leadPost.authorAvatar}
                        alt={leadPost.authorName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-slate-900">{leadPost.authorName}</p>
                        <p className="text-slate-500">{leadPost.authorRole}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleBlogBookmark(leadPost.id)}
                        aria-label={
                          bookmarkedBlogIds.includes(leadPost.id)
                            ? `Remove bookmark for ${leadPost.title}`
                            : `Bookmark ${leadPost.title}`
                        }
                        className={`p-2 rounded-md border transition-colors cursor-pointer ${
                          bookmarkedBlogIds.includes(leadPost.id)
                            ? 'border-[#d4af37] bg-amber-50 text-[#0a192f]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Bookmark
                          className={`w-4 h-4 ${
                            bookmarkedBlogIds.includes(leadPost.id) ? 'fill-[#d4af37]' : ''
                          }`}
                        />
                      </button>

                      <ShareButton
                        title={leadPost.title}
                        url={
                          typeof window !== 'undefined'
                            ? `${window.location.origin}/blog/${leadPost.slug}`
                            : undefined
                        }
                      />

                      <button
                        type="button"
                        onClick={() => navigate(`/blog/${leadPost.slug}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md transition-colors cursor-pointer"
                      >
                        <span>Read Article</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Tier 2: Editorial Article Grid */}
            {secondaryPosts.length > 0 && (
              <section aria-label="Latest articles">
                <div className="flex items-baseline justify-between mb-6">
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
                    {activeCategory ? `More in ${activeCategory}` : 'Recent Essays & Guides'}
                  </h2>
                  <span className="text-xs font-medium text-slate-500 tabular-nums">
                    {filteredPosts.length} published articles
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {secondaryPosts.map((post) => {
                    const isSaved = bookmarkedBlogIds.includes(post.id);
                    return (
                      <article
                        key={post.id}
                        className="border border-slate-200 rounded-lg bg-white overflow-hidden flex flex-col hover:shadow-md transition-shadow"
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

                        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(getBlogCategoryMeta(post.category).route)
                                }
                                className="font-bold text-[#0a192f] hover:underline cursor-pointer"
                              >
                                {post.category}
                              </button>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">{post.publishedAt.slice(0, 10)}</span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">{post.readTimeMinutes} min read</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => navigate(`/blog/${post.slug}`)}
                              className="text-left block w-full cursor-pointer"
                            >
                              <h3 className="font-display text-lg font-bold text-slate-900 leading-snug hover:text-[#5624d0] transition-colors">
                                {post.title}
                              </h3>
                            </button>

                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                              {post.excerpt}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-600 truncate">
                              {post.authorName}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="inline-flex items-center gap-1 text-xs text-slate-400 tabular-nums">
                                <MessageSquare className="w-3.5 h-3.5" />
                                {post.comments.length}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleBlogBookmark(post.id)}
                                aria-label={
                                  isSaved
                                    ? `Remove bookmark for ${post.title}`
                                    : `Bookmark ${post.title}`
                                }
                                className={`p-1.5 rounded border cursor-pointer ${
                                  isSaved
                                    ? 'border-[#d4af37] bg-amber-50 text-[#0a192f]'
                                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                <Bookmark
                                  className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#d4af37]' : ''}`}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/blog/${post.slug}`)}
                                className="text-xs font-bold text-[#0a192f] hover:text-[#5624d0] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>Read</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* Topic-Aligned Courses & Digital Products Showcase */}
        {matchedProducts.length > 0 && (
          <section className="border-t border-slate-200 pt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
                  {activeCategory
                    ? `Recommended Courses & Digital Products for ${activeCategory}`
                    : 'Courses & Digital Products Across Every Blog Topic'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Go deeper with structured video courses, eBooks, templates, and toolkits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/digital-products')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0a192f] hover:text-[#5624d0] cursor-pointer"
              >
                <span>Browse Digital Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {matchedProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="border border-slate-200 rounded-lg bg-white p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">
                      {formatProductTypeLabel(prod.type, prod.digitalSubType)} · {prod.category}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/product/${prod.slug}`)}
                      className="text-left block w-full mt-1 cursor-pointer"
                    >
                      <h3 className="font-display text-sm font-bold text-slate-900 line-clamp-2 hover:text-[#5624d0]">
                        {prod.title}
                      </h3>
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                      {formatNaira(prod.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCart(prod)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md cursor-pointer"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
