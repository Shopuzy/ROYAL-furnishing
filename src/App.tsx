import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PublicLayout } from './components/PublicLayout';
import { QuoteModal } from './components/QuoteModal';
import { api } from './lib/api';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { GalleryPage } from './pages/GalleryPage';
import { HomePage } from './pages/HomePage';
import { PrivacyPolicyPage, TermsPage } from './pages/LegalPages';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import type { AdminUser, BranchLocation, Category, GalleryItem, Product, SiteSettings } from './types';

const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const ResetPasswordPage = lazy(() =>
  import('./pages/admin/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const FALLBACK_SETTINGS: SiteSettings = {
  brandName: 'ROYAL FURNISHING',
  heroHeadline: 'Transform Your Walls with Modern Elegance',
  heroDescription:
    'Discover premium decorative panels and modern interior materials to transform your residential and commercial spaces.',
  heroImage: '/src/assets/images/hero_luxury_living_room_1794552439172.jpg',
  aboutHeading: 'Quality Materials. Royal Interiors.',
  aboutBody:
    'Royal Furnishing provides decorative interior materials for homes, offices, and commercial projects in retail and wholesale volumes.',
  aboutImage: '/src/assets/images/about_showroom_craft_1794552442731.jpg',
  whatsappNumber: '',
  phoneNumber: '',
  contactEmail: '',
  address: '',
  businessHours: '',
  serviceCoverage: 'Retail & Wholesale Supply',
};

function AdminGate({ onPublicDataRefresh }: { onPublicDataRefresh: () => void }) {
  const [checking, setChecking] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);

  const checkAuth = useCallback(async () => {
    setChecking(true);
    try {
      const res = await api.getAuthMe();
      setHasAdmin(res.hasAdmin);
      setUser(res.authenticated ? res.user : null);
    } catch {
      setUser(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await api.logoutAdmin().catch(() => {});
    setUser(null);
    setHasAdmin(true);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#181615] text-[#E6CE97] flex items-center justify-center gap-3 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Verifying session...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#181615] text-[#E6CE97] flex items-center justify-center gap-3 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading portal...</span>
          </div>
        }
      >
        <AdminLoginPage hasAdmin={hasAdmin} onSuccess={(u) => setUser(u)} />
      </Suspense>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F2EC] text-[#1C1917] flex items-center justify-center gap-3 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-[#8C6D32]" />
          <span>Loading dashboard...</span>
        </div>
      }
    >
      <AdminDashboard user={user} onLogout={handleLogout} onPublicDataRefresh={onPublicDataRefresh} />
    </Suspense>
  );
}

export default function App() {
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK_SETTINGS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [branches, setBranches] = useState<BranchLocation[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(true);

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quotePreset, setQuotePreset] = useState<{
    productId?: number | null;
    productName?: string;
    categoryName?: string;
  }>({});

  const loadPublicData = useCallback(async () => {
    try {
      const [boot, prodRes] = await Promise.all([api.getBootstrap(), api.getProducts()]);
      setSettings(boot.settings);
      setCategories(boot.categories);
      setFeaturedProducts(boot.featuredProducts);
      setGalleryItems(boot.galleryItems);
      setBranches(boot.branches ?? []);
      setAllProducts(prodRes.products);
    } catch (err) {
      console.error('Failed to load Royal Furnishing catalog:', err);
    } finally {
      setLoadingPublic(false);
    }
  }, []);

  useEffect(() => {
    loadPublicData();
  }, [loadPublicData]);

  const openQuoteModal = (preset?: { productId?: number | null; productName?: string; categoryName?: string }) => {
    setQuotePreset(preset ?? {});
    setQuoteModalOpen(true);
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Hidden Secure Admin Routes */}
        <Route path="/admin" element={<AdminGate onPublicDataRefresh={loadPublicData} />} />
        <Route path="/admin/login" element={<AdminGate onPublicDataRefresh={loadPublicData} />} />
        <Route
          path="/reset-password"
          element={
            <Suspense
              fallback={
                <div className="min-h-screen bg-[#181615] text-[#E6CE97] flex items-center justify-center gap-3 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading password reset...</span>
                </div>
              }
            >
              <ResetPasswordPage />
            </Suspense>
          }
        />

        {/* Public Storefront Routes */}
        <Route
          path="/*"
          element={
            <PublicLayout
              settings={settings}
              categories={categories}
              branches={branches}
              onOpenQuoteModal={openQuoteModal}
            >
              {loadingPublic && categories.length === 0 ? (
                <div className="min-h-[70vh] flex flex-col items-center justify-center text-[#57534E] gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-[#8C6D32]" />
                  <p className="text-sm">Loading Royal Furnishing...</p>
                </div>
              ) : (
                <Routes>
                  <Route
                    path="/"
                    element={
                      <HomePage
                        settings={settings}
                        categories={categories}
                        featuredProducts={featuredProducts}
                        allProducts={allProducts}
                        galleryItems={galleryItems}
                        branches={branches}
                        onOpenQuoteModal={openQuoteModal}
                      />
                    }
                  />
                  <Route
                    path="/products"
                    element={<ProductsPage categories={categories} onOpenQuoteModal={openQuoteModal} />}
                  />
                  <Route
                    path="/products/:categorySlug"
                    element={<ProductsPage categories={categories} onOpenQuoteModal={openQuoteModal} />}
                  />
                  <Route
                    path="/product/:slug"
                    element={<ProductDetailPage settings={settings} onOpenQuoteModal={openQuoteModal} />}
                  />
                  <Route
                    path="/about"
                    element={<AboutPage settings={settings} onOpenQuoteModal={() => openQuoteModal()} />}
                  />
                  <Route
                    path="/gallery"
                    element={<GalleryPage galleryItems={galleryItems} onOpenQuoteModal={openQuoteModal} />}
                  />
                  <Route
                    path="/contact"
                    element={
                      <ContactPage
                        settings={settings}
                        categories={categories}
                        products={allProducts}
                        branches={branches}
                      />
                    }
                  />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              )}

              <QuoteModal
                open={quoteModalOpen}
                onClose={() => setQuoteModalOpen(false)}
                categories={categories}
                products={allProducts}
                settings={settings}
                preset={quotePreset}
              />
            </PublicLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
