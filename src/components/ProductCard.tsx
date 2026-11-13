import { Link } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { resolveImageUrl } from '../lib/media';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onInquire: (product: Product) => void;
}

export function ProductCard({ product, onInquire }: ProductCardProps) {
  const coverImage = product.images[0] ? resolveImageUrl(product.images[0]) : null;
  const availabilityLabel =
    product.availabilityType === 'Both' ? 'Retail & Wholesale' : `${product.availabilityType} Supply`;

  return (
    <article className="group flex flex-col bg-[#F5F0E6] border border-[#1C1917]/10 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Link to={`/product/${product.slug}`} className="relative aspect-[4/3] bg-[#EAE2D3] overflow-hidden block">
        {coverImage ? (
          <img
            src={coverImage}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#8C6D32] p-6">
            <Layers className="w-10 h-10 mb-2 opacity-60" />
            <span className="text-xs font-medium text-center">{product.name}</span>
          </div>
        )}
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6B635B]">
            <span className="font-medium text-[#8C6D32]">{product.categoryName || 'Interior Material'}</span>
            <span aria-hidden="true">·</span>
            <span>{availabilityLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{product.stockStatus}</span>
          </div>

          <Link to={`/product/${product.slug}`} className="block mt-2">
            <h3 className="font-display text-xl font-semibold text-[#1C1917] leading-snug group-hover:text-[#8C6D32] transition-colors">
              {product.name}
            </h3>
          </Link>

          <p className="mt-2 text-sm text-[#57534E] line-clamp-2 leading-relaxed">{product.description}</p>
        </div>

        <div className="pt-4 border-t border-[#1C1917]/10 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-[#1C1917] tabular-nums">
            {product.price !== null
              ? `₹${product.price.toLocaleString('en-IN')}${product.priceUnit ? ` / ${product.priceUnit}` : ''}`
              : 'Price on Request'}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onInquire(product)}
              className="px-3.5 py-2 min-h-[38px] rounded-lg border border-[#1C1917]/20 text-xs font-semibold text-[#1C1917] hover:bg-[#181615] hover:text-[#E6CE97] transition-colors whitespace-nowrap cursor-pointer"
            >
              Inquire Now
            </button>
            <Link
              to={`/product/${product.slug}`}
              aria-label={`View ${product.name}`}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#181615] text-[#E6CE97] hover:bg-[#2E2A27] transition-colors shrink-0"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
