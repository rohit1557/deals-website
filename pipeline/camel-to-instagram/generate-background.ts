import * as fs from "fs";

// Unsplash source API — free, no API key needed, returns random relevant photos
const CATEGORY_QUERIES: Record<string, string> = {
  Tech:    "technology gadget minimal dark",
  Gaming:  "gaming setup rgb lights",
  Home:    "modern home interior cozy",
  Fashion: "fashion style minimal",
  Beauty:  "beauty skincare luxury",
  Travel:  "travel landscape aerial",
  Other:   "shopping deal sale colorful",
};

export async function generateBackground(
  category: string,
  outputPath: string,
): Promise<boolean> {
  const query = CATEGORY_QUERIES[category] ?? CATEGORY_QUERIES["Other"];
  const encoded = encodeURIComponent(query);

  try {
    // Unsplash Source — returns a random photo matching the query, 1080x1080
    const url = `https://source.unsplash.com/1080x1080/?${encoded}`;
    const res = await fetch(url, { redirect: "follow" });

    if (!res.ok) {
      console.warn("[generate-background] Unsplash returned", res.status);
      return false;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    console.log(`[generate-background] Saved Unsplash background for "${category}"`);
    return true;
  } catch (err) {
    console.warn("[generate-background] Failed:", err);
    return false;
  }
}
