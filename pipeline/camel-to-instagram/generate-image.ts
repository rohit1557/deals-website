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
    .replace(/\s*-?\s*down\s+[\d.]+%/gi, "")        // remove "down X%"
    .replace(/\s*\([\d.]+%\s+off\)/gi, "")           // remove "(X% off)"
    .replace(/\s*\(\$[\d,]+\.?\d*[^)]*\)/g, "")      // remove "($448.00...)"
    .replace(/\s*\[[^\]]*\]?/g, "")                  // remove [...] even if unclosed
    .replace(/\s+to\s+\$[\d,]+\.?\d*.*$/i, "")       // remove "to $1,699..."
    .replace(/\s*\.{2,}$/, "")                        // remove trailing ...
    .replace(/\s+/g, " ")
    .trim();
}

// CCC titles carry the real prices: "... to $678.54 from $724.80"
// The DB deal_price column stores the dollar drop amount, not the current price.
function parsePricesFromTitle(title: string): { dealPrice: number | null; originalPrice: number | null; dropPct: number | null } {
  const priceMatch = title.match(/to\s+\$([\d,]+\.?\d*)\s+from\s+\$([\d,]+\.?\d*)/i);
  const dropMatch  = title.match(/down\s+([\d.]+)%/i);

  if (priceMatch) {
    const dealPrice     = parseFloat(priceMatch[1].replace(/,/g, ""));
    const originalPrice = parseFloat(priceMatch[2].replace(/,/g, ""));
    const dropPct = dropMatch
      ? Math.round(parseFloat(dropMatch[1]))
      : originalPrice > dealPrice
        ? Math.round((1 - dealPrice / originalPrice) * 100)
        : null;
    return { dealPrice, originalPrice, dropPct };
  }
  return { dealPrice: null, originalPrice: null, dropPct: null };
}

// Display URL shown in the image — includes affiliate tag so it's a complete link
function shortUrl(amazonUrl: string): string {
  const m = amazonUrl.match(/\/dp\/([A-Z0-9]{10})/);
  const tag = amazonUrl.match(/[?&]tag=([^&]+)/)?.[1] ?? "dealdrop0d5-22";
  return m ? `amazon.com.au/dp/${m[1]}?tag=${tag}` : "amazon.com.au";
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

    // Try to extract correct prices from title (CCC stores drop amount, not current price)
    const fromTitle = parsePricesFromTitle(deal.title);
    const dealPrice     = fromTitle.dealPrice     ?? deal.dealPrice;
    const originalPrice = fromTitle.originalPrice ?? deal.originalPrice;
    const dropPct       = fromTitle.dropPct       ?? deal.dropPct;

    const title = cleanTitle(deal.title);
    const shortTitle = title.length > 75 ? title.slice(0, 72) + "…" : title;

    await page.evaluate(
      ({ title, dealPrice, originalPrice, dropPct, rankLbl, ctaUrl }) => {
        document.getElementById("rank-badge")!.textContent = rankLbl;
        document.getElementById("deal-title")!.textContent = title;
        document.getElementById("deal-price")!.textContent = dealPrice;
        document.getElementById("cta-url")!.textContent = ctaUrl;

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
        dealPrice: dealPrice != null ? formatAUD(dealPrice) : "Great Price",
        originalPrice: originalPrice != null ? formatAUD(originalPrice) : null,
        dropPct,
        rankLbl: rankLabel(rank),
        ctaUrl: shortUrl(deal.amazonUrl),
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
