import fs from "fs";

const GRAPH_API = "https://graph.facebook.com/v21.0";

async function uploadToCloudinary(imagePath: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const preset    = process.env.CLOUDINARY_UPLOAD_PRESET!;

  const formData = new FormData();
  formData.append("upload_preset", preset);
  formData.append("file", new Blob([fs.readFileSync(imagePath)], { type: "image/png" }));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body:   formData,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status} ${await res.text()}`);
  const data = await res.json() as { secure_url: string };
  return data.secure_url;
}

async function waitForContainer(containerId: string, token: string): Promise<void> {
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 5_000));
    const res  = await fetch(`${GRAPH_API}/${containerId}?fields=status_code&access_token=${token}`);
    const body = await res.json() as { status_code?: string };
    if (body.status_code === "FINISHED") return;
    if (body.status_code === "ERROR") throw new Error(`Container ${containerId} errored`);
    console.log(`[instagram] Container status: ${body.status_code ?? "IN_PROGRESS"}…`);
  }
  throw new Error("Timed out waiting for media container");
}

async function createContainer(
  accountId: string,
  token: string,
  imageUrl: string,
  caption: string,
  isCarouselItem = false,
): Promise<string> {
  const body: Record<string, string | boolean> = {
    image_url:    imageUrl,
    access_token: token,
  };
  if (isCarouselItem) {
    body.is_carousel_item = true;
  } else {
    body.caption = caption;
  }

  const res = await fetch(`${GRAPH_API}/${accountId}/media`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Create container failed: ${res.status} ${await res.text()}`);
  const data = await res.json() as { id: string };
  return data.id;
}

async function publishSingle(
  accountId: string,
  token: string,
  imageUrl: string,
  caption: string,
): Promise<string> {
  const containerId = await createContainer(accountId, token, imageUrl, caption);
  await waitForContainer(containerId, token);

  const res = await fetch(`${GRAPH_API}/${accountId}/media_publish`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ creation_id: containerId, access_token: token }),
    signal:  AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Publish failed: ${res.status} ${await res.text()}`);
  const data = await res.json() as { id: string };
  return data.id;
}

async function publishCarousel(
  accountId: string,
  token: string,
  imageUrls: string[],
  caption: string,
): Promise<string> {
  // Create individual carousel item containers
  console.log(`[instagram] Creating ${imageUrls.length} carousel containers…`);
  const childIds: string[] = [];
  for (const url of imageUrls) {
    const id = await createContainer(accountId, token, url, "", true);
    await waitForContainer(id, token);
    childIds.push(id);
  }

  // Create the carousel container
  const carouselRes = await fetch(`${GRAPH_API}/${accountId}/media`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      media_type:   "CAROUSEL",
      children:     childIds.join(","),
      caption,
      access_token: token,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!carouselRes.ok) throw new Error(`Carousel container failed: ${carouselRes.status} ${await carouselRes.text()}`);
  const { id: carouselId } = await carouselRes.json() as { id: string };

  await waitForContainer(carouselId, token);

  const publishRes = await fetch(`${GRAPH_API}/${accountId}/media_publish`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ creation_id: carouselId, access_token: token }),
    signal:  AbortSignal.timeout(20_000),
  });
  if (!publishRes.ok) throw new Error(`Carousel publish failed: ${publishRes.status} ${await publishRes.text()}`);
  const data = await publishRes.json() as { id: string };
  return data.id;
}

const REQUIRED_VARS = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_UPLOAD_PRESET",
  "INSTAGRAM_ACCESS_TOKEN",
  "INSTAGRAM_ACCOUNT_ID",
];

async function postStory(
  accountId: string,
  token: string,
  imageUrl: string,
  linkUrl: string,
): Promise<string> {
  // Pass params as query string — Meta's documented approach for link_sticker_url
  const qs = new URLSearchParams({
    image_url:        imageUrl,
    media_type:       "STORIES",
    link_sticker_url: linkUrl,
    access_token:     token,
  });

  const createRes = await fetch(`${GRAPH_API}/${accountId}/media?${qs}`, {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
  });
  if (!createRes.ok) throw new Error(`Story container failed: ${createRes.status} ${await createRes.text()}`);
  const { id: containerId } = await createRes.json() as { id: string };

  await waitForContainer(containerId, token);

  const publishRes = await fetch(`${GRAPH_API}/${accountId}/media_publish`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ creation_id: containerId, access_token: token }),
    signal:  AbortSignal.timeout(20_000),
  });
  if (!publishRes.ok) throw new Error(`Story publish failed: ${publishRes.status} ${await publishRes.text()}`);
  const data = await publishRes.json() as { id: string };
  return data.id;
}

export async function uploadAndPost(
  imagePaths: string[],
  caption: string,
  storyLinkUrl?: string,
): Promise<void> {
  const missing = REQUIRED_VARS.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.log(`[instagram] Auto-post skipped — missing env vars: ${missing.join(", ")}`);
    return;
  }

  const accountId = process.env.INSTAGRAM_ACCOUNT_ID!;
  const token     = process.env.INSTAGRAM_ACCESS_TOKEN!;

  console.log(`[instagram] Uploading ${imagePaths.length} image(s) to Cloudinary…`);
  const imageUrls = await Promise.all(imagePaths.map(uploadToCloudinary));

  let mediaId: string;
  if (imageUrls.length === 1) {
    console.log("[instagram] Posting single image…");
    mediaId = await publishSingle(accountId, token, imageUrls[0], caption);
  } else {
    console.log(`[instagram] Posting carousel with ${imageUrls.length} slides…`);
    mediaId = await publishCarousel(accountId, token, imageUrls, caption);
  }
  console.log(`[instagram] Feed post published! Media ID: ${mediaId}`);

  // Post a Story with a clickable link sticker for the top deal
  if (storyLinkUrl) {
    try {
      console.log(`[instagram] Posting Story with link sticker → ${storyLinkUrl}`);
      const storyId = await postStory(accountId, token, imageUrls[0], storyLinkUrl);
      console.log(`[instagram] Story published! Media ID: ${storyId}`);
    } catch (err) {
      console.warn("[instagram] Story post failed (feed post still succeeded):", err);
    }
  }
}
