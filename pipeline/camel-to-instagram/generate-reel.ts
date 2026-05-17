import puppeteer, { Browser, Page } from "puppeteer";
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { generateReelCaption, type WeeklyDeal } from "./generate-reel-caption";

const DATABASE_URL = process.env.DATABASE_URL;

function formatAUD(price: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

async function fetchTopDeals(): Promise<WeeklyDeal[]> {
  try {
    const res = await fetch("http://localhost:3000/api/top-deals-weekly", {
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`[generate-reel] Fetched ${data.length} deals from API`);
      return data.slice(0, 3);
    }
  } catch (err) {
    console.warn(`[generate-reel] API fetch failed, falling back to direct DB query:`, err);
  }

  // Fallback: direct DB query if API is unavailable
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL not set and API unavailable");
  }

  // Mock fallback — in production would use actual DB client
  console.log(`[generate-reel] Using mock fallback deals`);
  return [
    {
      title: "Samsung 65\" 4K Smart TV",
      source: "Amazon",
      discount_pct: 35,
      original_price: 1299,
      deal_price: 849,
      url: "https://amazon.com.au/dp/example1",
    },
    {
      title: "Apple AirPods Pro",
      source: "Amazon",
      discount_pct: 25,
      original_price: 399,
      deal_price: 299,
      url: "https://amazon.com.au/dp/example2",
    },
    {
      title: "Sony WH-1000XM5 Headphones",
      source: "Amazon",
      discount_pct: 20,
      original_price: 599,
      deal_price: 479,
      url: "https://amazon.com.au/dp/example3",
    },
  ];
}

async function generateReelFrame(
  deal: WeeklyDeal,
  frameIndex: number,
  outputDir: string,
): Promise<string> {
  const outputPath = path.join(outputDir, `frame-${frameIndex}.png`);
  const templatePath = path.resolve(__dirname, "templates/reel-frame.html");

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const templateHtml = fs.readFileSync(templatePath, "utf-8");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 });
    await page.setContent(templateHtml, { waitUntil: "networkidle0" });

    // Build query params
    const params = new URLSearchParams({
      title: deal.title,
      original_price: deal.original_price != null ? formatAUD(deal.original_price) : "",
      deal_price: deal.deal_price != null ? formatAUD(deal.deal_price) : "$0",
      discount_pct: deal.discount_pct != null ? String(deal.discount_pct) : "",
      source: deal.source,
    });

    // Navigate with query params
    const htmlWithParams = templateHtml.replace(
      "</head>",
      `<script>window.dealParams = Object.fromEntries(new URLSearchParams("${params}"));</script></head>`,
    );

    await page.setContent(htmlWithParams, { waitUntil: "networkidle0" });
    await page.screenshot({ path: outputPath as `${string}.png`, type: "png" });
    console.log(`[generate-reel] Saved frame ${frameIndex}: ${outputPath}`);

    return outputPath;
  } finally {
    await browser.close();
  }
}

async function stitchFramesIntoVideo(
  framePaths: string[],
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create concat demux file for ffmpeg
    const concatFile = path.join(path.dirname(outputPath), "concat.txt");
    const concatContent = framePaths
      .map((fp) => {
        const img = path.resolve(fp);
        return `file '${img}'\nduration 5`;
      })
      .join("\n");

    fs.writeFileSync(concatFile, concatContent);

    let ffmpegCmd = ffmpeg()
      .input(`concat:${framePaths.map(path.resolve).join("|")}`)
      .inputOptions(["-loop", "1", "-t", "5"])
      .outputOptions([
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-pix_fmt",
        "yuv420p",
        "-s",
        "1080x1920",
      ])
      .output(outputPath)
      .on("end", () => {
        console.log(`[generate-reel] Video stitched: ${outputPath}`);
        fs.unlinkSync(concatFile);
        resolve();
      })
      .on("error", (err) => {
        fs.unlinkSync(concatFile);
        reject(err);
      });

    ffmpegCmd.run();
  });
}

export async function generateReel(): Promise<void> {
  const outputDir = path.resolve(__dirname, "../../output/reel");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`[generate-reel] Starting weekly reel generation`);

  // 1. Fetch top 3 deals
  const deals = await fetchTopDeals();
  if (deals.length < 3) {
    console.warn(`[generate-reel] Only ${deals.length} deals found, expected 3`);
  }

  // 2. Generate frames
  const framePaths: string[] = [];
  for (let i = 0; i < deals.length; i++) {
    const framePath = await generateReelFrame(deals[i], i + 1, outputDir);
    framePaths.push(framePath);
  }

  // 3. Stitch frames into video
  const videoPath = path.join(outputDir, "reel.mp4");
  await stitchFramesIntoVideo(framePaths, videoPath);

  // 4. Generate caption
  const caption = generateReelCaption(deals);
  const captionPath = path.join(outputDir, "reel-caption.txt");
  fs.writeFileSync(captionPath, caption);
  console.log(`[generate-reel] Saved caption: ${captionPath}`);

  console.log(`[generate-reel] Reel generated: ${videoPath}`);
}

// Run if invoked directly
if (require.main === module) {
  generateReel().catch((err) => {
    console.error("[generate-reel] Fatal error:", err);
    process.exit(1);
  });
}
