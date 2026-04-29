import * as fs from "fs";

const CATEGORY_PROMPTS: Record<string, string> = {
  Tech:    "Ultra-modern tech workspace, glowing screens, dark ambient lighting, blue and purple neon accents, cinematic 4K photography, no people, no text",
  Gaming:  "Epic gaming setup with RGB rainbow lighting, dark room, multiple monitors glowing, cinematic dramatic lighting, no people, no text",
  Home:    "Luxurious modern living room interior, warm golden hour lighting, Scandinavian minimal style, cozy atmosphere, no people, no text",
  Fashion: "High-fashion editorial flat lay, luxury fabrics, neutral beige and gold tones, elegant minimal composition, no text",
  Beauty:  "Luxury beauty and skincare products, soft pink marble surface, golden light, elegant aesthetic, no text",
  Travel:  "Breathtaking aerial travel landscape, vibrant tropical colors, crystal blue water, lush greenery, cinematic drone shot, no text",
  Other:   "Vibrant colorful abstract background, dynamic diagonal shapes, rich jewel tones, modern graphic design aesthetic, no text",
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
