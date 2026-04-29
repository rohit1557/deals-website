/**
 * DealDrop → Instagram pipeline
 *
 * Usage:
 *   npm run generate
 *
 * Outputs to ./output/:
 *   deal-1.png, deal-2.png, ..., deal-N.png
 *   captions.txt
 *
 * Download the output/ artifact from GitHub Actions and post manually via phone.
 */
import path from "path";
import { writeFileSync, mkdirSync } from "fs";
import { fetchDeals } from "./fetch-deals";
import { filterDeals } from "./filter-deals";
import { generateCaption, generateMultiCaption } from "./generate-caption";
import { generateImage } from "./generate-image";

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

  for (let i = 0; i < topDeals.length; i++) {
    const deal = topDeals[i];
    const rank = i + 1;
    const imgPath = path.join(OUTPUT_DIR, `deal-${rank}.png`);

    await generateImage(deal, rank, imgPath);

    const caption = generateCaption(deal, rank);
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

  console.log("\n[pipeline] Done! Files in output/:");
  topDeals.forEach((_, i) => console.log(`  deal-${i + 1}.png`));
  console.log("  captions.txt");
  console.log("\nDownload the artifact from GitHub Actions and post from your phone.");
}

main().catch(err => {
  console.error("[pipeline] Fatal error:", err);
  process.exit(1);
});
