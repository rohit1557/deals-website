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
