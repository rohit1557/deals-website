import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { ArrowLeft, Tag, Clock } from "lucide-react";
import AffiliateButton from "@/components/AffiliateButton";

const BASE_URL = "https://dealdrop.au";
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const AMAZON_TAGS: Record<string, string> = {
  "amazon.com.au": "dealdrop0d5-22",
  "amazon.in":     "dealdrop0i1-21",
  "amazon.com":    "dealdrop0a7-20",
};

function affiliateUrl(url: string): string {
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

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-AU", {
    style: "currency",
    currency: currency || "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

async function getDeal(slug: string) {
  if (UUID_RE.test(slug)) return db.deal.findUnique({ where: { id: slug } });
  return db.deal.findUnique({ where: { slug } });
}

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const deal = await getDeal(params.slug);
  if (!deal) return { title: "Deal not found" };

  const currency   = (deal.currency as string | null) ?? "AUD";
  const dealPrice  = deal.dealPrice  ? Number(deal.dealPrice)  : null;
  const discountPct = deal.discountPct ? Number(deal.discountPct) : null;

  const priceStr    = dealPrice  ? formatPrice(dealPrice, currency) : null;
  const discountStr = discountPct ? `${Math.round(discountPct)}% off` : null;

  const titleParts = [deal.title];
  if (discountStr) titleParts.push(discountStr);
  if (priceStr)    titleParts.push(priceStr);
  const title = titleParts.join(" — ") + " | DealDrop";

  const description = [
    discountStr && priceStr
      ? `${deal.title} is ${discountStr} at ${priceStr}.`
      : `${deal.title} — great deal spotted on DealDrop.`,
    deal.description ? deal.description.slice(0, 120) : "",
    "Verified deal, updated automatically.",
  ].filter(Boolean).join(" ");

  const canonical = `${BASE_URL}/deals/${deal.slug ?? deal.id}`;

  return {
    title,
    description,
    openGraph: {
      title, description, url: canonical, type: "website",
      ...(deal.imageUrl ? { images: [{ url: deal.imageUrl }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical },
  };
}

export default async function DealPage({ params }: Props) {
  const deal = await getDeal(params.slug);
  if (!deal) notFound();

  // Redirect old UUID links → slug URL
  if (UUID_RE.test(params.slug) && deal.slug) redirect(`/deals/${deal.slug}`);

  const currency     = (deal.currency as string | null) ?? "AUD";
  const dealPrice    = deal.dealPrice    ? Number(deal.dealPrice)    : null;
  const originalPrice = deal.originalPrice ? Number(deal.originalPrice) : null;
  const discountPct  = deal.discountPct  ? Number(deal.discountPct)  : null;
  const outUrl       = `/out?url=${encodeURIComponent(affiliateUrl(deal.url))}&id=${deal.id}`;

  // JSON-LD structured data — Google Product + Offer rich snippet
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: deal.title,
    description: deal.description ?? undefined,
    image: deal.imageUrl ?? undefined,
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/deals/${deal.slug ?? deal.id}`,
      priceCurrency: currency,
      ...(dealPrice != null ? { price: dealPrice.toFixed(2) } : {}),
      availability: deal.isActive
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "DealDrop" },
      ...(deal.expiresAt ? { priceValidUntil: new Date(deal.expiresAt).toISOString().split("T")[0] } : {}),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-2xl mx-auto">
        <a href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to deals
        </a>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {deal.imageUrl && (
            <div className="h-64 bg-gray-50 flex items-center justify-center p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={deal.imageUrl} alt={deal.title} className="h-full object-contain" />
            </div>
          )}

          <div className="p-6 space-y-4">
            <h1 className="text-xl font-bold text-gray-900">{deal.title}</h1>

            <div className="flex items-baseline gap-3 flex-wrap">
              {dealPrice != null && (
                <span className="text-3xl font-bold text-green-600">
                  {formatPrice(dealPrice, currency)}
                </span>
              )}
              {originalPrice != null && originalPrice > (dealPrice ?? 0) && (
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(originalPrice, currency)}
                </span>
              )}
              {discountPct != null && discountPct > 0 && (
                <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-full">
                  -{Math.round(discountPct)}%
                </span>
              )}
            </div>

            {deal.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{deal.description}</p>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              {deal.category && (
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" /> {deal.category}
                </span>
              )}
              {deal.source && (
                <span className="capitalize">via {deal.source}</span>
              )}
              {deal.expiresAt && (
                <span className="flex items-center gap-1 text-amber-500">
                  <Clock className="h-4 w-4" />
                  Expires {new Date(deal.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <AffiliateButton
              href={outUrl}
              dealId={deal.id}
              dealTitle={deal.title}
              dealSource={deal.source}
              dealCategory={deal.category}
              dealPrice={dealPrice}
              currency={currency}
            />

            <p className="text-center text-xs text-gray-400">
              Affiliate link · Price may have changed · Always verify on the retailer site
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
