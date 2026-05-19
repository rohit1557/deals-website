import { db } from "@/lib/db";

export const revalidate = 60; // Cache for 60 seconds

interface SourceHealth {
  source: string;
  totalActiveDeals: number;
  dealsWithImage: number;
  dealsMissingImage: number;
  missingImagePercentage: number;
}

export async function GET(): Promise<Response> {
  try {
    // Query Neon directly via Prisma raw query for per-source stats
    const results = await db.$queryRaw<
      Array<{
        source: string;
        total_active_deals: bigint;
        deals_with_image: bigint;
        deals_missing_image: bigint;
        missing_image_pct: number;
      }>
    >`
      SELECT 
        source,
        COUNT(*) as total_active_deals,
        COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as deals_with_image,
        COUNT(CASE WHEN image_url IS NULL THEN 1 END) as deals_missing_image,
        ROUND(100.0 * COUNT(CASE WHEN image_url IS NULL THEN 1 END) / COUNT(*), 2) as missing_image_pct
      FROM deals
      WHERE is_active = true
      GROUP BY source
      ORDER BY source
    `;

    // Cast bigint to number for JSON serialization
    const formatted: SourceHealth[] = results.map((row) => ({
      source: row.source || "unknown",
      totalActiveDeals: Number(row.total_active_deals),
      dealsWithImage: Number(row.deals_with_image),
      dealsMissingImage: Number(row.deals_missing_image),
      missingImagePercentage: row.missing_image_pct,
    }));

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: formatted,
    });
  } catch (error) {
    console.error("[source-health] Query failed:", error);
    return Response.json(
      { success: false, error: "Failed to fetch source health stats" },
      { status: 500 },
    );
  }
}
