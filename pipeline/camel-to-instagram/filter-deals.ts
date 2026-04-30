import type { RawDeal } from "./fetch-deals";

// Categories that map well to Instagram visual content
const VISUAL_CATEGORIES = ["Tech", "Gaming", "Home", "Fashion", "Beauty"];

// Minimum drop % to be worth posting
const MIN_DROP_PCT = 20;

// Max age of the drop — don't post deals older than 7 days
const MAX_AGE_HOURS = 168;

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

function scoredeal(deal: RawDeal): number {
  let score = 0;

  // Drop % is the primary signal
  score += (deal.dropPct ?? 0) * 2;

  // Recency — penalise older drops
  const hoursOld = (Date.now() - deal.pubDate.getTime()) / 3_600_000;
  if (hoursOld < 6)  score += 30;
  else if (hoursOld < 12) score += 15;
  else if (hoursOld < 24) score += 5;

  // Price sweet spot for AU Instagram — $20–$500 products are most relatable
  const p = deal.dealPrice ?? 0;
  if (p >= 20 && p <= 500) score += 15;

  // Category bonus — visual categories perform better
  const cat = guessCategory(deal.title);
  if (VISUAL_CATEGORIES.includes(cat)) score += 10;

  return score;
}

export function filterDeals(deals: RawDeal[], maxDeals = 5): ScoredDeal[] {
  const now = Date.now();

  return deals
    .filter(d => {
      const ageHours = (now - d.pubDate.getTime()) / 3_600_000;
      if (!d.dropPct || d.dropPct < MIN_DROP_PCT) return false;
      // CCC measures from all-time high — 90%+ drops are normal. Only block
      // genuinely absurd cheap items with inflated RRP (e.g. $5 item "was $50")
      if (d.dealPrice && d.originalPrice && d.dealPrice < 30 && d.originalPrice / d.dealPrice >= 8) return false;
      if (ageHours > MAX_AGE_HOURS) return false;
      return true;
    })
    .map(d => ({ ...d, score: scoredeal(d), category: guessCategory(d.title) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxDeals);
}
