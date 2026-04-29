import puppeteer from "puppeteer";
import path from "path";
import { readFileSync } from "fs";
import type { ScoredDeal } from "./filter-deals";

const TEMPLATE_PATH = path.resolve(__dirname, "templates/post-template.html");

function formatAUD(price: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function rankLabel(rank: number): string {
  if (rank === 1) return "🏆 Deal of the Day";
  if (rank === 2) return "🥈 #2 Today";
  if (rank === 3) return "🥉 #3 Today";
  return `Deal #${rank}`;
}

export async function generateImage(
  deal: ScoredDeal,
  rank: number,
  outputPath: string,
): Promise<void> {
  const templateHtml = readFileSync(TEMPLATE_PATH, "utf-8");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

    await page.setContent(templateHtml, { waitUntil: "networkidle0" });

    await page.evaluate(
      ({ title, dealPrice, originalPrice, dropPct, rankLbl }) => {
        document.getElementById("rank-badge")!.textContent = rankLbl;
        document.getElementById("deal-title")!.textContent = title;
        document.getElementById("deal-price")!.textContent = dealPrice;

        const wasEl  = document.getElementById("was-price")!;
        const dropEl = document.getElementById("drop-badge")!;

        if (originalPrice) {
          wasEl.textContent = `was ${originalPrice}`;
          wasEl.style.display = "block";
        }
        if (dropPct) {
          dropEl.textContent = `-${dropPct}% OFF`;
          dropEl.style.display = "block";
        }
      },
      {
        title: deal.title.length > 80 ? deal.title.slice(0, 77) + "…" : deal.title,
        dealPrice: deal.dealPrice != null ? formatAUD(deal.dealPrice) : "Great Price",
        originalPrice: deal.originalPrice != null ? formatAUD(deal.originalPrice) : null,
        dropPct: deal.dropPct,
        rankLbl: rankLabel(rank),
      },
    );

    await page.screenshot({ path: outputPath as `${string}.png`, type: "png" });
    console.log(`[generate-image] Saved ${outputPath}`);
  } finally {
    await browser.close();
  }
}
