import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — DealDrop",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl prose prose-slate py-8">
      <h1>Terms of Use</h1>
      <p className="text-sm text-gray-500">Last updated: April 2026</p>

      <h2>Acceptance of terms</h2>
      <p>
        By using DealDrop (&quot;the Site&quot;), you agree to these Terms of Use. If you do not
        agree, please do not use the Site.
      </p>

      <h2>About DealDrop</h2>
      <p>
        DealDrop is an automated deals aggregation service that collects and displays
        promotional deals from public sources including OzBargain and Reddit. We do not
        sell products or process payments. All purchases are made directly with the
        relevant retailer.
      </p>

      <h2>Price accuracy disclaimer</h2>
      <p>
        Prices, availability, and deal terms are accurate at the time of posting but may
        change at any time without notice. DealDrop does not guarantee that any price or
        deal shown is currently available. Always verify the current price on the
        retailer&apos;s website before making a purchase.
      </p>
      <p>
        In accordance with the Australian Consumer Law, we take reasonable steps to ensure
        price information is accurate. However, as prices are sourced automatically from
        third-party feeds, errors may occur. If you notice an inaccurate price, please
        contact us so we can correct it promptly.
      </p>
      <h2>Discount percentages (ACL Section 29)</h2>
      <p>
        Where a discount percentage is shown (e.g. &quot;−40% OFF&quot;), it is calculated from
        the original price listed in the deal source at the time of posting. This original
        price may reflect a manufacturer&apos;s recommended retail price (RRP), a previous
        sale price, or the price listed by the deal submitter — DealDrop cannot
        independently verify that the original price was charged immediately prior to the
        discount. We recommend confirming the current and historical price on the
        retailer&apos;s website before relying on any stated saving.
      </p>

      <h2>Affiliate disclosure</h2>
      <p>
        DealDrop participates in affiliate programs including the Amazon Associates
        Program. When you click certain links on this site and make a qualifying purchase,
        we may earn a commission at no additional cost to you.
      </p>
      <p>
        <strong>As an Amazon Associate, DealDrop earns from qualifying purchases.</strong>
      </p>
      <p>
        Affiliate relationships do not influence which deals we feature. We aggregate
        deals based on their apparent value to consumers.
      </p>

      <h2>No warranty</h2>
      <p>
        The Site is provided &quot;as is&quot; without any warranty, express or implied. DealDrop
        does not warrant that the Site will be uninterrupted, error-free, or free of
        viruses or other harmful components.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by Australian law, DealDrop and its operators
        are not liable for any direct, indirect, incidental, or consequential loss or
        damage arising from your use of the Site or any deal featured on it, including
        losses arising from reliance on price information that has changed.
      </p>

      <h2>External links</h2>
      <p>
        DealDrop links to external retailer websites. We are not responsible for the
        content, accuracy, or practices of those websites.
      </p>

      <h2>Intellectual property</h2>
      <p>
        Deal titles, descriptions, and images are sourced from third-party feeds and
        remain the property of their respective owners. DealDrop claims no ownership
        over sourced content.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of New South Wales, Australia.
        Any disputes will be subject to the exclusive jurisdiction of the courts
        of New South Wales.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be directed to the site operator via the contact
        details provided when you were directed to this site.
      </p>
    </div>
  );
}
