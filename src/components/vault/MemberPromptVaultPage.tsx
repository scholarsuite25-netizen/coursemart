import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  Unlock,
  Copy,
  Check,
  Search,
  SlidersHorizontal,
  Crown,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Code,
  ArrowRight,
  Bot,
  Hash,
  Eye,
  RefreshCw,
  Layers,
  Plus,
  Trash2,
  Bookmark,
  BookmarkCheck,
  Wand2,
  Send,
  HelpCircle,
  FolderPlus,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SEED_PROMPT_VAULT_ITEMS } from '../../data/seedData';
import type {
  PromptVaultCategory,
  PromptVaultItem,
  SavedCustomizedPrompt,
} from '../../types/marketplace';
import {
  isPromptVaultAccessible,
  interpolatePromptTemplate,
  extractPromptVariables,
  filterPromptVault,
  synthesizeStandardPrompt,
} from '../../utils/funnelsAndVault';

const ITEMS_PER_PAGE = 4;

interface MemberPromptVaultPageProps {
  initialCategory?: string;
}

export function MemberPromptVaultPage({ initialCategory }: MemberPromptVaultPageProps) {
  const {
    currentUser,
    activeUserMembership,
    navigate,
    showToast,
    promptVaultCategories,
    addPromptVaultCategory,
    customPromptVaultItems,
    addCustomPromptVaultItem,
    deleteCustomPromptVaultItem,
    savedStudentPrompts,
    saveStudentPrompt,
    deleteStudentPrompt,
  } = useStore();

  const isAdmin = currentUser?.role === 'admin';

  // Access Evaluation
  const accessResult = useMemo(() => {
    return isPromptVaultAccessible(currentUser, activeUserMembership);
  }, [currentUser, activeUserMembership]);

  const hasAccess = accessResult.accessible || isAdmin;

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'featured' | 'popular' | 'alpha'>('featured');

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
      setCategoryPage(1);
    }
  }, [initialCategory]);

  // Pagination State for Single Category view
  const [categoryPage, setCategoryPage] = useState<number>(1);
  // Pagination State for My Saved Prompts view
  const [savedPromptsPage, setSavedPromptsPage] = useState<number>(1);
  // Per-category pagination state for "All" view carousel sections: { [categoryName]: pageNumber }
  const [allViewCategoryPages, setAllViewCategoryPages] = useState<Record<string, number>>({});

  // Modals
  const [customizingItem, setCustomizingItem] = useState<PromptVaultItem | null>(null);
  const [editingSavedPrompt, setEditingSavedPrompt] = useState<SavedCustomizedPrompt | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);
  const [aiEnhancerModalOpen, setAiEnhancerModalOpen] = useState<boolean>(false);
  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState<boolean>(false);
  const [addPromptModalOpen, setAddPromptModalOpen] = useState<boolean>(false);

  // Quick Copy Feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Combine seed items with admin custom items
  const allPrompts = useMemo(() => {
    return [...SEED_PROMPT_VAULT_ITEMS, ...customPromptVaultItems];
  }, [customPromptVaultItems]);

  // Categories list from store context
  const availableCategories = useMemo(() => {
    return promptVaultCategories;
  }, [promptVaultCategories]);

  // Reset pagination when category, query, or tag changes
  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedTag(null);
    setCategoryPage(1);
    setSavedPromptsPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCategoryPage(1);
  };

  // Filter items for the selected category / search
  const filteredPrompts = useMemo(() => {
    let list = filterPromptVault(allPrompts, {
      category: selectedCategory === '📂 My Saved Prompts' ? 'All' : selectedCategory,
      query: searchQuery,
    });

    if (selectedTag) {
      list = list.filter((p) =>
        (p.tags || []).some((t) => typeof t === 'string' && t.toLowerCase() === selectedTag.toLowerCase())
      );
    }

    if (sortBy === 'popular') {
      return [...list].sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0));
    }
    if (sortBy === 'alpha') {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [allPrompts, selectedCategory, searchQuery, selectedTag, sortBy]);

  // Safe programmatic copy with fallback
  const copyToClipboard = useCallback(
    async (text: string, idForFeedback?: string) => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.left = '-9999px';
          textarea.style.top = '-9999px';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }

        if (idForFeedback) {
          setCopiedId(idForFeedback);
          setTimeout(() => setCopiedId(null), 2000);
        }
        showToast('Prompt copied to clipboard! Ready to paste into AI.');
      } catch (err) {
        showToast('Failed to copy. Please select and copy manually.');
      }
    },
    [showToast]
  );

  // Single category pagination calculation
  const totalCategoryPages = Math.max(1, Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE));
  const currentCategorySlice = useMemo(() => {
    const start = (categoryPage - 1) * ITEMS_PER_PAGE;
    return filteredPrompts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPrompts, categoryPage]);

  // Saved prompts pagination calculation
  const totalSavedPages = Math.max(1, Math.ceil(savedStudentPrompts.length / ITEMS_PER_PAGE));
  const currentSavedSlice = useMemo(() => {
    const start = (savedPromptsPage - 1) * ITEMS_PER_PAGE;
    return savedStudentPrompts.slice(start, start + ITEMS_PER_PAGE);
  }, [savedStudentPrompts, savedPromptsPage]);

  // Helper for per-category pagination in "All" view
  const getCatPage = (catName: string) => allViewCategoryPages[catName] || 1;
  const setCatPage = (catName: string, page: number) => {
    setAllViewCategoryPages((prev) => ({ ...prev, [catName]: page }));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-[#f5c451] selection:text-slate-950 pb-20">
      {/* 1. Hero Header Banner */}
      <section className="bg-gradient-to-b from-[#0a192f] via-slate-900 to-slate-900 border-b border-slate-800 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f5c451]/15 text-[#f5c451] border border-[#f5c451]/30">
                <Sparkles className="w-3.5 h-3.5" />
                Member Intelligence Vault
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                AI Prompt Engineering Vault
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Curated library of battle-tested prompts across all domains. Customize live on your
                dashboard, enhance vague ideas with AI, and copy new versions directly into ChatGPT,
                Claude, Gemini, or Cursor.
              </p>

              {/* Action Buttons in Hero */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAiEnhancerModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Wand2 className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>AI Prompt Enhancer (CO-STAR Principles)</span>
                </button>

                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => setAddCategoryModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-[#f5c451]" />
                      <span>+ Add Category</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddPromptModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>+ Add Custom Prompt</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Access status badge */}
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl shadow-xl flex items-center gap-3.5">
              {hasAccess ? (
                <>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      {isAdmin ? 'Admin Master Access' : 'VIP Access Active'}
                    </div>
                    <div className="text-xs text-slate-300">
                      Interactive engine & 1-click copy unlocked
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-amber-400">
                      Teaser Preview Mode
                    </div>
                    <button
                      type="button"
                      onClick={() => setUpgradeModalOpen(true)}
                      className="text-xs font-bold text-[#f5c451] hover:underline focus:outline-none flex items-center gap-1 mt-0.5"
                    >
                      <span>Unlock with Membership</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Search & Filter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search prompts by keyword, tag, or variable..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#f5c451]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Toolbar: AI Enhancer Pill + Sort selector */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAiEnhancerModalOpen(true)}
              className="md:hidden px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Enhancer</span>
            </button>

            <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-[#f5c451]"
            >
              <option value="featured">Featured First</option>
              <option value="popular">Most Copied</option>
              <option value="alpha">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills + Saved Prompts Tab */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {availableCategories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all focus:outline-none cursor-pointer ${
                  isActive
                    ? 'bg-[#5624d0] text-white shadow-md shadow-[#5624d0]/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                {cat}
              </button>
            );
          })}

          {/* Student's Saved Prompts Tab */}
          <button
            type="button"
            onClick={() => handleSelectCategory('📂 My Saved Prompts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all focus:outline-none cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === '📂 My Saved Prompts'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-amber-300 hover:bg-slate-800 hover:text-amber-200 border border-amber-500/30'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>My Saved Prompts ({savedStudentPrompts.length})</span>
          </button>
        </div>
      </section>

      {/* 3. Main Content Views */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* VIEW A: My Saved Prompts */}
        {selectedCategory === '📂 My Saved Prompts' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-amber-400" />
                  My Customized Saved Prompts
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Prompts you customized and saved to your student dashboard. Ready to copy or re-edit anytime.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                {savedStudentPrompts.length} Saved
              </span>
            </div>

            {savedStudentPrompts.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/30 rounded-3xl border border-slate-800 space-y-4">
                <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No Saved Prompts Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click &ldquo;Customize&rdquo; on any prompt in the vault, adjust the variables, and click
                  &ldquo;Save to My Dashboard&rdquo; to store them here for instant access.
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectCategory('All')}
                  className="px-4 py-2 rounded-xl bg-[#5624d0] hover:bg-[#6830e0] text-white text-xs font-bold"
                >
                  Explore Vault Prompts
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-5">
                  {currentSavedSlice.map((saved) => (
                    <SavedPromptCard
                      key={saved.id}
                      item={saved}
                      onCopy={() => copyToClipboard(saved.customizedPrompt, saved.id)}
                      copied={copiedId === saved.id}
                      onDelete={() => {
                        deleteStudentPrompt(saved.id);
                        showToast('Prompt removed from saved list.');
                      }}
                      onEdit={() => setEditingSavedPrompt(saved)}
                    />
                  ))}
                </div>

                {/* 4-per-page Pagination Controls for Saved Prompts */}
                {totalSavedPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={savedPromptsPage <= 1}
                      onClick={() => setSavedPromptsPage((p) => Math.max(1, p - 1))}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>← Back</span>
                    </button>

                    <div className="text-xs font-semibold text-slate-400">
                      Page <strong className="text-white">{savedPromptsPage}</strong> of{' '}
                      <strong className="text-white">{totalSavedPages}</strong> ({savedStudentPrompts.length} total)
                    </div>

                    <button
                      type="button"
                      disabled={savedPromptsPage >= totalSavedPages}
                      onClick={() => setSavedPromptsPage((p) => Math.min(totalSavedPages, p + 1))}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Front / Next →</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : selectedCategory === 'All' && !searchQuery.trim() ? (
          /* VIEW B: "All" Category Sections - Each showing up to 4 prompts with individual Next/Back buttons */
          <div className="space-y-12">
            {availableCategories
              .filter((c) => c !== 'All')
              .map((catName) => {
                const catPrompts = allPrompts.filter(
                  (p) => (p.category || '').toLowerCase() === catName.toLowerCase()
                );
                if (catPrompts.length === 0) return null;

                const catPage = getCatPage(catName);
                const totalCatPages = Math.max(1, Math.ceil(catPrompts.length / ITEMS_PER_PAGE));
                const sliceStart = (catPage - 1) * ITEMS_PER_PAGE;
                const catSlice = catPrompts.slice(sliceStart, sliceStart + ITEMS_PER_PAGE);

                return (
                  <div key={catName} className="space-y-4">
                    {/* Category Header with 4-per-page pager buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f5c451]" />
                        <h2 className="text-lg font-bold text-white tracking-tight">{catName}</h2>
                        <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                          {catPrompts.length} Prompts
                        </span>
                      </div>

                      {/* Pagination buttons: Back & Front / Next */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono mr-1">
                          Showing {sliceStart + 1}–{Math.min(sliceStart + ITEMS_PER_PAGE, catPrompts.length)} of {catPrompts.length}
                        </span>

                        <button
                          type="button"
                          disabled={catPage <= 1}
                          onClick={() => setCatPage(catName, Math.max(1, catPage - 1))}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                          aria-label="Previous page in this category"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Back</span>
                        </button>

                        <button
                          type="button"
                          disabled={catPage >= totalCatPages}
                          onClick={() => setCatPage(catName, Math.min(totalCatPages, catPage + 1))}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                          aria-label="Next page in this category"
                        >
                          <span>Front / Next</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectCategory(catName)}
                          className="text-xs font-semibold text-[#f5c451] hover:underline ml-2"
                        >
                          View All →
                        </button>
                      </div>
                    </div>

                    {/* 4 Prompts in Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                      {catSlice.map((item) => (
                        <PromptCard
                          key={item.id}
                          item={item}
                          hasAccess={hasAccess}
                          copied={copiedId === item.id}
                          onQuickCopy={() => copyToClipboard(item.template, item.id)}
                          onCustomize={() => setCustomizingItem(item)}
                          onUnlock={() => setUpgradeModalOpen(true)}
                          onDelete={
                            isAdmin && item.id.startsWith('custom_')
                              ? () => {
                                  deleteCustomPromptVaultItem(item.id);
                                  showToast('Custom prompt deleted from vault.');
                                }
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          /* VIEW C: Single Category or Search Results (Paginated Max 4 with Back/Front buttons) */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5624d0]" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {selectedCategory === 'All' ? 'Search Results' : selectedCategory}
                </h2>
                <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                  {filteredPrompts.length} Prompts Found
                </span>
              </div>
            </div>

            {filteredPrompts.length === 0 ? (
              <div className="text-center py-20 bg-slate-800/40 rounded-3xl border border-slate-800 space-y-4">
                <Sparkles className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No Prompts Found</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  We couldn't find any prompts matching &ldquo;{searchQuery}&rdquo;. Try another search
                  or clear filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedTag(null);
                    setCategoryPage(1);
                  }}
                  className="text-xs font-bold text-[#f5c451] hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <>
                {/* Grid of maximum 4 prompts */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {currentCategorySlice.map((item) => (
                    <PromptCard
                      key={item.id}
                      item={item}
                      hasAccess={hasAccess}
                      copied={copiedId === item.id}
                      onQuickCopy={() => copyToClipboard(item.template, item.id)}
                      onCustomize={() => setCustomizingItem(item)}
                      onUnlock={() => setUpgradeModalOpen(true)}
                      onDelete={
                        isAdmin && item.id.startsWith('custom_')
                          ? () => {
                              deleteCustomPromptVaultItem(item.id);
                              showToast('Custom prompt deleted from vault.');
                            }
                          : undefined
                      }
                    />
                  ))}
                </div>

                {/* Pagination Controls: Maximum 4 Per Category with Back and Front / Next buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={categoryPage <= 1}
                    onClick={() => setCategoryPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>← Back</span>
                  </button>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <span>
                      Page <strong className="text-white">{categoryPage}</strong> of{' '}
                      <strong className="text-white">{totalCategoryPages}</strong>
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="font-mono text-slate-400">
                      Showing {(categoryPage - 1) * ITEMS_PER_PAGE + 1}–
                      {Math.min(categoryPage * ITEMS_PER_PAGE, filteredPrompts.length)} of {filteredPrompts.length} prompts
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={categoryPage >= totalCategoryPages}
                    onClick={() => setCategoryPage((p) => Math.min(totalCategoryPages, p + 1))}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                  >
                    <span>Front / Next →</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* 4. Prompt Customizer Modal (Editable on Dashboard with Copy Room) */}
      {customizingItem && (
        <PromptCustomizerModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onCopy={copyToClipboard}
          onSaveToDashboard={(saved) => {
            saveStudentPrompt(saved);
            showToast('Prompt saved to your dashboard! Accessible anytime under "My Saved Prompts".');
          }}
        />
      )}

      {/* 5. Edit Saved Prompt Modal */}
      {editingSavedPrompt && (
        <EditSavedPromptModal
          savedPrompt={editingSavedPrompt}
          onClose={() => setEditingSavedPrompt(null)}
          onCopy={copyToClipboard}
          onSaveUpdated={(updated) => {
            saveStudentPrompt(updated);
            showToast('Saved prompt updated successfully!');
            setEditingSavedPrompt(null);
          }}
        />
      )}

      {/* 6. AI Prompt Enhancer Modal (Principle of Writing Standard Prompts) */}
      {aiEnhancerModalOpen && (
        <AIPromptEnhancerModal
          availableCategories={availableCategories.filter((c) => c !== 'All')}
          isAdmin={isAdmin}
          onClose={() => setAiEnhancerModalOpen(false)}
          onCopy={copyToClipboard}
          onSaveToVault={(newPrompt) => {
            addCustomPromptVaultItem(newPrompt);
            showToast('Enhanced prompt added to Prompt Vault catalog!');
          }}
          onSaveToDashboard={(saved) => {
            saveStudentPrompt(saved);
            showToast('Enhanced prompt saved to your student dashboard!');
          }}
        />
      )}

      {/* 7. Admin Add Category Modal */}
      {addCategoryModalOpen && (
        <AddCategoryModal
          existingCategories={availableCategories}
          onClose={() => setAddCategoryModalOpen(false)}
          onAddCategory={(cat) => {
            addPromptVaultCategory(cat);
            showToast(`Category "${cat}" added to Prompt Vault!`);
          }}
        />
      )}

      {/* 8. Admin Add Custom Prompt Modal */}
      {addPromptModalOpen && (
        <AddCustomPromptModal
          categories={availableCategories.filter((c) => c !== 'All')}
          onClose={() => setAddPromptModalOpen(false)}
          onAddPrompt={(item) => {
            addCustomPromptVaultItem(item);
            showToast(`Custom prompt "${item.title}" added to Prompt Vault!`);
          }}
        />
      )}

      {/* 9. Prompt Upgrade Modal (Teaser Viewers) */}
      {upgradeModalOpen && (
        <PromptUpgradeModal
          onClose={() => setUpgradeModalOpen(false)}
          onUpgrade={() => {
            setUpgradeModalOpen(false);
            navigate('/membership');
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// Sub-Component: Prompt Card
// ==========================================

interface PromptCardProps {
  item: PromptVaultItem;
  hasAccess: boolean;
  copied: boolean;
  onQuickCopy: () => void;
  onCustomize: () => void;
  onUnlock: () => void;
  onDelete?: () => void;
}

function PromptCard({
  item,
  hasAccess,
  copied,
  onQuickCopy,
  onCustomize,
  onUnlock,
  onDelete,
}: PromptCardProps) {
  const variableKeys = useMemo(() => {
    if (item.variables && item.variables.length > 0) {
      return item.variables.map((v) => v.name);
    }
    return extractPromptVariables(item.template);
  }, [item]);

  return (
    <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-slate-600 transition-all shadow-lg hover:shadow-xl group relative overflow-hidden">
      {/* Top Meta */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#f5c451] bg-[#f5c451]/10 px-2.5 py-0.5 rounded-full border border-[#f5c451]/20 truncate">
            {item.category}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {item.isFeatured && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Featured
              </span>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                title="Delete custom prompt"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#f5c451] transition-colors leading-snug line-clamp-2">
            {item.title}
          </h3>
          <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Model and copy counter pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
          {item.recommendedModel && (
            <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800 text-[10px]">
              <Bot className="w-3 h-3 text-blue-400" />
              {item.recommendedModel}
            </span>
          )}
          {item.copyCount !== undefined && (
            <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800 text-[10px]">
              <Copy className="w-3 h-3 text-slate-500" />
              {item.copyCount} uses
            </span>
          )}
        </div>

        {/* Variable tokens preview */}
        {variableKeys.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {variableKeys.slice(0, 3).map((v) => (
              <span
                key={v}
                className="text-[10px] font-mono bg-slate-900/90 text-amber-300 px-1.5 py-0.5 rounded border border-slate-800"
              >
                &#123;&#123;{v}&#125;&#125;
              </span>
            ))}
            {variableKeys.length > 3 && (
              <span className="text-[10px] font-mono text-slate-400 self-center">
                +{variableKeys.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Middle: Template Preview or Teaser Blur */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800/80 p-3 min-h-[80px] flex items-center">
        {hasAccess ? (
          <p className="text-xs font-mono text-slate-300 line-clamp-3 leading-relaxed">
            {item.template}
          </p>
        ) : (
          <>
            <p className="text-xs font-mono text-slate-400 line-clamp-3 blur-[3px] select-none pointer-events-none opacity-40">
              {item.template}
            </p>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 p-2 text-center">
              <Lock className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[11px] font-bold text-white">VIP Member Prompt</span>
            </div>
          </>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="pt-2 border-t border-slate-700/60">
        {hasAccess ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCustomize}
              className="py-2 px-2.5 rounded-xl text-xs font-bold bg-[#5624d0] hover:bg-[#6830e0] text-white flex items-center justify-center gap-1.5 transition-colors focus:outline-none cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Customize</span>
            </button>
            <button
              type="button"
              onClick={onQuickCopy}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
                copied
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-400'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Quick Copy</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onUnlock}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#f5c451] hover:bg-[#ebd56e] text-slate-950 flex items-center justify-center gap-1.5 transition-colors shadow-md focus:outline-none cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Unlock With Membership</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Sub-Component: Saved Prompt Card (Student Dashboard)
// ==========================================

interface SavedPromptCardProps {
  item: SavedCustomizedPrompt;
  copied: boolean;
  onCopy: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

function SavedPromptCard({ item, copied, onCopy, onDelete, onEdit }: SavedPromptCardProps) {
  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
            {item.category}
          </span>
          <h3 className="text-base font-bold text-white mt-1">{item.title}</h3>
          <p className="text-[11px] text-slate-400">
            Saved on {new Date(item.savedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Edit prompt"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-red-900/60 text-slate-300 hover:text-red-300 transition-colors cursor-pointer"
            title="Delete saved prompt"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customized Prompt Content */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 line-clamp-4 leading-relaxed whitespace-pre-wrap select-all">
        {item.customizedPrompt}
      </div>

      {/* Dedicated Room to Copy & Launch */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onCopy}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-[#f5c451] hover:bg-[#ebd56e] text-slate-950 shadow-md'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>📋 Copy New Version</span>
            </>
          )}
        </button>

        {/* 1-Click AI Workspace Launchers */}
        <div className="flex items-center gap-1.5 text-xs">
          <a
            href="https://chatgpt.com/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onCopy}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1"
            title="Copies prompt & opens ChatGPT"
          >
            <span>ChatGPT</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="https://claude.ai/new"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onCopy}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1"
            title="Copies prompt & opens Claude"
          >
            <span>Claude</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="https://gemini.google.com/app"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onCopy}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1"
            title="Copies prompt & opens Gemini"
          >
            <span>Gemini</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Sub-Component: Prompt Customizer Modal (Editable on Student Dashboard + Room to Copy)
// ==========================================

interface PromptCustomizerModalProps {
  item: PromptVaultItem;
  onClose: () => void;
  onCopy: (text: string) => void;
  onSaveToDashboard: (saved: SavedCustomizedPrompt) => void;
}

function PromptCustomizerModal({
  item,
  onClose,
  onCopy,
  onSaveToDashboard,
}: PromptCustomizerModalProps) {
  // Extract or resolve variables
  const variablesList = useMemo(() => {
    if (item.variables && item.variables.length > 0) {
      return item.variables;
    }
    const extracted = extractPromptVariables(item.template);
    return extracted.map((name) => ({
      name,
      label: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      defaultValue: '',
      placeholder: `Enter ${name}...`,
    }));
  }, [item]);

  // Initial form values from defaults
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    variablesList.forEach((v) => {
      init[v.name] = v.defaultValue || '';
    });
    return init;
  });

  // Direct editing of prompt
  const [isDirectlyEdited, setIsDirectlyEdited] = useState<boolean>(false);
  const [editablePromptText, setEditablePromptText] = useState<string>(() => {
    return interpolatePromptTemplate(item.template, {}).prompt;
  });

  const [copiedModal, setCopiedModal] = useState<boolean>(false);
  const [savedModal, setSavedModal] = useState<boolean>(false);

  // Live interpolation
  const interpolationResult = useMemo(() => {
    return interpolatePromptTemplate(item.template, formValues);
  }, [item.template, formValues]);

  // Keep editable text in sync unless manually altered
  const handleInputChange = (key: string, value: string) => {
    const nextValues = { ...formValues, [key]: value };
    setFormValues(nextValues);
    if (!isDirectlyEdited) {
      const nextPrompt = interpolatePromptTemplate(item.template, nextValues).prompt;
      setEditablePromptText(nextPrompt);
    }
  };

  const handlePromptTextDirectChange = (text: string) => {
    setIsDirectlyEdited(true);
    setEditablePromptText(text);
  };

  const handleReset = () => {
    const init: Record<string, string> = {};
    variablesList.forEach((v) => {
      init[v.name] = v.defaultValue || '';
    });
    setFormValues(init);
    setIsDirectlyEdited(false);
    setEditablePromptText(interpolatePromptTemplate(item.template, init).prompt);
  };

  const handleCopyClick = () => {
    onCopy(editablePromptText);
    setCopiedModal(true);
    setTimeout(() => setCopiedModal(false), 2000);
  };

  const handleSaveToDashboardClick = () => {
    const newSaved: SavedCustomizedPrompt = {
      id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      originalPromptId: item.id,
      title: item.title,
      category: item.category,
      customizedPrompt: editablePromptText,
      formValues,
      savedAt: new Date().toISOString(),
    };
    onSaveToDashboard(newSaved);
    setSavedModal(true);
    setTimeout(() => setSavedModal(false), 2000);
  };

  const wordCount = useMemo(() => {
    return editablePromptText.trim().split(/\s+/).filter(Boolean).length;
  }, [editablePromptText]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#f5c451] bg-[#f5c451]/10 px-2 py-0.5 rounded">
                {item.category}
              </span>
              <span className="text-xs text-slate-400">
                {item.recommendedModel && `Optimized for ${item.recommendedModel}`}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">{item.title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors focus:outline-none cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="grid lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left Column: Variable Form */}
          <div className="lg:col-span-5 p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[50vh] lg:max-h-none">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#f5c451]" />
                Template Variables ({variablesList.length})
              </h3>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors focus:outline-none cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Defaults
              </button>
            </div>

            <div className="space-y-3.5">
              {variablesList.map((v) => (
                <div key={v.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">{v.label}</label>
                    <span className="text-[10px] font-mono text-amber-400">
                      &#123;&#123;{v.name}&#125;&#125;
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={formValues[v.name] || ''}
                    onChange={(e) => handleInputChange(v.name, e.target.value)}
                    placeholder={v.placeholder || `Enter ${v.name}...`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#f5c451] font-sans"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Editable Student Dashboard Workspace & Dedicated Room to Copy */}
          <div className="lg:col-span-7 p-4 sm:p-6 space-y-4 flex flex-col justify-between bg-slate-950/60">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    Student Dashboard Editor (Directly Editable)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    You can edit the text directly below to add personal nuances before copying.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">{wordCount} words</span>
                  {isDirectlyEdited && (
                    <span className="text-amber-400 text-[10px] bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                      Customized
                    </span>
                  )}
                </div>
              </div>

              {/* Editable Prompt Textarea (Direct Student Dashboard Edit) */}
              <textarea
                rows={12}
                value={editablePromptText}
                onChange={(e) => handlePromptTextDirectChange(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-700 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-[#f5c451] resize-none"
                placeholder="Customized prompt text appears here..."
              />
            </div>

            {/* Dedicated Room to Copy & Launch into ChatGPT, Claude, Gemini */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* 1-Click AI Workspace Launchers */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">Launch into:</span>
                  <a
                    href="https://chatgpt.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCopyClick}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 hover:text-white flex items-center gap-1 border border-slate-700"
                    title="Copies prompt & opens ChatGPT"
                  >
                    <span>ChatGPT</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a
                    href="https://claude.ai/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCopyClick}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 hover:text-white flex items-center gap-1 border border-slate-700"
                    title="Copies prompt & opens Claude"
                  >
                    <span>Claude</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a
                    href="https://gemini.google.com/app"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCopyClick}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 hover:text-white flex items-center gap-1 border border-slate-700"
                    title="Copies prompt & opens Gemini"
                  >
                    <span>Gemini</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveToDashboardClick}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {savedModal ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved to Dashboard!</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Save to Dashboard</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyClick}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg ${
                      copiedModal
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#f5c451] hover:bg-[#ebd56e] text-slate-950 font-black'
                    }`}
                  >
                    {copiedModal ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>📋 Copy New Version</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Sub-Component: Edit Saved Prompt Modal
// ==========================================

interface EditSavedPromptModalProps {
  savedPrompt: SavedCustomizedPrompt;
  onClose: () => void;
  onCopy: (text: string) => void;
  onSaveUpdated: (updated: SavedCustomizedPrompt) => void;
}

function EditSavedPromptModal({
  savedPrompt,
  onClose,
  onCopy,
  onSaveUpdated,
}: EditSavedPromptModalProps) {
  const [content, setContent] = useState<string>(savedPrompt.customizedPrompt);
  const [notes, setNotes] = useState<string>(savedPrompt.notes || '');

  const handleSave = () => {
    onSaveUpdated({
      ...savedPrompt,
      customizedPrompt: content,
      notes,
      savedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl p-6 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
              {savedPrompt.category}
            </span>
            <h2 className="text-lg font-bold text-white mt-1">Edit: {savedPrompt.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300">Customized Prompt Text</label>
          <textarea
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 font-mono text-xs text-white focus:outline-none focus:border-[#f5c451]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Personal Notes / Context</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Used for the Q3 WhatsApp lead magnet funnel"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5c451]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onCopy(content);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Text</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#f5c451] hover:bg-[#ebd56e] text-slate-950"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Sub-Component: AI Prompt Enhancer Modal (CO-STAR / Standard Prompt Principles)
// ==========================================

interface AIPromptEnhancerModalProps {
  availableCategories: string[];
  isAdmin: boolean;
  onClose: () => void;
  onCopy: (text: string) => void;
  onSaveToVault?: (item: PromptVaultItem) => void;
  onSaveToDashboard?: (saved: SavedCustomizedPrompt) => void;
}

function AIPromptEnhancerModal({
  availableCategories,
  isAdmin,
  onClose,
  onCopy,
  onSaveToVault,
  onSaveToDashboard,
}: AIPromptEnhancerModalProps) {
  // Wizard input state
  const [idea, setIdea] = useState<string>('');
  const [persona, setPersona] = useState<string>('World-Class Direct-Response Copywriter & Growth Strategist');
  const [audience, setAudience] = useState<string>('Entrepreneurs and business owners seeking high-converting results');
  const [tone, setTone] = useState<string>('Authoritative, conversational, persuasive, and results-oriented');
  const [constraints, setConstraints] = useState<string>('Strictly concise, zero fluff, include actionable steps and dynamic {{variables}}');
  const [outputFormat, setOutputFormat] = useState<string>('Structured Markdown with numbered sections, template variables, and quality checklist');
  const [selectedCategory, setSelectedCategory] = useState<string>(availableCategories[0] || 'Copywriting & Marketing');

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [enhancedResult, setEnhancedResult] = useState<string | null>(null);
  const [copiedEnhanced, setCopiedEnhanced] = useState<boolean>(false);

  const handleEnhance = async () => {
    if (!idea.trim()) return;

    setIsGenerating(true);
    setEnhancedResult(null);

    try {
      // Call backend AI Enhancer endpoint
      const response = await fetch('/api/agents/prompt-enhancer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          persona,
          audience,
          tone,
          constraints,
          outputFormat,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.enhancedPrompt) {
          setEnhancedResult(data.enhancedPrompt);
          setIsGenerating(false);
          return;
        }
      }

      // Seamless fallback to deterministic synthesizer
      const fallback = synthesizeStandardPrompt({
        idea,
        persona,
        audience,
        tone,
        constraints,
        outputFormat,
      });
      setEnhancedResult(fallback);
    } catch (err) {
      // Offline fallback
      const fallback = synthesizeStandardPrompt({
        idea,
        persona,
        audience,
        tone,
        constraints,
        outputFormat,
      });
      setEnhancedResult(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToCatalog = () => {
    if (!enhancedResult || !onSaveToVault) return;
    const titleMatch = idea.trim().slice(0, 40) + '...';
    const slug = titleMatch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const vars = extractPromptVariables(enhancedResult).map((name) => ({
      name,
      label: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      defaultValue: '',
      placeholder: `Enter ${name}...`,
    }));
    const newItem: PromptVaultItem = {
      id: `custom_${Date.now()}`,
      slug: slug || `prompt-${Date.now()}`,
      title: titleMatch,
      category: selectedCategory as any,
      description: `AI-enhanced prompt synthesized for: "${idea.trim()}"`,
      template: enhancedResult,
      variables: vars,
      isFeatured: false,
      recommendedModel: 'Gemini 2.5 Flash / Claude 3.5 Sonnet',
      tags: ['ai-enhanced', selectedCategory.toLowerCase().replace(/[^a-z0-9]/g, '-')],
      createdAt: new Date().toISOString(),
    };
    onSaveToVault(newItem);
    onClose();
  };

  const handleSaveToStudentDashboard = () => {
    if (!enhancedResult || !onSaveToDashboard) return;
    const newSaved: SavedCustomizedPrompt = {
      id: `saved_ai_${Date.now()}`,
      originalPromptId: `ai_enhanced_${Date.now()}`,
      title: idea.trim().slice(0, 40) + '...',
      category: selectedCategory as any,
      customizedPrompt: enhancedResult,
      savedAt: new Date().toISOString(),
      notes: `Generated via AI Prompt Enhancer for: "${idea.trim()}"`,
    };
    onSaveToDashboard(newSaved);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              Standard Prompt Engineering Synthesizer
            </div>
            <h2 className="text-lg font-bold text-white">
              Transform Vague Ideas into Production-Grade Prompts
            </h2>
            <p className="text-xs text-slate-400">
              Structured according to the CO-STAR principles (Role, Objective, Context, Constraints, Workflow, Variables, Format).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {enhancedResult ? (
            /* Result Screen */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Enhanced Standard Prompt Ready
                </span>
                <button
                  type="button"
                  onClick={() => setEnhancedResult(null)}
                  className="text-xs font-semibold text-slate-400 hover:text-white"
                >
                  ← Refine Questions
                </button>
              </div>

              <textarea
                rows={14}
                value={enhancedResult}
                onChange={(e) => setEnhancedResult(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-700 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-[#f5c451]"
              />

              {/* Action Buttons for enhanced prompt */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <a
                    href="https://chatgpt.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onCopy(enhancedResult)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1"
                  >
                    <span>ChatGPT</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a
                    href="https://claude.ai/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onCopy(enhancedResult)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1"
                  >
                    <span>Claude</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>

                <div className="flex items-center gap-2.5">
                  {onSaveToDashboard && (
                    <button
                      type="button"
                      onClick={handleSaveToStudentDashboard}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save to My Dashboard</span>
                    </button>
                  )}

                  {isAdmin && onSaveToVault && (
                    <button
                      type="button"
                      onClick={handleSaveToCatalog}
                      className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Vault Catalog</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onCopy(enhancedResult);
                      setCopiedEnhanced(true);
                      setTimeout(() => setCopiedEnhanced(false), 2000);
                    }}
                    className="px-5 py-2 rounded-xl bg-[#f5c451] hover:bg-[#ebd56e] text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    {copiedEnhanced ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>📋 Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Guided Questions Form */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#f5c451] text-slate-950 font-black text-[10px] flex items-center justify-center">
                    1
                  </span>
                  What is your raw concept or vague idea? (Required)
                </label>
                <textarea
                  rows={3}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="e.g. I need an email to pitch a digital marketing course to real estate agents..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#f5c451]"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">
                      2
                    </span>
                    AI Role & Persona
                  </label>
                  <input
                    type="text"
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5c451]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">
                      3
                    </span>
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5c451]"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">
                      4
                    </span>
                    Tone & Voice
                  </label>
                  <input
                    type="text"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5c451]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">
                      5
                    </span>
                    Vault Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5c451]"
                  >
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">
                    6
                  </span>
                  Constraints & Quality Rules
                </label>
                <input
                  type="text"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5c451]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">
                    7
                  </span>
                  Desired Output Structure
                </label>
                <input
                  type="text"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5c451]"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!idea.trim() || isGenerating}
                  onClick={handleEnhance}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Synthesizing with Standard Prompt Principles...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-amber-300" />
                      <span>Synthesize Full Standard Prompt →</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Sub-Component: Add Category Modal (Admin)
// ==========================================

interface AddCategoryModalProps {
  existingCategories: string[];
  onClose: () => void;
  onAddCategory: (categoryName: string) => void;
}

function AddCategoryModal({
  existingCategories,
  onClose,
  onAddCategory,
}: AddCategoryModalProps) {
  const [newCatName, setNewCatName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCatName.trim();
    if (!clean) {
      setError('Please enter a category name');
      return;
    }
    if (
      existingCategories.some((c) => c.toLowerCase() === clean.toLowerCase())
    ) {
      setError('This category already exists in the vault');
      return;
    }
    onAddCategory(clean);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-[#f5c451]" />
            Add New Prompt Category
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Category Name</label>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => {
                setNewCatName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Real Estate & High-Ticket Sales"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5c451]"
              autoFocus
            />
            {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-[#f5c451] hover:bg-[#ebd56e] rounded-xl shadow-md cursor-pointer"
            >
              Add Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// Sub-Component: Add Custom Prompt Modal (Admin)
// ==========================================

interface AddCustomPromptModalProps {
  categories: string[];
  onClose: () => void;
  onAddPrompt: (item: PromptVaultItem) => void;
}

function AddCustomPromptModal({
  categories,
  onClose,
  onAddPrompt,
}: AddCustomPromptModalProps) {
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>(categories[0] || 'Copywriting & Marketing');
  const [description, setDescription] = useState<string>('');
  const [recommendedModel, setRecommendedModel] = useState<string>('Gemini 2.5 Flash / Claude 3.5 Sonnet');
  const [template, setTemplate] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !template.trim()) {
      setError('Title and prompt template are required');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const vars = extractPromptVariables(template).map((name) => ({
      name,
      label: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      defaultValue: '',
      placeholder: `Enter ${name}...`,
    }));

    const newItem: PromptVaultItem = {
      id: `custom_${Date.now()}`,
      slug: slug || `prompt-${Date.now()}`,
      title: title.trim(),
      category: category as any,
      description: description.trim() || title.trim(),
      recommendedModel: recommendedModel.trim() || undefined,
      template: template.trim(),
      variables: vars,
      isFeatured,
      tags: tags.length > 0 ? tags : [category.toLowerCase()],
      createdAt: new Date().toISOString(),
    };

    onAddPrompt(newItem);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            Add Custom Prompt to Vault
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Prompt Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. High-Ticket Consultation Script"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5c451]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5c451]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Short Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what this prompt accomplishes..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5c451]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Prompt Template *</label>
              <span className="text-[11px] text-amber-400 font-mono">
                Tip: Use &#123;&#123;variable_name&#125;&#125; for custom fields
              </span>
            </div>
            <textarea
              rows={8}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Act as a {{role}} to create a {{deliverable}} targeting {{audience}}..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-[#f5c451]"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Recommended Model</label>
              <input
                type="text"
                value={recommendedModel}
                onChange={(e) => setRecommendedModel(e.target.value)}
                placeholder="e.g. GPT-4o, Claude 3.5 Sonnet"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5c451]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Tags (comma separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="sales, conversion, marketing"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5c451]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-[#5624d0] focus:ring-0"
            />
            <label htmlFor="isFeatured" className="text-xs text-slate-300">
              Feature this prompt prominently at the top of the category
            </label>
          </div>

          {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-[#f5c451] hover:bg-[#ebd56e] rounded-xl shadow-md cursor-pointer"
            >
              Add to Vault
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// Sub-Component: Prompt Upgrade Modal
// ==========================================

interface PromptUpgradeModalProps {
  onClose: () => void;
  onUpgrade: () => void;
}

function PromptUpgradeModal({ onClose, onUpgrade }: PromptUpgradeModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-2xl bg-[#f5c451]/20 text-[#f5c451] border border-[#f5c451]/30 flex items-center justify-center mx-auto shadow-lg">
          <Crown className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-800">
            Exclusive Member Benefit
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Unlock the Full Prompt Vault
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Active members get full access to 120+ battle-tested system instructions, dynamic variable
            interpolator, AI prompt synthesizer, and 1-click clipboard export.
          </p>
        </div>

        {/* Benefits checklist */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-left space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Interactive Dynamic Variable Customizer engine</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>120+ Prompts across Code, Copy, Strategy, LMS & Education</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>AI Prompt Enhancer (CO-STAR standard principles)</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>VIP Community & Discussion Channels</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onUpgrade}
            className="w-full py-3.5 px-6 rounded-xl font-black text-slate-950 bg-[#f5c451] hover:bg-[#ebd56e] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm shadow-xl focus:outline-none cursor-pointer"
          >
            <span>View Membership Plans (From ₦15,000/mo) →</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
