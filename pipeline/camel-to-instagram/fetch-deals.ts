import Parser from "rss-parser";

const AFFILIATE_TAG = process.env.AFFILIATE_TAG ?? "dealdrop0d5-22";

const FEEDS = [
  "https://au.camelcamelcamel.com/top_drops/feed",
  "https://camelcamelcamel.com/top_drops/feed",
];

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

function extractAsin(link: string): string | null {
  const m = link.match(/\/product\/([A-Z0-9]{10})\b/);
  return m ? m[1] : null;
}

function parsePrices(text: string): { deal: number | null; was: number | null; drop: number | null } {
  const nowM  = text.match(/[Nn]ow[:\s]+\$?([\d,]+\.?\d*)/);
  const wasM  = text.match(/[Ww]as[:\s]+\$?([\d,]+\.?\d*)/);
  const dropM = text.match(/[Dd]rop[:\s]+(\d+)%/);
  return {
    deal: nowM  ? parseFloat(nowM[1].replace(/,/g, ""))  : null,
    was:  wasM  ? parseFloat(wasM[1].replace(/,/g, ""))  : null,
    drop: dropM ? parseInt(dropM[1], 10) : null,
  };
}

function cleanTitle(title: string): string {
  return title.replace(/^Price\s+Drop[:\s]+/i, "").trim();
}

export async function fetchDeals(): Promise<RawDeal[]> {
  const parser = new Parser({ timeout: 15000 });

  for (const feedUrl of FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const deals: RawDeal[] = [];

      for (const item of feed.items ?? []) {
        const link = item.link ?? "";
        const asin = extractAsin(link);
        if (!asin) continue;

        const title = cleanTitle(item.title ?? "");
        const desc  = item.contentSnippet ?? item.content ?? "";
        const text  = `${desc} ${title}`;
        const { deal, was, drop } = parsePrices(text);

        // Require at least a deal price to be useful
        if (!deal) continue;

        const computedDrop = drop ?? (
          was && was > deal ? Math.round((1 - deal / was) * 100) : null
        );

        deals.push({
          title,
          asin,
          amazonUrl: `https://www.amazon.com.au/dp/${asin}?tag=${AFFILIATE_TAG}`,
          dealPrice: deal,
          originalPrice: was,
          dropPct: computedDrop,
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          description: desc,
        });
      }

      console.log(`[fetch-deals] Got ${deals.length} deals from ${feedUrl}`);
      return deals;
    } catch (err) {
      console.warn(`[fetch-deals] Feed ${feedUrl} failed: ${err}`);
    }
  }

  return [];
}
