"use client";
import { ExternalLink } from "lucide-react";

interface Props {
  href: string;
  dealId: string;
  dealTitle: string;
  dealSource: string | null;
  dealCategory: string | null;
  dealPrice: number | null;
  currency: string;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function AffiliateButton({
  href, dealId, dealTitle, dealSource, dealCategory, dealPrice, currency,
}: Props) {
  function handleClick() {
    window.gtag?.("event", "affiliate_click", {
      deal_id:       dealId,
      deal_title:    dealTitle.slice(0, 100),
      deal_source:   dealSource ?? "unknown",
      deal_category: dealCategory ?? "Other",
      deal_price:    dealPrice,
      currency,
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
    >
      Get this deal <ExternalLink className="h-4 w-4" />
    </a>
  );
}
