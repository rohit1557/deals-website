import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

interface WeeklyDeal {
  title: string;
  source: string | null;
  discount_pct: number | null;
  original_price: number | null;
  deal_price: number | null;
  url: string;
}

const serializeDeal = (deal: any): WeeklyDeal => ({
  title: deal.title,
  source: deal.source,
  discount_pct: deal.discount_pct,
  original_price: deal.original_price instanceof Decimal ? deal.original_price.toNumber() : deal.original_price,
  deal_price: deal.deal_price instanceof Decimal ? deal.deal_price.toNumber() : deal.deal_price,
  url: deal.url,
});

export async function GET(request: NextRequest) {
  try {
    const deals = await db.$queryRaw<any[]>`
      SELECT title, source, discount_pct, original_price, deal_price, url
      FROM deals
      WHERE created_at > NOW() - INTERVAL '7 days'
        AND discount_pct IS NOT NULL
      ORDER BY discount_pct DESC
      LIMIT 3
    `;

    const serialized = deals.map(serializeDeal);
    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch weekly top deals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
