import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronRight,
  MessageCircle,
  MessageSquare,
  Phone,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  getBlogCategoryMeta,
  getMatchedProductsForBlog,
  getRelatedBlogPosts,
} from '../../utils/catalogAndBlogs';
import { formatNaira } from '../../utils/currency';
import { formatProductTypeLabel } from '../../utils/theme';
import {
  TINTOL_PAYMENT_DETAILS,
  buildCallUrl,
  buildWhatsAppUrl,
} from '../../utils/whatsapp';
import { ProductThumbnail } from '../common/ProductThumbnail';
import { ShareButton } from '../common/ShareButton';
import { SeoHead } from '../common/SeoHead';
import { DEFAULT_SITE_URL } from '../../utils/seoHead';
import {
  buildArticleSchema,
  buildBreadcrumbListSchema,
  resolveImageUrl,
} from '../../utils/seoSchema';

interface BlogPostPageProps {
  slug: string;
}

function FormattedInlineBody({ text }: { text: string }) {
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
  const parts = text.split(tokenRegex);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={idx} className="font-bold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <em key={idx} className="italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[0.88em] text-[#0a192f]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        const linkMatch = /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/.exec(part);
        if (linkMatch) {
          return (
            <a
              key={idx}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0a192f] font-semibold underline decoration-[#d4af37] underline-offset-2 hover:text-[#5624d0]"
            >
              {linkMatch[1]}
            </a>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}

export function BlogPostPage({ slug }: BlogPostPageProps) {
  const {
    blogPosts,
    products,
    currentUser,
    bookmarkedBlogIds,
    toggleBlogBookmark,
    addBlogComment,
    deleteBlogComment,
    addToCart,
    cart,
    isOwnedByCurrentUser,
    navigate,
    quickLoginAsRole,
  } = useStore();

  const post = blogPosts.find((p) => p.slug === slug);
  const [readProgress, setReadProgress] = useState(0);
  const [commentBody, setCommentBody] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) {
        setReadProgress(0);
        return;
      }
      const pct = Math.min(100, Math.max(0, Math.round((window.scrollY / docHeight) * 100)));
      setReadProgress(pct);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [slug]);

  const matchedProducts = useMemo(
    () => (post ? getMatchedProductsForBlog(post, products, 4) : []),
    [post, products]
  );

  const relatedPosts = useMemo(
    () => (post ? getRelatedBlogPosts(post, blogPosts, 3) : []),
    [post, blogPosts]
  );

  if (!post) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">Article not found</h1>
        <p className="text-sm text-slate-600">
          This article may have been moved back to drafts or renamed.
        </p>
        <button
          type="button"
          onClick={() => navigate('/blogs')}
          className="px-5 py-2.5 text-xs font-bold text-[#0a192f] bg-[#d4af37] rounded-md cursor-pointer"
        >
          Return to Blogs
        </button>
      </main>
    );
  }

  const isSaved = bookmarkedBlogIds.includes(post.id);
  const catMeta = getBlogCategoryMeta(post.category);
  const canModerate =
    currentUser?.role === 'admin' || currentUser?.role === 'instructor';

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    const res = addBlogComment(post.id, commentBody);
    if (!res.ok) {
      setCommentError(res.error ?? 'Unable to publish comment.');
      return;
    }
    setCommentBody('');
  };

  return (
    <main className="pb-20 bg-white">
      {/* SEO: canonical, OpenGraph, Twitter and Article + breadcrumb JSON-LD */}
      <SeoHead
        title={post.seoTitle || post.title}
        description={post.seoDescription || post.excerpt || post.subtitle}
        canonical={`${DEFAULT_SITE_URL}/blog/${post.slug}`}
        ogType="article"
        ogImage={resolveImageUrl(post.coverImage, DEFAULT_SITE_URL)}
        ogUrl={`${DEFAULT_SITE_URL}/blog/${post.slug}`}
        jsonLd={[
          buildArticleSchema(post),
          buildBreadcrumbListSchema([
            { name: 'Home', url: '/' },
            { name: 'Blogs', url: '/blogs' },
            { name: post.title, url: `/blog/${post.slug}` },
          ]),
        ]}
      />
      {/* Top Scroll Reading Depth Indicator */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-slate-200/70 z-30 pointer-events-none">
        <div
          className="h-full bg-[#d4af37] transition-[width] duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Editorial Navy Blue & Gold Header */}
      <header className="bg-[#0a192f] text-white border-b-2 border-[#d4af37]">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10 lg:py-12 space-y-5">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300"
          >
            <button
              type="button"
              onClick={() => navigate('/blogs')}
              className="inline-flex items-center gap-1 hover:text-[#f5c451] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Blogs</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#d4af37]" />
            <button
              type="button"
              onClick={() => navigate(catMeta.route)}
              className="text-[#f5c451] hover:underline cursor-pointer"
            >
              {post.category}
            </button>
          </nav>

          <div className="max-w-4xl space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-medium">
              <span className="font-bold text-[#f5c451]">{post.category}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Published {post.publishedAt.slice(0, 10)}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{post.readTimeMinutes} min read</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold text-white leading-tight text-balance">
              {post.title}
            </h1>
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-3xl">
              {post.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <img
                src={post.authorAvatar}
                alt={post.authorName}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover border border-[#d4af37]/60"
              />
              <div>
                <p className="text-sm font-bold text-white">{post.authorName}</p>
                <p className="text-xs text-slate-300">{post.authorRole}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => toggleBlogBookmark(post.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-md border transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-[#d4af37] text-[#0a192f] border-[#d4af37]'
                    : 'bg-[#112240] text-white border-[#2a436e] hover:border-[#d4af37]'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#0a192f]' : ''}`} />
                <span>{isSaved ? 'Saved in Library' : 'Save Article'}</span>
              </button>

              <ShareButton
                title={post.title}
                url={
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/blog/${post.slug}`
                    : undefined
                }
                variant="navbar"
                label="Share"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Asymmetric 70/30 Editorial Reading Layout */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Main Reading Column (8 cols) */}
        <article className="lg:col-span-8 space-y-8">
          <figure className="space-y-2">
            <div className="aspect-[4/3] max-h-[440px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <ProductThumbnail
                src={post.coverImage}
                alt={post.title}
                type="ebook"
                className="w-full h-full"
              />
            </div>
            <figcaption className="text-xs text-slate-500">
              Fig. 1 — {post.category} briefing · {post.tags.join(' / ')}
            </figcaption>
          </figure>

          <div className="max-w-prose space-y-8">
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium first-letter:text-5xl first-letter:font-display first-letter:font-extrabold first-letter:text-[#0a192f] first-letter:float-left first-letter:mr-3 first-letter:mt-1">
              {post.excerpt}
            </p>

            {post.sections.map((section) => {
              const calloutStyle =
                section.calloutTone === 'warning'
                  ? 'bg-amber-50 border-amber-400 text-amber-950'
                  : section.calloutTone === 'info'
                  ? 'bg-slate-50 border-[#0a192f] text-slate-900'
                  : 'bg-emerald-50 border-emerald-500 text-emerald-950';

              const imageFigureClass =
                section.imageAlign === 'left'
                  ? 'sm:float-left sm:w-64 sm:mr-5 mb-3'
                  : section.imageAlign === 'right'
                  ? 'sm:float-right sm:w-64 sm:ml-5 mb-3'
                  : section.imageAlign === 'wide'
                  ? 'my-5'
                  : 'my-5 max-w-xl';

              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="space-y-4 scroll-mt-24 after:content-[''] after:block after:clear-both"
                >
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
                    {section.heading}
                  </h2>

                  {section.blockType === 'callout' && section.body ? (
                    <div className={`border-l-4 rounded-r-lg p-4 text-sm leading-relaxed ${calloutStyle}`}>
                      <FormattedInlineBody text={section.body} />
                    </div>
                  ) : (
                    section.body && (
                      <p className="text-base text-slate-700 leading-[1.78] whitespace-pre-line">
                        <FormattedInlineBody text={section.body} />
                      </p>
                    )
                  )}

                  {section.imageUrl && (
                    <figure className={`space-y-1.5 ${imageFigureClass}`}>
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        <img
                          src={section.imageUrl}
                          alt={section.imageAlt || section.heading}
                          referrerPolicy="no-referrer"
                          className="w-full max-h-[380px] object-cover"
                        />
                      </div>
                      {section.imageCaption && (
                        <figcaption className="text-xs text-slate-500">
                          {section.imageCaption}
                        </figcaption>
                      )}
                    </figure>
                  )}

                  {section.checklistItems && section.checklistItems.length > 0 && (
                    <ul className="border border-slate-200 rounded-lg bg-slate-50 p-4 space-y-2">
                      {section.checklistItems.map((item, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-2.5 text-sm text-slate-800">
                          <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.pullQuote && (
                    <blockquote className="py-5 my-4 border-y border-slate-200 text-lg sm:text-xl font-display font-bold text-[#0a192f] leading-snug">
                      “{section.pullQuote}”
                    </blockquote>
                  )}

                  {section.codeSnippet && (
                    <pre className="p-4 rounded-lg bg-[#0a192f] text-slate-100 font-mono text-xs overflow-x-auto border border-[#1e3557]">
                      <code>{section.codeSnippet}</code>
                    </pre>
                  )}
                </section>
              );
            })}
          </div>

          {/* Inline Mobile/Tablet Related Products Callout */}
          {matchedProducts.length > 0 && (
            <section className="lg:hidden border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4">
              <h2 className="font-display text-base font-bold text-slate-900">
                Courses & Digital Products for This Topic
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matchedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <p className="text-[11px] font-bold text-slate-500">
                        {formatProductTypeLabel(prod.type, prod.digitalSubType)}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(`/product/${prod.slug}`)}
                        className="text-left font-display text-sm font-bold text-slate-900 mt-1 hover:text-[#5624d0] cursor-pointer"
                      >
                        {prod.title}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm tabular-nums">
                        {formatNaira(prod.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(prod)}
                        className="px-3 py-1.5 text-xs font-bold bg-[#d4af37] text-[#0a192f] rounded-md cursor-pointer"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reader Comments Section */}
          <section className="border-t border-slate-200 pt-8 space-y-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#0a192f]" />
                <span className="tabular-nums">Discussion ({post.comments.length})</span>
              </h2>
            </div>

            {currentUser ? (
              <form
                onSubmit={handleSubmitComment}
                className="border border-slate-200 rounded-lg p-5 bg-slate-50 space-y-3"
              >
                <label
                  htmlFor="blog-comment-input"
                  className="block text-xs font-bold text-slate-700"
                >
                  Comment as {currentUser.name}
                </label>
                <textarea
                  id="blog-comment-input"
                  rows={3}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Share your field notes, questions, or implementation experience..."
                  className="w-full p-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#0a192f]"
                />
                {commentError && (
                  <p className="text-xs font-semibold text-rose-700">{commentError}</p>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md cursor-pointer"
                >
                  Post Comment
                </button>
              </form>
            ) : (
              <div className="border border-slate-200 rounded-lg p-5 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-700">
                  Sign in to join the reader discussion and bookmark articles across sessions.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => quickLoginAsRole('customer')}
                    className="px-3.5 py-2 text-xs font-bold text-[#0a192f] bg-[#d4af37] rounded-md cursor-pointer"
                  >
                    Instant Student Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="px-3.5 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-md bg-white cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {post.comments.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No comments yet. Start the conversation above.
                </p>
              ) : (
                post.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border border-slate-200 rounded-lg p-4 bg-white space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs">
                        <span className="font-bold text-slate-900">{comment.userName}</span>
                        <span className="text-slate-400 mx-1.5">·</span>
                        <span className="capitalize text-slate-500">{comment.userRole}</span>
                        <span className="text-slate-400 mx-1.5">·</span>
                        <span className="text-slate-400 tabular-nums">
                          {comment.createdAt.slice(0, 10)}
                        </span>
                      </div>
                      {(canModerate || currentUser?.id === comment.userId) && (
                        <button
                          type="button"
                          onClick={() => deleteBlogComment(post.id, comment.id)}
                          aria-label={`Delete comment by ${comment.userName}`}
                          className="p-1 text-slate-400 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{comment.body}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </article>

        {/* Right Sticky Rail (4 cols): TOC + Matched Courses & Digital Products */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Table of Contents */}
            {post.sections.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-3">
                <p className="font-display text-xs font-bold uppercase tracking-wider text-slate-500">
                  In This Article
                </p>
                <ul className="space-y-2 text-xs font-medium text-slate-700">
                  {post.sections.map((sec) => (
                    <li key={sec.id}>
                      <a
                        href={`#${sec.id}`}
                        className="hover:text-[#0a192f] hover:underline block leading-snug"
                      >
                        {sec.heading}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Embedded Matching Courses & Digital Products */}
            {matchedProducts.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 shadow-sm">
                <div>
                  <p className="font-display text-xs font-bold uppercase tracking-wider text-[#0a192f]">
                    Matched Learning Resources
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Courses & digital products aligned with {post.category}.
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {matchedProducts.map((prod) => {
                    const inCart = cart.some((c) => c.productId === prod.id);
                    const owned = isOwnedByCurrentUser(prod.id);
                    return (
                      <div key={prod.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                        <p className="text-[11px] font-semibold text-slate-500">
                          {formatProductTypeLabel(prod.type, prod.digitalSubType)} ·{' '}
                          {prod.formatLabel}
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate(`/product/${prod.slug}`)}
                          className="text-left block w-full font-display text-sm font-bold text-slate-900 hover:text-[#5624d0] leading-snug cursor-pointer"
                        >
                          {prod.title}
                        </button>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                            {formatNaira(prod.price)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => navigate(`/product/${prod.slug}`)}
                              className="px-2.5 py-1 text-[11px] font-semibold border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              View
                            </button>
                            {owned ? (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    prod.type === 'course' ? `/learn/${prod.id}` : '/library'
                                  )
                                }
                                className="px-2.5 py-1 text-[11px] font-bold bg-slate-900 text-white rounded cursor-pointer"
                              >
                                Open
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToCart(prod)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer ${
                                  inCart
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-[#d4af37] text-[#0a192f] hover:bg-[#e5bf45]'
                                }`}
                              >
                                {inCart ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>In Cart</span>
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="w-3 h-3" />
                                    <span>Add</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navy & Gold Direct Advisor Box */}
            <div className="bg-[#0a192f] text-white border border-[#d4af37]/60 rounded-xl p-5 space-y-3">
              <p className="font-display text-xs font-bold uppercase tracking-wider text-[#f5c451]">
                Need Mentorship or Bundle Help?
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Chat on WhatsApp or call {TINTOL_PAYMENT_DETAILS.accountName} for cohort guidance or
                direct GTB bank transfer enrollment.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={buildWhatsAppUrl(
                    `Hello ${TINTOL_PAYMENT_DETAILS.accountName}, I just read "${post.title}" and would like recommendations.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-md inline-flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={buildCallUrl()}
                  className="py-2 px-3 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md inline-flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Desk</span>
                </a>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Related Articles Footer Strip */}
      {relatedPosts.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-14 mt-14 border-t border-slate-200">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-xl font-extrabold text-slate-900">
              Continue Reading
            </h2>
            <button
              type="button"
              onClick={() => navigate('/blogs')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0a192f] hover:underline cursor-pointer"
            >
              <span>All Articles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((rel) => (
              <button
                key={rel.id}
                type="button"
                onClick={() => navigate(`/blog/${rel.slug}`)}
                className="text-left border border-slate-200 rounded-lg p-5 bg-white hover:border-[#0a192f] transition-colors space-y-2 cursor-pointer"
              >
                <p className="text-xs font-bold text-slate-500">
                  {rel.category} · {rel.readTimeMinutes} min read
                </p>
                <h3 className="font-display text-base font-bold text-slate-900 leading-snug">
                  {rel.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2">{rel.excerpt}</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
