import type { ScoredDeal } from "./filter-deals";

const HASHTAGS = [
  "#DealDrop", "#AussieDeals", "#AmazonAustralia", "#AmazonDeals",
  "#PriceDrop", "#ShoppingDeals", "#BargainHunter", "#DealAlert",
  "#AuDeals", "#SaveMoney",
];

const CATEGORY_TAGS: Record<string, string[]> = {
  Tech:    ["#TechDeals", "#GadgetDeals", "#TechSale"],
  Gaming:  ["#GamingDeals", "#GamerLife", "#GamingSale"],
  Home:    ["#HomeDeals", "#HomeDecor", "#KitchenDeals"],
  Fashion: ["#FashionDeals", "#StyleDeals", "#OOTDDeals"],
  Beauty:  ["#BeautyDeals", "#SkincareDeals", "#MakeupDeals"],
  Travel:  ["#TravelDeals", "#TravelAustralia"],
  Other:   [],
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function dealEmoji(dropPct: number, category: string): string {
  const catEmojis: Record<string, string> = {
    Tech: "💻", Gaming: "🎮", Home: "🏠", Fashion: "👗", Beauty: "💄", Travel: "✈️",
  };
  if (dropPct >= 60) return "🔥";
  if (dropPct >= 40) return "⚡";
  return catEmojis[category] ?? "💰";
}

export function generateCaption(deal: ScoredDeal, rank: number): string {
  const emoji = dealEmoji(deal.dropPct ?? 0, deal.category);
  const rankLabel = rank === 1 ? "🏆 Deal of the Day" : `Deal #${rank}`;

  const priceStr = deal.dealPrice != null ? formatPrice(deal.dealPrice) : "Great price";
  const wasStr   = deal.originalPrice != null ? ` (was ${formatPrice(deal.originalPrice)})` : "";
  const dropStr  = deal.dropPct != null ? ` — ${deal.dropPct}% OFF` : "";

  const catTags = CATEGORY_TAGS[deal.category] ?? [];
  const allTags = [...HASHTAGS, ...catTags].join(" ");

  return [
    `${emoji} ${rankLabel}`,
    ``,
    `${deal.title}`,
    ``,
    `${priceStr}${wasStr}${dropStr}`,
    ``,
    `Link in bio to grab this deal! 👆`,
    ``,
    allTags,
  ].join("\n");
}

export function generateMultiCaption(deals: ScoredDeal[]): string {
  const lines = [
    "🛒 Today's Top Amazon AU Price Drops",
    "",
    ...deals.map((d, i) => {
      const priceStr = d.dealPrice != null ? formatPrice(d.dealPrice) : "";
      const dropStr  = d.dropPct != null ? ` (-${d.dropPct}%)` : "";
      return `${i + 1}. ${d.title}\n   ${priceStr}${dropStr}`;
    }),
    "",
    "Link in bio → dealdrop.au",
    "",
    HASHTAGS.join(" "),
  ];
  return lines.join("\n");
}
