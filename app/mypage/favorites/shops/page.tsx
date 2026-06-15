import { ShopCard } from "@/components/shop-card";
import { listFavoriteShops } from "@/lib/queries/mypage";
import { getUserSocialState } from "@/lib/queries/social";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function FavoriteShopsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const [shops, social] = await Promise.all([
    listFavoriteShops(supabase, data.user.id),
    getUserSocialState(supabase, data.user.id)
  ]);

  return (
    <div>
      <h2 className="text-2xl font-black">お気に入りショップ</h2>
      {shops.length === 0 ? (
        <p className="mt-6 rounded-xl border border-ink/10 bg-white/90 p-8 text-center text-ink/65 dark:border-paper/10 dark:bg-ink/60 dark:text-paper/65">
          お気に入りショップはまだありません。
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              returnTo="/mypage/favorites/shops"
              isFavoriteShop={social.favoriteShopIds.has(shop.id)}
              isFollowing={social.followingShopIds.has(shop.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}