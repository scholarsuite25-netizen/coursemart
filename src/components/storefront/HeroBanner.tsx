import { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { HERO_BANNER_IMAGE } from '../../data/seedData';
import { formatNaira } from '../../utils/currency';
import { getAccentTheme } from '../../utils/theme';

export function HeroBanner() {
  const { appearance, products, navigate } = useStore();
  const accent = getAccentTheme(appearance.accentTheme);
  const [slideIndex, setSlideIndex] = useState(0);

  const featuredProducts = products.filter((p) => p.status === 'published' && p.featured).slice(0, 3);
  const activeSlideProduct = featuredProducts[slideIndex] ?? featuredProducts[0];

  const scrollToCatalog = () => {
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="bg-gradient-to-b from-[#0a192f]/[0.04] via-slate-50 to-white border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-white border border-[#d4af37]/40 rounded-xl shadow-sm overflow-hidden">
          {/* Left Editorial Column */}
          <div className="lg:col-span-6 p-7 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0a192f] mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#d4af37]" />
                <span>Courses · Digital Products · Licensed Software · Blogs</span>
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0a192f] leading-[1.12] tracking-tight text-balance">
                {appearance.heroTitle}
              </h1>
              <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl">
                {appearance.heroSubtitle}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={scrollToCatalog}
                className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white ${accent.primaryBg} ${accent.primaryHoverBg} rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer`}
              >
                <span>{appearance.heroCtaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {activeSlideProduct && (
                <button
                  type="button"
                  onClick={() => navigate(`/product/${activeSlideProduct.slug}`)}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-800 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Inspect Featured Release</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Media Showcase Carousel */}
          <div className="lg:col-span-6 relative min-h-[280px] lg:min-h-[380px] bg-slate-900">
            <img
              src={slideIndex === 0 ? HERO_BANNER_IMAGE : activeSlideProduct?.thumbnail || HERO_BANNER_IMAGE}
              alt={activeSlideProduct?.title || 'Modern engineering workspace'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

            {activeSlideProduct && (
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 mb-1">
                    Featured Release · {activeSlideProduct.formatLabel}
                  </p>
                  <p className="font-display text-lg font-bold text-white truncate">
                    {activeSlideProduct.title}
                  </p>
                  <p className="text-sm text-slate-200 tabular-nums mt-0.5">
                    {formatNaira(activeSlideProduct.price)}{' '}
                    <span className="line-through text-slate-400 text-xs ml-1">
                      {formatNaira(activeSlideProduct.originalPrice)}
                    </span>
                  </p>
                </div>

                {featuredProducts.length > 1 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIndex((prev) =>
                          prev === 0 ? featuredProducts.length - 1 : prev - 1
                        )
                      }
                      aria-label="Previous featured product"
                      className="w-8 h-8 rounded-md bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIndex((prev) => (prev + 1) % featuredProducts.length)
                      }
                      aria-label="Next featured product"
                      className="w-8 h-8 rounded-md bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
