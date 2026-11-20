import type { DigitalResourceSubType, StorefrontAppearance } from '../types/marketplace';

export interface AccentThemeTokens {
  primaryBg: string;
  primaryHoverBg: string;
  primaryText: string;
  primaryBorder: string;
  softBg: string;
  ringFocus: string;
  hex: string;
}

export function getAccentTheme(theme: StorefrontAppearance['accentTheme']): AccentThemeTokens {
  switch (theme) {
    case 'emerald':
      return {
        primaryBg: 'bg-teal-700',
        primaryHoverBg: 'hover:bg-teal-800',
        primaryText: 'text-teal-700',
        primaryBorder: 'border-teal-700',
        softBg: 'bg-teal-50',
        ringFocus: 'focus-visible:ring-teal-700',
        hex: '#0f766e',
      };
    case 'cobalt':
      return {
        primaryBg: 'bg-blue-700',
        primaryHoverBg: 'hover:bg-blue-800',
        primaryText: 'text-blue-700',
        primaryBorder: 'border-blue-700',
        softBg: 'bg-blue-50',
        ringFocus: 'focus-visible:ring-blue-700',
        hex: '#1d4ed8',
      };
    case 'indigo':
    default:
      return {
        primaryBg: 'bg-[#5624d0]',
        primaryHoverBg: 'hover:bg-[#401b9c]',
        primaryText: 'text-[#5624d0]',
        primaryBorder: 'border-[#5624d0]',
        softBg: 'bg-[#f3effc]',
        ringFocus: 'focus-visible:ring-[#5624d0]',
        hex: '#5624d0',
      };
  }
}

export function formatProductTypeLabel(
  type: 'course' | 'ebook' | 'software',
  digitalSubType?: DigitalResourceSubType
): string {
  switch (type) {
    case 'course':
      return 'Video Course';
    case 'ebook':
      switch (digitalSubType) {
        case 'template':
          return 'Template Pack';
        case 'toolkit':
          return 'Toolkit';
        case 'ebook':
        default:
          return 'Digital eBook';
      }
    case 'software':
      return 'Software & License';
  }
}
