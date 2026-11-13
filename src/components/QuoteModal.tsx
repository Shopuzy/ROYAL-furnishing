import { X } from 'lucide-react';
import { EnquiryForm } from './EnquiryForm';
import type { Category, Product, SiteSettings } from '../types';

interface QuoteModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  products: Product[];
  settings: SiteSettings;
  preset?: {
    productId?: number | null;
    productName?: string;
    categoryName?: string;
  };
}

export function QuoteModal({ open, onClose, categories, products, settings, preset }: QuoteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-modal-title"
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#FAF7F2] border border-[#1C1917]/15 shadow-2xl p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#1C1917]/10">
          <div>
            <p className="text-xs font-medium tracking-wider uppercase text-[#8C6D32]">
              No Online Payment Required
            </p>
            <h2 id="quote-modal-title" className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917] mt-1">
              Request a Material Quotation
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quotation form"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#1C1917]/15 text-[#57534E] hover:text-[#1C1917] hover:bg-[#F2ECE1] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6">
          <EnquiryForm
            categories={categories}
            products={products}
            settings={settings}
            presetProductId={preset?.productId}
            presetProductName={preset?.productName}
            presetCategoryName={preset?.categoryName}
            compact
          />
        </div>
      </div>
    </div>
  );
}
