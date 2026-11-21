import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Code2,
  Crown,
  Download,
  FileText,
  Globe,
  Heart,
  KeyRound,
  Layers,
  Lock,
  MessageCircle,
  PackageCheck,
  Phone,
  PlayCircle,
  ShieldCheck,
  ShoppingCart,
  Star,
  Users,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { CourseLecture, EbookChapter } from '../../types/marketplace';
import {
  getBlogPostsForProduct,
  getDigitalSubType,
  getDigitalSubmenuByType,
} from '../../utils/catalogAndBlogs';
import {
  calculateBundlePrice,
  getCourseProgressSummary,
  getDiscountPercent,
  getRatingBreakdown,
  roundCurrency,
} from '../../utils/commerce';
import { formatNaira } from '../../utils/currency';
import { formatProductTypeLabel, getAccentTheme } from '../../utils/theme';
import {
  TINTOL_PAYMENT_DETAILS,
  buildCallUrl,
  buildWhatsAppUrl,
} from '../../utils/whatsapp';
import { ProductThumbnail } from '../common/ProductThumbnail';
import { RatingStars } from '../common/RatingStars';
import { ShareButton } from '../common/ShareButton';

interface ProductDetailPageProps {
  slug: string;
}

export function ProductDetailPage({ slug }: ProductDetailPageProps) {
  const {
    products,
    blogPosts,
    reviews,
    appearance,
    navigate,
    addToCart,
    addBundleToCart,
    cart,
    wishlist,
    toggleWishlist,
    isOwnedByCurrentUser,
    isUnlockedByMembership,
    enrollViaMembership,
    activeMembershipPlan,
    getCourseProgress,
    currentUser,
    addProductReview,
    showToast,
  } = useStore();

  const accent = getAccentTheme(appearance.accentTheme);
  const product = products.find((p) => p.slug === slug);

  const [selectedTierId, setSelectedTierId] = useState<string>(
    product?.softwareData?.licenseTiers[0]?.id ?? ''
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product?.variants?.[0]?.id ?? ''
  );
  const [activeGalleryUrl, setActiveGalleryUrl] = useState<string>(
    product?.thumbnail ?? ''
  );
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const firstModId = product?.courseData?.modules[0]?.id;
    return firstModId ? { [firstModId]: true } : {};
  });
  const [previewLecture, setPreviewLecture] = useState<CourseLecture | null>(null);
  const [previewChapter, setPreviewChapter] = useState<EbookChapter | null>(null);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number>(0);
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  const allProductReviews = useMemo(() => {
    if (!product) return [];
    return reviews.filter((r) => r.productId === product.id);
  }, [reviews, product]);

  const productReviews = useMemo(() => {
    if (reviewRatingFilter === 0) return allProductReviews;
    return allProductReviews.filter((r) => r.rating === reviewRatingFilter);
  }, [allProductReviews, reviewRatingFilter]);

  const ratingBreakdown = useMemo(
    () => getRatingBreakdown(allProductReviews, product?.rating ?? 4.8),
    [allProductReviews, product?.rating]
  );

  const bundleProducts = useMemo(() => {
    if (!product?.bundleProductIds?.length) return [];
    const companions = products.filter(
      (p) => product.bundleProductIds!.includes(p.id) && p.status === 'published'
    );
    return companions.length > 0 ? [product, ...companions] : [];
  }, [product, products]);

  const bundlePricing = useMemo(
    () => calculateBundlePrice(bundleProducts, 15),
    [bundleProducts]
  );

  if (!product) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">Product not found</h1>
        <p className="text-slate-600 mt-2">
          This digital product may have been moved or unpublished.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-md cursor-pointer"
        >
          Back to Catalog
        </button>
      </main>
    );
  }

  const isOwned = isOwnedByCurrentUser(product.id);
  const unlockedByMemberPass = isUnlockedByMembership(product);
  const ownedCourseSummary =
    isOwned && product.type === 'course'
      ? getCourseProgressSummary(
          product,
          getCourseProgress(product.id)?.completedLectureIds ?? []
        )
      : null;
  const inCart = cart.some((c) => c.productId === product.id);
  const isWishlisted = wishlist.includes(product.id);

  const activeTier =
    product.type === 'software' && product.softwareData
      ? product.softwareData.licenseTiers.find((t) => t.id === selectedTierId) ??
        product.softwareData.licenseTiers[0]
      : undefined;

  const activeVariant =
    product.variants && product.variants.length > 0
      ? product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0]
      : undefined;

  const displayPrice = activeTier
    ? roundCurrency(product.price * activeTier.priceMultiplier)
    : activeVariant
    ? roundCurrency(product.price + activeVariant.priceDelta)
    : product.price;

  const displayOriginal = activeTier
    ? roundCurrency(product.originalPrice * activeTier.priceMultiplier)
    : activeVariant
    ? roundCurrency(product.originalPrice + activeVariant.priceDelta)
    : product.originalPrice;

  const isPaidMember = activeMembershipPlan?.id === 'paid';
  const effectiveDisplayPrice = product.isPremium && isPaidMember
    ? Math.round(displayPrice * 0.5)
    : displayPrice;

  const discountPct = getDiscountPercent(displayPrice, displayOriginal);
  const galleryList =
    product.galleryImages && product.galleryImages.length > 0
      ? product.galleryImages
      : [product.thumbnail];
  const heroImageUrl =
    activeGalleryUrl && galleryList.includes(activeGalleryUrl)
      ? activeGalleryUrl
      : product.thumbnail;

  const handleBuyNow = () => {
    addToCart(product, activeTier?.id, activeVariant?.id);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to submit a review');
      navigate('/login');
      return;
    }
    if (!newReviewComment.trim()) return;
    addProductReview(product.id, newReviewRating, newReviewComment);
    setNewReviewComment('');
  };

  const digitalSubMeta =
    product.type === 'ebook' ? getDigitalSubmenuByType(getDigitalSubType(product)) : null;

  const relatedBlogArticles = getBlogPostsForProduct(product, blogPosts, 3);
  const totalQuizzesCount =
    product.courseData?.modules.filter((m) => Boolean(m.quiz)).length ?? 0;

  return (
    <main className="pb-20">
      {/* High-Contrast Navy Banner */}
      <div className="bg-[#0a192f] text-white border-b-2 border-[#d4af37]/60">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#f5c451] mb-4"
            >
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Catalog</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              {product.type === 'course' && (
                <button
                  type="button"
                  onClick={() => navigate('/courses')}
                  className="hover:text-white cursor-pointer"
                >
                  Courses
                </button>
              )}
              {product.type === 'ebook' && digitalSubMeta && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/digital-products')}
                    className="hover:text-white cursor-pointer"
                  >
                    Digital Products
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <button
                    type="button"
                    onClick={() => navigate(digitalSubMeta.route)}
                    className="hover:text-white cursor-pointer"
                  >
                    {digitalSubMeta.label}
                  </button>
                </>
              )}
              {product.type === 'software' && (
                <button
                  type="button"
                  onClick={() => navigate('/software')}
                  className="hover:text-white cursor-pointer"
                >
                  Software
                </button>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-300">{product.category}</span>
            </nav>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight text-balance">
              {product.title}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
              {product.subtitle}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {product.isPremium && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-400 text-slate-900 rounded inline-flex items-center gap-1 shadow-sm">
                  <Crown className="w-3.5 h-3.5 fill-slate-900" />
                  <span>Premium Resource · 50% Off for Paid Members</span>
                </span>
              )}
              {product.bestseller && (
                <span className="px-2 py-0.5 text-xs font-bold bg-[#d4af37] text-[#0a192f] rounded">
                  Bestseller
                </span>
              )}
              {product.includedInMembershipTier && (
                <button
                  type="button"
                  onClick={() => navigate('/membership')}
                  className="text-xs font-bold text-[#f5c451] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Included in {product.includedInMembershipTier.toUpperCase()} Membership</span>
                </button>
              )}
              <RatingStars rating={product.rating} reviewCount={product.reviewCount} onDark />
              <span className="text-slate-300 tabular-nums">
                {product.studentsCount.toLocaleString()}{' '}
                {product.type === 'course' ? 'students' : 'buyers'}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300">
              <span>
                Created by <strong className="text-white">{product.instructorName}</strong>
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Updated {product.updatedAt}
              </span>
              <span className="inline-flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {product.language}
              </span>
              <span>Level: {product.level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content + Sticky Right Purchase Card */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Main Column */}
        <div className="lg:col-span-8 space-y-10">
          {/* What you'll learn / Key Capabilities */}
          <section className="border border-slate-200 rounded-lg p-6 bg-white">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-4">
              {product.type === 'course'
                ? "What you'll learn"
                : product.type === 'ebook'
                ? digitalSubMeta?.subType === 'template'
                  ? 'Inside this template pack'
                  : digitalSubMeta?.subType === 'toolkit'
                  ? 'Inside this toolkit'
                  : 'Inside this handbook'
                : 'Key capabilities included'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {product.learningOutcomes.map((outcome, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Target Audience Block (Udemy-style Who This Is For) */}
          {product.targetAudience && product.targetAudience.length > 0 && (
            <section className="border border-slate-200 rounded-lg p-6 bg-slate-50/70 space-y-3">
              <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0a192f]" />
                <span>Who This Is Designed For</span>
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.targetAudience.map((aud, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-[#b4690e] font-bold">·</span>
                    <span>{aud}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Course Curriculum with Quiz & Resource Indicators */}
          {product.type === 'course' && product.courseData && (
            <section>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Course Curriculum
                </h2>
                <span className="text-xs font-medium text-slate-600 tabular-nums">
                  {product.courseData.modules.length} modules ·{' '}
                  {product.courseData.modules.reduce((n, m) => n + m.lectures.length, 0)} lectures ·{' '}
                  {totalQuizzesCount > 0 ? `${totalQuizzesCount} graded quizzes · ` : ''}
                  {product.courseData.totalHours}h total length
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-200">
                {product.courseData.modules.map((mod) => {
                  const isOpen = Boolean(expandedModules[mod.id]);
                  return (
                    <div key={mod.id} className="bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedModules((prev) => ({
                            ...prev,
                            [mod.id]: !prev[mod.id],
                          }))
                        }
                        aria-expanded={isOpen}
                        className="w-full px-5 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between gap-4 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ChevronDown
                            className={`w-4 h-4 text-slate-600 transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                          <span className="font-display text-sm font-bold text-slate-900 truncate">
                            {mod.title}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 tabular-nums shrink-0">
                          {mod.lectures.length} lectures
                          {mod.quiz ? ' · 1 quiz' : ''}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="divide-y divide-slate-100">
                          {mod.lectures.map((lecture) => (
                            <div
                              key={lecture.id}
                              className="px-5 py-3 flex items-center justify-between gap-4 text-sm"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {lecture.isPreview || isOwned ? (
                                  <PlayCircle className="w-4 h-4 text-[#5624d0] shrink-0" />
                                ) : (
                                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <span className="text-slate-800 truncate">{lecture.title}</span>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                {lecture.isPreview && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewLecture(lecture)}
                                    className="text-xs font-semibold text-[#5624d0] hover:underline cursor-pointer"
                                  >
                                    Preview
                                  </button>
                                )}
                                <span className="text-xs text-slate-500 tabular-nums">
                                  {lecture.durationMinutes}:00
                                </span>
                              </div>
                            </div>
                          ))}
                          {mod.quiz && (
                            <div className="px-5 py-2.5 bg-slate-50/70 flex items-center justify-between text-xs text-slate-700">
                              <span className="inline-flex items-center gap-2 font-semibold">
                                <ClipboardCheck className="w-4 h-4 text-[#b4690e]" />
                                {mod.quiz.title}
                              </span>
                              <span className="tabular-nums text-slate-500">
                                {mod.quiz.questions.length} questions · Pass {mod.quiz.passingScore}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Digital Product Assets, SKU, Version & Release Changelog */}
          {product.type === 'ebook' && product.digitalResourceMeta && (
            <section className="border border-slate-200 rounded-lg p-6 bg-white space-y-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#5624d0]" />
                  <span>Included Assets, Edition Specs & Changelog</span>
                </h2>
                <span className="text-xs font-medium text-slate-600 tabular-nums">
                  {product.digitalResourceMeta.deliverableFormat} ·{' '}
                  {product.digitalResourceMeta.itemsCountLabel}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
                <span>
                  Compatible with:{' '}
                  <strong className="text-slate-900">
                    {product.digitalResourceMeta.compatibility}
                  </strong>
                </span>
                {(activeVariant?.sku || product.digitalResourceMeta.sku) && (
                  <span>
                    SKU:{' '}
                    <code className="font-mono font-bold text-slate-900">
                      {activeVariant?.sku || product.digitalResourceMeta.sku}
                    </code>
                  </span>
                )}
                {product.digitalResourceMeta.version && (
                  <span>
                    Release: <strong className="font-mono">v{product.digitalResourceMeta.version}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {product.digitalResourceMeta.includedAssets.map((asset, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800"
                  >
                    <FileText className="w-4 h-4 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>{asset}</span>
                  </div>
                ))}
              </div>

              {product.digitalResourceMeta.changelog &&
                product.digitalResourceMeta.changelog.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Edition Release Changelog
                    </p>
                    {product.digitalResourceMeta.changelog.map((rel) => (
                      <div key={rel.version} className="text-xs text-slate-700 space-y-1">
                        <p className="font-bold text-slate-900 font-mono">
                          v{rel.version} · {rel.date}
                        </p>
                        <ul className="space-y-0.5 pl-4 list-disc">
                          {rel.highlights.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
            </section>
          )}

          {product.type === 'ebook' && product.ebookData && (
            <section>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Table of Contents & Sample Excerpts
                </h2>
                <span className="text-xs font-medium text-slate-600 tabular-nums">
                  {product.ebookData.pages} pages · {product.ebookData.formats.join(' / ')} · ISBN{' '}
                  {product.ebookData.isbn}
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-white">
                {product.ebookData.chapters.map((ch) => (
                  <div
                    key={ch.id}
                    className="px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        Chapter {ch.number}: {ch.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        {ch.pages} pages
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewChapter(ch)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#5624d0] border border-[#5624d0]/30 rounded-md hover:bg-[#f3effc] shrink-0 cursor-pointer"
                    >
                      Read Sample
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {product.type === 'software' && product.softwareData && (
            <section className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 mb-3">
                  Supported Platforms & Release Notes
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {product.softwareData.platforms.map((plat) => (
                    <div
                      key={plat}
                      className="border border-slate-200 rounded-md px-3 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50"
                    >
                      {plat}
                    </div>
                  ))}
                </div>

                <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-white">
                  {product.softwareData.releases.map((rel) => (
                    <div key={rel.version} className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          Release v{rel.version}
                        </span>
                        <span className="text-xs text-slate-500 tabular-nums">{rel.date}</span>
                      </div>
                      <ul className="space-y-1.5">
                        {rel.highlights.map((hl, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-slate-400">·</span>
                            <span>{hl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Frequently Bought Together Bundle Box */}
          {bundleProducts.length > 1 && (
            <section className="border-2 border-[#0a192f] rounded-xl p-6 bg-slate-50 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#b4690e] flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4" />
                    <span>Frequently Bought Together · Save 15%</span>
                  </p>
                  <h2 className="font-display text-lg font-extrabold text-slate-900 mt-0.5">
                    Complete Architecture & Implementation Bundle
                  </h2>
                </div>
                <div className="text-right tabular-nums">
                  <p className="text-xs text-slate-500 line-through">
                    {formatNaira(bundlePricing.regularTotal)}
                  </p>
                  <p className="font-display text-xl font-extrabold text-slate-900">
                    {formatNaira(bundlePricing.bundleTotal)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {bundleProducts.map((bp) => (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => navigate(`/product/${bp.slug}`)}
                    className="p-3 bg-white border border-slate-200 rounded-lg text-left hover:border-[#0a192f] cursor-pointer space-y-1"
                  >
                    <p className="text-[11px] font-semibold text-slate-500">
                      {formatProductTypeLabel(bp.type, bp.digitalSubType)}
                    </p>
                    <p className="text-xs font-bold text-slate-900 line-clamp-2">{bp.title}</p>
                    <p className="text-xs font-extrabold text-[#0a192f] tabular-nums">
                      {formatNaira(bp.price)}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-xs font-semibold text-emerald-700 tabular-nums">
                  Instant bundle savings of {formatNaira(bundlePricing.savings)} applied in cart
                </p>
                <button
                  type="button"
                  onClick={() => addBundleToCart(bundleProducts)}
                  className="px-5 py-2.5 text-xs font-bold bg-[#0a192f] text-[#f5c451] hover:bg-[#112240] rounded-md cursor-pointer"
                >
                  Add Complete Bundle ({formatNaira(bundlePricing.bundleTotal)})
                </button>
              </div>
            </section>
          )}

          {/* Description & Requirements */}
          <section className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-2">Description</h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-2">Requirements</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700">
                {product.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Instructor Profile */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-4">
              Instructor / Author
            </h2>
            <div className="flex items-start gap-4">
              <img
                src={product.instructorAvatar}
                alt={product.instructorName}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div>
                <p className="font-display text-base font-bold text-slate-900">
                  {product.instructorName}
                </p>
                <p className="text-xs font-medium text-slate-500 mb-2">{product.instructorRole}</p>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                  Principal engineer and educator specializing in production TypeScript architectures,
                  distributed reliability, and high-craft developer tooling.
                </p>
              </div>
            </div>
          </section>

          {/* Related Editorial Blog Guides */}
          {relatedBlogArticles.length > 0 && (
            <section className="border-t border-slate-200 pt-8 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Related Editorial Guides from Blogs
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/blogs')}
                  className="text-xs font-bold text-[#0a192f] hover:text-[#5624d0] inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>All Blog Articles</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedBlogArticles.map((post) => (
                  <article
                    key={post.id}
                    className="border border-slate-200 rounded-lg bg-white overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-[11px] font-bold text-[#5624d0] uppercase tracking-wider">
                          {post.category} · {post.readTimeMinutes} min read
                        </p>
                        <h3 className="font-display text-sm font-bold text-slate-900 mt-1 line-clamp-2">
                          {post.title}
                        </h3>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                        className="text-xs font-bold text-[#0a192f] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Read Article</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Reviews, 5★–1★ Histogram & Feedback */}
          <section className="border-t border-slate-200 pt-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 fill-[#b4690e] text-[#b4690e]" />
                <h2 className="font-display text-xl font-bold text-slate-900 tabular-nums">
                  {product.rating.toFixed(1)} Product Rating · {product.reviewCount.toLocaleString()}{' '}
                  ratings
                </h2>
              </div>

              <select
                aria-label="Filter reviews by rating"
                value={reviewRatingFilter}
                onChange={(e) => setReviewRatingFilter(Number(e.target.value))}
                className="h-9 px-3 text-sm border border-slate-300 rounded-md bg-white text-slate-800"
              >
                <option value={0}>All Ratings</option>
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
              </select>
            </div>

            {/* 5★–1★ Distribution Histogram */}
            <div className="border border-slate-200 rounded-lg p-5 bg-slate-50 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-3 text-center">
                <p className="font-display text-4xl font-extrabold text-[#b4690e] tabular-nums">
                  {product.rating.toFixed(1)}
                </p>
                <RatingStars rating={product.rating} compact />
                <p className="text-xs text-slate-500 mt-1">Student & Buyer Rating</p>
              </div>
              <div className="md:col-span-9 space-y-1.5">
                {ratingBreakdown.map((row) => (
                  <button
                    key={row.stars}
                    type="button"
                    onClick={() =>
                      setReviewRatingFilter((prev) => (prev === row.stars ? 0 : row.stars))
                    }
                    className="w-full flex items-center gap-3 text-xs cursor-pointer group"
                  >
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#b4690e]"
                        style={{ width: `${row.percent}%` }}
                      />
                    </div>
                    <span className="w-16 text-left font-semibold text-slate-700 group-hover:underline tabular-nums">
                      {row.stars} stars
                    </span>
                    <span className="w-10 text-right text-slate-500 tabular-nums">
                      {row.percent}%
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productReviews.length === 0 ? (
                <p className="text-sm text-slate-500 col-span-2">
                  No written reviews match this rating filter yet.
                </p>
              ) : (
                productReviews.map((rev) => (
                  <div key={rev.id} className="border border-slate-200 rounded-lg p-5 bg-white">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-sm text-slate-900">{rev.userName}</span>
                      <span className="text-xs text-slate-400 tabular-nums">
                        {rev.createdAt.slice(0, 10)}
                      </span>
                    </div>
                    <RatingStars rating={rev.rating} compact />
                    <p className="text-sm text-slate-700 mt-2.5 leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Leave a Review Form */}
            <form
              onSubmit={handleReviewSubmit}
              className="border border-slate-200 rounded-lg p-5 bg-slate-50 space-y-3"
            >
              <h3 className="font-display text-sm font-bold text-slate-900">Write a Review</h3>
              <div className="flex items-center gap-3">
                <label htmlFor="review-rating-select" className="text-xs font-semibold text-slate-600">
                  Rating:
                </label>
                <select
                  id="review-rating-select"
                  value={newReviewRating}
                  onChange={(e) => setNewReviewRating(Number(e.target.value))}
                  className="h-8 px-2 text-xs border border-slate-300 rounded bg-white"
                >
                  <option value={5}>5 - Outstanding</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={3}>3 - Solid</option>
                  <option value={2}>2 - Needs Work</option>
                </select>
              </div>
              <textarea
                rows={3}
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                placeholder="Share what you learned or built with this product..."
                aria-label="Review comment"
                className="w-full p-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-md hover:bg-slate-800 cursor-pointer"
              >
                Publish Review
              </button>
            </form>
          </section>
        </div>

        {/* Right Sticky Purchase Card */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="aspect-[4/3] bg-slate-100 relative group">
              <ProductThumbnail
                src={heroImageUrl}
                alt={product.title}
                type={product.type}
                className="w-full h-full"
              />
              {product.type === 'course' && product.courseData?.promoHighlights?.length ? (
                <button
                  type="button"
                  onClick={() => setPromoModalOpen(true)}
                  className="absolute inset-0 bg-slate-950/35 hover:bg-slate-950/50 transition-colors flex flex-col items-center justify-center text-white gap-1.5 cursor-pointer"
                >
                  <PlayCircle className="w-12 h-12 text-[#f5c451]" />
                  <span className="text-xs font-bold bg-[#0a192f]/90 px-3 py-1 rounded">
                    Preview this course
                  </span>
                </button>
              ) : null}
            </div>

            {/* Multi-Image Gallery Strip for Digital Products / Courses */}
            {galleryList.length > 1 && (
              <div className="px-4 pt-3 flex items-center gap-2 overflow-x-auto">
                {galleryList.map((imgUrl, gIdx) => (
                  <button
                    key={gIdx}
                    type="button"
                    onClick={() => setActiveGalleryUrl(imgUrl)}
                    aria-label={`View gallery preview ${gIdx + 1}`}
                    className={`w-16 h-12 rounded overflow-hidden border-2 shrink-0 cursor-pointer ${
                      heroImageUrl === imgUrl ? 'border-[#0a192f]' : 'border-slate-200'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.title} view ${gIdx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="p-6 space-y-5">
              {/* Software License Tier Selector */}
              {product.type === 'software' && product.softwareData && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Select License Tier
                  </label>
                  <div className="space-y-2">
                    {product.softwareData.licenseTiers.map((tier) => {
                      const tierPrice = roundCurrency(product.price * tier.priceMultiplier);
                      const isSelected = activeTier?.id === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setSelectedTierId(tier.id)}
                          className={`w-full p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                            isSelected
                              ? `${accent.primaryBorder} ${accent.softBg}`
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">{tier.name}</span>
                            <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                              {formatNaira(tierPrice)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{tier.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Digital Product Edition / Variant Selector */}
              {product.type !== 'software' &&
                product.variants &&
                product.variants.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Select Edition & License Scope
                    </label>
                    <div className="space-y-2">
                      {product.variants.map((variant) => {
                        const vPrice = roundCurrency(product.price + variant.priceDelta);
                        const isSelected = activeVariant?.id === variant.id;
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => setSelectedVariantId(variant.id)}
                            className={`w-full p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'border-[#0a192f] bg-slate-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                {variant.name}
                              </span>
                              <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                                {formatNaira(vPrice)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              {variant.format} · {variant.licenseType} · Up to{' '}
                              {variant.downloadLimit} downloads
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Price Display */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-2.5 tabular-nums">
                  <span className="font-display text-3xl font-extrabold text-slate-900">
                    {formatNaira(effectiveDisplayPrice)}
                  </span>
                  {product.isPremium && isPaidMember ? (
                    <>
                      <span className="text-base text-slate-400 line-through">
                        {formatNaira(displayPrice)}
                      </span>
                      <span className="text-sm font-bold text-emerald-700">
                        50% Member Discount
                      </span>
                    </>
                  ) : discountPct > 0 ? (
                    <>
                      <span className="text-base text-slate-400 line-through">
                        {formatNaira(displayOriginal)}
                      </span>
                      <span className="text-sm font-bold text-emerald-700">
                        {discountPct}% off
                      </span>
                    </>
                  ) : null}
                </div>

                {product.isPremium && !isPaidMember && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1 mt-2">
                    <p className="font-bold flex items-center gap-1.5 text-amber-950">
                      <Crown className="w-4 h-4 text-amber-600" />
                      <span>Paid Member Benefit: 50% Off</span>
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      All paid members access this Premium Resource on 50% payment ({formatNaira(Math.round(displayPrice * 0.5))}). Users without a paid plan pay the full rate ({formatNaira(displayPrice)}).
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/membership')}
                      className="text-[#0a192f] font-bold underline hover:text-[#d4af37] cursor-pointer inline-block pt-0.5"
                    >
                      Get Paid Membership (from ₦10,000/yr) →
                    </button>
                  </div>
                )}

                {product.isPremium && isPaidMember && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold">50% Member Benefit Applied</p>
                        <p className="text-[11px] text-emerald-700">As an active Paid Member, you pay 50% at checkout.</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-xs px-2 py-0.5 bg-emerald-600 text-white rounded">50% OFF</span>
                  </div>
                )}
              </div>

              {/* Membership Pass Callout */}
              {unlockedByMemberPass && !isOwned && (
                <button
                  type="button"
                  onClick={() => enrollViaMembership(product)}
                  className="w-full py-2.5 px-4 text-xs font-bold bg-[#0a192f] text-[#f5c451] border border-[#d4af37] rounded-md inline-flex items-center justify-center gap-1.5 hover:bg-[#112240] cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>
                    Included in {activeMembershipPlan?.name} Pass · Enroll Free
                  </span>
                </button>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {isOwned ? (
                  <>
                    {ownedCourseSummary && (
                      <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 tabular-nums">
                          <span>Your Course Progress</span>
                          <span>{ownedCourseSummary.percent}%</span>
                        </div>
                        <div
                          className="h-2 bg-slate-200 rounded-full overflow-hidden"
                          role="progressbar"
                          aria-valuenow={ownedCourseSummary.percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${product.title} course progress`}
                        >
                          <div
                            className={`h-full transition-all duration-300 ${
                              ownedCourseSummary.percent === 100
                                ? 'bg-emerald-600'
                                : accent.primaryBg
                            }`}
                            style={{ width: `${ownedCourseSummary.percent}%` }}
                          />
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 tabular-nums">
                          {ownedCourseSummary.completedLectures}/{ownedCourseSummary.totalLectures}{' '}
                          lessons · {ownedCourseSummary.completedModules}/
                          {ownedCourseSummary.totalModules} modules completed
                        </p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          product.type === 'course' ? `/learn/${product.id}` : '/library'
                        )
                      }
                      className={`w-full py-3 px-4 text-sm font-bold text-white ${accent.primaryBg} ${accent.primaryHoverBg} rounded-md transition-colors cursor-pointer`}
                    >
                      {product.type === 'course' ? 'Start Learning' : 'Access Now'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => addToCart(product, activeTier?.id, activeVariant?.id)}
                      className={`w-full py-3 px-4 text-sm font-bold text-white ${accent.primaryBg} ${accent.primaryHoverBg} rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{inCart ? 'Go to Cart' : 'Add to cart'}</span>
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleBuyNow}
                        className="flex-1 py-2.5 px-4 text-sm font-bold text-slate-900 border border-slate-900 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Buy now
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(product.id)}
                        aria-label="Toggle wishlist"
                        className={`p-2.5 border rounded-md transition-colors cursor-pointer ${
                          isWishlisted
                            ? 'border-rose-300 bg-rose-50 text-rose-600'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                      </button>
                      <ShareButton title={product.title} variant="card" label="Share" />
                    </div>
                  </>
                )}
              </div>

              {!isOwned && product.includedInMembershipTier && !unlockedByMemberPass && (
                <button
                  type="button"
                  onClick={() => navigate('/membership')}
                  className="w-full text-center text-xs font-semibold text-[#5624d0] hover:underline cursor-pointer"
                >
                  Unlock with {product.includedInMembershipTier.toUpperCase()} Membership + Store Discounts →
                </button>
              )}

              {isOwned && (
                <div className="flex justify-end">
                  <ShareButton title={product.title} variant="card" label="Share Product" />
                </div>
              )}

              <p className="text-xs text-center text-slate-500">
                30-Day Money-Back Guarantee · Instant Digital Access
              </p>

              {/* Direct GTB Bank & WhatsApp Concierge */}
              <div className="p-3.5 rounded-lg bg-[#0a192f] text-white border border-[#d4af37]/50 space-y-2 text-xs">
                <p className="font-bold text-[#f5c451]">
                  Pay via GTB Transfer or Ask on WhatsApp
                </p>
                <p className="text-[11px] text-slate-300">
                  GTB ·{' '}
                  <span className="font-mono text-white font-bold">
                    {TINTOL_PAYMENT_DETAILS.accountNumber}
                  </span>{' '}
                  ({TINTOL_PAYMENT_DETAILS.accountName})
                </p>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <a
                    href={buildWhatsAppUrl(
                      `Hello ${TINTOL_PAYMENT_DETAILS.accountName}, I want to pay via GTB for "${product.title}" (${formatNaira(displayPrice)}).`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={buildCallUrl()}
                    className="py-1.5 px-2.5 rounded bg-[#112240] border border-[#d4af37]/50 hover:border-[#d4af37] text-[#f5c451] font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Us</span>
                  </a>
                </div>
              </div>

              {/* Includes Summary */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                <p className="font-bold text-slate-900">This package includes:</p>
                {product.type === 'course' && product.courseData && (
                  <>
                    <div className="flex items-center gap-2.5">
                      <PlayCircle className="w-4 h-4 text-slate-500" />
                      <span>{product.courseData.totalHours} hours on-demand HD video</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>Downloadable source labs & lecture notes</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-slate-500" />
                      <span>Verified certificate of completion</span>
                    </div>
                  </>
                )}
                {product.type === 'ebook' && product.digitalResourceMeta && (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-slate-500" />
                      <span>
                        {formatProductTypeLabel(product.type, product.digitalSubType)} (
                        {product.digitalResourceMeta.deliverableFormat})
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>
                        Instant access ({product.digitalResourceMeta.itemsCountLabel})
                      </span>
                    </div>
                  </>
                )}
                {product.type === 'ebook' && product.ebookData && (
                  <>
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-slate-500" />
                      <span>
                        {product.ebookData.pages} pages ({product.ebookData.formats.join(', ')})
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>DRM-free offline download ({product.ebookData.fileSize})</span>
                    </div>
                  </>
                )}
                {product.type === 'software' && product.softwareData && (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Code2 className="w-4 h-4 text-slate-500" />
                      <span>
                        Release v{product.softwareData.version} ({product.softwareData.fileSize})
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <KeyRound className="w-4 h-4 text-slate-500" />
                      <span>
                        Instant cryptographic license key ({activeTier?.seats ?? 1} domain seat(s))
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Course Promo Trailer Modal */}
      {promoModalOpen && product.courseData && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Course trailer preview"
        >
          <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="bg-[#0a192f] text-white px-6 py-4 border-b border-[#d4af37] flex items-center justify-between">
              <div>
                <p className="text-xs text-[#f5c451] font-semibold">Course Trailer Preview</p>
                <h3 className="font-display text-base font-bold">{product.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPromoModalOpen(false)}
                aria-label="Close trailer modal"
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="aspect-video bg-[#081221] rounded-lg flex flex-col items-center justify-center text-white p-6 text-center space-y-2">
                <PlayCircle className="w-14 h-14 text-[#f5c451]" />
                <p className="font-display text-lg font-bold">{product.title}</p>
                <p className="text-xs text-slate-300 max-w-md">{product.subtitle}</p>
              </div>
              {product.courseData.promoHighlights && (
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">
                    Highlights Covered in This Course
                  </p>
                  <ul className="space-y-1.5">
                    {product.courseData.promoHighlights.map((hl, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Free Lecture Preview Modal */}
      {previewLecture && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Lecture preview"
        >
          <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-300 font-semibold">Free Course Preview</p>
                <h3 className="font-display text-base font-bold">{previewLecture.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLecture(null)}
                aria-label="Close preview"
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="aspect-video bg-slate-950 rounded-lg flex flex-col items-center justify-center text-white p-6 text-center">
                <PlayCircle className="w-14 h-14 text-indigo-400 mb-3" />
                <p className="font-display text-lg font-bold">{previewLecture.title}</p>
                <p className="text-sm text-slate-300 mt-1 max-w-md">{previewLecture.summary}</p>
                <span className="mt-4 text-xs font-mono text-slate-400">
                  Preview Clip · {previewLecture.durationMinutes}:00 min
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Key Takeaways Covered</p>
                <ul className="space-y-1.5">
                  {previewLecture.keyTakeaways.map((t, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* eBook Sample Chapter Reader Modal */}
      {previewChapter && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="eBook chapter sample"
        >
          <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold">
                  Sample Excerpt · Chapter {previewChapter.number}
                </p>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {previewChapter.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewChapter(null)}
                aria-label="Close chapter sample"
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 sm:p-8 space-y-4 bg-slate-50">
              <p className="text-base text-slate-800 leading-relaxed">
                {previewChapter.previewExcerpt}
              </p>
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Full chapter includes {previewChapter.pages} pages + downloadable code examples.
                </span>
                {!isOwned && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewChapter(null);
                      addToCart(product, activeTier?.id, activeVariant?.id);
                    }}
                    className={`px-4 py-2 text-xs font-bold text-white ${accent.primaryBg} rounded-md cursor-pointer`}
                  >
                    Unlock Full eBook ({formatNaira(displayPrice)})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
