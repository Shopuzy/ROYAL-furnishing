import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, MessageCircle, Send } from 'lucide-react';
import { api } from '../lib/api';
import { buildProductWhatsAppMessage, buildWhatsAppUrl } from '../lib/whatsapp';
import type { Category, Enquiry, Product, SiteSettings } from '../types';

interface EnquiryFormProps {
  categories: Category[];
  products?: Product[];
  settings: SiteSettings;
  presetProductId?: number | null;
  presetProductName?: string;
  presetCategoryName?: string;
  compact?: boolean;
  onSuccess?: (enquiry: Enquiry) => void;
}

export function EnquiryForm({
  categories,
  products = [],
  settings,
  presetProductId = null,
  presetProductName = '',
  presetCategoryName = '',
  compact = false,
  onSuccess,
}: EnquiryFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [categoryName, setCategoryName] = useState(presetCategoryName || categories[0]?.name || 'Fluted Panels');
  const [productName, setProductName] = useState(presetProductName || '');
  const [productId, setProductId] = useState<number | null>(presetProductId);
  const [quantity, setQuantity] = useState('');
  const [enquiryType, setEnquiryType] = useState<'Retail' | 'Wholesale'>('Retail');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<Enquiry | null>(null);

  useEffect(() => {
    if (presetCategoryName) setCategoryName(presetCategoryName);
    if (presetProductName) setProductName(presetProductName);
    if (presetProductId !== undefined) setProductId(presetProductId);
  }, [presetCategoryName, presetProductName, presetProductId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { enquiry } = await api.submitEnquiry({
        customerName,
        mobileNumber,
        email: email.trim() || undefined,
        productId,
        productName: productName.trim() || categoryName,
        categoryName,
        quantity,
        enquiryType,
        deliveryLocation,
        message: message.trim() || undefined,
      });
      setSubmittedEnquiry(enquiry);
      onSuccess?.(enquiry);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit enquiry. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedEnquiry) {
    const waFollowUp = buildWhatsAppUrl(
      settings.whatsappNumber,
      buildProductWhatsAppMessage({
        enquiryCode: submittedEnquiry.enquiryCode,
        productName: submittedEnquiry.productName,
        categoryName: submittedEnquiry.categoryName,
        enquiryType: submittedEnquiry.enquiryType,
        quantity: submittedEnquiry.quantity,
        customerName: submittedEnquiry.customerName,
      })
    );

    return (
      <div className="rounded-2xl border border-[#C8A45D]/40 bg-[#FAF7F2] p-6 sm:p-8 text-[#1C1917]">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-[#C8A45D]/15 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#8C6D32]" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-2xl font-semibold text-[#1C1917]">
              Enquiry Received
            </h3>
            <p className="mt-1.5 text-sm text-[#57534E]">
              Thank you, <span className="font-medium text-[#1C1917]">{submittedEnquiry.customerName}</span>. Your{' '}
              {submittedEnquiry.enquiryType.toLowerCase()} quotation enquiry has been recorded. No payment is required at
              this stage; our team will prepare pricing and availability confirmation.
            </p>

            <div className="mt-5 p-4 rounded-xl bg-[#F2ECE1] border border-[#1C1917]/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="block text-xs text-[#78716C]">Enquiry Reference ID</span>
                <span className="font-mono font-semibold text-[#1C1917] tabular-nums">
                  {submittedEnquiry.enquiryCode}
                </span>
              </div>
              <div>
                <span className="block text-xs text-[#78716C]">Material / Category</span>
                <span className="font-medium text-[#1C1917]">{submittedEnquiry.productName}</span>
              </div>
              <div>
                <span className="block text-xs text-[#78716C]">Requested Quantity</span>
                <span className="font-medium text-[#1C1917]">{submittedEnquiry.quantity}</span>
              </div>
              <div>
                <span className="block text-xs text-[#78716C]">Delivery Location</span>
                <span className="font-medium text-[#1C1917]">{submittedEnquiry.deliveryLocation}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {waFollowUp ? (
                <a
                  href={waFollowUp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-[#181615] text-[#E6CE97] text-sm font-semibold hover:bg-[#2A2624] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Follow Up on WhatsApp</span>
                </a>
              ) : (
                <span className="text-xs text-[#78716C]">
                  Please retain reference ID <span className="font-mono">{submittedEnquiry.enquiryCode}</span> for
                  tracking.
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSubmittedEnquiry(null);
                  setQuantity('');
                  setMessage('');
                }}
                className="px-4 py-2.5 min-h-[44px] rounded-lg border border-[#1C1917]/20 text-sm font-medium text-[#1C1917] hover:bg-[#F2ECE1] transition-colors cursor-pointer"
              >
                Submit Another Enquiry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-2'} gap-4`}>
        <div>
          <label className="block text-xs font-medium text-[#44403C] mb-1.5">
            Customer Name <span className="text-[#A98640]">*</span>
          </label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Full name or company name"
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-white border border-[#1C1917]/15 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C8A45D] focus:ring-2 focus:ring-[#C8A45D]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#44403C] mb-1.5">
            Mobile Number <span className="text-[#A98640]">*</span>
          </label>
          <input
            type="tel"
            required
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="10-digit mobile or WhatsApp number"
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-white border border-[#1C1917]/15 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C8A45D] focus:ring-2 focus:ring-[#C8A45D]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#44403C] mb-1.5">Email (Optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-white border border-[#1C1917]/15 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C8A45D] focus:ring-2 focus:ring-[#C8A45D]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#44403C] mb-1.5">
            Enquiry Type <span className="text-[#A98640]">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[#F2ECE1] border border-[#1C1917]/10">
            {(['Retail', 'Wholesale'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEnquiryType(type)}
                className={`min-h-[38px] rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  enquiryType === type
                    ? 'bg-[#181615] text-[#E6CE97] shadow-xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#44403C] mb-1.5">
            Product / Category <span className="text-[#A98640]">*</span>
          </label>
          <select
            value={categoryName}
            onChange={(e) => {
              setCategoryName(e.target.value);
              if (!presetProductName) setProductName('');
            }}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-white border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#C8A45D] focus:ring-2 focus:ring-[#C8A45D]/20"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
            <option value="Multiple / Custom Project">Multiple / Custom Project</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#44403C] mb-1.5">
            Specific Product or Finish
          </label>
          {products.length > 0 && !presetProductName ? (
            <select
              value={productName}
              onChange={(e) => {
                const val = e.target.value;
                setProductName(val);
                const found = products.find((p) => p.name === val);
                setProductId(found ? found.id : null);
                if (found?.categoryName) setCategoryName(found.categoryName);
              }}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-white border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#C8A45D] focus:ring-2 focus:ring-[#C8A45D]/20"
            >
              <option value="">Any / General {categoryName}</option>
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Imperial Walnut Fluted Panel"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-white border border-[#1C1917]/15 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C8A45D] focus:ring-2 focus:ring-[#C8A45D]/20"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#44403C] mb-1.5">
            Quantity / Area Required <span className="text-[#A98640]">*</span>
          </label>
          <input
            type="text"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 25 sheets or 400 sq.ft"
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-white border border-[#1C1917]/15 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C8A45D] focus:ring-2 focus:ring-[#C8A45D]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#44403C] mb-1.5">
            Delivery Location <span className="text-[#A98640]">*</span>
          </label>
          <input
            type="text"
            required
            value={deliveryLocation}
            onChange={(e) => setDeliveryLocation(e.target.value)}
            placeholder="City, State / Project site"
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-white border border-[#1C1917]/15 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C8A45D] focus:ring-2 focus:ring-[#C8A45D]/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#44403C] mb-1.5">Message / Project Notes</label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Preferred colours, dimensions, timeline, or bulk trade requirements..."
          className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#1C1917]/15 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C8A45D] focus:ring-2 focus:ring-[#C8A45D]/20 resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[46px] rounded-lg bg-[#181615] hover:bg-[#2A2624] text-[#E6CE97] text-sm font-semibold tracking-wide transition-colors disabled:opacity-60 cursor-pointer"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Submitting Enquiry...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Submit Enquiry</span>
          </>
        )}
      </button>
    </form>
  );
}
