import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { HomeProduct } from "@/lib/queries/products";
import type { HomeShop } from "@/lib/queries/shops";

const productCardSelect =
  "id,name,description,price_label,external_url,image_url,created_at,product_tags(tag),shops(name,slug,logo_url)";

const shopCardSelect =
  "id,slug,name,description,logo_url,cover_image_url,website_url,twitter_url,instagram_url,is_published,created_at,shop_categories(categories(name,slug))";

function orderByIds<T extends { id: string }>(items: T[], ids: string[]) {
  const map = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => map.get(id)).filter((item): item is T => Boolean(item));
}

export async function listFavoriteProducts(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<HomeProduct[]> {
  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("product_id, created_at")
    .eq("user_id", userId)
    .not("product_id", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[mypage.listFavoriteProducts]", JSON.stringify(error, null, 2));
    return [];
  }

  const productIds = (favorites ?? [])
    .map((row) => row.product_id)
    .filter((id): id is string => Boolean(id));

  if (productIds.length === 0) return [];

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(productCardSelect)
    .in("id", productIds)
    .eq("status", "active");

  if (productsError) {
    console.error("[mypage.listFavoriteProducts:products]", JSON.stringify(productsError, null, 2));
    return [];
  }

  return orderByIds((products ?? []) as HomeProduct[], productIds);
}

export async function listFavoriteShops(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<HomeShop[]> {
  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("shop_id, created_at")
    .eq("user_id", userId)
    .not("shop_id", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[mypage.listFavoriteShops]", JSON.stringify(error, null, 2));
    return [];
  }

  const shopIds = (favorites ?? [])
    .map((row) => row.shop_id)
    .filter((id): id is string => Boolean(id));

  if (shopIds.length === 0) return [];

  const { data: shops, error: shopsError } = await supabase
    .from("shops")
    .select(shopCardSelect)
    .in("id", shopIds)
    .eq("is_published", true);

  if (shopsError) {
    console.error("[mypage.listFavoriteShops:shops]", JSON.stringify(shopsError, null, 2));
    return [];
  }

  return orderByIds((shops ?? []) as HomeShop[], shopIds);
}

export async function listFollowingShops(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<HomeShop[]> {
  const { data: follows, error } = await supabase
    .from("follows")
    .select("shop_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[mypage.listFollowingShops]", JSON.stringify(error, null, 2));
    return [];
  }

  const shopIds = (follows ?? []).map((row) => row.shop_id);
  if (shopIds.length === 0) return [];

  const { data: shops, error: shopsError } = await supabase
    .from("shops")
    .select(shopCardSelect)
    .in("id", shopIds)
    .eq("is_published", true);

  if (shopsError) {
    console.error("[mypage.listFollowingShops:shops]", JSON.stringify(shopsError, null, 2));
    return [];
  }

  return orderByIds((shops ?? []) as HomeShop[], shopIds);
}

export async function getMypageCounts(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const [products, shops, following] = await Promise.all([
    supabase.from("favorites").select("product_id", { count: "exact", head: true }).eq("user_id", userId).not("product_id", "is", null),
    supabase.from("favorites").select("shop_id", { count: "exact", head: true }).eq("user_id", userId).not("shop_id", "is", null),
    supabase.from("follows").select("shop_id", { count: "exact", head: true }).eq("user_id", userId)
  ]);

  return {
    favoriteProducts: products.count ?? 0,
    favoriteShops: shops.count ?? 0,
    followingShops: following.count ?? 0
  };
}