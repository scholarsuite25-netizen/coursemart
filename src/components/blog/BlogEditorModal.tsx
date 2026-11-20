import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Bold,
  CheckCircle2,
  Code,
  Copy,
  Eye,
  FileText,
  Image as ImageIcon,
  Italic,
  Link2,
  ListChecks,
  Loader2,
  MessageSquareQuote,
  Plus,
  SearchCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  BLOG_AI_VIBE_IMAGE,
  INSTRUCTOR_AVATAR,
} from '../../data/seedData';
import type {
  BlogBlockType,
  BlogCategory,
  BlogPost,
  BlogSection,
  BlogStatus,
  Product,
} from '../../types/marketplace';
import { BLOG_CATEGORY_ITEMS, slugifyText } from '../../utils/catalogAndBlogs';
import {
  MEDIA_LIBRARY_ASSETS,
  applyInlineMarkdownToken,
  calculateArticleWordCount,
  calculateReadTimeMinutes,
  runBlogSeoAudit,
} from '../../utils/editorial';
import { formatNaira } from '../../utils/currency';
import { formatProductTypeLabel } from '../../utils/theme';

interface BlogEditorModalProps {
  initialPost: BlogPost | null;
  authorId: string;
  authorName: string;
  authorRole: string;
  products: Product[];
  onSave: (post: BlogPost) => void;
  onClose: () => void;
}

const TONE_OPTIONS = [
  'Authoritative Technical Editorial',
  'Practical Step-by-Step Playbook',
  'Executive Leadership Brief',
  'Hands-On Builder Breakdown',
];

function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.readAsDataURL(file);
  });
}

