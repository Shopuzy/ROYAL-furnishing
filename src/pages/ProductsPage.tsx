import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';
import { usePageMeta } from '../lib/seo';
import type { Category, Product } from '../types';

interface ProductsPageProps {
  categories: Category[];
  onOpenQuoteModal: (preset?: { productName?: string; categoryName?: string; productId?: number | null }) => void;
}

export function ProductsPage({ categories, onOpenQuoteModal }: ProductsPageProps) {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const activeCategory = categories.find((c) => c.slug === categorySlug);

  usePageMeta({
    title: activeCategory
      ? `${activeCategory.name} – Royal Furnishing`
      : 'All Interior Decorative Materials – Royal Furnishing',
    description: activeCategory
      ? `${activeCategory.description} Available in retail and wholesale quantities from Royal Furnishing.`
      : 'Explore fluted panels, UV sheets, UV marble sheets, charcoal panels, and decorative wall finishes.',
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState<'All' | 'Retail' | 'Wholesale'>('All');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .getProducts({
        category: categorySlug || 'all',
        search: search.trim() || undefined,
        availability: availability === 'All' ? undefined : availability,
      })
      .then((res) => {
        if (!cancelled) {
          setProducts(res.products);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load products.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categorySlug, search, availability]);

  return (
    <div className="bg-[#FAF7F2] min-h-[70vh]">
      {/* Page Header */}
      <section className="bg-[#181615] text-[#FAF7F2] py-12 sm:py-16 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs text-[#C8A45D] flex items-center gap-2">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/products" className="hover:text-white transition-colors">
              Products
            </Link>
            {activeCategory && (
              <>
                <span aria-hidden="true">/</span>
                <span className="text-[#FAF7F2]">{activeCategory.name}</span>
              </>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-semibold mt-4 text-balance">
            {activeCategory ? activeCategory.name : 'Interior Material Collections'}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#C8C0B4] max-w-2xl leading-relaxed">
            {activeCategory
              ? activeCategory.description
              : 'Browse our complete range of architectural wall panels, UV marble sheets, charcoal louvers, and decorative interior surfaces for retail and wholesale orders.'}
          </p>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="border-b border-[#1C1917]/10 bg-[#F2ECE1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search panels, finishes, dimensions..."
                className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-lg bg-white border border-[#1C1917]/15 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C8A45D]"
              />
            </div>

            {/* Retail / Wholesale Segmented Filter */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#E6DDD0] self-start">
              {(['All', 'Retail', 'Wholesale'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAvailability(mode)}
                  className={`px-4 py-2 min-h-[38px] rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    availability === mode
                      ? 'bg-[#181615] text-[#E6CE97]'
                      : 'text-[#44403C] hover:text-[#1C1917]'
                  }`}
                >
                  {mode === 'All' ? 'All Supply' : mode}
                </button>
              ))}
            </div>
          </div>

          {/* Category Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Link
              to="/products"
              className={`px-4 py-2 min-h-[40px] inline-flex items-center rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                !categorySlug
                  ? 'bg-[#181615] text-[#E6CE97]'
                  : 'bg-white/70 text-[#44403C] border border-[#1C1917]/10 hover:bg-white'
              }`}
            >
              All Categories
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products/${cat.slug}`}
                className={`px-4 py-2 min-h-[40px] inline-flex items-center rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  categorySlug === cat.slug
                    ? 'bg-[#181615] text-[#E6CE97]'
                    : 'bg-white/70 text-[#44403C] border border-[#1C1917]/10 hover:bg-white'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-[#57534E]">
              <Loader2 className="w-7 h-7 animate-spin text-[#8C6D32]" />
              <p className="mt-3 text-sm">Loading material catalog...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>
          ) : products.length === 0 ? (
            <div className="py-16 px-6 rounded-2xl bg-[#F2ECE1] border border-[#1C1917]/10 text-center">
              <h2 className="font-display text-2xl font-semibold text-[#1C1917]">No Matching Materials Found</h2>
              <p className="mt-2 text-sm text-[#57534E] max-w-md mx-auto">
                Looking for a custom texture, thickness, or bulk specification? Our sourcing team can arrange custom
                finishes.
              </p>
              <button
                type="button"
                onClick={() =>
                  onOpenQuoteModal({
                    categoryName: activeCategory?.name,
                  })
                }
                className="mt-6 px-6 py-3 min-h-[44px] rounded-lg bg-[#181615] text-[#E6CE97] text-sm font-semibold hover:bg-[#2A2624] cursor-pointer"
              >
                Request Custom Sourcing Quote
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onInquire={(p) =>
                    onOpenQuoteModal({
                      productId: p.id,
                      productName: p.name,
                      categoryName: p.categoryName,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
