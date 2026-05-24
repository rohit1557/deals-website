import { Client } from "pg";

const AFFILIATE_TAG = process.env.AFFILIATE_TAG ?? "dealdrop0d5-22";

// CCC AU top_drops feed — 20 items, updated throughout the day.
// Category params are silently ignored by CCC AU (all return same feed).
const FEEDS = [
  "https://au.camelcamelcamel.com/top_drops/feed",
];

export interface RawDeal {
  title: string;
  asin: string;
  amazonUrl: string;
  dealPrice: number | null;
  originalPrice: number | null;
  dropPct: number | null;      // real recent drop %, parsed from title
  savingsAbs: number | null;   // absolute dollar savings, parsed from title
  pubDate: Date;
  description: string;
}

function extractAsin(url: string): string | null {
  const m = url.match(/\/product\/([A-Z0-9]{10})\b/);
  return m ? m[1] : null;
}

// CCC title format: "Product Name - down 30.37% ($23.99) to $55.00 from $78.99"
function parseCccTitle(title: string): {
  dropPct: number | null;
  savingsAbs: number | null;
  dealPrice: number | null;
  originalPrice: number | null;
  cleanTitle: string;
} {
  const m = title.match(
    /^(.*?)\s*-\s*down\s+([\d.]+)%\s*\(\$([\d,]+\.?\d*)\)\s*to\s+\$([\d,]+\.?\d*)\s*from\s+\$([\d,]+\.?\d*)/i,
  );
  if (m) {
    return {
      cleanTitle:    m[1].trim(),
      dropPct:       Math.round(parseFloat(m[2])),
      savingsAbs:    parseFloat(m[3].replace(/,/g, "")),
      dealPrice:     parseFloat(m[4].replace(/,/g, "")),
      originalPrice: parseFloat(m[5].replace(/,/g, "")),
    };
  }
  return { dropPct: null, savingsAbs: null, dealPrice: null, originalPrice: null, cleanTitle: title };
}

function parseXmlText(xml: string): string {
  return xml
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

async function fetchFeed(url: string): Promise<RawDeal[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; DealDrop/1.0; +https://dealdrop.au)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();

  const deals: RawDeal[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemPattern.exec(xml)) !== null) {
    const item = match[1];

    const rawTitle   = parseXmlText(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const rawLink    = parseXmlText(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "");
    const rawPubDate = parseXmlText(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "");

    if (!rawTitle || !rawLink) continue;

    const asin = extractAsin(rawLink);
    if (!asin) continue;

    const { dropPct, savingsAbs, dealPrice, originalPrice, cleanTitle } = parseCccTitle(rawTitle);

    let pubDate: Date;
    try { pubDate = new Date(rawPubDate); } catch { pubDate = new Date(); }

    deals.push({
      title:         cleanTitle || rawTitle,
      asin,
      amazonUrl:     `https://www.amazon.com.au/dp/${asin}?tag=${AFFILIATE_TAG}`,
      dealPrice,
      originalPrice,
      dropPct,
      savingsAbs,
      pubDate,
      description:   "",
    });
  }

  return deals;
}

export async function fetchDeals(): Promise<RawDeal[]> {
  const seen = new Set<string>();
  const all: RawDeal[] = [];

  for (const feed of FEEDS) {
    try {
      const deals = await fetchFeed(feed);
      for (const d of deals) {
        if (!seen.has(d.asin)) {
          seen.add(d.asin);
          all.push(d);
        }
      }
      console.log(`[fetch-deals] ${deals.length} items from ${feed}`);
  deals.slice(0, 3).forEach(d =>
    console.log(`[fetch-deals] sample title: "${d.title}" drop=${d.dropPct}% price=$${d.dealPrice} savings=$${d.savingsAbs}`)
  );
    } catch (err) {
      console.warn(`[fetch-deals] Failed to fetch ${feed}:`, err);
    }
  }

  console.log(`[fetch-deals] ${all.length} unique deals from CCC feeds`);
  return all;
}

// Fallback: pull Instagram-worthy deals from our own DB when CCC has nothing
export async function fetchDealsFromDB(): Promise<RawDeal[]> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn("[fetch-deals] No DATABASE_URL — skipping DB fallback");
    return [];
  }

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const { rows } = await client.query<{
      title: string; url: string; deal_price: string | null;
      original_price: string | null; discount_pct: number | null; created_at: Date;
    }>(`
      SELECT title, url, deal_price, original_price, discount_pct, created_at
      FROM deals
      WHERE url LIKE '%amazon.com.au%'
        AND category IN ('Tech','Gaming','Fashion','Beauty','Fragrance','Home','Kitchen')
        AND discount_pct >= 20
        AND deal_price IS NOT NULL
        AND deal_price::numeric BETWEEN 25 AND 500
        AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY discount_pct DESC, created_at DESC
      LIMIT 30
    `);
    await client.end();

    const deals: RawDeal[] = [];
    for (const row of rows) {
      const asinMatch = row.url.match(/\/dp\/([A-Z0-9]{10})/);
      if (!asinMatch) continue;
      const asin = asinMatch[1];
      const dealPrice     = row.deal_price     ? parseFloat(row.deal_price)     : null;
      const originalPrice = row.original_price ? parseFloat(row.original_price) : null;
      const savingsAbs    = dealPrice && originalPrice ? parseFloat((originalPrice - dealPrice).toFixed(2)) : null;

      // Strip DB title suffix (e.g. " - down 30.00% ($49.50) to $115.50 from $165.00")
      const cleanTitle = row.title.replace(/\s*-\s*down\s+[\d.]+%.*$/i, "").trim();

      deals.push({
        title:         cleanTitle,
        asin,
        amazonUrl:     row.url.includes("tag=") ? row.url : `${row.url}${row.url.includes("?") ? "&" : "?"}tag=${AFFILIATE_TAG}`,
        dealPrice,
        originalPrice,
        dropPct:       row.discount_pct,
        savingsAbs,
        pubDate:       row.created_at,
        description:   "",
      });
    }

    console.log(`[fetch-deals] ${deals.length} deals from DB fallback`);
    return deals;
  } catch (err) {
    console.warn("[fetch-deals] DB fallback failed:", err);
    try { await client.end(); } catch {}
    return [];
  }
}
