import puppeteer from "puppeteer";
import type { ScoredDeal } from "./filter-deals";

const OZB_BASE = "https://www.ozbargain.com.au";

// Map our internal categories to OzBargain's taxonomy
const CATEGORY_MAP: Record<string, string> = {
  Tech:      "Electrical & Electronics",
  Gaming:    "Gaming",
  Fashion:   "Clothing & Accessories",
  Beauty:    "Health & Beauty",
  Home:      "Home & Garden",
  Kitchen:   "Home & Garden",
  Fragrance: "Health & Beauty",
  Travel:    "Travel",
  Other:     "Misc",
};

function formatAUD(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency", currency: "AUD",
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(n);
}

function buildDescription(deal: ScoredDeal): string {
  const lines: string[] = [];

  // Headline price info
  if (deal.originalPrice && deal.dealPrice) {
    const savings = deal.originalPrice - deal.dealPrice;
    lines.push(
      `Was ${formatAUD(deal.originalPrice)}, now **${formatAUD(deal.dealPrice)}** — saving ${formatAUD(savings)} (${deal.dropPct}% off).`
    );
  } else if (deal.dealPrice) {
    lines.push(`Price: **${formatAUD(deal.dealPrice)}**`);
  }

  lines.push("");
  lines.push("Fulfilled by Amazon AU. Free delivery for Prime members.");
  lines.push("");

  // ASIN for product verification
  const asinM = deal.amazonUrl.match(/\/dp\/([A-Z0-9]{10})/);
  if (asinM) lines.push(`ASIN: ${asinM[1]}`);

  lines.push("");
  lines.push("ℹ️ As an Amazon Associate I earn a small commission if you buy via this link, at no extra cost to you.");

  return lines.join("\n");
}

export async function postToOzBargain(deal: ScoredDeal): Promise<string | null> {
  // OZBARGAIN_COOKIES: JSON array of cookie objects exported from browser after Google login.
  // Export with DevTools: Application → Cookies → copy all ozbargain.com.au cookies as JSON.
  // Or use the "Cookie-Editor" Chrome extension → Export → JSON → paste into secret.
  const cookiesJson = process.env.OZBARGAIN_COOKIES;

  if (!cookiesJson) {
    console.warn("[ozbargain] OZBARGAIN_COOKIES not set — skipping");
    return null;
  }

  let cookies: Array<Record<string, unknown>>;
  try {
    const raw: Array<Record<string, unknown>> = JSON.parse(cookiesJson);
    // Puppeteer's setCookie requires sameSite to be a string or absent — drop null values
    // and skip session-only cookies (no expirationDate) that won't survive across requests
    cookies = raw.map(c => {
      const clean: Record<string, unknown> = { ...c };
      if (clean.sameSite === null || clean.sameSite === "no_restriction") {
        delete clean.sameSite; // Puppeteer doesn't accept null or non-standard values
      }
      if (clean.storeId === null) delete clean.storeId;
      return clean;
    });
  } catch {
    console.warn("[ozbargain] OZBARGAIN_COOKIES is not valid JSON — skipping");
    return null;
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 900 });

    // ── Step 1: Restore session via cookies ────────────────────────────────
    // Navigate to domain first so cookies can be set
    await page.goto(`${OZB_BASE}/`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.setCookie(...(cookies as unknown as Parameters<typeof page.setCookie>));

    // Verify session is valid by checking for a logged-in indicator
    await page.goto(`${OZB_BASE}/`, { waitUntil: "networkidle0", timeout: 30_000 });
    const loggedIn = await page.$("a[href*='/user/logout'], .username, #edit-account");
    if (!loggedIn) {
      throw new Error("OzBargain session expired — refresh OZBARGAIN_COOKIES secret");
    }
    console.log("[ozbargain] Session restored from cookies");

    // ── Step 2: Navigate to submit form ───────────────────────────────────
    await page.goto(`${OZB_BASE}/node/add/bargain`, { waitUntil: "networkidle0", timeout: 30_000 });

    // ── Step 3: Fill title ────────────────────────────────────────────────
    const cleanTitle = deal.title.length > 100 ? deal.title.slice(0, 97) + "…" : deal.title;
    const titleWithPrice = deal.dealPrice
      ? `${cleanTitle} - ${formatAUD(deal.dealPrice)}${deal.dropPct ? ` (${deal.dropPct}% off)` : ""}`
      : cleanTitle;
    await page.waitForSelector("#edit-title", { timeout: 10_000 });
    await page.type("#edit-title", titleWithPrice.slice(0, 120), { delay: 30 });

    // ── Step 4: Fill deal URL ─────────────────────────────────────────────
    const urlField = await page.$("#edit-field-url-und-0-url");
    if (urlField) {
      await urlField.type(deal.amazonUrl, { delay: 20 });
    } else {
      // Fallback: try name attribute selector
      const alt = await page.$('input[name="field_url[und][0][url]"]');
      if (alt) await alt.type(deal.amazonUrl, { delay: 20 });
    }

    // ── Step 5: Fill description ──────────────────────────────────────────
    const desc = buildDescription(deal);
    const bodyField = await page.$("textarea#edit-body-und-0-value");
    if (bodyField) {
      await bodyField.click();
      await bodyField.type(desc, { delay: 5 });
    }

    // ── Step 6: Fill price fields ─────────────────────────────────────────
    if (deal.dealPrice) {
      const priceField = await page.$(
        "#edit-field-price-und-0-value, input[name='field_price[und][0][value]']"
      );
      if (priceField) await priceField.type(String(deal.dealPrice.toFixed(2)), { delay: 20 });
    }

    if (deal.originalPrice) {
      const wasField = await page.$(
        "#edit-field-price-und-0-was, input[name='field_price[und][0][was]']"
      );
      if (wasField) await wasField.type(String(deal.originalPrice.toFixed(2)), { delay: 20 });
    }

    // ── Step 7: Set category ──────────────────────────────────────────────
    const ozbCategory = CATEGORY_MAP[deal.category] ?? "Misc";
    try {
      await page.select("select[name='tid']", ozbCategory);
    } catch {
      // Some versions use a different field name — try by visible option text
      await page.evaluate((cat) => {
        const sel = document.querySelector("select[name='tid']") as HTMLSelectElement | null;
        if (!sel) return;
        for (const opt of Array.from(sel.options)) {
          if (opt.text.includes(cat)) { sel.value = opt.value; break; }
        }
      }, ozbCategory);
    }

    // ── Step 8: Image URL (optional) ─────────────────────────────────────
    if (deal.imageUrl) {
      const imgField = await page.$("input[name='field_image_upload[und][0][url]']");
      if (imgField) await imgField.type(deal.imageUrl, { delay: 20 });
    }

    // ── Step 9: Submit ────────────────────────────────────────────────────
    console.log("[ozbargain] Submitting deal...");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30_000 }),
      page.click("#edit-submit"),
    ]);

    const url = page.url();

    // Check for validation errors
    const errorEl = await page.$(".messages.error");
    if (errorEl) {
      const errText = await page.evaluate(el => el?.textContent ?? "", errorEl);
      throw new Error(`OzBargain submission error: ${errText.trim().slice(0, 200)}`);
    }

    console.log(`[ozbargain] Deal posted: ${url}`);
    return url;
  } finally {
    await browser.close();
  }
}
