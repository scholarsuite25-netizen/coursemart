import type {
  DocumentTutorial,
  TutorialStep,
  VideoNarratorConfig,
  VideoScene,
} from '../types/tutorial';
import { repurposeYouTubeToCourse } from './youtubeRepurposer';
import { parseYouTubeVideoId } from './youtubeRepurposer';

/**
 * Escapes special XML / HTML characters to prevent XSS.
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Exports a tutorial into formatted Markdown with YAML frontmatter.
 */
export function formatTutorialAsMarkdown(tutorial: DocumentTutorial): string {
  const frontmatter = [
    '---',
    `title: "${(tutorial.title || '').replace(/"/g, '\\"')}"`,
    `author: "${(tutorial.authorName || '').replace(/"/g, '\\"')}"`,
    `difficulty: "${tutorial.difficulty || 'beginner'}"`,
    `tags: [${(tutorial.tags || []).map((t) => `"${t.replace(/"/g, '\\"')}"`).join(', ')}]`,
    '---',
    '',
    `# ${tutorial.title}`,
    '',
    tutorial.description || '',
    '',
  ].join('\n');

  const stepBlocks = (tutorial.steps || []).map((step) => {
    const parts: string[] = [`## Step ${step.stepNumber}: ${step.title}`, ''];
    if (step.description) {
      parts.push(step.description, '');
    } else if (step.content) {
      parts.push(step.content, '');
    }
    if (step.codeSnippet) {
      parts.push(`\`\`\`${step.codeLanguage || 'ts'}\n${step.codeSnippet}\n\`\`\``, '');
    }
    if (step.calloutNote) {
      parts.push(`> **${step.calloutType || 'Note'}**: ${step.calloutNote}`, '');
    }
    if (Array.isArray(step.checklist) && step.checklist.length > 0) {
      parts.push(...step.checklist.map((item) => `- [ ] ${item}`), '');
    }
    return parts.join('\n');
  });

  return frontmatter + (stepBlocks.length > 0 ? stepBlocks.join('\n') : '');
}

/**
 * Exports a tutorial into a standalone, styled HTML5 document with print stylesheets.
 */
