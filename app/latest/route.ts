import { db } from "@/lib/db";
import { NextRequest } from "next/server";

const FALLBACK = "https://dealdrop.au";

export async function GET(_req: NextRequest) {
  // 1. Try the latest Instagram-posted deal URL
  try {
    const rows = await db.$queryRaw<{ url: string }[]>`
      SELECT url FROM instagram_latest_deal LIMIT 1
    `;
    const url = rows[0]?.url;
    if (url) return Response.redirect(url, 302);
  } catch {
    // Table not created yet — fall through
  }

  // 2. Fall back to the top deal from the main deals table
  try {
    const deal = await db.deal.findFirst({
      where: { isActive: true },
      orderBy: { discountPct: "desc" },
      select: { url: true },
    });
    if (deal?.url) return Response.redirect(deal.url, 302);
  } catch {
    // DB unavailable — fall through to homepage
  }

  return Response.redirect(FALLBACK, 302);
}
