import { queryRows } from "@/lib/neon/db";

export type UserSocialState = {
  favoriteProductIds: Set<string>;
  favoriteShopIds: Set<string>;
  followingShopIds: Set<string>;
};

const emptyState = (): UserSocialState => ({
  favoriteProductIds: new Set(), favoriteShopIds: new Set(), followingShopIds: new Set()
});

export async function getUserSocialState(_client: unknown, userId?: string | null) {
  if (!userId) return emptyState();
  const [favorites, follows] = await Promise.all([
    queryRows<{ product_id: string | null; shop_id: string | null }>(
      "select product_id::text, shop_id::text from public.favorites where user_id = $1", [userId]),
    queryRows<{ shop_id: string }>("select shop_id::text from public.follows where user_id = $1", [userId])
  ]);
  const state = emptyState();
  favorites.forEach((row) => {
    if (row.product_id) state.favoriteProductIds.add(row.product_id);
    if (row.shop_id) state.favoriteShopIds.add(row.shop_id);
  });
  follows.forEach((row) => state.followingShopIds.add(row.shop_id));
  return state;
}