export function formatTutorialAsHtml(tutorial: DocumentTutorial): string {
  const safeTitle = escapeHtml(tutorial.title);
  const safeAuthor = escapeHtml(tutorial.authorName);
  const safeDesc = escapeHtml(tutorial.description);

  const stepsHtml = (tutorial.steps || [])
    .map((step) => {
      const stepTitle = escapeHtml(step.title);
      const stepDesc = escapeHtml(step.description || step.content || '');
      let codeHtml = '';
      if (step.codeSnippet) {
        codeHtml = `      <pre><code>${escapeHtml(step.codeSnippet)}</code></pre>\n`;
      }
      let calloutHtml = '';
      if (step.calloutNote) {
        calloutHtml = `      <div class="callout callout-${escapeHtml(step.calloutType || 'info')}"><p><strong>${escapeHtml(step.calloutType || 'Note')}:</strong> ${escapeHtml(step.calloutNote)}</p></div>\n`;
      }
      let checklistHtml = '';
      if (Array.isArray(step.checklist) && step.checklist.length > 0) {
        const items = step.checklist.map((item) => `        <li><label><input type="checkbox" disabled /> ${escapeHtml(item)}</label></li>`).join('\n');
        checklistHtml = `      <ul class="checklist">\n${items}\n      </ul>\n`;
      }

      return `    <section class="tutorial-step" id="step-${step.stepNumber}">\n      <h2>Step ${step.stepNumber}: ${stepTitle}</h2>\n      <p>${stepDesc}</p>\n${codeHtml}${calloutHtml}${checklistHtml}    </section>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: #f8fafc;
      margin: 0;
      padding: 2rem;
    }
    .tutorial-document {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    h1 { color: #0f172a; font-size: 2.25rem; margin-top: 0; }
    h2 { color: #1e293b; font-size: 1.5rem; margin-top: 2rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    .author { color: #64748b; font-size: 0.95rem; font-weight: 500; }
    .description { font-size: 1.1rem; color: #334155; margin-bottom: 2rem; }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 1.25rem;
      border-radius: 8px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9rem;
    }
    .callout {
      padding: 1rem 1.25rem;
      border-radius: 8px;
      margin: 1.5rem 0;
      border-left: 4px solid;
    }
    .callout-info { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
    .callout-tip { background: #f0fdf4; border-color: #22c55e; color: #166534; }
    .callout-warning { background: #fffbeb; border-color: #f59e0b; color: #92400e; }
    .callout-danger { background: #fef2f2; border-color: #ef4444; color: #991b1b; }
    .checklist { list-style: none; padding-left: 0; }
    .checklist li { margin-bottom: 0.5rem; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .tutorial-document { box-shadow: none; padding: 0; }
      .no-print { display: none; }
      pre { page-break-inside: avoid; }
      section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <article class="tutorial-document">
    <h1>${safeTitle}</h1>
    <p class="author">By ${safeAuthor}</p>
    <p class="description">${safeDesc}</p>
${stepsHtml}
  </article>
</body>
</html>`;
}

/**
 * Exports a tutorial into canonical formatted JSON.
 */
export function formatTutorialAsJson(tutorial: DocumentTutorial): string {
  return JSON.stringify(tutorial, null, 2);
}

/**
 * Generates an initialized tutorial draft with safe defaults.
 */
export function createLocalTutorialDraft(params: Partial<DocumentTutorial>): DocumentTutorial {
  const now = new Date().toISOString();
  const id = params.id || `tut_${Math.random().toString(36).slice(2, 10)}`;
  const title = params.title || 'Untitled Tutorial';
  const slug =
    params.slug ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const defaultSteps: TutorialStep[] =
    params.steps && params.steps.length > 0
      ? params.steps
      : [
          {
            stepNumber: 1,
            title: 'Getting Started',
            description: 'Initial setup and overview.',
            checklist: ['Verify requirements', 'Clone repository'],
          },
        ];

  return {
    id,
    slug,
    title,
    description: params.description || 'Step-by-step practical guide.',
    authorName: params.authorName || 'Lead Dev',
    authorRole: params.authorRole || 'Instructor',
    status: params.status || 'draft',
    difficulty: (params.difficulty ? String(params.difficulty).toLowerCase() : 'beginner') as any,
    tags: params.tags || ['General'],
    steps: defaultSteps,
    readTimeMinutes: params.readTimeMinutes || 10,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    ...(params.subtitle ? { subtitle: params.subtitle } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.coverImage ? { coverImage: params.coverImage } : {}),
    ...(params.seoTitle ? { seoTitle: params.seoTitle } : {}),
    ...(params.seoDescription ? { seoDescription: params.seoDescription } : {}),
  };
}

function deriveTutorialSlugFromUrl(url: string): string {
  const trimmed = url.trim();
  const match = trimmed.match(/^(?:https?:\/\/)?(?:www\.|m\.)?(?:[^/]+\.)?[^/?#]+\/([^?#]+)/);
  const path = match ? decodeURIComponent((match[1] || '').trim()) : '';
  const lastSeg = path.split('/').filter(Boolean).slice(-1)[0] || trimmed;
  return (
    lastSeg
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'tutorial'
  );
}

/**
 * Creates a DocumentTutorial from a URL.
 * - YouTube URLs → auto-generates from `repurposeYouTubeToCourse`
 *   (title, modules, notes, embed URL, tags, cover).
 * - Any other URL → a structured skeleton using the URL slug (modules from
 *   the page path when available) so the editor starts fully-filled.
 */
export function createTutorialFromUrl(
  url: string,
  opts?: { customTitle?: string; customDescription?: string }
): DocumentTutorial {
  const trimmed = (url || '').trim();
  const videoId = parseYouTubeVideoId(trimmed);

  if (videoId) {
    const pkg = repurposeYouTubeToCourse({
      youtubeUrl: trimmed,
      customTitle: opts?.customTitle || undefined,
    });

    const slug =
      pkg.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 80) || `video-${videoId}`;

    const pkgModules: TutorialStep[] = (pkg.modules || [])
      .filter((m: any) => Array.isArray(m?.lectures) && m.lectures.length > 0)
      .flatMap((m: any) => [{
        stepNumber: 1,
        title: `${m.title}`,
        description: `Video walkthrough of "${m.title}".`,
        codeSnippet: undefined,
        checklist: [],
        videoUrl: m.lectures[0]?.videoUrl,
      }]);

    return createLocalTutorialDraft({
      id: `tut_yt_${videoId}`,
      title: pkg.title || `YouTube Tutorial: ${videoId}`,
      slug: opts?.customTitle ? deriveTutorialSlugFromUrl(trimmed) : slug,
      subtitle: pkg.subtitle,
      description: opts?.customDescription || pkg.description || 'Step-by-step walkthrough video.',
      category: pkg.category || 'AI & Machine Learning',
      tags: [...pkg.marketingAssets?.youtubeMetadata?.tags || ['video', 'tutorial']],
      coverImage: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      readTimeMinutes: Math.max(10, Math.round(pkg.modules?.length || 1) * 8),
      steps: pkgModules.length > 0 ? pkgModules : [{
        stepNumber: 1,
        title: 'Video Overview',
        description: 'Watch the full video walkthrough.',
      }],
      status: 'draft',
      difficulty: 'beginner',
    });
  }

  // Non-YouTube URL: structured skeleton from the URL
  return createLocalTutorialDraft({
    title: opts?.customTitle || `Tutorial from ${trimmed.replace(/^https?:\/\//, '')}`.slice(0, 120),
    description: opts?.customDescription || `Guide built around ${trimmed}.`,
    slug: deriveTutorialSlugFromUrl(trimmed),
    tags: ['import'],
    status: 'draft',
    difficulty: 'beginner',
  });
}

/** True if the URL looks like it should become a tutorial. */
export function looksLikeTutorialUrl(url: string): boolean {
  const trimmed = (url || '').trim().toLowerCase();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('www.') ||
    trimmed.includes('/tutorial')
  );
}

/**
 * Compiles a tutorial into sequential video scenes with narration duration.
 */
export function compileVideoScenesFromTutorial(tutorial: DocumentTutorial): VideoScene[] {
  const scenes: VideoScene[] = [];
  let currentStart = 0;

  const steps = tutorial.steps || [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const narrationScript = step.description || step.content || '';
    const words = narrationScript ? narrationScript.trim().split(/\s+/).filter(Boolean).length : 0;
    const durationSeconds = Math.max(5, Math.ceil(words / 3));

    scenes.push({
      sceneIndex: i,
      sceneNumber: step.stepNumber,
      title: step.title,
      visualHeadline: step.title,
      narrationScript,
      startSeconds: currentStart,
      durationSeconds,
      codeSnippet: step.codeSnippet,
      calloutNote: step.calloutNote,
      layout: step.codeSnippet ? 'code-walkthrough' : 'summary',
    });

    currentStart += durationSeconds;
  }

  return scenes;
}

/**
 * Standard parameters for video narrator engine.
 */
export function getVideoNarratorConfig(): VideoNarratorConfig {
  return {
    width: 1280,
    height: 720,
    fps: 24,
    audioChannels: 2,
    mimeType: 'video/webm',
  };
}
