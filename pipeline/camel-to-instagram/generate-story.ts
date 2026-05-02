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

  const priceStr  = fromTitle.dealPrice     != null ? formatAUD(fromTitle.dealPrice)     : "";
  const wasStr    = fromTitle.originalPrice != null ? formatAUD(fromTitle.originalPrice) : "";
  const dropPct   = fromTitle.dropPct;
  const shortUrl  = deal.amazonUrl.replace("https://www.", "");

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
    overflow: hidden;
  }

  /* Top brand bar */
  .top-bar {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 70px 56px 0;
    flex-shrink: 0;
  }
  .brand {
    font-size: 40px;
    font-weight: 900;
    background: linear-gradient(90deg, #818cf8, #c084fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .badge {
    font-size: 20px;
    background: rgba(255,255,255,0.15);
    padding: 10px 24px;
    border-radius: 100px;
    font-weight: 600;
    color: rgba(255,255,255,0.85);
  }

  /* Feed image — square, centred */
  .img-wrap {
    margin: 56px 40px 0;
    width: 1000px;
    height: 1000px;
    border-radius: 32px;
    overflow: hidden;
    box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08);
    flex-shrink: 0;
  }
  .img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Price strip below image */
  .price-strip {
    margin-top: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
    padding: 0 56px;
  }
  .deal-price {
    font-size: 80px;
    font-weight: 900;
    color: #4ade80;
    letter-spacing: -3px;
    line-height: 1;
    text-shadow: 0 0 40px rgba(74,222,128,0.4);
  }
  .was-price {
    font-size: 32px;
    color: rgba(255,255,255,0.4);
    text-decoration: line-through;
    font-weight: 600;
  }
  .drop-badge {
    background: #ef4444;
    font-size: 32px;
    font-weight: 900;
    padding: 8px 22px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(239,68,68,0.5);
  }

  /* URL button at bottom — prominent, copy-able */
  .url-block {
    margin-top: auto;
    padding: 0 56px 80px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .tap-label {
    font-size: 28px;
    font-weight: 700;
    color: rgba(255,255,255,0.6);
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .url-pill {
    background: rgba(255,255,255,0.12);
    border: 1.5px solid rgba(255,255,255,0.25);
    border-radius: 100px;
    padding: 18px 40px;
    font-size: 26px;
    font-weight: 700;
    color: #a5b4fc;
    letter-spacing: 0.3px;
    text-align: center;
    max-width: 960px;
    word-break: break-all;
  }
</style>
</head>
<body>
  <div class="top-bar">
    <span class="brand">DealDrop</span>
    <span class="badge">🇦🇺 Australia</span>
  </div>

  <div class="img-wrap">
    <img src="data:image/png;base64,${feedImgBase64}" alt="Deal" />
  </div>

  <div class="price-strip">
    ${priceStr ? `<div class="deal-price">${priceStr}</div>` : ""}
    ${wasStr   ? `<div class="was-price">${wasStr}</div>`   : ""}
    ${dropPct  ? `<div class="drop-badge">-${dropPct}% OFF</div>` : ""}
  </div>

  <div class="url-block">
    <div class="tap-label">🔗 Tap link or visit</div>
    <div class="url-pill">${shortUrl}</div>
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
