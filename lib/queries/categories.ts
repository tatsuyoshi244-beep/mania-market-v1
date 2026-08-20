import { queryRows, queryOne } from "@/lib/neon/db";
import { queryFailure, querySuccess, type QueryResult } from "@/lib/supabase/errors";

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
};

// Retain the first argument while route call sites move from Supabase to Neon.
export async function listAllCategories(_legacyClient?: unknown) {
  try {
    return await queryRows<CategoryRow>(
      `select id::text, slug, name, description, sort_order
       from public.categories
       order by sort_order asc, name asc`
    );
  } catch (error) {
    console.error("[categories.listAllCategories]", error);
    return [];
  }
}

export async function getPopularCategories(
  _legacyClient?: unknown,
  limit = 6
): Promise<QueryResult<CategoryRow[]>> {
  const source = "categories.getPopularCategories";
  try {
    const data = await queryRows<CategoryRow>(
      `select id::text, slug, name, description, sort_order
       from public.categories
       order by sort_order asc, name asc
       limit $1`,
      [limit]
    );
    return querySuccess(source, data);
  } catch (error) {
    return queryFailure(source, error, []);
  }
}

export async function getCategoryShopCounts(
  _legacyClient?: unknown
): Promise<QueryResult<Map<string, number>>> {
  const source = "shop_categories.getCategoryShopCounts";
  const fallback = new Map<string, number>();
  try {
    const rows = await queryRows<{ category_id: string; count: number }>(
      `select category_id::text, count(*)::int as count
       from public.shop_categories
       group by category_id`
    );
    return querySuccess(source, new Map(rows.map((row) => [row.category_id, row.count])));
  } catch (error) {
    return queryFailure(source, error, fallback);
  }
}

export async function getCategoryBySlug(_legacyClient: unknown, slug: string) {
  return queryOne<CategoryRow>(
    `select id::text, slug, name, description, sort_order
     from public.categories where slug = $1 limit 1`,
    [slug]
  );
}

export async function getShopIdsForCategory(_legacyClient: unknown, categoryId: string) {
  const rows = await queryRows<{ shop_id: string }>(
    `select shop_id::text from public.shop_categories where category_id = $1::uuid`,
    [categoryId]
  );
  return rows.map((row) => row.shop_id);
}
