import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [["", 1], ["/pricing", 0.8], ["/register", 0.6], ["/privacy", 0.3], ["/terms", 0.3]];
  return pages.map(([path, priority]) => ({ url: `${SITE_URL}${path}`, changeFrequency: "monthly", priority }));
}
