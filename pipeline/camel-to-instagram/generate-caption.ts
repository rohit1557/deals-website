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

export async function enhanceCaptionWithGroq(deal: ScoredDeal, rank: number): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return generateCaption(deal, rank);

  const priceStr = deal.dealPrice != null ? formatPrice(deal.dealPrice) : "great price";
  const wasStr   = deal.originalPrice != null ? ` (was ${formatPrice(deal.originalPrice)})` : "";
  const dropStr  = deal.dropPct != null ? ` — ${deal.dropPct}% off` : "";
  const rankLabel = rank === 1 ? "Deal of the Day" : `#${rank} deal today`;

  const prompt = `Write a punchy Instagram caption for an Australian deals page called DealDrop.
Product: ${deal.title}
Price: ${priceStr}${wasStr}${dropStr}
Position: ${rankLabel}

Rules:
- Start with 2-3 relevant emojis on the first line
- Mention the discount or saving angle in an exciting way
- Keep it under 180 characters before hashtags
- Second-to-last line: "Link in bio → dealdrop.au"
- Last line hashtags only: #DealDrop #AussieDeals #AmazonAustralia #PriceDrop #BargainHunter
- No quotation marks around the response

Reply with just the caption, no explanation.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.75,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.warn("[generate-caption] Groq API error:", res.status);
      return generateCaption(deal, rank);
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (content) {
      console.log(`[generate-caption] Groq caption generated for deal #${rank}`);
      return content;
    }
  } catch (err) {
    console.warn("[generate-caption] Groq failed, using template:", err);
  }

  return generateCaption(deal, rank);
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
