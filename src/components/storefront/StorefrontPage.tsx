import { BookOpen, KeyRound, PlayCircle, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { CatalogSection } from './CatalogSection';
import { HeroBanner } from './HeroBanner';
import { ProductCard } from './ProductCard';

export function StorefrontPage() {
  const { appearance, products } = useStore();

  const featuredProducts = products
    .filter((p) => p.status === 'published' && p.featured)
    .slice(0, 3);

  const renderSection = (key: 'featured' | 'catalog' | 'trust') => {
    if (key === 'featured' && appearance.showFeaturedSection && featuredProducts.length > 0) {
      return (
        <section
          key="featured"
          className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-12 pb-4"
        >
          <div className="flex items-baseline justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900">
                Featured Releases
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Highest-rated engineering courses, handbooks, and commercial starter kits.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      );
    }

    if (key === 'catalog' && appearance.showCatalogSection) {
      return <CatalogSection key="catalog" />;
    }

    if (key === 'trust' && appearance.showTrustStrip) {
      return (
        <section key="trust" className="bg-slate-50 border-t border-slate-200 mt-8">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <PlayCircle className="w-6 h-6 text-[#0a192f] mb-3" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Structured Video LMS
              </h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Track module completion, save timestamped lecture notes, and earn verified certificates.
              </p>
            </div>
            <div>
              <BookOpen className="w-6 h-6 text-[#0a192f] mb-3" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Digital Products Hub
              </h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Instant downloads across DRM-free eBooks, production Templates, and Toolkits.
              </p>
            </div>
            <div>
              <KeyRound className="w-6 h-6 text-[#0a192f] mb-3" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Instant License Keys
              </h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Software purchases generate cryptographic license keys with self-serve domain seat activation.
              </p>
            </div>
            <div>
              <ShieldCheck className="w-6 h-6 text-[#0a192f] mb-3" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Editorial Blogs & Guides
              </h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Explore deep insights on AI, Mentorship, Leadership, Vibe Coding, and Apps Deployment.
              </p>
            </div>
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <main>
      <HeroBanner />
      {appearance.sectionOrder.map((sectionKey) => renderSection(sectionKey))}
    </main>
  );
}
