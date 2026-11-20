import { Check, Heart, ShoppingCart } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { Product } from '../../types/marketplace';
import { getDiscountPercent } from '../../utils/commerce';
import { formatNaira } from '../../utils/currency';
import { formatProductTypeLabel, getAccentTheme } from '../../utils/theme';
import { ProductThumbnail } from '../common/ProductThumbnail';
import { RatingStars } from '../common/RatingStars';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const {
    appearance,
    navigate,
    addToCart,
    cart,
    wishlist,
    toggleWishlist,
    isOwnedByCurrentUser,
  } = useStore();

  const accent = getAccentTheme(appearance.accentTheme);
  const inCart = cart.some((c) => c.productId === product.id);
  const isWishlisted = wishlist.includes(product.id);
  const isOwned = isOwnedByCurrentUser(product.id);
  const discountPct = getDiscountPercent(product.price, product.originalPrice);

  return (
    <article className="group relative flex flex-col bg-white border border-slate-200 rounded-lg transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Thumbnail Link */}
      <button
        type="button"
        onClick={() => navigate(`/product/${product.slug}`)}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-slate-100 text-left cursor-pointer"
      >
        <ProductThumbnail
          src={product.thumbnail}
          alt={product.title}
          type={product.type}
          className="w-full h-full transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </button>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
            <span className="truncate font-medium">
              {formatProductTypeLabel(product.type, product.digitalSubType)} · {product.formatLabel}
            </span>
            {product.bestseller && (
              <span className="font-semibold text-amber-800 shrink-0">Bestseller</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate(`/product/${product.slug}`)}
            className="text-left block w-full cursor-pointer"
          >
            <h3 className="font-display text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#5624d0] transition-colors">
              {product.title}
            </h3>
          </button>

          <p className="text-xs text-slate-600 mt-1 truncate">
            {product.instructorName} · {product.level}
          </p>

          <div className="mt-2">
            <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
          </div>
        </div>

        {/* Bottom Price & Primary Action Row */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-base font-extrabold text-slate-900">
              {formatNaira(product.price)}
            </span>
            {discountPct > 0 && (
              <span className="text-xs text-slate-400 line-through">
                {formatNaira(product.originalPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label={
                isWishlisted
                  ? `Remove ${product.title} from wishlist`
                  : `Save ${product.title} to wishlist`
              }
              className={`p-2 rounded-md border transition-colors cursor-pointer ${
                isWishlisted
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
            </button>

            {isOwned ? (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    product.type === 'course' ? `/learn/${product.id}` : '/library'
                  )
                }
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {product.type === 'course' ? 'Open Player' : 'In Library'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => addToCart(product)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  inCart
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : `${accent.primaryBg} ${accent.primaryHoverBg}`
                }`}
              >
                {inCart ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>In cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Udemy-style Rich Hover Preview Popover (Desktop xl+) */}
      <div
        className="hidden xl:block pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 absolute left-full top-2 ml-3 w-72 bg-white border border-slate-200 rounded-lg shadow-xl p-5 z-30 group-nth-[3n]:left-auto group-nth-[3n]:right-full group-nth-[3n]:ml-0 group-nth-[3n]:mr-3"
        aria-hidden="true"
      >
        <p className="text-xs font-semibold text-slate-500 mb-1">
          Updated {product.updatedAt} · {product.language}
        </p>
        <p className="font-display text-sm font-bold text-slate-900 leading-snug">
          {product.title}
        </p>
        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{product.subtitle}</p>
        <ul className="mt-3 space-y-1.5">
          {product.learningOutcomes.slice(0, 3).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
              <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{item}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => navigate(`/product/${product.slug}`)}
          className="mt-4 w-full py-2 text-xs font-bold text-slate-900 border border-slate-900 rounded-md hover:bg-slate-50 cursor-pointer"
        >
          View Full Details
        </button>
      </div>
    </article>
  );
}
