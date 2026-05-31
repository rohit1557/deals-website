import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { ArrowLeft, Tag, Clock, Instagram, TrendingDown } from "lucide-react";
import AffiliateButton from "@/components/AffiliateButton";

export const revalidate = 1800;

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

const ASIN_RE = /^[A-Z0-9]{10}$/;

async function getDeal(slug: string) {
  if (UUID_RE.test(slug)) return db.deal.findUnique({ where: { id: slug } });
  // ASIN lookup — OzBargain links use /deals/B0ABCDEF12 format
  if (ASIN_RE.test(slug)) {
    return db.deal.findFirst({
      where: { url: { contains: `/dp/${slug}` }, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }
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
  const title = titleParts.join(" — ") + " | DealDrop AU";

  const description = [
    discountStr && priceStr
      ? `${deal.title} is ${discountStr} at ${priceStr}.`
      : `${deal.title} — great deal spotted on DealDrop AU.`,
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

  const savings = originalPrice && dealPrice ? originalPrice - dealPrice : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-2xl mx-auto">
        <a href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-6">
          <ArrowLeft className="h-4 w-4" /> All deals
        </a>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Product image */}
          {deal.imageUrl && (
            <div className="bg-gray-50 flex items-center justify-center p-8 h-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={deal.imageUrl} alt={deal.title} className="h-full object-contain" />
            </div>
          )}

          <div className="p-6 space-y-5">
            {/* Category + source */}
            <div className="flex flex-wrap gap-2 text-xs">
              {deal.category && (
                <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  <Tag className="h-3 w-3" /> {deal.category}
                </span>
              )}
              {deal.source && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                  via {deal.source}
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-gray-900 leading-snug">{deal.title}</h1>

            {/* Price block */}
            <div className="bg-green-50 rounded-xl p-4 space-y-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                {dealPrice != null && (
                  <span className="text-4xl font-bold text-green-700">
                    {formatPrice(dealPrice, currency)}
                  </span>
                )}
                {originalPrice != null && originalPrice > (dealPrice ?? 0) && (
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(originalPrice, currency)}
                  </span>
                )}
                {discountPct != null && discountPct > 0 && (
                  <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-1 rounded-full">
                    -{Math.round(discountPct)}% OFF
                  </span>
                )}
              </div>
              {savings != null && savings > 0 && (
                <p className="flex items-center gap-1 text-sm text-green-700 font-medium">
                  <TrendingDown className="h-4 w-4" />
                  You save {formatPrice(savings, currency)} on this deal
                </p>
              )}
            </div>

            {deal.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{deal.description}</p>
            )}

            {deal.expiresAt && (
              <p className="flex items-center gap-1.5 text-sm text-amber-600">
                <Clock className="h-4 w-4" />
                Deal expires {new Date(deal.expiresAt).toLocaleDateString("en-AU")}
              </p>
            )}

            {/* Main CTA */}
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
              #ad · As an Amazon Associate we earn from qualifying purchases · Price may vary
            </p>
          </div>
        </div>

        {/* Instagram CTA */}
        <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-2.5 shrink-0">
            <Instagram className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">Get daily deals on Instagram</p>
            <p className="text-xs text-gray-500">Follow @dealdrop.au for the best Amazon AU price drops every day</p>
          </div>
          <a
            href="https://instagram.com/dealdrop.au"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap"
          >
            Follow
          </a>
        </div>

        {/* More deals link */}
        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-blue-600 hover:underline">
            Browse all deals on DealDrop AU →
          </a>
        </div>
      </div>
    </>
  );
}
