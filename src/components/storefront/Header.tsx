import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  Code2,
  Crown,
  FileText,
  Globe,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Package,
  PlayCircle,
  Search,
  Share2,
  ShoppingCart,
  Sparkles,
  Sun,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  BLOG_CATEGORY_ITEMS,
  DIGITAL_SUBMENU_ITEMS,
} from '../../utils/catalogAndBlogs';
import { formatNaira } from '../../utils/currency';
import { formatProductTypeLabel } from '../../utils/theme';

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
    activeUserMembership,
    logout,
    navigate,
    route,
    theme,
    toggleTheme,
  } = useStore();

  const [productsMenuOpen, setProductsMenuOpen] = useState(false);
  const [blogsMenuOpen, setBlogsMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mobile accordion states
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [mobileBlogsOpen, setMobileBlogsOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const blogsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setSearchFocused(false);
      if (userRef.current && !userRef.current.contains(target)) setUserMenuOpen(false);
      if (productsRef.current && !productsRef.current.contains(target)) setProductsMenuOpen(false);
      if (blogsRef.current && !blogsRef.current.contains(target)) setBlogsMenuOpen(false);
      if (moreRef.current && !moreRef.current.contains(target)) setMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const closeAllMenus = () => {
    setProductsMenuOpen(false);
    setBlogsMenuOpen(false);
    setMoreMenuOpen(false);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    setSearchFocused(false);
  };

  const goToRoute = (path: string) => {
    closeAllMenus();
    navigate(path);
  };

  const isRouteActive = (prefix: string) =>
    route === prefix || (prefix !== '/' && route.startsWith(prefix));

  // Instant Search Results
  const searchQuery = filters.search.trim().toLowerCase();
  const searchProductResults = useMemo(() => {
    if (!searchQuery) return [];
    return products
      .filter(
        (p) =>
          p.status === 'published' &&
          (p.title.toLowerCase().includes(searchQuery) ||
            p.instructorName.toLowerCase().includes(searchQuery) ||
            p.category.toLowerCase().includes(searchQuery) ||
            (p.digitalSubType ?? '').toLowerCase().includes(searchQuery))
      )
      .slice(0, 4);
  }, [products, searchQuery]);

  const searchBlogResults = useMemo(() => {
    if (!searchQuery) return [];
    return blogPosts
      .filter(
        (b) =>
          b.status === 'published' &&
          (b.title.toLowerCase().includes(searchQuery) ||
            b.category.toLowerCase().includes(searchQuery) ||
            b.tags.some((t) => t.toLowerCase().includes(searchQuery)))
      )
      .slice(0, 3);
  }, [blogPosts, searchQuery]);

  return (
    <header className="sticky top-0 z-40 bg-[#0a192f] border-b-2 border-[#d4af37] shadow-lg">
      {/* Contained Top Bar - strict height, overflow protected */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 md:gap-4 overflow-visible">
        
        {/* Brand Identity */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setFilters((prev) => ({ ...prev, type: 'all', category: 'All', search: '' }));
              goToRoute('/');
            }}
            className="flex items-center gap-2 text-left group cursor-pointer select-none"
            aria-label="DIGITAL WEALTH CREATORS (DWC) Home"
          >
            {/* DWC Monogram Badge */}
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-[#f5c451] via-[#d4af37] to-[#b89728] text-[#0a192f] font-black text-xs sm:text-sm tracking-wider flex items-center justify-center shadow-md shrink-0 border border-[#f5c451]/60 group-hover:scale-105 transition-transform">
              DWC
            </span>
            {/* Two-Line Brand Name */}
            <div className="flex flex-col leading-none">
              <span className="font-display text-[11px] sm:text-[13px] font-extrabold text-white tracking-wider uppercase group-hover:text-[#f5c451] transition-colors whitespace-nowrap">
                DIGITAL WEALTH
              </span>
              <span className="font-display text-[9px] sm:text-[10px] font-bold text-[#f5c451] tracking-widest uppercase mt-0.5 whitespace-nowrap">
                CREATORS
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links - Organized & Contained */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center max-w-2xl px-2">
          {/* Courses */}
          <button
            type="button"
            onClick={() => goToRoute('/courses')}
            className={`px-3 py-1.5 text-xs xl:text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              isRouteActive('/courses')
                ? 'bg-[#112240] text-[#f5c451] border border-[#d4af37]/40'
                : 'text-slate-200 hover:text-[#f5c451] hover:bg-[#112240]'
            }`}
          >
            Courses
          </button>

          {/* Products Dropdown */}
          <div className="relative" ref={productsRef}>
            <button
              type="button"
              onClick={() => {
                setProductsMenuOpen((prev) => !prev);
                setBlogsMenuOpen(false);
                setMoreMenuOpen(false);
              }}
              className={`px-3 py-1.5 text-xs xl:text-sm font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                isRouteActive('/digital-products') || isRouteActive('/software')
                  ? 'bg-[#112240] text-[#f5c451] border border-[#d4af37]/40'
                  : 'text-slate-200 hover:text-[#f5c451] hover:bg-[#112240]'
              }`}
            >
              <span>Products</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#d4af37] transition-transform ${productsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {productsMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-60 bg-white text-slate-900 border border-slate-200 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                <button
                  type="button"
                  onClick={() => goToRoute('/digital-products')}
                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-[#0a192f] hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-[#0a192f]" />
                    <span>All Digital Products</span>
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Hub</span>
                </button>
                {DIGITAL_SUBMENU_ITEMS.map((item) => (
                  <button
                    key={item.subType}
                    type="button"
                    onClick={() => goToRoute(item.route)}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:text-[#0a192f] hover:bg-slate-50 cursor-pointer flex flex-col"
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] text-slate-500 truncate">{item.headline}</span>
                  </button>
                ))}
                <div className="border-t border-slate-100 my-1" />
                <button
                  type="button"
                  onClick={() => goToRoute('/software')}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Software & Licenses</span>
                </button>
              </div>
            )}
          </div>

          {/* Blogs Dropdown */}
          <div className="relative" ref={blogsRef}>
            <button
              type="button"
              onClick={() => {
                setBlogsMenuOpen((prev) => !prev);
                setProductsMenuOpen(false);
                setMoreMenuOpen(false);
              }}
              className={`px-3 py-1.5 text-xs xl:text-sm font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                isRouteActive('/blogs') || isRouteActive('/blog')
                  ? 'bg-[#112240] text-[#f5c451] border border-[#d4af37]/40'
                  : 'text-slate-200 hover:text-[#f5c451] hover:bg-[#112240]'
              }`}
            >
              <span>Blogs</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#d4af37] transition-transform ${blogsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {blogsMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-56 bg-white text-slate-900 border border-slate-200 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                <button
                  type="button"
                  onClick={() => goToRoute('/blogs')}
                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-[#0a192f] hover:bg-slate-50 border-b border-slate-100 cursor-pointer flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-[#0a192f]" />
                  <span>All Editorial Articles</span>
                </button>
                {BLOG_CATEGORY_ITEMS.map((item) => (
                  <button
                    key={item.category}
                    type="button"
                    onClick={() => goToRoute(item.route)}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:text-[#0a192f] hover:bg-slate-50 cursor-pointer"
                  >
                    {item.category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Community */}
          <button
            type="button"
            onClick={() => goToRoute('/community')}
            className={`px-3 py-1.5 text-xs xl:text-sm font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              isRouteActive('/community')
                ? 'bg-[#112240] text-[#f5c451] border border-[#d4af37]/40'
                : 'text-slate-200 hover:text-[#f5c451] hover:bg-[#112240]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Community</span>
          </button>

          {/* Membership Plans */}
          <button
            type="button"
            onClick={() => goToRoute('/membership')}
            className={`px-3 py-1.5 text-xs xl:text-sm font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              isRouteActive('/membership')
                ? 'bg-[#112240] text-[#f5c451] border border-[#d4af37]/40'
                : 'text-slate-200 hover:text-[#f5c451] hover:bg-[#112240]'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-[#b4690e]" />
            <span>Membership</span>
          </button>

          {/* More Dropdown (Prompt Vault, Events, Affiliates, Showcase) */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => {
                setMoreMenuOpen((prev) => !prev);
                setProductsMenuOpen(false);
                setBlogsMenuOpen(false);
              }}
              className={`px-3 py-1.5 text-xs xl:text-sm font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                isRouteActive('/vault') || isRouteActive('/events') || isRouteActive('/affiliates') || isRouteActive('/showcase')
                  ? 'bg-[#112240] text-[#f5c451] border border-[#d4af37]/40'
                  : 'text-slate-200 hover:text-[#f5c451] hover:bg-[#112240]'
              }`}
            >
              <span>Explore</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#d4af37] transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white text-slate-900 border border-slate-200 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                <button
                  type="button"
                  onClick={() => goToRoute('/promoter')}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Promoter & Facilitator</span>
                  </span>
                  <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                    S.B.O.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => goToRoute('/vault')}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#5624d0]" />
                    <span>Member Prompt Vault</span>
                  </span>
                  <span className="text-[9px] font-bold uppercase bg-purple-100 text-[#5624d0] px-1.5 py-0.5 rounded">
                    AI VIP
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => goToRoute('/events')}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#0a192f]" />
                  <span>Events & Workshops</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToRoute('/affiliates')}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Affiliate Program (20%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToRoute('/showcase')}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-[#0a192f]" />
                  <span>Platform Showcase</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Right Section: Compact Search, Wishlist, Cart, User & Mobile Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Quick Search Input */}
          <div className="relative hidden md:block w-36 lg:w-48" ref={searchRef}>
            <Search className="w-3.5 h-3.5 text-[#d4af37] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={filters.search}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, search: e.target.value }));
                setSearchFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchFocused(false);
                  if (route !== '/') navigate('/');
                }
              }}
              placeholder="Search..."
              className="w-full h-8 pl-8 pr-2.5 text-xs bg-[#112240] border border-[#263d66] rounded-md text-white placeholder:text-slate-400 focus:border-[#d4af37] focus:outline-none transition-colors"
            />

            {/* Instant Search Dropdown */}
            {searchFocused && searchQuery.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
                {searchProductResults.length === 0 && searchBlogResults.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-slate-500">No results found for "{filters.search}"</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {searchProductResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => goToRoute(`/product/${product.slug}`)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{product.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {formatProductTypeLabel(product.type, product.digitalSubType)}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-900 shrink-0 tabular-nums">
                          {formatNaira(product.price)}
                        </span>
                      </button>
                    ))}
                    {searchBlogResults.map((post) => (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => goToRoute(`/blog/${post.slug}`)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer bg-slate-50/50"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{post.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">Blog · {post.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 1-Click Theme Toggle (Desktop) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 sm:p-2 text-slate-200 hover:text-[#f5c451] rounded-md hover:bg-[#112240] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-200" />
            )}
          </button>

          {/* Wishlist */}
          <button
            type="button"
            onClick={() => goToRoute('/library?tab=wishlist')}
            aria-label={`Wishlist (${wishlist.length})`}
            className="relative p-1.5 sm:p-2 text-slate-200 hover:text-[#f5c451] rounded-md hover:bg-[#112240] transition-colors cursor-pointer"
          >
            <Heart className="w-4 h-4" />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#d4af37] text-[#0a192f] text-[9px] font-bold flex items-center justify-center tabular-nums">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Shopping Cart (${cart.length})`}
            className="relative p-1.5 sm:p-2 text-slate-200 hover:text-[#f5c451] rounded-md hover:bg-[#112240] transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            {cart.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#d4af37] text-[#0a192f] text-[9px] font-bold flex items-center justify-center tabular-nums">
                {cart.length}
              </span>
            )}
          </button>

          {/* Authenticated User or Login CTA */}
          {currentUser ? (
            <div className="relative" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-[#112240] border border-[#d4af37]/40 rounded-md hover:border-[#d4af37] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <span className="w-5 h-5 rounded-full bg-[#d4af37] text-[#0a192f] text-[10px] font-black flex items-center justify-center">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline max-w-[70px] truncate">{currentUser.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-[#f5c451]" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white text-slate-900 border border-slate-200 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{currentUser.email} · {currentUser.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToRoute('/library')}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Learning & Library</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => goToRoute('/community')}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>Community & Chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => goToRoute('/membership')}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-[#b4690e]" />
                    <span>Membership Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => goToRoute('/vault')}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#5624d0]" />
                      <span>Prompt Vault</span>
                    </span>
                    {activeUserMembership?.status === 'active' && (
                      <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        VIP
                      </span>
                    )}
                  </button>
                  {(currentUser.role === 'instructor' || currentUser.role === 'admin') && (
                    <button
                      type="button"
                      onClick={() => goToRoute('/instructor')}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Instructor Studio</span>
                    </button>
                  )}
                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => goToRoute('/admin')}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-[#2271b1] hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Admin Console</span>
                    </button>
                  )}
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={() => goToRoute('/login')}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Switch Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeAllMenus();
                      logout();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => goToRoute('/login')}
                className="hidden sm:inline-flex px-2.5 py-1 text-xs font-bold text-[#f5c451] border border-[#d4af37]/60 rounded-md hover:bg-[#112240] transition-colors cursor-pointer"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => goToRoute('/membership')}
                className="hidden sm:inline-flex px-2.5 py-1 text-xs font-extrabold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md transition-colors cursor-pointer"
              >
                Join
              </button>
            </div>
          )}

          {/* Mobile Drawer Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation drawer"
            className="lg:hidden p-1.5 text-slate-200 hover:text-[#f5c451] hover:bg-[#112240] rounded-md cursor-pointer transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#f5c451]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Dynamic & Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-[#d4af37] bg-[#0a192f] text-white shadow-2xl animate-in slide-in-from-top-2 max-h-[85vh] overflow-y-auto">
          {/* Mobile Brand Monogram & Title Banner */}
          <div className="px-3.5 py-2.5 border-b border-[#1b3155] bg-[#081528] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f5c451] via-[#d4af37] to-[#b89728] text-[#0a192f] font-black text-xs tracking-wider flex items-center justify-center shadow-md shrink-0 border border-[#f5c451]/60">
                DWC
              </span>
              <div className="flex flex-col leading-none">
                <span className="font-display text-xs font-extrabold text-white tracking-wider uppercase">
                  DIGITAL WEALTH
                </span>
                <span className="font-display text-[10px] font-bold text-[#f5c451] tracking-widest uppercase mt-0.5">
                  CREATORS
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#112240] text-[#f5c451] border border-[#263d66] font-mono font-bold">
              DWC
            </span>
          </div>

          {/* Mobile Search */}
          <div className="p-3 border-b border-[#1b3155]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#d4af37] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    closeAllMenus();
                    if (route !== '/') navigate('/');
                  }
                }}
                placeholder="Search courses, products, blogs..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-[#112240] border border-[#263d66] text-white placeholder:text-slate-400 rounded-md focus:border-[#d4af37] focus:outline-none"
              />
            </div>
          </div>

          {/* Mobile Theme Toggle Row */}
          <div className="px-3 py-2 border-b border-[#1b3155] flex items-center justify-between bg-[#081528]">
            <span className="text-xs font-semibold text-slate-300">Theme</span>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md bg-[#112240] border border-[#263d66] text-white hover:text-[#f5c451] cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-200" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile Navigation List with Dynamic Accordions */}
          <div className="p-2 space-y-1">
            {/* Courses */}
            <button
              type="button"
              onClick={() => goToRoute('/courses')}
              className={`w-full px-3 py-2.5 text-xs font-bold rounded-md flex items-center justify-between transition-colors cursor-pointer ${
                isRouteActive('/courses') ? 'bg-[#112240] text-[#f5c451]' : 'text-slate-200 hover:bg-[#112240]'
              }`}
            >
              <span className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-[#d4af37]" />
                <span>Courses Catalog</span>
              </span>
            </button>

            {/* Products Accordion */}
            <div className="border border-[#1b3155] rounded-md overflow-hidden bg-[#0a192f]">
              <button
                type="button"
                onClick={() => setMobileProductsOpen((prev) => !prev)}
                className="w-full px-3 py-2.5 text-xs font-bold flex items-center justify-between text-slate-200 hover:bg-[#112240] cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#d4af37]" />
                  <span>Digital Products & Software</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#d4af37] transition-transform ${mobileProductsOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileProductsOpen && (
                <div className="bg-[#081528] px-3 py-1.5 space-y-1 border-t border-[#1b3155]">
                  <button
                    type="button"
                    onClick={() => goToRoute('/digital-products')}
                    className="w-full py-1.5 px-2 text-left text-xs font-bold text-[#f5c451] hover:bg-[#112240] rounded cursor-pointer"
                  >
                    All Digital Products Hub
                  </button>
                  {DIGITAL_SUBMENU_ITEMS.map((item) => (
                    <button
                      key={item.subType}
                      type="button"
                      onClick={() => goToRoute(item.route)}
                      className="w-full py-1.5 px-2 text-left text-xs text-slate-300 hover:text-white hover:bg-[#112240] rounded cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => goToRoute('/software')}
                    className="w-full py-1.5 px-2 text-left text-xs font-medium text-slate-300 hover:text-white hover:bg-[#112240] rounded cursor-pointer"
                  >
                    Software & Licenses
                  </button>
                </div>
              )}
            </div>

            {/* Blogs Accordion */}
            <div className="border border-[#1b3155] rounded-md overflow-hidden bg-[#0a192f]">
              <button
                type="button"
                onClick={() => setMobileBlogsOpen((prev) => !prev)}
                className="w-full px-3 py-2.5 text-xs font-bold flex items-center justify-between text-slate-200 hover:bg-[#112240] cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#d4af37]" />
                  <span>Blogs & Articles</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#d4af37] transition-transform ${mobileBlogsOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileBlogsOpen && (
                <div className="bg-[#081528] px-3 py-1.5 space-y-1 border-t border-[#1b3155]">
                  <button
                    type="button"
                    onClick={() => goToRoute('/blogs')}
                    className="w-full py-1.5 px-2 text-left text-xs font-bold text-[#f5c451] hover:bg-[#112240] rounded cursor-pointer"
                  >
                    All Articles
                  </button>
                  {BLOG_CATEGORY_ITEMS.map((item) => (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => goToRoute(item.route)}
                      className="w-full py-1.5 px-2 text-left text-xs text-slate-300 hover:text-white hover:bg-[#112240] rounded cursor-pointer"
                    >
                      {item.category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Community Link */}
            <button
              type="button"
              onClick={() => goToRoute('/community')}
              className={`w-full px-3 py-2.5 text-xs font-bold rounded-md flex items-center justify-between transition-colors cursor-pointer ${
                isRouteActive('/community') ? 'bg-[#112240] text-[#f5c451]' : 'text-slate-200 hover:bg-[#112240]'
              }`}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#d4af37]" />
                <span>Community & Chat Channels</span>
              </span>
              <span className="text-[9px] font-bold uppercase bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded">
                Live
              </span>
            </button>

            {/* Membership Link */}
            <button
              type="button"
              onClick={() => goToRoute('/membership')}
              className={`w-full px-3 py-2.5 text-xs font-bold rounded-md flex items-center justify-between transition-colors cursor-pointer ${
                isRouteActive('/membership') ? 'bg-[#112240] text-[#f5c451]' : 'text-slate-200 hover:bg-[#112240]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#d4af37]" />
                <span>Membership Plans</span>
              </span>
              <span className="text-[9px] font-black uppercase bg-[#d4af37] text-[#0a192f] px-1.5 py-0.5 rounded">
                VIP
              </span>
            </button>

            {/* Explore More Accordion */}
            <div className="border border-[#1b3155] rounded-md overflow-hidden bg-[#0a192f]">
              <button
                type="button"
                onClick={() => setMobileMoreOpen((prev) => !prev)}
                className="w-full px-3 py-2.5 text-xs font-bold flex items-center justify-between text-slate-200 hover:bg-[#112240] cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span>Prompt Vault & More</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#d4af37] transition-transform ${mobileMoreOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileMoreOpen && (
                <div className="bg-[#081528] px-3 py-1.5 space-y-1 border-t border-[#1b3155]">
                  <button
                    type="button"
                    onClick={() => goToRoute('/promoter')}
                    className="w-full py-1.5 px-2 text-left text-xs font-semibold text-amber-300 hover:bg-[#112240] rounded cursor-pointer flex items-center justify-between"
                  >
                    <span>Promoter & Facilitator</span>
                    <span className="text-[9px] bg-amber-900 text-amber-200 px-1.5 py-0.5 rounded">S.B.O.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => goToRoute('/vault')}
                    className="w-full py-1.5 px-2 text-left text-xs font-semibold text-purple-300 hover:bg-[#112240] rounded cursor-pointer flex items-center justify-between"
                  >
                    <span>Member Prompt Vault</span>
                    <span className="text-[9px] bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded">VIP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => goToRoute('/events')}
                    className="w-full py-1.5 px-2 text-left text-xs text-slate-300 hover:text-white hover:bg-[#112240] rounded cursor-pointer"
                  >
                    Events & Workshops
                  </button>
                  <button
                    type="button"
                    onClick={() => goToRoute('/affiliates')}
                    className="w-full py-1.5 px-2 text-left text-xs text-slate-300 hover:text-white hover:bg-[#112240] rounded cursor-pointer"
                  >
                    Affiliate Program (20% Commission)
                  </button>
                  <button
                    type="button"
                    onClick={() => goToRoute('/showcase')}
                    className="w-full py-1.5 px-2 text-left text-xs text-slate-300 hover:text-white hover:bg-[#112240] rounded cursor-pointer"
                  >
                    Platform Showcase
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* User Account Quick Controls (Mobile) */}
          <div className="p-3 border-t border-[#1b3155] bg-[#071324]">
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      closeAllMenus();
                      logout();
                    }}
                    className="px-2 py-1 text-xs font-bold text-rose-400 border border-rose-500/30 rounded hover:bg-rose-500/10 cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => goToRoute('/library')}
                    className="py-1.5 px-2 text-xs font-semibold bg-[#112240] border border-[#233554] rounded text-slate-200 hover:text-white cursor-pointer text-center"
                  >
                    My Library
                  </button>
                  {currentUser.role === 'admin' ? (
                    <button
                      type="button"
                      onClick={() => goToRoute('/admin')}
                      className="py-1.5 px-2 text-xs font-bold bg-[#d4af37] text-[#0a192f] rounded cursor-pointer text-center"
                    >
                      Admin
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => goToRoute('/login')}
                      className="py-1.5 px-2 text-xs font-medium bg-[#112240] border border-[#233554] rounded text-slate-300 cursor-pointer text-center"
                    >
                      Switch Account
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => goToRoute('/login')}
                  className="py-2 text-xs font-bold text-[#f5c451] border border-[#d4af37]/60 rounded-md hover:bg-[#112240] cursor-pointer text-center"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => goToRoute('/membership')}
                  className="py-2 text-xs font-extrabold text-[#0a192f] bg-[#d4af37] rounded-md hover:bg-[#e5bf45] cursor-pointer text-center"
                >
                  Join Membership
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
