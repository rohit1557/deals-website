/**
 * Run once to get a Google OAuth refresh token for Drive uploads.
 * Usage: ts-node get-drive-token.ts
 */
import { google } from "googleapis";
import * as readline from "readline";

const CLIENT_ID     = process.env.GOOGLE_OAUTH_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET first");
  process.exit(1);
}

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, "urn:ietf:wg:oauth:2.0:oob");
const url  = auth.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/drive.file"],
  prompt: "consent",
});

console.log("\n1. Open this URL in your browser:\n");
console.log(url);
console.log("\n2. Sign in with your Google account and allow access.");
console.log("3. Copy the code shown and paste it below.\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("Paste the code here: ", async (code) => {
  rl.close();
  const { tokens } = await auth.getToken(code.trim());
  console.log("\n✅ Add these as GitHub secrets:\n");
  console.log(`GOOGLE_OAUTH_CLIENT_ID     = ${CLIENT_ID}`);
  console.log(`GOOGLE_OAUTH_CLIENT_SECRET = ${CLIENT_SECRET}`);
  console.log(`GOOGLE_OAUTH_REFRESH_TOKEN = ${tokens.refresh_token}`);
});
