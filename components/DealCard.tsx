import React from "react";

interface Deal {
  id: string;
  title: string;
  /** Price in the deal's original currency — do NOT hardcode or override this */
  price: number;
  currency: string;
  originalPrice?: number;
  merchantLogoUrl?: string;
  dealUrl: string;
  expiresAt?: string;
  category?: string;
}

interface DealCardProps {
  deal: Deal;
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency ?? "AUD",
    minimumFractionDigits: 2,
  }).format(price);
}

function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export function DealCard({ deal }: DealCardProps) {
  const expired = isExpired(deal.expiresAt);
  const hasDiscount =
    deal.originalPrice !== undefined && deal.originalPrice > deal.price;
  const discountPct = hasDiscount
    ? Math.round(((deal.originalPrice! - deal.price) / deal.originalPrice!) * 100)
    : null;

  return (
    <a
      href={deal.dealUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
        expired ? "opacity-50 grayscale pointer-events-none" : ""
      }`}
    >
      <div className="flex flex-col gap-3 p-4">
        {deal.merchantLogoUrl ? (
          <img
            src={deal.merchantLogoUrl}
            alt="Merchant logo"
            className="h-8 w-auto object-contain"
          />
        ) : (
          <div className="h-8 w-16 rounded bg-gray-100" />
        )}

        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-indigo-600">
          {deal.title}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-indigo-600">
            {formatPrice(deal.price, deal.currency)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(deal.originalPrice!, deal.currency)}
            </span>
          )}
        </div>

        {discountPct !== null && (
          <span className="w-fit rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            -{discountPct}% off
          </span>
        )}

        {expired && (
          <span className="w-fit rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-500">
            Expired
          </span>
        )}
      </div>
    </a>
  );
}

export default DealCard;
