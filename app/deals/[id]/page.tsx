'use server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import type { Deal } from '@/lib/types';
import DealDetailCard from '@/components/DealDetailCard';

async function getDeal(id: string): Promise<Deal | null> {
  const deal = await db.deal.findUnique({ where: { id } });
  if (!deal) return null;
  return {
    ...deal,
    originalPrice: deal.originalPrice ? Number(deal.originalPrice) : null,
    dealPrice: deal.dealPrice ? Number(deal.dealPrice) : null,
  } as Deal;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const deal = await getDeal(params.id);
  if (!deal) return { title: 'Deal not found' };
  return {
    title: `${deal.title} — DealDrop`,
    description: deal.description || `Find this deal on DealDrop — ${deal.dealPrice ? `now ${deal.dealPrice} ` : ''}${deal.currency || 'AUD'}`,
  };
}

export default async function DealPage({ params }: { params: { id: string } }) {
  const deal = await getDeal(params.id);
  if (!deal) notFound();

  const price = deal.dealPrice || deal.originalPrice;
  const currency = deal.currency?.trim() || (deal.country === 'IN' ? 'INR' : 'AUD');
  const availability = deal.isActive && (!deal.expiresAt || new Date(deal.expiresAt) > new Date()) ? 'InStock' : 'OutOfStock';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: deal.title,
    description: deal.description,
    image: deal.imageUrl,
    ...(deal.source && {
      brand: { '@type': 'Brand', name: deal.source },
    }),
    offers: {
      '@type': 'Offer',
      url: deal.url,
      price: price?.toString(),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      ...(deal.originalPrice && deal.dealPrice && {
        priceCurrency: currency,
      }),
    },
  };

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DealDetailCard deal={deal} />
    </div>
  );
}
