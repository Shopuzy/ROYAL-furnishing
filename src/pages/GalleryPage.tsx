import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { resolveImageUrl } from '../lib/media';
import { usePageMeta } from '../lib/seo';
import type { GalleryItem } from '../types';

interface GalleryPageProps {
  galleryItems: GalleryItem[];
  onOpenQuoteModal: (preset?: { productName?: string; categoryName?: string }) => void;
}

export function GalleryPage({ galleryItems, onOpenQuoteModal }: GalleryPageProps) {
  usePageMeta({
    title: 'Project & Interior Gallery – Royal Furnishing',
    description:
      'Explore completed residential and commercial interiors showcasing Royal Furnishing fluted panels, UV marble sheets, and decorative wall cladding.',
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    galleryItems.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [galleryItems]);

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return galleryItems;
    return galleryItems.filter((item) => item.category === selectedCategory);
  }, [galleryItems, selectedCategory]);

  return (
    <div className="bg-[#FAF7F2] min-h-[75vh]">
      <section className="bg-[#181615] text-[#FAF7F2] py-14 sm:py-16 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-[0.22em] uppercase text-[#C8A45D]">Application Gallery</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-3">
            Architectural Surfaces in Real Interiors
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#C8C0B4] max-w-2xl">
            Curated living rooms, feature media walls, hospitality receptions, and material surface combinations.
          </p>
        </div>
      </section>

      <section className="border-b border-[#1C1917]/10 bg-[#F2ECE1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 min-h-[40px] rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#181615] text-[#E6CE97]'
                  : 'bg-white/75 text-[#44403C] border border-[#1C1917]/10 hover:bg-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#F2ECE1] text-center text-sm text-[#57534E]">
              No gallery applications available in this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightboxItem(item)}
                  className="group rounded-2xl overflow-hidden bg-[#F2ECE1] border border-[#1C1917]/10 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#EAE2D3]">
                    <img
                      src={resolveImageUrl(item.imageUrl)}
                      alt={item.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-[#8C6D32] font-medium">
                      {item.category}
                      {item.locationLabel ? ` · ${item.locationLabel}` : ''}
                    </p>
                    <h2 className="font-display text-2xl font-semibold text-[#1C1917] mt-1">{item.title}</h2>
                    {item.description && (
                      <p className="mt-1.5 text-sm text-[#57534E] line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="relative max-w-4xl w-full rounded-2xl overflow-hidden bg-[#181615] border border-white/15">
            <button
              type="button"
              onClick={() => setLightboxItem(null)}
              aria-label="Close image preview"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-[16/10] bg-black">
              <img
                src={resolveImageUrl(lightboxItem.imageUrl)}
                alt={lightboxItem.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-6 text-[#FAF7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#E6CE97]">
                  {lightboxItem.category}
                  {lightboxItem.locationLabel ? ` · ${lightboxItem.locationLabel}` : ''}
                </p>
                <h3 className="font-display text-2xl font-semibold mt-1">{lightboxItem.title}</h3>
                {lightboxItem.description && (
                  <p className="mt-1.5 text-sm text-[#C8C0B4]">{lightboxItem.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const title = lightboxItem.title;
                  const cat = lightboxItem.category;
                  setLightboxItem(null);
                  onOpenQuoteModal({ productName: title, categoryName: cat });
                }}
                className="px-5 py-2.5 min-h-[44px] rounded-lg bg-[#C8A45D] text-[#181615] text-sm font-semibold hover:bg-[#B89249] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Request Quote for Similar Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
