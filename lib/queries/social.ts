import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type UserSocialState = {
  favoriteProductIds: Set<string>;
  favoriteShopIds: Set<string>;
  followingShopIds: Set<string>;
};

const emptyState = (): UserSocialState => ({
  favoriteProductIds: new Set(),
  favoriteShopIds: new Set(),
  followingShopIds: new Set()
});

export async function getUserSocialState(
  supabase: SupabaseClient<Database>,
  userId?: string | null
): Promise<UserSocialState> {
  if (!userId) return emptyState();

  const [favoritesResult, followsResult] = await Promise.all([
    supabase.from("favorites").select("product_id, shop_id").eq("user_id", userId),
    supabase.from("follows").select("shop_id").eq("user_id", userId)
  ]);

  if (favoritesResult.error) {
    console.error("[social.getUserSocialState:favorites]", JSON.stringify(favoritesResult.error, null, 2));
  }
  if (followsResult.error) {
    console.error("[social.getUserSocialState:follows]", JSON.stringify(followsResult.error, null, 2));
  }

  const state = emptyState();
  for (const row of favoritesResult.data ?? []) {
    if (row.product_id) state.favoriteProductIds.add(row.product_id);
    if (row.shop_id) state.favoriteShopIds.add(row.shop_id);
  }
  for (const row of followsResult.data ?? []) {
    state.followingShopIds.add(row.shop_id);
  }
  return state;
}