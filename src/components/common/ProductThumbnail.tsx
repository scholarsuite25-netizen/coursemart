import { useMemo, useState } from 'react';
import type { ProductType } from '../../types/marketplace';
import { generateProductCoverDataUri } from '../../utils/coverGenerator';

interface ProductThumbnailProps {
  src: string;
  alt: string;
  type: ProductType;
  className?: string;
}

export function ProductThumbnail({ src, alt, type, className = '' }: ProductThumbnailProps) {
  const [failed, setFailed] = useState(false);

  const fallbackCoverUri = useMemo(
    () =>
      generateProductCoverDataUri({
        title: alt || 'Digital Wealth Creators',
        type,
      }),
    [alt, type]
  );

  if (failed || !src) {
    return (
      <img
        src={fallbackCoverUri}
        alt={alt}
        className={`object-cover ${className}`}
      />
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
