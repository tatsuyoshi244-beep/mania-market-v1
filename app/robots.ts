import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/dashboard/", "/mypage/", "/api/", "/checkout/", "/login", "/auth/"]
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getSiteUrl()
  };
}
