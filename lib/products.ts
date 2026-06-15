import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductLimitInfo } from "@/types/auth";
import type { Database, PlanKey } from "@/types/database";

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
      .eq("status", "active")
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

  const activeCount = count ?? 0;
  const limit = plan.product_limit;

  return {
    planKey,
    limit,
    activeCount,
    canCreate: limit === null || activeCount < limit
  };
}

export async function assertCanCreateProduct(
  supabase: SupabaseClient<Database>,
  sellerId: string
) {
  const info = await getProductLimitInfo(supabase, sellerId);
  if (!info.canCreate) {
    throw new Error(
      `現在のプランでは active 商品を${info.limit}件まで登録できます。`
    );
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
