import * as fs from "fs";

// Fallback category prompts when no product title is available
const CATEGORY_PROMPTS: Record<string, string> = {
  Tech:    "Sleek smartphones and laptops on dark premium desk, soft blue neon accent lighting, cinematic product photography, bokeh background, no people, no text",
  Gaming:  "Epic gaming setup with RGB rainbow lighting, dark room, glowing keyboard and monitor, cinematic dramatic atmosphere, no people, no text",
  Home:    "Luxurious modern living room, warm golden lighting, Scandinavian minimal style, cozy premium atmosphere, no people, no text",
  Fashion: "High-fashion editorial flat lay, luxury fabrics, neutral beige and gold tones, elegant minimal composition, no text",
  Beauty:  "Luxury skincare and beauty products on pink marble, soft golden diffused light, elegant aesthetic, no text",
  Travel:  "Breathtaking aerial tropical landscape, crystal blue water, lush greenery, cinematic drone shot, no text",
  Other:   "Premium shopping environment, vibrant luxury retail aesthetic, dynamic modern composition, no text",
};

function buildPrompt(category: string, productTitle?: string): string {
  if (productTitle) {
    // Product-specific prompt — generate a styled scene that reflects the actual product
    return (
      `Professional advertising background for "${productTitle}". ` +
      `Cinematic product photography setting, premium studio lighting with dramatic shadows, ` +
      `dark moody atmosphere with subtle colour accents relevant to the product, ` +
      `bokeh background, ultra high quality commercial photography style, ` +
      `no people, no text, no words, no logos, no UI elements`
    );
  }
  return CATEGORY_PROMPTS[category] ?? CATEGORY_PROMPTS["Other"];
}

export async function generateBackground(
  category: string,
  outputPath: string,
  productTitle?: string,
): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[generate-background] No GEMINI_API_KEY set");
    return false;
  }

  const prompt = buildPrompt(category, productTitle);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.warn("[generate-background] Gemini API error:", res.status, errText);
      return false;
    }

    const data = await res.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { data: string } }> };
      }>;
    };

    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const b64 = parts.find(p => p.inlineData?.data)?.inlineData?.data;

    if (!b64) {
      console.warn("[generate-background] No image data in Gemini response");
      return false;
    }

    fs.writeFileSync(outputPath, Buffer.from(b64, "base64"));
    console.log(`[generate-background] Gemini generated background for "${productTitle ?? category}"`);
    return true;
  } catch (err) {
    console.warn("[generate-background] Failed:", err);
    return false;
  }
}
