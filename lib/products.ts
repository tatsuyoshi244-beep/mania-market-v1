import type { ProductLimitInfo } from "@/types/auth";
import type { PlanKey, Product, Shop } from "@/types/database";
import { queryOne, queryRows } from "@/lib/neon/db";

export async function getProductLimitInfo(sellerId: string): Promise<ProductLimitInfo> {
  const row = await queryOne<{ plan_key: PlanKey; product_limit: number | null; product_count: number }>(
    `select u.plan_key, pl.product_limit,
            count(p.id) filter (where p.status in ('hidden','active'))::int as product_count
     from public.users u
     join public.plans pl on pl.key = u.plan_key
     left join public.products p on p.seller_id = u.id
     where u.id = $1
     group by u.plan_key, pl.product_limit`,
    [sellerId]
  );
  if (!row) throw new Error("ユーザーまたはプラン情報が見つかりません。");
  const remaining = row.product_limit === null ? null : Math.max(row.product_limit - row.product_count, 0);
  return {
    planKey: row.plan_key,
    limit: row.product_limit,
    productCount: row.product_count,
    remaining,
    canCreate: row.product_limit === null || row.product_count < row.product_limit
  };
}

export async function assertCanCreateProduct(sellerId: string) {
  const info = await getProductLimitInfo(sellerId);
  if (!info.canCreate) throw new Error("現在のプランの上限に達しました");
}

export function parseProductTags(raw: string | null): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(/[,、\s]+/).map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

export async function syncProductTags(productId: string, tags: string[]) {
  await queryRows(`delete from public.product_tags where product_id = $1::uuid returning product_id`, [productId]);
  for (const tag of tags) {
    await queryRows(
      `insert into public.product_tags (product_id, tag) values ($1::uuid, $2)
       on conflict do nothing returning product_id`,
      [productId, tag]
    );
  }
}

export async function syncShopCategories(shopId: string, categoryIds: string[]) {
  await queryRows(`delete from public.shop_categories where shop_id = $1::uuid returning shop_id`, [shopId]);
  for (const categoryId of categoryIds) {
    await queryRows(
      `insert into public.shop_categories (shop_id, category_id) values ($1::uuid, $2::uuid)
       on conflict do nothing returning shop_id`,
      [shopId, categoryId]
    );
  }
}

export async function getOwnedShop(ownerId: string) {
  return queryOne<Shop>(`select * from public.shops where owner_id = $1 limit 1`, [ownerId]);
}

export async function getSellerProduct(productId: string, sellerId: string) {
  return queryOne<Product & { product_tags: Array<{ tag: string }> }>(
    `select p.*, coalesce(jsonb_agg(jsonb_build_object('tag', pt.tag))
      filter (where pt.tag is not null), '[]'::jsonb) as product_tags
     from public.products p left join public.product_tags pt on pt.product_id = p.id
     where p.id = $1::uuid and p.seller_id = $2 group by p.id limit 1`,
    [productId, sellerId]
  );
}

export async function listSellerProducts(sellerId: string) {
  return queryRows<{
    id: string; name: string; status: Product["status"]; created_at: string;
    external_url: string; category_id: string | null; product_tags: Array<{ tag: string }>;
    categories: { id: string; name: string } | null;
  }>(
    `select p.id::text, p.name, p.status, p.created_at::text, p.external_url,
            p.category_id::text,
            coalesce(jsonb_agg(distinct jsonb_build_object('tag', pt.tag))
              filter (where pt.tag is not null), '[]'::jsonb) as product_tags,
            case when c.id is null then null else jsonb_build_object('id', c.id::text, 'name', c.name) end as categories
     from public.products p
     left join public.product_tags pt on pt.product_id = p.id
     left join public.categories c on c.id = p.category_id
     where p.seller_id = $1
     group by p.id, c.id
     order by p.created_at desc`,
    [sellerId]
  );
}
