import { ExternalLink, Globe } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductThumbnail } from '../common/ProductThumbnail';

export function ShowcasePage() {
  const { showcaseSites } = useStore();

  const visibleSites = [...showcaseSites]
    .filter((s) => s.active)
    .sort((a, b) => a.order - b.order);

  return (
    <main className="pb-20 bg-white min-h-screen">
      {/* Navy & Gold Showcase Header */}
      <section className="bg-[#0a192f] text-white border-b-4 border-[#d4af37]">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-12 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#f5c451]">
            Showcase Directory
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white text-balance">
            Live Websites & Featured Platforms
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Explore production websites, SaaS tools, and digital platforms built with our courses,
            templates, and engineering kits.
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-10">
        {visibleSites.length === 0 ? (
          <div className="border border-slate-200 rounded-xl p-12 text-center space-y-2 bg-slate-50">
            <Globe className="w-8 h-8 text-slate-400 mx-auto" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              No showcase websites published yet
            </h2>
            <p className="text-sm text-slate-600">
              Add showcase websites from the Admin Console to display them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleSites.map((site) => (
              <article
                key={site.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                  <ProductThumbnail
                    src={site.image}
                    alt={site.name}
                    type="software"
                    className="w-full h-full"
                  />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <h2 className="font-display text-lg font-extrabold text-slate-900 truncate">
                      {site.name}
                    </h2>
                    <p className="text-xs font-mono text-slate-500 truncate">{site.url}</p>
                  </div>

                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Visit Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
