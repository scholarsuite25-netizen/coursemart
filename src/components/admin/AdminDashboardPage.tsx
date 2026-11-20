import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle2,
  Copy,
  Crown,
  Edit3,
  ExternalLink,
  FileText,
  Globe,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  Package,
  Paintbrush,
  Plus,
  RotateCcw,
  Share2,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type {
  BlogCategory,
  BlogPost,
  Coupon,
  DigitalResourceSubType,
  MembershipPlan,
  MembershipTierId,
  OrderStatus,
  Product,
  ProductType,
  ShowcaseSite,
  StorefrontAppearance,
  UserMembership,
  UserRole,
  WhatsAppGroup,
} from '../../types/marketplace';
import {
  BLOG_CATEGORY_ITEMS,
  DIGITAL_SUBMENU_ITEMS,
  filterAndSortBlogPosts,
  getDigitalSubType,
} from '../../utils/catalogAndBlogs';
import { MEDIA_LIBRARY_ASSETS } from '../../utils/editorial';
import { formatNaira } from '../../utils/currency';
import { formatProductTypeLabel } from '../../utils/theme';
import { isValidWhatsAppInviteUrl, TINTOL_PAYMENT_DETAILS } from '../../utils/whatsapp';
import { BlogEditorModal } from '../blog/BlogEditorModal';
import { EmailBroadcastPanel } from './EmailBroadcastPanel';
import { EventsManagerPanel } from './EventsManagerPanel';
import { ProductEditorModal } from './ProductEditorModal';
import { SocialQueuePanel } from './SocialQueuePanel';

type AdminTab =
  | 'dashboard'
  | 'products'
  | 'events'
  | 'blogs'
  | 'email'
  | 'social'
  | 'orders'
  | 'coupons'
  | 'membership'
  | 'affiliates'
  | 'showcase'
  | 'whatsapp'
  | 'users'
  | 'appearance';

