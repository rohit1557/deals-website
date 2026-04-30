import type { RawDeal } from "./fetch-deals";

const VISUAL_CATEGORIES = ["Tech", "Gaming", "Home", "Fashion", "Beauty"];

// Only post deals with meaningful real discounts
const MIN_DROP_PCT   = 10;   // minimum % off from recent high
const MIN_SAVINGS    = 15;   // minimum dollar savings (AUD) — filters out tiny drops
const MAX_AGE_HOURS  = 48;   // CCC top-drops are very fresh; reject anything older

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

  return deals
    .filter(d => {
      if (!d.dropPct || d.dropPct < MIN_DROP_PCT) return false;
      if (!d.savingsAbs || d.savingsAbs < MIN_SAVINGS) return false;
      const ageHours = (now - d.pubDate.getTime()) / 3_600_000;
      if (ageHours > MAX_AGE_HOURS) return false;
      return true;
    })
    .map(d => ({ ...d, score: scoreDeal(d), category: guessCategory(d.title) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxDeals);
}
