import { Clock, ExternalLink, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { EnquiryForm } from '../components/EnquiryForm';
import { usePageMeta } from '../lib/seo';
import { buildProductWhatsAppMessage, buildWhatsAppUrl } from '../lib/whatsapp';
import type { BranchLocation, Category, Product, SiteSettings } from '../types';

interface ContactPageProps {
  settings: SiteSettings;
  categories: Category[];
  products: Product[];
  branches: BranchLocation[];
}

export function ContactPage({ settings, categories, products, branches }: ContactPageProps) {
  usePageMeta({
    title: 'Contact & Quotations – Royal Furnishing',
    description:
      'Request retail or wholesale quotations for fluted panels, UV marble sheets, charcoal panels, and decorative wall materials from Royal Furnishing.',
  });

  const waUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildProductWhatsAppMessage({ productName: 'Material Quotation Enquiry' })
  );

  return (
    <div className="bg-[#FAF7F2]">
      <section className="bg-[#181615] text-[#FAF7F2] py-14 sm:py-16 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-[0.22em] uppercase text-[#C8A45D]">Contact Desk</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-3">Get in Touch with Royal Furnishing</h1>
          <p className="mt-3 text-sm sm:text-base text-[#C8C0B4] max-w-2xl">
            Submit your retail or wholesale material requirements below for stock availability, sample coordination, and
            custom project pricing.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-[#F2ECE1] border border-[#1C1917]/10 p-6 sm:p-8 space-y-6">
              <h2 className="font-display text-2xl font-semibold text-[#1C1917]">Business Details</h2>

              <div className="flex items-start gap-3.5">
                <Phone className="w-5 h-5 text-[#8C6D32] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[#78716C]">Phone Number</p>
                  <p className="text-sm font-semibold text-[#1C1917] tabular-nums">
                    {settings.phoneNumber || 'Provided upon enquiry response'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Mail className="w-5 h-5 text-[#8C6D32] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[#78716C]">Email Address</p>
                  <p className="text-sm font-semibold text-[#1C1917]">
                    {settings.contactEmail || 'Use the enquiry form for direct response'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <MapPin className="w-5 h-5 text-[#8C6D32] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[#78716C]">Showroom & Warehouse Address</p>
                  <p className="text-sm font-semibold text-[#1C1917]">
                    {settings.address || 'Available upon scheduled consultation'}
                  </p>
                </div>
              </div>

              {settings.businessHours && (
                <div className="flex items-start gap-3.5">
                  <Clock className="w-5 h-5 text-[#8C6D32] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[#78716C]">Business Hours</p>
                    <p className="text-sm font-semibold text-[#1C1917]">{settings.businessHours}</p>
                  </div>
                </div>
              )}

              {waUrl && (
                <div className="pt-4 border-t border-[#1C1917]/10">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-lg bg-[#181615] text-[#E6CE97] text-sm font-semibold hover:bg-[#2A2624] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message on WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            {branches.length > 0 && (
              <div className="rounded-2xl bg-[#F2ECE1] border border-[#1C1917]/10 p-6 sm:p-8 space-y-5">
                <h2 className="font-display text-2xl font-semibold text-[#1C1917]">Our Branches & Locations</h2>
                <div className="space-y-4 divide-y divide-[#1C1917]/10">
                  {branches.map((br, idx) => {
                    const branchWa = buildWhatsAppUrl(
                      br.whatsappNumber,
                      buildProductWhatsAppMessage({ productName: `Enquiry for ${br.branchName}` })
                    );
                    return (
                      <div key={br.id} className={idx > 0 ? 'pt-4' : ''}>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-[#8C6D32] mt-1 shrink-0" />
                          <div className="flex-1 space-y-1">
                            <h3 className="text-sm font-semibold text-[#1C1917]">{br.branchName}</h3>
                            <p className="text-sm text-[#57534E]">{br.locationName}</p>
                            {br.businessHours && <p className="text-xs text-[#78716C]">{br.businessHours}</p>}
                            <div className="flex flex-wrap items-center gap-3 pt-1.5">
                              {br.mapLink && (
                                <a
                                  href={br.mapLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6D32] hover:underline"
                                >
                                  <span>Open Map Location</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {br.phoneNumber && (
                                <span className="text-xs font-medium text-[#1C1917] tabular-nums">
                                  {br.phoneNumber}
                                </span>
                              )}
                              {branchWa && (
                                <a
                                  href={branchWa}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#181615] hover:text-[#8C6D32]"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>Branch WhatsApp</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-[#F2ECE1] border border-[#1C1917]/10 p-6 sm:p-8">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">
              Submit an Enquiry or Quotation Request
            </h2>
            <p className="mt-1.5 text-sm text-[#57534E] mb-6">
              All submissions are saved directly to our sales desk with an instant enquiry reference ID.
            </p>
            <EnquiryForm categories={categories} products={products} settings={settings} />
          </div>
        </div>
      </section>
    </div>
  );
}
