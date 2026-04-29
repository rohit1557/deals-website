"use client";
import type { MouseEvent } from "react";
import { Clock, Flame, Sparkles, Timer, Zap, Tag } from "lucide-react";
import type { Deal } from "@/lib/types";

const AMAZON_TAGS: Record<string, string> = {
  "amazon.com.au": "dealdrop0d5-22",
  "amazon.com":    "dealdrop0a7-20",
  "amazon.in":     "dealdrop0i1-21",
};

function affiliateUrl(url: string): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    for (const [domain, tag] of Object.entries(AMAZON_TAGS)) {
      if (u.hostname.includes(domain)) {
        u.searchParams.set("tag", tag);
        return u.toString();
      }
    }
  } catch {}
  return url;
}

function formatPrice(price: number | null, currency?: string | null, country?: string | null): string | null {
  if (price == null) return null;
  const curr = currency?.trim() || (country === "IN" ? "INR" : "AUD");
  const locale = curr === "INR" ? "en-IN" : "en-AU";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: curr,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function timeUntilExpiry(expiresAt: Date | null): string | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

function isNew(createdAt: Date): boolean {
  return Date.now() - new Date(createdAt).getTime() < 6 * 60 * 60 * 1000;
}

// Detect cashback/referral/promo deals that have misleading RRP savings
function getPromoType(title: string, description?: string | null, url?: string): string | null {
  // URL-based detection is most reliable — /join/, /refer/, ?ref= etc.
  if (url) {
    const u = url.toLowerCase();
    if (/\/(join|refer|referral|invite|enroll)\//.test(u)) return "Referral Bonus";
  }
  const text = `${title} ${description ?? ""}`.toLowerCase();
  if (/referral|refer[\s-]a[\s-]friend|refer[\s-]and[\s-]earn/.test(text)) return "Referral Bonus";
  if (/cashback|cash[\s-]back/.test(text)) return "Cashback";
  if (/\bfreebie\b|\bfree\s+(gift|sample|item)\b/.test(text)) return "Freebie";
  if (/\bvoucher\b|\bpromo\s*code\b|\bcoupon\s*code\b/.test(text)) return "Voucher";
  if (/\bgift\s*card\b/.test(text)) return "Gift Card";
  if (/sign[\s-]?up\s+bonus|welcome\s+bonus|new\s+customer\s+offer|bonus\s+credit/.test(text)) return "Sign-up Bonus";
  return null;
}

const SOURCE_LABELS: Record<string, string> = {
  ozbargain:   "OzBargain",
  slickdeals:  "SlickDeals",
  dealnews:    "DealNews",
  retailmenot: "r/AusDeals",
  indiadeals:  "r/IndiaDeals",
};

// All current sources are community-posted (OzBargain, Reddit etc.) —
// prices are user-reported and never verified directly against the retailer.
// Use createdAt (set once on first scrape) as the age signal; updatedAt
// is reset by Scout on every hourly re-scrape and is not a reliable price-age proxy.
function listingAge(createdAt: Date): { hoursAgo: number; label: string } {
  const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  const mins = Math.floor(hoursAgo * 60);
  if (mins < 60) return { hoursAgo, label: `${mins}m ago` };
  if (hoursAgo < 24) return { hoursAgo, label: `${Math.floor(hoursAgo)}h ago` };
  return { hoursAgo, label: `${Math.floor(hoursAgo / 24)}d ago` };
}

const CATEGORY_STYLE: Record<string, { bg: string; emoji: string; badge: string }> = {
  Tech:    { bg: "from-blue-50 to-indigo-100",   emoji: "💻", badge: "bg-blue-100 text-blue-700" },
  Fashion: { bg: "from-pink-50 to-rose-100",      emoji: "👗", badge: "bg-pink-100 text-pink-700" },
  Home:    { bg: "from-amber-50 to-orange-100",   emoji: "🏠", badge: "bg-amber-100 text-amber-700" },
  Food:    { bg: "from-green-50 to-emerald-100",  emoji: "🍕", badge: "bg-green-100 text-green-700" },
  Travel:  { bg: "from-sky-50 to-cyan-100",       emoji: "✈️", badge: "bg-sky-100 text-sky-700" },
  Gaming:  { bg: "from-purple-50 to-violet-100",  emoji: "🎮", badge: "bg-purple-100 text-purple-700" },
  Beauty:  { bg: "from-fuchsia-50 to-pink-100",   emoji: "💄", badge: "bg-fuchsia-100 text-fuchsia-700" },
  Other:   { bg: "from-gray-50 to-slate-100",     emoji: "🏷️", badge: "bg-gray-100 text-gray-600" },
};

export default function DealCard({ deal }: { deal: Deal }) {
  const expiry    = timeUntilExpiry(deal.expiresAt);
  const expired   = expiry === "Expired";
  const fresh     = isNew(deal.createdAt);
  const cat       = deal.category ?? "Other";
  const style     = CATEGORY_STYLE[cat] ?? CATEGORY_STYLE["Other"];
  const promoType = getPromoType(deal.title, deal.description, deal.url);
  const isPromo   = promoType !== null;

  // Inflated RRP: OzBargain posts often invent a high "was" price for cheap items.
  // If deal_price < $30 and "original" is 8x higher, suppress all discount display.
  const hasInflatedRrp =
    deal.originalPrice != null &&
    deal.dealPrice != null &&
    deal.dealPrice < 30 &&
    deal.originalPrice / deal.dealPrice >= 8;

  const discountPct = isPromo || hasInflatedRrp ? null
    : deal.discountPercentage != null ? deal.discountPercentage
    : deal.discountPct        != null ? deal.discountPct
    : deal.originalPrice && deal.dealPrice && deal.originalPrice > 0
      ? Math.round(((deal.originalPrice - deal.dealPrice) / deal.originalPrice) * 100)
      : null;

  const saveAmount = isPromo || hasInflatedRrp ? null
    : deal.originalPrice && deal.dealPrice && deal.originalPrice > deal.dealPrice
      ? deal.originalPrice - deal.dealPrice
      : null;

  const isHot    = !isPromo && discountPct != null && discountPct >= 50;
  const isEnding = !!deal.expiresAt &&
    (new Date(deal.expiresAt).getTime() - Date.now()) / 3_600_000 < 48 && !expired;

  const sourceLabel            = SOURCE_LABELS[deal.source ?? ""] ?? deal.source ?? "";
  const { hoursAgo, label: ageLabel } = listingAge(deal.createdAt);
  const isStale                = hoursAgo > 12;

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (expired) e.preventDefault();
  }

  return (
    <a
      href={expired ? undefined : affiliateUrl(deal.url)}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={expired ? "true" : undefined}
      onClick={handleClick}
      className={`group flex flex-col rounded-2xl border bg-white overflow-hidden transition-all duration-200 ${
        expired
          ? "opacity-50 cursor-not-allowed border-gray-100 shadow-sm"
          : "border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-100 cursor-pointer"
      }`}
    >
      {/* Image / placeholder */}
      <div className={`relative h-36 sm:h-44 bg-gradient-to-br ${style.bg} flex items-center justify-center overflow-hidden`}>
        {deal.imageUrl ? (
          <img
            src={deal.imageUrl}
            alt={deal.title}
            className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-6xl opacity-50 group-hover:scale-110 transition-transform duration-300">
            {style.emoji}
          </span>
        )}

        {/* Discount badge — suppressed for promo deals */}
        {!isPromo && discountPct != null && discountPct > 0 && (
          <div className="absolute top-3 right-3 flex flex-col items-center justify-center w-12 h-12 rounded-full bg-red-500 shadow-lg shadow-red-500/30 text-white">
            <span className="text-xs font-bold leading-none">-{discountPct}%</span>
            <span className="text-[9px] leading-none opacity-80">OFF</span>
          </div>
        )}

        {/* Promo type badge — replaces discount % for referral/cashback/etc. */}
        {isPromo && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-violet-600 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-md max-w-[80px] text-center leading-tight">
            <Tag className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{promoType}</span>
          </div>
        )}

        {/* Priority label: Hot > New > Ending Soon */}
        {isHot && !expired ? (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
            <Flame className="h-2.5 w-2.5" />
            HOT DEAL
          </div>
        ) : fresh && !expired ? (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md shadow-orange-500/30">
            <Zap className="h-2.5 w-2.5" />
            NEW
          </div>
        ) : isEnding ? (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
            <Timer className="h-2.5 w-2.5" />
            ENDING SOON
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-3 sm:p-4 flex-1">
        {/* Category pill */}
        <span className={`self-start text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${style.badge}`}>
          {style.emoji} {cat}
        </span>

        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">
          {deal.title}
        </p>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mt-auto pt-1 flex-wrap">
          {deal.dealPrice != null && (
            <span className="text-xl font-extrabold text-indigo-600">
              {formatPrice(deal.dealPrice, deal.currency, deal.country)}
            </span>
          )}
          {!isPromo && !hasInflatedRrp && deal.originalPrice != null && deal.originalPrice !== deal.dealPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(deal.originalPrice, deal.currency, deal.country)}
            </span>
          )}
        </div>

        {/* Save $X — suppressed for promo deals */}
        {saveAmount != null && saveAmount > 1 && (
          <span className="self-start text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded-md px-2 py-0.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3 shrink-0" />
            Save {formatPrice(saveAmount, deal.currency, deal.country)}
          </span>
        )}

        {/* Footer */}
        <div className="mt-2 pt-2.5 border-t border-gray-50 space-y-2">
          {/* Source row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm">{deal.country === "IN" ? "🇮🇳" : "🇦🇺"}</span>
              <span className="text-xs font-semibold text-gray-700 truncate">{sourceLabel}</span>
              <span className="text-[10px] text-gray-400 shrink-0">{ageLabel}</span>
            </div>
            {expiry && expiry !== "Expired" && (
              <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium shrink-0">
                <Clock className="h-3 w-3" />
                {expiry}
              </span>
            )}
            {expired && <span className="text-[11px] text-red-400 font-medium shrink-0">Expired</span>}
          </div>

          {/* Stale price warning — listing is > 12h old, price likely changed */}
          {isStale && !expired && (
            <p className="text-[10px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1 leading-snug">
              Listed {ageLabel} — verify current price on retailer site.
            </p>
          )}

          {/* CTA */}
          <div
            className={`w-full text-center text-sm font-bold py-2 rounded-xl transition-colors ${
              expired
                ? "bg-gray-100 text-gray-400"
                : "bg-blue-600 text-white group-hover:bg-blue-700"
            }`}
          >
            {expired ? "Expired" : "View Deal →"}
          </div>
        </div>
      </div>
    </a>
  );
}
