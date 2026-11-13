import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, FileText, Loader2, MessageCircle, Send } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';
import { resolveImageUrl } from '../lib/media';
import { usePageMeta } from '../lib/seo';
import { buildProductWhatsAppMessage, buildWhatsAppUrl } from '../lib/whatsapp';
import type { Order, Product, SiteSettings } from '../types';

interface ProductDetailPageProps {
  settings: SiteSettings;
  onOpenQuoteModal: (preset?: { productName?: string; categoryName?: string; productId?: number | null }) => void;
}

export function ProductDetailPage({ settings, onOpenQuoteModal }: ProductDetailPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedFinish, setSelectedFinish] = useState<string>('');

  // Order/Quotation Request inline drawer state
  const [showOrderRequest, setShowOrderRequest] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState<'Retail' | 'Wholesale'>('Retail');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  usePageMeta({
    title: product ? `${product.name} – Royal Furnishing` : 'Material Details – Royal Furnishing',
    description: product
      ? product.description.slice(0, 155)
      : 'View specifications, finishes, and quotation options for Royal Furnishing interior materials.',
  });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedImageIdx(0);
    setSubmittedOrder(null);
    setShowOrderRequest(false);

    api
      .getProductBySlug(slug)
      .then((res) => {
        if (!cancelled) {
          setProduct(res.product);
          setRelatedProducts(res.relatedProducts);
          setSelectedFinish(res.product.colorsDesigns[0]?.name ?? '');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load product.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-[#57534E]">
        <Loader2 className="w-7 h-7 animate-spin text-[#8C6D32]" />
        <p className="mt-3 text-sm">Loading material specifications...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-[#1C1917]">Product Not Found</h1>
        <p className="mt-3 text-sm text-[#57534E]">{error || 'This material may no longer be listed.'}</p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center px-6 py-3 rounded-lg bg-[#181615] text-[#E6CE97] text-sm font-semibold"
        >
          Back to All Products
        </Link>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [''];
  const activeImg = resolveImageUrl(images[selectedImageIdx] ?? images[0]);
  const waUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildProductWhatsAppMessage({
      productName: selectedFinish ? `${product.name} (${selectedFinish})` : product.name,
      categoryName: product.categoryName,
      enquiryType: product.availabilityType === 'Both' ? 'Retail / Wholesale' : product.availabilityType,
    })
  );

  const handleOrderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setOrderError(null);
    setSubmittingOrder(true);
    try {
      const { order } = await api.submitOrderRequest({
        customerName,
        mobileNumber,
        email: email.trim() || undefined,
        deliveryLocation,
        orderType,
        notes: notes.trim() || undefined,
        items: [
          {
            productId: product.id,
            productName: product.name,
            categoryName: product.categoryName || '',
            quantity: quantity.trim(),
            finish: selectedFinish || undefined,
            unitPrice: product.price,
          },
        ],
      });
      setSubmittedOrder(order);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Unable to submit quotation request.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="bg-[#FAF7F2] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#6B635B] flex flex-wrap items-center gap-2 mb-8">
          <Link to="/" className="hover:text-[#1C1917]">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/products" className="hover:text-[#1C1917]">
            Products
          </Link>
          {product.categorySlug && (
            <>
              <span aria-hidden="true">/</span>
              <Link to={`/products/${product.categorySlug}`} className="hover:text-[#1C1917]">
                {product.categoryName}
              </Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span className="text-[#1C1917] font-medium">{product.name}</span>
        </nav>

        {/* Contiguous PDP Module */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Left: Gallery */}
          <div className="lg:col-span-6">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#EAE2D3] border border-[#1C1917]/10">
              <img
                src={activeImg}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedImageIdx === idx
                        ? 'border-[#C8A45D] ring-2 ring-[#C8A45D]/25'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={resolveImageUrl(img)}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Specs, Swatches & Action Module */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#6B635B]">
              <span className="text-[#8C6D32] uppercase tracking-wider">{product.categoryName}</span>
              <span aria-hidden="true">·</span>
              <span>
                {product.availabilityType === 'Both'
                  ? 'Retail & Wholesale Available'
                  : `${product.availabilityType} Only`}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[#1C1917]">{product.stockStatus}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#1C1917] mt-2 leading-tight">
              {product.name}
            </h1>

            <div className="mt-4 pb-5 border-b border-[#1C1917]/10 flex items-baseline gap-3">
              <span className="text-xl sm:text-2xl font-semibold text-[#1C1917] tabular-nums">
                {product.price !== null
                  ? `₹${product.price.toLocaleString('en-IN')}${product.priceUnit ? ` / ${product.priceUnit}` : ''}`
                  : 'Price on Request'}
              </span>
              {product.price === null && (
                <span className="text-xs text-[#6B635B]">Custom retail & bulk trade quotations</span>
              )}
            </div>

            <p className="mt-5 text-sm sm:text-base text-[#44403C] leading-relaxed">{product.description}</p>

            {/* Available Colours & Designs */}
            {product.colorsDesigns.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-3">
                  Available Colours & Designs{selectedFinish ? ` — ${selectedFinish}` : ''}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {product.colorsDesigns.map((cd) => {
                    const active = selectedFinish === cd.name;
                    return (
                      <button
                        key={cd.name}
                        type="button"
                        onClick={() => setSelectedFinish(cd.name)}
                        className={`inline-flex items-center gap-2.5 px-3.5 py-2 min-h-[42px] rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#181615] text-[#E6CE97] border-[#181615]'
                            : 'bg-[#F2ECE1] text-[#1C1917] border-[#1C1917]/15 hover:border-[#C8A45D]'
                        }`}
                      >
                        {cd.hex && (
                          <span
                            className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: cd.hex }}
                            aria-hidden="true"
                          />
                        )}
                        <span>{cd.name}</span>
                        {cd.finish && <span className="opacity-70">({cd.finish})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() =>
                  onOpenQuoteModal({
                    productId: product.id,
                    productName: selectedFinish ? `${product.name} (${selectedFinish})` : product.name,
                    categoryName: product.categoryName,
                  })
                }
                className="min-h-[46px] px-4 py-3 rounded-lg bg-[#181615] hover:bg-[#2A2624] text-[#E6CE97] text-sm font-semibold transition-colors cursor-pointer"
              >
                Inquire Now
              </button>

              <button
                type="button"
                onClick={() => setShowOrderRequest((prev) => !prev)}
                className="min-h-[46px] px-4 py-3 rounded-lg border border-[#1C1917]/25 bg-white hover:bg-[#F2ECE1] text-[#1C1917] text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Get a Quote</span>
              </button>

              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[46px] px-4 py-3 rounded-lg bg-[#C8A45D] hover:bg-[#B89249] text-[#181615] text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Inquire on WhatsApp</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onOpenQuoteModal({
                      productId: product.id,
                      productName: selectedFinish ? `${product.name} (${selectedFinish})` : product.name,
                      categoryName: product.categoryName,
                    })
                  }
                  className="min-h-[46px] px-4 py-3 rounded-lg bg-[#C8A45D] hover:bg-[#B89249] text-[#181615] text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Inquire on WhatsApp</span>
                </button>
              )}
            </div>

            {/* Formal Quotation / Order Request Panel */}
            {showOrderRequest && (
              <div className="mt-6 p-5 sm:p-6 rounded-xl bg-[#F2ECE1] border border-[#C8A45D]/40">
                {submittedOrder ? (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[#8C6D32] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-display text-xl font-semibold text-[#1C1917]">
                        Quotation Request Recorded
                      </h3>
                      <p className="mt-1 text-sm text-[#44403C]">
                        Reference <span className="font-mono font-semibold">{submittedOrder.orderCode}</span> is
                        currently marked <span className="font-medium">{submittedOrder.status}</span> and awaiting
                        administrator review and confirmation. No payment is required now.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleOrderSubmit} className="space-y-3.5">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-[#1C1917]">
                        Request Formal Quotation / Order Estimate
                      </h3>
                      <p className="text-xs text-[#57534E] mt-0.5">
                        Orders are only confirmed after our team reviews stock, finishes, and confirms pricing with you.
                      </p>
                    </div>
                    {orderError && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                        {orderError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Your Name *"
                        className="min-h-[42px] px-3 py-2 rounded-lg bg-white border border-[#1C1917]/15 text-sm"
                      />
                      <input
                        type="tel"
                        required
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="Mobile Number *"
                        className="min-h-[42px] px-3 py-2 rounded-lg bg-white border border-[#1C1917]/15 text-sm"
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email (optional)"
                        className="min-h-[42px] px-3 py-2 rounded-lg bg-white border border-[#1C1917]/15 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Quantity (e.g. 30 panels) *"
                        className="min-h-[42px] px-3 py-2 rounded-lg bg-white border border-[#1C1917]/15 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={deliveryLocation}
                        onChange={(e) => setDeliveryLocation(e.target.value)}
                        placeholder="Delivery City / Address *"
                        className="min-h-[42px] px-3 py-2 rounded-lg bg-white border border-[#1C1917]/15 text-sm"
                      />
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value as 'Retail' | 'Wholesale')}
                        className="min-h-[42px] px-3 py-2 rounded-lg bg-white border border-[#1C1917]/15 text-sm"
                      >
                        <option value="Retail">Retail Order</option>
                        <option value="Wholesale">Wholesale / Trade Order</option>
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Finish notes or delivery timeline..."
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#1C1917]/15 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={submittingOrder}
                      className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-[#181615] text-[#E6CE97] text-sm font-semibold hover:bg-[#2A2624] cursor-pointer"
                    >
                      {submittingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Submit Quotation Request</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Specifications Table */}
            {product.specifications.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#1C1917]/10">
                <h2 className="font-display text-2xl font-semibold text-[#1C1917] mb-4">
                  Technical Specifications
                </h2>
                <div className="rounded-xl border border-[#1C1917]/10 bg-[#F2ECE1] divide-y divide-[#1C1917]/10">
                  {product.specifications.map((spec) => (
                    <div
                      key={spec.label}
                      className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm"
                    >
                      <span className="text-[#57534E] font-medium">{spec.label}</span>
                      <span className="text-[#1C1917] font-semibold sm:text-right">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Materials */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-[#1C1917]/10">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917] mb-8">
              Related in {product.categoryName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {relatedProducts.map((rel) => (
                <ProductCard
                  key={rel.id}
                  product={rel}
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
          </section>
        )}
      </div>
    </div>
  );
}
