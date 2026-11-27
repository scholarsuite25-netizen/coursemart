import type { DigitalResourceSubType, ProductType } from '../types/marketplace';

export interface CoverGeneratorOptions {
  title: string;
  subtitle?: string;
  type: ProductType;
  digitalSubType?: DigitalResourceSubType;
  category?: string;
  authorName?: string;
  badge?: string;
}

interface CoverPalette {
  bgStart: string;
  bgEnd: string;
  accent: string;
  accentSoft: string;
  badgeBg: string;
  badgeText: string;
  spine: string;
}

const COVER_PALETTES: CoverPalette[] = [
  {
    bgStart: '#0a192f',
    bgEnd: '#112240',
    accent: '#d4af37',
    accentSoft: 'rgba(212, 175, 55, 0.16)',
    badgeBg: '#d4af37',
    badgeText: '#0a192f',
    spine: '#06101f',
  },
  {
    bgStart: '#064e3b',
    bgEnd: '#022c22',
    accent: '#fbbf24',
    accentSoft: 'rgba(251, 191, 36, 0.15)',
    badgeBg: '#fbbf24',
    badgeText: '#022c22',
    spine: '#021e17',
  },
  {
    bgStart: '#1e1b4b',
    bgEnd: '#312e81',
    accent: '#f59e0b',
    accentSoft: 'rgba(245, 158, 11, 0.16)',
    badgeBg: '#f59e0b',
    badgeText: '#1e1b4b',
    spine: '#131136',
  },
  {
    bgStart: '#3b0764',
    bgEnd: '#1e1b4b',
    accent: '#f472b6',
    accentSoft: 'rgba(244, 114, 182, 0.16)',
    badgeBg: '#f472b6',
    badgeText: '#2e064d',
    spine: '#24043d',
  },
  {
    bgStart: '#4c0519',
    bgEnd: '#1f0910',
    accent: '#f5c451',
    accentSoft: 'rgba(245, 196, 81, 0.16)',
    badgeBg: '#f5c451',
    badgeText: '#310412',
    spine: '#2b030e',
  },
  {
    bgStart: '#0f172a',
    bgEnd: '#1e293b',
    accent: '#38bdf8',
    accentSoft: 'rgba(56, 189, 248, 0.15)',
    badgeBg: '#38bdf8',
    badgeText: '#0f172a',
    spine: '#090e1a',
  },
  {
    bgStart: '#14532d',
    bgEnd: '#052e16',
    accent: '#a3e635',
    accentSoft: 'rgba(163, 230, 53, 0.15)',
    badgeBg: '#a3e635',
    badgeText: '#052e16',
    spine: '#031d0e',
  },
  {
    bgStart: '#7c2d12',
    bgEnd: '#431407',
    accent: '#fde047',
    accentSoft: 'rgba(253, 224, 71, 0.16)',
    badgeBg: '#fde047',
    badgeText: '#431407',
    spine: '#2b0c04',
  },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function escapeXml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxCharsPerLine) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  } else if (current && lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (last.length > maxCharsPerLine - 3) {
      lines[maxLines - 1] = `${last.slice(0, maxCharsPerLine - 3)}...`;
    }
  }

  return lines.length > 0 ? lines : ['Digital Wealth Creators'];
}

/**
 * Generates a unique, well-designed SVG cover image data URI for any eBook,
 * course, or software product when no custom cover image is supplied.
 */
