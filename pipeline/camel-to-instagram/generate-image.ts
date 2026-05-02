import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { getCategoryGradient } from "./generate-background";
import type { ScoredDeal } from "./filter-deals";

const TEMPLATES = [
  path.resolve(__dirname, "templates/post-template.html"),
  path.resolve(__dirname, "templates/post-template-b.html"),
  path.resolve(__dirname, "templates/post-template-c.html"),
];

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
    .replace(/\s*-?\s*down\s+[\d.]+%/gi, "")
    .replace(/\s*\([\d.]+%\s+off\)/gi, "")
    .replace(/\s*\(\$[\d,]+\.?\d*[^)]*\)/g, "")
    .replace(/\s*\[[^\]]*\]?/g, "")
    .replace(/\s+to\s+\$[\d,]+\.?\d*.*$/i, "")
    .replace(/\s*\.{2,}$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Parse real current price and "was" price from CCC title format
// "... down 6.38% ($46.26) to $678.54 from $724.80"
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

function shortUrl(amazonUrl: string): string {
  const m   = amazonUrl.match(/\/dp\/([A-Z0-9]{10})/);
  const tag = amazonUrl.match(/[?&]tag=([^&]+)/)?.[1] ?? "dealdrop0d5-22";
  return m ? `amazon.com.au/dp/${m[1]}?tag=${tag}` : "amazon.com.au";
}

// Try to download the Amazon product image directly from their CDN.
// Amazon exposes product images at predictable public URLs by ASIN.
async function fetchAmazonProductImage(asin: string, outputPath: string): Promise<boolean> {
  const candidates = [
    `https://m.media-amazon.com/images/P/${asin}.01._SX1000_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`,
    `https://m.media-amazon.com/images/P/${asin}.01._SL1000_.jpg`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; DealDrop/1.0)" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("image")) {
          fs.writeFileSync(outputPath, Buffer.from(await res.arrayBuffer()));
          console.log(`[generate-image] Got Amazon product image for ${asin}`);
          return true;
        }
      }
    } catch {
      // try next candidate
    }
  }
  return false;
}

export async function generateImage(
  deal: ScoredDeal,
  rank: number,
  outputPath: string,
): Promise<void> {
  const outputDir   = path.dirname(outputPath);
  const bgPath      = path.join(outputDir, `bg-${rank}.jpg`);
  const productPath = path.join(outputDir, `product-${rank}.jpg`);

  // 1. Try to fetch the actual Amazon product photo
  const hasProductImg = await fetchAmazonProductImage(deal.asin, productPath);

  // 2. Background: use product image (blurred) if we have one
  let hasBg = false;
  if (hasProductImg) {
    fs.copyFileSync(productPath, bgPath);
    hasBg = true;
  }
  // Else: inject a CSS gradient directly — no API call needed

  // Rotate templates so every post looks visually different
  const templatePath = TEMPLATES[rank % TEMPLATES.length];
  const templateHtml = fs.readFileSync(templatePath, "utf-8");
  console.log(`[generate-image] Using template: ${path.basename(templatePath)}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
    await page.setContent(templateHtml, { waitUntil: "networkidle0" });

    // Inject category gradient when there's no product image
    if (!hasProductImg) {
      const gradient = getCategoryGradient(deal.category);
      await page.evaluate((grad: string) => {
        (document.getElementById("bg") as HTMLElement).style.background = grad;
      }, gradient);
    }

    // Inject background image (blurred product photo)
    if (hasBg && fs.existsSync(bgPath)) {
      const bgBase64 = fs.readFileSync(bgPath).toString("base64");
      await page.evaluate(
        ({ b64, blur }: { b64: string; blur: boolean }) => {
          const bg = document.getElementById("bg")!;
          bg.style.backgroundImage = `url("data:image/jpeg;base64,${b64}")`;
          bg.style.backgroundSize = "cover";
          bg.style.backgroundPosition = "center";
          if (blur) bg.classList.add("blurred");
        },
        { b64: bgBase64, blur: hasProductImg },
      );
    }

    // Inject product image into the content column
    if (hasProductImg && fs.existsSync(productPath)) {
      const prodBase64 = fs.readFileSync(productPath).toString("base64");
      await page.evaluate((b64: string) => {
        const col = document.getElementById("product-col")!;
        const img = document.getElementById("product-image") as HTMLImageElement;
        const content = document.getElementById("content")!;
        img.src = `data:image/jpeg;base64,${b64}`;
        col.style.display = "flex";
        content.classList.remove("no-product");
      }, prodBase64);
    }

    // Extract correct prices from title (CCC stores drop amount in deal_price, not current price)
    const fromTitle     = parsePricesFromTitle(deal.title);
    const dealPrice     = fromTitle.dealPrice     ?? deal.dealPrice;
    const originalPrice = fromTitle.originalPrice ?? deal.originalPrice;
    const dropPct       = fromTitle.dropPct       ?? deal.dropPct;

    const title      = cleanTitle(deal.title);
    const shortTitle = title.length > 65 ? title.slice(0, 62) + "…" : title;

    // Use dollar savings in the badge — avoids mismatch with Amazon's RRP-based %
    const savingsAbs = deal.savingsAbs ?? (
      dealPrice != null && originalPrice != null ? originalPrice - dealPrice : null
    );

    await page.evaluate(
      ({ title, dealPrice, originalPrice, savingsBadge, dropPct, rankLbl, ctaUrl }) => {
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
        if (savingsBadge) {
          dropEl.textContent = `SAVE ${savingsBadge}`;
          dropEl.style.display = "block";
          // Template B watermark — show % there since it's background/decorative
          const wm = document.getElementById("watermark-pct");
          if (wm && dropPct) wm.textContent = `${dropPct}%`;
        }
      },
      {
        title: shortTitle,
        dealPrice:    dealPrice    != null ? formatAUD(dealPrice)    : "Great Price",
        originalPrice: originalPrice != null ? formatAUD(originalPrice) : null,
        savingsBadge: savingsAbs   != null ? formatAUD(Math.round(savingsAbs)) : null,
        dropPct,
        rankLbl: rankLabel(rank),
        ctaUrl:  shortUrl(deal.amazonUrl),
      },
    );

    await page.screenshot({ path: outputPath as `${string}.png`, type: "png" });
    console.log(`[generate-image] Saved ${outputPath}`);

    // Clean up temp files
    if (hasBg && fs.existsSync(bgPath)) fs.unlinkSync(bgPath);
    if (hasProductImg && fs.existsSync(productPath)) fs.unlinkSync(productPath);
  } finally {
    await browser.close();
  }
}
