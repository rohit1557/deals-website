import fs from "fs";

export async function uploadToCloudinary(imagePath: string): Promise<string> {
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

export async function uploadVideoToCloudinary(videoPath: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const preset    = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) {
    console.warn("[cloudinary] CLOUDINARY_CLOUD_NAME or CLOUDINARY_UPLOAD_PRESET not set — skipping upload");
    return "";
  }

  const formData = new FormData();
  formData.append("upload_preset", preset);
  formData.append("resource_type", "video");
  formData.append("file", new Blob([fs.readFileSync(videoPath)], { type: "video/mp4" }));

  console.log("[cloudinary] Uploading reel to Cloudinary...");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
    method: "POST",
    body:   formData,
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Cloudinary video upload failed: ${res.status} ${await res.text()}`);
  const data = await res.json() as { secure_url: string };
  console.log("[cloudinary] Reel uploaded:", data.secure_url);
  return data.secure_url;
}
