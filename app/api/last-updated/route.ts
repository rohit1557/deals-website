import { db } from "@/lib/db";

export const revalidate = 300;

export async function GET() {
  const latest = await db.deal.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  return Response.json({ updatedAt: latest?.createdAt ?? null });
}