export function generateProductCoverSvg(options: CoverGeneratorOptions): string {
  const {
    title,
    subtitle = '',
    type,
    digitalSubType,
    category = 'Digital Wealth Creators',
    authorName = 'DWC Executive Press',
    badge,
  } = options;

  const seed = hashString(`${type}:${title}:${category}:${subtitle}`);
  const palette = COVER_PALETTES[seed % COVER_PALETTES.length];
  const gradId = `g_${seed.toString(16)}`;
  const patternId = `p_${seed.toString(16)}`;

  const resolvedBadge =
    badge ||
    (type === 'ebook'
      ? digitalSubType === 'template'
        ? 'TEMPLATE PACK'
        : digitalSubType === 'toolkit'
          ? 'EXECUTIVE TOOLKIT'
          : 'OFFICIAL EBOOK'
      : type === 'software'
        ? 'SOFTWARE & LICENSE'
        : 'MASTERCLASS COURSE');

  const titleLines = wrapLines(title, type === 'ebook' ? 24 : 28, 3);
  const subtitleLines = subtitle ? wrapLines(subtitle, 40, 2) : [];

  const isEbook = type === 'ebook';
  const titleStartY = isEbook ? 168 : 172;
  const lineHeight = 38;

  const titleSvg = titleLines
    .map(
      (line, idx) =>
        `<text x="${isEbook ? 86 : 56}" y="${titleStartY + idx * lineHeight}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="800" fill="#ffffff" letter-spacing="-0.4">${escapeXml(line)}</text>`
    )
    .join('');

  const subtitleY = titleStartY + titleLines.length * lineHeight + 16;
  const subtitleSvg = subtitleLines
    .map(
      (line, idx) =>
        `<text x="${isEbook ? 86 : 56}" y="${subtitleY + idx * 22}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="500" fill="#cbd5e1">${escapeXml(line)}</text>`
    )
    .join('');

  const spineBlock = isEbook
    ? `
      <rect x="0" y="0" width="46" height="450" fill="${palette.spine}" />
      <rect x="46" y="0" width="3" height="450" fill="${palette.accent}" opacity="0.85" />
      <rect x="64" y="24" width="712" height="402" rx="10" fill="none" stroke="${palette.accent}" stroke-width="1.5" opacity="0.45" />
    `
    : `
      <rect x="24" y="24" width="752" height="402" rx="14" fill="none" stroke="${palette.accent}" stroke-width="1.5" opacity="0.35" />
      <circle cx="710" cy="95" r="88" fill="${palette.accentSoft}" />
      <circle cx="670" cy="365" r="120" fill="${palette.accentSoft}" />
    `;

  const leftX = isEbook ? 86 : 56;
  const badgeWidth = Math.max(150, resolvedBadge.length * 10 + 36);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bgStart}" />
      <stop offset="100%" stop-color="${palette.bgEnd}" />
    </linearGradient>
    <pattern id="${patternId}" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="${palette.accent}" opacity="0.16" />
    </pattern>
  </defs>

  <rect width="800" height="450" fill="url(#${gradId})" />
  <rect width="800" height="450" fill="url(#${patternId})" />
  ${spineBlock}

  <!-- Top Category & Edition Badge -->
  <rect x="${leftX}" y="54" width="${badgeWidth}" height="30" rx="15" fill="${palette.badgeBg}" />
  <text x="${leftX + badgeWidth / 2}" y="74" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="${palette.badgeText}" letter-spacing="1.2">${escapeXml(resolvedBadge)}</text>

  <text x="${leftX + badgeWidth + 16}" y="74" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="${palette.accent}" letter-spacing="1">${escapeXml(category.toUpperCase())}</text>

  <!-- Title & Subtitle -->
  ${titleSvg}
  ${subtitleSvg}

  <!-- Bottom Author / Brand Footer -->
  <line x1="${leftX}" y1="364" x2="740" y2="364" stroke="${palette.accent}" stroke-width="1" opacity="0.35" />
  <text x="${leftX}" y="395" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#f8fafc">${escapeXml(authorName)}</text>
  <text x="740" y="395" text-anchor="end" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="${palette.accent}" letter-spacing="1">DIGITAL WEALTH CREATORS</text>
</svg>`;
}

export function generateProductCoverDataUri(options: CoverGeneratorOptions): string {
  const svg = generateProductCoverSvg(options);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
