import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://dealdrop.au";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                changeFrequency: "hourly",  priority: 1.0, lastModified: new Date() },
    { url: `${baseUrl}/instagram`, changeFrequency: "hourly",  priority: 0.9, lastModified: new Date() },
    { url: `${baseUrl}/about`,     changeFrequency: "monthly", priority: 0.4, lastModified: new Date() },
    { url: `${baseUrl}/contact`,   changeFrequency: "yearly",  priority: 0.2, lastModified: new Date() },
    { url: `${baseUrl}/privacy`,   changeFrequency: "monthly", priority: 0.2, lastModified: new Date() },
    { url: `${baseUrl}/terms`,     changeFrequency: "monthly", priority: 0.2, lastModified: new Date() },
  ];

  const deals = await db.deal.findMany({
    where:   { isActive: true },
    select:  { id: true, updatedAt: true, country: true },
    orderBy: { updatedAt: "desc" },
    take:    2000,
  });

  const dealPages: MetadataRoute.Sitemap = deals.map((d) => ({
    url:             `${baseUrl}/deals/${d.id}`,
    lastModified:    d.updatedAt,
    changeFrequency: "daily" as const,
    priority:        d.country === "AU" ? 0.8 : 0.7,
  }));

  return [...staticPages, ...dealPages];
}
