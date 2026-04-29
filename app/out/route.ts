import { NextRequest } from "next/server";

export const runtime = "edge";

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

  // Fire-and-forget click tracking — don't await, don't slow the redirect
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dealdrop.au";
  fetch(`${siteUrl}/api/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dealId }),
  }).catch(() => {});

  return Response.redirect(target.toString(), 302);
}
