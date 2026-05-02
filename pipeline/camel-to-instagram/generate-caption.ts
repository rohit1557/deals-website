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
    style: "currency", currency: "AUD",
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(price);
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const HOOKS = [
  "Wait… this price makes absolutely no sense 😳",
  "Nope, this deal is actually insane 🤯",
  "How is Amazon AU even allowed to do this?! 💀",
  "Your wallet called. It said thank you 💚",
  "Grabbed mine. You should too 🛒",
  "Aussies are SLEEPING on this deal 😴",
  "I had to double-check this price 👀",
  "This won't last — screenshot it now 📸",
  "Best price of the year. Not even kidding 🔥",
  "POV: You just found the deal of the week 👇",
];

const CTAS = [
  "👆 Link in bio to grab it",
  "💾 Save this post — you'll thank yourself later",
  "🏃 Don't sleep on this — link in bio",
  "📲 Link in bio • Tag a mate who needs this",
  "💡 Link in bio before it sells out",
];

const QUESTIONS = [
  "Would you grab this? 👇",
  "Tag someone who needs this 👇",
  "Have you used this? Drop a ⭐ below",
  "Saving this for later? 💾",
  "Who's adding this to cart? 🛒",
  "Is this worth it? Comments open 👇",
];

function templateCaption(deal: ScoredDeal): string {
  const priceStr   = deal.dealPrice    != null ? formatPrice(deal.dealPrice)    : "Great price";
  const wasStr     = deal.originalPrice!= null ? ` (was ${formatPrice(deal.originalPrice)})` : "";
  const savingsStr = deal.savingsAbs   != null ? ` • Save ${formatPrice(deal.savingsAbs)}` : "";
  const catTags    = CATEGORY_TAGS[deal.category] ?? [];
  const shortUrl   = deal.amazonUrl.replace("https://www.", "");

  return [
    pick(HOOKS),
    "",
    `${deal.title}`,
    `${priceStr}${wasStr}${savingsStr}`,
    "",
    pick(QUESTIONS),
    "",
    pick(CTAS),
    `🛒 ${shortUrl}`,
    "",
    [...HASHTAGS, ...catTags].join(" "),
  ].join("\n");
}

export async function enhanceCaptionWithGroq(deal: ScoredDeal, rank: number): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return templateCaption(deal);

  const priceStr   = deal.dealPrice    != null ? formatPrice(deal.dealPrice)    : "great price";
  const wasStr     = deal.originalPrice!= null ? ` (was ${formatPrice(deal.originalPrice)})` : "";
  const savingsStr = deal.savingsAbs   != null ? ` — saving ${formatPrice(deal.savingsAbs)}` : "";
  const shortUrl   = deal.amazonUrl.replace("https://www.", "");

  const prompt = `Write a scroll-stopping Instagram caption for an Australian deals page called DealDrop.

Product: ${deal.title}
Price: ${priceStr}${wasStr}${savingsStr}

Follow this EXACT structure (3 sections, blank line between each):

SECTION 1 — HOOK (1 line):
A punchy, emotional opener. Make people stop scrolling. Use surprise, FOMO, or Aussie humour.
Examples: "Wait… this price makes absolutely no sense 😳" / "How is Amazon AU even allowed to do this?! 💀" / "POV: You just found the deal of the week 👇"

SECTION 2 — DEAL DETAIL (1-2 lines):
Exciting, specific. Mention the saving amount or %. Add urgency ("today only", "limited stock", "price could jump any time").

SECTION 3 — ENGAGEMENT (1 line):
A question or prompt to drive comments. E.g. "Would you grab this? Drop a 🛒 below" / "Tag someone who needs this 👇"

Rules:
- Total body under 250 characters (hashtags/URL added separately — do NOT include them)
- 3-5 emojis placed naturally throughout
- Aussie-friendly tone (casual, not corporate)
- No quotation marks around your response`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:  "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model:       "llama-3.3-70b-versatile",
        messages:    [{ role: "user", content: prompt }],
        max_tokens:  400,
        temperature: 0.85,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.warn("[generate-caption] Groq API error:", res.status);
      return templateCaption(deal);
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const body = data.choices?.[0]?.message?.content?.trim();
    if (body) {
      console.log(`[generate-caption] Groq caption generated for deal #${rank}`);
      return [
        body,
        "",
        pick(CTAS),
        `🛒 ${shortUrl}`,
        "",
        [...HASHTAGS, ...(CATEGORY_TAGS[deal.category] ?? [])].join(" "),
      ].join("\n");
    }
  } catch (err) {
    console.warn("[generate-caption] Groq failed, using template:", err);
  }

  return templateCaption(deal);
}

