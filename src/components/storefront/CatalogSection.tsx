import { useMemo, useState } from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { DifficultyLevel, ProductFilterState, ProductType } from '../../types/marketplace';
import { filterAndSortProducts } from '../../utils/commerce';
import { ProductCard } from './ProductCard';

export function CatalogSection() {
  const { products, filters, setFilters } = useStore();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = useMemo(() => {
    const set = new Set(products.filter((p) => p.status === 'published').map((p) => p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, filters, false),
    [products, filters]
  );

  const resetFilters = () => {
    setFilters({
      type: 'all',
      category: 'All',
      minRating: 0,
      priceFilter: 'all',
      level: 'all',
      search: '',
      sortBy: 'popular',
    });
  };

  const hasActiveFilters =
    filters.type !== 'all' ||
    filters.category !== 'All' ||
    filters.minRating > 0 ||
    filters.priceFilter !== 'all' ||
    filters.level !== 'all' ||
    filters.search.trim() !== '';

  return (
    <section id="catalog-section" className="max-w-[1440px] mx-auto px-4 lg:px-8 py-12">
      {/* Header & Type Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
            Digital Catalog
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Filter across video courses, digital products (eBooks, templates, toolkits), and
            licensed software.
          </p>
        </div>

        {/* Segmented Format Filter Controls */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start md:self-auto max-w-full">
          {(
            [
              { id: 'all', label: 'All Formats' },
              { id: 'course', label: 'Courses' },
              { id: 'ebook', label: 'Digital Products' },
              { id: 'software', label: 'Software' },
            ] as Array<{ id: ProductType | 'all'; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, type: tab.id }))}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filters.type === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar: Filter Toggle, Active Count, Sort */}
      <div className="py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold border border-slate-300 rounded-md text-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{mobileFiltersOpen ? 'Hide Filters' : 'Filters'}</span>
          </button>

          <span className="text-sm font-medium text-slate-600 tabular-nums">
            Showing <strong className="text-slate-900">{filteredProducts.length}</strong> results
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#5624d0] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="catalog-sort" className="text-xs font-semibold text-slate-600">
            Sort by
          </label>
          <select
            id="catalog-sort"
            value={filters.sortBy}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                sortBy: e.target.value as ProductFilterState['sortBy'],
              }))
            }
            className="h-9 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-slate-900"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest Releases</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Main Split: Sidebar Filters + 3-Col Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-2">
        <aside
          className={`lg:col-span-3 space-y-6 ${
            mobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
          aria-label="Catalog filters"
        >
          {/* Category Filter */}
          <div className="border-b border-slate-200 pb-5">
            <h3 className="font-display text-sm font-bold text-slate-900 mb-3">Category</h3>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <label key={cat} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="category-filter"
                    checked={filters.category === cat}
                    onChange={() => setFilters((prev) => ({ ...prev, category: cat }))}
                    className="accent-[#5624d0]"
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div className="border-b border-slate-200 pb-5">
            <h3 className="font-display text-sm font-bold text-slate-900 mb-3">Minimum Rating</h3>
            <div className="space-y-1.5">
              {[
                { label: 'All Ratings', value: 0 },
                { label: '4.5 & up', value: 4.5 },
                { label: '4.7 & up', value: 4.7 },
                { label: '4.8 & up', value: 4.8 },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rating-filter"
                    checked={filters.minRating === opt.value}
                    onChange={() => setFilters((prev) => ({ ...prev, minRating: opt.value }))}
                    className="accent-[#5624d0]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="border-b border-slate-200 pb-5">
            <h3 className="font-display text-sm font-bold text-slate-900 mb-3">Price Range</h3>
            <div className="space-y-1.5">
              {[
                { label: 'Any Price', value: 'all' },
                { label: 'Under ₦30,000', value: 'under-30000' },
                { label: '₦30,000 to ₦60,000', value: '30000-60000' },
                { label: 'Over ₦60,000', value: 'over-60000' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="price-filter"
                    checked={filters.priceFilter === opt.value}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        priceFilter: opt.value as ProductFilterState['priceFilter'],
                      }))
                    }
                    className="accent-[#5624d0]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty / Level */}
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 mb-3">
              Skill Level / Scope
            </h3>
            <div className="space-y-1.5">
              {(['all', 'All Levels', 'Beginner', 'Intermediate', 'Advanced'] as Array<
                DifficultyLevel | 'all'
              >).map((lvl) => (
                <label
                  key={lvl}
                  className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="level-filter"
                    checked={filters.level === lvl}
                    onChange={() => setFilters((prev) => ({ ...prev, level: lvl }))}
                    className="accent-[#5624d0]"
                  />
                  <span>{lvl === 'all' ? 'All Levels & Scopes' : lvl}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9">
          {filteredProducts.length === 0 ? (
            <div className="border border-slate-200 rounded-xl p-12 text-center bg-slate-50">
              <p className="font-display text-lg font-bold text-slate-900">
                No products match your current filters
              </p>
              <p className="text-sm text-slate-600 mt-1.5">
                Try clearing your search term or resetting price and rating constraints.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
