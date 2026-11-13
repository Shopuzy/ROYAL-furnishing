import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Check, Layers, ShieldCheck } from 'lucide-react';
import { resolveImageUrl } from '../lib/media';
import { usePageMeta } from '../lib/seo';
import type { SiteSettings } from '../types';

interface AboutPageProps {
  settings: SiteSettings;
  onOpenQuoteModal: () => void;
}

export function AboutPage({ settings, onOpenQuoteModal }: AboutPageProps) {
  usePageMeta({
    title: 'About Us – Royal Furnishing',
    description:
      'Learn about Royal Furnishing — supplying precision-crafted fluted panels, UV marble sheets, charcoal panels, and interior decorative materials for retail and wholesale.',
  });

  return (
    <div className="bg-[#FAF7F2]">
      <section className="bg-[#181615] text-[#FAF7F2] py-14 sm:py-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-[0.22em] uppercase text-[#C8A45D]">About Royal Furnishing</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-3 max-w-3xl text-balance">
            {settings.aboutHeading}
          </h1>
          <p className="mt-4 text-base text-[#C8C0B4] max-w-2xl leading-relaxed">
            Architectural wall cladding and modern interior surface solutions engineered for enduring elegance across
            residential and commercial interiors.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          <div className="lg:col-span-6 rounded-2xl overflow-hidden bg-[#EAE2D3] min-h-[340px]">
            <img
              src={resolveImageUrl(settings.aboutImage)}
              alt="Royal Furnishing interior showroom"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1C1917]">
              Crafted Surfaces for Contemporary Spaces
            </h2>
            <p className="mt-5 text-base text-[#44403C] leading-relaxed">{settings.aboutBody}</p>

            <ul className="mt-8 space-y-3.5 text-sm text-[#292524]">
              {[
                'Consistent colour-batch control for multi-room and commercial installations',
                'Termite-proof, moisture-resistant WPC, PVC, and polystyrene architectural profiles',
                'Dedicated retail consultation and bulk trade pricing for architects and contractors',
                'Transparent quotation workflow with sample guidance prior to order confirmation',
              ].map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#C8A45D]/20 text-[#8C6D32] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-lg bg-[#181615] text-[#E6CE97] text-sm font-semibold hover:bg-[#2A2624]"
              >
                <span>Explore Collections</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={onOpenQuoteModal}
                className="px-6 py-3 min-h-[44px] rounded-lg border border-[#1C1917]/20 text-sm font-semibold text-[#1C1917] hover:bg-[#F2ECE1] cursor-pointer"
              >
                Request a Quotation
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#F2ECE1] border-t border-[#1C1917]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-[#FAF7F2] border border-[#1C1917]/10">
            <Building2 className="w-7 h-7 text-[#8C6D32] mb-4" />
            <h3 className="font-display text-2xl font-semibold text-[#1C1917]">Retail & Wholesale Supply</h3>
            <p className="mt-2 text-sm text-[#57534E] leading-relaxed">
              Whether renovating a single living room feature wall or procuring full container loads for commercial
              developments, we support flexible order volumes.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-[#FAF7F2] border border-[#1C1917]/10">
            <Layers className="w-7 h-7 text-[#8C6D32] mb-4" />
            <h3 className="font-display text-2xl font-semibold text-[#1C1917]">Architectural Consistency</h3>
            <p className="mt-2 text-sm text-[#57534E] leading-relaxed">
              Curated surface pairings across walnut fluted panels, bookmatched UV marble sheets, matte charcoal
              louvers, and brushed metallic profiles.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-[#FAF7F2] border border-[#1C1917]/10">
            <ShieldCheck className="w-7 h-7 text-[#8C6D32] mb-4" />
            <h3 className="font-display text-2xl font-semibold text-[#1C1917]">Verified Project Support</h3>
            <p className="mt-2 text-sm text-[#57534E] leading-relaxed">
              Every enquiry is assigned a tracked reference ID and reviewed personally by our materials desk for accurate
              specifications and dispatch timelines.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
