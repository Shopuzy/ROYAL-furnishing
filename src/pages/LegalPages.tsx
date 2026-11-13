import { usePageMeta } from '../lib/seo';

export function PrivacyPolicyPage() {
  usePageMeta({
    title: 'Privacy Policy – Royal Furnishing',
    description: 'Privacy policy governing customer enquiries, quotations, and contact details submitted to Royal Furnishing.',
  });

  return (
    <div className="bg-[#FAF7F2] py-14 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#8C6D32]">Legal & Compliance</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#1C1917] mt-2">Privacy Policy</h1>
        <p className="mt-3 text-sm text-[#6B635B]">Last updated: {new Date().getFullYear()}</p>

        <div className="mt-8 space-y-6 text-sm sm:text-base text-[#44403C] leading-relaxed">
          <section>
            <h2 className="font-display text-2xl font-semibold text-[#1C1917] mb-2">1. Information We Collect</h2>
            <p>
              When you submit an enquiry or quotation request to Royal Furnishing, we collect the contact and project
              information you voluntarily provide, including your name, mobile number, optional email address, requested
              material specifications, quantities, and delivery location.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-[#1C1917] mb-2">2. How We Use Your Details</h2>
            <p>
              Your details are used strictly to prepare retail or wholesale quotations, verify stock availability,
              coordinate material samples, and communicate with you via phone, email, or WhatsApp regarding your active
              enquiry or confirmed order. We do not sell or rent customer information to third parties.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-[#1C1917] mb-2">3. Data Retention & Security</h2>
            <p>
              Enquiry and order records are retained in our secure database solely for quotation tracking, order
              fulfilment, and customer support. You may request correction or deletion of your contact record at any
              time through our Contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function TermsPage() {
  usePageMeta({
    title: 'Terms & Conditions – Royal Furnishing',
    description: 'Terms and conditions for retail and wholesale interior material enquiries, quotations, and orders with Royal Furnishing.',
  });

  return (
    <div className="bg-[#FAF7F2] py-14 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#8C6D32]">Legal & Compliance</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#1C1917] mt-2">
          Terms & Conditions
        </h1>
        <p className="mt-3 text-sm text-[#6B635B]">Last updated: {new Date().getFullYear()}</p>

        <div className="mt-8 space-y-6 text-sm sm:text-base text-[#44403C] leading-relaxed">
          <section>
            <h2 className="font-display text-2xl font-semibold text-[#1C1917] mb-2">1. Enquiries & Quotations</h2>
            <p>
              Submitting an online enquiry or quotation request does not constitute a binding purchase or confirmed
              order. Pricing, stock availability, batch colour matching, and freight estimates are confirmed only after
              official written quotation and confirmation by Royal Furnishing.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-[#1C1917] mb-2">2. Order Confirmation</h2>
            <p>
              No order is treated as confirmed until reviewed and explicitly marked Confirmed by an authorised Royal
              Furnishing administrator following verification of quantities, finishes, and commercial terms.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-[#1C1917] mb-2">
              3. Product Imagery & Finishes
            </h2>
            <p>
              Surface textures, woodgrain patterns, and marble veining may vary slightly between digital screens and
              physical batches. We encourage reviewing physical samples prior to bulk wholesale procurement.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
