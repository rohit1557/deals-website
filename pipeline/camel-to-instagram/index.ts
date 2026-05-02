import path from "path";
import { writeFileSync, mkdirSync } from "fs";
import { fetchDeals } from "./fetch-deals";
import { filterDeals } from "./filter-deals";
import { enhanceCaptionWithGroq, generateMultiCaption } from "./generate-caption";
import { generateImage } from "./generate-image";
import { uploadAndPost } from "./post-to-instagram";

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
  const topDeals = filterDeals(rawDeals, MAX_DEALS);
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
    await uploadAndPost(imagePaths, multiCaption);
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
