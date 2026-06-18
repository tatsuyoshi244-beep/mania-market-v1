import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductLimitInfo } from "@/types/auth";
import type { Database, PlanKey } from "@/types/database";
import { COUNTABLE_PRODUCT_STATUSES } from "@/lib/products/status";

export async function getProductLimitInfo(
  supabase: SupabaseClient<Database>,
  sellerId: string
): Promise<ProductLimitInfo> {
  const [{ data: user, error: userError }, { count, error: countError }] = await Promise.all([
    supabase.from("users").select("plan_key").eq("id", sellerId).single(),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", sellerId)
      .in("status", COUNTABLE_PRODUCT_STATUSES)
  ]);

  if (userError || !user) {
    throw new Error("ユーザーが見つかりません。");
  }
  if (countError) throw countError;

  const planKey = user.plan_key as PlanKey;
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("product_limit")
    .eq("key", planKey)
    .single();

  if (planError || !plan) {
    throw new Error("プラン情報が見つかりません。");
  }

  const productCount = count ?? 0;
  const limit = plan.product_limit;
  const remaining = limit === null ? null : Math.max(limit - productCount, 0);

  return {
    planKey,
    limit,
    productCount,
    remaining,
    canCreate: limit === null || productCount < limit
  };
}

export async function assertCanCreateProduct(
  supabase: SupabaseClient<Database>,
  sellerId: string
) {
  const info = await getProductLimitInfo(supabase, sellerId);
  if (!info.canCreate) {
    throw new Error("現在のプランの上限に達しました");
  }
}

export function parseProductTags(raw: string | null): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(/[,、\s]+/).map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

export async function syncProductTags(
  supabase: SupabaseClient<Database>,
  productId: string,
  tags: string[]
) {
  await supabase.from("product_tags").delete().eq("product_id", productId);
  if (tags.length === 0) return;

  const { error } = await supabase.from("product_tags").insert(
    tags.map((tag) => ({ product_id: productId, tag }))
  );
  if (error) throw error;
}

export async function syncShopCategories(
  supabase: SupabaseClient<Database>,
  shopId: string,
  categoryIds: string[]
) {
  await supabase.from("shop_categories").delete().eq("shop_id", shopId);
  if (categoryIds.length === 0) return;

  const { error } = await supabase.from("shop_categories").insert(
    categoryIds.map((category_id) => ({ shop_id: shopId, category_id }))
  );
  if (error) throw error;
}

export async function getOwnedShop(
  supabase: SupabaseClient<Database>,
  ownerId: string
) {
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getSellerProduct(
  supabase: SupabaseClient<Database>,
  productId: string,
  sellerId: string
) {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_tags(tag)")
    .eq("id", productId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listSellerProducts(
  supabase: SupabaseClient<Database>,
  sellerId: string
) {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, status, created_at, external_url, category_id, product_tags(tag)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!products || products.length === 0) return [];

  const categoryIds = [
    ...new Set(products.map((product) => product.category_id).filter((id): id is string => Boolean(id)))
  ];

  const categoryMap = new Map<string, { id: string; name: string }>();
  if (categoryIds.length > 0) {
    const { data: categories, error: categoryError } = await supabase
      .from("categories")
      .select("id, name")
      .in("id", categoryIds);
    if (categoryError) throw categoryError;
    for (const category of categories ?? []) {
      categoryMap.set(category.id, category);
    }
  }

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    status: product.status,
    created_at: product.created_at,
    external_url: product.external_url,
    category_id: product.category_id,
    product_tags: product.product_tags,
    categories: product.category_id ? categoryMap.get(product.category_id) ?? null : null
  }));
}