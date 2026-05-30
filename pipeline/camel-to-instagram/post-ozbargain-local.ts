/**
 * Standalone OzBargain poster — runs from your local Mac (home IP bypasses Cloudflare).
 * Scheduled via launchd to run 30 min after the GitHub Actions pipeline finishes.
 *
 * Required env vars (set in .env.local or launchd plist):
 *   DATABASE_URL        — Neon connection string
 *   OZBARGAIN_COOKIES   — JSON cookies exported from browser after Google login
 *   AFFILIATE_TAG       — Amazon affiliate tag (default: dealdrop0d5-22)
 */

import "dotenv/config";
import path from "path";
import { fetchDeals, fetchDealsFromDB } from "./fetch-deals";
import { filterDeals } from "./filter-deals";
import { postToOzBargain } from "./post-to-ozbargain";

// Load .env.local from project root if no DATABASE_URL set
if (!process.env.DATABASE_URL) {
  try {
    require("dotenv").config({ path: path.resolve(__dirname, "../../.env.local") });
  } catch {}
}

async function main() {
  console.log("[ozb-local] Starting OzBargain post at", new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" }));

  // Get today's top deal — same logic as the main pipeline
  let rawDeals = await fetchDeals();
  let filtered = filterDeals(rawDeals, 5);

  if (filtered.length === 0) {
    console.log("[ozb-local] No CCC deals passed filter — trying DB fallback...");
    const dbDeals = await fetchDealsFromDB();
    const combined = [...rawDeals, ...dbDeals.filter(d => !rawDeals.find(r => r.asin === d.asin))];
    filtered = filterDeals(combined, 5);
  }

  if (filtered.length === 0) {
    console.log("[ozb-local] No qualifying deals today — skipping OzBargain post");
    process.exit(0);
  }

  // Pick best deal: prefer 20%+ off, non-Other category
  const deal = filtered.find(d => (d.dropPct ?? 0) >= 20 && d.category !== "Other") ?? filtered[0];
  console.log(`[ozb-local] Posting: [${deal.dropPct}% off] $${deal.dealPrice} — ${deal.title.slice(0, 60)}`);

  const url = await postToOzBargain(deal);
  if (url) {
    console.log(`[ozb-local] ✅ Posted to OzBargain: ${url}`);
  } else {
    console.log("[ozb-local] Skipped (no cookies set or post failed)");
  }
}

main().catch(err => {
  console.error("[ozb-local] Fatal:", err?.message ?? err);
  process.exit(1);
});
