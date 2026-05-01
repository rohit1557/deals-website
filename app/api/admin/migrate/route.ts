import { NextRequest } from "next/server";
import { db } from "@/lib/db";

// One-time migration: add votes + comments_count columns for DesiDime engagement data.
// Safe to run multiple times (IF NOT EXISTS).
export async function POST(_req: NextRequest) {
  await db.$executeRaw`ALTER TABLE deals ADD COLUMN IF NOT EXISTS votes INT DEFAULT 0`;
  await db.$executeRaw`ALTER TABLE deals ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0`;
  return Response.json({ ok: true, message: "votes + comments_count columns ensured" });
}
