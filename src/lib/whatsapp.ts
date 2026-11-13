export function sanitizePhoneForWhatsApp(rawNumber: string | null | undefined): string {
  if (!rawNumber) return '';
  return rawNumber.replace(/[^0-9]/g, '');
}

export function buildWhatsAppUrl(whatsappNumber: string | null | undefined, message: string): string | null {
  const digits = sanitizePhoneForWhatsApp(whatsappNumber);
  if (digits.length < 7) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildProductWhatsAppMessage(opts: {
  productName?: string;
  categoryName?: string;
  enquiryType?: string;
  quantity?: string;
  customerName?: string;
  enquiryCode?: string;
}): string {
  const lines = ['Hello Royal Furnishing,'];
  if (opts.enquiryCode) {
    lines.push(`Regarding my enquiry (${opts.enquiryCode}):`);
  }
  if (opts.productName) {
    lines.push(`Product: ${opts.productName}`);
  }
  if (opts.categoryName) {
    lines.push(`Category: ${opts.categoryName}`);
  }
  if (opts.enquiryType) {
    lines.push(`Enquiry Type: ${opts.enquiryType}`);
  }
  if (opts.quantity) {
    lines.push(`Required Quantity: ${opts.quantity}`);
  }
  if (opts.customerName) {
    lines.push(`Name: ${opts.customerName}`);
  }
  lines.push('Please share pricing, availability, and quotation details.');
  return lines.join('\n');
}
