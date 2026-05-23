import { NextRequest } from "next/server";
import { db } from "@/lib/db";

// Node.js runtime — edge runtime kills the worker before fire-and-forget fetch completes,
// causing clicks to not be recorded. Node.js waits for the event loop to drain.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url    = searchParams.get("url");
  const dealId = searchParams.get("id") ?? "";

  if (!url) return new Response("Missing url", { status: 400 });

  // Validate URL is https before redirecting
  let target: URL;
  try {
    target = new URL(url);
    if (target.protocol !== "https:") throw new Error("non-https");
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  // Insert click directly — no HTTP hop, no fire-and-forget reliability issues
  if (dealId) {
    db.$executeRaw`
      INSERT INTO deal_clicks (deal_id, clicked_at) VALUES (${dealId}::text, NOW())
    `.catch(() => {});
  }

  return Response.redirect(target.toString(), 302);
}
