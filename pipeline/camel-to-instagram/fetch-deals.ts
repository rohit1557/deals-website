import { Client } from "pg";

const AFFILIATE_TAG = process.env.AFFILIATE_TAG ?? "dealdrop0d5-22";

export interface RawDeal {
  title: string;
  asin: string;
  amazonUrl: string;
  dealPrice: number | null;
  originalPrice: number | null;
  dropPct: number | null;
  pubDate: Date;
  description: string;
}

function extractAsin(url: string): string | null {
  const m = url.match(/\/dp\/([A-Z0-9]{10})\b/);
  return m ? m[1] : null;
}

export async function fetchDeals(): Promise<RawDeal[]> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const result = await client.query(`
      SELECT title, url, deal_price, original_price, discount_pct, updated_at AS created_at, description
      FROM deals
      WHERE is_active = true
        AND source = 'camelcamelcamel'
        AND discount_pct >= 20
        AND url ~ '/dp/[A-Z0-9]{10}'
      ORDER BY discount_pct DESC
      LIMIT 20
    `);

    const deals: RawDeal[] = [];
    for (const row of result.rows) {
      const asin = extractAsin(row.url);
      if (!asin) continue;
      deals.push({
        title: row.title,
        asin,
        amazonUrl: `https://www.amazon.com.au/dp/${asin}?tag=${AFFILIATE_TAG}`,
        dealPrice: row.deal_price ? Number(row.deal_price) : null,
        originalPrice: row.original_price ? Number(row.original_price) : null,
        dropPct: row.discount_pct,
        pubDate: new Date(row.created_at),
        description: row.description ?? "",
      });
    }

    console.log(`[fetch-deals] Got ${deals.length} CCC deals from database`);
    return deals;
  } finally {
    await client.end();
  }
}
