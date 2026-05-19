import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", disallow: ["/out", "/api/", "/reel/latest"] },
      { userAgent: "*", allow: "/" },
    ],
    sitemap: "https://dealdrop.au/sitemap.xml",
  };
}
