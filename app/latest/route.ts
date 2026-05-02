import { db } from "@/lib/db";
import { NextRequest } from "next/server";

const FALLBACK = "https://dealdrop.au";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "CDN-Cache-Control": "no-store",
};

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url, ...NO_CACHE } });
}

export async function GET(_req: NextRequest) {
  // 1. Try the latest Instagram-posted deal URL
  try {
    const rows = await db.$queryRaw<{ url: string }[]>`
      SELECT url FROM instagram_latest_deal LIMIT 1
    `;
    const url = rows[0]?.url;
    if (url) return redirect(url);
  } catch {
    // Table not created yet — fall through
  }

  // 2. Fall back to top Amazon AU deal from the main deals table
  try {
    const deal = await db.deal.findFirst({
      where: {
        isActive: true,
        country:  "AU",
        url:      { contains: "amazon.com.au" },
      },
      orderBy: { discountPct: "desc" },
      select:  { url: true },
    });
    if (deal?.url) return redirect(deal.url);
  } catch {
    // DB unavailable — fall through to homepage
  }

  return redirect(FALLBACK);
}
