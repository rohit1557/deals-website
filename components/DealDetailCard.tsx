'use client';
import { Clock, Share2, ExternalLink } from 'lucide-react';
import type { Deal } from '@/lib/types';

function formatPrice(price: number | null, currency?: string | null, country?: string | null): string | null {
  if (price == null) return null;
  const curr = currency?.trim() || (country === 'IN' ? 'INR' : 'AUD');
  const locale = curr === 'INR' ? 'en-IN' : 'en-AU';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: curr,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function timeUntilExpiry(expiresAt: Date | null): string | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

export default function DealDetailCard({ deal }: { deal: Deal }) {
  const expiry = timeUntilExpiry(deal.expiresAt);
  const expired = expiry === 'Expired';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-lg">
        {deal.imageUrl && (
          <div className="h-80 bg-gray-50 flex items-center justify-center">
            <img src={deal.imageUrl} alt={deal.title} className="h-full w-full object-contain p-8" />
          </div>
        )}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{deal.title}</h1>
            {deal.description && <p className="text-gray-600 text-lg leading-relaxed">{deal.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
            {deal.dealPrice && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Deal Price</p>
                <p className="text-2xl font-bold text-indigo-600">{formatPrice(deal.dealPrice, deal.currency, deal.country)}</p>
              </div>
            )}
            {deal.originalPrice && deal.dealPrice && deal.originalPrice !== deal.dealPrice && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Was</p>
                <p className="text-2xl font-bold text-gray-400 line-through">{formatPrice(deal.originalPrice, deal.currency, deal.country)}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm"><span className="font-semibold text-gray-700">Source:</span> {deal.source}</p>
            {deal.category && <p className="text-sm"><span className="font-semibold text-gray-700">Category:</span> {deal.category}</p>}
            {deal.country && <p className="text-sm"><span className="font-semibold text-gray-700">Country:</span> {deal.country === 'IN' ? '🇮🇳 India' : '🇦🇺 Australia'}</p>}
            {expiry && (
              <p className={`text-sm flex items-center gap-1 ${expired ? 'text-red-600' : 'text-amber-600'}`}>
                <Clock className="h-4 w-4" />
                {expired ? 'Expired' : `Expires in ${expiry}`}
              </p>
            )}
          </div>

          <a
            href={deal.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              expired
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            <ExternalLink className="h-5 w-5" />
            View Deal on Retailer
          </a>

          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>Always verify prices and availability on retailer site before purchasing.</p>
            <a href="/about#disclosure" className="text-blue-600 hover:underline">Affiliate disclosure</a>
          </div>
        </div>
      </div>
    </div>
  );
}
