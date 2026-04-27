import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ExternalLink, ArrowLeft, Tag, Clock } from "lucide-react";

const AMAZON_TAGS: Record<string, string> = {
  "amazon.com.au": "dealdrop0d5-22",
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

interface Props {
  params: { id: string };
}

export default async function DealPage({ params }: Props) {
  const deal = await db.deal.findUnique({ where: { id: params.id } });
  if (!deal) notFound();

  const dealPrice     = deal.dealPrice     ? Number(deal.dealPrice)     : null;
  const originalPrice = deal.originalPrice ? Number(deal.originalPrice) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <a href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to deals
      </a>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {deal.imageUrl && (
          <div className="h-64 bg-gray-50 flex items-center justify-center p-8">
            <img src={deal.imageUrl} alt={deal.title} className="h-full object-contain" />
          </div>
        )}

        <div className="p-6 space-y-4">
          <h1 className="text-xl font-bold text-gray-900">{deal.title}</h1>

          <div className="flex items-baseline gap-3">
            {dealPrice != null && (
              <span className="text-3xl font-bold text-green-600">${dealPrice.toFixed(2)}</span>
            )}
            {originalPrice != null && (
              <span className="text-lg text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
            )}
            {deal.discountPct != null && (
              <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-full">
                -{deal.discountPct}%
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

          <a
            href={affiliateUrl(deal.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Get this deal <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