export function AdminDashboardPage() {
  const {
    currentUser,
    products,
    blogPosts,
    orders,
    licenses,
    coupons,
    users,
    whatsappGroups,
    appearance,
    membershipPlans,
    userMemberships,
    affiliates,
    affiliateConversions,
    affiliatePayouts,
    showcaseSites,
    adminSessionVerified,
    navigate,
    logout,
    upsertProduct,
    deleteProduct,
    duplicateProduct,
    upsertBlogPost,
    deleteBlogPost,
    toggleBlogPostStatus,
    deleteBlogComment,
    updateOrderStatus,
    resolveOrderRefund,
    toggleLicenseStatus,
    upsertCoupon,
    deleteCoupon,
    upsertWhatsAppGroup,
    deleteWhatsAppGroup,
    toggleWhatsAppGroupStatus,
    updateMembershipPlan,
    assignMembershipByAdmin,
    updateAffiliateCommissionRate,
    updateAffiliateConversionStatus,
    updateAffiliatePayoutStatus,
    upsertShowcaseSite,
    toggleShowcaseSite,
    deleteShowcaseSite,
    updateUserRole,
    updateAppearance,
    resetDemoDatabase,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null | undefined>(undefined);
  const [productSearch, setProductSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<ProductType | 'all'>('all');
  const [digitalSubFilter, setDigitalSubFilter] = useState<DigitalResourceSubType | 'all'>('all');
  const [blogCategoryFilter, setBlogCategoryFilter] = useState<BlogCategory | 'all'>('all');
  const [blogSearch, setBlogSearch] = useState('');

  // Coupon creation state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed'>('percent');
  const [newCouponValue, setNewCouponValue] = useState('25');
  const [newCouponMinSpend, setNewCouponMinSpend] = useState('30');

  // WhatsApp Group creation state
  const [waName, setWaName] = useState('');
  const [waUrl, setWaUrl] = useState('');
  const [waCategory, setWaCategory] = useState<WhatsAppGroup['category']>('course');
  const [waVisibility, setWaVisibility] = useState<WhatsAppGroup['visibility']>('public');
  const [waProductId, setWaProductId] = useState('');
  const [waMaxMembers, setWaMaxMembers] = useState('500');
  const [waDescription, setWaDescription] = useState('');
  const [waError, setWaError] = useState<string | null>(null);

  // Membership assignment & plan draft state
  const [assignUserId, setAssignUserId] = useState('');
  const [assignPlanId, setAssignPlanId] = useState<MembershipTierId>('pro');
  const [assignStatus, setAssignStatus] = useState<UserMembership['status']>('active');
  const [planDrafts, setPlanDrafts] = useState<Record<MembershipTierId, MembershipPlan>>(() =>
    membershipPlans.reduce(
      (acc, plan) => ({ ...acc, [plan.id]: { ...plan } }),
      {} as Record<MembershipTierId, MembershipPlan>
    )
  );

  // Showcase Site CRUD state
  const [showId, setShowId] = useState<string | null>(null);
  const [showName, setShowName] = useState('');
  const [showUrl, setShowUrl] = useState('');
  const [showImage, setShowImage] = useState<string>(MEDIA_LIBRARY_ASSETS[0]?.url || '');
  const [showOrder, setShowOrder] = useState('1');
  const [showError, setShowError] = useState<string | null>(null);

  // Appearance draft state
  const [appearanceDraft, setAppearanceDraft] = useState<StorefrontAppearance>(appearance);

  const analytics = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const grossRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const activeLicenses = licenses.filter((l) => l.status === 'active').length;
    const totalEnrollments = products.reduce((sum, p) => sum + p.studentsCount, 0);

    const revByType: Record<ProductType, number> = { course: 0, ebook: 0, software: 0 };
    completedOrders.forEach((o) =>
      o.items.forEach((item) => {
        revByType[item.productType] += item.price;
      })
    );
    const maxTypeRev = Math.max(1, revByType.course, revByType.ebook, revByType.software);

    return {
      grossRevenue,
      completedCount: completedOrders.length,
      activeLicenses,
      totalEnrollments,
      revByType,
      maxTypeRev,
    };
  }, [orders, licenses, products]);

  if (!currentUser || currentUser.role !== 'admin' || !adminSessionVerified) {
    return (
      <main className="min-h-screen bg-[#f0f0f1] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#c3c4c7] p-8 text-center space-y-4">
          <h1 className="font-display text-xl font-bold text-[#1d2327]">
            Administrator Authentication Required
          </h1>
          <p className="text-sm text-slate-600">
            Access to the operations command center requires verified administrator credentials and an active server session.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin-login')}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm cursor-pointer"
            >
              Sign In via Admin Portal
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 text-xs font-bold text-[#1d2327] border border-[#8c8f94] rounded-sm hover:bg-slate-50 cursor-pointer"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </main>
    );
  }

  const filteredProducts = products.filter((p) => {
    if (productTypeFilter !== 'all' && p.type !== productTypeFilter) return false;
    if (
      productTypeFilter === 'ebook' &&
      digitalSubFilter !== 'all' &&
      getDigitalSubType(p) !== digitalSubFilter
    ) {
      return false;
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.instructorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredBlogs = filterAndSortBlogPosts(blogPosts, {
    category: blogCategoryFilter,
    search: blogSearch,
    includeDrafts: true,
  });

  const allBlogComments = blogPosts.flatMap((post) =>
    post.comments.map((comment) => ({
      postId: post.id,
      postTitle: post.title,
      postSlug: post.slug,
      comment,
    }))
  );

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCouponCode.trim().toUpperCase();
    if (!cleanCode) return;
    const newC: Coupon = {
      id: `coup-${Date.now()}`,
      code: cleanCode,
      discountType: newCouponType,
      value: Math.max(1, Number(newCouponValue) || 10),
      minSpend: Math.max(0, Number(newCouponMinSpend) || 0),
      active: true,
      usageCount: 0,
      maxUses: 500,
      expiresAt: '2028-12-31T23:59:59Z',
    };
    upsertCoupon(newC);
    setNewCouponCode('');
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const next = [...appearanceDraft.sectionOrder];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setAppearanceDraft((prev) => ({ ...prev, sectionOrder: next }));
  };

  const handleCreateWhatsAppGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setWaError(null);
    if (!waName.trim()) {
      setWaError('Group name is required.');
      return;
    }
    if (!isValidWhatsAppInviteUrl(waUrl)) {
      setWaError('Enter a valid https://chat.whatsapp.com/... or https://wa.me/... invite link.');
      return;
    }
    const newGroup: WhatsAppGroup = {
      id: `wag-${Date.now()}`,
      name: waName.trim(),
      description:
        waDescription.trim() ||
        'Managed WhatsApp community for students, announcements, and peer support.',
      inviteUrl: waUrl.trim(),
      category: waCategory,
      productId: waProductId || undefined,
      membersCount: 1,
      maxMembers: Math.max(10, Number(waMaxMembers) || 500),
      active: true,
      visibility: waVisibility,
      createdAt: new Date().toISOString(),
    };
    upsertWhatsAppGroup(newGroup);
    setWaName('');
    setWaUrl('');
    setWaProductId('');
    setWaDescription('');
  };

  const handleShowcaseFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setShowError('Please upload an image under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setShowImage(reader.result);
        setShowError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveShowcaseSite = (e: React.FormEvent) => {
    e.preventDefault();
    setShowError(null);
    if (!showName.trim()) {
      setShowError('Website name is required.');
      return;
    }
    const cleanUrl = showUrl.trim();
    if (!/^https?:\/\/\S+/i.test(cleanUrl)) {
      setShowError('Website URL must start with https:// or http://');
      return;
    }
    const cleanImage = showImage.trim() || MEDIA_LIBRARY_ASSETS[0]?.url || '';
    if (!cleanImage) {
      setShowError('Select or upload a website preview image.');
      return;
    }
    const existing = showId ? showcaseSites.find((s) => s.id === showId) : undefined;
    const site: ShowcaseSite = {
      id: existing?.id || `show-${Date.now()}`,
      name: showName.trim(),
      url: cleanUrl,
      image: cleanImage,
      active: existing ? existing.active : true,
      order: Math.max(1, Number(showOrder) || showcaseSites.length + 1),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    upsertShowcaseSite(site);
    setShowId(null);
    setShowName('');
    setShowUrl('');
    setShowImage(MEDIA_LIBRARY_ASSETS[0]?.url || '');
    setShowOrder(String(showcaseSites.length + 2));
  };

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'events', label: 'Events & Roster', icon: Calendar },
    { id: 'blogs', label: 'Blogs & Comments', icon: FileText },
    { id: 'email', label: 'Email Broadcast', icon: Mail },
    { id: 'social', label: 'Social Queue', icon: Sparkles },
    { id: 'orders', label: 'Orders & Licenses', icon: ShoppingBag },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'membership', label: 'Membership', icon: Crown },
    { id: 'affiliates', label: 'Affiliates', icon: Share2 },
    { id: 'showcase', label: 'Showcase', icon: Globe },
    { id: 'whatsapp', label: 'WhatsApp Groups', icon: MessageCircle },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'appearance', label: 'Appearance', icon: Paintbrush },
  ];

  return (
    <div className="min-h-screen bg-[#f0f0f1] flex flex-col">
      {/* Admin Console Top Bar */}
      <header className="h-10 bg-[#1d2327] text-white px-4 flex items-center justify-between text-xs border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-display font-bold text-white whitespace-nowrap">
            {appearance.brandName} Admin
          </span>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-[#72aee6] whitespace-nowrap cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Visit Site</span>
          </button>
          <button
            type="button"
            onClick={() => setEditingProduct(null)}
            className="hidden sm:inline-flex items-center gap-1 text-slate-300 hover:text-[#72aee6] whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Product</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-slate-300">
            Howdy, <strong className="text-white">{currentUser.name}</strong>
          </span>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Admin Dark Sidebar */}
        <aside
          className="w-full md:w-[220px] bg-[#1d2327] text-slate-200 shrink-0"
          aria-label="Admin navigation"
        >
          <nav className="flex md:flex-col overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-left whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#2271b1] text-white'
                      : 'text-slate-300 hover:bg-[#2c3338] hover:text-[#72aee6]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="hidden md:block px-4 pt-6 pb-4 mt-4 border-t border-slate-700/70">
            <button
              type="button"
              onClick={resetDemoDatabase}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-slate-300 border border-slate-600 rounded-sm hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Seed Database</span>
            </button>
          </div>
        </aside>

        {/* Main Admin Content Canvas */}
        <main className="flex-1 p-5 sm:p-7 space-y-6 overflow-x-hidden">
          {/* 1. DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-display text-2xl font-bold text-[#1d2327]">Dashboard</h1>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('products');
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* 4 KPI Metaboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white border border-[#c3c4c7] p-4 rounded-sm">
                  <p className="text-xs font-semibold text-slate-500">Gross Store Revenue</p>
                  <p className="font-display text-2xl font-extrabold text-[#1d2327] mt-1 tabular-nums">
                    {formatNaira(analytics.grossRevenue)}
                  </p>
                </div>
                <div className="bg-white border border-[#c3c4c7] p-4 rounded-sm">
                  <p className="text-xs font-semibold text-slate-500">Completed Orders</p>
                  <p className="font-display text-2xl font-extrabold text-[#1d2327] mt-1 tabular-nums">
                    {analytics.completedCount}
                  </p>
                </div>
                <div className="bg-white border border-[#c3c4c7] p-4 rounded-sm">
                  <p className="text-xs font-semibold text-slate-500">Active License Keys</p>
                  <p className="font-display text-2xl font-extrabold text-[#1d2327] mt-1 tabular-nums">
                    {analytics.activeLicenses}
                  </p>
                </div>
                <div className="bg-white border border-[#c3c4c7] p-4 rounded-sm">
                  <p className="text-xs font-semibold text-slate-500">Total Learners & Buyers</p>
                  <p className="font-display text-2xl font-extrabold text-[#1d2327] mt-1 tabular-nums">
                    {analytics.totalEnrollments.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Metabox Split: Revenue by Format & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <section className="lg:col-span-5 bg-white border border-[#c3c4c7] rounded-sm">
                  <div className="px-4 py-3 border-b border-[#c3c4c7]">
                    <h2 className="font-display text-sm font-bold text-[#1d2327]">
                      Revenue by Product Format
                    </h2>
                  </div>
                  <div className="p-4 space-y-4">
                    {(['course', 'ebook', 'software'] as ProductType[]).map((t) => {
                      const val = analytics.revByType[t];
                      const pct = Math.round((val / analytics.maxTypeRev) * 100);
                      const typeTitle =
                        t === 'ebook' ? 'Digital Products' : formatProductTypeLabel(t);
                      return (
                        <div key={t} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold text-slate-700 tabular-nums">
                            <span>{typeTitle}</span>
                            <span>{formatNaira(val)}</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-sm overflow-hidden">
                            <div
                              className="h-full bg-[#2271b1]"
                              style={{ width: `${Math.max(4, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="lg:col-span-7 bg-white border border-[#c3c4c7] rounded-sm">
                  <div className="px-4 py-3 border-b border-[#c3c4c7] flex items-center justify-between">
                    <h2 className="font-display text-sm font-bold text-[#1d2327]">
                      Recent Marketplace Orders
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-semibold text-[#2271b1] hover:underline cursor-pointer"
                    >
                      View all orders
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="px-4 py-2.5">Order</th>
                          <th className="px-4 py-2.5">Customer</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 tabular-nums">
                        {orders.slice(0, 5).map((ord) => (
                          <tr key={ord.id}>
                            <td className="px-4 py-2.5 font-mono font-bold text-[#2271b1]">
                              {ord.id}
                            </td>
                            <td className="px-4 py-2.5 text-slate-800">{ord.customerName}</td>
                            <td className="px-4 py-2.5 capitalize font-semibold text-emerald-700">
                              {ord.status}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold">
                              {formatNaira(ord.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* 2. PRODUCTS CRUD */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-display text-2xl font-bold text-[#1d2327]">Products</h1>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New</span>
                </button>
              </div>

              <div className="bg-white border border-[#c3c4c7] p-3 rounded-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'course', label: 'Video Courses' },
                      { id: 'ebook', label: 'Digital Products' },
                      { id: 'software', label: 'Software & License' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setProductTypeFilter(t.id);
                        if (t.id !== 'ebook') setDigitalSubFilter('all');
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-sm cursor-pointer ${
                        productTypeFilter === t.id
                          ? 'bg-[#2271b1] text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}

                  {productTypeFilter === 'ebook' && (
                    <select
                      aria-label="Filter digital resource subtype"
                      value={digitalSubFilter}
                      onChange={(e) =>
                        setDigitalSubFilter(e.target.value as DigitalResourceSubType | 'all')
                      }
                      className="h-8 px-2 text-xs border border-[#8c8f94] rounded-sm bg-white"
                    >
                      <option value="all">All Digital Subtypes</option>
                      {DIGITAL_SUBMENU_ITEMS.map((sub) => (
                        <option key={sub.subType} value={sub.subType}>
                          {sub.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <input
                  type="search"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  aria-label="Filter admin products"
                  className="h-8 px-3 text-xs border border-[#8c8f94] rounded-sm bg-white"
                />
              </div>

              <div className="bg-white border border-[#c3c4c7] rounded-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-[#c3c4c7] text-slate-700 font-bold">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 tabular-nums">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#2271b1] text-sm">{p.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {p.instructorName} · {p.studentsCount.toLocaleString()} buyers
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatProductTypeLabel(p.type, p.digitalSubType)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{p.category}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {formatNaira(p.price)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              upsertProduct({
                                ...p,
                                status: p.status === 'published' ? 'draft' : 'published',
                              })
                            }
                            className={`font-bold capitalize underline cursor-pointer ${
                              p.status === 'published' ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {p.status}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingProduct(p)}
                              aria-label={`Edit ${p.title}`}
                              className="p-1.5 text-[#2271b1] hover:bg-blue-50 rounded cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicateProduct(p.id)}
                              aria-label={`Duplicate ${p.title}`}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProduct(p.id)}
                              aria-label={`Delete ${p.title}`}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2B. BLOGS & COMMENTS CMS */}
          {activeTab === 'blogs' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#1d2327]">
                    Blogs & Reader Comments CMS
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Publish editorial articles across AI, Mentorship, Leadership, Vibe Coding, and
                    Apps Deployment, link matching products, and moderate comments.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingBlog(null)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Write New Article</span>
                </button>
              </div>

              <div className="bg-white border border-[#c3c4c7] p-3 rounded-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBlogCategoryFilter('all')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-sm cursor-pointer ${
                      blogCategoryFilter === 'all'
                        ? 'bg-[#2271b1] text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    All ({blogPosts.length})
                  </button>
                  {BLOG_CATEGORY_ITEMS.map((cat) => (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => setBlogCategoryFilter(cat.category)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-sm cursor-pointer ${
                        blogCategoryFilter === cat.category
                          ? 'bg-[#2271b1] text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat.category}
                    </button>
                  ))}
                </div>
                <input
                  type="search"
                  value={blogSearch}
                  onChange={(e) => setBlogSearch(e.target.value)}
                  placeholder="Search articles..."
                  aria-label="Filter admin blog articles"
                  className="h-8 px-3 text-xs border border-[#8c8f94] rounded-sm bg-white"
                />
              </div>

              <div className="bg-white border border-[#c3c4c7] rounded-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-[#c3c4c7] text-slate-700 font-bold">
                    <tr>
                      <th className="px-4 py-3">Article Title</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Author</th>
                      <th className="px-4 py-3">Linked Items</th>
                      <th className="px-4 py-3">Comments</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 tabular-nums">
                    {filteredBlogs.map((post) => (
                      <tr key={post.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#2271b1] text-sm">{post.title}</p>
                          <p className="text-[11px] text-slate-500">
                            /blog/{post.slug} · {post.readTimeMinutes} min read
                          </p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{post.category}</td>
                        <td className="px-4 py-3 text-slate-700">{post.authorName}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {post.relatedProductIds.length} products
                        </td>
                        <td className="px-4 py-3 text-slate-700">{post.comments.length}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleBlogPostStatus(post.id)}
                            className={`font-bold capitalize underline cursor-pointer ${
                              post.status === 'published' ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {post.status}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/blog/${post.slug}`)}
                              aria-label={`Open ${post.title}`}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingBlog(post)}
                              aria-label={`Edit ${post.title}`}
                              className="p-1.5 text-[#2271b1] hover:bg-blue-50 rounded cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteBlogPost(post.id)}
                              aria-label={`Delete ${post.title}`}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reader Comments Moderation Panel */}
              <section className="bg-white border border-[#c3c4c7] rounded-sm overflow-x-auto">
                <div className="px-4 py-3 border-b border-[#c3c4c7] font-display text-sm font-bold text-[#1d2327] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#2271b1]" />
                  <span>Recent Reader Comments Moderation ({allBlogComments.length})</span>
                </div>
                {allBlogComments.length === 0 ? (
                  <p className="p-5 text-xs text-slate-500">No reader comments yet.</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="px-4 py-2.5">Reader</th>
                        <th className="px-4 py-2.5">Article</th>
                        <th className="px-4 py-2.5">Comment</th>
                        <th className="px-4 py-2.5 text-right">Moderation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {allBlogComments.map(({ postId, postTitle, postSlug, comment }) => (
                        <tr key={comment.id}>
                          <td className="px-4 py-2.5 font-semibold text-slate-900">
                            {comment.userName}
                            <span className="block text-[10px] text-slate-500 capitalize">
                              {comment.userRole}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              type="button"
                              onClick={() => navigate(`/blog/${postSlug}`)}
                              className="text-[#2271b1] hover:underline font-medium text-left cursor-pointer"
                            >
                              {postTitle}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-slate-700 max-w-md">{comment.body}</td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => deleteBlogComment(postId, comment.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200 rounded-sm hover:bg-rose-50 cursor-pointer"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>
          )}

          {/* 3. ORDERS & LICENSES */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-[#1d2327]">
                Orders & License Key Registry
              </h1>

              <section className="bg-white border border-[#c3c4c7] rounded-sm overflow-x-auto">
                <div className="px-4 py-3 border-b border-[#c3c4c7] font-display text-sm font-bold text-[#1d2327]">
                  Orders ({orders.length})
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3">Payment / Ref</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3">Status & Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 tabular-nums">
                    {orders.map((ord) => (
                      <tr key={ord.id}>
                        <td className="px-4 py-3 font-mono font-bold text-[#2271b1]">
                          {ord.id}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{ord.customerName}</p>
                          <p className="text-[11px] text-slate-500">{ord.customerEmail}</p>
                          {ord.orderNotes && (
                            <p className="text-[11px] text-slate-600 mt-1 italic">
                              Note: {ord.orderNotes}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <p>{ord.items.map((i) => i.variantName ? `${i.productTitle} (${i.variantName})` : i.productTitle).join(', ')}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {ord.affiliateCode && (
                              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-sm">
                                Ref: {ord.affiliateCode}
                              </span>
                            )}
                            {Boolean(ord.membershipDiscount && ord.membershipDiscount > 0) && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-sm">
                                Member -{formatNaira(ord.membershipDiscount ?? 0)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <p className="font-semibold">
                            {ord.paymentMethod === 'gtb_whatsapp'
                              ? 'GTB + WhatsApp'
                              : ord.paymentMethod === 'paystack'
                              ? 'Paystack'
                              : 'Card'}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500">
                            {ord.paymentReference || ord.couponCode || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">{formatNaira(ord.total)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              aria-label={`Order status for ${ord.id}`}
                              value={ord.status}
                              onChange={(e) =>
                                updateOrderStatus(ord.id, e.target.value as OrderStatus)
                              }
                              className="h-8 px-2 text-xs border border-[#8c8f94] rounded-sm bg-white"
                            >
                              <option value="completed">Completed</option>
                              <option value="pending">Pending</option>
                              <option value="refunded">Refunded</option>
                            </select>
                            {ord.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => updateOrderStatus(ord.id, 'completed')}
                                className="h-8 px-2.5 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-sm inline-flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verify Payment & Unlock</span>
                              </button>
                            )}
                            {ord.refundStatus && ord.refundStatus !== 'none' && (
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm ${
                                  ord.refundStatus === 'requested'
                                    ? 'bg-amber-100 text-amber-800'
                                    : ord.refundStatus === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                Refund: {ord.refundStatus}
                              </span>
                            )}
                          </div>
                          {ord.refundStatus === 'requested' && (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-sm space-y-1.5">
                              {ord.refundReason && (
                                <p className="text-[11px] text-amber-900">
                                  Reason: {ord.refundReason}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => resolveOrderRefund(ord.id, 'approved')}
                                  className="px-2 py-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-sm cursor-pointer"
                                >
                                  Approve Refund
                                </button>
                                <button
                                  type="button"
                                  onClick={() => resolveOrderRefund(ord.id, 'declined')}
                                  className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-white border border-rose-300 hover:bg-rose-50 rounded-sm cursor-pointer"
                                >
                                  Decline Refund
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="bg-white border border-[#c3c4c7] rounded-sm overflow-x-auto">
                <div className="px-4 py-3 border-b border-[#c3c4c7] font-display text-sm font-bold text-[#1d2327] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#2271b1]" />
                  <span>Issued Software License Keys ({licenses.length})</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="px-4 py-3">License Key</th>
                      <th className="px-4 py-3">Software Product</th>
                      <th className="px-4 py-3">Seats Used</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 tabular-nums">
                    {licenses.map((lic) => (
                      <tr key={lic.id}>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {lic.key}
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          {lic.productTitle} ({lic.tierName})
                        </td>
                        <td className="px-4 py-3">
                          {lic.activatedDomains.length} / {lic.maxSeats}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-bold capitalize ${
                              lic.status === 'active' ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {lic.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => toggleLicenseStatus(lic.id)}
                            className="px-2.5 py-1 border border-[#8c8f94] rounded-sm hover:bg-slate-50 font-semibold cursor-pointer"
                          >
                            {lic.status === 'active' ? 'Revoke Key' : 'Restore Key'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          )}

          {/* 4. COUPONS ENGINE */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-[#1d2327]">
                Marketing Coupons Engine
              </h1>

              <form
                onSubmit={handleCreateCoupon}
                className="bg-white border border-[#c3c4c7] p-5 rounded-sm grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
              >
                <div>
                  <label htmlFor="new-coupon-code" className="block text-xs font-bold text-slate-700 mb-1">
                    Coupon Code
                  </label>
                  <input
                    id="new-coupon-code"
                    type="text"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value)}
                    placeholder="SPRING25"
                    className="w-full h-9 px-3 text-xs font-mono uppercase border border-[#8c8f94] rounded-sm"
                  />
                </div>
                <div>
                  <label htmlFor="new-coupon-type" className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    id="new-coupon-type"
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as 'percent' | 'fixed')}
                    className="w-full h-9 px-2 text-xs border border-[#8c8f94] rounded-sm bg-white"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Cart (₦)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="new-coupon-val" className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Value
                  </label>
                  <input
                    id="new-coupon-val"
                    type="number"
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(e.target.value)}
                    className="w-full h-9 px-3 text-xs tabular-nums border border-[#8c8f94] rounded-sm"
                  />
                </div>
                <div>
                  <label htmlFor="new-coupon-min" className="block text-xs font-bold text-slate-700 mb-1">
                    Min Spend (₦)
                  </label>
                  <input
                    id="new-coupon-min"
                    type="number"
                    value={newCouponMinSpend}
                    onChange={(e) => setNewCouponMinSpend(e.target.value)}
                    className="w-full h-9 px-3 text-xs tabular-nums border border-[#8c8f94] rounded-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="h-9 px-4 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm cursor-pointer"
                >
                  Create Coupon
                </button>
              </form>

              <div className="bg-white border border-[#c3c4c7] rounded-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Discount</th>
                      <th className="px-4 py-3">Min Spend</th>
                      <th className="px-4 py-3">Usage</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 tabular-nums">
                    {coupons.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-3 font-mono font-bold text-[#2271b1]">{c.code}</td>
                        <td className="px-4 py-3 font-semibold">
                          {c.discountType === 'percent' ? `${c.value}% off` : `${formatNaira(c.value)} off`}
                        </td>
                        <td className="px-4 py-3">{formatNaira(c.minSpend)}</td>
                        <td className="px-4 py-3">
                          {c.usageCount} / {c.maxUses}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => upsertCoupon({ ...c, active: !c.active })}
                            className={`font-bold underline cursor-pointer ${
                              c.active ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                          >
                            {c.active ? 'Active' : 'Paused'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => deleteCoupon(c.id)}
                            aria-label={`Delete coupon ${c.code}`}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4B. WHATSAPP GROUPS MANAGEMENT */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#1d2327]">
                    WhatsApp Groups & Communities
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Manage cohort groups, VIP buyer channels, and settlement desk links (
                    {TINTOL_PAYMENT_DETAILS.bankName} {TINTOL_PAYMENT_DETAILS.accountNumber} ·{' '}
                    {TINTOL_PAYMENT_DETAILS.phoneDisplay}).
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleCreateWhatsAppGroup}
                className="bg-white border border-[#c3c4c7] p-5 rounded-sm space-y-4"
              >
                <h2 className="font-display text-sm font-bold text-[#1d2327] border-b border-slate-200 pb-2">
                  Create WhatsApp Group Invite
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label
                      htmlFor="wa-group-name"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Group Name
                    </label>
                    <input
                      id="wa-group-name"
                      type="text"
                      value={waName}
                      onChange={(e) => setWaName(e.target.value)}
                      placeholder="e.g. TypeScript Mastery Cohort"
                      className="w-full h-9 px-3 text-xs border border-[#8c8f94] rounded-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="wa-group-url"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      WhatsApp Invite URL
                    </label>
                    <input
                      id="wa-group-url"
                      type="url"
                      value={waUrl}
                      onChange={(e) => setWaUrl(e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                      className="w-full h-9 px-3 text-xs font-mono border border-[#8c8f94] rounded-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="wa-group-category"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="wa-group-category"
                      value={waCategory}
                      onChange={(e) => setWaCategory(e.target.value as WhatsAppGroup['category'])}
                      className="w-full h-9 px-2 text-xs border border-[#8c8f94] rounded-sm bg-white"
                    >
                      <option value="course">Course Cohort</option>
                      <option value="ebook">eBook Readers</option>
                      <option value="software">Software Licensees</option>
                      <option value="vip">VIP Buyers</option>
                      <option value="general">Public Community</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="wa-group-visibility"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Access Rule
                    </label>
                    <select
                      id="wa-group-visibility"
                      value={waVisibility}
                      onChange={(e) =>
                        setWaVisibility(e.target.value as WhatsAppGroup['visibility'])
                      }
                      className="w-full h-9 px-2 text-xs border border-[#8c8f94] rounded-sm bg-white"
                    >
                      <option value="public">Public (Storefront Footer + Library)</option>
                      <option value="enrolled_only">Enrolled / Verified Buyers Only</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="wa-group-product"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Linked Product (optional)
                    </label>
                    <select
                      id="wa-group-product"
                      value={waProductId}
                      onChange={(e) => setWaProductId(e.target.value)}
                      className="w-full h-9 px-2 text-xs border border-[#8c8f94] rounded-sm bg-white"
                    >
                      <option value="">All / General Storefront</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="wa-group-max"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Max Members
                    </label>
                    <input
                      id="wa-group-max"
                      type="number"
                      value={waMaxMembers}
                      onChange={(e) => setWaMaxMembers(e.target.value)}
                      className="w-full h-9 px-3 text-xs tabular-nums border border-[#8c8f94] rounded-sm"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="wa-group-desc"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Description
                    </label>
                    <input
                      id="wa-group-desc"
                      type="text"
                      value={waDescription}
                      onChange={(e) => setWaDescription(e.target.value)}
                      placeholder="Purpose of this WhatsApp group..."
                      className="w-full h-9 px-3 text-xs border border-[#8c8f94] rounded-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full h-9 px-4 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm cursor-pointer"
                    >
                      Add Group
                    </button>
                  </div>
                </div>

                {waError && (
                  <p className="text-xs font-semibold text-rose-700">{waError}</p>
                )}
              </form>

              <div className="bg-white border border-[#c3c4c7] rounded-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="px-4 py-3">Group Name & Description</th>
                      <th className="px-4 py-3">Category / Linked Product</th>
                      <th className="px-4 py-3">Visibility</th>
                      <th className="px-4 py-3">Members</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 tabular-nums">
                    {whatsappGroups.map((g) => {
                      const linkedProd = products.find((p) => p.id === g.productId);
                      return (
                        <tr key={g.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-bold text-[#1d2327] text-sm">{g.name}</p>
                            <p className="text-[11px] text-slate-500 max-w-md">{g.description}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold capitalize text-slate-800">{g.category}</p>
                            <p className="text-[11px] text-slate-500">
                              {linkedProd ? linkedProd.title : 'General Storefront'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                upsertWhatsAppGroup({
                                  ...g,
                                  visibility:
                                    g.visibility === 'public' ? 'enrolled_only' : 'public',
                                })
                              }
                              className="underline font-semibold text-[#2271b1] cursor-pointer"
                            >
                              {g.visibility === 'public' ? 'Public' : 'Enrolled Only'}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {g.membersCount} / {g.maxMembers}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => toggleWhatsAppGroupStatus(g.id)}
                              className={`font-bold underline cursor-pointer ${
                                g.active ? 'text-emerald-700' : 'text-slate-500'
                              }`}
                            >
                              {g.active ? 'Active' : 'Paused'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                    navigator.clipboard.writeText(g.inviteUrl).catch(() => {});
                                  }
                                  showToast(`Copied invite link for ${g.name}`);
                                }}
                                aria-label={`Copy invite link for ${g.name}`}
                                className="p-1.5 text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={g.inviteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Open ${g.name} invite`}
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => deleteWhatsAppGroup(g.id)}
                                aria-label={`Delete ${g.name}`}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. USERS & ROLES */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-[#1d2327]">Users & Roles</h1>
              <div className="bg-white border border-[#c3c4c7] rounded-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3">Orders</th>
                      <th className="px-4 py-3">Newsletter</th>
                      <th className="px-4 py-3">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 tabular-nums">
                    {users.map((u) => {
                      const orderCount = orders.filter((o) => o.userId === u.id).length;
                      return (
                        <tr key={u.id}>
                          <td className="px-4 py-3 font-bold text-[#1d2327]">{u.name}</td>
                          <td className="px-4 py-3 text-slate-600">{u.email}</td>
                          <td className="px-4 py-3 text-slate-500">{u.joinedAt.slice(0, 10)}</td>
                          <td className="px-4 py-3">{orderCount}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-sm ${
                                u.newsletterOptIn
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {u.newsletterOptIn ? 'Opted In' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              aria-label={`Role for ${u.name}`}
                              value={u.role}
                              onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                              className="h-8 px-2 text-xs border border-[#8c8f94] rounded-sm bg-white"
                            >
                              <option value="customer">Customer / Student</option>
                              <option value="instructor">Instructor / Vendor</option>
                              <option value="admin">Super Admin</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. STOREFRONT APPEARANCE & PAGE BUILDER */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#1d2327]">
                    Storefront Appearance & Page Builder
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Customize announcement bar, hero copy, accent theme, and homepage section order.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateAppearance(appearanceDraft);
                      navigate('/');
                    }}
                    className="px-4 py-2 text-xs font-bold text-[#2271b1] border border-[#2271b1] bg-white rounded-sm hover:bg-blue-50 cursor-pointer"
                  >
                    Publish & Preview Site
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAppearance(appearanceDraft)}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Hero & Identity Metabox */}
                <section className="bg-white border border-[#c3c4c7] p-5 rounded-sm space-y-4">
                  <h2 className="font-display text-sm font-bold text-[#1d2327] border-b border-slate-200 pb-2">
                    Hero & Brand Settings
                  </h2>
                  <div>
                    <label htmlFor="admin-brand-name" className="block text-xs font-bold text-slate-700 mb-1">
                      Site / Brand Name
                    </label>
                    <input
                      id="admin-brand-name"
                      type="text"
                      value={appearanceDraft.brandName}
                      onChange={(e) =>
                        setAppearanceDraft((p) => ({ ...p, brandName: e.target.value }))
                      }
                      className="w-full h-9 px-3 text-xs border border-[#8c8f94] rounded-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-hero-title" className="block text-xs font-bold text-slate-700 mb-1">
                      Hero Headline
                    </label>
                    <input
                      id="admin-hero-title"
                      type="text"
                      value={appearanceDraft.heroTitle}
                      onChange={(e) =>
                        setAppearanceDraft((p) => ({ ...p, heroTitle: e.target.value }))
                      }
                      className="w-full h-9 px-3 text-xs border border-[#8c8f94] rounded-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-hero-sub" className="block text-xs font-bold text-slate-700 mb-1">
                      Hero Subtitle
                    </label>
                    <textarea
                      id="admin-hero-sub"
                      rows={3}
                      value={appearanceDraft.heroSubtitle}
                      onChange={(e) =>
                        setAppearanceDraft((p) => ({ ...p, heroSubtitle: e.target.value }))
                      }
                      className="w-full p-2.5 text-xs border border-[#8c8f94] rounded-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-accent" className="block text-xs font-bold text-slate-700 mb-1">
                      Primary Accent Palette
                    </label>
                    <select
                      id="admin-accent"
                      value={appearanceDraft.accentTheme}
                      onChange={(e) =>
                        setAppearanceDraft((p) => ({
                          ...p,
                          accentTheme: e.target.value as StorefrontAppearance['accentTheme'],
                        }))
                      }
                      className="w-full h-9 px-2 text-xs border border-[#8c8f94] rounded-sm bg-white"
                    >
                      <option value="indigo">Udemy Indigo (#5624d0)</option>
                      <option value="emerald">Emerald Studio (#0f766e)</option>
                      <option value="cobalt">Cobalt Pro (#1d4ed8)</option>
                    </select>
                  </div>
                </section>

                {/* Announcement Bar & Modular Sections */}
                <div className="space-y-5">
                  <section className="bg-white border border-[#c3c4c7] p-5 rounded-sm space-y-3">
                    <h2 className="font-display text-sm font-bold text-[#1d2327] border-b border-slate-200 pb-2">
                      Announcement Bar
                    </h2>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appearanceDraft.announcementEnabled}
                        onChange={(e) =>
                          setAppearanceDraft((p) => ({
                            ...p,
                            announcementEnabled: e.target.checked,
                          }))
                        }
                        className="accent-[#2271b1]"
                      />
                      <span>Enable Promotional Top Bar</span>
                    </label>
                    <div>
                      <label htmlFor="admin-promo-text" className="block text-xs font-bold text-slate-700 mb-1">
                        Banner Text
                      </label>
                      <input
                        id="admin-promo-text"
                        type="text"
                        value={appearanceDraft.announcementText}
                        onChange={(e) =>
                          setAppearanceDraft((p) => ({
                            ...p,
                            announcementText: e.target.value,
                          }))
                        }
                        className="w-full h-9 px-3 text-xs border border-[#8c8f94] rounded-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="admin-promo-code" className="block text-xs font-bold text-slate-700 mb-1">
                          Featured Coupon
                        </label>
                        <input
                          id="admin-promo-code"
                          type="text"
                          value={appearanceDraft.announcementCoupon}
                          onChange={(e) =>
                            setAppearanceDraft((p) => ({
                              ...p,
                              announcementCoupon: e.target.value.toUpperCase(),
                            }))
                          }
                          className="w-full h-9 px-3 text-xs font-mono border border-[#8c8f94] rounded-sm"
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={appearanceDraft.announcementCountdownEnabled}
                            onChange={(e) =>
                              setAppearanceDraft((p) => ({
                                ...p,
                                announcementCountdownEnabled: e.target.checked,
                              }))
                            }
                            className="accent-[#2271b1]"
                          />
                          <span>Show Fixed Campaign Countdown</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="admin-promo-ends" className="block text-xs font-bold text-slate-700 mb-1">
                        Campaign End Timestamp (ISO UTC)
                      </label>
                      <input
                        id="admin-promo-ends"
                        type="text"
                        value={appearanceDraft.announcementEndsAt ?? '2026-11-26T23:59:59Z'}
                        onChange={(e) =>
                          setAppearanceDraft((p) => ({
                            ...p,
                            announcementEndsAt: e.target.value,
                          }))
                        }
                        placeholder="2026-11-26T23:59:59Z"
                        className="w-full h-9 px-3 text-xs font-mono border border-[#8c8f94] rounded-sm"
                      />
                    </div>
                  </section>

                  <section className="bg-white border border-[#c3c4c7] p-5 rounded-sm space-y-3">
                    <h2 className="font-display text-sm font-bold text-[#1d2327] border-b border-slate-200 pb-2">
                      Homepage Section Builder
                    </h2>
                    <div className="space-y-2">
                      {appearanceDraft.sectionOrder.map((sec, idx) => {
                        const isVisible =
                          sec === 'featured'
                            ? appearanceDraft.showFeaturedSection
                            : sec === 'catalog'
                            ? appearanceDraft.showCatalogSection
                            : appearanceDraft.showTrustStrip;
                        const label =
                          sec === 'featured'
                            ? 'Featured Releases Grid'
                            : sec === 'catalog'
                            ? 'Filterable Digital Catalog'
                            : 'Platform Value & Trust Strip';

                        return (
                          <div
                            key={sec}
                            className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs"
                          >
                            <label className="inline-flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isVisible}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setAppearanceDraft((p) => ({
                                    ...p,
                                    showFeaturedSection:
                                      sec === 'featured' ? checked : p.showFeaturedSection,
                                    showCatalogSection:
                                      sec === 'catalog' ? checked : p.showCatalogSection,
                                    showTrustStrip: sec === 'trust' ? checked : p.showTrustStrip,
                                  }));
                                }}
                                className="accent-[#2271b1]"
                              />
                              <span>{label}</span>
                            </label>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveSection(idx, -1)}
                                aria-label={`Move ${label} up`}
                                className="p-1 border border-slate-300 bg-white rounded-sm disabled:opacity-40 cursor-pointer"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === appearanceDraft.sectionOrder.length - 1}
                                onClick={() => moveSection(idx, 1)}
                                aria-label={`Move ${label} down`}
                                className="p-1 border border-slate-300 bg-white rounded-sm disabled:opacity-40 cursor-pointer"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* 8. MEMBERSHIP MANAGEMENT */}
          {activeTab === 'membership' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#1d2327]">
                    Membership Plans & Member Passes
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Configure monthly/annual plan pricing, automatic store discount rates, and user access tiers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/membership')}
                  className="px-3.5 py-2 text-xs font-bold text-[#1d2327] bg-white border border-[#8c8f94] hover:bg-slate-50 rounded-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Public Membership Page</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {membershipPlans.map((plan) => {
                  const draft = planDrafts[plan.id] || plan;
                  return (
                    <section
                      key={plan.id}
                      className="bg-white border border-[#c3c4c7] rounded-sm p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div>
                          <h2 className="font-display text-sm font-bold text-[#1d2327]">
                            {plan.name}
                          </h2>
                          <p className="text-[11px] text-slate-500">{plan.audienceLabel}</p>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-bold bg-slate-100 text-slate-700 rounded-sm">
                          {plan.id}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Monthly ($)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={draft.monthlyPrice}
                            onChange={(e) =>
                              setPlanDrafts((prev) => ({
                                ...prev,
                                [plan.id]: { ...draft, monthlyPrice: Number(e.target.value) || 1 },
                              }))
                            }
                            className="w-full h-8 px-2 border border-[#8c8f94] rounded-sm text-xs tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Annual ($)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={draft.annualPrice}
                            onChange={(e) =>
                              setPlanDrafts((prev) => ({
                                ...prev,
                                [plan.id]: { ...draft, annualPrice: Number(e.target.value) || 1 },
                              }))
                            }
                            className="w-full h-8 px-2 border border-[#8c8f94] rounded-sm text-xs tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Discount (%)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={60}
                            value={draft.storeDiscountPercent}
                            onChange={(e) =>
                              setPlanDrafts((prev) => ({
                                ...prev,
                                [plan.id]: {
                                  ...draft,
                                  storeDiscountPercent: Math.max(0, Math.min(60, Number(e.target.value) || 0)),
                                },
                              }))
                            }
                            className="w-full h-8 px-2 border border-[#8c8f94] rounded-sm text-xs tabular-nums"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Tagline
                        </label>
                        <input
                          type="text"
                          value={draft.tagline}
                          onChange={(e) =>
                            setPlanDrafts((prev) => ({
                              ...prev,
                              [plan.id]: { ...draft, tagline: e.target.value },
                            }))
                          }
                          className="w-full h-8 px-2 border border-[#8c8f94] rounded-sm text-xs"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => updateMembershipPlan(draft)}
                        className="w-full py-2 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm cursor-pointer"
                      >
                        Save {plan.name} Settings
                      </button>
                    </section>
                  );
                })}
              </div>

              <section className="bg-white border border-[#c3c4c7] rounded-sm p-4 space-y-4">
                <h2 className="font-display text-sm font-bold text-[#1d2327]">
                  Assign / Update Member Pass
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Account User
                    </label>
                    <select
                      aria-label="Select member account"
                      value={assignUserId || users[0]?.id || ''}
                      onChange={(e) => setAssignUserId(e.target.value)}
                      className="w-full h-9 px-2.5 text-xs border border-[#8c8f94] rounded-sm bg-white"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Membership Tier
                    </label>
                    <select
                      aria-label="Select membership tier"
                      value={assignPlanId}
                      onChange={(e) => setAssignPlanId(e.target.value as MembershipTierId)}
                      className="w-full h-9 px-2.5 text-xs border border-[#8c8f94] rounded-sm bg-white"
                    >
                      {membershipPlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Pass Status
                    </label>
                    <select
                      aria-label="Select pass status"
                      value={assignStatus}
                      onChange={(e) => setAssignStatus(e.target.value as UserMembership['status'])}
                      className="w-full h-9 px-2.5 text-xs border border-[#8c8f94] rounded-sm bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending Verification</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      assignMembershipByAdmin(assignUserId || users[0]?.id || '', assignPlanId, assignStatus)
                    }
                    className="h-9 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-sm cursor-pointer"
                  >
                    Apply Member Pass
                  </button>
                </div>

                <div className="overflow-x-auto pt-2 border-t border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="px-3 py-2.5">Member</th>
                        <th className="px-3 py-2.5">Plan</th>
                        <th className="px-3 py-2.5">Billing</th>
                        <th className="px-3 py-2.5">Payment Ref</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5 text-right">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {userMemberships.map((m) => {
                        const account = users.find((u) => u.id === m.userId);
                        const plan = membershipPlans.find((p) => p.id === m.planId);
                        return (
                          <tr key={m.id}>
                            <td className="px-3 py-2.5">
                              <p className="font-semibold text-slate-900">{account?.name || m.userId}</p>
                              <p className="text-[11px] text-slate-500">{account?.email}</p>
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-[#1d2327]">
                              {plan?.name || m.planId}
                            </td>
                            <td className="px-3 py-2.5 uppercase text-[11px] text-slate-600">
                              {m.billingCycle}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">
                              {m.paymentReference || 'Admin Assigned'}
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm ${
                                  m.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : m.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right space-x-1.5">
                              {m.status !== 'active' && (
                                <button
                                  type="button"
                                  onClick={() => assignMembershipByAdmin(m.userId, m.planId, 'active')}
                                  className="px-2 py-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-sm cursor-pointer"
                                >
                                  Activate
                                </button>
                              )}
                              {m.status === 'active' && (
                                <button
                                  type="button"
                                  onClick={() => assignMembershipByAdmin(m.userId, m.planId, 'cancelled')}
                                  className="px-2 py-1 text-[11px] font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50 rounded-sm cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* 9. AFFILIATE PROGRAM MANAGEMENT */}
          {activeTab === 'affiliates' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#1d2327]">
                    Affiliate Partners, Conversions & Payouts
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Adjust partner commission rates, approve referred checkout conversions, and settle withdrawal requests.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/affiliates')}
                  className="px-3.5 py-2 text-xs font-bold text-[#1d2327] bg-white border border-[#8c8f94] hover:bg-slate-50 rounded-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Partner Portal</span>
                </button>
              </div>

              <section className="bg-white border border-[#c3c4c7] rounded-sm overflow-x-auto">
                <div className="px-4 py-3 border-b border-[#c3c4c7] font-display text-sm font-bold text-[#1d2327]">
                  Registered Affiliates ({affiliates.length})
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Partner</th>
                      <th className="px-4 py-2.5">Referral Code</th>
                      <th className="px-4 py-2.5">Clicks</th>
                      <th className="px-4 py-2.5">Payout Method</th>
                      <th className="px-4 py-2.5">Commission Rate (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 tabular-nums">
                    {affiliates.map((aff) => (
                      <tr key={aff.id}>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-slate-900">{aff.userName}</p>
                          <p className="text-[11px] text-slate-500">{aff.userEmail}</p>
                        </td>
                        <td className="px-4 py-2.5 font-mono font-bold text-[#2271b1]">
                          {aff.code}
                        </td>
                        <td className="px-4 py-2.5">{aff.clicks}</td>
                        <td className="px-4 py-2.5 text-slate-600">
                          <p className="font-semibold text-slate-800">{aff.payoutMethod}</p>
                          <p className="text-[11px]">{aff.bankDetails}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min={1}
                            max={60}
                            aria-label={`Commission rate for ${aff.userName}`}
                            value={Math.round(aff.commissionRate * 100)}
                            onChange={(e) => {
                              const pct = Math.max(1, Math.min(60, Number(e.target.value) || 20));
                              updateAffiliateCommissionRate(aff.id, pct / 100);
                            }}
                            className="w-20 h-8 px-2 border border-[#8c8f94] rounded-sm text-xs font-bold tabular-nums"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="bg-white border border-[#c3c4c7] rounded-sm overflow-x-auto">
                <div className="px-4 py-3 border-b border-[#c3c4c7] font-display text-sm font-bold text-[#1d2327]">
                  Referral Conversions ({affiliateConversions.length})
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Order</th>
                      <th className="px-4 py-2.5">Ref Code</th>
                      <th className="px-4 py-2.5">Buyer</th>
                      <th className="px-4 py-2.5 text-right">Order Total</th>
                      <th className="px-4 py-2.5 text-right">Commission</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 tabular-nums">
                    {affiliateConversions.map((conv) => (
                      <tr key={conv.id}>
                        <td className="px-4 py-2.5 font-mono font-bold text-[#2271b1]">{conv.orderId}</td>
                        <td className="px-4 py-2.5 font-mono">{conv.affiliateCode}</td>
                        <td className="px-4 py-2.5">{conv.buyerName}</td>
                        <td className="px-4 py-2.5 text-right">{formatNaira(conv.orderTotal)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-700">
                          {formatNaira(conv.commissionAmount)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-800 rounded-sm">
                            {conv.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => updateAffiliateConversionStatus(conv.id, 'approved')}
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 rounded-sm hover:bg-emerald-50 cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => updateAffiliateConversionStatus(conv.id, 'paid')}
                            className="px-2 py-1 text-[11px] font-semibold text-[#2271b1] border border-sky-200 rounded-sm hover:bg-sky-50 cursor-pointer"
                          >
                            Mark Paid
                          </button>
                          <button
                            type="button"
                            onClick={() => updateAffiliateConversionStatus(conv.id, 'declined')}
                            className="px-2 py-1 text-[11px] font-semibold text-rose-700 border border-rose-200 rounded-sm hover:bg-rose-50 cursor-pointer"
                          >
                            Decline
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="bg-white border border-[#c3c4c7] rounded-sm overflow-x-auto">
                <div className="px-4 py-3 border-b border-[#c3c4c7] font-display text-sm font-bold text-[#1d2327]">
                  Payout Requests ({affiliatePayouts.length})
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Partner</th>
                      <th className="px-4 py-2.5">Code</th>
                      <th className="px-4 py-2.5">Settlement Bank / GTB Details</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 tabular-nums">
                    {affiliatePayouts.map((pay) => (
                      <tr key={pay.id}>
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{pay.affiliateName}</td>
                        <td className="px-4 py-2.5 font-mono">{pay.affiliateCode}</td>
                        <td className="px-4 py-2.5 text-slate-600">{pay.bankDetails}</td>
                        <td className="px-4 py-2.5 text-right font-bold">{formatNaira(pay.amount)}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-800 rounded-sm">
                            {pay.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => updateAffiliatePayoutStatus(pay.id, 'paid')}
                            className="px-2 py-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-sm cursor-pointer"
                          >
                            Mark Paid
                          </button>
                          <button
                            type="button"
                            onClick={() => updateAffiliatePayoutStatus(pay.id, 'declined')}
                            className="px-2 py-1 text-[11px] font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50 rounded-sm cursor-pointer"
                          >
                            Decline
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          )}

          {/* 10. SHOWCASE SITES MANAGEMENT */}
          {activeTab === 'showcase' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#1d2327]">
                    Showcase Directory Manager
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Manage minimal Showcase cards displaying website screenshot, website name, live URL, and Visit button.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/showcase')}
                  className="px-3.5 py-2 text-xs font-bold text-[#1d2327] bg-white border border-[#8c8f94] hover:bg-slate-50 rounded-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Showcase Page</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <form
                  onSubmit={handleSaveShowcaseSite}
                  className="lg:col-span-5 bg-white border border-[#c3c4c7] rounded-sm p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-sm font-bold text-[#1d2327]">
                      {showId ? 'Edit Showcase Website' : 'Add Showcase Website'}
                    </h2>
                    {showId && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowId(null);
                          setShowName('');
                          setShowUrl('');
                          setShowImage(MEDIA_LIBRARY_ASSETS[0]?.url || '');
                          setShowOrder('1');
                        }}
                        className="text-[11px] font-semibold text-[#2271b1] hover:underline cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Website Name *
                    </label>
                    <input
                      type="text"
                      value={showName}
                      onChange={(e) => setShowName(e.target.value)}
                      placeholder="e.g., Tintol Cloud Studio"
                      className="w-full h-9 px-3 text-xs border border-[#8c8f94] rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Website URL *
                    </label>
                    <input
                      type="url"
                      value={showUrl}
                      onChange={(e) => setShowUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full h-9 px-3 text-xs font-mono border border-[#8c8f94] rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Website Preview Image (URL, Preset, or Upload)
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <select
                        aria-label="Choose curated showcase preview image"
                        value={MEDIA_LIBRARY_ASSETS.some((m) => m.url === showImage) ? showImage : ''}
                        onChange={(e) => {
                          if (e.target.value) setShowImage(e.target.value);
                        }}
                        className="flex-1 h-8 px-2 text-xs border border-[#8c8f94] rounded-sm bg-white"
                      >
                        <option value="">Select preset screenshot...</option>
                        {MEDIA_LIBRARY_ASSETS.map((asset) => (
                          <option key={asset.id} value={asset.url}>
                            {asset.label}
                          </option>
                        ))}
                      </select>
                      <label className="h-8 px-3 text-[11px] font-bold text-[#1d2327] bg-slate-100 border border-[#8c8f94] rounded-sm inline-flex items-center gap-1 cursor-pointer hover:bg-slate-200">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleShowcaseFileUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={showImage}
                      onChange={(e) => setShowImage(e.target.value)}
                      placeholder="https://... or /assets/..."
                      className="w-full h-9 px-3 text-xs border border-[#8c8f94] rounded-sm"
                    />
                    {showImage && (
                      <div className="mt-2 aspect-video w-full overflow-hidden rounded-sm border border-slate-200 bg-slate-100">
                        <img
                          src={showImage}
                          alt="Showcase preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={showOrder}
                      onChange={(e) => setShowOrder(e.target.value)}
                      className="w-24 h-8 px-2 text-xs border border-[#8c8f94] rounded-sm tabular-nums"
                    />
                  </div>

                  {showError && (
                    <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-sm">
                      {showError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm cursor-pointer"
                  >
                    {showId ? 'Update Showcase Site' : 'Publish Showcase Site'}
                  </button>
                </form>

                <section className="lg:col-span-7 bg-white border border-[#c3c4c7] rounded-sm overflow-x-auto">
                  <div className="px-4 py-3 border-b border-[#c3c4c7] font-display text-sm font-bold text-[#1d2327]">
                    Showcase Directory ({showcaseSites.length})
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="px-4 py-2.5">Preview</th>
                        <th className="px-4 py-2.5">Website & URL</th>
                        <th className="px-4 py-2.5">Order</th>
                        <th className="px-4 py-2.5">Visibility</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {showcaseSites.map((site) => (
                        <tr key={site.id}>
                          <td className="px-4 py-2.5">
                            <img
                              src={site.image}
                              alt={site.name}
                              className="w-16 h-10 object-cover rounded-sm border border-slate-200 bg-slate-100"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="font-semibold text-slate-900">{site.name}</p>
                            <p className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">
                              {site.url}
                            </p>
                          </td>
                          <td className="px-4 py-2.5 tabular-nums">{site.order}</td>
                          <td className="px-4 py-2.5">
                            <button
                              type="button"
                              onClick={() => toggleShowcaseSite(site.id)}
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm cursor-pointer ${
                                site.active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {site.active ? 'Visible' : 'Hidden'}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowId(site.id);
                                setShowName(site.name);
                                setShowUrl(site.url);
                                setShowImage(site.image);
                                setShowOrder(String(site.order));
                              }}
                              className="text-[#2271b1] hover:underline font-semibold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteShowcaseSite(site.id)}
                              className="text-rose-700 hover:underline font-semibold cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              </div>
            </div>
          )}
          {/* 11. EVENTS & ATTENDEE ROSTER */}
          {activeTab === 'events' && <EventsManagerPanel />}

          {/* 12. EMAIL BROADCAST STUDIO */}
          {activeTab === 'email' && <EmailBroadcastPanel />}

          {/* 13. SOCIAL DISTRIBUTION QUEUE */}
          {activeTab === 'social' && <SocialQueuePanel />}
        </main>
      </div>

      {editingProduct !== undefined && (
        <ProductEditorModal
          initialProduct={editingProduct}
          instructorId={currentUser.id}
          instructorName={currentUser.name}
          onSave={(saved) => {
            upsertProduct(saved);
            setEditingProduct(undefined);
          }}
          onClose={() => setEditingProduct(undefined)}
        />
      )}

      {editingBlog !== undefined && (
        <BlogEditorModal
          initialPost={editingBlog}
          authorId={currentUser.id}
          authorName={currentUser.name}
          authorRole={currentUser.title ?? 'Managing Editor'}
          products={products}
          onSave={(saved) => {
            upsertBlogPost(saved);
            setEditingBlog(undefined);
          }}
          onClose={() => setEditingBlog(undefined)}
        />
      )}
    </div>
  );
}
