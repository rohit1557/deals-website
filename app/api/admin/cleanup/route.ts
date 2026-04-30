import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const token    = req.headers.get("x-cleanup-token") ?? "";
  const expected = process.env.CRON_SECRET ?? "";
  if (!expected || token !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, number> = {};

  // 1. Deactivate Reddit/Redd.it URL deals (broken links stored by old scraper)
  const redditResult = await db.$executeRaw`
    UPDATE deals SET is_active = false
    WHERE is_active = true
      AND (url LIKE '%reddit.com%' OR url LIKE '%redd.it%')
  `;
  results.reddit_urls_deactivated = redditResult;

  // 2. Deactivate IndiaDeals source deals with null deal_price (discussion posts / broken links)
  const nullPriceResult = await db.$executeRaw`
    UPDATE deals SET is_active = false
    WHERE is_active = true
      AND lower(source) = 'indiadeals'
      AND deal_price IS NULL
  `;
  results.india_null_price_deactivated = nullPriceResult;

  // 3. Deactivate duplicate India deals — same title+country, keep only the newest updated_at
  const dupResult = await db.$executeRaw`
    UPDATE deals d SET is_active = false
    WHERE d.is_active = true
      AND d.country   = 'IN'
      AND EXISTS (
        SELECT 1 FROM deals d2
        WHERE lower(d2.title) = lower(d.title)
          AND d2.country       = d.country
          AND d2.id           != d.id
          AND d2.updated_at   > d.updated_at
          AND d2.is_active     = true
      )
  `;
  results.duplicates_deactivated = dupResult;

  // 4. Summary of remaining India deals
  const remaining = await db.deal.count({
    where: { isActive: true, country: "IN" },
  });
  results.active_india_deals_remaining = remaining;

  return Response.json({ ok: true, results });
}
