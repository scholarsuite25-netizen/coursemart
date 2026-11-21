export type VideoProvider = 'youtube' | 'google-drive' | 'vimeo' | 'direct' | 'canvas';

export interface ResolvedMediaSource {
  provider: VideoProvider;
  embedUrl?: string;
  directUrl?: string;
  mediaId?: string;
  isIframe: boolean;
}

/**
 * Parses and resolves any video URL (Unlisted YouTube, Google Drive Video, Vimeo, or Direct MP4)
 * into a secure, embeddable player source.
 */
export function resolveMediaSource(rawUrl?: string): ResolvedMediaSource {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { provider: 'canvas', isIframe: false };
  }

  const url = rawUrl.trim();

  // 1. YouTube Detection (Unlisted, standard, shortened, or embed)
  // e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ, https://youtu.be/dQw4w9WgXcQ, shorts
  const youtubeMatch =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (youtubeMatch && youtubeMatch[1]) {
    const videoId = youtubeMatch[1];
    return {
      provider: 'youtube',
      mediaId: videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`,
      isIframe: true,
    };
  }

  // 2. Google Drive Video Detection
  // e.g., https://drive.google.com/file/d/1A2B3C4D5E6F/view?usp=sharing
  // or https://drive.google.com/open?id=1A2B3C4D5E6F
  const gDriveMatch =
    url.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+)|uc\?id=([a-zA-Z0-9_-]+))/i);
  if (gDriveMatch) {
    const fileId = gDriveMatch[1] || gDriveMatch[2] || gDriveMatch[3];
    if (fileId) {
      return {
        provider: 'google-drive',
        mediaId: fileId,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        isIframe: true,
      };
    }
  }

  // 3. Vimeo Detection
  // e.g., https://vimeo.com/123456789
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const vimeoId = vimeoMatch[1];
    return {
      provider: 'vimeo',
      mediaId: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0`,
      isIframe: true,
    };
  }

  // 4. Direct video URL (MP4, WebM, etc.)
  return {
    provider: 'direct',
    directUrl: url,
    isIframe: false,
  };
}

export const resolveMediaUrl = resolveMediaSource;

export function getProviderLabel(provider: VideoProvider): string {
  switch (provider) {
    case 'youtube':
      return 'YouTube Unlisted';
    case 'google-drive':
      return 'Google Drive Video';
    case 'vimeo':
      return 'Vimeo';
    case 'direct':
      return 'Direct Video';
    default:
      return 'Canvas Narrator';
  }
}

/**
 * Normalizes any downloadable deliverable link (especially Google Drive links)
 * into a 1-click direct download link so students don't get trapped in preview screens.
 */
export function resolveDownloadUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return '';

  const url = rawUrl.trim();

  // If it is a Google Drive share link, convert it to direct download format
  const gDriveMatch =
    url.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+)|uc\?id=([a-zA-Z0-9_-]+))/i);
  if (gDriveMatch) {
    const fileId = gDriveMatch[1] || gDriveMatch[2] || gDriveMatch[3];
    if (fileId) {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }

  // Dropbox dl=0 to dl=1 for 1-click direct download
  if (url.includes('dropbox.com') && url.includes('dl=0')) {
    return url.replace('dl=0', 'dl=1');
  }

  return url;
}
