"use client";
import type { MouseEvent } from "react";
import { ExternalLink, Tag, Clock, Zap } from "lucide-react";
import type { Deal } from "@/lib/types";

const AMAZON_TAGS: Record<string, string> = {
  "amazon.com.au": "dealdrop0d5-22",
  "amazon.com":    "dealdrop0a7-20",
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

function formatPrice(price: number | null, currency?: string): string | null {
  if (price == null) return null;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency?.trim() || "AUD",
    minimumFractionDigits: 2,
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
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
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
  const expiry   = timeUntilExpiry(deal.expiresAt);
  const expired  = expiry === "Expired";
  const fresh    = isNew(deal.createdAt);
  const cat      = deal.category ?? "Other";
  const style    = CATEGORY_STYLE[cat] ?? CATEGORY_STYLE["Other"];
  const discountPct =
    deal.discountPercentage != null ? deal.discountPercentage
    : deal.discountPct != null      ? deal.discountPct
    : deal.originalPrice && deal.dealPrice && deal.originalPrice > 0
      ? Math.round(((deal.originalPrice - deal.dealPrice) / deal.originalPrice) * 100)
      : null;
  const showPct = discountPct != null && discountPct > 0;

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
          : "border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-100"
      }`}
    >
      {/* Image / placeholder */}
      <div className={`relative h-44 bg-gradient-to-br ${style.bg} flex items-center justify-center overflow-hidden`}>
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

        {/* Discount badge */}
        {showPct && (
          <div className="absolute top-3 right-3 flex flex-col items-center justify-center w-12 h-12 rounded-full bg-red-500 shadow-lg shadow-red-500/30 text-white">
            <span className="text-xs font-bold leading-none">-{discountPct}%</span>
            <span className="text-[9px] leading-none opacity-80">OFF</span>
          </div>
        )}

        {/* NEW badge */}
        {fresh && !expired && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md shadow-orange-500/30">
            <Zap className="h-2.5 w-2.5" />
            NEW
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">
          {deal.title}
        </p>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mt-auto pt-1">
          {deal.dealPrice != null && (
            <span className="text-xl font-extrabold text-indigo-600">
              {formatPrice(deal.dealPrice, deal.currency)}
            </span>
          )}
          {deal.originalPrice != null && deal.originalPrice !== deal.dealPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(deal.originalPrice, deal.currency)}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
            {style.emoji} {cat}
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {expiry && expiry !== "Expired" && (
              <span className="flex items-center gap-1 text-amber-500 font-medium">
                <Clock className="h-3 w-3" />
                {expiry}
              </span>
            )}
            {expired && <span className="text-red-400 font-medium">Expired</span>}
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </a>
  );
}
