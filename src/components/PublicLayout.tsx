import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ExternalLink, Menu, MessageCircle, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { buildProductWhatsAppMessage, buildWhatsAppUrl } from '../lib/whatsapp';
import type { BranchLocation, Category, SiteSettings } from '../types';

interface PublicLayoutProps {
  settings: SiteSettings;
  categories: Category[];
  branches: BranchLocation[];
  onOpenQuoteModal: (preset?: { productName?: string; categoryName?: string; productId?: number | null }) => void;
  children: ReactNode;
}

export function PublicLayout({ settings, categories, branches, onOpenQuoteModal, children }: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const logoTapCountRef = useRef(0);
  const lastLogoTapRef = useRef(0);

  const handleLogoSecretTap = (e?: MouseEvent<HTMLElement>) => {
    const now = Date.now();
    if (now - lastLogoTapRef.current > 1500) {
      logoTapCountRef.current = 1;
    } else {
      logoTapCountRef.current += 1;
    }
    lastLogoTapRef.current = now;

    if (logoTapCountRef.current >= 7) {
      logoTapCountRef.current = 0;
      lastLogoTapRef.current = 0;
      e?.preventDefault();
      setMobileMenuOpen(false);
      navigate('/admin');
    }
  };

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/products' },
    { label: 'About Us', to: '/about' },
    { label: 'Gallery', to: '/gallery' },
    { label: 'Contact', to: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildProductWhatsAppMessage({
      productName: 'Interior Decorative Materials',
    })
  );

  const handleWhatsAppClick = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } else {
      onOpenQuoteModal();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917] overflow-x-hidden">
      {/* Top Navigation Bar - Strict 3-Zone Contract */}
      <header className="sticky top-0 z-40 bg-[#181615]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Brand Title */}
          <Link
            to="/"
            onClick={handleLogoSecretTap}
            className="shrink-0 touch-manipulation select-none focus-visible:outline-2 focus-visible:outline-[#C8A45D] rounded"
          >
            <BrandLogo variant="light" />
          </Link>

          {/* Zone 2: Concise Nav Links (Desktop) */}
          <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative py-2 text-sm font-medium tracking-wide whitespace-nowrap shrink-0 transition-colors duration-200 ${
                    active ? 'text-[#E6CE97]' : 'text-[#E7E2D8] hover:text-[#E6CE97]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute left-0 right-0 bottom-0 h-[1.5px] bg-[#C8A45D]" aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleWhatsAppClick}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 min-h-[42px] rounded-full bg-[#C8A45D] hover:bg-[#B89249] text-[#181615] text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6CE97]"
            >
              <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Enquire on WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-white/15 text-[#F5EFE6] hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            aria-label="Mobile Navigation"
            className="fixed top-0 right-0 bottom-0 w-full max-w-xs bg-[#181615] text-[#F5EFE6] p-6 flex flex-col justify-between shadow-2xl border-l border-white/10 overflow-y-auto"
          >
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div onClick={handleLogoSecretTap} className="touch-manipulation select-none">
                  <BrandLogo variant="light" compact />
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-white/15 text-[#F5EFE6] hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`min-h-[46px] flex items-center px-3 rounded-lg text-base font-medium transition-colors ${
                      isActive(item.to)
                        ? 'bg-[#C8A45D]/15 text-[#E6CE97]'
                        : 'text-[#E7E2D8] hover:bg-white/5 hover:text-[#E6CE97]'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-xs font-medium tracking-wider uppercase text-[#A89F91] px-3 mb-3">
                  Material Collections
                </p>
                <div className="flex flex-col gap-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/products/${cat.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="min-h-[44px] flex items-center px-3 rounded-lg text-sm text-[#D6CFC4] hover:text-[#E6CE97] hover:bg-white/5 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenQuoteModal();
                }}
                className="w-full min-h-[46px] px-4 py-3 rounded-lg border border-[#C8A45D]/50 text-[#E6CE97] text-sm font-medium hover:bg-[#C8A45D]/10 transition-colors cursor-pointer"
              >
                Request a Quotation
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleWhatsAppClick();
                }}
                className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#C8A45D] text-[#181615] text-sm font-semibold hover:bg-[#B89249] transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enquire on WhatsApp</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Luxury Charcoal Footer (No Admin Link Exposed) */}
      <footer className="bg-[#181615] text-[#D6CFC4] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            <div>
              <div onClick={handleLogoSecretTap} className="inline-block touch-manipulation select-none">
                <BrandLogo variant="light" />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#A89F91] max-w-xs">
                Architectural interior decorative materials curated for residential, commercial, and hospitality projects
                across retail and wholesale volumes.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-wide text-[#F5EFE6] mb-4">Collections</h3>
              <ul className="space-y-2.5 text-sm">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to={`/products/${cat.slug}`}
                      className="text-[#A89F91] hover:text-[#E6CE97] transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-wide text-[#F5EFE6] mb-4">Company</h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/products" className="text-[#A89F91] hover:text-[#E6CE97] transition-colors">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-[#A89F91] hover:text-[#E6CE97] transition-colors">
                    About Royal Furnishing
                  </Link>
                </li>
                <li>
                  <Link to="/gallery" className="text-[#A89F91] hover:text-[#E6CE97] transition-colors">
                    Project Gallery
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-[#A89F91] hover:text-[#E6CE97] transition-colors">
                    Contact & Quotations
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="text-[#A89F91] hover:text-[#E6CE97] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-[#A89F91] hover:text-[#E6CE97] transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-wide text-[#F5EFE6] mb-4">Business Desk</h3>
              <div className="space-y-3 text-sm text-[#A89F91]">
                <p>
                  <span className="block text-xs text-[#78716C]">Phone</span>
                  <span className="text-[#E7E2D8] tabular-nums">
                    {settings.phoneNumber || 'Available upon enquiry'}
                  </span>
                </p>
                <p>
                  <span className="block text-xs text-[#78716C]">Email</span>
                  <span className="text-[#E7E2D8]">
                    {settings.contactEmail || 'Submit an online enquiry'}
                  </span>
                </p>
                <div>
                  <span className="block text-xs text-[#78716C]">
                    {branches.length > 1 ? 'Showrooms & Branches' : 'Showroom Address'}
                  </span>
                  {branches.length > 0 ? (
                    <ul className="mt-1.5 space-y-2.5">
                      {branches.map((br) => (
                        <li key={br.id} className="text-[#E7E2D8]">
                          <span className="font-medium text-[#E6CE97] block">{br.branchName}</span>
                          <span className="text-xs text-[#A89F91] block">{br.locationName}</span>
                          {br.mapLink && (
                            <a
                              href={br.mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#C8A45D] hover:underline mt-0.5"
                            >
                              <span>View Map</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-[#E7E2D8]">
                      {settings.address || 'Showroom details shared upon consultation'}
                    </span>
                  )}
                </div>
                {settings.businessHours && (
                  <p>
                    <span className="block text-xs text-[#78716C]">Hours</span>
                    <span className="text-[#E7E2D8]">{settings.businessHours}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
            <p>© {new Date().getFullYear()} Royal Furnishing. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/privacy-policy" className="hover:text-[#D6CFC4] transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-[#D6CFC4] transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Enquiry Button (Compact on mobile to respect 15% sticky cap) */}
      <button
        type="button"
        onClick={handleWhatsAppClick}
        aria-label="Enquire on WhatsApp"
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 px-4 py-3 min-h-[46px] rounded-full bg-[#181615] text-[#E6CE97] border border-[#C8A45D]/50 shadow-lg hover:bg-[#24211F] hover:border-[#C8A45D] transition-all duration-150 cursor-pointer"
      >
        <MessageCircle className="w-5 h-5 text-[#C8A45D] shrink-0" />
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">WhatsApp Enquiry</span>
      </button>
    </div>
  );
}
