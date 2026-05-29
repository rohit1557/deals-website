const TRYPOST_BASE = "https://app.trypost.it";
const TRYPOST_SOCIAL_ACCOUNT_ID = "019e634e-3307-7184-b938-c16749ae60ea";

export async function postReelToTryPost(videoUrl: string, caption: string): Promise<void> {
  const token = process.env.TRYPOST_API_TOKEN;
  if (!token) {
    console.warn("[trypost] TRYPOST_API_TOKEN not set — skipping auto-publish");
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Schedule 15 minutes from now — gives TryPost time to process the video
  const scheduledAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Step 1: Create post as draft first
  const createRes = await fetch(`${TRYPOST_BASE}/api/posts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      content: caption,
      scheduled_at: scheduledAt,
      platforms: [{ social_account_id: TRYPOST_SOCIAL_ACCOUNT_ID, content_type: "instagram_reel" }],
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!createRes.ok) {
    throw new Error(`[trypost] Create post failed: ${createRes.status} ${await createRes.text()}`);
  }

  const post = (await createRes.json()) as { id: string; status?: string };
  console.log(`[trypost] Post created: ${post.id} (status: ${post.status})`);

  // Step 2: Attach media
  const mediaRes = await fetch(`${TRYPOST_BASE}/api/posts/${post.id}/media/from-url`, {
    method: "POST",
    headers,
    body: JSON.stringify({ urls: [videoUrl] }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!mediaRes.ok) {
    throw new Error(`[trypost] Attach media failed: ${mediaRes.status} ${await mediaRes.text()}`);
  }

  const mediaBody = await mediaRes.json().catch(() => ({}));
  console.log(`[trypost] Media attached (status: ${(mediaBody as any)?.status ?? "unknown"})`);

  // Step 3: PUT to set status=scheduled (PATCH not supported; media attachment resets to draft)
  const scheduleRes = await fetch(`${TRYPOST_BASE}/api/posts/${post.id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      content: caption,
      status: "scheduled",
      scheduled_at: scheduledAt,
      platforms: [{ social_account_id: TRYPOST_SOCIAL_ACCOUNT_ID, content_type: "instagram_reel" }],
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!scheduleRes.ok) {
    const body = await scheduleRes.text();
    console.warn(`[trypost] PATCH status failed (${scheduleRes.status}): ${body}`);
    // Not fatal — post exists, just may stay as draft
  } else {
    const schedBody = (await scheduleRes.json()) as { status?: string };
    console.log(`[trypost] Reel scheduled for ${scheduledAt} — status: ${schedBody.status}`);
  }
}
