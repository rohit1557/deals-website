export interface WeeklyDeal {
  title: string;
  source: string;
  discount_pct: number | null;
  original_price: number | null;
  deal_price: number | null;
  url: string;
}

function formatPrice(price: number | null): string {
  if (price == null) return "";
  const rounded = Math.round(price * 100) / 100;
  if (rounded === Math.floor(rounded)) {
    return `$${Math.floor(rounded)}`;
  }
  return `$${rounded.toFixed(2)}`;
}

function savings(deal: WeeklyDeal): number {
  if (deal.original_price == null || deal.deal_price == null) return 0;
  return deal.original_price - deal.deal_price;
}

function pickRandomHashtags(count: number = 6): string[] {
  const HASHTAG_POOL = [
    "#dealsaustralia", "#australiadeals", "#bargainhunter", "#savemoney",
    "#ozbargain", "#deals", "#cheapdeals", "#pricewatch",
    "#dealdrop", "#shoppingaustralia", "#frugalliving", "#moneysaver",
    "#discounts", "#salesaustralia", "#budgetshopping", "#dealalert"
  ];
  const shuffled = [...HASHTAG_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateReelCaption(deals: WeeklyDeal[]): string {
  if (deals.length === 0) return "";

  const topDeal = deals[0];
  const templateChoice = Math.floor(Math.random() * 3);
  const hashtags = pickRandomHashtags(6).join(" ");
  const discountPct = topDeal.discount_pct ?? 0;
  const originalPrice = formatPrice(topDeal.original_price);
  const dealPrice = formatPrice(topDeal.deal_price);
  const savingsAmount = formatPrice(savings(topDeal));
  const dealCount = deals.length;
  const moreDealsCta = dealCount > 1 ? ` + ${dealCount - 1} more deals` : "";

  let caption = "";

  if (templateChoice === 0) {
    // Template A — Urgency
    caption = `⏰ Deal alert! ${topDeal.title} is down ${discountPct}% to ${dealPrice} (was ${originalPrice}). Link in bio 🔥${moreDealsCta}\n\n${hashtags}`;
  } else if (templateChoice === 1) {
    // Template B — Value
    caption = `💸 Save ${savingsAmount} on ${topDeal.title}. One of the best prices we have tracked. Grab it before it is gone 👇${moreDealsCta}\n\n${hashtags}`;
  } else {
    // Template C — Curiosity
    caption = `This ${topDeal.source} deal caught our eye... ${topDeal.title} for ${dealPrice} — that is ${discountPct}% off 🤯 Who is grabbing this?${moreDealsCta}\n\n${hashtags}`;
  }

  return caption;
}
