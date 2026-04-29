import * as fs from "fs";

const CATEGORY_PROMPTS: Record<string, string> = {
  Tech:    "sleek modern technology flatlay, dark desk with soft blue lighting, minimalist aesthetic, 4K",
  Gaming:  "gaming setup with RGB lighting, dark room, purple and blue glow, cinematic",
  Home:    "cozy modern home interior, warm lighting, minimal Scandinavian style",
  Fashion: "fashion lifestyle flat lay, neutral tones, modern minimal aesthetic",
  Beauty:  "luxury beauty products flatlay, soft pink and gold tones, elegant",
  Travel:  "stunning travel destination aerial view, vibrant colors, wanderlust",
  Other:   "modern shopping lifestyle, vibrant colors, dynamic composition",
};

export async function generateBackground(
  category: string,
  outputPath: string,
): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[generate-background] No GEMINI_API_KEY — skipping background generation");
    return false;
  }

  const prompt = CATEGORY_PROMPTS[category] ?? CATEGORY_PROMPTS["Other"];
  const fullPrompt = `${prompt}, square 1:1 format, no text, no watermarks, professional photography style`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: fullPrompt }],
          parameters: { sampleCount: 1, aspectRatio: "1:1" },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.warn("[generate-background] Imagen API error:", res.status, err);
      return false;
    }

    const data = await res.json() as {
      predictions?: Array<{ bytesBase64Encoded?: string }>;
    };

    const b64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) {
      console.warn("[generate-background] No image in response");
      return false;
    }

    fs.writeFileSync(outputPath, Buffer.from(b64, "base64"));
    console.log(`[generate-background] Saved background to ${outputPath}`);
    return true;
  } catch (err) {
    console.warn("[generate-background] Failed:", err);
    return false;
  }
}
