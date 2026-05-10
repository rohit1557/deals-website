/**
 * Issue #19 — Amazon affiliate disclosure compliance.
 * Asserts the disclosure string is present in all caption generation paths.
 * Runs in template fallback mode (no GROQ_API_KEY required).
 */
import { describe, it, expect, beforeAll } from "vitest";
import { enhanceCaptionWithGroq, generateMultiCaptionWithGroq } from "./generate-caption";
import type { ScoredDeal } from "./filter-deals";

const AMAZON_DISCLOSURE = "#ad | As an Amazon Associate I earn from qualifying purchases.";

beforeAll(() => {
  delete process.env.GROQ_API_KEY; // force template fallback — no network calls
});

const amazonDeal: ScoredDeal = {
  title:         "Sony WH-1000XM5 Wireless Headphones",
  dealPrice:     279.99,
  originalPrice: 449.99,
  savingsAbs:    170,
  dropPct:       38,
  score:         95,
  category:      "Tech",
  amazonUrl:     "https://www.amazon.com.au/dp/B09XS7JWHH?tag=dealdrop0d5-22",
  asin:          "B09XS7JWHH",
};

const nonAmazonDeal: ScoredDeal = {
  ...amazonDeal,
  amazonUrl: "https://www.ozbargain.com.au/node/123456",
};

describe("enhanceCaptionWithGroq — single deal (template path)", () => {
  it("prepends disclosure for Amazon URLs", async () => {
    const caption = await enhanceCaptionWithGroq(amazonDeal, 1);
    expect(caption.startsWith(AMAZON_DISCLOSURE)).toBe(true);
  });

  it("disclosure is within the first 125 characters", async () => {
    const caption = await enhanceCaptionWithGroq(amazonDeal, 1);
    expect(caption.slice(0, 125)).toContain(AMAZON_DISCLOSURE.slice(0, 30));
  });
});

describe("generateMultiCaptionWithGroq — multi deal (template path)", () => {
  it("prepends disclosure for a top5 post", async () => {
    const caption = await generateMultiCaptionWithGroq([amazonDeal, amazonDeal], "top5");
    expect(caption.startsWith(AMAZON_DISCLOSURE)).toBe(true);
  });

  it("prepends disclosure for a single post type", async () => {
    const caption = await generateMultiCaptionWithGroq([amazonDeal], "single");
    expect(caption.startsWith(AMAZON_DISCLOSURE)).toBe(true);
  });
});
