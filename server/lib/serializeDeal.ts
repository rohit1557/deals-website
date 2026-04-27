import { Decimal } from "@prisma/client/runtime/library";

export type RawDeal = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  originalPrice: Decimal | null;
  dealPrice: Decimal | null;
  currency: string;
  discountPct: number | null;
  category: string | null;
  source: string | null;
  expiresAt: Date | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type SerializedDeal = ReturnType<typeof serializeDeal>;

/**
 * Converts a raw Prisma Deal row into a plain JSON-safe object.
 *
 * WHY: Prisma returns `numeric` columns as Decimal objects (decimal.js).
 * They are NOT plain JS numbers and will either silently corrupt or throw
 * during JSON serialization. Always pipe DB rows through here before returning
 * from any tRPC procedure or API route.
 *
 * Prices are returned as numbers with full precision via Decimal.toNumber().
 * Dates are ISO strings so tRPC/JSON doesn't mangle timezone info.
 */
export function serializeDeal(deal: RawDeal) {
  return {
    id: deal.id,
    title: deal.title,
    description: deal.description,
    url: deal.url,
    imageUrl: deal.imageUrl,
    originalPrice: deal.originalPrice != null ? deal.originalPrice.toNumber() : null,
    dealPrice: deal.dealPrice != null ? deal.dealPrice.toNumber() : null,
    // currency is non-nullable — frontend Deal interface requires it.
    currency: deal.currency,
    discountPct: deal.discountPct,
    category: deal.category,
    source: deal.source,
    expiresAt: deal.expiresAt?.toISOString() ?? null,
    isActive: deal.isActive,
    createdAt: deal.createdAt?.toISOString() ?? null,
    updatedAt: deal.updatedAt?.toISOString() ?? null,
  };
}
