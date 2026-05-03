import { uploadToCloudinary } from "./cloudinary";

const BUFFER_API = "https://api.bufferapp.com/1";

interface BufferUpdateResponse {
  success: boolean;
  updates?: Array<{ id: string; status: string }>;
  message?: string;
}

export async function postToBuffer(imagePaths: string[], caption: string): Promise<void> {
  const token     = process.env.BUFFER_ACCESS_TOKEN;
  const profileId = process.env.BUFFER_PROFILE_ID;

  if (!token || !profileId) {
    console.log("[buffer] Skipped — BUFFER_ACCESS_TOKEN or BUFFER_PROFILE_ID not set");
    return;
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_UPLOAD_PRESET) {
    console.log("[buffer] Skipped — Cloudinary not configured");
    return;
  }

  console.log(`[buffer] Uploading ${imagePaths.length} image(s) to Cloudinary…`);
  const imageUrls = await Promise.all(imagePaths.map(uploadToCloudinary));
  console.log("[buffer] Upload done:", imageUrls.map(u => u.split("/").pop()).join(", "));

  const params = new URLSearchParams();
  params.append("profile_ids[]", profileId);
  params.append("text", caption);

  if (imageUrls.length === 1) {
    params.append("media[photo]", imageUrls[0]);
  } else {
    for (const url of imageUrls) {
      params.append("media[photo_url_list][]", url);
    }
  }

  const res = await fetch(`${BUFFER_API}/updates/create.json`, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type":  "application/x-www-form-urlencoded",
    },
    body:   params.toString(),
    signal: AbortSignal.timeout(20_000),
  });

  const body = await res.json() as BufferUpdateResponse;

  if (!res.ok || !body.success) {
    throw new Error(`Buffer API error ${res.status}: ${body.message ?? JSON.stringify(body)}`);
  }

  const updateId = body.updates?.[0]?.id ?? "unknown";
  const status   = body.updates?.[0]?.status ?? "queued";
  console.log(`[buffer] Post queued! Update ID: ${updateId} (${status})`);
}
