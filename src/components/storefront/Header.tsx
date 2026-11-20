import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Code2,
  Crown,
  FileText,
  Globe,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Phone,
  PlayCircle,
  Search,
  Share2,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  BLOG_CATEGORY_ITEMS,
  DIGITAL_SUBMENU_ITEMS,
} from '../../utils/catalogAndBlogs';
import { formatNaira } from '../../utils/currency';
import { formatProductTypeLabel } from '../../utils/theme';
import { buildCallUrl, buildWhatsAppUrl } from '../../utils/whatsapp';
import { ShareButton } from '../common/ShareButton';

export function Header() {
  const {
    appearance,
    products,
    blogPosts,
    filters,
    setFilters,
    cart,
    wishlist,
    setIsCartOpen,
    currentUser,
    logout,
    navigate,
    route,
  } = useStore();

  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [digitalMenuOpen, setDigitalMenuOpen] = useState(false);
  const [blogsMenuOpen, setBlogsMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDigitalOpen, setMobileDigitalOpen] = useState(false);
  const [mobileBlogsOpen, setMobileBlogsOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const digitalRef = useRef<HTMLDivElement>(null);
  const blogsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaMenuOpen(false);
      }
      if (digitalRef.current && !digitalRef.current.contains(e.target as Node)) {
        setDigitalMenuOpen(false);
      }
      if (blogsRef.current && !blogsRef.current.contains(e.target as Node)) {
        setBlogsMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const instantProductResults = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.status === 'published' &&
          (p.title.toLowerCase().includes(q) ||
            p.instructorName.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.digitalSubType ?? '').toLowerCase().includes(q))
      )
      .slice(0, 4);
  }, [products, filters.search]);

  const instantBlogResults = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return [];
    return blogPosts
      .filter(
        (b) =>
          b.status === 'published' &&
          (b.title.toLowerCase().includes(q) ||
            b.category.toLowerCase().includes(q) ||
            b.tags.some((t) => t.toLowerCase().includes(q)))
      )
      .slice(0, 3);
  }, [blogPosts, filters.search]);

  const goToRoute = (targetRoute: string) => {
    setMegaMenuOpen(false);
    setDigitalMenuOpen(false);
    setBlogsMenuOpen(false);
    setMobileMenuOpen(false);
    setMobileDigitalOpen(false);
    setMobileBlogsOpen(false);
    setSearchFocused(false);
    navigate(targetRoute);
  };

  const isDigitalActive = route.startsWith('/digital-products');
  const isBlogsActive = route.startsWith('/blog');
  const isCoursesActive = route === '/courses';
  const isSoftwareActive = route === '/software';
  const isMembershipActive = route === '/membership';
  const isEventsActive = route === '/events';
  const isShowcaseActive = route === '/showcase';

  return (
    <header className="sticky top-0 z-40 bg-[#0a192f] text-white border-b-2 border-[#d4af37] shadow-md">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-2.5 xl:gap-4">
        {/* Left: Brand Wordmark + Browse Mega Menu */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setFilters((prev) => ({ ...prev, type: 'all', category: 'All', search: '' }));
              goToRoute('/');
            }}
            className="inline-flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-white hover:text-[#f5c451] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="w-8 h-8 rounded-md bg-[#d4af37] text-[#0a192f] font-black text-base flex items-center justify-center shrink-0 shadow-sm">
              {appearance.brandName.charAt(0).toUpperCase()}
            </span>
            <span>{appearance.brandName}</span>
          </button>

          <div className="relative hidden md:block" ref={megaRef}>
            <button
              type="button"
              onClick={() => setMegaMenuOpen((prev) => !prev)}
              aria-expanded={megaMenuOpen}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-200 hover:text-[#f5c451] py-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <span>Browse</span>
              <ChevronDown className="w-4 h-4 text-[#d4af37]" />
            </button>

            {megaMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-[620px] bg-white border border-slate-200 rounded-lg shadow-xl p-6 grid grid-cols-3 gap-5 z-50 text-slate-900">
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-3">Learning & Tools</p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => goToRoute('/courses')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-md cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4 text-[#0a192f] shrink-0" />
                      <span>Courses</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => goToRoute('/software')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-md cursor-pointer"
                    >
                      <Code2 className="w-4 h-4 text-[#0a192f] shrink-0" />
                      <span>Software</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => goToRoute('/membership')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-md cursor-pointer"
                    >
                      <Crown className="w-4 h-4 text-[#b4690e] shrink-0" />
                      <span>Membership Plans</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => goToRoute('/affiliates')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-md cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-[#0a192f] shrink-0" />
                      <span>Affiliate Program</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => goToRoute('/events')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-md cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-[#0a192f] shrink-0" />
                      <span>Events & Workshops</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => goToRoute('/showcase')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-md cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-[#0a192f] shrink-0" />
                      <span>Showcase</span>
                    </button>
                  </div>
                </div>

                <div className="border-l border-slate-100 pl-4">
                  <p className="text-xs font-bold text-slate-500 mb-3">Digital Products</p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => goToRoute('/digital-products')}
                      className="w-full text-left px-2.5 py-1.5 text-sm font-semibold text-[#0a192f] hover:bg-slate-50 rounded cursor-pointer"
                    >
                      All Digital Products
                    </button>
                    {DIGITAL_SUBMENU_ITEMS.map((sub) => (
                      <button
                        key={sub.subType}
                        type="button"
                        onClick={() => goToRoute(sub.route)}
                        className="w-full text-left px-2.5 py-1.5 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer"
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-l border-slate-100 pl-4">
                  <p className="text-xs font-bold text-slate-500 mb-3">Blogs Topics</p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => goToRoute('/blogs')}
                      className="w-full text-left px-2.5 py-1.5 text-sm font-semibold text-[#0a192f] hover:bg-slate-50 rounded cursor-pointer"
                    >
                      All Articles
                    </button>
                    {BLOG_CATEGORY_ITEMS.map((cat) => (
                      <button
                        key={cat.category}
                        type="button"
                        onClick={() => goToRoute(cat.route)}
                        className="w-full text-left px-2.5 py-1.5 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer"
                      >
                        {cat.category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Live Instant Search Bar (Products & Blogs) */}
        <div className="flex-1 min-w-[160px] max-w-[260px] relative hidden sm:block" ref={searchRef}>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#d4af37] absolute left-3 pointer-events-none" />
            <input
              type="search"
              value={filters.search}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                const value = e.target.value;
                setFilters((prev) => ({ ...prev, search: value }));
                setSearchFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && route !== '/') {
                  setSearchFocused(false);
                  navigate('/');
                }
              }}
              placeholder="Search catalog..."
              aria-label="Search marketplace products and blogs"
              className="w-full h-9 pl-9 pr-3 text-sm bg-[#112240] border border-[#263d66] rounded-full text-white placeholder:text-slate-400 focus:bg-[#0d1d36] focus:outline-none focus:border-[#d4af37] transition-colors"
            />
          </div>

          {searchFocused && filters.search.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50">
              {instantProductResults.length === 0 && instantBlogResults.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-500">
                  No matching courses, digital products, or articles found for "{filters.search}".
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {instantProductResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goToRoute(`/product/${item.slug}`)}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {formatProductTypeLabel(item.type, item.digitalSubType)} · {item.category}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-slate-900 tabular-nums shrink-0">
                        {formatNaira(item.price)}
                      </span>
                    </button>
                  ))}
                  {instantBlogResults.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => goToRoute(`/blog/${post.slug}`)}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between gap-4 cursor-pointer bg-slate-50/50"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[#0a192f] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {post.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            Blog · {post.category} · {post.readTimeMinutes} min read
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#0a192f] shrink-0">Read</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Primary Navigation Menus + Call/WhatsApp/Share + Wishlist + Cart + Auth */}
        <div className="flex items-center gap-1.5 lg:gap-2.5 shrink-0">
          <nav className="hidden xl:flex items-center gap-3 xl:gap-3.5 text-[13px] font-medium text-slate-200 mr-1">
            <button
              type="button"
              onClick={() => goToRoute('/courses')}
              className={`hover:text-[#f5c451] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isCoursesActive ? 'text-[#f5c451] font-bold' : ''
              }`}
            >
              Courses
            </button>

            {/* Digital Products Menu + Submenu */}
            <div className="relative" ref={digitalRef}>
              <button
                type="button"
                onClick={() => {
                  setDigitalMenuOpen((prev) => !prev);
                  setBlogsMenuOpen(false);
                }}
                aria-expanded={digitalMenuOpen}
                className={`inline-flex items-center gap-1 hover:text-[#f5c451] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-2 ${
                  isDigitalActive ? 'text-[#f5c451] font-bold' : ''
                }`}
              >
                <span>Digital Products</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#d4af37]" />
              </button>

              {digitalMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-white text-slate-900 border border-slate-200 rounded-lg shadow-xl py-2 z-50">
                  <button
                    type="button"
                    onClick={() => goToRoute('/digital-products')}
                    className="w-full px-4 py-2 text-left text-sm font-bold text-[#0a192f] hover:bg-slate-50 border-b border-slate-100 cursor-pointer"
                  >
                    All Digital Products Hub
                  </button>
                  {DIGITAL_SUBMENU_ITEMS.map((sub) => (
                    <button
                      key={sub.subType}
                      type="button"
                      onClick={() => goToRoute(sub.route)}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="block text-sm font-semibold text-slate-900">
                        {sub.label}
                      </span>
                      <span className="block text-[11px] text-slate-500 truncate">
                        {sub.headline}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => goToRoute('/software')}
              className={`hover:text-[#f5c451] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isSoftwareActive ? 'text-[#f5c451] font-bold' : ''
              }`}
            >
              Software
            </button>

            {/* Blogs Menu + Category Submenu */}
            <div className="relative" ref={blogsRef}>
              <button
                type="button"
                onClick={() => {
                  setBlogsMenuOpen((prev) => !prev);
                  setDigitalMenuOpen(false);
                }}
                aria-expanded={blogsMenuOpen}
                className={`inline-flex items-center gap-1 hover:text-[#f5c451] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-2 ${
                  isBlogsActive ? 'text-[#f5c451] font-bold' : ''
                }`}
              >
                <span>Blogs</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#d4af37]" />
              </button>

              {blogsMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-60 bg-white text-slate-900 border border-slate-200 rounded-lg shadow-xl py-2 z-50">
                  <button
                    type="button"
                    onClick={() => goToRoute('/blogs')}
                    className="w-full px-4 py-2 text-left text-sm font-bold text-[#0a192f] hover:bg-slate-50 border-b border-slate-100 cursor-pointer"
                  >
                    All Blog Articles
                  </button>
                  {BLOG_CATEGORY_ITEMS.map((cat) => (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => goToRoute(cat.route)}
                      className="w-full px-4 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50 cursor-pointer"
                    >
                      {cat.category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => goToRoute('/events')}
              className={`hover:text-[#f5c451] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isEventsActive ? 'text-[#f5c451] font-bold' : ''
              }`}
            >
              Events
            </button>

            <button
              type="button"
              onClick={() => goToRoute('/membership')}
              className={`hover:text-[#f5c451] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isMembershipActive ? 'text-[#f5c451] font-bold' : ''
              }`}
            >
              Membership
            </button>

            <button
              type="button"
              onClick={() => goToRoute('/showcase')}
              className={`hover:text-[#f5c451] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isShowcaseActive ? 'text-[#f5c451] font-bold' : ''
              }`}
            >
              Showcase
            </button>

            {currentUser && (
              <button
                type="button"
                onClick={() => goToRoute('/library')}
                className="hover:text-[#f5c451] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                My Library
              </button>
            )}
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => goToRoute('/admin')}
                className="text-[#f5c451] font-semibold hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Admin
              </button>
            )}
          </nav>

          {/* Direct Click-to-Call & Click-to-WhatsApp + Share */}
          <a
            href={buildCallUrl()}
            aria-label="Call Tintol support (+2348034710699)"
            title="Call +234 803 471 0699"
            className="hidden lg:inline-flex p-2 text-slate-200 hover:text-[#f5c451] rounded-md hover:bg-[#112240] transition-colors"
          >
            <Phone className="w-4 h-4" />
          </a>

          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp (+2348034710699)"
            title="Chat on WhatsApp"
            className="hidden sm:inline-flex p-2 text-emerald-400 hover:text-emerald-300 rounded-md hover:bg-[#112240] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </a>

          <div className="hidden md:block">
            <ShareButton title={appearance.brandName} variant="navbar" />
          </div>

          {/* Wishlist Trigger */}
          <button
            type="button"
            onClick={() => goToRoute('/library?tab=wishlist')}
            aria-label={`Wishlist (${wishlist.length} saved items)`}
            className="relative p-2 text-slate-200 hover:text-[#f5c451] rounded-md hover:bg-[#112240] transition-colors cursor-pointer"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#d4af37] text-[#0a192f] text-[11px] font-bold flex items-center justify-center tabular-nums">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Shopping cart (${cart.length} items)`}
            className="relative p-2 text-slate-200 hover:text-[#f5c451] rounded-md hover:bg-[#112240] transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#d4af37] text-[#0a192f] text-[11px] font-bold flex items-center justify-center tabular-nums">
                {cart.length}
              </span>
            )}
          </button>

          {/* Auth Controls */}
          {currentUser ? (
            <div className="relative" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-expanded={userMenuOpen}
                aria-label="Account menu"
                className="inline-flex items-center gap-2 pl-2 pr-3 py-1.5 bg-[#112240] border border-[#d4af37]/50 rounded-md hover:border-[#d4af37] text-sm font-medium text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-[#d4af37] text-[#0a192f] text-xs font-extrabold flex items-center justify-center">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {currentUser.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#f5c451]" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {currentUser.email} · {currentUser.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/library');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span>My Learning & Library</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/membership');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-[#b4690e]" />
                    <span>Membership Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/affiliates');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-slate-500" />
                    <span>Affiliate Dashboard</span>
                  </button>
                  {(currentUser.role === 'instructor' || currentUser.role === 'admin') && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/instructor');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4 text-slate-500" />
                      <span>Instructor & Blog Studio</span>
                    </button>
                  )}
                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/admin');
                      }}
                      className="w-full px-4 py-2 text-left text-sm font-semibold text-[#2271b1] hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Admin Console</span>
                    </button>
                  )}
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/login');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Switch Demo Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="hidden sm:inline-flex px-3.5 py-2 text-sm font-semibold text-[#f5c451] border border-[#d4af37]/70 rounded-md hover:bg-[#112240] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => navigate('/membership')}
                className="hidden sm:inline-flex px-3.5 py-2 text-sm font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Go Pro
              </button>
            </div>
          )}

          {/* Mobile / Tablet Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle mobile menu"
            className="xl:hidden p-2 text-slate-200 hover:text-[#f5c451] hover:bg-[#112240] rounded-md cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile & Tablet Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t-2 border-[#d4af37] bg-[#0a192f] text-white px-4 py-4 space-y-4 max-h-[84vh] overflow-y-auto shadow-2xl">
          {/* Mobile Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  goToRoute('/');
                }
              }}
              placeholder="Search courses, digital products, blogs..."
              aria-label="Mobile search catalog"
              className="w-full h-10 pl-10 pr-3 text-sm bg-[#112240] border border-[#263d66] text-white placeholder:text-slate-400 rounded-md focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          {/* Section 1: Organized Vertical Navigation + Accordion Submenus */}
          <nav aria-label="Mobile navigation" className="divide-y divide-[#1b3155] border border-[#233554] rounded-lg bg-[#0d1f3a] overflow-hidden">
            <button
              type="button"
              onClick={() => goToRoute('/courses')}
              className={`w-full px-3.5 py-3 text-sm font-semibold flex items-center justify-between hover:bg-[#142a4d] transition-colors cursor-pointer ${
                isCoursesActive ? 'text-[#f5c451]' : 'text-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <PlayCircle className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Courses</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Digital Products Collapsible Submenu */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setMobileDigitalOpen((prev) => !prev);
                  setMobileBlogsOpen(false);
                }}
                aria-expanded={mobileDigitalOpen}
                className={`w-full px-3.5 py-3 text-sm font-semibold flex items-center justify-between hover:bg-[#142a4d] transition-colors cursor-pointer ${
                  isDigitalActive || mobileDigitalOpen ? 'text-[#f5c451]' : 'text-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span>Digital Products</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#d4af37] transition-transform duration-200 ${
                    mobileDigitalOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {mobileDigitalOpen && (
                <div className="bg-[#081528] border-t border-[#1b3155] pl-7 pr-3 py-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => goToRoute('/digital-products')}
                    className="w-full py-2 px-2.5 text-xs font-bold text-[#f5c451] hover:bg-[#112240] rounded text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>All Digital Products Hub</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  {DIGITAL_SUBMENU_ITEMS.map((sub) => (
                    <button
                      key={sub.subType}
                      type="button"
                      onClick={() => goToRoute(sub.route)}
                      className="w-full py-2 px-2.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-[#112240] rounded text-left flex items-center justify-between cursor-pointer"
                    >
                      <span>{sub.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => goToRoute('/software')}
              className={`w-full px-3.5 py-3 text-sm font-semibold flex items-center justify-between hover:bg-[#142a4d] transition-colors cursor-pointer ${
                isSoftwareActive ? 'text-[#f5c451]' : 'text-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Software</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Blogs Collapsible Category Submenu */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setMobileBlogsOpen((prev) => !prev);
                  setMobileDigitalOpen(false);
                }}
                aria-expanded={mobileBlogsOpen}
                className={`w-full px-3.5 py-3 text-sm font-semibold flex items-center justify-between hover:bg-[#142a4d] transition-colors cursor-pointer ${
                  isBlogsActive || mobileBlogsOpen ? 'text-[#f5c451]' : 'text-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span>Blogs</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#d4af37] transition-transform duration-200 ${
                    mobileBlogsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {mobileBlogsOpen && (
                <div className="bg-[#081528] border-t border-[#1b3155] pl-7 pr-3 py-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => goToRoute('/blogs')}
                    className="w-full py-2 px-2.5 text-xs font-bold text-[#f5c451] hover:bg-[#112240] rounded text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>All Blog Articles</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  {BLOG_CATEGORY_ITEMS.map((cat) => (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => goToRoute(cat.route)}
                      className="w-full py-2 px-2.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-[#112240] rounded text-left flex items-center justify-between cursor-pointer"
                    >
                      <span>{cat.category}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => goToRoute('/events')}
              className={`w-full px-3.5 py-3 text-sm font-semibold flex items-center justify-between hover:bg-[#142a4d] transition-colors cursor-pointer ${
                isEventsActive ? 'text-[#f5c451]' : 'text-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Events & Workshops</span>
              </span>
              <span className="text-[10px] font-bold text-[#f5c451] bg-[#162a4d] border border-[#d4af37]/40 px-2 py-0.5 rounded">
                Live
              </span>
            </button>

            <button
              type="button"
              onClick={() => goToRoute('/membership')}
              className={`w-full px-3.5 py-3 text-sm font-semibold flex items-center justify-between hover:bg-[#142a4d] transition-colors cursor-pointer ${
                isMembershipActive ? 'text-[#f5c451]' : 'text-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Crown className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Membership Plans</span>
              </span>
              <span className="text-[11px] font-bold text-[#0a192f] bg-[#d4af37] px-2 py-0.5 rounded">
                VIP
              </span>
            </button>

            <button
              type="button"
              onClick={() => goToRoute('/showcase')}
              className={`w-full px-3.5 py-3 text-sm font-semibold flex items-center justify-between hover:bg-[#142a4d] transition-colors cursor-pointer ${
                isShowcaseActive ? 'text-[#f5c451]' : 'text-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Showcase</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => goToRoute('/affiliates')}
              className="w-full px-3.5 py-3 text-sm font-semibold text-slate-100 flex items-center justify-between hover:bg-[#142a4d] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Share2 className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Affiliate Program</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </nav>

          {/* Section 2: Account & Library */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => goToRoute('/library')}
              className="w-full px-3.5 py-2.5 text-sm font-medium bg-[#112240] hover:bg-[#162a4d] border border-[#233554] rounded-md text-slate-100 flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-[#d4af37]" />
                <span>My Library & Certificates</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {currentUser ? (
              <div className="bg-[#112240] border border-[#233554] rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {currentUser.email} · {currentUser.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-rose-300 border border-rose-500/40 rounded hover:bg-rose-500/10 cursor-pointer shrink-0"
                  >
                    Sign out
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1 border-t border-[#233554]">
                  {(currentUser.role === 'instructor' || currentUser.role === 'admin') && (
                    <button
                      type="button"
                      onClick={() => goToRoute('/instructor')}
                      className="flex-1 py-1.5 px-2.5 text-xs font-semibold bg-[#0d1d36] border border-[#263d66] rounded text-slate-100 cursor-pointer"
                    >
                      Instructor Studio
                    </button>
                  )}
                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => goToRoute('/admin')}
                      className="flex-1 py-1.5 px-2.5 text-xs font-bold bg-[#d4af37] text-[#0a192f] rounded cursor-pointer"
                    >
                      Admin Console
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => goToRoute('/login')}
                    className="flex-1 py-1.5 px-2.5 text-xs font-medium bg-[#0d1d36] border border-[#263d66] rounded text-slate-200 cursor-pointer"
                  >
                    Switch Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => goToRoute('/login')}
                  className="py-2.5 px-3 text-xs font-bold text-[#f5c451] border border-[#d4af37]/70 bg-[#112240] hover:bg-[#162a4d] rounded-md cursor-pointer"
                >
                  Log in / Sign up
                </button>
                <button
                  type="button"
                  onClick={() => goToRoute('/membership')}
                  className="py-2.5 px-3 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md cursor-pointer"
                >
                  Membership Plans
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Direct Support & Share */}
          <div className="grid grid-cols-2 gap-2 border-t border-[#233554] pt-3">
            <a
              href={buildCallUrl()}
              className="py-2.5 px-3 text-xs font-bold text-white bg-[#112240] border border-[#d4af37]/50 rounded-md inline-flex items-center justify-center gap-1.5 hover:bg-[#162a4d]"
            >
              <Phone className="w-4 h-4 text-[#f5c451]" />
              <span>Call Support</span>
            </a>
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-md inline-flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Chat</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
