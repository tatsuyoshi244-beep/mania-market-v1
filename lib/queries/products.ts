import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { pageRange, PRODUCT_PAGE_SIZE, totalPages } from "@/lib/pagination";
import { getCategoryBySlug, getShopIdsForCategory } from "@/lib/queries/categories";
import { queryFailure, querySuccess, type QueryResult } from "@/lib/supabase/errors";

const productCardSelect =
  "id,name,description,price_label,external_url,image_url,created_at,product_tags(tag),shops(name,slug,logo_url)";

const productCardSelectBasic =
  "id,name,description,price_label,external_url,image_url,created_at,product_tags(tag),shops(name,slug)";

export type HomeProduct = {
  id: string;
  name: string;
  description: string | null;
  price_label: string | null;
  external_url: string;
  image_url: string | null;
  created_at: string;
  product_tags?: Array<{ tag: string }> | { tag: string };
  shops?: { name: string; slug: string; logo_url?: string | null } | null;
};

export async function getNewProducts(
  supabase: SupabaseClient<Database>,
  limit = 8
): Promise<QueryResult<HomeProduct[]>> {
  const source = "products.getNewProducts";
  try {
    const primary = await supabase
      .from("products")
      .select(productCardSelect)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (primary.error) {
      const fallback = await supabase
        .from("products")
        .select(productCardSelectBasic)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fallback.error) return queryFailure(source, fallback.error, []);
      return querySuccess(source, (fallback.data ?? []) as HomeProduct[]);
    }

    return querySuccess(source, (primary.data ?? []) as HomeProduct[]);
  } catch (error) {
    return queryFailure(source, error, []);
  }
}

export async function listProducts(
  supabase: SupabaseClient<Database>,
  options: {
    page: number;
    query?: string;
    categorySlug?: string;
    tag?: string;
  }
) {
  const { page, query, categorySlug, tag } = options;
  const { from, to } = pageRange(page, PRODUCT_PAGE_SIZE);

  let productIds: string[] | null = null;

  if (tag) {
    const { data: tagged, error: tagError } = await supabase
      .from("product_tags")
      .select("product_id")
      .ilike("tag", `%${tag.toLowerCase()}%`);

    if (tagError) {
      console.error("[product_tags.listProducts]", JSON.stringify(tagError, null, 2));
      return { products: [], total: 0, page, totalPages: 1 };
    }
    productIds = [...new Set((tagged ?? []).map((row) => row.product_id))];
    if (productIds.length === 0) {
      return { products: [], total: 0, page, totalPages: 1 };
    }
  }

  let shopIds: string[] | null = null;
  if (categorySlug) {
    const category = await getCategoryBySlug(supabase, categorySlug);
    if (!category) {
      return { products: [], total: 0, page, totalPages: 1 };
    }
    shopIds = await getShopIdsForCategory(supabase, category.id);
    if (shopIds.length === 0) {
      return { products: [], total: 0, page, totalPages: 1 };
    }
  }

  let dbQuery = supabase
    .from("products")
    .select(productCardSelect, { count: "exact" })
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (productIds) dbQuery = dbQuery.in("id", productIds);
  if (shopIds) dbQuery = dbQuery.in("shop_id", shopIds);
  if (query) dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);

  const primary = await dbQuery;

  if (primary.error) {
    console.error("[products.listProducts]", JSON.stringify(primary.error, null, 2));
    return { products: [], total: 0, page, totalPages: 1 };
  }

  const total = primary.count ?? 0;
  return {
    products: (primary.data ?? []) as HomeProduct[],
    total,
    page,
    totalPages: totalPages(total, PRODUCT_PAGE_SIZE)
  };
}

export async function getProductById(
  supabase: SupabaseClient<Database>,
  id: string
) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,name,description,price_label,external_url,image_url,shop_id,created_at,product_tags(tag),shops(id,name,slug,description,logo_url,cover_image_url,website_url,twitter_url,instagram_url)"
    )
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error) return null;
  return data;
}

export async function listProductsByShop(
  supabase: SupabaseClient<Database>,
  shopId: string
) {
  const { data, error } = await supabase
    .from("products")
    .select(productCardSelect)
    .eq("shop_id", shopId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[products.listProductsByShop]", JSON.stringify(error, null, 2));
    return [];
  }
  return data ?? [];
}

export async function listProductsByCategory(
  supabase: SupabaseClient<Database>,
  categoryId: string
) {
  const shopIds = await getShopIdsForCategory(supabase, categoryId);
  if (shopIds.length === 0) return [];

  const { data, error } = await supabase
    .from("products")
    .select(productCardSelect)
    .in("shop_id", shopIds)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[products.listProductsByCategory]", JSON.stringify(error, null, 2));
    return [];
  }
  return data ?? [];
}
export async function getDiscoverProducts(
  supabase: SupabaseClient<Database>,
  limit = 3
): Promise<QueryResult<HomeProduct[]>> {
  const source = "products.getDiscoverProducts";
  try {
    const { data, error } = await supabase
      .from("products")
      .select(productCardSelect)
      .eq("status", "active")
      .limit(48);

    if (error) {
      const fallback = await supabase
        .from("products")
        .select(productCardSelectBasic)
        .eq("status", "active")
        .limit(48);
      if (fallback.error) return queryFailure(source, fallback.error, []);
      const pool = (fallback.data ?? []) as HomeProduct[];
      const { getDailySeed, pickDailyRandom } = await import("@/lib/discover");
      return querySuccess(source, pickDailyRandom(pool, limit, getDailySeed()));
    }

    const pool = (data ?? []) as HomeProduct[];
    const { getDailySeed, pickDailyRandom } = await import("@/lib/discover");
    return querySuccess(source, pickDailyRandom(pool, limit, getDailySeed()));
  } catch (error) {
    return queryFailure(source, error, []);
  }
}