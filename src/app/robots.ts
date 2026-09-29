import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Only the public marketing pages are meant for search engines.
    rules: { userAgent: "*", allow: ["/$", "/pricing", "/privacy", "/terms", "/login", "/register"], disallow: ["/api/", "/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
