import puppeteer, { type Page } from "puppeteer";
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { generateReelCaption, type WeeklyDeal } from "./generate-reel-caption";
import { fetchDeals, fetchDealsFromDB } from "./fetch-deals";
import { filterDeals } from "./filter-deals";

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
  // Try CCC feed first, fall back to DB — both go through the shared
  // filterDeals() which applies quality filters + daily-seeded rotation
  let rawDeals = await fetchDeals();
  let filtered = filterDeals(rawDeals, 3);

  if (filtered.length < 3) {
    console.log("[generate-reel] Not enough CCC deals, supplementing from DB...");
    const dbDeals = await fetchDealsFromDB();
    const combined = [...rawDeals, ...dbDeals.filter(d => !rawDeals.find(r => r.asin === d.asin))];
    filtered = filterDeals(combined, 3);
  }

  return filtered.map(d => ({
    title:          d.title,
    source:         "camelcamelcamel",
    slug:           null,
    discount_pct:   d.dropPct,
    original_price: d.originalPrice,
    deal_price:     d.dealPrice,
    url:            d.amazonUrl,
    image_url:      d.imageUrl,
  }));
}

async function screenshotTemplate(
  templatePath: string,
  outputPath: string,
  injectFn?: (page: Page) => Promise<void>,
): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
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
  const bgMusicPath = path.resolve(__dirname, "templates/bg-music.mp3");
  const hasBgMusic = fs.existsSync(bgMusicPath);
  const bgVolume = parseFloat(process.env.BGMUSIC_VOLUME ?? "0.15");
  const totalDuration = durations.reduce((a, b) => a + b, 0);

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

    let videoFilter = "";
    let prev = "0:v";
    for (let i = 0; i < n - 1; i++) {
      const out = i < n - 2 ? `out${i}` : "v";
      videoFilter += `[${prev}][${i + 1}:v]xfade=transition=slideup:duration=${TRANSITION}:offset=${offsets[i]}[${out}]`;
      if (i < n - 2) videoFilter += ";";
      prev = out;
    }

    let cmd = ffmpeg();
    resolved.forEach((fp, i) => {
      cmd = (cmd as any).input(fp).inputOptions(["-loop", "1", "-t", String(durations[i])]);
    });

    if (hasBgMusic) {
      // Loop music to cover full video length, set volume, fade out last 1.5s
      const fadeStart = Math.max(0, totalDuration - 1.5);
      const audioFilter = `${videoFilter};[${n}:a]aloop=loop=-1:size=2e+09,atrim=duration=${totalDuration},volume=${bgVolume},afade=t=out:st=${fadeStart}:d=1.5[a]`;
      cmd = (cmd as any).input(bgMusicPath);
      cmd
        .complexFilter(audioFilter, ["v", "a"])
        .outputOptions(["-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p", "-s", "1080x1920", "-c:a", "aac", "-shortest"])
        .output(outputPath)
        .on("end", () => { console.log(`[generate-reel] Video (with music): ${outputPath}`); resolve(); })
        .on("error", (err: Error) => reject(err))
        .run();
    } else {
      console.log("[generate-reel] No bg-music.mp3 found in templates/ — generating silent reel");
      cmd
        .complexFilter(videoFilter, "v")
        .outputOptions(["-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p", "-s", "1080x1920"])
        .output(outputPath)
        .on("end", () => { console.log(`[generate-reel] Video: ${outputPath}`); resolve(); })
        .on("error", (err: Error) => reject(err))
        .run();
    }
  });
}

async function saveReelPost(deals: WeeklyDeal[]): Promise<void> {
  if (!DATABASE_URL) return;
  const { Client } = await import("pg");
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS reel_posts (
        date DATE PRIMARY KEY,
        deals JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    const today = new Date().toISOString().slice(0, 10);
    const payload = deals.map((d) => ({
      slug: d.slug ?? null,
      title: truncateTitle(d.title),
      image_url: d.image_url ?? null,
      original_price: d.original_price,
      deal_price: d.deal_price,
      discount_pct: d.discount_pct,
      url: d.url,
      affiliate_url: d.url.includes("?")
        ? d.url + "&utm_source=instagram&utm_medium=reel&utm_campaign=daily_reel"
        : d.url + "?utm_source=instagram&utm_medium=reel&utm_campaign=daily_reel",
    }));
    await client.query(
      `INSERT INTO reel_posts (date, deals)
       VALUES ($1, $2)
       ON CONFLICT (date) DO UPDATE SET deals = EXCLUDED.deals, created_at = NOW()`,
      [today, JSON.stringify(payload)]
    );
    console.log(`[generate-reel] Saved reel post for ${today}`);
  } finally {
    await client.end();
  }
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

  const caption = generateReelCaption(deals);

  // Upload reel + caption to Google Drive — backup copy on Android
  try {
    const { uploadToGoogleDrive, uploadTextToGoogleDrive } = await import("./upload-drive");
    const today = new Date().toISOString().slice(0, 10);

    const driveUrl = await uploadToGoogleDrive(videoPath);
    if (driveUrl) {
      fs.writeFileSync(path.join(outputDir, "reel-drive-url.txt"), driveUrl);
      console.log("[generate-reel] Google Drive link:", driveUrl);
    }

    await uploadTextToGoogleDrive(caption, `DealDrop_Caption_${today}.txt`);
  } catch (err) {
    console.warn("[generate-reel] Google Drive upload failed (reel still in artifact):", err);
  }

  // Upload to Cloudinary for a public URL, then auto-schedule on TryPost.it
  // Guard: skip TryPost if a reel was already scheduled today (prevents duplicate posts from re-runs)
  const todayAEST = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" }); // YYYY-MM-DD
  let alreadyPostedToday = false;
  if (DATABASE_URL) {
    try {
      const { Client } = await import("pg");
      const pg = new Client({ connectionString: DATABASE_URL });
      await pg.connect();
      const { rows } = await pg.query(
        "SELECT 1 FROM reel_posts WHERE date = $1 LIMIT 1",
        [todayAEST]
      );
      alreadyPostedToday = rows.length > 0;
      await pg.end();
    } catch { /* ignore — if DB check fails, allow posting */ }
  }

  if (alreadyPostedToday) {
    console.log(`[generate-reel] Reel already posted today (${todayAEST}) — skipping TryPost`);
  } else {
    try {
      const { uploadVideoToCloudinary } = await import("./cloudinary");
      const cloudinaryUrl = await uploadVideoToCloudinary(videoPath);
      if (cloudinaryUrl) {
        const { postReelToTryPost } = await import("./post-to-trypost");
        await postReelToTryPost(cloudinaryUrl, caption);
      }
    } catch (err) {
      console.warn("[generate-reel] TryPost.it auto-publish failed (reel still in Drive + artifact):", err);
    }
  }

  await saveReelPost(deals);

  console.log("[generate-reel] Done");
}

if (require.main === module) {
  generateReel().catch((err) => {
    // Exit 0 so the workflow step doesn't fail the whole job — reel is optional
    console.warn("[generate-reel] Skipping reel:", err?.message ?? err);
    process.exit(0);
  });
}
