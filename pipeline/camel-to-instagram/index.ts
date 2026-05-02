import path from "path";
import { writeFileSync, mkdirSync } from "fs";
import { fetchDeals } from "./fetch-deals";
import { filterDeals } from "./filter-deals";
import { enhanceCaptionWithGroq, generateMultiCaption } from "./generate-caption";
import { generateImage } from "./generate-image";
import { uploadAndPost } from "./post-to-instagram";
import { filterUnposted, markPosted } from "./posted-deals";
import { generateStoryImage } from "./generate-story";

// Set POST_TO_INSTAGRAM=true to auto-post after generating images.
// Carousel if multiple deals; single post if only one.
const AUTO_POST = process.env.POST_TO_INSTAGRAM === "true";

const OUTPUT_DIR = process.env.OUTPUT_DIR ?? "./output";
const MAX_DEALS  = parseInt(process.env.MAX_DEALS ?? "5", 10);

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("[pipeline] Fetching deals from CamelCamelCamel...");
  const rawDeals = await fetchDeals();
  if (rawDeals.length === 0) {
    console.error("[pipeline] No deals fetched — check feeds and try again.");
    process.exit(1);
  }

  console.log(`[pipeline] Scoring and filtering ${rawDeals.length} deals...`);
  // Remove ASINs posted in the last 30 days before scoring
  const freshAsins = await filterUnposted(rawDeals.map(d => d.asin));
  const freshDeals = rawDeals.filter(d => freshAsins.has(d.asin));
  if (freshDeals.length === 0) {
    console.warn("[pipeline] All deals were posted recently — using full list anyway");
  }
  const topDeals = filterDeals(freshDeals.length > 0 ? freshDeals : rawDeals, MAX_DEALS);
  if (topDeals.length === 0) {
    console.error("[pipeline] No deals passed filters (drop% < 20% or too old).");
    process.exit(1);
  }

  console.log(`[pipeline] Generating images for ${topDeals.length} deals...`);
  const captionParts: string[] = [];
  const imagePaths: string[] = [];

  for (let i = 0; i < topDeals.length; i++) {
    const deal = topDeals[i];
    const rank = i + 1;
    const imgPath = path.join(OUTPUT_DIR, `deal-${rank}.png`);

    await generateImage(deal, rank, imgPath);
    imagePaths.push(imgPath);

    const caption = await enhanceCaptionWithGroq(deal, rank);
    captionParts.push(`--- Deal ${rank} ---\nURL: ${deal.amazonUrl}\n\n${caption}`);
  }

  // Write individual captions + a multi-post summary
  const captionsFile = path.join(OUTPUT_DIR, "captions.txt");
  const multiCaption = generateMultiCaption(topDeals);
  const fullContent = [
    "=== MULTI-DEAL CAPTION (carousel / first slide) ===",
    multiCaption,
    "",
    "=== INDIVIDUAL DEAL CAPTIONS ===",
    captionParts.join("\n\n"),
  ].join("\n");

  writeFileSync(captionsFile, fullContent, "utf-8");
  console.log(`[pipeline] Captions written to ${captionsFile}`);

  // Auto-post to Instagram if configured
  if (AUTO_POST) {
    console.log("\n[pipeline] Posting to Instagram…");
    // Single deal → use the Groq-enhanced individual caption
    // Multiple deals → use the multi-deal carousel caption with URLs
    const postCaption = topDeals.length === 1
      ? captionParts[0].replace(/^--- Deal 1 ---\nURL: [^\n]+\n\n/, "")
      : multiCaption;
    // Generate proper 1080x1920 story image (no cropping)
    const storyImagePath = path.join(OUTPUT_DIR, "story-1.png");
    await generateStoryImage(topDeals[0], imagePaths[0], storyImagePath);
    await uploadAndPost(imagePaths, postCaption, topDeals[0].amazonUrl, storyImagePath);
    await markPosted(topDeals.map(d => d.asin));
  } else {
    console.log("\n[pipeline] Done! Files in output/:");
    topDeals.forEach((_, i) => console.log(`  deal-${i + 1}.png`));
    console.log("  captions.txt");
    console.log("\nAdd POST_TO_INSTAGRAM=true + Cloudinary/Instagram secrets to auto-post.");
  }
}

main().catch(err => {
  console.error("[pipeline] Fatal error:", err);
  process.exit(1);
});
