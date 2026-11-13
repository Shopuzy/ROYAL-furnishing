import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Building2,
  ExternalLink,
  HeadphonesIcon,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  X,
} from 'lucide-react';
import { EnquiryForm } from '../components/EnquiryForm';
import { ProductCard } from '../components/ProductCard';
import { resolveImageUrl } from '../lib/media';
import { usePageMeta } from '../lib/seo';
import { buildProductWhatsAppMessage, buildWhatsAppUrl } from '../lib/whatsapp';
import type { BranchLocation, Category, GalleryItem, Product, SiteSettings } from '../types';

interface HomePageProps {
  settings: SiteSettings;
  categories: Category[];
  featuredProducts: Product[];
  allProducts: Product[];
  galleryItems: GalleryItem[];
  branches: BranchLocation[];
  onOpenQuoteModal: (preset?: { productName?: string; categoryName?: string; productId?: number | null }) => void;
}

export function HomePage({
  settings,
  categories,
  featuredProducts,
  allProducts,
  galleryItems,
  branches,
  onOpenQuoteModal,
}: HomePageProps) {
  usePageMeta({
    title: 'Royal Furnishing – Modern Interior Decorative Materials',
    description:
      'Discover premium fluted panels, UV sheets, UV marble sheets, charcoal panels, and decorative wall finishes for residential and commercial spaces.',
  });

  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const heroImageUrl = resolveImageUrl(settings.heroImage);
  const aboutImageUrl = resolveImageUrl(settings.aboutImage);
  const directWhatsAppUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildProductWhatsAppMessage({ productName: 'Royal Furnishing Materials' })
  );

  const whyChooseItems = [
    {
      icon: Building2,
      title: 'Retail & Wholesale',
      detail: 'Single-room quantities to bulk trade dispatches',
    },
    {
      icon: Layers,
      title: 'Wide Product Variety',
      detail: 'Fluted, UV marble, charcoal & designer wall finishes',
    },
    {
      icon: Award,
      title: 'Premium Quality',
      detail: 'Moisture-resistant, termite-proof architectural boards',
    },
    {
      icon: HeadphonesIcon,
      title: 'Customer Support',
      detail: 'Dedicated specification guidance and quotation desk',
    },
  ];

  return (
    <div>
      {/* HERO SECTION */}
      <section className="relative bg-[#181615] text-[#FAF7F2] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImageUrl}
            alt="Luxury living room with walnut fluted wall panels and backlit marble cladding"
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#181615]/92 via-[#181615]/68 to-[#181615]/25"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#181615] via-transparent to-[#181615]/30"
            aria-hidden="true"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 lg:pt-28 pb-12 sm:pb-16">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-medium tracking-[0.2em] uppercase text-[#E6CE97]">
              {settings.serviceCoverage || 'Retail & Wholesale Supply'}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[62px] font-semibold leading-[1.08] tracking-tight text-[#FAF7F2] mt-4 text-balance">
              {settings.heroHeadline}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#E2DBD0] leading-relaxed max-w-xl">
              {settings.heroDescription}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 min-h-[48px] rounded-full bg-[#C8A45D] hover:bg-[#B89249] text-[#181615] text-sm font-semibold tracking-wide transition-colors duration-150"
              >
                <span>Explore Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => onOpenQuoteModal()}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 min-h-[48px] rounded-full border border-[#E6CE97]/50 bg-[#181615]/60 hover:bg-[#FAF7F2]/10 text-[#FAF7F2] text-sm font-medium tracking-wide backdrop-blur-xs transition-colors duration-150 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-[#C8A45D]" />
                <span>Get a Quote</span>
              </button>
            </div>
          </div>

          {/* Why Choose Us Strip */}
          <div className="mt-14 sm:mt-16 pt-8 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
            {whyChooseItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className={`flex items-start gap-3.5 ${
                    idx > 0 ? 'lg:pl-8 lg:border-l lg:border-white/15' : ''
                  } ${idx < whyChooseItems.length - 1 ? 'lg:pr-6' : ''}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#C8A45D]/15 border border-[#C8A45D]/30 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#E6CE97]" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-sans text-sm font-semibold text-[#FAF7F2]">{item.title}</h2>
                    <p className="mt-1 text-xs text-[#C8C0B4] leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRODUCT CATEGORIES SECTION */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12">
            <div>
              <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] uppercase text-[#8C6D32]">
                <span className="w-8 h-[1px] bg-[#C8A45D]" aria-hidden="true" />
                <span>Our Product Range</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1C1917] mt-2 text-balance">
                Explore Our Premium Collections
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1C1917] hover:text-[#8C6D32] transition-colors whitespace-nowrap self-start md:self-auto"
            >
              <span>View All Materials</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products/${cat.slug}`}
                className="group flex flex-col rounded-2xl bg-[#F2ECE1] border border-[#1C1917]/10 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="aspect-[4/3] bg-[#E5DEC9] overflow-hidden">
                  <img
                    src={resolveImageUrl(cat.imageUrl)}
                    alt={cat.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-6 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl font-semibold text-[#1C1917] group-hover:text-[#8C6D32] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="mt-1.5 text-sm text-[#57534E] line-clamp-2 leading-relaxed">{cat.description}</p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="w-10 h-10 rounded-full bg-[#181615] text-[#E6CE97] flex items-center justify-center shrink-0 group-hover:bg-[#8C6D32] group-hover:text-white transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="py-16 sm:py-20 bg-[#F2ECE1] border-y border-[#1C1917]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            <div className="lg:col-span-6 rounded-2xl overflow-hidden bg-[#E5DEC9] min-h-[320px]">
              <img
                src={aboutImageUrl}
                alt="Royal Furnishing interior materials consultation showroom"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center py-2">
              <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] uppercase text-[#8C6D32]">
                <span className="w-8 h-[1px] bg-[#C8A45D]" aria-hidden="true" />
                <span>About Royal Furnishing</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1C1917] mt-3 leading-tight text-balance">
                {settings.aboutHeading}
              </h2>
              <p className="mt-5 text-base text-[#44403C] leading-relaxed">{settings.aboutBody}</p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6 border-t border-[#1C1917]/10">
                <div>
                  <h3 className="text-sm font-semibold text-[#1C1917]">Residential Projects</h3>
                  <p className="mt-1 text-sm text-[#57534E]">
                    TV feature walls, bedroom headboards, foyers, and custom cabinetry finishes.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1C1917]">Commercial & Trade</h3>
                  <p className="mt-1 text-sm text-[#57534E]">
                    Offices, hospitality lobbies, retail showrooms, and wholesale contractor supply.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-lg bg-[#181615] hover:bg-[#2A2624] text-[#E6CE97] text-sm font-semibold transition-colors"
                >
                  <span>Our Story & Standards</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => onOpenQuoteModal()}
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-lg border border-[#1C1917]/25 text-sm font-semibold text-[#1C1917] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Request Trade Pricing
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED MATERIALS */}
      {featuredProducts.length > 0 && (
        <section className="py-16 sm:py-20 bg-[#FAF7F2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] uppercase text-[#8C6D32]">
                  <span className="w-8 h-[1px] bg-[#C8A45D]" aria-hidden="true" />
                  <span>Architectural Selection</span>
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1C1917] mt-2">
                  Signature Wall Panels & Sheets
                </h2>
              </div>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1C1917] hover:text-[#8C6D32] transition-colors whitespace-nowrap"
              >
                <span>Browse All {allProducts.length} Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredProducts.slice(0, 6).map((product) => (
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
          </div>
        </section>
      )}

      {/* GALLERY SHOWCASE */}
      {galleryItems.length > 0 && (
        <section className="py-16 sm:py-20 bg-[#181615] text-[#FAF7F2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] uppercase text-[#C8A45D]">
                  <span className="w-8 h-[1px] bg-[#C8A45D]" aria-hidden="true" />
                  <span>Application Portfolio</span>
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#FAF7F2] mt-2">
                  Completed Interior Applications
                </h2>
              </div>
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#E6CE97] hover:text-white transition-colors whitespace-nowrap"
              >
                <span>View Full Gallery</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryItems.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightboxItem(item)}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-[#24211F] text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C8A45D]"
                >
                  <img
                    src={resolveImageUrl(item.imageUrl)}
                    alt={item.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
                    aria-hidden="true"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-xs text-[#E6CE97]">
                      {item.category}
                      {item.locationLabel ? ` · ${item.locationLabel}` : ''}
                    </p>
                    <h3 className="font-display text-xl font-semibold text-white mt-1">{item.title}</h3>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONTACT & ENQUIRY SECTION */}
      <section id="contact-enquiry" className="py-16 sm:py-20 lg:py-24 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] uppercase text-[#8C6D32]">
                  <span className="w-8 h-[1px] bg-[#C8A45D]" aria-hidden="true" />
                  <span>Contact & Quotations</span>
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1C1917] mt-3 text-balance">
                  Discuss Your Interior Material Requirements
                </h2>
                <p className="mt-4 text-sm sm:text-base text-[#57534E] leading-relaxed">
                  Request retail samples or wholesale project quotations with zero online payment required. Submit your
                  dimensions and preferred finishes, and receive an official estimate with stock confirmation.
                </p>

                <div className="mt-8 space-y-5 border-t border-[#1C1917]/10 pt-6">
                  <div className="flex items-start gap-3.5">
                    <Phone className="w-5 h-5 text-[#8C6D32] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#78716C]">Phone Line</p>
                      <p className="text-sm font-semibold text-[#1C1917] tabular-nums">
                        {settings.phoneNumber || 'Shared upon enquiry submission'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <Mail className="w-5 h-5 text-[#8C6D32] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#78716C]">Email Desk</p>
                      <p className="text-sm font-semibold text-[#1C1917]">
                        {settings.contactEmail || 'Direct response via quotation form'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <MapPin className="w-5 h-5 text-[#8C6D32] mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-[#78716C]">
                        {branches.length > 1 ? 'Showrooms & Branches' : 'Showroom & Warehouse'}
                      </p>
                      {branches.length > 0 ? (
                        <div className="mt-1.5 space-y-3">
                          {branches.map((br) => (
                            <div key={br.id} className="text-sm">
                              <p className="font-semibold text-[#1C1917]">{br.branchName}</p>
                              <p className="text-xs text-[#57534E]">{br.locationName}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-1">
                                {br.mapLink && (
                                  <a
                                    href={br.mapLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C6D32] hover:underline"
                                  >
                                    <span>View on Google Maps</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                {br.phoneNumber && (
                                  <span className="text-xs text-[#57534E] tabular-nums">{br.phoneNumber}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-[#1C1917]">
                          {settings.address || 'Location details shared upon appointment'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {directWhatsAppUrl && (
                <div className="mt-8 pt-6 border-t border-[#1C1917]/10">
                  <a
                    href={directWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 min-h-[46px] rounded-lg bg-[#C8A45D] hover:bg-[#B89249] text-[#181615] text-sm font-semibold transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 rounded-2xl bg-[#F2ECE1] border border-[#1C1917]/10 p-6 sm:p-8">
              <h3 className="font-display text-2xl font-semibold text-[#1C1917] mb-1">
                Send a Product Enquiry
              </h3>
              <p className="text-sm text-[#57534E] mb-6">
                Receive a unique tracking ID immediately upon submission.
              </p>
              <EnquiryForm categories={categories} products={allProducts} settings={settings} />
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Lightbox */}
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
                Inquire About This Look
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
