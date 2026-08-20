import { queryOne, queryRows } from "@/lib/neon/db";
import type { HomeProduct } from "@/lib/queries/products";
import type { HomeShop } from "@/lib/queries/shops";

const productProjection = `p.id::text, p.name, p.description, p.price_label, p.external_url, p.image_url,
  p.shop_id::text, p.created_at::text,
  coalesce((select jsonb_agg(jsonb_build_object('tag', pt.tag) order by pt.tag)
    from public.product_tags pt where pt.product_id = p.id), '[]'::jsonb) as product_tags,
  jsonb_build_object('id', s.id::text, 'name', s.name, 'slug', s.slug,
    'logo_url', s.logo_url, 'website_url', s.website_url) as shops`;

const shopProjection = `s.id::text, s.slug, s.name, s.description, s.website_url, s.logo_url,
  s.cover_image_url, s.twitter_url, s.instagram_url, s.is_published, s.created_at::text,
  coalesce((select jsonb_agg(jsonb_build_object('categories',
    jsonb_build_object('name', c.name, 'slug', c.slug)) order by c.sort_order)
    from public.shop_categories sc join public.categories c on c.id = sc.category_id
    where sc.shop_id = s.id), '[]'::jsonb) as shop_categories`;

export async function listFavoriteProducts(_client: unknown, userId: string): Promise<HomeProduct[]> {
  return queryRows<HomeProduct>(`select ${productProjection} from public.favorites f
    join public.products p on p.id = f.product_id join public.shops s on s.id = p.shop_id
    where f.user_id = $1 and p.status = 'active' order by f.created_at desc`, [userId]);
}

export async function listFavoriteShops(_client: unknown, userId: string): Promise<HomeShop[]> {
  return queryRows<HomeShop>(`select ${shopProjection} from public.favorites f
    join public.shops s on s.id = f.shop_id where f.user_id = $1 and s.is_published = true
    order by f.created_at desc`, [userId]);
}

export async function listFollowingShops(_client: unknown, userId: string): Promise<HomeShop[]> {
  return queryRows<HomeShop>(`select ${shopProjection} from public.follows f
    join public.shops s on s.id = f.shop_id where f.user_id = $1 and s.is_published = true
    order by f.created_at desc`, [userId]);
}

export async function getMypageCounts(_client: unknown, userId: string) {
  const row = await queryOne<{ favorite_products: number; favorite_shops: number; following_shops: number }>(
    `select
      (select count(*)::int from public.favorites where user_id = $1 and product_id is not null) favorite_products,
      (select count(*)::int from public.favorites where user_id = $1 and shop_id is not null) favorite_shops,
      (select count(*)::int from public.follows where user_id = $1) following_shops`, [userId]);
  return { favoriteProducts: row?.favorite_products ?? 0, favoriteShops: row?.favorite_shops ?? 0,
    followingShops: row?.following_shops ?? 0 };
}
