import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const revalidate = 3600; // regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://deals-website-peach.vercel.app";

  // Static pages
  const static_pages: MetadataRoute.Sitemap = [
    { url: baseUrl,            lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  ];

  // Dynamic deal pages
  const deals = await db.deal.findMany({
    where: { isActive: true },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const deal_pages: MetadataRoute.Sitemap = deals.map((d) => ({
    url: `${baseUrl}/deals/${d.id}`,
    lastModified: d.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...static_pages, ...deal_pages];
}
