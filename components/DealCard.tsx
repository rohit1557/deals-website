import { ExternalLink, Tag, Clock } from "lucide-react";
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

function formatPrice(price: number | null) {
  if (price == null) return null;
  return `$${price.toFixed(2)}`;
}

function timeUntilExpiry(expiresAt: Date | null): string | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

const CATEGORY_STYLE: Record<string, { bg: string; emoji: string }> = {
  Tech:    { bg: "from-blue-50 to-indigo-100",   emoji: "💻" },
  Fashion: { bg: "from-pink-50 to-rose-100",      emoji: "👗" },
  Home:    { bg: "from-amber-50 to-orange-100",   emoji: "🏠" },
  Food:    { bg: "from-green-50 to-emerald-100",  emoji: "🍕" },
  Travel:  { bg: "from-sky-50 to-cyan-100",       emoji: "✈️" },
  Gaming:  { bg: "from-purple-50 to-violet-100",  emoji: "🎮" },
  Beauty:  { bg: "from-fuchsia-50 to-pink-100",   emoji: "💄" },
  Other:   { bg: "from-gray-50 to-slate-100",     emoji: "🏷️" },
};

export default function DealCard({ deal }: { deal: Deal }) {
  const expiry  = timeUntilExpiry(deal.expiresAt);
  const cat     = deal.category ?? "Other";
  const style   = CATEGORY_STYLE[cat] ?? CATEGORY_STYLE["Other"];
  const showPct = deal.discountPct != null && deal.discountPct > 0;

  return (
    <a
      href={affiliateUrl(deal.url)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Image / placeholder */}
      <div className={`relative h-40 bg-gradient-to-br ${style.bg} flex items-center justify-center overflow-hidden`}>
        {deal.imageUrl ? (
          <img
            src={deal.imageUrl}
            alt={deal.title}
            className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform"
          />
        ) : (
          <span className="text-5xl opacity-60 group-hover:scale-110 transition-transform">
            {style.emoji}
          </span>
        )}
        {showPct && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
            -{deal.discountPct}%
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
          {deal.title}
        </p>

        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          {deal.dealPrice != null && (
            <span className="text-lg font-bold text-green-600">
              {formatPrice(deal.dealPrice)}
            </span>
          )}
          {deal.originalPrice != null && deal.originalPrice !== deal.dealPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(deal.originalPrice)}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
          <span className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {cat}
          </span>
          <span className="capitalize">{deal.source}</span>
          {expiry && (
            <span className="flex items-center gap-1 text-amber-500">
              <Clock className="h-3 w-3" />
              {expiry}
            </span>
          )}
          <ExternalLink className="h-3 w-3" />
        </div>
      </div>
    </a>
  );
}
