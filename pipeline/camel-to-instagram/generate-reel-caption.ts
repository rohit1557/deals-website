export interface WeeklyDeal {
  title: string;
  source: string;
  discount_pct: number | null;
  original_price: number | null;
  deal_price: number | null;
  url: string;
}

function formatAUD(price: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function generateReelCaption(deals: WeeklyDeal[]): string {
  const hook = "You are overpaying for this... 👀";

  const dealLines = deals
    .slice(0, 3)
    .map((deal) => {
      const savings =
        deal.original_price != null && deal.deal_price != null
          ? deal.original_price - deal.deal_price
          : null;
      const savingsStr = savings != null ? formatAUD(Math.round(savings)) : "Great Price";
      return `✅ ${deal.title} — save ${savingsStr}`;
    });

  const totalSavings = deals.reduce((sum, deal) => {
    if (deal.original_price != null && deal.deal_price != null) {
      return sum + (deal.original_price - deal.deal_price);
    }
    return sum;
  }, 0);

  const savingsLine = `Total savings: ${formatAUD(Math.round(totalSavings))} 💰`;
  const followLine = "Follow @dealdrop.au for daily deals 🔔";
  const hashtags = "#deals #australia #savemoney #bargains #dealdrop";

  return [hook, ...dealLines, savingsLine, followLine, hashtags].join("\n");
}
