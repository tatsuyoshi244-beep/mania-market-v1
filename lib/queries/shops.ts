import { pageRange, SHOP_PAGE_SIZE, totalPages } from "@/lib/pagination";
import { queryFailure, querySuccess, type QueryResult } from "@/lib/db/errors";
import { queryOne, queryRows } from "@/lib/neon/db";

export type HomeShop = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  is_published: boolean;
  created_at: string;
  shop_categories?: Array<{ categories: { name: string; slug: string } | null }>;
};

const shopProjection = `
  s.id::text, s.slug, s.name, s.description, s.website_url, s.logo_url,
  s.cover_image_url, s.twitter_url, s.instagram_url, s.is_published,
  s.created_at::text,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'categories', jsonb_build_object('name', c.name, 'slug', c.slug)
    ) order by c.sort_order)
    from public.shop_categories sc
    join public.categories c on c.id = sc.category_id
    where sc.shop_id = s.id
  ), '[]'::jsonb) as shop_categories`;

export async function getPopularShops(limit = 6): Promise<QueryResult<HomeShop[]>> {
  const source = "shops.getPopularShops";
  try {
    const data = await queryRows<HomeShop>(
      `with shop_scores as (
         select s.id,
           (
             coalesce((select count(*) from public.analytics_events ae
               where ae.shop_id = s.id and ae.event_type = 'shop_view'
                 and ae.created_at >= now() - interval '30 days'), 0) * 1
             + coalesce((select count(*) from public.analytics_events ae
               join public.products p on p.id = ae.product_id
               where p.shop_id = s.id and ae.event_type = 'external_click'
                 and ae.created_at >= now() - interval '30 days'), 0) * 4
             + coalesce((select count(*) from public.favorites f where f.shop_id = s.id), 0) * 3
             + coalesce((select count(*) from public.follows f where f.shop_id = s.id), 0) * 2
             + greatest(0, 30 - floor(extract(epoch from (now() - s.updated_at)) / 86400))
           )::numeric as popularity_score
         from public.shops s
         where s.is_published = true
       )
       select ${shopProjection}
       from public.shops s
       join shop_scores ss on ss.id = s.id
       where s.is_published = true
       order by ss.popularity_score desc, s.updated_at desc, s.created_at desc
       limit $1`,
      [limit]
    );
    return querySuccess(source, data);
  } catch (error) {
    return queryFailure(source, error, []);
  }
}

export async function listShops(
  options: { page: number; query?: string; categorySlug?: string }
) {
  const { page, query, categorySlug } = options;
  const { from } = pageRange(page, SHOP_PAGE_SIZE);
  const params: Array<string | number> = [];
  const conditions = ["s.is_published = true"];

  let queryParam: number | null = null;
  if (query) {
    params.push(query);
    queryParam = params.length;
    conditions.push(`(
      s.name ilike '%' || $${queryParam} || '%'
      or s.description ilike '%' || $${queryParam} || '%'
      or exists (
        select 1 from public.shop_categories scq
        join public.categories cq on cq.id = scq.category_id
        where scq.shop_id = s.id
          and (cq.name ilike '%' || $${queryParam} || '%' or cq.description ilike '%' || $${queryParam} || '%')
      )
      or exists (
        select 1 from public.products pq
        where pq.shop_id = s.id and pq.status = 'active'
          and (pq.name ilike '%' || $${queryParam} || '%' or pq.description ilike '%' || $${queryParam} || '%')
      )
    )`);
  }
  if (categorySlug) {
    params.push(categorySlug);
    conditions.push(`exists (
      select 1 from public.shop_categories sc2
      join public.categories c2 on c2.id = sc2.category_id
      where sc2.shop_id = s.id and c2.slug = $${params.length}
    )`);
  }

  const where = conditions.join(" and ");
  const countRow = await queryOne<{ count: number }>(
    `select count(*)::int as count from public.shops s where ${where}`,
    params
  );
  params.push(SHOP_PAGE_SIZE, from);
  const relevanceOrder = queryParam
    ? `case
         when lower(s.name) = lower($${queryParam}::text) then 0
         when s.name ilike ($${queryParam} || '%') then 1
         else 2
       end asc,`
    : "";
  const shops = await queryRows<HomeShop>(
    `select ${shopProjection}
     from public.shops s
     where ${where}
     order by ${relevanceOrder} s.created_at desc
     limit $${params.length - 1} offset $${params.length}`,
    params
  );
  const total = countRow?.count ?? 0;
  return { shops, total, page, totalPages: totalPages(total, SHOP_PAGE_SIZE) };
}

export async function getShopBySlug(slug: string) {
  return queryOne<HomeShop>(
    `select ${shopProjection}
     from public.shops s
     where s.slug = $1 and s.is_published = true
     limit 1`,
    [slug]
  );
}

export async function listShopsByCategory(categoryId: string) {
  return queryRows<HomeShop>(
    `select ${shopProjection}
     from public.shops s
     where s.is_published = true
       and exists (
         select 1 from public.shop_categories sc
         where sc.shop_id = s.id and sc.category_id = $1::uuid
       )
     order by s.created_at desc`,
    [categoryId]
  );
}
