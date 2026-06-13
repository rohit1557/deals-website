import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  let email: string;
  try {
    ({ email } = await req.json());
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  // Vercel injects this header automatically — free geo, no external API
  const country = (req.headers.get("x-vercel-ip-country") ?? "AU").toUpperCase();

  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    console.warn("[subscribe] LOOPS_API_KEY not set — skipping Loops contact creation");
    return Response.json({ ok: true });
  }

  // Store in Neon so deals-crew can query subscribers by country
  try {
    await db.$executeRaw`
      INSERT INTO subscribers (email, country)
      VALUES (${email.toLowerCase()}, ${country})
      ON CONFLICT (email) DO UPDATE
        SET country = EXCLUDED.country, is_active = TRUE
    `;
  } catch (err) {
    // Non-fatal — Loops is the source of truth for email sending
    console.error("[subscribe] Failed to store subscriber in DB:", err);
  }

  // Create contact in Loops with country property for segmentation
  try {
    const res = await fetch("https://app.loops.so/api/v1/contacts/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        source: "dealdrop-website",
        subscribed: true,
        country,
        userGroup: country === "IN" ? "india" : "australia",
      }),
    });

    if (!res.ok) {
      if (res.status === 409) {
        // Contact exists — update their country in case it changed
        await fetch("https://app.loops.so/api/v1/contacts/update", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, country, userGroup: country === "IN" ? "india" : "australia" }),
        });
        return Response.json({ ok: true });
      }
      const body = await res.text();
      console.error("[subscribe] Loops error %d: %s", res.status, body);
      return Response.json({ error: "Subscription failed" }, { status: 502 });
    }
  } catch (err) {
    console.error("[subscribe] Loops fetch failed:", err);
    return Response.json({ error: "Network error" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
