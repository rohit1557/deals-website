import type { RawDeal } from "./fetch-deals";

// Instagram-worthy categories — only these get posted
const INSTAGRAM_CATEGORIES = ["Tech", "Gaming", "Fashion", "Beauty", "Home", "Kitchen", "Fragrance"];

// Products that look terrible on Instagram regardless of discount
const SKIP_TITLE_RE = /\b(server\s*rack|rack\s*shelf|patch\s*panel|cable\s*manag|keystone|ethernet\s*switch|network\s*switch|patchbay|unmanaged\s*switch|managed\s*switch|sprayer|pressure\s*washer|lawn\s*mow|weed\s*killer|fertiliz|electric\s*motor|hydraulic|compressor|industrial|accounting|textbook|programming|software\s*engineering|business\s*analy|analysis\s*technique|reference\s*guide|handbook|rack\s*unit|rack\s*mount|data\s*center|pipe\s*fitting|plumbing|valve|gasket|floor\s*stand|music\s*stand)\b/i;

const MIN_DROP_PCT     = 8;
const MIN_SAVINGS_LOW  = 10;
const MIN_SAVINGS_HIGH = 40;
const MIN_DEAL_PRICE   = 20;
const MAX_DEAL_PRICE   = 600;
const MAX_AGE_HOURS    = 48;

export interface ScoredDeal extends RawDeal {
  score: number;
  category: string;
}

export function guessCategory(title: string): string {
  const t = title.toLowerCase();
  if (/\b(perfume|cologne|fragrance|eau\s*de|toilette|parfum)\b/.test(t))                                                          return "Fragrance";
  if (/\b(napp(y|ies)|diaper|baby|infant|toddler|pram|stroller|bassinet|baby\s*wipe)\b/.test(t))                                   return "Baby";
  if (/\b(skincare|moisturis|moisturiz|serum|lipstick|mascara|foundation|blush|concealer|shampoo|conditioner|hair\s*care|nail\s*polish|sunscreen|spf)\b/.test(t)) return "Beauty";
  if (/\b(shirt|pants|dress|shoes?|jacket|jeans|hoodie|sneakers?|boots?|socks?|underwear|bra|leggings?|activewear|swimwear|watch|handbag|purse)\b/.test(t))        return "Fashion";
  if (/\b(game|gaming|controller|console|playstation|xbox|nintendo|steam|headsets?|mechanical\s*keyboard|keycaps?|mousepad|gpu|graphics\s*card)\b/.test(t))        return "Gaming";
  if (/\b(airpods?|iphone|samsung|pixel|phone|laptop|tablet|headphones?|earbuds?|earphones?|speaker|camera|\btv\b|monitor|keyboards?|mouse|mice|kindle|smart\s*watch|smartwatch|robot\s*vacuum|robot\s*mop|usb|ssd|hard\s*drive|charger|power\s*bank|drone|printer|router|wifi|pc\s*case|tower\s*case)\b/.test(t)) return "Tech";
  if (/\b(air\s*fryer|blender|juicer|coffee|nespresso|keurig|instant\s*pot|rice\s*cooker|toaster|mixer|food\s*processor|kettle|microwave|stand\s*mixer)\b/.test(t)) return "Kitchen";
  if (/\b(vacuum|mattress|pillow|bed\s*sheet|towel|lamp|candle|diffuser|storage|home\s*decor|cushion|throw|rug|curtain|bed\s*frame)\b/.test(t))                     return "Home";
  if (/\b(luggage|backpack|travel|suitcase)\b/.test(t))                                                                                                             return "Travel";
  return "Other";
}

function scoreDeal(deal: RawDeal): number {
  let score = 0;
  const cat = guessCategory(deal.title);

  // Category is the dominant signal — non-Instagram products shouldn't rank at all
  const categoryBonus: Record<string, number> = {
    Fragrance: 80, Beauty: 75, Fashion: 70,
    Gaming: 65, Tech: 60, Kitchen: 55, Home: 50,
    Travel: 30, Other: -50,
  };
  score += categoryBonus[cat] ?? -50;

  // Discount %
  score += (deal.dropPct ?? 0) * 2;

  // Absolute savings
  score += Math.min(deal.savingsAbs ?? 0, 200) * 0.4;

  // Recency
  const hoursOld = (Date.now() - deal.pubDate.getTime()) / 3_600_000;
  if (hoursOld < 4)       score += 30;
  else if (hoursOld < 12) score += 15;
  else if (hoursOld < 24) score += 5;

  // Impulse price sweet spot $25–$200
  const p = deal.dealPrice ?? 0;
  if (p >= 25 && p <= 200)       score += 25;
  else if (p > 200 && p <= 350)  score += 10;

  return score;
}

// Deterministic daily shuffle — same seed within a day, different each day.
// Uses the date string as a seed so the reel rotates the pool without being
// purely random (avoids picking low-quality deals by chance).
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function filterDeals(deals: RawDeal[], maxDeals = 5): ScoredDeal[] {
  const now = Date.now();
  const passed: RawDeal[] = [];

  for (const d of deals) {
    const savings  = d.savingsAbs ?? 0;
    const ageHours = (now - d.pubDate.getTime()) / 3_600_000;
    const price    = d.dealPrice ?? 0;
    const cat      = guessCategory(d.title);

    let reason = "";
    if (!d.dropPct)                               reason = "no dropPct";
    else if (price < MIN_DEAL_PRICE)              reason = `price $${price} < $${MIN_DEAL_PRICE}`;
    else if (price > MAX_DEAL_PRICE)              reason = `price $${price} > $${MAX_DEAL_PRICE}`;
    else if (ageHours > MAX_AGE_HOURS)            reason = `age ${ageHours.toFixed(1)}h > ${MAX_AGE_HOURS}h`;
    else if (SKIP_TITLE_RE.test(d.title))         reason = "non-Instagram product type";
    else if (!INSTAGRAM_CATEGORIES.includes(cat)) reason = `category "${cat}" not Instagram-worthy`;
    else if (d.dropPct >= MIN_DROP_PCT && savings >= MIN_SAVINGS_LOW)  { passed.push(d); continue; }
    else if (d.dropPct >= 15 && savings >= MIN_SAVINGS_HIGH)           { passed.push(d); continue; }
    else reason = `drop ${d.dropPct}% savings $${savings}`;

    console.log(`[filter] SKIP "${d.title.slice(0, 60)}" — ${reason}`);
  }

  const scored = passed
    .map(d => ({ ...d, score: scoreDeal(d), category: guessCategory(d.title) }))
    .sort((a, b) => b.score - a.score);

  // Take top 2× pool so there are real candidates to rotate between,
  // then shuffle with today's date as seed — rotates daily without sacrificing quality.
  const pool = scored.slice(0, maxDeals * 2);
  const today = new Date();
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const rotated = seededShuffle(pool, daySeed);

  console.log(`[filter] pool=${pool.length} after quality filter, seed=${daySeed}`);
  return rotated.slice(0, maxDeals);
}
