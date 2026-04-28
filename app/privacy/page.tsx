import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — DealDrop",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl prose prose-slate py-8">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-gray-500">Last updated: April 2026</p>

      <h2>Who we are</h2>
      <p>
        DealDrop is an Australian deals aggregation website operated by{" "}
        <strong>[INSERT LEGAL NAME / ABN]</strong>. It collects and displays
        promotional deals sourced from public feeds including OzBargain and Reddit
        r/AusDeals. We do not sell products directly.
      </p>
      <p className="text-sm bg-amber-50 border border-amber-200 rounded p-3 text-amber-800">
        <strong>Action required:</strong> Replace [INSERT LEGAL NAME / ABN] above with your
        full legal name or registered business name and ABN. This is required under the
        Australian Privacy Act 1988 to identify the data controller.
      </p>

      <h2>What data we collect</h2>
      <p>
        DealDrop does <strong>not</strong> require you to create an account or provide
        any personal information to use the site. We do not collect names, email
        addresses, or payment information.
      </p>
      <p>
        Our hosting provider (Vercel) may collect standard server logs including IP
        addresses and browser information as part of normal web server operation. This
        data is used solely for security and performance purposes and is governed by
        <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer"> Vercel&apos;s Privacy Policy</a>.
      </p>

      <h2>Cookies</h2>
      <p>
        DealDrop does not set first-party cookies. Third-party services (such as Vercel
        Analytics, if enabled) may set cookies in accordance with their own privacy policies.
      </p>

      <h2>Affiliate links</h2>
      <p>
        Some links on this site are affiliate links. When you click an affiliate link and
        make a purchase, we may earn a small commission at no extra cost to you. We are a
        participant in the Amazon Associates Program. See our full affiliate disclosure below.
      </p>

      <h2>Third-party websites</h2>
      <p>
        Deal links direct you to third-party retailer websites. We are not responsible for
        the privacy practices of those websites and encourage you to read their privacy policies.
      </p>

      <h2>Your rights (Australian Privacy Act 1988)</h2>
      <p>
        Under the Australian Privacy Act 1988, you have the right to access and correct
        personal information we hold about you. As we do not collect personal information
        beyond server logs, there is typically nothing to access or correct.
      </p>
      <p>
        If you have a privacy concern, contact us at{" "}
        <a href="mailto:privacy@dealdrop.com.au">privacy@dealdrop.com.au</a>.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Changes will be posted on this page
        with an updated date.
      </p>
    </div>
  );
}