export type PostType = "single" | "top5" | "budget" | "category";

export async function generateMultiCaptionWithGroq(
  deals: ScoredDeal[],
  postType: PostType,
): Promise<string> {
  const apiKey  = process.env.GROQ_API_KEY;
  const catName = deals[0]?.category ?? "Deals";

  const typeLabel: Record<PostType, string> = {
    single:   "Deal of the Day",
    top5:     "Top 5 Amazon AU Price Drops",
    budget:   "Budget Picks under $100",
    category: `Best ${catName} Deals Right Now`,
  };

  const dealList = deals.map((d, i) => {
    const price    = d.dealPrice  != null ? formatPrice(d.dealPrice)  : "";
    const drop     = d.dropPct    != null ? ` -${d.dropPct}%`         : "";
    const savings  = d.savingsAbs != null ? ` (save ${formatPrice(d.savingsAbs)})` : "";
    return `${i + 1}. ${d.title.slice(0, 60)} — ${price}${drop}${savings}`;
  }).join("\n");

  const templateLines = [
    postType === "top5"     ? "🔥 5 deals too good to scroll past — save this post! 👇"
    : postType === "budget" ? "💸 Big savings, small prices — your wallet wins today 🙌"
    : postType === "category" ? `🛒 Best ${catName} deals on Amazon AU right now 👀`
    : "🔥 Deal of the Day — you don't want to miss this",
    "",
    ...deals.map((d, i) => {
      const price   = d.dealPrice  != null ? formatPrice(d.dealPrice)  : "";
      const drop    = d.dropPct    != null ? ` (-${d.dropPct}%)`       : "";
      const savings = d.savingsAbs != null ? ` • save ${formatPrice(d.savingsAbs)}` : "";
      const url     = d.amazonUrl.replace("https://www.", "");
      return `${i + 1}. ${d.title.slice(0, 55)}\n   ${price}${drop}${savings}\n   🔗 ${url}`;
    }),
    "",
    "💾 Save this post so you don't forget!",
    "👆 Follow DealDrop for daily Aussie bargains",
    "",
    "Which deal are you grabbing? Drop a number below 👇",
    "",
    HASHTAGS.join(" "),
  ];

  if (!apiKey) return templateLines.join("\n");

  const prompt = `Write a punchy Instagram carousel caption for an Australian deals page called DealDrop.
Post type: ${typeLabel[postType]}

Deals in this carousel:
${dealList}

Structure:
LINE 1: A scroll-stopping hook for a ${typeLabel[postType]} carousel (1 line, exciting, FOMO-driven, 2-3 emojis)
BLANK LINE
LINE 2-3: 1-2 lines building excitement — mention total savings, variety, or urgency
BLANK LINE
LINE 4: Engagement CTA — invite people to comment which deal they want (e.g. "Comment the number of your fave deal 👇")

Rules:
- Under 280 characters total body (hashtags/URLs/deal list added separately — do NOT include them)
- Casual Aussie tone
- No quotation marks around your response`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:  "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model:       "llama-3.3-70b-versatile",
        messages:    [{ role: "user", content: prompt }],
        max_tokens:  350,
        temperature: 0.85,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return templateLines.join("\n");

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const hook = data.choices?.[0]?.message?.content?.trim();
    if (hook) {
      console.log("[generate-caption] Groq multi-caption generated");
      return [
        hook,
        "",
        ...deals.map((d, i) => {
          const price   = d.dealPrice  != null ? formatPrice(d.dealPrice)  : "";
          const drop    = d.dropPct    != null ? ` (-${d.dropPct}%)`       : "";
          const savings = d.savingsAbs != null ? ` • save ${formatPrice(d.savingsAbs)}` : "";
          const url     = d.amazonUrl.replace("https://www.", "");
          return `${i + 1}. ${d.title.slice(0, 55)}\n   ${price}${drop}${savings}\n   🔗 ${url}`;
        }),
        "",
        "💾 Save this post so you don't forget!",
        "👆 Follow DealDrop for daily Aussie bargains",
        "",
        HASHTAGS.join(" "),
      ].join("\n");
    }
  } catch {
    // fall through to template
  }

  return templateLines.join("\n");
}
