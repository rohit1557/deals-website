import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { generateBackground } from "./generate-background";
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

function cleanTitle(title: string): string {
  return title
    .replace(/\s*-?\s*down\s+[\d.]+%/gi, "")       // remove "down X%"
    .replace(/\s*\([\d.]+%\s+off\)/gi, "")          // remove "(X% off)"
    .replace(/\s*\(\$[\d,]+\.?\d*[^)]*\)/g, "")     // remove "($448.00...)"
    .replace(/\s*\[[^\]]{0,30}\]/g, "")              // remove short [...] metadata
    .replace(/\s*\.{2,}$/, "")                       // remove trailing ...
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateImage(
  deal: ScoredDeal,
  rank: number,
  outputPath: string,
): Promise<void> {
  const outputDir = path.dirname(outputPath);
  const bgPath = path.join(outputDir, `bg-${rank}.jpg`);

  // Generate AI background — falls back to gradient if no API key or failure
  const hasBg = await generateBackground(deal.category, bgPath);

  const templateHtml = fs.readFileSync(TEMPLATE_PATH, "utf-8");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
    await page.setContent(templateHtml, { waitUntil: "networkidle0" });

    // Inject background image if generated
    if (hasBg && fs.existsSync(bgPath)) {
      const bgBase64 = fs.readFileSync(bgPath).toString("base64");
      await page.evaluate((b64: string) => {
        const bg = document.getElementById("bg")!;
        bg.style.backgroundImage = `url("data:image/jpeg;base64,${b64}")`;
        bg.style.backgroundSize = "cover";
        bg.style.backgroundPosition = "center";
      }, bgBase64);
    }

    const title = cleanTitle(deal.title);
    const shortTitle = title.length > 75 ? title.slice(0, 72) + "…" : title;

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
        title: shortTitle,
        dealPrice: deal.dealPrice != null ? formatAUD(deal.dealPrice) : "Great Price",
        originalPrice: deal.originalPrice != null ? formatAUD(deal.originalPrice) : null,
        dropPct: deal.dropPct,
        rankLbl: rankLabel(rank),
      },
    );

    await page.screenshot({ path: outputPath as `${string}.png`, type: "png" });
    console.log(`[generate-image] Saved ${outputPath}`);

    // Clean up temp background file
    if (hasBg && fs.existsSync(bgPath)) fs.unlinkSync(bgPath);
  } finally {
    await browser.close();
  }
}
