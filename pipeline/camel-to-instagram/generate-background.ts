import * as fs from "fs";

// Picsum Photos — free, no API key, reliable, beautiful photos
// Using category-specific seeds so each category gets a consistent photo style
const CATEGORY_SEEDS: Record<string, number> = {
  Tech:    10,
  Gaming:  42,
  Home:    67,
  Fashion: 84,
  Beauty:  91,
  Travel:  15,
  Other:   33,
};

export async function generateBackground(
  category: string,
  outputPath: string,
): Promise<boolean> {
  const seed = CATEGORY_SEEDS[category] ?? CATEGORY_SEEDS["Other"];

  try {
    // picsum.photos/seed/N/W/H — deterministic beautiful photo by seed
    const url = `https://picsum.photos/seed/${seed}/1080/1080`;
    const res = await fetch(url, { redirect: "follow" });

    if (!res.ok) {
      console.warn("[generate-background] Picsum returned", res.status);
      return false;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    console.log(`[generate-background] Saved Picsum background for "${category}" (seed ${seed})`);
    return true;
  } catch (err) {
    console.warn("[generate-background] Failed:", err);
    return false;
  }
}
