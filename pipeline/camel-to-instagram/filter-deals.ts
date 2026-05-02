import type { RawDeal } from "./fetch-deals";

const VISUAL_CATEGORIES = ["Tech", "Gaming", "Home", "Fashion", "Beauty"];

// Only post deals with meaningful real discounts.
// OR logic: a big % drop on a cheap item OR a big saving on an expensive item both qualify.
const MIN_DROP_PCT     = 20;   // minimum % off
const MIN_SAVINGS_LOW  = 20;   // minimum $ saved (at 20%+)
const MIN_SAVINGS_HIGH = 60;   // if savings >= $60, only needs 15%+ drop
const MIN_DEAL_PRICE   = 50;   // don't post anything under $50
const MAX_AGE_HOURS    = 48;

export interface ScoredDeal extends RawDeal {
  score: number;
  category: string;
}

function guessCategory(title: string): string {
  const t = title.toLowerCase();
  if (/\b(phone|laptop|tablet|headphone|earb|speaker|camera|tv|monitor|keyboard|mouse|ssd|gpu|cpu|charger|usb|cable|router|smart\s*watch|kindle)\b/.test(t)) return "Tech";
  if (/\b(game|gaming|controller|console|playstation|xbox|nintendo|steam)\b/.test(t)) return "Gaming";
  if (/\b(shirt|pants|dress|shoe|jacket|jeans|hoodie|sneaker|boot|sock|underwear|bra)\b/.test(t)) return "Fashion";
  if (/\b(coffee|kitchen|cookware|blender|air\s*fryer|vacuum|mattress|pillow|towel|lamp|furniture)\b/.test(t)) return "Home";
  if (/\b(skincare|moistur|serum|lipstick|mascara|foundation|perfume|cologne|shampoo|conditioner)\b/.test(t)) return "Beauty";
  if (/\b(flight|hotel|resort|travel|holiday|luggage|backpack)\b/.test(t)) return "Travel";
  return "Other";
}

function scoreDeal(deal: RawDeal): number {
  let score = 0;

  // Actual drop % is primary signal
  score += (deal.dropPct ?? 0) * 3;

  // Absolute savings matter — a $200 saving at 15% beats a $5 saving at 25%
  score += Math.min(deal.savingsAbs ?? 0, 300) * 0.5;

  // Recency
  const hoursOld = (Date.now() - deal.pubDate.getTime()) / 3_600_000;
  if (hoursOld < 4)  score += 40;
  else if (hoursOld < 12) score += 20;
  else if (hoursOld < 24) score += 5;

  // Price sweet spot for AU Instagram — $30–$600
  const p = deal.dealPrice ?? 0;
  if (p >= 30 && p <= 600) score += 15;

  // Visual category bonus
  if (VISUAL_CATEGORIES.includes(guessCategory(deal.title))) score += 10;

  return score;
}

export function filterDeals(deals: RawDeal[], maxDeals = 5): ScoredDeal[] {
  const now = Date.now();

  const passed: RawDeal[] = [];

  for (const d of deals) {
    const savings  = d.savingsAbs ?? 0;
    const ageHours = (now - d.pubDate.getTime()) / 3_600_000;
    const price    = d.dealPrice ?? 0;

    let reason = "";
    if (!d.dropPct)                                                        reason = "no dropPct";
    else if (price < MIN_DEAL_PRICE)                                       reason = `price $${price} < $${MIN_DEAL_PRICE}`;
    else if (ageHours > MAX_AGE_HOURS)                                     reason = `age ${ageHours.toFixed(1)}h > ${MAX_AGE_HOURS}h`;
    else if (d.dropPct >= MIN_DROP_PCT && savings >= MIN_SAVINGS_LOW)    { passed.push(d); continue; }
    else if (d.dropPct >= 15       && savings >= MIN_SAVINGS_HIGH)       { passed.push(d); continue; }
    else reason = `drop ${d.dropPct}% savings $${savings}`;

    console.log(`[filter] SKIP "${d.title.slice(0, 60)}" — ${reason}`);
  }

  return passed
    .map(d => ({ ...d, score: scoreDeal(d), category: guessCategory(d.title) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxDeals);
}
