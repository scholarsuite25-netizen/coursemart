import type { BlogSection } from '../types/marketplace';

export interface MediaLibraryAsset {
  id: string;
  label: string;
  category: string;
  url: string;
}

export const MEDIA_LIBRARY_ASSETS: MediaLibraryAsset[] = [
  {
    id: 'media-ai-vibe',
    label: 'AI & Vibe Coding Studio',
    category: 'AI / Vibe Coding',
    url: '/src/assets/images/blog_ai_vibe_coding_1794925522372.jpg',
  },
  {
    id: 'media-arch-desk',
    label: 'Architecture & Code Diagram Desk',
    category: 'Engineering',
    url: '/src/assets/images/blog_inline_architecture_1794932926034.jpg',
  },
  {
    id: 'media-mentorship',
    label: 'Mentor & Engineer Whiteboard',
    category: 'Mentorship',
    url: '/src/assets/images/blog_inline_team_mentorship_1794932927655.jpg',
  },
  {
    id: 'media-leadership',
    label: 'Leadership Strategy Session',
    category: 'Leadership',
    url: '/src/assets/images/blog_leadership_mentorship_1794925522598.jpg',
  },
  {
    id: 'media-deployment',
    label: 'Apps Deployment Pipeline',
    category: 'Apps Deployment',
    url: '/src/assets/images/blog_apps_deployment_1794925519743.jpg',
  },
  {
    id: 'media-prompt-pack',
    label: 'Prompt Engineering Handbook',
    category: 'Digital Products',
    url: '/src/assets/images/digital_prompt_pack_cover_1794925520575.jpg',
  },
  {
    id: 'media-templates',
    label: 'Templates & Architecture Cards',
    category: 'Digital Products',
    url: '/src/assets/images/digital_templates_toolkit_cover_1794925521980.jpg',
  },
  {
    id: 'media-cloud-ui',
    label: 'CloudOps Dashboard Screen',
    category: 'Apps Deployment',
    url: '/src/assets/images/showcase_cloud_ops_1794932925707.jpg',
  },
  {
    id: 'media-ai-ui',
    label: 'AI Workflow Studio UI',
    category: 'AI',
    url: '/src/assets/images/showcase_ai_workspace_1794932924628.jpg',
  },
];

export function calculateArticleWordCount(sections: BlogSection[], excerpt: string = ''): number {
  const tokens: string[] = [];
  if (excerpt.trim()) tokens.push(excerpt.trim());
  for (const s of sections) {
    if (s.heading.trim()) tokens.push(s.heading.trim());
    if (s.body.trim()) tokens.push(s.body.trim());
    if (s.pullQuote?.trim()) tokens.push(s.pullQuote.trim());
    if (s.checklistItems?.length) tokens.push(s.checklistItems.join(' '));
  }
  const joined = tokens.join(' ').trim();
  if (!joined) return 0;
  return joined.split(/\s+/).filter(Boolean).length;
}

export function calculateReadTimeMinutes(wordCount: number): number {
  if (wordCount <= 0) return 1;
  return Math.max(1, Math.ceil(wordCount / 210));
}

export interface SeoAuditResult {
  score: number;
  checks: Array<{ label: string; passed: boolean; hint: string }>;
}

export function runBlogSeoAudit(post: {
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  excerpt: string;
  coverImage: string;
  sections: BlogSection[];
  focusKeyword?: string;
}): SeoAuditResult {
  const titleLen = (post.seoTitle?.trim() || post.title.trim()).length;
  const descLen = (post.seoDescription?.trim() || post.excerpt.trim()).length;
  const wordCount = calculateArticleWordCount(post.sections, post.excerpt);
  const hasInlineImage = post.sections.some((s) => Boolean(s.imageUrl?.trim()));
  const kw = post.focusKeyword?.trim().toLowerCase() ?? '';
  const kwPresent =
    !kw ||
    post.title.toLowerCase().includes(kw) ||
    post.sections.some((s) => s.body.toLowerCase().includes(kw));

  const checks = [
    {
      label: 'Title length (25–75 chars)',
      passed: titleLen >= 25 && titleLen <= 75,
      hint: `Currently ${titleLen} chars`,
    },
    {
      label: 'Meta description (70–160 chars)',
      passed: descLen >= 70 && descLen <= 165,
      hint: `Currently ${descLen} chars`,
    },
    {
      label: 'Featured cover image set',
      passed: Boolean(post.coverImage.trim()),
      hint: post.coverImage.trim() ? 'Cover ready' : 'Missing cover image',
    },
    {
      label: 'Inline body image included',
      passed: hasInlineImage,
      hint: hasInlineImage ? 'Inline visual active' : 'Add at least 1 body image block',
    },
    {
      label: 'Editorial depth (150+ words)',
      passed: wordCount >= 150,
      hint: `${wordCount} words`,
    },
    {
      label: 'Focus keyword coverage',
      passed: kwPresent,
      hint: kw ? `Keyword "${kw}"` : 'Optional keyword clear',
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  return {
    score: Math.round((passedCount / checks.length) * 100),
    checks,
  };
}

export function applyInlineMarkdownToken(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string = prefix,
  placeholder: string = 'highlighted text'
): { nextText: string; nextCursor: number } {
  const safeStart = Math.max(0, Math.min(selectionStart, text.length));
  const safeEnd = Math.max(safeStart, Math.min(selectionEnd, text.length));
  const selected = text.slice(safeStart, safeEnd) || placeholder;
  const before = text.slice(0, safeStart);
  const after = text.slice(safeEnd);
  const inserted = `${prefix}${selected}${suffix}`;
  return {
    nextText: `${before}${inserted}${after}`,
    nextCursor: before.length + inserted.length,
  };
}
