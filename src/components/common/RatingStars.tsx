import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  compact?: boolean;
  onDark?: boolean;
}

export function RatingStars({
  rating,
  reviewCount,
  compact = false,
  onDark = false,
}: RatingStarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.4;

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`font-bold tabular-nums text-sm ${
          onDark ? 'text-amber-300' : 'text-[#b4690e]'
        }`}
      >
        {rating.toFixed(1)}
      </span>
      <div className="inline-flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
        {[0, 1, 2, 3, 4].map((idx) => {
          const filled = idx < fullStars || (idx === fullStars && hasHalf);
          return (
            <Star
              key={idx}
              className={`w-3.5 h-3.5 ${
                filled
                  ? onDark
                    ? 'fill-amber-300 text-amber-300'
                    : 'fill-[#b4690e] text-[#b4690e]'
                  : onDark
                  ? 'text-slate-600'
                  : 'text-slate-300'
              }`}
              aria-hidden="true"
            />
          );
        })}
      </div>
      {typeof reviewCount === 'number' && !compact && (
        <span
          className={`text-xs tabular-nums ${
            onDark ? 'text-slate-300' : 'text-slate-500'
          }`}
        >
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}
