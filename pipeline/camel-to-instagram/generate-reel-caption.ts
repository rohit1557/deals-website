export interface WeeklyDeal {
  title: string;
  source: string;
  slug?: string | null;
  discount_pct: number | null;
  original_price: number | null;
  deal_price: number | null;
  url: string;
  image_url?: string | null;
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

const AD_DISCLOSURE = "#ad | As an Amazon Associate I earn from qualifying purchases.\n\n";

const HOOKS = [
  "Wait… this price makes absolutely no sense 😳",
  "How is Amazon AU even allowed to do this?! 💀",
  "POV: You just found the deal of the week 👇",
  "Nope, this deal is actually insane 🤯",
  "Your wallet called. It said thank you 💚",
  "Best price of the year. Not even kidding 🔥",
];

export function generateReelCaption(deals: WeeklyDeal[]): string {
  if (deals.length === 0) return "";

  const topDeal = deals[0];
  const shortTitle = topDeal.title.length > 50
    ? topDeal.title.slice(0, 50).replace(/\s+\S*$/, "") + "..."
    : topDeal.title;
  const hashtags = pickRandomHashtags(8).join(" ");
  const discountPct = topDeal.discount_pct ?? 0;
  const originalPrice = formatPrice(topDeal.original_price);
  const dealPrice = formatPrice(topDeal.deal_price);
  const savingsAmount = formatPrice(savings(topDeal));
  const dealCount = deals.length;
  const moreDealsCta = dealCount > 1 ? `\n\n+ ${dealCount - 1} more deal${dealCount > 2 ? "s" : ""} in bio 👆` : "";
  const hook = HOOKS[Math.floor(Math.random() * HOOKS.length)];

  const templateChoice = Math.floor(Math.random() * 3);
  let body = "";

  if (templateChoice === 0) {
    body = `${hook}\n\n${shortTitle} — ${discountPct}% off!\n${dealPrice} (was ${originalPrice}) • Save ${savingsAmount}\n\nWould you grab this? 🛒${moreDealsCta}\n\n👆 Link in bio\n\n${hashtags}`;
  } else if (templateChoice === 1) {
    body = `${hook}\n\n${shortTitle}\nNow only ${dealPrice} (was ${originalPrice}) — save ${savingsAmount} today 🏃\n\nTag someone who needs this 👇${moreDealsCta}\n\n👆 Link in bio\n\n${hashtags}`;
  } else {
    body = `${hook}\n\n${shortTitle} just dropped to ${dealPrice} — that's ${discountPct}% off 😤\n\nSave this before the price jumps 💾${moreDealsCta}\n\n👆 Link in bio\n\n${hashtags}`;
  }

  return AD_DISCLOSURE + body;
}
