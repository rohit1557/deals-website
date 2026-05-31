/**
 * Standalone OzBargain poster — runs from your local Mac (home IP bypasses Cloudflare).
 * Scheduled via launchd to run 30 min after the GitHub Actions pipeline finishes.
 *
 * Required env vars (set in .env.local or launchd plist):
 *   DATABASE_URL        — Neon connection string
 *   OZBARGAIN_COOKIES   — JSON cookies exported from browser after Google login
 *   AFFILIATE_TAG       — Amazon affiliate tag (default: dealdrop0d5-22)
 */

import type { RawDeal } from "./fetch-deals";
import { fetchDeals, fetchDealsFromDB } from "./fetch-deals";
import { filterDeals } from "./filter-deals";
import type { ScoredDeal } from "./filter-deals";
import { postToOzBargainAppleScript } from "./post-to-ozbargain-applescript";

// OzBargain accepts all categories — broader than Instagram filter
// Min 15% off, $15–$800, any category except obvious non-deals
const OZB_SKIP_RE = /\b(server rack|patch panel|cable manag|ethernet switch|network switch|plumbing|valve|gasket|industrial|programming|textbook|data center)\b/i;

function filterForOzBargain(deals: RawDeal[]): ScoredDeal[] {
  const now = Date.now();
  const passing = deals.filter(d => {
    const drop = d.dropPct ?? 0;
    const price = d.dealPrice ?? 0;
    const ageH = (now - d.pubDate.getTime()) / 3_600_000;
    return drop >= 15 && price >= 15 && price <= 800 && ageH < 48 && !OZB_SKIP_RE.test(d.title);
  });
  return passing
    .map(d => ({ ...d, score: (d.dropPct ?? 0) * 2 + Math.min(d.savingsAbs ?? 0, 200) * 0.3, category: "Other" }))
    .sort((a, b) => b.score - a.score) as ScoredDeal[];
}

async function main() {
  console.log("[ozb-local] Starting OzBargain post at", new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" }));

  const rawDeals = await fetchDeals();
  let candidates = filterForOzBargain(rawDeals);

  if (candidates.length === 0) {
    console.log("[ozb-local] No CCC deals qualify — trying DB fallback...");
    const dbDeals = await fetchDealsFromDB();
    const combined = [...rawDeals, ...dbDeals.filter(d => !rawDeals.find(r => r.asin === d.asin))];
    candidates = filterForOzBargain(combined);
  }

  if (candidates.length === 0) {
    console.log("[ozb-local] No qualifying deals today — skipping");
    process.exit(0);
  }

  console.log(`[ozb-local] Top candidates:`);
  candidates.slice(0, 5).forEach(d => console.log(`  [${d.dropPct}% off] $${d.dealPrice} — ${d.title.slice(0, 65)}`));

  const deal = candidates[0];
  console.log(`[ozb-local] Posting: [${deal.dropPct}% off] $${deal.dealPrice} — ${deal.title.slice(0, 60)}`);

  const url = await postToOzBargainAppleScript(deal);
  if (url) {
    console.log(`[ozb-local] ✅ Posted to OzBargain: ${url}`);
  } else {
    console.log("[ozb-local] Skipped");
  }
}

main().catch(err => {
  console.error("[ozb-local] Fatal:", err?.message ?? err);
  process.exit(1);
});
