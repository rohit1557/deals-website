import * as fs from "fs";

const CATEGORY_PROMPTS: Record<string, string> = {
  Tech:    "Sleek smartphone and laptop on dark desk, soft blue neon lighting, bokeh background, cinematic product photography, no people, no text, no words",
  Gaming:  "Epic gaming setup with RGB rainbow lighting, dark room, glowing keyboard and monitor, cinematic dramatic shot, no people, no text, no words",
  Home:    "Luxurious modern living room, warm golden lighting, Scandinavian minimal style, cozy atmosphere, no people, no text, no words",
  Fashion: "High-fashion editorial flat lay, luxury fabrics, neutral beige and gold tones, elegant minimal composition, no text, no words",
  Beauty:  "Luxury skincare products on pink marble, soft golden light, elegant aesthetic, no text, no words",
  Travel:  "Breathtaking aerial tropical landscape, crystal blue water, lush greenery, cinematic drone shot, no text, no words",
  Other:   "Vibrant colorful shopping bags and products, dynamic composition, bright modern aesthetic, no text, no words",
};

export async function generateBackground(
  category: string,
  outputPath: string,
): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[generate-background] No GEMINI_API_KEY set");
    return false;
  }

  const prompt = CATEGORY_PROMPTS[category] ?? CATEGORY_PROMPTS["Other"];

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
    console.log(`[generate-background] Gemini generated background for "${category}"`);
    return true;
  } catch (err) {
    console.warn("[generate-background] Failed:", err);
    return false;
  }
}
