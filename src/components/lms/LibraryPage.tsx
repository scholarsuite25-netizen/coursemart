import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  Bookmark,
  BookOpen,
  Check,
  Code2,
  Copy,
  Crown,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Hash,
  Heart,
  KeyRound,
  Mail,
  MessageCircle,
  MessageSquare,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { Order, Product } from '../../types/marketplace';
import { getCourseProgressSummary } from '../../utils/commerce';
import { formatNaira } from '../../utils/currency';
import { escapeHtml } from '../../utils/sanitize';
import { resolveDownloadUrl } from '../../utils/mediaResolver';
import { formatProductTypeLabel, getAccentTheme } from '../../utils/theme';
import {
  TINTOL_PAYMENT_DETAILS,
  buildBankTransferWhatsAppMessage,
  buildWhatsAppUrl,
} from '../../utils/whatsapp';
import { ProductThumbnail } from '../common/ProductThumbnail';
import { isCopyProtectionActive } from '../../utils/contentProtection';
import { ContentProtectionWrapper } from './ContentProtectionWrapper';
import { DynamicWatermarkOverlay } from './DynamicWatermarkOverlay';
import { triggerFileDownload, triggerDirectLinkDownload } from '../../utils/fileDownloader';
import { generateAndDownloadEbookPdf } from '../../utils/pdfEbookGenerator';

