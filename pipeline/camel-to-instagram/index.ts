import path from "path";
import { writeFileSync, mkdirSync } from "fs";
import { fetchDeals } from "./fetch-deals";
import { filterDeals } from "./filter-deals";
import type { ScoredDeal } from "./filter-deals";
import { enhanceCaptionWithGroq, generateMultiCaptionWithGroq } from "./generate-caption";
import type { PostType } from "./generate-caption";
import { generateImage } from "./generate-image";
import { uploadAndPost } from "./post-to-instagram";
import { filterUnposted, markPosted } from "./posted-deals";

const AUTO_POST  = process.env.POST_TO_INSTAGRAM === "true";
const OUTPUT_DIR = process.env.OUTPUT_DIR ?? "./output";

// POST_TYPE controls the content mix:
//   single          — best single deal (default)
//   top5            — top 5 deals carousel
//   budget          — top 3 deals under $100
//   category:Tech   — top 3 deals in a category (Tech/Gaming/Home/Fashion/Beauty)
const POST_TYPE_RAW = (process.env.POST_TYPE ?? "single").toLowerCase();
const POST_TYPE: PostType = (["single","top5","budget","category"] as PostType[])
  .find(t => POST_TYPE_RAW.startsWith(t)) ?? "single";
const CATEGORY_FILTER = POST_TYPE === "category"
  ? (process.env.POST_TYPE ?? "").split(":")[1]?.trim() ?? null
  : null;

const MAX_DEALS_BY_TYPE: Record<PostType, number> = {
  single: 1, top5: 5, budget: 3, category: 3,
};
const MAX_DEALS = parseInt(process.env.MAX_DEALS ?? String(MAX_DEALS_BY_TYPE[POST_TYPE]), 10);
const BUDGET_CEILING = 100; // AUD — for "budget" post type

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`[pipeline] Post type: ${POST_TYPE}${CATEGORY_FILTER ? `:${CATEGORY_FILTER}` : ""}`);
  console.log("[pipeline] Fetching deals from CamelCamelCamel...");

  const rawDeals = await fetchDeals();
  if (rawDeals.length === 0) {
    console.error("[pipeline] No deals fetched — check feeds and try again.");
    process.exit(1);
  }

  console.log(`[pipeline] Scoring and filtering ${rawDeals.length} deals...`);

  const freshAsins = await filterUnposted(rawDeals.map(d => d.asin));
  const freshDeals = rawDeals.filter(d => freshAsins.has(d.asin));
  if (freshDeals.length === 0) {
    console.warn("[pipeline] All deals were posted recently — using full list anyway");
  }

  let candidates = filterDeals(freshDeals.length > 0 ? freshDeals : rawDeals, 20);

  // Apply post-type specific filters
  if (POST_TYPE === "budget") {
    candidates = candidates.filter(d => (d.dealPrice ?? 999) <= BUDGET_CEILING);
    console.log(`[pipeline] Budget filter (≤$${BUDGET_CEILING}): ${candidates.length} qualifying deals`);
  }
  if (POST_TYPE === "category" && CATEGORY_FILTER) {
    const cat = CATEGORY_FILTER.charAt(0).toUpperCase() + CATEGORY_FILTER.slice(1).toLowerCase();
    candidates = candidates.filter(d => d.category.toLowerCase() === cat.toLowerCase());
    console.log(`[pipeline] Category filter (${cat}): ${candidates.length} qualifying deals`);
  }

  const topDeals: ScoredDeal[] = candidates.slice(0, MAX_DEALS);

  if (topDeals.length === 0) {
    console.error("[pipeline] No deals passed filters (drop% < 20% or too old).");
    process.exit(1);
  }

  console.log(`[pipeline] Generating images for ${topDeals.length} deal(s)...`);
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

  const captionsFile  = path.join(OUTPUT_DIR, "captions.txt");
  const multiCaption  = await generateMultiCaptionWithGroq(topDeals, POST_TYPE);
  const postCaption   = topDeals.length === 1
    ? captionParts[0].replace(/^--- Deal 1 ---\nURL: [^\n]+\n\n/, "")
    : multiCaption;

  writeFileSync(captionsFile, [
    `=== POST TYPE: ${POST_TYPE.toUpperCase()} ===`,
    "",
    "=== CAPTION (used for auto-post) ===",
    postCaption,
    "",
    "=== INDIVIDUAL DEAL CAPTIONS ===",
    captionParts.join("\n\n"),
  ].join("\n"), "utf-8");

  console.log(`[pipeline] Captions written to ${captionsFile}`);

  if (AUTO_POST) {
    console.log("\n[pipeline] Posting to Instagram…");
    // Bio link: top deal for single/budget/category, dealdrop.au homepage for top5 carousel
    const bioLink = POST_TYPE === "top5" ? "https://dealdrop.au" : topDeals[0].amazonUrl;
    await uploadAndPost(imagePaths, postCaption, bioLink);
    await markPosted(topDeals.map(d => d.asin));
  } else {
    console.log("\n[pipeline] Done! Files in output/:");
    topDeals.forEach((_, i) => console.log(`  deal-${i + 1}.png`));
    console.log("  captions.txt");
    console.log("\nSet POST_TO_INSTAGRAM=true + POST_TYPE=top5|budget|category:Tech to customise.");
  }
}

main().catch(err => {
  console.error("[pipeline] Fatal error:", err);
  process.exit(1);
});
