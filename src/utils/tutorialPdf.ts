import { escapeHtml } from './tutorialCreator.ts';
import type { DocumentTutorial } from '../types/tutorial';

/**
 * Generates a standalone, print-ready HTML document for a tutorial.
 * Callers can open it in a new tab and print to PDF, or serve it directly.
 */
export function generateTutorialPdfDocument(tutorial: DocumentTutorial): string {
  const safeTitle = escapeHtml(tutorial.title);
  const safeSubtitle = escapeHtml(tutorial.subtitle || '');
  const safeDescription = escapeHtml(tutorial.description);
  const safeDifficulty = escapeHtml(tutorial.difficulty || 'beginner');
  const safeTags = (tutorial.tags || []).map((t) => escapeHtml(t)).join(', ');

  const stepsHtml = (tutorial.steps || [])
    .map((step) => {
      const title = escapeHtml(step.title);
      const desc = escapeHtml(step.description || step.content || '');
      const code = step.codeSnippet ? `<pre><code>${escapeHtml(step.codeSnippet)}</code></pre>` : '';
      const callout = step.calloutNote
        ? `<div class="callout"><strong>${escapeHtml(step.calloutType || 'Note')}</strong> ${escapeHtml(step.calloutNote)}</div>`
        : '';
      const checklist =
        step.checklist && step.checklist.length > 0
          ? `<ul>${step.checklist.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`
          : '';
      return `<section class="step"><h2>Step ${step.stepNumber}: ${title}</h2>${desc ? `<p>${desc}</p>` : ''}${code}${callout}${checklist}</section>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0 auto; max-width: 760px; padding: 2.5rem 2rem; color: #1e293b; line-height: 1.6; }
    h1 { font-size: 2rem; margin: 0 0 0.25rem; }
    h2 { font-size: 1.4rem; color: #0a192f; margin-top: 2rem; page-break-inside: avoid; }
    .meta { color: #64748b; margin-bottom: 1.5rem; font-size: 0.95rem; }
    .callout { background: #f1f5f9; border-left: 4px solid #0a192f; padding: 0.75rem 1rem; margin: 1rem 0; }
    .step pre { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.75rem; border-radius: 6px; overflow-x: auto; font-size: 0.9rem; }
    .step pre code { display: block; padding: 0; }
    @media print { body { padding: 0 } @page { margin: 0.75in; } }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  ${safeSubtitle ? `<p><strong>Subtitle:</strong> ${safeSubtitle}</p>` : ''}
  <div class="meta">Difficulty: ${safeDifficulty} · Tags: ${safeTags}</div>
  <p class="meta">${safeDescription}</p>
  <div class="steps">${stepsHtml}</div>
</body>
</html>`;
}

/**
 * Opens a new window with the tutorial as a printable document and triggers the
 * print dialog (users can save to PDF). Falls back to opening the window for
 * manual printing.
 */
export function printTutorial(tutorial: DocumentTutorial): void {
  if (typeof window === 'undefined') return;
  const doc = generateTutorialPdfDocument(tutorial);
  const win = window.open('', '_blank', 'width=1200,height=900');
  if (!win) {
    return;
  }
  win.document.write(doc);
  win.document.close();
  try {
    win.focus();
    setTimeout(() => win.print(), 100);
  } catch {
    // Some browsers block popups; the window is still usable for manual printing.
  }
}
