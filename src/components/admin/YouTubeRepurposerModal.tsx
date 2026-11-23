import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Film,
  Layers,
  Play,
  Save,
  Share2,
  Sparkles,
  Video,
  X,
  Youtube,
  FileText,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  repurposeYouTubeToCourse,
  generateYouTubeCourseSocialSnippets,
  parseYouTubeVideoId,
} from '../../utils/youtubeRepurposer';
import type { RepurposedCoursePackage } from '../../types/tutorial';
import type { Product, SocialPlatform } from '../../types/marketplace';
import { formatNaira } from '../../utils/currency';

interface YouTubeRepurposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated?: (product: Product) => void;
}

export const YouTubeRepurposerModal: React.FC<YouTubeRepurposerModalProps> = ({
  isOpen,
  onClose,
  onCourseCreated,
}) => {
  const { currentUser, upsertProduct, showToast } = useStore();
  const categories: string[] = [
    'Vibe Coding & AI',
    'Apps Deployment',
    'Software Engineering',
    'Developer Tools',
    'Business & Product',
    'Leadership',
    'Mentorship',
    'Design & UI Systems',
  ];

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Vibe Coding & AI');
  const [targetPrice, setTargetPrice] = useState('25000');
  const [level, setLevel] = useState<'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced'>(
    'All Levels'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [repurposedCourse, setRepurposedCourse] = useState<RepurposedCoursePackage | null>(null);
  const [socialSnippets, setSocialSnippets] = useState<Record<SocialPlatform, string> | null>(null);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'notes' | 'social'>('curriculum');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = parseYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      showToast('Please enter a valid YouTube video URL (watch, embed, or shorts)');
      return;
    }

    setIsProcessing(true);
    try {
      const priceNum = Math.max(0, parseInt(targetPrice, 10) || 0);
      const pkg = repurposeYouTubeToCourse({
        youtubeUrl,
        customTitle: customTitle.trim() || undefined,
        category,
        targetPrice: priceNum,
        level,
      });
      const snippets = generateYouTubeCourseSocialSnippets(pkg);
      setRepurposedCourse(pkg);
      setSocialSnippets(snippets);
      showToast('✓ Video successfully repurposed into complete course curriculum!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to repurpose video';
      showToast(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveCourse = () => {
    if (!repurposedCourse) return;

    const newProductId = `course-yt-${Date.now()}`;
    const slug = `course-${repurposedCourse.videoId}-${Date.now().toString().slice(-4)}`;
    const originalPrice = Math.round(repurposedCourse.price * 1.6);

    const newProduct: Product = {
      id: newProductId,
      title: repurposedCourse.title,
      slug,
      subtitle: repurposedCourse.subtitle,
      description: repurposedCourse.description,
      type: 'course',
      category: repurposedCourse.category,
      instructorId: currentUser?.id || 'admin-1',
      instructorName: currentUser?.name || 'Digital Wealth Lead',
      instructorRole: 'Platform Lead & Creator',
      instructorAvatar:
        currentUser?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
      price: repurposedCourse.price,
      originalPrice,
      rating: 5.0,
      reviewCount: 1,
      studentsCount: 1,
      thumbnail: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=630&fit=crop`,
      level: (repurposedCourse.level as any) || 'All Levels',
      language: 'English',
      updatedAt: new Date().toISOString().slice(0, 10),
      status: 'published',
      featured: true,
      bestseller: true,
      formatLabel: 'Video Course',
      learningOutcomes: [
        'Complete curriculum generated from video',
        'Structured markdown lesson notes',
        'Multi-platform social distribution kit',
      ],
      requirements: ['Basic internet connection'],
      courseData: {
        totalHours: 1.25,
        courseFormat: 'video',
        modules: repurposedCourse.modules,
      },
    };

    upsertProduct(newProduct);
    if (onCourseCreated) {
      onCourseCreated(newProduct);
    }
    showToast(`✓ "${repurposedCourse.title}" successfully added to Catalog!`);
    onClose();
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                YouTube URL to Course Repurposer
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transform any YouTube link into a structured course curriculum, lesson notes, and marketing copy.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Form */}
          <form onSubmit={handleConvert} className="space-y-4 bg-slate-950/60 p-5 rounded-xl border border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                YouTube Video URL <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-red-500/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isProcessing ? 'Repurposing...' : 'Repurpose to Course'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Custom Title (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty for auto-title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Price (₦ NGN)</label>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  min="0"
                  step="1000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Difficulty Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="All Levels">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </form>

          {/* Repurposed Course Preview */}
          {repurposedCourse && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Course Header Banner */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {repurposedCourse.category} • {repurposedCourse.level}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">{repurposedCourse.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{repurposedCourse.subtitle}</p>
                  <div className="mt-2 text-sm font-semibold text-amber-400">
                    {formatNaira(repurposedCourse.price)}
                    <span className="ml-2 text-xs text-slate-500 line-through">
                      {formatNaira(Math.round(repurposedCourse.price * 1.6))}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCourse}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
                  >
                    <Save className="w-4 h-4" /> Add Course to Catalog
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-800 gap-6">
                <button
                  onClick={() => setActiveTab('curriculum')}
                  className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
                    activeTab === 'curriculum'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Layers className="w-4 h-4" /> Curriculum ({repurposedCourse.modules.length} Modules)
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
                    activeTab === 'notes'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Lesson Notes (Markdown)
                </button>
                <button
                  onClick={() => setActiveTab('social')}
                  className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
                    activeTab === 'social'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Share2 className="w-4 h-4" /> Marketing & Social Variants
                </button>
              </div>

              {/* Tab 1: Curriculum */}
              {activeTab === 'curriculum' && (
                <div className="space-y-4">
                  {repurposedCourse.modules.map((mod: any, index: number) => (
                    <div key={mod.id || index} className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-white flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          {mod.title}
                        </span>
                        <span className="text-[11px] text-slate-400">{mod.durationMinutes} mins</span>
                      </div>
                      <div className="divide-y divide-slate-800/60">
                        {mod.lectures?.map((lec: any) => (
                          <div key={lec.id} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-900/30">
                            <div className="flex items-center gap-2.5 text-slate-300">
                              <Play className="w-3.5 h-3.5 text-slate-500" />
                              <span>{lec.title}</span>
                              {lec.isPreview && (
                                <span className="text-[10px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/20">
                                  Free Preview
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 text-[11px]">{lec.durationMinutes} mins</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Lesson Notes */}
              {activeTab === 'notes' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button
                      onClick={() => copyToClipboard(repurposedCourse.lessonNotes, 'notes')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg flex items-center gap-1.5 transition"
                    >
                      {copiedKey === 'notes' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Lesson Notes
                    </button>
                  </div>
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">
                    {repurposedCourse.lessonNotes}
                  </pre>
                </div>
              )}

              {/* Tab 3: Social & Marketing Assets */}
              {activeTab === 'social' && socialSnippets && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(
                    [
                      { key: 'linkedin', title: 'LinkedIn Post' },
                      { key: 'facebook', title: 'Facebook Page Post' },
                      { key: 'x', title: 'X (Twitter) Update' },
                      { key: 'instagram', title: 'Instagram Caption' },
                      { key: 'whatsapp_group', title: 'WhatsApp Community Broadcast' },
                      { key: 'youtube', title: 'YouTube Video Description & Timestamps' },
                    ] as const
                  ).map(({ key, title }) => (
                    <div key={key} className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-300">{title}</span>
                          <button
                            onClick={() => copyToClipboard(socialSnippets[key], key)}
                            className="text-slate-400 hover:text-white p-1 rounded transition"
                          >
                            {copiedKey === key ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 whitespace-pre-wrap">{socialSnippets[key]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
