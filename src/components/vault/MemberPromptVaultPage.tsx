import React, { useState, useMemo, useCallback } from 'react';
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
  ChevronRight,
  Code,
  ArrowRight,
  Bot,
  Hash,
  Eye,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SEED_PROMPT_VAULT_ITEMS } from '../../data/seedData';
import type {
  PromptVaultCategory,
  PromptVaultItem,
} from '../../types/marketplace';
import {
  isPromptVaultAccessible,
  interpolatePromptTemplate,
  extractPromptVariables,
  filterPromptVault,
} from '../../utils/funnelsAndVault';

const VAULT_CATEGORIES: PromptVaultCategory[] = [
  'All',
  'Copywriting & Marketing',
  'AI Engineering & Coding',
  'Business & Strategy',
  'Content Creation',
  'Productivity',
  'LMS & Education',
];

interface MemberPromptVaultPageProps {
  initialCategory?: string;
}

export function MemberPromptVaultPage({ initialCategory }: MemberPromptVaultPageProps) {
  const { currentUser, activeUserMembership, navigate, showToast } = useStore();

  // Access Evaluation
  const accessResult = useMemo(() => {
    return isPromptVaultAccessible(currentUser, activeUserMembership);
  }, [currentUser, activeUserMembership]);

  const hasAccess = accessResult.accessible;

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'featured' | 'popular' | 'alpha'>('featured');

  // Modals
  const [customizingItem, setCustomizingItem] = useState<PromptVaultItem | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);

  // Quick Copy Feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter items
  const filteredPrompts = useMemo(() => {
    let list = filterPromptVault(SEED_PROMPT_VAULT_ITEMS, {
      category: selectedCategory,
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
  }, [selectedCategory, searchQuery, selectedTag, sortBy]);

  // Safe programmatic copy with fallback
  const copyToClipboard = useCallback(
    async (text: string, idForFeedback?: string) => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for restricted iframes / HTTP environments
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
        showToast('Prompt copied to clipboard!');
      } catch (err) {
        showToast('Failed to copy. Please select and copy manually.');
      }
    },
    [showToast]
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-[#f5c451] selection:text-slate-950 pb-20">
      {/* 1. Hero Header Banner */}
      <section className="bg-gradient-to-b from-[#0a192f] via-slate-900 to-slate-900 border-b border-slate-800 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f5c451]/15 text-[#f5c451] border border-[#f5c451]/30">
                <Sparkles className="w-3.5 h-3.5" />
                Exclusive Member Intelligence
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                Member Prompt Vault
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Curated library of battle-tested AI system instructions, specification generators, and
                customizable bracket templates for production engineering and growth.
              </p>
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
                      VIP Access Active
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts by keyword, tag, or variable..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#f5c451]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-3">
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

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {VAULT_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedTag(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all focus:outline-none ${
                  isActive
                    ? 'bg-[#5624d0] text-white shadow-md shadow-[#5624d0]/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Prompt Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              }}
              className="text-xs font-bold text-[#f5c451] hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((item) => (
              <PromptCard
                key={item.id}
                item={item}
                hasAccess={hasAccess}
                copied={copiedId === item.id}
                onQuickCopy={() => copyToClipboard(item.template, item.id)}
                onCustomize={() => setCustomizingItem(item)}
                onUnlock={() => setUpgradeModalOpen(true)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Prompt Customizer Modal (Active Members) */}
      {customizingItem && (
        <PromptCustomizerModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onCopy={copyToClipboard}
        />
      )}

      {/* 5. Prompt Upgrade Modal (Teaser Viewers) */}
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
}

function PromptCard({
  item,
  hasAccess,
  copied,
  onQuickCopy,
  onCustomize,
  onUnlock,
}: PromptCardProps) {
  // Extract variable keys
  const variableKeys = useMemo(() => {
    if (item.variables && item.variables.length > 0) {
      return item.variables.map((v) => v.name);
    }
    return extractPromptVariables(item.template);
  }, [item]);

  return (
    <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-600 transition-all shadow-lg hover:shadow-xl group relative overflow-hidden">
      {/* Top Meta */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#f5c451] bg-[#f5c451]/10 px-2.5 py-0.5 rounded-full border border-[#f5c451]/20">
            {item.category}
          </span>
          {item.isFeatured && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Featured
            </span>
          )}
        </div>

        <div>
          <h3 className="text-base font-bold text-white group-hover:text-[#f5c451] transition-colors leading-snug">
            {item.title}
          </h3>
          <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Model and copy counter pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
          {item.recommendedModel && (
            <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
              <Bot className="w-3 h-3 text-blue-400" />
              {item.recommendedModel}
            </span>
          )}
          {item.copyCount !== undefined && (
            <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
              <Copy className="w-3 h-3 text-slate-500" />
              {item.copyCount} uses
            </span>
          )}
        </div>

        {/* Variable tokens preview */}
        {variableKeys.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {variableKeys.slice(0, 4).map((v) => (
              <span
                key={v}
                className="text-[10px] font-mono bg-slate-900/90 text-amber-300 px-2 py-0.5 rounded border border-slate-800"
              >
                &#123;&#123;{v}&#125;&#125;
              </span>
            ))}
            {variableKeys.length > 4 && (
              <span className="text-[10px] font-mono text-slate-400 self-center">
                +{variableKeys.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Middle: Template Preview or Teaser Blur */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800/80 p-3 min-h-[90px] flex items-center">
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
              <Lock className="w-5 h-5 text-amber-400 mb-1" />
              <span className="text-[11px] font-bold text-white">Exclusive Member Prompt</span>
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
              className="py-2 px-3 rounded-xl text-xs font-bold bg-[#5624d0] hover:bg-[#6830e0] text-white flex items-center justify-center gap-1.5 transition-colors focus:outline-none"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Customize</span>
            </button>
            <button
              type="button"
              onClick={onQuickCopy}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 focus:outline-none ${
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
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#f5c451] hover:bg-[#ebd56e] text-slate-950 flex items-center justify-center gap-1.5 transition-colors shadow-md focus:outline-none"
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
// Sub-Component: Prompt Customizer Modal
// ==========================================

interface PromptCustomizerModalProps {
  item: PromptVaultItem;
  onClose: () => void;
  onCopy: (text: string) => void;
}

function PromptCustomizerModal({ item, onClose, onCopy }: PromptCustomizerModalProps) {
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

  const [copiedModal, setCopiedModal] = useState<boolean>(false);

  // Live interpolation
  const interpolationResult = useMemo(() => {
    return interpolatePromptTemplate(item.template, formValues);
  }, [item.template, formValues]);

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const init: Record<string, string> = {};
    variablesList.forEach((v) => {
      init[v.name] = v.defaultValue || '';
    });
    setFormValues(init);
  };

  const handleCopyClick = () => {
    onCopy(interpolationResult.prompt);
    setCopiedModal(true);
    setTimeout(() => setCopiedModal(false), 2000);
  };

  const wordCount = useMemo(() => {
    return interpolationResult.prompt
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }, [interpolationResult.prompt]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#f5c451] bg-[#f5c451]/10 px-2 py-0.5 rounded">
                {item.category}
              </span>
              <span className="text-xs text-slate-400">
                {item.recommendedModel && `Optimized for ${item.recommendedModel}`}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{item.title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="grid lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left Column: Variable Form */}
          <div className="lg:col-span-5 p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[60vh] lg:max-h-none">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#f5c451]" />
                Template Variables ({variablesList.length})
              </h3>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors focus:outline-none"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Defaults
              </button>
            </div>

            <div className="space-y-4">
              {variablesList.map((v) => (
                <div key={v.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      {v.label}
                    </label>
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

          {/* Right Column: Live Interpolation Preview */}
          <div className="lg:col-span-7 p-5 sm:p-6 space-y-4 flex flex-col justify-between bg-slate-950/40">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  Live Interpolated Prompt
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">{wordCount} words</span>
                  {interpolationResult.isComplete ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Complete
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold">
                      {interpolationResult.missingVariables.length} missing
                    </span>
                  )}
                </div>
              </div>

              {/* Preview Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed overflow-y-auto max-h-[380px] select-all whitespace-pre-wrap">
                {interpolationResult.prompt}
              </div>
            </div>

            {/* Modal Bottom Controls */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Ready to paste into ChatGPT, Claude, Cursor, or Gemini.
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleCopyClick}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 focus:outline-none shadow-lg ${
                    copiedModal
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#f5c451] hover:bg-[#ebd56e] text-slate-950'
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
                      <span>Copy Interpolated Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
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
            Active members get full access to 50+ battle-tested system instructions, dynamic variable
            interpolator, and 1-click clipboard export.
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
            <span>50+ Prompts across Code, Copy, Architecture & LMS</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>All Digital Wealth Creators online video courses included free</span>
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
            className="w-full py-3.5 px-6 rounded-xl font-black text-slate-950 bg-[#f5c451] hover:bg-[#ebd56e] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm shadow-xl focus:outline-none"
          >
            <span>View Membership Plans (From ₦15,000/mo) →</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
