import { ExternalLink, Tag, Clock } from "lucide-react";
import type { Deal } from "@/lib/types";

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

export default function DealCard({ deal }: { deal: Deal }) {
  const expiry = timeUntilExpiry(deal.expiresAt);

  return (
    <a
      href={deal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
        {deal.imageUrl ? (
          <img
            src={deal.imageUrl}
            alt={deal.title}
            className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="text-4xl">🏷️</div>
        )}
        {deal.discountPct != null && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
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
          {deal.originalPrice != null && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(deal.originalPrice)}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
          <span className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {deal.category ?? "Other"}
          </span>
          <span className="flex items-center gap-1 capitalize">
            {deal.source}
          </span>
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
