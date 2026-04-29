import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { dealId } = await req.json();
    if (dealId) {
      await db.$executeRaw`
        INSERT INTO deal_clicks (deal_id, clicked_at)
        VALUES (${dealId}::text, NOW())
      `;
    }
  } catch {
    // Swallow errors — click tracking must never break the user flow
  }
  return new Response(null, { status: 204 });
}
