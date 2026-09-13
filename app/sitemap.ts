import type { MetadataRoute } from "next";
import { listSitemapEntries } from "@/lib/queries/seo";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/categories"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/shops"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/products"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/seller-guide"), changeFrequency: "monthly", priority: 0.6 }
  ];
  const entries = await listSitemapEntries();

  return staticPages.concat(
    entries.map((entry) => ({
      url: absoluteUrl(entry.path),
      lastModified: new Date(entry.updated_at),
      changeFrequency: entry.path.startsWith("/products/") ? "weekly" : "monthly",
      priority: entry.path.startsWith("/categories/") ? 0.8 : 0.7
    }))
  );
}