export function BlogEditorModal({
  initialPost,
  authorId,
  authorName,
  authorRole,
  products,
  onSave,
  onClose,
}: BlogEditorModalProps) {
  const [workspaceMode, setWorkspaceMode] = useState<'compose' | 'preview'>('compose');
  const [title, setTitle] = useState(initialPost?.title ?? '');
  const [subtitle, setSubtitle] = useState(initialPost?.subtitle ?? '');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '');
  const [category, setCategory] = useState<BlogCategory>(initialPost?.category ?? 'AI');
  const [status, setStatus] = useState<BlogStatus>(initialPost?.status ?? 'published');
  const [scheduledAt, setScheduledAt] = useState(
    initialPost?.scheduledAt ?? new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [coverImage, setCoverImage] = useState(
    initialPost?.coverImage ?? BLOG_AI_VIBE_IMAGE
  );
  const [tagsText, setTagsText] = useState(
    initialPost?.tags.join(', ') ?? 'AI, Architecture'
  );
  const [featured, setFeatured] = useState(initialPost?.featured ?? false);
  const [seoTitle, setSeoTitle] = useState(initialPost?.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(initialPost?.seoDescription ?? '');
  const [focusKeyword, setFocusKeyword] = useState(initialPost?.focusKeyword ?? '');
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>(
    initialPost?.relatedProductIds ?? []
  );
  const [sections, setSections] = useState<BlogSection[]>(
    initialPost?.sections.length
      ? initialPost.sections.map((s) => ({
          blockType: s.blockType ?? 'section',
          ...s,
        }))
      : [
          {
            id: `sec-${Date.now()}`,
            blockType: 'section',
            heading: '01. Core Architecture & Context',
            body: '',
            pullQuote: '',
            codeSnippet: '',
          },
        ]
  );

  // AI Article Writer state
  const [aiPanelOpen, setAiPanelOpen] = useState(!initialPost);
  const [aiTitlePrompt, setAiTitlePrompt] = useState(initialPost?.title ?? '');
  const [aiTone, setAiTone] = useState(TONE_OPTIONS[0]);
  const [aiAudience, setAiAudience] = useState('Practicing Engineers & Technical Founders');
  const [aiIncludeImages, setAiIncludeImages] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const publishedProducts = useMemo(
    () => products.filter((p) => p.status === 'published'),
    [products]
  );

  const wordCount = useMemo(
    () => calculateArticleWordCount(sections, excerpt),
    [sections, excerpt]
  );
  const computedReadMinutes = useMemo(
    () => calculateReadTimeMinutes(wordCount),
    [wordCount]
  );

  const seoAudit = useMemo(
    () =>
      runBlogSeoAudit({
        title,
        seoTitle,
        seoDescription,
        excerpt,
        coverImage,
        sections,
        focusKeyword,
      }),
    [title, seoTitle, seoDescription, excerpt, coverImage, sections, focusKeyword]
  );

  const handleToggleRelatedProduct = (prodId: string) => {
    setRelatedProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const handleAddBlock = (blockType: BlogBlockType) => {
    const idx = sections.length + 1;
    const labelMap: Record<BlogBlockType, string> = {
      section: `0${idx}. Section Heading`,
      image: `Figure ${idx}: Architectural Visual`,
      callout: 'Key Implementation Note',
      checklist: 'Production Verification Checklist',
      quote: 'Principle Highlight',
      code: 'Implementation Reference Snippet',
    };
    setSections((prev) => [
      ...prev,
      {
        id: `sec-${Date.now()}-${prev.length}`,
        blockType,
        heading: labelMap[blockType],
        body:
          blockType === 'image'
            ? 'Contextual walkthrough explaining what this figure illustrates for readers.'
            : '',
        imageUrl:
          blockType === 'image'
            ? MEDIA_LIBRARY_ASSETS[idx % MEDIA_LIBRARY_ASSETS.length].url
            : undefined,
        imageCaption:
          blockType === 'image'
            ? 'Visual reference integrated into the article body.'
            : undefined,
        imageAlt: blockType === 'image' ? 'Editorial technical illustration' : undefined,
        imageAlign: blockType === 'image' ? 'center' : undefined,
        calloutTone: blockType === 'callout' ? 'tip' : undefined,
        checklistItems:
          blockType === 'checklist'
            ? ['Verify boundary contracts before shipping', 'Add automated regression checks']
            : undefined,
      },
    ]);
  };

  const handleMoveSection = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      const item = next[idx];
      next[idx] = next[target];
      next[target] = item;
      return next;
    });
  };

  const handleDuplicateSection = (idx: number) => {
    setSections((prev) => {
      const clone: BlogSection = {
        ...prev[idx],
        id: `sec-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  };

  const handleRemoveSection = (idx: number) => {
    if (sections.length <= 1) return;
    setSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFormatSelection = (
    secId: string,
    secIdx: number,
    prefix: string,
    suffix: string = prefix,
    placeholder: string = 'highlighted text'
  ) => {
    const el = textareaRefs.current[secId];
    const currentBody = sections[secIdx]?.body ?? '';
    const start = el?.selectionStart ?? currentBody.length;
    const end = el?.selectionEnd ?? currentBody.length;
    const { nextText, nextCursor } = applyInlineMarkdownToken(
      currentBody,
      start,
      end,
      prefix,
      suffix,
      placeholder
    );
    setSections((prev) =>
      prev.map((s, i) => (i === secIdx ? { ...s, body: nextText } : s))
    );
    window.setTimeout(() => {
      const refreshed = textareaRefs.current[secId];
      if (refreshed) {
        refreshed.focus();
        refreshed.setSelectionRange(nextCursor, nextCursor);
      }
    }, 10);
  };

  const handleUploadCoverImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      if (dataUrl) setCoverImage(dataUrl);
    } catch {
      setError('Could not read the uploaded cover image file.');
    }
  };

  const handleUploadSectionImage = async (
    secIdx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      if (dataUrl) {
        setSections((prev) =>
          prev.map((s, i) =>
            i === secIdx
              ? {
                  ...s,
                  imageUrl: dataUrl,
                  imageAlign: s.imageAlign ?? 'center',
                  imageAlt: s.imageAlt || file.name,
                }
              : s
          )
        );
      }
    } catch {
      setError('Could not read the uploaded inline body image.');
    }
  };

  const handleGenerateWithGemini = async () => {
    const targetTitle = (aiTitlePrompt.trim() || title.trim()).trim();
    if (targetTitle.length < 4) {
      setAiError('Enter an article title (at least 4 characters) to generate with AI.');
      return;
    }
    setAiError(null);
    setAiSuccessMsg(null);
    setAiGenerating(true);

    try {
      const resp = await fetch('/api/gemini/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: targetTitle,
          category,
          tone: aiTone,
          targetAudience: aiAudience,
          includeInlineImages: aiIncludeImages,
        }),
      });
      const payload = (await resp.json()) as {
        error?: string;
        title?: string;
        subtitle?: string;
        excerpt?: string;
        seoTitle?: string;
        seoDescription?: string;
        focusKeyword?: string;
        readTimeMinutes?: number;
        tags?: string[];
        coverImage?: string;
        sections?: BlogSection[];
      };

      if (!resp.ok) {
        setAiError(payload.error || `AI request failed (${resp.status}).`);
        return;
      }

      if (payload.title) setTitle(payload.title);
      if (payload.subtitle) setSubtitle(payload.subtitle);
      if (payload.excerpt) setExcerpt(payload.excerpt);
      if (payload.seoTitle) setSeoTitle(payload.seoTitle);
      if (payload.seoDescription) setSeoDescription(payload.seoDescription);
      if (payload.focusKeyword) setFocusKeyword(payload.focusKeyword);
      if (payload.tags?.length) setTagsText(payload.tags.join(', '));
      if (payload.coverImage) setCoverImage(payload.coverImage);
      if (payload.sections?.length) setSections(payload.sections);

      setAiSuccessMsg(
        `Draft populated with ${payload.sections?.length ?? 0} structured blocks, SEO metadata, and integrated imagery.`
      );
    } catch {
      setAiError('Network error reaching the AI Article Writer server endpoint.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 5) {
      setError('Article title must be at least 5 characters.');
      return;
    }

    const cleanSections = sections
      .map((s) => ({
        ...s,
        heading: s.heading.trim() || 'Section',
        body: s.body.trim(),
        pullQuote: s.pullQuote?.trim() || undefined,
        codeSnippet: s.codeSnippet?.trim() || undefined,
        imageUrl: s.imageUrl?.trim() || undefined,
        imageCaption: s.imageCaption?.trim() || undefined,
        imageAlt: s.imageAlt?.trim() || undefined,
        checklistItems: s.checklistItems?.map((item) => item.trim()).filter(Boolean),
      }))
      .filter(
        (s) =>
          s.body.length > 0 ||
          Boolean(s.imageUrl) ||
          Boolean(s.codeSnippet) ||
          Boolean(s.checklistItems?.length)
      );

    if (cleanSections.length === 0) {
      setError('Add body content, an image block, or a checklist to at least one section.');
      return;
    }

    const nowIso = new Date().toISOString();
    const cleanSlug =
      initialPost?.slug ??
      `${slugifyText(title)}-${Math.floor(100 + Math.random() * 900)}`;

    const builtPost: BlogPost = {
      id: initialPost?.id ?? `blog-${Date.now()}`,
      slug: cleanSlug,
      title: title.trim(),
      subtitle:
        subtitle.trim() ||
        'Field guide and actionable architecture notes for modern engineering teams.',
      excerpt: excerpt.trim() || cleanSections[0].body.slice(0, 180) || title.trim(),
      category,
      authorId: initialPost?.authorId ?? authorId,
      authorName: initialPost?.authorName ?? authorName,
      authorRole: initialPost?.authorRole ?? authorRole,
      authorAvatar: initialPost?.authorAvatar ?? INSTRUCTOR_AVATAR,
      coverImage: coverImage.trim() || BLOG_AI_VIBE_IMAGE,
      readTimeMinutes: computedReadMinutes,
      publishedAt: initialPost?.publishedAt ?? nowIso,
      updatedAt: nowIso,
      scheduledAt: status === 'scheduled' ? scheduledAt : undefined,
      status,
      featured,
      tags: tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      focusKeyword: focusKeyword.trim() || undefined,
      sections: cleanSections,
      relatedProductIds,
      comments: initialPost?.comments ?? [],
    };

    onSave(builtPost);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initialPost ? 'Editorial Blog Studio' : 'Create Blog Article'}
    >
      <div className="bg-[#f8fafc] rounded-xl border border-slate-300 max-w-6xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Studio Toolbar */}
        <div className="px-5 py-3.5 bg-[#0a192f] text-white border-b-2 border-[#d4af37] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#f5c451]" />
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold leading-tight">
                {initialPost ? 'Editorial Studio · Edit Article' : 'Editorial Studio · New Article'}
              </h2>
              <p className="text-[11px] text-slate-300 tabular-nums">
                {wordCount} words · {computedReadMinutes} min read · SEO Score {seoAudit.score}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md bg-[#112240] p-0.5 border border-[#2a436e]">
              <button
                type="button"
                onClick={() => setWorkspaceMode('compose')}
                className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer ${
                  workspaceMode === 'compose'
                    ? 'bg-[#d4af37] text-[#0a192f]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Block Editor
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode('preview')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded cursor-pointer ${
                  workspaceMode === 'preview'
                    ? 'bg-[#d4af37] text-[#0a192f]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAiPanelOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[#112240] border border-[#d4af37]/60 text-[#f5c451] hover:bg-[#172e54] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Article Writer</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close blog editor"
              className="p-1.5 text-slate-300 hover:text-white rounded cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* AI Article Writer Workbench */}
          {aiPanelOpen && workspaceMode === 'compose' && (
            <section className="mb-6 bg-[#0a192f] text-white border border-[#d4af37] rounded-xl p-5 space-y-4 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#f5c451]" />
                  <h3 className="font-display text-sm font-bold text-[#f5c451]">
                    AI Article Writer · Generate Full Draft & Integrated Visuals from Title
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAiPanelOpen(false)}
                  className="text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  Hide panel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-5">
                  <label htmlFor="ai-article-title" className="block text-[11px] font-bold text-slate-300 mb-1">
                    Article Title Prompt
                  </label>
                  <input
                    id="ai-article-title"
                    type="text"
                    value={aiTitlePrompt}
                    onChange={(e) => {
                      setAiTitlePrompt(e.target.value);
                      if (!title) setTitle(e.target.value);
                    }}
                    placeholder="e.g., Designing Resilient Event-Driven Vibe Coding Pipelines"
                    className="w-full h-9 px-3 text-xs bg-[#112240] border border-[#2a436e] rounded text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="md:col-span-3">
                  <label htmlFor="ai-tone-select" className="block text-[11px] font-bold text-slate-300 mb-1">
                    Editorial Tone
                  </label>
                  <select
                    id="ai-tone-select"
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs bg-[#112240] border border-[#2a436e] rounded text-white"
                  >
                    {TONE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label htmlFor="ai-audience-input" className="block text-[11px] font-bold text-slate-300 mb-1">
                    Target Reader Audience
                  </label>
                  <input
                    id="ai-audience-input"
                    type="text"
                    value={aiAudience}
                    onChange={(e) => setAiAudience(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-[#112240] border border-[#2a436e] rounded text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiIncludeImages}
                    onChange={(e) => setAiIncludeImages(e.target.checked)}
                    className="accent-[#d4af37]"
                  />
                  <span>Integrate featured & inline editorial images automatically</span>
                </label>

                <button
                  type="button"
                  disabled={aiGenerating}
                  onClick={handleGenerateWithGemini}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#d4af37] hover:bg-[#e5bf45] text-[#0a192f] rounded-md disabled:opacity-60 cursor-pointer"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Article Draft...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Full Article</span>
                    </>
                  )}
                </button>
              </div>

              {aiError && (
                <div className="flex items-start gap-2 text-xs bg-rose-950/70 border border-rose-500/60 text-rose-100 rounded-md p-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-300" />
                  <span>{aiError}</span>
                </div>
              )}

              {aiSuccessMsg && (
                <div className="flex items-start gap-2 text-xs bg-emerald-950/70 border border-emerald-500/60 text-emerald-100 rounded-md p-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-300" />
                  <span>{aiSuccessMsg}</span>
                </div>
              )}
            </section>
          )}

          {workspaceMode === 'preview' ? (
            /* Live Article Preview Canvas */
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-10 space-y-6 shadow-sm">
              <div className="space-y-2 border-b border-slate-200 pb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#0a192f]">
                  {category} · {computedReadMinutes} min read · Preview
                </p>
                <h1 className="font-display text-3xl font-extrabold text-slate-900">
                  {title || 'Untitled Editorial Article'}
                </h1>
                <p className="text-base text-slate-600">{subtitle}</p>
              </div>

              {coverImage && (
                <figure className="space-y-1.5">
                  <img
                    src={coverImage}
                    alt={title || 'Cover preview'}
                    className="w-full max-h-[360px] object-cover rounded-xl border border-slate-200"
                  />
                  <figcaption className="text-xs text-slate-500">Featured Image</figcaption>
                </figure>
              )}

              {excerpt && (
                <p className="text-base font-medium text-slate-800 leading-relaxed">{excerpt}</p>
              )}

              {sections.map((sec) => (
                <section key={sec.id} className="space-y-3 pt-2">
                  <h2 className="font-display text-xl font-bold text-slate-900">{sec.heading}</h2>
                  {sec.body && (
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {sec.body}
                    </p>
                  )}
                  {sec.imageUrl && (
                    <figure className="space-y-1.5">
                      <img
                        src={sec.imageUrl}
                        alt={sec.imageAlt || sec.heading}
                        className="w-full max-h-80 object-cover rounded-lg border border-slate-200"
                      />
                      {sec.imageCaption && (
                        <figcaption className="text-xs text-slate-500">{sec.imageCaption}</figcaption>
                      )}
                    </figure>
                  )}
                  {sec.checklistItems && sec.checklistItems.length > 0 && (
                    <ul className="space-y-1.5 bg-slate-50 border border-slate-200 rounded-lg p-4">
                      {sec.checklistItems.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {sec.pullQuote && (
                    <blockquote className="py-3 px-4 border-l-4 border-[#d4af37] bg-slate-50 font-display font-bold text-[#0a192f]">
                      “{sec.pullQuote}”
                    </blockquote>
                  )}
                  {sec.codeSnippet && (
                    <pre className="p-4 rounded-lg bg-[#0a192f] text-slate-100 font-mono text-xs overflow-x-auto">
                      <code>{sec.codeSnippet}</code>
                    </pre>
                  )}
                </section>
              ))}
            </div>
          ) : (
            /* 2-Column Editorial Studio: Main Block Composer + Right Inspector */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Core Headlines + Structured Block Canvas (8 cols) */}
              <div className="lg:col-span-8 space-y-5">
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div>
                    <label
                      htmlFor="blog-title-input"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Article Headline
                    </label>
                    <input
                      id="blog-title-input"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Write a compelling engineering or leadership headline..."
                      className="w-full h-11 px-3.5 text-base font-display font-bold border border-slate-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="blog-subtitle-input"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Subtitle / Deck
                    </label>
                    <input
                      id="blog-subtitle-input"
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Concise deck shown beneath the main headline..."
                      className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="blog-excerpt-input"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Editorial Lead / Excerpt
                    </label>
                    <textarea
                      id="blog-excerpt-input"
                      rows={2}
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="Opening summary displayed on cards and above the first section..."
                      className="w-full p-3 text-sm border border-slate-300 rounded-md"
                    />
                  </div>
                </div>

                {/* Block Composer Header + Block Inserter Palette */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Article Body Blocks ({sections.length})
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddBlock('section')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-[#0a192f] text-white rounded cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Text Section</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlock('image')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-[#d4af37] text-[#0a192f] rounded cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Body Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlock('callout')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-slate-300 bg-white text-slate-800 rounded hover:bg-slate-50 cursor-pointer"
                      >
                        <MessageSquareQuote className="w-3.5 h-3.5" />
                        <span>Callout</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlock('checklist')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-slate-300 bg-white text-slate-800 rounded hover:bg-slate-50 cursor-pointer"
                      >
                        <ListChecks className="w-3.5 h-3.5" />
                        <span>Checklist</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {sections.map((sec, idx) => (
                      <div
                        key={sec.id}
                        className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3"
                      >
                        {/* Block Header Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                              {sec.blockType ?? 'section'}
                            </span>
                            <input
                              type="text"
                              value={sec.heading}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((s, i) =>
                                    i === idx ? { ...s, heading: e.target.value } : s
                                  )
                                )
                              }
                              aria-label={`Block ${idx + 1} heading`}
                              className="flex-1 h-9 px-3 text-sm font-bold bg-white border border-slate-300 rounded"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveSection(idx, -1)}
                              aria-label={`Move block ${idx + 1} up`}
                              className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 disabled:opacity-40 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === sections.length - 1}
                              onClick={() => handleMoveSection(idx, 1)}
                              aria-label={`Move block ${idx + 1} down`}
                              className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 disabled:opacity-40 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateSection(idx)}
                              aria-label={`Duplicate block ${idx + 1}`}
                              className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {sections.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSection(idx)}
                                aria-label={`Remove block ${idx + 1}`}
                                className="p-1.5 bg-white border border-slate-200 rounded text-slate-500 hover:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Rich Inline Formatting Toolbar */}
                        <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1">
                          <button
                            type="button"
                            onClick={() => handleFormatSelection(sec.id, idx, '**', '**', 'bold phrase')}
                            title="Bold"
                            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormatSelection(sec.id, idx, '*', '*', 'italic phrase')}
                            title="Italic"
                            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormatSelection(sec.id, idx, '`', '`', 'symbolName')}
                            title="Inline Code"
                            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleFormatSelection(sec.id, idx, '[', '](https://example.com)', 'reference link')
                            }
                            title="Insert Link"
                            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] text-slate-400 ml-auto px-1">
                            Supports **bold**, *italic*, `code`, [link](url)
                          </span>
                        </div>

                        <textarea
                          ref={(el) => {
                            textareaRefs.current[sec.id] = el;
                          }}
                          rows={4}
                          value={sec.body}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, body: e.target.value } : s))
                            )
                          }
                          placeholder="Write detailed section prose..."
                          aria-label={`Section ${idx + 1} body`}
                          className="w-full p-3 text-sm bg-white border border-slate-300 rounded"
                        />

                        {/* Inline Body Image Controls (Attachable to any block or dedicated image block) */}
                        <div className="bg-white border border-slate-200 rounded-md p-3 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 inline-flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-[#0a192f]" />
                              <span>Inline Body Image</span>
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded cursor-pointer">
                                <Upload className="w-3 h-3" />
                                <span>Upload File</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleUploadSectionImage(idx, e)}
                                  className="sr-only"
                                />
                              </label>
                              {sec.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSections((prev) =>
                                      prev.map((s, i) =>
                                        i === idx
                                          ? {
                                              ...s,
                                              imageUrl: undefined,
                                              imageCaption: undefined,
                                              imageAlt: undefined,
                                            }
                                          : s
                                      )
                                    )
                                  }
                                  className="text-[11px] text-rose-700 hover:underline cursor-pointer"
                                >
                                  Clear Image
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                              aria-label={`Select preset media for block ${idx + 1}`}
                              value={
                                MEDIA_LIBRARY_ASSETS.some((m) => m.url === sec.imageUrl)
                                  ? sec.imageUrl
                                  : ''
                              }
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((s, i) =>
                                    i === idx
                                      ? {
                                          ...s,
                                          imageUrl: e.target.value || undefined,
                                          imageAlign: s.imageAlign ?? 'center',
                                        }
                                      : s
                                  )
                                )
                              }
                              className="h-8 px-2 text-xs border border-slate-300 rounded bg-white"
                            >
                              <option value="">Choose from Media Library...</option>
                              {MEDIA_LIBRARY_ASSETS.map((asset) => (
                                <option key={asset.id} value={asset.url}>
                                  {asset.label} ({asset.category})
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              value={sec.imageUrl ?? ''}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((s, i) =>
                                    i === idx ? { ...s, imageUrl: e.target.value } : s
                                  )
                                )
                              }
                              placeholder="Or paste custom image URL..."
                              aria-label={`Inline image URL for block ${idx + 1}`}
                              className="h-8 px-2.5 text-xs border border-slate-300 rounded"
                            />
                          </div>

                          {sec.imageUrl && (
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-1">
                              <img
                                src={sec.imageUrl}
                                alt={sec.imageAlt || sec.heading}
                                className="sm:col-span-3 h-16 w-full object-cover rounded border border-slate-200"
                              />
                              <input
                                type="text"
                                value={sec.imageCaption ?? ''}
                                onChange={(e) =>
                                  setSections((prev) =>
                                    prev.map((s, i) =>
                                      i === idx ? { ...s, imageCaption: e.target.value } : s
                                    )
                                  )
                                }
                                placeholder="Image caption..."
                                className="sm:col-span-4 h-8 px-2.5 text-xs border border-slate-300 rounded"
                              />
                              <input
                                type="text"
                                value={sec.imageAlt ?? ''}
                                onChange={(e) =>
                                  setSections((prev) =>
                                    prev.map((s, i) =>
                                      i === idx ? { ...s, imageAlt: e.target.value } : s
                                    )
                                  )
                                }
                                placeholder="Alt text..."
                                className="sm:col-span-3 h-8 px-2.5 text-xs border border-slate-300 rounded"
                              />
                              <select
                                value={sec.imageAlign ?? 'center'}
                                onChange={(e) =>
                                  setSections((prev) =>
                                    prev.map((s, i) =>
                                      i === idx
                                        ? {
                                            ...s,
                                            imageAlign: e.target.value as BlogSection['imageAlign'],
                                          }
                                        : s
                                    )
                                  )
                                }
                                aria-label="Inline image alignment"
                                className="sm:col-span-2 h-8 px-1.5 text-xs border border-slate-300 rounded bg-white"
                              >
                                <option value="center">Center</option>
                                <option value="wide">Wide</option>
                                <option value="left">Float L</option>
                                <option value="right">Float R</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Checklist Editor if checklist block or items exist */}
                        {(sec.blockType === 'checklist' || Boolean(sec.checklistItems?.length)) && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Checklist Items (one per line)
                            </label>
                            <textarea
                              rows={3}
                              value={(sec.checklistItems ?? []).join('\n')}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((s, i) =>
                                    i === idx
                                      ? { ...s, checklistItems: e.target.value.split('\n') }
                                      : s
                                  )
                                )
                              }
                              className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded"
                            />
                          </div>
                        )}

                        {sec.blockType === 'callout' && (
                          <div className="flex items-center gap-3">
                            <label className="text-[11px] font-bold text-slate-700">
                              Callout Tone:
                            </label>
                            <select
                              value={sec.calloutTone ?? 'tip'}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((s, i) =>
                                    i === idx
                                      ? {
                                          ...s,
                                          calloutTone: e.target.value as BlogSection['calloutTone'],
                                        }
                                      : s
                                  )
                                )
                              }
                              className="h-8 px-2 text-xs bg-white border border-slate-300 rounded"
                            >
                              <option value="tip">Best Practice Tip</option>
                              <option value="info">Architecture Note</option>
                              <option value="warning">Production Warning</option>
                            </select>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={sec.pullQuote ?? ''}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((s, i) =>
                                  i === idx ? { ...s, pullQuote: e.target.value } : s
                                )
                              )
                            }
                            placeholder="Optional pull quote..."
                            aria-label={`Section ${idx + 1} pull quote`}
                            className="h-9 px-3 text-xs bg-white border border-slate-300 rounded"
                          />
                          <input
                            type="text"
                            value={sec.codeSnippet ?? ''}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((s, i) =>
                                  i === idx ? { ...s, codeSnippet: e.target.value } : s
                                )
                              )
                            }
                            placeholder="Optional code/CLI snippet..."
                            aria-label={`Section ${idx + 1} code snippet`}
                            className="h-9 px-3 text-xs font-mono bg-white border border-slate-300 rounded"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Publishing, Featured Image, SEO Audit, Related Products (4 cols) */}
              <div className="lg:col-span-4 space-y-5">
                {/* Publishing Controls */}
                <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="font-display text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Publishing & Taxonomy
                  </h3>

                  <div>
                    <label
                      htmlFor="blog-category-select"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="blog-category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as BlogCategory)}
                      className="w-full h-9 px-2.5 text-xs border border-slate-300 rounded bg-white"
                    >
                      {BLOG_CATEGORY_ITEMS.map((c) => (
                        <option key={c.category} value={c.category}>
                          {c.category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="blog-status-select"
                        className="block text-xs font-bold text-slate-700 mb-1"
                      >
                        Status
                      </label>
                      <select
                        id="blog-status-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as BlogStatus)}
                        className="w-full h-9 px-2 text-xs border border-slate-300 rounded bg-white"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Read Time
                      </label>
                      <div className="h-9 px-3 bg-slate-50 border border-slate-200 rounded flex items-center text-xs font-bold text-slate-800 tabular-nums">
                        {computedReadMinutes} min ({wordCount} w)
                      </div>
                    </div>
                  </div>

                  {status === 'scheduled' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Scheduled Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledAt.slice(0, 16)}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="w-full h-9 px-2.5 text-xs border border-slate-300 rounded"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="blog-tags-input"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Tags (comma separated)
                    </label>
                    <input
                      id="blog-tags-input"
                      type="text"
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                      className="w-full h-9 px-2.5 text-xs border border-slate-300 rounded"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="accent-[#0a192f]"
                    />
                    <span>Feature at top of Blogs Hub</span>
                  </label>
                </section>

                {/* Featured Image Manager */}
                <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Featured Cover Image
                    </h3>
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-[#0a192f] text-[#f5c451] rounded cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadCoverImage}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  {coverImage && (
                    <img
                      src={coverImage}
                      alt="Featured cover preview"
                      className="w-full aspect-[16/9] object-cover rounded-lg border border-slate-200"
                    />
                  )}

                  <select
                    id="blog-cover-select"
                    value={
                      MEDIA_LIBRARY_ASSETS.some((m) => m.url === coverImage) ? coverImage : ''
                    }
                    onChange={(e) => {
                      if (e.target.value) setCoverImage(e.target.value);
                    }}
                    aria-label="Choose featured artwork from media library"
                    className="w-full h-9 px-2.5 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="">Select from Media Library...</option>
                    {MEDIA_LIBRARY_ASSETS.map((preset) => (
                      <option key={preset.id} value={preset.url}>
                        {preset.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="Or paste custom cover image URL..."
                    aria-label="Custom featured cover URL"
                    className="w-full h-9 px-2.5 text-xs border border-slate-300 rounded"
                  />
                </section>

                {/* Real-Time SEO & Metadata Inspector */}
                <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <SearchCheck className="w-4 h-4 text-[#0a192f]" />
                      <span>SEO & Search Readiness</span>
                    </h3>
                    <span
                      className={`text-xs font-extrabold tabular-nums ${
                        seoAudit.score >= 80 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {seoAudit.score}%
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Focus Keyword
                    </label>
                    <input
                      type="text"
                      value={focusKeyword}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      placeholder="e.g., vibe coding"
                      className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      SEO Title Override
                    </label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder={title || 'Defaults to article title'}
                      className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      rows={2}
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder={excerpt || 'Defaults to article excerpt'}
                      className="w-full p-2 text-xs border border-slate-300 rounded"
                    />
                  </div>

                  <ul className="space-y-1.5 pt-1">
                    {seoAudit.checks.map((chk) => (
                      <li key={chk.label} className="flex items-start gap-2 text-[11px]">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            chk.passed ? 'text-emerald-600' : 'text-slate-300'
                          }`}
                        />
                        <span className={chk.passed ? 'text-slate-800' : 'text-slate-500'}>
                          <strong>{chk.label}:</strong> {chk.hint}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Link Matching Courses & Digital Products */}
                <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Link Courses & Digital Products
                  </h3>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {publishedProducts.map((prod) => {
                      const checked = relatedProductIds.includes(prod.id);
                      return (
                        <label
                          key={prod.id}
                          className={`flex items-start gap-2 p-2 rounded border text-xs cursor-pointer ${
                            checked
                              ? 'bg-[#f8fafc] border-[#0a192f]'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleRelatedProduct(prod.id)}
                            className="mt-0.5 accent-[#0a192f]"
                          />
                          <span className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">
                              {prod.title}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {formatProductTypeLabel(prod.type, prod.digitalSubType)} ·{' '}
                              {formatNaira(prod.price)}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 border border-slate-300 bg-white rounded-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md cursor-pointer"
            >
              {initialPost ? 'Save Article Changes' : 'Publish Blog Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
