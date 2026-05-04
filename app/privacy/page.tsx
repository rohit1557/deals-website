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
        DealDrop is an Australian deals aggregation website operated by Rohit Ramesh Naik
        (an individual), ABN 14 967 852 208. It collects and displays promotional deals
        sourced from public feeds including OzBargain and Reddit r/AusDeals. We do not
        sell products directly.
      </p>

      <h2>What data we collect</h2>
      <p>
        DealDrop does <strong>not</strong> require you to create an account to browse
        deals. We do not collect names or payment information.
      </p>
      <p>
        <strong>Email newsletter (optional):</strong> If you choose to subscribe to deal
        alerts via the email sign-up form on this site, we collect your email address.
        This data is stored and processed by{" "}
        <a href="https://loops.so/privacy" target="_blank" rel="noopener noreferrer">
          Loops
        </a>{" "}
        (our email service provider) in accordance with their privacy policy. We use your
        email address solely to send deal alerts. You can unsubscribe at any time using
        the link in any email we send. We do not sell or share your email address with
        third parties.
      </p>
      <p>
        Our hosting provider (Vercel) may collect standard server logs including IP
        addresses and browser information as part of normal web server operation. This
        data is used solely for security and performance purposes and is governed by{" "}
        <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
          Vercel&apos;s Privacy Policy
        </a>.
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

      <h2>Your rights</h2>
      <p>
        <strong>Australia (Privacy Act 1988):</strong> You have the right to access and
        correct personal information we hold about you. Email subscribers may request
        deletion of their email address at any time.
      </p>
      <p>
        <strong>India (DPDP Act 2023):</strong> You have the right to access, correct,
        and erase personal data we hold. If you have subscribed to deal alerts, you may
        request erasure of your email address by contacting us or unsubscribing via any
        email we send.
      </p>
      <p>
        <strong>Singapore (PDPA 2012):</strong> If you access DealDrop from Singapore,
        you have the right to access and correct personal data we hold about you, and to
        withdraw consent for its use. Email subscribers may unsubscribe at any time. We
        collect only the minimum data necessary and do not transfer it outside of our
        service providers (Vercel, Loops) without your consent.
      </p>
      <p>
        To exercise any of these rights, please contact us at{" "}
        <a href="mailto:privacy@dealdrop.com.au">privacy@dealdrop.com.au</a> or via the{" "}
        <a href="/contact">Contact page</a>.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Changes will be posted on this page
        with an updated date.
      </p>
    </div>
  );
}
