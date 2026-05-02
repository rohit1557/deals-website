import { db } from "@/lib/db";
import { NextRequest } from "next/server";

const FALLBACK = "https://dealdrop.au";

export async function GET(_req: NextRequest) {
  try {
    const rows = await db.$queryRaw<{ url: string }[]>`
      SELECT url FROM instagram_latest_deal LIMIT 1
    `;
    const url = rows[0]?.url;
    if (url) return Response.redirect(url, 302);
  } catch {
    // Table may not exist yet or DB unavailable — fall through to homepage
  }
  return Response.redirect(FALLBACK, 302);
}
