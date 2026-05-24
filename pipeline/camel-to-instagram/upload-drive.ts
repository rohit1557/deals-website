import fs from "fs";
import path from "path";
import { google } from "googleapis";

/**
 * Upload a file to the user's own Google Drive using OAuth2 refresh token.
 *
 * Required env vars (GitHub secrets):
 *   GOOGLE_OAUTH_CLIENT_ID      — OAuth2 client ID
 *   GOOGLE_OAUTH_CLIENT_SECRET  — OAuth2 client secret
 *   GOOGLE_OAUTH_REFRESH_TOKEN  — long-lived refresh token from user's Google account
 *   GOOGLE_DRIVE_FOLDER_ID      — ID of the target Drive folder
 */
export async function uploadToGoogleDrive(filePath: string): Promise<string> {
  const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const folderId     = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!clientId || !clientSecret || !refreshToken || !folderId) {
    console.warn("[drive] Missing OAuth env vars — skipping Google Drive upload");
    return "";
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  const drive = google.drive({ version: "v3", auth });
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

  const viewLink = res.data.webViewLink!;
  console.log(`[drive] Uploaded! View on Android: ${viewLink}`);
  return viewLink;
}
