import puppeteer, { type Page } from "puppeteer";
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { generateReelCaption, type WeeklyDeal } from "./generate-reel-caption";

const DATABASE_URL = process.env.DATABASE_URL;

const HOOK_DURATION = 1.5;
const DEAL_DURATION = 4;
const END_DURATION = 2;
const TRANSITION = 0.3;

function formatAUD(price: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function truncateTitle(title: string): string {
  const t = title.replace(/\.{2,}$/, "").trim();
  if (t.length <= 40) return t;
  const cut = t.slice(0, 40);
  const lastSpace = cut.lastIndexOf(" ");
  return lastSpace > 10 ? cut.slice(0, lastSpace) : cut;
}

async function fetchTopDeals(): Promise<WeeklyDeal[]> {
  try {
    const res = await fetch("http://localhost:3000/api/top-deals-weekly", {
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) return (await res.json()).slice(0, 3);
  } catch {
    // fall through to direct DB
  }

  if (!DATABASE_URL) throw new Error("DATABASE_URL not set");

  const { Client } = await import("pg");
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(
      `SELECT title, source, slug, discount_pct,
              CAST(original_price AS float) AS original_price,
              CAST(deal_price AS float) AS deal_price,
              url, image_url
       FROM deals
       WHERE created_at > NOW() - INTERVAL '7 days'
         AND source = $1
         AND is_active = true
         AND discount_pct BETWEEN 5 AND 95
         AND original_price > 0
         AND deal_price > 0
         AND deal_price < original_price
       ORDER BY discount_pct DESC
       LIMIT 3`,
      ["camelcamelcamel"]
    );
    return result.rows;
  } finally {
    await client.end();
  }
}

async function screenshotTemplate(
  templatePath: string,
  outputPath: string,
  injectFn?: (page: Page) => Promise<void>,
): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 });
    await page.goto("file://" + templatePath, { waitUntil: "networkidle0" });
    if (injectFn) await injectFn(page);
    await page.screenshot({ path: outputPath as `${string}.png`, type: "png" });
    console.log(`[generate-reel] Frame: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

async function generateHookFrame(outputDir: string): Promise<string> {
  const outputPath = path.join(outputDir, "frame-0-hook.png");
  const templatePath = path.resolve(__dirname, "templates/hook-frame.html");
  await screenshotTemplate(templatePath, outputPath);
  return outputPath;
}

async function generateEndCard(outputDir: string): Promise<string> {
  const outputPath = path.join(outputDir, "frame-end.png");
  const templatePath = path.resolve(__dirname, "templates/end-card.html");
  await screenshotTemplate(templatePath, outputPath);
  return outputPath;
}

async function generateReelFrame(
  deal: WeeklyDeal,
  frameIndex: number,
  outputDir: string,
): Promise<string> {
  const outputPath = path.join(outputDir, `frame-${frameIndex}.png`);
  const templatePath = path.resolve(__dirname, "templates/reel-frame.html");
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  await screenshotTemplate(templatePath, outputPath, async (page) => {
    const data = {
      title: truncateTitle(deal.title),
      originalPrice: deal.original_price != null ? formatAUD(deal.original_price) : "",
      dealPrice: deal.deal_price != null ? formatAUD(deal.deal_price) : "$0",
      discountPct: deal.discount_pct != null ? String(Math.round(deal.discount_pct)) : "",
      source: deal.source === "camelcamelcamel" ? "Amazon AU" : (deal.source ?? "Amazon AU"),
      imageUrl: deal.image_url ?? "",
    };

    await page.evaluate((d) => {
      const el = (id: string) => document.getElementById(id);
      const set = (id: string, text: string) => { const e = el(id); if (e) e.textContent = text; };
      const show = (id: string) => { const e = el(id); if (e) (e as HTMLElement).style.display = "block"; };

      set("deal-title", d.title);
      set("deal-price", d.dealPrice);
      set("source-label", d.source);

      if (d.originalPrice) { set("original-price", d.originalPrice); show("original-price"); }
      if (d.discountPct) { set("discount-badge", d.discountPct + "% OFF"); show("discount-badge"); }

      const container = el("product-image-container");
      if (container) {
        if (d.imageUrl) {
          const img = document.createElement("img");
          img.id = "product-image";
          img.src = d.imageUrl;
          container.appendChild(img);
        } else {
          container.classList.add("image-placeholder");
        }
        (container as HTMLElement).style.display = "flex";
      }
    }, data);

    if (data.imageUrl) {
      await page.waitForFunction(
        () => {
          const img = document.getElementById("product-image") as HTMLImageElement | null;
          return !img || img.complete;
        },
        { timeout: 8000 },
      ).catch(() => console.warn("[generate-reel] Image load timeout"));
    }
  });

  return outputPath;
}

async function stitchFramesIntoVideo(
  framePaths: string[],
  durations: number[],
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const resolved = framePaths.map((fp) => path.resolve(fp));
    const n = resolved.length;

    // xfade offset[i] = cumulative sum of durations[0..i] - (i+1)*TRANSITION
    const offsets: number[] = [];
    let sum = 0;
    for (let i = 0; i < n - 1; i++) {
      sum += durations[i];
      offsets.push(+(sum - (i + 1) * TRANSITION).toFixed(3));
    }

    let filterComplex = "";
    let prev = "0:v";
    for (let i = 0; i < n - 1; i++) {
      const out = i < n - 2 ? `out${i}` : "v";
      filterComplex += `[${prev}][${i + 1}:v]xfade=transition=slideup:duration=${TRANSITION}:offset=${offsets[i]}[${out}]`;
      if (i < n - 2) filterComplex += ";";
      prev = out;
    }

    let cmd = ffmpeg();
    resolved.forEach((fp, i) => {
      cmd = (cmd as any).input(fp).inputOptions(["-loop", "1", "-t", String(durations[i])]);
    });

    cmd
      .complexFilter(filterComplex, "v")
      .outputOptions(["-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p", "-s", "1080x1920"])
      .output(outputPath)
      .on("end", () => { console.log(`[generate-reel] Video: ${outputPath}`); resolve(); })
      .on("error", (err: Error) => reject(err))
      .run();
  });
}

export async function generateReel(): Promise<void> {
  const outputDir = path.resolve(__dirname, "output/reel");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log("[generate-reel] Starting reel generation");

  const deals = await fetchTopDeals();
  if (deals.length === 0) throw new Error("No deals found");

  const hookPath = await generateHookFrame(outputDir);
  const dealPaths: string[] = [];
  for (let i = 0; i < deals.length; i++) {
    dealPaths.push(await generateReelFrame(deals[i], i + 1, outputDir));
  }
  const endPath = await generateEndCard(outputDir);

  const framePaths = [hookPath, ...dealPaths, endPath];
  const durations = [HOOK_DURATION, ...deals.map(() => DEAL_DURATION), END_DURATION];

  const videoPath = path.join(outputDir, "reel.mp4");
  await stitchFramesIntoVideo(framePaths, durations, videoPath);

  const captionPath = path.join(outputDir, "reel-caption.txt");
  fs.writeFileSync(captionPath, generateReelCaption(deals));

  console.log("[generate-reel] Done");
}

if (require.main === module) {
  generateReel().catch((err) => {
    console.error("[generate-reel] Fatal error:", err);
    process.exit(1);
  });
}
