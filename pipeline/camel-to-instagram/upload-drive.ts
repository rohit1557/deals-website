import fs from "fs";
import path from "path";
import { google } from "googleapis";

/**
 * Upload a file to Google Drive using a service account.
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  — full JSON key of the service account
 *   GOOGLE_DRIVE_FOLDER_ID       — ID of the Drive folder shared with the service account
 */
export async function uploadToGoogleDrive(filePath: string): Promise<string> {
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!credJson || !folderId) {
    console.warn("[drive] GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_DRIVE_FOLDER_ID not set — skipping");
    return "";
  }

  const creds = JSON.parse(credJson);
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const drive = google.drive({ version: "v3", auth });
  const fileName = path.basename(filePath);
  const today = new Date().toISOString().slice(0, 10);
  const displayName = `DealDrop_Reel_${today}.mp4`;

  console.log(`[drive] Uploading ${displayName} to Google Drive...`);

  const res = await drive.files.create({
    requestBody: {
      name: displayName,
      parents: [folderId],
    },
    media: {
      mimeType: "video/mp4",
      body: fs.createReadStream(filePath),
    },
    fields: "id, webViewLink",
  });

  const fileId = res.data.id!;
  const viewLink = res.data.webViewLink!;

  // Make it viewable by anyone with the link so you can open on Android
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  console.log(`[drive] Uploaded! Open on Android: ${viewLink}`);
  return viewLink;
}
