import { NextRequest } from "next/server";

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

  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    // Graceful fallback — don't block user if Loops isn't configured yet
    console.warn("[subscribe] LOOPS_API_KEY not set — skipping Loops contact creation");
    return Response.json({ ok: true });
  }

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
      }),
    });

    if (!res.ok) {
      // 409 = contact already exists in Loops — treat as success
      if (res.status === 409) {
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
