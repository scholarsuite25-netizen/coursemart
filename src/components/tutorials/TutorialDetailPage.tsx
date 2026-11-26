import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  CheckSquare,
  Clock,
  Code,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileCode,
  FileDown,
  FileText,
  Film,
  Layers,
  Play,
  Plus,
  Printer,
  Search,
  Share2,
  Sparkles,
  Tag,
  User,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { DocumentTutorial, TutorialStep } from '../../types/tutorial';
import { SeoHead } from '../common/SeoHead';
import { TutorialEditorModal } from './TutorialEditorModal';
import { TutorialVideoPlayerModal } from './TutorialVideoPlayerModal';
import {
  formatTutorialAsHtml,
  formatTutorialAsJson,
  formatTutorialAsMarkdown,
} from '../../utils/tutorialCreator';
import { printTutorial } from '../../utils/tutorialPdf';
import { triggerFileDownload } from '../../utils/fileDownloader';

interface TutorialDetailPageProps {
  slug?: string;
  onNavigate?: (path: string) => void;
}

export const TutorialDetailPage: React.FC<TutorialDetailPageProps> = ({
  slug,
  onNavigate,
}) => {
  const { tutorials, currentUser, upsertTutorial, showToast } = useStore();
  const trackPageView = useStore().trackPageView;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeStepId, setActiveStepId] = useState<string>('');
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedTutorialForVideo, setSelectedTutorialForVideo] = useState<DocumentTutorial | null>(null);
  const [editingTutorial, setEditingTutorial] = useState<DocumentTutorial | null>(null);

  const activeTutorial = useMemo(() => {
    if (!slug) return null;
    return tutorials.find((t) => t.slug === slug || t.id === slug) || null;
  }, [tutorials, slug]);

  // Analytics: fire on mount + slug change
  useEffect(() => {
    if (activeTutorial) trackPageView(`/tutorials/${activeTutorial.slug}`);
  }, [activeTutorial, trackPageView]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    tutorials.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [tutorials]);

  const filteredTutorials = useMemo(() => {
    return tutorials.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDifficulty =
        selectedDifficulty === 'all' ||
        String(t.difficulty || '').toLowerCase() === selectedDifficulty.toLowerCase();

      const matchesCategory =
        selectedCategory === 'all' || (t.category && t.category === selectedCategory);

      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [tutorials, searchQuery, selectedDifficulty, selectedCategory]);

  const copyCodeToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    showToast('Code snippet copied to clipboard');
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const handleDownloadMarkdown = (tut: DocumentTutorial) => {
    const md = formatTutorialAsMarkdown(tut);
    triggerFileDownload(`${tut.slug}.md`, md, 'text/markdown;charset=utf-8');
    showToast('Downloaded Markdown tutorial');
  };

  const handleDownloadHtml = (tut: DocumentTutorial) => {
    const html = formatTutorialAsHtml(tut);
    triggerFileDownload(`${tut.slug}.html`, html, 'text/html;charset=utf-8');
    showToast('Downloaded standalone HTML tutorial');
  };

  const handleDownloadJson = (tut: DocumentTutorial) => {
    const json = formatTutorialAsJson(tut);
    triggerFileDownload(`${tut.slug}.json`, json, 'application/json;charset=utf-8');
    showToast('Downloaded JSON tutorial');
  };

  const handlePrint = (tut: DocumentTutorial) => {
    printTutorial(tut);
    showToast('PDF export opened — choose "Save as PDF"');
  };

  const navigateTo = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // --------------------------------------------------------------------------
  // 1. CATALOG OVERVIEW VIEW (When no slug provided or tutorial not found)
  // --------------------------------------------------------------------------
  if (!activeTutorial) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <SeoHead
          title="Document Tutorials & AI Video Guides | Digital Wealth Creators"
          description="Explore interactive step-by-step masterclasses, runnable code snippets, and AI-narrated canvas video guides for modern software engineering."
          canonical="https://digitalwealthcreators.org.ng/tutorials"
          ogType="website"
        />

        <div className="max-w-7xl mx-auto space-y-10">
          {/* Hero Section */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Interactive Learning & Video Narrator
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Document Tutorials & Video Guides
            </h1>
            <p className="text-base sm:text-lg text-slate-400">
              Actionable engineering blueprints, runnable code blocks, and client-side Revoicer-style AI video narration.
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingTutorial(null);
                  setIsEditorOpen(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create New Tutorial
              </button>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tutorials by title, tags, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              {categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Tutorial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tut) => (
              <div
                key={tut.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl transition-all duration-200 group"
              >
                {/* Image Cover */}
                {tut.coverImage ? (
                  <div className="relative aspect-video overflow-hidden bg-slate-950">
                    <img
                      src={tut.coverImage}
                      alt={tut.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-950/80 text-amber-400 border border-amber-500/30 backdrop-blur-sm">
                        {tut.difficulty || 'Beginner'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-950 p-6 flex flex-col justify-end border-b border-slate-800">
                    <span className="text-xs font-semibold text-amber-400">
                      {tut.difficulty || 'Beginner'}
                    </span>
                  </div>
                )}

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{tut.readTimeMinutes || 5} min read</span>
                      <span>•</span>
                      <span>{tut.steps?.length || 0} steps</span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition line-clamp-2">
                      {tut.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-3">{tut.description}</p>
                  </div>

                  {/* Tags */}
                  {tut.tags && tut.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {tut.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => navigateTo(`/tutorials/${tut.slug}`)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Read Tutorial
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTutorialForVideo(tut);
                        setIsVideoModalOpen(true);
                      }}
                      className="px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                      title="Watch AI Video Guide"
                    >
                      <Film className="w-3.5 h-3.5" /> Video
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTutorials.length === 0 && (
            <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
              <FileCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No tutorials found</h3>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or create a new tutorial.</p>
            </div>
          )}
        </div>

        {/* Tutorial Editor Modal */}
        {isEditorOpen && (
          <TutorialEditorModal
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            initialTutorial={editingTutorial}
            onSave={(saved) => {
              upsertTutorial(saved);
              showToast(`Saved tutorial "${saved.title}"`);
            }}
            onPreviewVideo={(tut) => {
              setSelectedTutorialForVideo(tut);
              setIsVideoModalOpen(true);
            }}
          />
        )}

        {/* Video Player Modal */}
        {isVideoModalOpen && selectedTutorialForVideo && (
          <TutorialVideoPlayerModal
            isOpen={isVideoModalOpen}
            onClose={() => setIsVideoModalOpen(false)}
            tutorial={selectedTutorialForVideo}
          />
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. TUTORIAL DETAIL READER VIEW (When valid slug provided)
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <SeoHead
        title={`${activeTutorial.title} | Tutorial`}
        description={activeTutorial.description}
        canonical={`https://digitalwealthcreators.org.ng/tutorials/${activeTutorial.slug}`}
        ogType="article"
      />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Back Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <button
            type="button"
            onClick={() => navigateTo('/tutorials')}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Tutorials
          </button>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedTutorialForVideo(activeTutorial);
                setIsVideoModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Film className="w-3.5 h-3.5" /> Watch AI Video Guide
            </button>

            <button
              type="button"
              onClick={() => handleDownloadMarkdown(activeTutorial)}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl flex items-center gap-1 transition"
              title="Download Markdown"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-400" /> .md
            </button>
            <button
              type="button"
              onClick={() => handleDownloadHtml(activeTutorial)}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl flex items-center gap-1 transition"
              title="Download Standalone HTML"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" /> .html
            </button>
            <button
              type="button"
              onClick={() => handleDownloadJson(activeTutorial)}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl flex items-center gap-1 transition"
              title="Download JSON"
            >
              <Code className="w-3.5 h-3.5 text-emerald-400" /> .json
            </button>
            <button
              type="button"
              onClick={() => handlePrint(activeTutorial)}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl flex items-center gap-1 transition"
              title="Download as PDF (Print)"
            >
              <Printer className="w-3.5 h-3.5 text-purple-400" /> PDF
            </button>

            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setEditingTutorial(activeTutorial);
                  setIsEditorOpen(true);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Tutorial Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {activeTutorial.difficulty || 'Beginner'}
            </span>
            {activeTutorial.category && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                {activeTutorial.category}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {activeTutorial.title}
          </h1>

          {activeTutorial.subtitle && (
            <p className="text-lg text-slate-300 font-medium">{activeTutorial.subtitle}</p>
          )}

          <p className="text-base text-slate-400 max-w-4xl">{activeTutorial.description}</p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeTutorial.authorName}</span>
              {activeTutorial.authorRole && (
                <span className="text-slate-500">({activeTutorial.authorRole})</span>
              )}
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeTutorial.readTimeMinutes || 5} min read</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeTutorial.steps.length} Steps</span>
            </div>
          </div>
        </div>

        {/* Content Layout: Sticky Table of Contents + Steps Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Steps List Main View */}
          <div className="lg:col-span-3 space-y-8">
            {activeTutorial.steps.map((step, idx) => (
              <section
                key={step.id || idx}
                id={`step-${step.stepNumber}`}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 scroll-mt-24 shadow-lg"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                      {step.stepNumber}
                    </span>
                    <h2 className="text-xl font-bold text-white">{step.title}</h2>
                  </div>
                </div>

                {/* Step Instructions / Narration */}
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {step.description || step.content}
                </div>

                {/* Callout Card */}
                {step.calloutNote && (
                  <div
                    className={`p-4 rounded-xl border text-xs flex gap-3 ${
                      step.calloutType === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : step.calloutType === 'danger'
                        ? 'bg-red-500/10 border-red-500/30 text-red-200'
                        : step.calloutType === 'tip'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                    }`}
                  >
                    <div>
                      <span className="font-bold uppercase tracking-wider block mb-1">
                        {step.calloutType || 'Note'}
                      </span>
                      <p>{step.calloutNote}</p>
                    </div>
                  </div>
                )}

                {/* Syntax-Highlighted Runnable Code Block */}
                {step.codeSnippet && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400">
                        {step.codeLanguage?.toUpperCase() || 'CODE'}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyCodeToClipboard(step.codeSnippet!, idx)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1 transition"
                      >
                        {copiedCodeIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedCodeIndex === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                      <code>{step.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                {/* Checklist Requirements */}
                {step.checklist && step.checklist.length > 0 && (
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-purple-400" /> Actionable Checklist:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {step.checklist.map((item, cIdx) => (
                        <li key={cIdx} className="flex items-center gap-2">
                          <input type="checkbox" className="rounded text-amber-500 focus:ring-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Sticky Table of Contents / Step Outline Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Steps Outline
              </span>

              <nav className="space-y-1 text-xs">
                {activeTutorial.steps.map((step) => (
                  <a
                    key={step.stepNumber}
                    href={`#step-${step.stepNumber}`}
                    className="block px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition truncate"
                  >
                    Step {step.stepNumber}: {step.title}
                  </a>
                ))}
              </nav>

              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTutorialForVideo(activeTutorial);
                    setIsVideoModalOpen(true);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5" /> Watch Video Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <TutorialEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          initialTutorial={editingTutorial}
          onSave={(saved) => {
            upsertTutorial(saved);
            showToast(`Saved tutorial "${saved.title}"`);
          }}
          onPreviewVideo={(tut) => {
            setSelectedTutorialForVideo(tut);
            setIsVideoModalOpen(true);
          }}
        />
      )}

      {/* Video Modal */}
      {isVideoModalOpen && selectedTutorialForVideo && (
        <TutorialVideoPlayerModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          tutorial={selectedTutorialForVideo}
        />
      )}
    </div>
  );
};
