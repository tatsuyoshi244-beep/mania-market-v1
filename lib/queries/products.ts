import { pageRange, PRODUCT_PAGE_SIZE, totalPages } from "@/lib/pagination";
import { queryFailure, querySuccess, type QueryResult } from "@/lib/db/errors";
import { queryOne, queryRows } from "@/lib/neon/db";

export type HomeProduct = {
  id: string;
  name: string;
  description: string | null;
  price_label: string | null;
  external_url: string;
  image_url: string | null;
  shop_id?: string;
  created_at: string;
  category_slug?: string | null;
  product_tags?: Array<{ tag: string }>;
  shops?: {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    logo_url?: string | null;
    website_url?: string | null;
    instagram_url?: string | null;
  } | null;
};

const productProjection = `
  p.id::text, p.name, p.description, p.price_label, p.external_url,
  p.image_url, p.shop_id::text, p.created_at::text,
  (select c.slug from public.shop_categories sc
    join public.categories c on c.id = sc.category_id
    where sc.shop_id = p.shop_id order by c.sort_order, c.slug limit 1) as category_slug,
  coalesce((
    select jsonb_agg(jsonb_build_object('tag', pt.tag) order by pt.tag)
    from public.product_tags pt where pt.product_id = p.id
  ), '[]'::jsonb) as product_tags,
  jsonb_build_object(
    'id', s.id::text, 'name', s.name, 'slug', s.slug,
    'description', s.description, 'logo_url', s.logo_url,
    'website_url', s.website_url, 'instagram_url', s.instagram_url
  ) as shops`;

export async function getNewProducts(limit = 8): Promise<QueryResult<HomeProduct[]>> {
  const source = "products.getNewProducts";
  try {
    const data = await queryRows<HomeProduct>(
      `select ${productProjection}
       from public.products p join public.shops s on s.id = p.shop_id
       where p.status = 'active' and s.is_published = true
       order by p.created_at desc limit $1`,
      [limit]
    );
    return querySuccess(source, data);
  } catch (error) {
    return queryFailure(source, error, []);
  }
}

export async function listProducts(
  options: { page: number; query?: string; categorySlug?: string; tag?: string }
) {
  const { page, query, categorySlug, tag } = options;
  const { from } = pageRange(page, PRODUCT_PAGE_SIZE);
  const params: Array<string | number> = [];
  const conditions = ["p.status = 'active'", "s.is_published = true"];

  let queryParam: number | null = null;
  if (query) {
    params.push(query);
    queryParam = params.length;
    conditions.push(`(
      p.name ilike '%' || $${queryParam} || '%'
      or p.description ilike '%' || $${queryParam} || '%'
      or s.name ilike '%' || $${queryParam} || '%'
      or s.description ilike '%' || $${queryParam} || '%'
      or exists (
        select 1 from public.product_tags pt
        where pt.product_id = p.id and pt.tag ilike '%' || $${queryParam} || '%'
      )
      or exists (
        select 1 from public.shop_categories scq
        join public.categories cq on cq.id = scq.category_id
        where scq.shop_id = p.shop_id
          and (cq.name ilike '%' || $${queryParam} || '%' or cq.description ilike '%' || $${queryParam} || '%')
      )
    )`);
  }
  if (categorySlug) {
    params.push(categorySlug);
    conditions.push(`exists (
      select 1 from public.shop_categories sc
      join public.categories c on c.id = sc.category_id
      where sc.shop_id = p.shop_id and c.slug = $${params.length}
    )`);
  }
  if (tag) {
    params.push(`%${tag.toLowerCase()}%`);
    conditions.push(`exists (
      select 1 from public.product_tags pt
      where pt.product_id = p.id and pt.tag ilike $${params.length}
    )`);
  }

  const where = conditions.join(" and ");
  const countRow = await queryOne<{ count: number }>(
    `select count(*)::int as count
     from public.products p join public.shops s on s.id = p.shop_id
     where ${where}`,
    params
  );
  params.push(PRODUCT_PAGE_SIZE, from);
  const relevanceOrder = queryParam
    ? `case
         when lower(p.name) = lower($${queryParam}::text) then 0
         when p.name ilike ($${queryParam} || '%') then 1
         when exists (select 1 from public.product_tags ptr where ptr.product_id = p.id and lower(ptr.tag) = lower($${queryParam}::text)) then 2
         when s.name ilike ($${queryParam} || '%') then 3
         else 4
       end asc,`
    : "";
  const products = await queryRows<HomeProduct>(
    `select ${productProjection}
     from public.products p join public.shops s on s.id = p.shop_id
     where ${where}
     order by ${relevanceOrder} p.created_at desc
     limit $${params.length - 1} offset $${params.length}`,
    params
  );
  const total = countRow?.count ?? 0;
  return { products, total, page, totalPages: totalPages(total, PRODUCT_PAGE_SIZE) };
}

export async function getProductById(id: string) {
  return queryOne<HomeProduct>(
    `select ${productProjection}
     from public.products p join public.shops s on s.id = p.shop_id
     where p.id = $1::uuid and p.status = 'active' and s.is_published = true
     limit 1`,
    [id]
  );
}

export async function listProductsByShop(shopId: string) {
  return queryRows<HomeProduct>(
    `select ${productProjection}
     from public.products p join public.shops s on s.id = p.shop_id
     where p.shop_id = $1::uuid and p.status = 'active' and s.is_published = true
     order by p.created_at desc`,
    [shopId]
  );
}

export async function listProductsByCategory(categoryId: string) {
  return queryRows<HomeProduct>(
    `select ${productProjection}
     from public.products p join public.shops s on s.id = p.shop_id
     where p.status = 'active' and s.is_published = true
       and exists (
         select 1 from public.shop_categories sc
         where sc.shop_id = p.shop_id and sc.category_id = $1::uuid
       )
     order by p.created_at desc`,
    [categoryId]
  );
}

export async function getDiscoverProducts(limit = 3): Promise<QueryResult<HomeProduct[]>> {
  const source = "products.getDiscoverProducts";
  try {
    const pool = await queryRows<HomeProduct>(
      `select ${productProjection}
       from public.products p join public.shops s on s.id = p.shop_id
       where p.status = 'active' and s.is_published = true
       order by p.created_at desc limit 48`
    );
    const { getDailySeed, pickDailyCurated } = await import("@/lib/discover");
    return querySuccess(source, pickDailyCurated(pool, limit, getDailySeed()));
  } catch (error) {
    return queryFailure(source, error, []);
  }
}
