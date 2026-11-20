import { useState } from 'react';
import { BookOpen, Code2, PlayCircle } from 'lucide-react';
import type { ProductType } from '../../types/marketplace';

interface ProductThumbnailProps {
  src: string;
  alt: string;
  type: ProductType;
  className?: string;
}

export function ProductThumbnail({ src, alt, type, className = '' }: ProductThumbnailProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    const Icon = type === 'course' ? PlayCircle : type === 'ebook' ? BookOpen : Code2;
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-900 text-slate-200 p-4 select-none ${className}`}
      >
        <Icon className="w-8 h-8 mb-2 text-indigo-300" aria-hidden="true" />
        <span className="text-xs font-medium text-center line-clamp-2 text-slate-300">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