export function LibraryPage() {
  const {
    currentUser,
    products,
    blogPosts,
    bookmarkedBlogIds,
    toggleBlogBookmark,
    orders,
    licenses,
    wishlist,
    toggleWishlist,
    getCourseProgress,
    activateLicenseDomain,
    deactivateLicenseDomain,
    regenerateLicenseKey,
    whatsappGroups,
    communityChannels,
    joinWhatsAppGroup,
    activeUserMembership,
    activeMembershipPlan,
    isUnlockedByMembership,
    recordProductDownload,
    addToCart,
    setIsCartOpen,
    requestOrderRefund,
    verifyPaystackReference,
    updateNewsletterPreference,
    navigate,
    quickLoginAsRole,
    showToast,
    appearance,
  } = useStore();

  const accent = getAccentTheme(appearance.accentTheme);
  const initialTab =
    typeof window !== 'undefined' && window.location.search.includes('tab=wishlist')
      ? 'wishlist'
      : typeof window !== 'undefined' && window.location.search.includes('tab=orders')
      ? 'orders'
      : typeof window !== 'undefined' && window.location.search.includes('tab=articles')
      ? 'articles'
      : 'all';
  const [activeTab, setActiveTab] = useState<
    'all' | 'courses' | 'ebooks' | 'software' | 'articles' | 'communities' | 'wishlist' | 'orders'
  >(initialTab);
  const [domainInputs, setDomainInputs] = useState<Record<string, string>>({});
  const [domainErrors, setDomainErrors] = useState<Record<string, string>>({});
  const [readerEbook, setReaderEbook] = useState<Product | null>(null);
  const [readerChapterIdx, setReaderChapterIdx] = useState(0);
  const [readerFontLarge, setReaderFontLarge] = useState(false);

  // Invoice & refund modals
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReasonInput, setRefundReasonInput] = useState('');

  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter((o) => o.userId === currentUser.id);
  }, [orders, currentUser]);

  const ownedProductIds = useMemo(() => {
    const ids = new Set<string>();
    userOrders
      .filter((o) => o.status === 'completed')
      .forEach((o) => o.items.forEach((item) => ids.add(item.productId)));
    if (activeUserMembership) {
      products.forEach((p) => {
        if (isUnlockedByMembership(p)) ids.add(p.id);
      });
    }
    return ids;
  }, [userOrders, activeUserMembership, products, isUnlockedByMembership]);

  const ownedProducts = useMemo(
    () => products.filter((p) => ownedProductIds.has(p.id)),
    [products, ownedProductIds]
  );

  const userLicenses = useMemo(() => {
    if (!currentUser) return [];
    return licenses.filter((l) => l.userId === currentUser.id);
  }, [licenses, currentUser]);

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlist.includes(p.id)),
    [products, wishlist]
  );

  const savedArticles = useMemo(
    () =>
      blogPosts.filter(
        (post) => post.status === 'published' && bookmarkedBlogIds.includes(post.id)
      ),
    [blogPosts, bookmarkedBlogIds]
  );

  const eligibleWhatsAppGroups = useMemo(
    () =>
      whatsappGroups.filter(
        (g) =>
          g.active &&
          (g.visibility === 'public' ||
            (g.productId ? ownedProductIds.has(g.productId) : ownedProductIds.size > 0))
      ),
    [whatsappGroups, ownedProductIds]
  );

  const ownedCoursesOverview = useMemo(() => {
    const ownedCourses = ownedProducts.filter((p) => p.type === 'course');
    let completedLectures = 0;
    let totalLectures = 0;
    let completedModules = 0;
    let totalModules = 0;
    let completedCourses = 0;

    for (const course of ownedCourses) {
      const prog = getCourseProgress(course.id);
      const summary = getCourseProgressSummary(course, prog?.completedLectureIds ?? []);
      completedLectures += summary.completedLectures;
      totalLectures += summary.totalLectures;
      completedModules += summary.completedModules;
      totalModules += summary.totalModules;
      if (summary.totalLectures > 0 && summary.percent === 100) {
        completedCourses += 1;
      }
    }

    const overallPercent =
      totalLectures === 0
        ? 0
        : Math.min(100, Math.round((completedLectures / totalLectures) * 100));

    return {
      courseCount: ownedCourses.length,
      completedCourses,
      completedLectures,
      totalLectures,
      completedModules,
      totalModules,
      overallPercent,
    };
  }, [ownedProducts, getCourseProgress]);

  if (!currentUser) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center space-y-5">
        <h1 className="font-display text-3xl font-extrabold text-slate-900">
          Sign in to access My Library
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
          Launch video courses, download digital products, and activate software license keys from
          your personal library.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className={`px-6 py-3 text-sm font-bold text-white ${accent.primaryBg} ${accent.primaryHoverBg} rounded-md cursor-pointer`}
          >
            Go to Sign In
          </button>
          <button
            type="button"
            onClick={() => quickLoginAsRole('customer')}
            className="px-6 py-3 text-sm font-bold text-slate-900 border border-slate-900 rounded-md hover:bg-slate-50 cursor-pointer"
          >
            Instant Demo Student Sign In
          </button>
        </div>
      </main>
    );
  }

  const displayedProducts = ownedProducts.filter((p) => {
    if (activeTab === 'courses') return p.type === 'course';
    if (activeTab === 'ebooks') return p.type === 'ebook';
    if (activeTab === 'software') return p.type === 'software';
    return true;
  });

  const MAX_DOWNLOADS_PER_ITEM = 3;

  const findCompletedOrderForProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const limit = Math.min(prod?.downloadLimit ?? MAX_DOWNLOADS_PER_ITEM, MAX_DOWNLOADS_PER_ITEM);
    const matching = userOrders.filter(
      (o) =>
        o.status === 'completed' && o.items.some((item) => item.productId === productId)
    );
    // Prefer the first order with remaining downloads (< limit), matching the
    // server-side entitlement check; otherwise fall back to the first match.
    return (
      matching.find((o) => (o.downloadCounts?.[productId] ?? 0) < limit) || matching[0]
    );
  };

  const handleReferFreshPayment = (prod: Product) => {
    addToCart(prod);
    setIsCartOpen(true);
    navigate(`/product/${prod.slug}`);
    showToast(
      `Maximum ${MAX_DOWNLOADS_PER_ITEM} downloads reached for "${prod.title}". Please complete a fresh payment to unlock new downloads.`
    );
  };

  const handleCopyKey = (key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(key).catch(() => {});
    }
    showToast(`Copied license key ${key}`);
  };

  const handleActivateDomain = (licenseId: string) => {
    const val = domainInputs[licenseId] ?? '';
    const res = activateLicenseDomain(licenseId, val);
    if (!res.ok) {
      setDomainErrors((prev) => ({ ...prev, [licenseId]: res.error ?? 'Activation failed' }));
      return;
    }
    setDomainErrors((prev) => ({ ...prev, [licenseId]: '' }));
    setDomainInputs((prev) => ({ ...prev, [licenseId]: '' }));
  };

  const handleDownloadEbook = (prod: Product) => {
    const matchedOrder = findCompletedOrderForProduct(prod.id);
    if (matchedOrder) {
      const check = recordProductDownload(matchedOrder.id, prod.id);
      if (!check.ok) {
        handleReferFreshPayment(prod);
        return;
      }
    }

    const targetUrl =
      prod.downloadUrl ||
      prod.ebookData?.downloadUrl ||
      prod.digitalResourceMeta?.downloadUrl ||
      prod.softwareData?.downloadUrl;

    // Direct download if external cloud link (Drive, Dropbox, S3)
    if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
      const directUrl = resolveDownloadUrl(targetUrl);
      triggerDirectLinkDownload(directUrl, `${prod.slug}-deliverable`);
      showToast(`Initiating direct download for "${prod.title}"...`);
      return;
    }

    if (prod.ebookData) {
      generateAndDownloadEbookPdf(prod, currentUser);
      showToast(`Downloaded complete PDF edition for "${prod.title}"`);
      return;
    } else if (prod.digitalResourceMeta) {
      const toolkitText = [
        `================================================================================`,
        `DIGITAL WEALTH CREATORS (DWC) VERIFIED PRODUCTION TOOLKIT & TEMPLATES`,
        `================================================================================`,
        `Resource: ${prod.title}`,
        `Type: ${formatProductTypeLabel(prod.type, prod.digitalSubType)}`,
        `Curator / Instructor: ${prod.instructorName}`,
        `Deliverable Format: ${prod.digitalResourceMeta.deliverableFormat}`,
        `Compatibility: ${prod.digitalResourceMeta.compatibility}`,
        `Assets Included: ${prod.digitalResourceMeta.itemsCountLabel}`,
        `Licensed To: ${currentUser.name} (${currentUser.email})`,
        `Delivered: ${new Date().toLocaleDateString()}`,
        `================================================================================`,
        `\nINCLUDED ASSETS & FILES IN THIS PACKAGE:`,
        ...prod.digitalResourceMeta.includedAssets.map((asset, idx) => `  [File ${idx + 1}] ${asset}`),
        `\nKEY LEARNING OUTCOMES & IMPLEMENTATION GOALS:`,
        ...prod.learningOutcomes.map((outcome, idx) => `  ${idx + 1}. ${outcome}`),
        `\nREQUIREMENTS & TOOLING:`,
        ...prod.requirements.map((req) => `  - ${req}`),
        `\n================================================================================`,
        `QUICKSTART IMPLEMENTATION GUIDE:`,
        `1. Open and extract all included template structures in your compatible editor.`,
        `2. Fill in your business details, client terms, and branding.`,
        `3. Deploy workflows according to the DWC Standard Operating Procedures.`,
        `================================================================================`,
      ].join('\n');

      triggerFileDownload(
        `${prod.slug}-toolkit-and-templates.txt`,
        toolkitText,
        'text/plain;charset=utf-8'
      );
    } else {
      // Robust universal fallback for any digital product
      const generalText = [
        `================================================================================`,
        `DIGITAL WEALTH CREATORS (DWC) — Digital Deliverable Package`,
        `================================================================================`,
        `Product: ${prod.title}`,
        `Category: ${prod.category}`,
        `Instructor: ${prod.instructorName}`,
        `Format: ${prod.formatLabel || 'Digital Delivery'}`,
        `Licensed To: ${currentUser.name} (${currentUser.email})`,
        `Delivered: ${new Date().toLocaleDateString()}`,
        `================================================================================`,
        `\nDescription:`,
        prod.description,
        `\nLearning Outcomes:`,
        ...prod.learningOutcomes.map((o, idx) => `  ${idx + 1}. ${o}`),
        `\nRequirements:`,
        ...prod.requirements.map((r) => `  - ${r}`),
        `================================================================================`,
      ].join('\n');

      triggerFileDownload(
        `${prod.slug}-package.txt`,
        generalText,
        'text/plain;charset=utf-8'
      );
    }
    showToast(`Downloaded "${prod.title}" successfully!`);
  };

  const handleDownloadSoftware = (prod: Product) => {
    const matchedOrder = findCompletedOrderForProduct(prod.id);
    if (matchedOrder) {
      const check = recordProductDownload(matchedOrder.id, prod.id);
      if (!check.ok) {
        handleReferFreshPayment(prod);
        return;
      }
    }

    const targetUrl = prod.downloadUrl || prod.softwareData?.downloadUrl;
    if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
      const directUrl = resolveDownloadUrl(targetUrl);
      triggerDirectLinkDownload(directUrl, `${prod.slug}-installer`);
      showToast(`Initiating software download for "${prod.title}"...`);
      return;
    }

    const packageJson = {
      name: prod.slug,
      version: prod.softwareData?.version ?? '2.1.0',
      description: prod.subtitle || prod.description,
      author: `${prod.instructorName} — Digital Wealth Creators`,
      license: 'Proprietary Commercial License',
      licensedTo: {
        userId: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        licensedAt: new Date().toISOString(),
      },
      platforms: prod.softwareData?.platforms ?? ['macOS', 'Windows 10/11', 'Linux'],
      supportedTiers:
        prod.softwareData?.licenseTiers?.map((t) => ({
          id: t.id,
          name: t.name,
          seats: t.seats,
        })) ?? [],
      scripts: {
        setup: 'node scripts/setup.js',
        start: 'node bin/launcher.js',
      },
    };

    const readmeText = [
      `================================================================================`,
      `DIGITAL WEALTH CREATORS (DWC) SOFTWARE PACKAGE: ${prod.title}`,
      `Release Version: v${prod.softwareData?.version ?? '2.1.0'}`,
      `================================================================================`,
      `Licensed To: ${currentUser.name} (${currentUser.email})`,
      `Delivered: ${new Date().toLocaleDateString()}`,
      `Compatible Platforms: ${(prod.softwareData?.platforms ?? ['macOS', 'Windows', 'Linux']).join(', ')}`,
      `================================================================================`,
      `\nQUICK INSTALLATION & SETUP:`,
      `1. Ensure Node.js 18+ or Docker is installed on your workstation.`,
      `2. Extract the software package to your designated workspace directory.`,
      `3. Open terminal in the directory and run:`,
      `     npm install`,
      `     npm run setup`,
      `4. In your browser, navigate to http://localhost:3000 to complete configuration.`,
      `5. Enter your cryptographic license key found in your DWC Library dashboard.`,
      `\nFor technical support and updates, visit:`,
      `https://digitalwealthcreators.org.ng/my-library`,
      `================================================================================`,
    ].join('\n');

    triggerFileDownload(
      `${prod.slug}-v${prod.softwareData?.version ?? '2.1.0'}-package.json`,
      JSON.stringify(packageJson, null, 2),
      'application/json'
    );

    setTimeout(() => {
      triggerFileDownload(
        `${prod.slug}-QUICKSTART-GUIDE.txt`,
        readmeText,
        'text/plain;charset=utf-8'
      );
    }, 400);

    showToast(`Downloaded ${prod.title} v${prod.softwareData?.version ?? '2.1.0'} package`);
  };

  const handleDownloadInvoiceHtml = (ord: Order) => {
    const rowsHtml = ord.items
      .map(
        (i) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(
            i.productTitle
          )}${i.variantName ? ` (${escapeHtml(i.variantName)})` : ''}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(
            formatNaira(i.price)
          )}</td></tr>`
      )
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Invoice ${escapeHtml(
      ord.id
    )}</title></head><body style="font-family:sans-serif;max-width:720px;margin:40px auto;padding:32px;border:1px solid #cbd5e1;"><h1>${escapeHtml(
      appearance.brandName
    )} · ${escapeHtml(TINTOL_PAYMENT_DETAILS.accountName)}</h1><p><strong>Invoice #${escapeHtml(
      ord.id
    )}</strong> · Date: ${escapeHtml(ord.createdAt.slice(0, 10))}</p><p>Billed To: ${escapeHtml(
      ord.customerName
    )} (${escapeHtml(
      ord.customerEmail
    )})</p><table style="width:100%;border-collapse:collapse;margin:24px 0;"><thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #0a192f;">Item</th><th style="text-align:right;padding:8px;border-bottom:2px solid #0a192f;">Price</th></tr></thead><tbody>${rowsHtml}</tbody></table><p style="text-align:right;">Subtotal: ${escapeHtml(
      formatNaira(ord.subtotal)
    )}</p><p style="text-align:right;">Total Paid: <strong>${escapeHtml(
      formatNaira(ord.total)
    )}</strong></p></body></html>`;
    triggerFileDownload(`invoice-${ord.id}.html`, html, 'text/html;charset=utf-8');
    showToast(`Downloaded invoice for ${ord.id}`);
  };

  const handleSubmitRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrderId || !refundReasonInput.trim()) return;
    requestOrderRefund(refundOrderId, refundReasonInput);
    setRefundOrderId(null);
    setRefundReasonInput('');
  };

  return (
    <main className="pb-20">
      {/* Dark Library Header */}
      <div className="bg-[#0a192f] text-white border-b-2 border-[#d4af37]/60">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-10 pb-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-[#f5c451] mb-1">
                Signed in as {currentUser.name}
              </p>
              <h1 className="font-display text-3xl font-extrabold text-white">
                My Learning & Digital Library
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => updateNewsletterPreference(!Boolean(currentUser.newsletterOptIn))}
                className={`px-3.5 py-2 text-xs font-bold rounded-md border inline-flex items-center gap-2 cursor-pointer transition-colors ${
                  currentUser.newsletterOptIn
                    ? 'bg-emerald-950/70 border-emerald-400/60 text-emerald-200 hover:bg-emerald-900/80'
                    : 'bg-[#112240] border-slate-600 text-slate-300 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>
                  Newsletter: {currentUser.newsletterOptIn ? 'Subscribed' : 'Opted Out'} (Toggle)
                </span>
              </button>

              {activeUserMembership && activeMembershipPlan ? (
                <div className="bg-[#112240] border border-[#d4af37]/60 rounded-lg px-4 py-2.5 flex items-center gap-3 text-xs">
                  <Crown className="w-5 h-5 text-[#f5c451] shrink-0" />
                  <div>
                    <p className="font-bold text-white">
                      {activeMembershipPlan.name} Pass ({activeUserMembership.billingCycle})
                    </p>
                    <p className="text-slate-300 tabular-nums">
                      {activeMembershipPlan.storeDiscountPercent}% auto-discount · Renews{' '}
                      {activeUserMembership.renewsAt.slice(0, 10)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/membership')}
                    className="ml-2 px-2.5 py-1 bg-[#d4af37] text-[#0a192f] font-bold rounded cursor-pointer"
                  >
                    Manage
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/membership')}
                  className="px-4 py-2 bg-[#112240] border border-[#d4af37]/60 hover:border-[#d4af37] text-[#f5c451] text-xs font-bold rounded-md inline-flex items-center gap-2 cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>Upgrade to Membership Pass</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 overflow-x-auto text-sm font-semibold">
            {(
              [
                { id: 'all', label: `All Owned (${ownedProducts.length})` },
                {
                  id: 'courses',
                  label: `Courses (${ownedProducts.filter((p) => p.type === 'course').length})`,
                },
                {
                  id: 'ebooks',
                  label: `Digital Products (${ownedProducts.filter((p) => p.type === 'ebook').length})`,
                },
                {
                  id: 'software',
                  label: `Software & Licenses (${userLicenses.length})`,
                },
                {
                  id: 'articles',
                  label: `Saved Articles (${savedArticles.length})`,
                },
                {
                  id: 'communities',
                  label: `Community & Cohorts`,
                },
                { id: 'wishlist', label: `Wishlist (${wishlistProducts.length})` },
                { id: 'orders', label: `Orders & Invoices (${userOrders.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#d4af37] text-[#f5c451]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-8 space-y-10">
        {/* Saved Blog Articles Tab */}
        {activeTab === 'articles' && (
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-extrabold text-slate-900">
                Bookmarked Editorial Articles
              </h2>
              <p className="text-sm text-slate-600">
                Deep-dive guides you saved across AI, Mentorship, Leadership, Vibe Coding, and Apps Deployment.
              </p>
            </div>
            {savedArticles.length === 0 ? (
              <div className="border border-slate-200 rounded-xl p-12 text-center bg-slate-50">
                <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="font-display text-lg font-bold text-slate-900">
                  No saved articles yet
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Bookmark any editorial guide while reading on the Blogs hub.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/blogs')}
                  className="mt-4 px-5 py-2.5 text-xs font-bold text-white bg-[#0a192f] rounded-md cursor-pointer"
                >
                  Explore Blogs
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedArticles.map((post) => (
                  <article
                    key={post.id}
                    className="border border-slate-200 rounded-lg bg-white overflow-hidden flex flex-col justify-between"
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
                      <div className="p-4 space-y-2">
                        <p className="text-[11px] font-bold text-[#5624d0] uppercase tracking-wider">
                          {post.category} · {post.readTimeMinutes} min read
                        </p>
                        <h3 className="font-display text-base font-bold text-slate-900 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2">{post.excerpt}</p>
                      </div>
                    </div>
                    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                        className="text-xs font-bold text-[#0a192f] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Read Article</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBlogBookmark(post.id)}
                        className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <section>
            {wishlistProducts.length === 0 ? (
              <div className="border border-slate-200 rounded-xl p-12 text-center bg-slate-50">
                <Heart className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="font-display text-lg font-bold text-slate-900">
                  Your wishlist is empty
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="mt-4 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-md cursor-pointer"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistProducts.map((p) => (
                  <div
                    key={p.id}
                    className="border border-slate-200 rounded-lg bg-white overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      <ProductThumbnail
                        src={p.thumbnail}
                        alt={p.title}
                        type={p.type}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">{p.formatLabel}</p>
                        <h3 className="font-display text-base font-bold text-slate-900 mt-1">
                          {p.title}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => navigate(`/product/${p.slug}`)}
                          className="text-xs font-bold text-[#5624d0] hover:underline cursor-pointer"
                        >
                          View Product ({formatNaira(p.price)})
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(p.id)}
                          className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Community & Cohorts Tab */}
        {activeTab === 'communities' && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-extrabold text-slate-900">
                  In-Platform Community & Course Cohorts
                </h2>
                <p className="text-sm text-slate-600">
                  Connect directly with instructors and peers in real-time chat channels and searchable technical forum boards — zero external WhatsApp switching.
                </p>
              </div>
            </div>

            {/* In-Platform Hub Launcher Hero Card */}
            <div className="bg-gradient-to-r from-[#0a192f] via-[#142a4d] to-[#0a192f] border border-[#d4af37]/40 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#f5c451] text-slate-950">
                    <Sparkles className="w-3.5 h-3.5" /> Official In-Platform Community
                  </span>
                  <h3 className="text-xl font-extrabold text-white">
                    Live Chat Channels & Technical Discussion Boards
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Access dedicated course cohorts, ask questions directly to instructors, share code snippets, and collaborate with fellow builders right inside Digital Wealth Creators (DWC).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate('/community')}
                    className="px-5 py-2.5 bg-[#f5c451] hover:bg-[#d4af37] text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Launch Community Hub →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/community/forums')}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Browse Forum Topics</span>
                  </button>
                </div>
              </div>

              {/* Quick Cohort Shortcuts */}
              <div className="mt-6 pt-5 border-t border-slate-700/80">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Your Available Cohort Channels
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {communityChannels.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => navigate(`/community/channels/${ch.id}`)}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#061224]/80 hover:bg-[#162a4d] border border-slate-700/60 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="p-1.5 rounded-lg bg-amber-400/20 text-[#f5c451] group-hover:bg-[#f5c451] group-hover:text-slate-950 transition-colors">
                          <Hash className="w-3.5 h-3.5" />
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-bold text-white group-hover:text-[#f5c451] transition-colors truncate">
                            {ch.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{ch.description}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#f5c451] shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Legacy WhatsApp Groups Archive */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-700">
                  External WhatsApp Groups (Legacy Archive)
                </h3>
                <span className="text-xs text-slate-500">
                  Maintained for backwards compatibility
                </span>
              </div>

              {eligibleWhatsAppGroups.length === 0 ? (
                <div className="border border-slate-200 rounded-xl p-8 text-center bg-slate-50">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No legacy WhatsApp archives attached.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {eligibleWhatsAppGroups.map((group) => (
                    <div
                      key={group.id}
                      className="border border-slate-200 rounded-xl bg-white p-4 flex flex-col justify-between gap-3 shadow-sm"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span className="uppercase tracking-wider text-slate-700">
                            {group.visibility === 'public' ? 'Public' : 'Cohort'}
                          </span>
                          <span>{group.membersCount} members</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{group.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{group.description}</p>
                      </div>
                      <a
                        href={group.inviteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => joinWhatsAppGroup(group.id)}
                        className="w-full py-2 px-3 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Open WhatsApp Group Archive</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Orders, Invoices & Refunds Tab */}
        {activeTab === 'orders' && (
          <section className="space-y-4">
            {userOrders.length === 0 ? (
              <p className="text-sm text-slate-600">You have not placed any orders yet.</p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                    <tr>
                      <th className="px-5 py-3">Order ID</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Items</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Total</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {userOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                          {ord.id}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {ord.createdAt.slice(0, 10)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-800">
                          {ord.items.map((i) => i.productTitle).join(', ')}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`font-semibold capitalize ${
                                ord.status === 'completed'
                                  ? 'text-emerald-700'
                                  : ord.status === 'pending'
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {ord.status}
                            </span>
                            {ord.refundStatus && ord.refundStatus !== 'none' && (
                              <span className="text-xs font-semibold text-amber-700">
                                (Refund {ord.refundStatus})
                              </span>
                            )}
                            {ord.status === 'pending' && ord.paymentMethod === 'gtb_whatsapp' && (
                              <a
                                href={buildWhatsAppUrl(
                                  buildBankTransferWhatsAppMessage({
                                    orderId: ord.id,
                                    customerName: ord.customerName,
                                    customerEmail: ord.customerEmail,
                                    items: ord.items.map((i) => i.productTitle),
                                    total: ord.total,
                                    paymentReference: ord.paymentReference,
                                  })
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>Send GTB Proof</span>
                              </a>
                            )}
                            {ord.status === 'pending' &&
                              ord.paymentMethod !== 'gtb_whatsapp' &&
                              ord.paymentReference && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const check = await verifyPaystackReference(
                                      ord.paymentReference!
                                    );
                                    if (!check.verified) {
                                      showToast(check.message);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Verify Paystack</span>
                                </button>
                              )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                          {formatNaira(ord.total)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setInvoiceOrder(ord)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Invoice</span>
                            </button>
                            {ord.status === 'completed' &&
                              ord.total > 0 &&
                              (!ord.refundStatus || ord.refundStatus === 'none') && (
                                <button
                                  type="button"
                                  onClick={() => setRefundOrderId(ord.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200 rounded hover:bg-rose-50 cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Refund</span>
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Owned Digital Products Grid */}
        {activeTab !== 'wishlist' &&
          activeTab !== 'orders' &&
          activeTab !== 'communities' &&
          activeTab !== 'articles' && (
            <>
              {(activeTab === 'all' || activeTab === 'courses') &&
                ownedCoursesOverview.courseCount > 0 && (
                  <section
                    aria-label="Learning progress summary"
                    className="border border-slate-200 rounded-xl bg-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Learning Progress Overview
                      </p>
                      <h2 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">
                        {ownedCoursesOverview.overallPercent}% overall course completion
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 tabular-nums">
                        {ownedCoursesOverview.completedLectures}/{ownedCoursesOverview.totalLectures}{' '}
                        lessons · {ownedCoursesOverview.completedModules}/
                        {ownedCoursesOverview.totalModules} modules ·{' '}
                        {ownedCoursesOverview.completedCourses}/{ownedCoursesOverview.courseCount}{' '}
                        courses completed
                      </p>
                    </div>
                    <div className="w-full md:w-72 shrink-0 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 tabular-nums">
                        <span>Account Progress ({currentUser.name})</span>
                        <span>{ownedCoursesOverview.overallPercent}%</span>
                      </div>
                      <div
                        className="h-2.5 bg-slate-100 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={ownedCoursesOverview.overallPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Overall course progress"
                      >
                        <div
                          className={`h-full transition-all duration-300 ${
                            ownedCoursesOverview.overallPercent === 100
                              ? 'bg-emerald-600'
                              : accent.primaryBg
                          }`}
                          style={{ width: `${ownedCoursesOverview.overallPercent}%` }}
                        />
                      </div>
                    </div>
                  </section>
                )}

              {displayedProducts.length === 0 ? (
                <div className="border border-slate-200 rounded-xl p-12 text-center bg-slate-50">
                  <p className="font-display text-lg font-bold text-slate-900">
                    No items in this section yet
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Browse the marketplace to enroll in courses, download handbooks, or license tools.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="mt-4 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-md cursor-pointer"
                  >
                    Explore Marketplace
                  </button>
                </div>
              ) : (
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedProducts.map((prod) => {
                    const prog = getCourseProgress(prod.id);
                    const courseSummary =
                      prod.type === 'course'
                        ? getCourseProgressSummary(prod, prog?.completedLectureIds ?? [])
                        : null;
                    const pct = courseSummary?.percent ?? 0;
                    const orderMatch = findCompletedOrderForProduct(prod.id);
                    const dlUsed = orderMatch?.downloadCounts?.[prod.id] ?? 0;
                    const dlLimit = Math.min(prod.downloadLimit ?? MAX_DOWNLOADS_PER_ITEM, MAX_DOWNLOADS_PER_ITEM);
                    const downloadLimitReached = Boolean(orderMatch && dlUsed >= dlLimit);

                    return (
                      <article
                        key={prod.id}
                        className="border border-slate-200 rounded-lg bg-white overflow-hidden flex flex-col"
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                          <ProductThumbnail
                            src={prod.thumbnail}
                            alt={prod.title}
                            type={prod.type}
                            className="w-full h-full"
                          />
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-500">
                              {prod.formatLabel} · {prod.instructorName}
                            </p>
                            <h2 className="font-display text-base font-bold text-slate-900 mt-1">
                              {prod.title}
                            </h2>

                            {prod.type !== 'course' && (
                              <p className="text-[11px] text-slate-500 mt-1.5 tabular-nums">
                                Downloads used: {dlUsed} / {dlLimit}
                              </p>
                            )}

                            {prod.type === 'course' && courseSummary && (
                              <div className="mt-4 space-y-1.5">
                                <div className="flex justify-between items-baseline text-xs font-semibold text-slate-700 tabular-nums">
                                  <span>{pct}% complete</span>
                                  <span
                                    className={
                                      pct === 100 ? 'text-emerald-700 font-bold' : 'text-slate-500'
                                    }
                                  >
                                    {pct === 100
                                      ? 'Certificate Ready'
                                      : `${courseSummary.completedLectures}/${courseSummary.totalLectures} lessons · ${courseSummary.completedModules}/${courseSummary.totalModules} modules`}
                                  </span>
                                </div>
                                <div
                                  className="h-2 bg-slate-100 rounded-full overflow-hidden"
                                  role="progressbar"
                                  aria-valuenow={pct}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-label={`${prod.title} completion`}
                                >
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      pct === 100 ? 'bg-emerald-600' : accent.primaryBg
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                {prog?.certificateCode && (
                                  <p className="text-[11px] font-mono text-emerald-700 inline-flex items-center gap-1 pt-0.5">
                                    <Award className="w-3.5 h-3.5" />
                                    Cert ID: {prog.certificateCode}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {prod.type === 'course' && (
                            <button
                              type="button"
                              onClick={() => navigate(`/learn/${prod.id}`)}
                              className={`w-full py-2.5 px-4 text-xs font-bold text-white ${accent.primaryBg} ${accent.primaryHoverBg} rounded-md inline-flex items-center justify-center gap-2 cursor-pointer`}
                            >
                              <PlayCircle className="w-4 h-4" />
                              <span>{pct > 0 ? 'Continue Course' : 'Start Course'}</span>
                            </button>
                          )}

                          {prod.type === 'ebook' && (
                            <div
                              className={
                                prod.ebookData
                                  ? 'grid grid-cols-2 gap-2'
                                  : 'grid grid-cols-1 gap-2'
                              }
                            >
                              {prod.ebookData && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReaderEbook(prod);
                                    setReaderChapterIdx(0);
                                  }}
                                  className={`py-2.5 px-3 text-xs font-bold text-white ${accent.primaryBg} ${accent.primaryHoverBg} rounded-md inline-flex items-center justify-center gap-1.5 cursor-pointer`}
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                  <span>Read Online</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  downloadLimitReached
                                    ? handleReferFreshPayment(prod)
                                    : handleDownloadEbook(prod)
                                }
                                className={`py-2.5 px-3 text-xs font-bold rounded-md inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                                  downloadLimitReached
                                    ? 'bg-amber-500 text-[#0a192f] hover:bg-amber-400'
                                    : prod.ebookData
                                      ? 'text-slate-900 border border-slate-300 hover:bg-slate-50'
                                      : `text-white ${accent.primaryBg} ${accent.primaryHoverBg}`
                                }`}
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>
                                  {downloadLimitReached
                                    ? `Pay Afresh (${dlUsed}/${dlLimit})`
                                    : prod.ebookData
                                      ? 'Download PDF Book'
                                      : `Download ${formatProductTypeLabel(
                                          prod.type,
                                          prod.digitalSubType
                                        )}`}
                                </span>
                              </button>
                            </div>
                          )}

                          {prod.type === 'software' && (
                            <button
                              type="button"
                              onClick={() =>
                                downloadLimitReached
                                  ? handleReferFreshPayment(prod)
                                  : handleDownloadSoftware(prod)
                              }
                              className={`w-full py-2.5 px-4 text-xs font-bold rounded-md inline-flex items-center justify-center gap-2 cursor-pointer ${
                                downloadLimitReached
                                  ? 'bg-amber-500 text-[#0a192f] hover:bg-amber-400'
                                  : 'text-white bg-slate-900 hover:bg-slate-800'
                              }`}
                            >
                              <Code2 className="w-4 h-4" />
                              <span>
                                {downloadLimitReached
                                  ? `Pay Afresh (${dlUsed}/${dlLimit} Limit Reached)`
                                  : `Download v${prod.softwareData?.version ?? '1.0'} Package`}
                              </span>
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}

              {/* Software License Key Manager */}
              {(activeTab === 'all' || activeTab === 'software') && userLicenses.length > 0 && (
                <section className="pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-[#5624d0]" />
                    <h2 className="font-display text-xl font-extrabold text-slate-900">
                      Software License Keys & Domain Activations
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {userLicenses.map((lic) => (
                      <div
                        key={lic.id}
                        className="border border-slate-200 rounded-xl bg-white p-6 space-y-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-display text-base font-bold text-slate-900">
                                {lic.productTitle}
                              </h3>
                              <span
                                className={`text-xs font-bold ${
                                  lic.status === 'active'
                                    ? 'text-emerald-700'
                                    : 'text-rose-700'
                                }`}
                              >
                                {lic.status === 'active' ? 'Active License' : 'Revoked'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                              {lic.tierName} · Order {lic.orderId} · {lic.activatedDomains.length} /{' '}
                              {lic.maxSeats} seats used
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <code className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded font-mono text-sm font-bold text-slate-900 select-all">
                              {lic.key}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyKey(lic.key)}
                              aria-label={`Copy license key ${lic.key}`}
                              className="p-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => regenerateLicenseKey(lic.id)}
                              title="Rotate license key"
                              aria-label={`Rotate key for ${lic.productTitle}`}
                              className="p-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                          <div className="lg:col-span-6 space-y-2">
                            <p className="text-xs font-bold text-slate-700">Activated Domains</p>
                            {lic.activatedDomains.length === 0 ? (
                              <p className="text-xs text-slate-500">
                                No domains bound yet. Activate a domain to unlock production builds.
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                {lic.activatedDomains.map((dom) => (
                                  <div
                                    key={dom}
                                    className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs"
                                  >
                                    <span className="font-mono text-slate-800 inline-flex items-center gap-1.5">
                                      <ExternalLink className="w-3 h-3 text-slate-400" />
                                      {dom}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => deactivateLicenseDomain(lic.id, dom)}
                                      aria-label={`Deactivate ${dom}`}
                                      className="text-rose-600 hover:text-rose-800 inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Deactivate</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="lg:col-span-6 space-y-1.5">
                            <label
                              htmlFor={`domain-input-${lic.id}`}
                              className="block text-xs font-bold text-slate-700"
                            >
                              Activate New Production Domain
                            </label>
                            <div className="flex gap-2">
                              <input
                                id={`domain-input-${lic.id}`}
                                type="text"
                                value={domainInputs[lic.id] ?? ''}
                                onChange={(e) =>
                                  setDomainInputs((prev) => ({
                                    ...prev,
                                    [lic.id]: e.target.value,
                                  }))
                                }
                                placeholder="app.yourdomain.com"
                                className="flex-1 h-9 px-3 text-xs font-mono border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                              />
                              <button
                                type="button"
                                onClick={() => handleActivateDomain(lic.id)}
                                className={`px-4 h-9 text-xs font-bold text-white ${accent.primaryBg} ${accent.primaryHoverBg} rounded-md inline-flex items-center gap-1 cursor-pointer`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Activate</span>
                              </button>
                            </div>
                            {domainErrors[lic.id] && (
                              <p className="text-xs text-rose-700 font-medium">
                                {domainErrors[lic.id]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
      </div>

      {/* Itemized Order Invoice Modal */}
      {invoiceOrder && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Invoice for ${invoiceOrder.id}`}
        >
          <div className="bg-white rounded-xl max-w-xl w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-[#0a192f] text-white border-b-2 border-[#d4af37] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#f5c451]">Official Digital Invoice</p>
                <h3 className="font-display text-base font-bold">Order {invoiceOrder.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceOrder(null)}
                aria-label="Close invoice dialog"
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div>
                  <p className="text-slate-500 font-semibold">Billed To</p>
                  <p className="font-bold text-slate-900 mt-0.5">{invoiceOrder.customerName}</p>
                  <p className="text-slate-600">{invoiceOrder.customerEmail}</p>
                </div>
                <div className="text-right tabular-nums">
                  <p className="text-slate-500 font-semibold">Issued Date</p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {invoiceOrder.createdAt.slice(0, 10)}
                  </p>
                  <p className="text-slate-600 capitalize">Status: {invoiceOrder.status}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                {invoiceOrder.items.map((item) => (
                  <div key={item.productId} className="p-3 flex justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{item.productTitle}</p>
                      <p className="text-[11px] text-slate-500">
                        {formatProductTypeLabel(item.productType)}
                        {item.variantName ? ` · ${item.variantName}` : ''}
                        {item.sku ? ` · SKU ${item.sku}` : ''}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatNaira(item.price)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right tabular-nums">
                <p className="text-slate-600">Subtotal: {formatNaira(invoiceOrder.subtotal)}</p>
                {invoiceOrder.discount > 0 && (
                  <p className="text-emerald-700">
                    Coupon Discount: -{formatNaira(invoiceOrder.discount)}
                  </p>
                )}
                {(invoiceOrder.membershipDiscount ?? 0) > 0 && (
                  <p className="text-emerald-700">
                    Membership Savings: -{formatNaira(invoiceOrder.membershipDiscount!)}
                  </p>
                )}
                <p className="text-base font-extrabold text-slate-900 pt-1">
                  Total Paid: {formatNaira(invoiceOrder.total)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadInvoiceHtml(invoiceOrder)}
                className="w-full py-2.5 text-xs font-bold bg-[#0a192f] text-[#f5c451] rounded-md inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download HTML Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      {refundOrderId && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Request refund"
        >
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900">
                Request 30-Day Refund · {refundOrderId}
              </h3>
              <button
                type="button"
                onClick={() => setRefundOrderId(null)}
                aria-label="Close refund dialog"
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitRefund} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Refund Request
                </label>
                <textarea
                  rows={3}
                  value={refundReasonInput}
                  onChange={(e) => setRefundReasonInput(e.target.value)}
                  placeholder="Describe what did not meet your expectations..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRefundOrderId(null)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 border border-slate-300 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-700 rounded cursor-pointer"
                >
                  Submit Refund Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive eBook Reader Modal */}
      {readerEbook && readerEbook.ebookData && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Digital eBook reader"
        >
          <div className="bg-white rounded-xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">
                  Interactive eBook Reader · {readerEbook.instructorName}
                </p>
                <h3 className="font-display text-base font-bold text-slate-900 truncate">
                  {readerEbook.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setReaderFontLarge((prev) => !prev)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
                >
                  {readerFontLarge ? 'Standard Font' : 'Large Font'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadEbook(readerEbook)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-md hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Book</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReaderEbook(null)}
                  aria-label="Close reader"
                  className="p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
              <aside className="md:col-span-4 border-r border-slate-200 bg-slate-50 overflow-y-auto p-4 space-y-1">
                <p className="text-xs font-bold text-slate-500 px-2 mb-2">Chapters</p>
                {readerEbook.ebookData.chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setReaderChapterIdx(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-xs transition-colors cursor-pointer ${
                      readerChapterIdx === idx
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    {ch.number}. {ch.title}
                  </button>
                ))}
              </aside>
              <ContentProtectionWrapper
                enabled={Boolean(
                  readerEbook &&
                    isCopyProtectionActive(
                      readerEbook.copyProtectionEnabled,
                      appearance?.globalCopyProtection
                    )
                )}
                className="relative md:col-span-8 overflow-y-auto p-6 sm:p-10 space-y-4"
              >
                <DynamicWatermarkOverlay
                  user={currentUser}
                  visible={Boolean(
                    readerEbook &&
                      isCopyProtectionActive(
                        readerEbook.copyProtectionEnabled,
                        appearance?.globalCopyProtection
                      )
                  )}
                />
                {(() => {
                  const activeChap =
                    readerEbook.ebookData.chapters[readerChapterIdx] ??
                    readerEbook.ebookData.chapters[0];
                  if (!activeChap) return null;
                  return (
                    <>
                      <p className="text-xs font-semibold text-[#5624d0]">
                        Chapter {activeChap.number} · {activeChap.pages} pages
                      </p>
                      <h4 className="font-display text-2xl font-extrabold text-slate-900">
                        {activeChap.title}
                      </h4>
                      {(() => {
                        const isEnquiry = readerEbook.id === 'prod-ebook-enquiry-to-customer' || readerEbook.slug.includes('enquiry-to-customer');
                        return (
                          <div className={`space-y-4 text-slate-800 leading-relaxed ${readerFontLarge ? 'text-lg' : 'text-base'}`}>
                            <div className="p-4 rounded-lg bg-slate-50 border-l-4 border-[#0a192f] space-y-2">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#0a192f]">Opening Scenario</p>
                              <p className="text-sm italic text-slate-700">{activeChap.previewExcerpt}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-[#0a192f] text-white space-y-2">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">Core Learning Objectives & Execution</p>
                              <p className="text-sm leading-relaxed text-slate-200">
                                Master foundational customer communication: ask qualifying discovery questions, structure transparent pricing with delivery timelines, verify bank transfers independently, and comply with NDPA 2023 and FCCPA 2018.
                              </p>
                            </div>
                            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2 text-slate-800">
                              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Action Checklist</p>
                              <ul className="text-xs space-y-1 text-slate-700 list-disc list-inside">
                                <li>Respond to incoming enquiries within stated business hours using the 5-point structure.</li>
                                <li>Confirm item specifications, total charges, and delivery landmark before sending account details.</li>
                                <li>Verify cleared funds in banking app prior to courier dispatch.</li>
                              </ul>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}
              </ContentProtectionWrapper>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
