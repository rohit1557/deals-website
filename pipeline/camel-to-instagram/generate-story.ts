import puppeteer from "puppeteer";
import fs from "fs";
import type { ScoredDeal } from "./filter-deals";
import { getCategoryGradient } from "./generate-background";

function formatAUD(price: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency", currency: "AUD",
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(price);
}

export async function generateStoryImage(
  deal: ScoredDeal,
  feedImagePath: string,
  outputPath: string,
): Promise<void> {
  const feedImgBase64 = fs.readFileSync(feedImagePath).toString("base64");
  const gradient      = getCategoryGradient(deal.category);

  const fromTitle = (() => {
    const m = deal.title.match(/to\s+\$([\d,]+\.?\d*)\s+from\s+\$([\d,]+\.?\d*)/i);
    const d = deal.title.match(/down\s+([\d.]+)%/i);
    if (m) {
      const dp = parseFloat(m[1].replace(/,/g, ""));
      const op = parseFloat(m[2].replace(/,/g, ""));
      return { dealPrice: dp, originalPrice: op, dropPct: d ? Math.round(parseFloat(d[1])) : null };
    }
    return { dealPrice: deal.dealPrice, originalPrice: deal.originalPrice, dropPct: deal.dropPct };
  })();

  const dealPrice     = fromTitle.dealPrice;
  const originalPrice = fromTitle.originalPrice;
  const dropPct       = fromTitle.dropPct;
  const priceStr      = dealPrice     != null ? formatAUD(dealPrice)     : "";
  const wasStr        = originalPrice != null ? formatAUD(originalPrice) : "";

  const cleanTitle = deal.title
    .replace(/\s*-?\s*down\s+[\d.]+%/gi, "")
    .replace(/\s*\([\d.]+%\s+off\)/gi, "")
    .replace(/\s*\(\$[\d,]+\.?\d*[^)]*\)/g, "")
    .replace(/\s+to\s+\$[\d,]+\.?\d*.*$/i, "")
    .replace(/\s+/g, " ").trim();

  const shortTitle = cleanTitle.length > 70 ? cleanTitle.slice(0, 67) + "…" : cleanTitle;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1080px;
    height: 1920px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: ${gradient};
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #fff;
    position: relative;
    overflow: hidden;
  }

  /* Subtle radial overlay */
  body::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.04) 0%, transparent 70%);
    pointer-events: none;
  }

  /* Top brand bar */
  .top-bar {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 64px 60px 0;
  }
  .brand {
    font-size: 36px;
    font-weight: 900;
    letter-spacing: -0.5px;
    background: linear-gradient(90deg, #818cf8, #c084fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .country-badge {
    font-size: 18px;
    background: rgba(255,255,255,0.15);
    padding: 8px 20px;
    border-radius: 100px;
    font-weight: 600;
    color: rgba(255,255,255,0.8);
  }

  /* Deal card image — centred, with glow */
  .card-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 40px;
    width: 100%;
  }
  .card-shadow {
    border-radius: 36px;
    box-shadow: 0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08);
    overflow: hidden;
    width: 960px;
    height: 960px;
  }
  .card-shadow img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Price info below image */
  .price-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 0 60px;
    width: 100%;
    text-align: center;
  }
  .deal-title {
    font-size: 34px;
    font-weight: 800;
    line-height: 1.2;
    text-shadow: 0 2px 16px rgba(0,0,0,0.5);
  }
  .price-row {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .deal-price {
    font-size: 72px;
    font-weight: 900;
    color: #4ade80;
    letter-spacing: -3px;
    line-height: 1;
    text-shadow: 0 0 40px rgba(74,222,128,0.4);
  }
  .was-price {
    font-size: 28px;
    color: rgba(255,255,255,0.4);
    text-decoration: line-through;
    font-weight: 600;
  }
  .drop-badge {
    background: #ef4444;
    font-size: 28px;
    font-weight: 900;
    padding: 6px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(239,68,68,0.5);
  }

  /* Bottom CTA — sits just above where Instagram places link sticker */
  .cta-block {
    width: 100%;
    padding: 32px 60px 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .tap-hint {
    font-size: 26px;
    font-weight: 700;
    color: rgba(255,255,255,0.7);
    letter-spacing: 1px;
  }
  .tap-arrow {
    font-size: 48px;
  }
</style>
</head>
<body>
  <div class="top-bar">
    <span class="brand">DealDrop</span>
    <span class="country-badge">🇦🇺 Australia</span>
  </div>

  <div class="card-wrap">
    <div class="card-shadow">
      <img src="data:image/png;base64,${feedImgBase64}" alt="Deal" />
    </div>
  </div>

  <div class="price-block">
    <div class="deal-title">${shortTitle}</div>
    <div class="price-row">
      ${priceStr ? `<div class="deal-price">${priceStr}</div>` : ""}
      ${wasStr   ? `<div class="was-price">${wasStr}</div>` : ""}
      ${dropPct  ? `<div class="drop-badge">-${dropPct}% OFF</div>` : ""}
    </div>
  </div>

  <div class="cta-block">
    <div class="tap-hint">TAP LINK TO SHOP</div>
    <div class="tap-arrow">👇</div>
  </div>
</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.screenshot({ path: outputPath as `${string}.png`, type: "png" });
    console.log(`[generate-story] Saved ${outputPath}`);
  } finally {
    await browser.close();
  }
}
