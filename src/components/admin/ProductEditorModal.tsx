import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  INSTRUCTOR_AVATAR,
  TEMPLATES_TOOLKIT_COVER,
} from '../../data/seedData';
import type {
  CourseModule,
  DifficultyLevel,
  DigitalProductVariant,
  DigitalResourceSubType,
  EbookChapter,
  MembershipTierId,
  Product,
  ProductStatus,
  ProductType,
} from '../../types/marketplace';
import { ALL_PRODUCT_TOPICS, DIGITAL_SUBMENU_ITEMS } from '../../utils/catalogAndBlogs';

interface ProductEditorModalProps {
  initialProduct: Product | null;
  instructorName: string;
  instructorId: string;
  onSave: (product: Product) => void;
  onClose: () => void;
}

const DEFAULT_THUMBNAILS: Record<ProductType, string> = {
  course: '/src/assets/images/course_fullstack_architecture_1794890415282.jpg',
  ebook: '/src/assets/images/ebook_typescript_handbook_1794890416886.jpg',
  software: '/src/assets/images/software_ui_kit_1794890416149.jpg',
};

export function ProductEditorModal({
  initialProduct,
  instructorName,
  instructorId,
  onSave,
  onClose,
}: ProductEditorModalProps) {
  const [title, setTitle] = useState(initialProduct?.title ?? '');
  const [subtitle, setSubtitle] = useState(initialProduct?.subtitle ?? '');
  const [description, setDescription] = useState(initialProduct?.description ?? '');
  const [type, setType] = useState<ProductType>(initialProduct?.type ?? 'course');
  const [digitalSubType, setDigitalSubType] = useState<DigitalResourceSubType>(
    initialProduct?.digitalSubType ?? 'ebook'
  );
  const [category, setCategory] = useState(initialProduct?.category ?? 'AI');
  const [price, setPrice] = useState(String(initialProduct?.price ?? 45000));
  const [originalPrice, setOriginalPrice] = useState(
    String(initialProduct?.originalPrice ?? 90000)
  );
  const [level, setLevel] = useState<DifficultyLevel>(initialProduct?.level ?? 'Intermediate');
  const [status, setStatus] = useState<ProductStatus>(initialProduct?.status ?? 'published');
  const [featured, setFeatured] = useState(initialProduct?.featured ?? false);
  const [includedInMembershipTier, setIncludedInMembershipTier] = useState<MembershipTierId | ''>(
    initialProduct?.includedInMembershipTier ?? ''
  );
  const [variants, setVariants] = useState<DigitalProductVariant[]>(
    initialProduct?.variants ?? []
  );
  const [outcomesText, setOutcomesText] = useState(
    initialProduct?.learningOutcomes.join('\n') ??
      'Master production-grade architecture patterns\nApply clean domain boundaries'
  );
  const [resourceFormat, setResourceFormat] = useState(
    initialProduct?.digitalResourceMeta?.deliverableFormat ?? 'Notion + Markdown + JSON Pack'
  );
  const [resourceCompat, setResourceCompat] = useState(
    initialProduct?.digitalResourceMeta?.compatibility ?? 'Notion, Cursor, Claude, GitHub, VS Code'
  );
  const [resourceAssetsText, setResourceAssetsText] = useState(
    initialProduct?.digitalResourceMeta?.includedAssets.join('\n') ??
      'Structured template files\nStep-by-step quickstart README'
  );

  // Course modules
  const [modules, setModules] = useState<CourseModule[]>(
    initialProduct?.courseData?.modules ?? [
      {
        id: `mod-${Date.now()}`,
        title: 'Module 1: Core Foundations',
        lectures: [
          {
            id: `lec-${Date.now()}`,
            title: '1.1 Architecture Walkthrough',
            durationMinutes: 15,
            isPreview: true,
            summary: 'Overview of project structure and primary design constraints.',
            keyTakeaways: ['Module boundaries', 'Clean contracts'],
          },
        ],
      },
    ]
  );

  // eBook chapters
  const [ebookPages, setEbookPages] = useState(
    String(initialProduct?.ebookData?.pages ?? 240)
  );
  const [chapters, setChapters] = useState<EbookChapter[]>(
    initialProduct?.ebookData?.chapters ?? [
      {
        id: `ch-${Date.now()}`,
        number: 1,
        title: 'Foundational Principles',
        pages: 42,
        previewExcerpt:
          'Every durable codebase begins with explicit boundaries between domain rules and external I/O adapters.',
      },
    ]
  );

  // Software metadata
  const [swVersion, setSwVersion] = useState(initialProduct?.softwareData?.version ?? '1.0.0');
  const [swPlatforms, setSwPlatforms] = useState(
    initialProduct?.softwareData?.platforms.join(', ') ?? 'macOS, Windows, Linux'
  );

  const [error, setError] = useState<string | null>(null);

  const handleAddModule = () => {
    setModules((prev) => [
      ...prev,
      {
        id: `mod-${Date.now()}`,
        title: `Module ${prev.length + 1}: New Section`,
        lectures: [
          {
            id: `lec-${Date.now()}`,
            title: `${prev.length + 1}.1 New Lecture`,
            durationMinutes: 12,
            isPreview: false,
            summary: 'Structured lecture module.',
            keyTakeaways: ['Core takeaway'],
          },
        ],
      },
    ]);
  };

  const handleAddLecture = (moduleIdx: number) => {
    setModules((prev) =>
      prev.map((m, i) =>
        i === moduleIdx
          ? {
              ...m,
              lectures: [
                ...m.lectures,
                {
                  id: `lec-${Date.now()}-${m.lectures.length}`,
                  title: `${moduleIdx + 1}.${m.lectures.length + 1} Lesson Title`,
                  durationMinutes: 15,
                  isPreview: false,
                  summary: 'Detailed walkthrough lesson.',
                  keyTakeaways: ['Practical takeaway'],
                },
              ],
            }
          : m
      )
    );
  };

  const handleToggleModuleQuiz = (moduleIdx: number) => {
    setModules((prev) =>
      prev.map((m, i) => {
        if (i !== moduleIdx) return m;
        if (m.quiz) {
          return { ...m, quiz: undefined };
        }
        return {
          ...m,
          quiz: {
            id: `quiz-${Date.now()}-${moduleIdx}`,
            title: `${m.title} Checkpoint`,
            passingScore: 70,
            questions: [
              {
                id: `q-${Date.now()}`,
                prompt: 'What is the primary architectural takeaway from this module?',
                options: [
                  'Enforce clear module boundaries and validation contracts',
                  'Skip automated checks before deployment',
                  'Couple UI markup directly to database queries',
                ],
                correctIndex: 0,
                explanation: 'Clear domain boundaries and validation contracts keep systems maintainable.',
              },
            ],
          },
        };
      })
    );
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}`,
        name: prev.length === 0 ? 'Personal Standard Edition' : `Team / Extended Edition ${prev.length + 1}`,
        sku: `CM-DIG-${Math.floor(100 + Math.random() * 900)}`,
        format: 'PDF + Source Archive',
        priceDelta: prev.length === 0 ? 0 : 25000,
        licenseType: prev.length === 0 ? 'Personal' : 'Team',
        downloadLimit: prev.length === 0 ? 15 : 50,
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError('Product title must be at least 3 characters.');
      return;
    }
    const parsedPrice = Number(price);
    const parsedOriginal = Number(originalPrice);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Enter a valid non-negative price.');
      return;
    }

    const slug =
      initialProduct?.slug ??
      `${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const totalHours =
      Math.round(
        (modules.reduce(
          (sum, m) => sum + m.lectures.reduce((ls, l) => ls + l.durationMinutes, 0),
          0
        ) /
          60) *
          10
      ) / 10 || 4.5;

    const resolvedDigitalSub = type === 'ebook' ? digitalSubType : undefined;

    const formatLabel =
      type === 'course'
        ? `${totalHours} Hours Video`
        : type === 'ebook'
        ? resolvedDigitalSub === 'template'
          ? `Template · ${resourceFormat}`
          : resolvedDigitalSub === 'toolkit'
          ? `Toolkit · ${resourceFormat}`
          : `${ebookPages || 200} Pages · PDF / EPUB`
        : `v${swVersion} ZIP + License`;

    const resolvedThumbnail =
      initialProduct?.thumbnail ??
      (type === 'ebook' &&
      (resolvedDigitalSub === 'template' || resolvedDigitalSub === 'toolkit')
        ? TEMPLATES_TOOLKIT_COVER
        : DEFAULT_THUMBNAILS[type]);

    const builtProduct: Product = {
      id: initialProduct?.id ?? `prod-${Date.now()}`,
      slug,
      title: title.trim(),
      subtitle: subtitle.trim() || 'Comprehensive digital release ready for immediate access.',
      description:
        description.trim() ||
        'Built for practitioners seeking clean production patterns and immediate hands-on execution.',
      type,
      digitalSubType: resolvedDigitalSub,
      category,
      instructorId: initialProduct?.instructorId ?? instructorId,
      instructorName: initialProduct?.instructorName ?? instructorName,
      instructorRole: initialProduct?.instructorRole ?? 'Senior Educator & Creator',
      instructorAvatar: initialProduct?.instructorAvatar ?? INSTRUCTOR_AVATAR,
      price: parsedPrice,
      originalPrice: Number.isNaN(parsedOriginal) ? parsedPrice : Math.max(parsedPrice, parsedOriginal),
      rating: initialProduct?.rating ?? 4.8,
      reviewCount: initialProduct?.reviewCount ?? 12,
      studentsCount: initialProduct?.studentsCount ?? 1,
      thumbnail: resolvedThumbnail,
      level,
      language: initialProduct?.language ?? 'English',
      updatedAt: new Date().toISOString().slice(0, 10),
      status,
      featured,
      bestseller: initialProduct?.bestseller ?? false,
      formatLabel,
      includedInMembershipTier: includedInMembershipTier || undefined,
      variants: type === 'ebook' && variants.length > 0 ? variants : undefined,
      bundleProductIds: initialProduct?.bundleProductIds,
      downloadLimit:
        type === 'ebook' && variants.length > 0
          ? variants[0].downloadLimit
          : initialProduct?.downloadLimit,
      galleryImages: initialProduct?.galleryImages,
      targetAudience: initialProduct?.targetAudience,
      learningOutcomes: outcomesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      requirements: initialProduct?.requirements ?? ['No special prerequisites required'],
      courseData:
        type === 'course'
          ? {
              totalHours,
              modules,
              announcements: initialProduct?.courseData?.announcements,
              promoHighlights: initialProduct?.courseData?.promoHighlights,
            }
          : undefined,
      ebookData:
        type === 'ebook' && resolvedDigitalSub === 'ebook'
          ? {
              pages: Number(ebookPages) || 200,
              formats: ['PDF', 'EPUB', 'MOBI'],
              isbn: initialProduct?.ebookData?.isbn ?? '978-1-958204-99-5',
              fileSize: initialProduct?.ebookData?.fileSize ?? '14.2 MB',
              chapters,
            }
          : undefined,
      digitalResourceMeta:
        type === 'ebook' && resolvedDigitalSub !== 'ebook'
          ? {
              deliverableFormat: resourceFormat.trim() || 'ZIP + Markdown',
              itemsCountLabel:
                initialProduct?.digitalResourceMeta?.itemsCountLabel ??
                `${resourceAssetsText.split('\n').filter((s) => s.trim()).length || 4} Included Assets`,
              compatibility: resourceCompat.trim() || 'Cross-platform',
              includedAssets: resourceAssetsText
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
            }
          : undefined,
      softwareData:
        type === 'software'
          ? {
              version: swVersion || '1.0.0',
              platforms: swPlatforms
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
              fileSize: initialProduct?.softwareData?.fileSize ?? '32.0 MB (.zip)',
              licenseTiers: initialProduct?.softwareData?.licenseTiers ?? [
                {
                  id: `tier-solo-${Date.now()}`,
                  name: 'Personal Solo License',
                  seats: 1,
                  priceMultiplier: 1,
                  description: '1 production domain · Lifetime point updates',
                },
                {
                  id: `tier-team-${Date.now()}`,
                  name: 'Team License',
                  seats: 5,
                  priceMultiplier: 1.8,
                  description: 'Up to 5 production domains · Priority support',
                },
              ],
              releases: initialProduct?.softwareData?.releases ?? [
                {
                  version: swVersion || '1.0.0',
                  date: new Date().toISOString().slice(0, 10),
                  highlights: ['Initial production release with license key activation'],
                },
              ],
            }
          : undefined,
    };

    onSave(builtProduct);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initialProduct ? 'Edit product' : 'Create new product'}
    >
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="font-display text-lg font-bold text-slate-900">
            {initialProduct ? `Edit: ${initialProduct.title}` : 'Add New Digital Product'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product editor"
            className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="prod-title" className="block text-xs font-bold text-slate-700 mb-1">
                Product Title
              </label>
              <input
                id="prod-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Modern React Performance Engineering"
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="prod-subtitle" className="block text-xs font-bold text-slate-700 mb-1">
                Short Subtitle
              </label>
              <input
                id="prod-subtitle"
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Concise value proposition shown on cards and hero..."
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="prod-type" className="block text-xs font-bold text-slate-700 mb-1">
                Product Type
              </label>
              <select
                id="prod-type"
                value={type}
                onChange={(e) => setType(e.target.value as ProductType)}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md bg-white"
              >
                <option value="course">Video Training Course</option>
                <option value="ebook">Digital Product (eBook, Template, Toolkit)</option>
                <option value="software">Software Package + License Keys</option>
              </select>
            </div>

            {type === 'ebook' && (
              <div>
                <label htmlFor="prod-digital-subtype" className="block text-xs font-bold text-slate-700 mb-1">
                  Digital Resource Subtype
                </label>
                <select
                  id="prod-digital-subtype"
                  value={digitalSubType}
                  onChange={(e) => setDigitalSubType(e.target.value as DigitalResourceSubType)}
                  className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md bg-white"
                >
                  {DIGITAL_SUBMENU_ITEMS.map((item) => (
                    <option key={item.subType} value={item.subType}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="prod-category" className="block text-xs font-bold text-slate-700 mb-1">
                Topic / Category
              </label>
              <select
                id="prod-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md bg-white"
              >
                {Array.from(new Set([...ALL_PRODUCT_TOPICS, category])).map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prod-price" className="block text-xs font-bold text-slate-700 mb-1">
                Sale Price (₦)
              </label>
              <input
                id="prod-price"
                type="number"
                step="100"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full h-10 px-3 text-sm tabular-nums border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="prod-orig-price" className="block text-xs font-bold text-slate-700 mb-1">
                Original List Price (₦)
              </label>
              <input
                id="prod-orig-price"
                type="number"
                step="100"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full h-10 px-3 text-sm tabular-nums border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="prod-level" className="block text-xs font-bold text-slate-700 mb-1">
                Difficulty / Scope
              </label>
              <select
                id="prod-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as DifficultyLevel)}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md bg-white"
              >
                <option value="All Levels">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label htmlFor="prod-status" className="block text-xs font-bold text-slate-700 mb-1">
                Publication Status
              </label>
              <select
                id="prod-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md bg-white"
              >
                <option value="published">Published (Live on Storefront)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>

            <div>
              <label htmlFor="prod-membership-tier" className="block text-xs font-bold text-slate-700 mb-1">
                Membership Access Tier
              </label>
              <select
                id="prod-membership-tier"
                value={includedInMembershipTier}
                onChange={(e) =>
                  setIncludedInMembershipTier(e.target.value as MembershipTierId | '')
                }
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md bg-white"
              >
                <option value="">Not Included (One-Time Purchase)</option>
                <option value="starter">Included in Starter Member & Higher</option>
                <option value="pro">Included in Pro Builder & Higher</option>
                <option value="vip">Included in VIP Executive Only</option>
              </select>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="accent-[#2271b1]"
            />
            <span>Feature on Storefront Homepage</span>
          </label>

          <div>
            <label htmlFor="prod-desc" className="block text-xs font-bold text-slate-700 mb-1">
              Full Description
            </label>
            <textarea
              id="prod-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-sm border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="prod-outcomes" className="block text-xs font-bold text-slate-700 mb-1">
              Key Learning Outcomes / Features (one per line)
            </label>
            <textarea
              id="prod-outcomes"
              rows={3}
              value={outcomesText}
              onChange={(e) => setOutcomesText(e.target.value)}
              className="w-full p-3 text-sm border border-slate-300 rounded-md"
            />
          </div>

          {/* Course Curriculum Builder */}
          {type === 'course' && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Curriculum Modules & Lectures
                </h3>
                <button
                  type="button"
                  onClick={handleAddModule}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Module</span>
                </button>
              </div>
              {modules.map((mod, mIdx) => (
                <div key={mod.id} className="bg-white border border-slate-200 rounded p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) =>
                        setModules((prev) =>
                          prev.map((m, i) => (i === mIdx ? { ...m, title: e.target.value } : m))
                        )
                      }
                      aria-label={`Module ${mIdx + 1} title`}
                      className="flex-1 h-8 px-2.5 text-xs font-bold border border-slate-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddLecture(mIdx)}
                      className="px-2.5 h-8 text-xs font-semibold text-[#2271b1] border border-[#2271b1] rounded hover:bg-blue-50 cursor-pointer"
                    >
                      + Lecture
                    </button>
                    {modules.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setModules((prev) => prev.filter((_, i) => i !== mIdx))
                        }
                        aria-label="Remove module"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 pl-3">
                    {mod.lectures.map((lec, lIdx) => (
                      <div key={lec.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={lec.title}
                          onChange={(e) =>
                            setModules((prev) =>
                              prev.map((m, i) =>
                                i === mIdx
                                  ? {
                                      ...m,
                                      lectures: m.lectures.map((l, j) =>
                                        j === lIdx ? { ...l, title: e.target.value } : l
                                      ),
                                    }
                                  : m
                              )
                            )
                          }
                          aria-label={`Lecture ${lIdx + 1} title`}
                          className="flex-1 h-8 px-2.5 text-xs border border-slate-200 rounded"
                        />
                        <input
                          type="number"
                          value={lec.durationMinutes}
                          onChange={(e) =>
                            setModules((prev) =>
                              prev.map((m, i) =>
                                i === mIdx
                                  ? {
                                      ...m,
                                      lectures: m.lectures.map((l, j) =>
                                        j === lIdx
                                          ? { ...l, durationMinutes: Number(e.target.value) || 5 }
                                          : l
                                      ),
                                    }
                                  : m
                              )
                            )
                          }
                          aria-label="Lecture minutes"
                          className="w-16 h-8 px-2 text-xs tabular-nums border border-slate-200 rounded"
                        />
                        <span className="text-[11px] text-slate-500">min</span>
                      </div>
                    ))}
                  </div>

                  {/* Optional Graded Module Quiz */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600">
                        {mod.quiz
                          ? `Module Quiz: ${mod.quiz.questions.length} question(s) · Pass ${mod.quiz.passingScore}%`
                          : 'No assessment quiz attached'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleModuleQuiz(mIdx)}
                        className="text-[11px] font-bold text-[#2271b1] hover:underline cursor-pointer"
                      >
                        {mod.quiz ? 'Remove Quiz' : '+ Attach Graded Quiz'}
                      </button>
                    </div>
                    {mod.quiz && mod.quiz.questions[0] && (
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-2">
                        <input
                          type="text"
                          value={mod.quiz.title}
                          onChange={(e) =>
                            setModules((prev) =>
                              prev.map((m, i) =>
                                i === mIdx && m.quiz
                                  ? { ...m, quiz: { ...m.quiz, title: e.target.value } }
                                  : m
                              )
                            )
                          }
                          placeholder="Quiz title"
                          className="w-full h-8 px-2.5 text-xs font-bold bg-white border border-slate-200 rounded"
                        />
                        <input
                          type="text"
                          value={mod.quiz.questions[0].prompt}
                          onChange={(e) =>
                            setModules((prev) =>
                              prev.map((m, i) =>
                                i === mIdx && m.quiz
                                  ? {
                                      ...m,
                                      quiz: {
                                        ...m.quiz,
                                        questions: m.quiz.questions.map((q, qi) =>
                                          qi === 0 ? { ...q, prompt: e.target.value } : q
                                        ),
                                      },
                                    }
                                  : m
                              )
                            )
                          }
                          placeholder="First quiz question prompt"
                          className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* eBook Specific Fields */}
          {type === 'ebook' && digitalSubType === 'ebook' && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  eBook Specifications & Chapters
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setChapters((prev) => [
                      ...prev,
                      {
                        id: `ch-${Date.now()}`,
                        number: prev.length + 1,
                        title: `Chapter ${prev.length + 1}`,
                        pages: 30,
                        previewExcerpt: 'Chapter preview excerpt text...',
                      },
                    ])
                  }
                  className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded cursor-pointer"
                >
                  + Add Chapter
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Pages</label>
                <input
                  type="number"
                  value={ebookPages}
                  onChange={(e) => setEbookPages(e.target.value)}
                  className="w-32 h-9 px-3 text-xs tabular-nums bg-white border border-slate-300 rounded"
                />
              </div>
              <div className="space-y-2">
                {chapters.map((ch, idx) => (
                  <div key={ch.id} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                    <span className="text-xs font-mono text-slate-500 px-1">#{ch.number}</span>
                    <input
                      type="text"
                      value={ch.title}
                      onChange={(e) =>
                        setChapters((prev) =>
                          prev.map((c, i) => (i === idx ? { ...c, title: e.target.value } : c))
                        )
                      }
                      className="flex-1 h-8 px-2 text-xs border border-slate-200 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Templates / Toolkits Specific Fields */}
          {type === 'ebook' && digitalSubType !== 'ebook' && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Resource Pack Specifications ({digitalSubType})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deliverable Format
                  </label>
                  <input
                    type="text"
                    value={resourceFormat}
                    onChange={(e) => setResourceFormat(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Compatibility
                  </label>
                  <input
                    type="text"
                    value={resourceCompat}
                    onChange={(e) => setResourceCompat(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Included Assets (one per line)
                </label>
                <textarea
                  rows={3}
                  value={resourceAssetsText}
                  onChange={(e) => setResourceAssetsText(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded"
                />
              </div>
            </div>
          )}

          {/* Digital Product Editions / Variants (SKU, Price Delta, Download Limit) */}
          {type === 'ebook' && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Digital Editions & License Variants
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure Personal, Team, or Agency SKUs with download quotas and pricing deltas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded cursor-pointer"
                >
                  + Add Edition
                </button>
              </div>
              {variants.length > 0 && (
                <div className="space-y-2">
                  {variants.map((v, vIdx) => (
                    <div
                      key={v.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-2.5 rounded border border-slate-200 items-center"
                    >
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((item, idx) =>
                              idx === vIdx ? { ...item, name: e.target.value } : item
                            )
                          )
                        }
                        placeholder="Edition name"
                        className="sm:col-span-4 h-8 px-2 text-xs border border-slate-200 rounded"
                      />
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((item, idx) =>
                              idx === vIdx ? { ...item, sku: e.target.value.toUpperCase() } : item
                            )
                          )
                        }
                        placeholder="SKU"
                        className="sm:col-span-3 h-8 px-2 text-xs font-mono border border-slate-200 rounded"
                      />
                      <input
                        type="number"
                        step="1"
                        value={v.priceDelta}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((item, idx) =>
                              idx === vIdx ? { ...item, priceDelta: Number(e.target.value) || 0 } : item
                            )
                          )
                        }
                        placeholder="+₦ delta"
                        title="Price delta (₦)"
                        className="sm:col-span-2 h-8 px-2 text-xs tabular-nums border border-slate-200 rounded"
                      />
                      <input
                        type="number"
                        min={1}
                        value={v.downloadLimit}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((item, idx) =>
                              idx === vIdx
                                ? { ...item, downloadLimit: Math.max(1, Number(e.target.value) || 10) }
                                : item
                            )
                          )
                        }
                        title="Max downloads"
                        className="sm:col-span-2 h-8 px-2 text-xs tabular-nums border border-slate-200 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== vIdx))}
                        aria-label={`Remove variant ${v.name}`}
                        className="sm:col-span-1 p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer justify-self-end"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Software Specific Fields */}
          {type === 'software' && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Package Version
                </label>
                <input
                  type="text"
                  value={swVersion}
                  onChange={(e) => setSwVersion(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-mono bg-white border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supported Platforms (comma-separated)
                </label>
                <input
                  type="text"
                  value={swPlatforms}
                  onChange={(e) => setSwPlatforms(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded">
              {error}
            </p>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-md cursor-pointer"
            >
              {initialProduct ? 'Save Changes' : 'Publish Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
