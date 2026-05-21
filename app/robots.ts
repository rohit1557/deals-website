import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/out", "/api/", "/reel/"],
    },
    sitemap: "https://dealdrop.au/sitemap.xml",
  };
}
