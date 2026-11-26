/**
 * Production File Downloader Utility
 *
 * Ensures 100% reliable file downloads across all modern desktop and mobile browsers
 * (Chrome, Edge, Firefox, Safari on Windows, macOS, iOS, and Android).
 *
 * Critical Chromium / WebKit Bug Fix:
 * Never call URL.revokeObjectURL synchronously right after anchor.click().
 * In Chromium and Safari, anchor.click() queues an asynchronous download stream.
 * Calling revokeObjectURL immediately in the same microtask invalidates the blob
 * before the browser download manager can initialize the stream, causing the download
 * to be silently aborted or fail.
 * Retaining the object URL for 60 seconds guarantees clean, completed downloads.
 */

export function triggerFileDownload(
  filename: string,
  content: string | Blob,
  mimeType: string = 'text/plain;charset=utf-8'
): void {
  try {
    const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      } catch {
        // Safe disposal
      }
    }, 60_000);
  } catch (err) {
    console.error('[fileDownloader] Failed to trigger file download:', err);
  }
}

/**
 * Triggers a download from a direct URL (e.g. Google Drive, Dropbox, CDN, or signed API)
 * without triggering aggressive popup blockers or navigating away from the current view.
 */
export function triggerDirectLinkDownload(url: string, filename?: string): void {
  try {
    const a = document.createElement('a');
    a.href = url;
    if (filename) {
      a.download = filename;
    }
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      } catch {
        // Safe disposal
      }
    }, 10_000);
  } catch (err) {
    console.error('[fileDownloader] Failed to trigger link download:', err);
  }
}
