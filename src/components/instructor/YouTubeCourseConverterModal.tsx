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
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  convertYouTubeUrlToCourse,
  extractYouTubeVideoId,
  type ConvertedYouTubeCourse,
} from '../../utils/youtubeCourseConverter';
import { formatNaira } from '../../utils/currency';

interface YouTubeCourseConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const YouTubeCourseConverterModal: React.FC<YouTubeCourseConverterModalProps> = ({
  isOpen,
  onClose,
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
  const [convertedCourse, setConvertedCourse] = useState<ConvertedYouTubeCourse | null>(null);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'social'>('curriculum');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractYouTubeVideoId(youtubeUrl)) {
      showToast('Please enter a valid YouTube video URL');
      return;
    }

    setIsProcessing(true);
    try {
      const priceNum = Math.max(0, parseInt(targetPrice, 10) || 0);
      const result = convertYouTubeUrlToCourse({
        youtubeUrl,
        customTitle: customTitle.trim() || undefined,
        category,
        targetPrice: priceNum,
        level,
      });
      setConvertedCourse(result);
      showToast('✓ Video successfully converted to complete course curriculum!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to convert video');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveCourse = () => {
    if (!convertedCourse || !currentUser) return;

    const newProductId = `course-yt-${Date.now()}`;
    const newProduct = {
      id: newProductId,
      title: convertedCourse.title,
      slug: `course-${convertedCourse.videoId}-${Date.now().toString().slice(-4)}`,
      subtitle: convertedCourse.subtitle,
      description: convertedCourse.description,
      type: 'course' as const,
      category: convertedCourse.category,
      price: convertedCourse.price,
      originalPrice: convertedCourse.originalPrice,
      rating: 5.0,
      reviewsCount: 1,
      studentsCount: 0,
      level: convertedCourse.level,
      language: 'English',
      thumbnail: `https://img.youtube.com/vi/${convertedCourse.videoId}/hqdefault.jpg`,
      featured: false,
      isBestseller: false,
      bestsellerRank: undefined,
      membershipTierRequired: convertedCourse.price === 0 ? ('free' as const) : ('paid' as const),
      status: 'draft' as const, // per user's choice to save as draft for 1-click review
      instructorId: currentUser.id,
      instructorName: currentUser.name,
      instructorAvatar: currentUser.avatar,
      durationHours: 3.5,
      lecturesCount: 6,
      courseModules: convertedCourse.modules,
      deliverableDownloadUrl: `https://www.youtube.com/watch?v=${convertedCourse.videoId}`,
      videoSourceUrl: `https://www.youtube.com/watch?v=${convertedCourse.videoId}`,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    upsertProduct(newProduct as any);
    showToast(`✓ "${convertedCourse.title}" saved to your Draft courses!`);
    onClose();
  };

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(key);
    showToast('Copied to clipboard');
    window.setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0a192f] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#233554] overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a192f] via-[#112240] to-[#0a192f] text-white p-6 border-b border-[#d4af37]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center shadow-inner">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
                <span>YouTube URL to Course & Repurposing Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5c451]/20 border border-[#f5c451]/50 text-[#f5c451] font-mono">
                  AI-Powered
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Paste any YouTube video to automatically synthesize a multi-module course curriculum and social promotion kit.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Input Form */}
          <form onSubmit={handleConvert} className="space-y-4 bg-slate-50 dark:bg-[#112240] p-4.5 rounded-xl border border-slate-200 dark:border-[#1e3557]">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                YouTube Video or Lecture URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#0a192f] border border-slate-300 dark:border-[#233554] rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Custom Course Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Auto-detected if left empty"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0a192f] border border-slate-300 dark:border-[#233554] rounded-md text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0a192f] border border-slate-300 dark:border-[#233554] rounded-md text-xs text-slate-900 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Target Price (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0a192f] border border-slate-300 dark:border-[#233554] rounded-md text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Difficulty Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0a192f] border border-slate-300 dark:border-[#233554] rounded-md text-xs text-slate-900 dark:text-white"
                >
                  <option value="All Levels">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2.5 bg-gradient-to-r from-[#d4af37] via-[#f5c451] to-[#d4af37] text-[#0a192f] font-bold text-xs rounded-lg hover:brightness-110 transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-[#0a192f]" />
                <span>{isProcessing ? 'Synthesizing Course...' : 'Transform Video to Course with AI'}</span>
              </button>
            </div>
          </form>

          {/* Result Preview */}
          {convertedCourse && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1e3557]">
                <button
                  type="button"
                  onClick={() => setActiveTab('curriculum')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                    activeTab === 'curriculum'
                      ? 'border-[#d4af37] text-[#d4af37]'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Curriculum Breakdown ({convertedCourse.modules.length} Modules)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('social')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                    activeTab === 'social'
                      ? 'border-[#d4af37] text-[#d4af37]'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                  <span>Facebook, YouTube & LinkedIn Social Kit</span>
                </button>
              </div>

              {/* Tab 1: Curriculum & Video Preview */}
              {activeTab === 'curriculum' && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-white dark:bg-[#112240] border border-slate-200 dark:border-[#1e3557]">
                    <div className="md:w-1/3 aspect-video bg-black rounded-lg overflow-hidden shrink-0 shadow-inner">
                      <iframe
                        src={convertedCourse.embedUrl}
                        title={convertedCourse.title}
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    </div>
                    <div className="md:w-2/3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                          {convertedCourse.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                          {convertedCourse.level}
                        </span>
                        <span className="text-xs font-extrabold text-[#f5c451]">
                          {formatNaira(convertedCourse.price)}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                        {convertedCourse.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {convertedCourse.description}
                      </p>
                    </div>
                  </div>

                  {/* Modules Accordion */}
                  <div className="space-y-3">
                    {convertedCourse.modules.map((mod, i) => (
                      <div
                        key={mod.id}
                        className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0a192f] border border-slate-200 dark:border-[#233554] space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                          <span>{mod.title}</span>
                          <span className="text-[11px] text-[#f5c451]">{mod.durationMinutes} mins</span>
                        </div>
                        <ul className="space-y-1.5 pt-1">
                          {mod.lectures.map((lec) => (
                            <li
                              key={lec.id}
                              className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between pl-3 border-l-2 border-[#d4af37]/60"
                            >
                              <div className="flex items-center gap-2">
                                <Play className="w-3 h-3 text-[#d4af37]" />
                                <span>{lec.title}</span>
                                {lec.isPreview && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-emerald-900/60 text-emerald-300 rounded font-semibold">
                                    Free Preview
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] tabular-nums text-slate-500">
                                {lec.durationMinutes}m
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Marketing & Social Kit */}
              {activeTab === 'social' && (
                <div className="space-y-4">
                  {/* Facebook Copy */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#112240] border border-slate-200 dark:border-[#1e3557] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-400">Facebook Page & Group Copy</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(convertedCourse.marketingAssets.facebookPost, 'fb')}
                        className="p-1.5 text-xs text-slate-300 hover:text-white bg-[#0a192f] rounded inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === 'fb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'fb' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans bg-slate-50 dark:bg-[#0a192f] p-3 rounded-lg border border-slate-200 dark:border-[#233554]">
                      {convertedCourse.marketingAssets.facebookPost}
                    </pre>
                  </div>

                  {/* LinkedIn Copy */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#112240] border border-slate-200 dark:border-[#1e3557] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400">LinkedIn Authority Article / Post</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(convertedCourse.marketingAssets.linkedInPost, 'li')}
                        className="p-1.5 text-xs text-slate-300 hover:text-white bg-[#0a192f] rounded inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === 'li' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'li' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans bg-slate-50 dark:bg-[#0a192f] p-3 rounded-lg border border-slate-200 dark:border-[#233554]">
                      {convertedCourse.marketingAssets.linkedInPost}
                    </pre>
                  </div>

                  {/* YouTube SEO Metadata */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#112240] border border-slate-200 dark:border-[#1e3557] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-400">YouTube SEO Title, Description & Timestamps</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            `${convertedCourse.marketingAssets.youtubeMetadata.seoTitle}\n\n${convertedCourse.marketingAssets.youtubeMetadata.description}`,
                            'yt'
                          )
                        }
                        className="p-1.5 text-xs text-slate-300 hover:text-white bg-[#0a192f] rounded inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === 'yt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'yt' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans bg-slate-50 dark:bg-[#0a192f] p-3 rounded-lg border border-slate-200 dark:border-[#233554]">
                      {convertedCourse.marketingAssets.youtubeMetadata.seoTitle}
                      {'\n\n'}
                      {convertedCourse.marketingAssets.youtubeMetadata.description}
                    </pre>
                  </div>
                </div>
              )}

              {/* Action Save CTA */}
              <div className="pt-3 border-t border-slate-200 dark:border-[#1e3557] flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Will be saved with status <strong className="text-amber-400">Draft</strong> for your review.
                </p>
                <button
                  type="button"
                  onClick={handleSaveCourse}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg inline-flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save as Draft Course in 1-Click</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
