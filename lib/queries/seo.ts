import { queryRows } from "@/lib/neon/db";

export type SitemapEntry = {
  path: string;
  updated_at: string;
};

export async function listSitemapEntries(): Promise<SitemapEntry[]> {
  try {
    return await queryRows<SitemapEntry>(
      `select '/categories/' || c.slug as path, c.created_at::text as updated_at
       from public.categories c
       union all
       select '/shops/' || s.slug as path, s.updated_at::text as updated_at
       from public.shops s
       where s.is_published = true
       union all
       select '/products/' || p.id::text as path, p.updated_at::text as updated_at
       from public.products p
       join public.shops s on s.id = p.shop_id
       where p.status = 'active' and s.is_published = true`
    );
  } catch (error) {
    console.error("[seo.listSitemapEntries]", error);
    return [];
  }
}
