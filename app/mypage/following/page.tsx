import { ShopCard } from "@/components/shop-card";
import { listFollowingShops } from "@/lib/queries/mypage";
import { getUserSocialState } from "@/lib/queries/social";
import { getAuthUser } from "@/lib/auth";

export default async function FollowingShopsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const [shops, social] = await Promise.all([
    listFollowingShops(null, user.id),
    getUserSocialState(null, user.id)
  ]);

  return (
    <div>
      <h2 className="text-2xl font-black">フォロー中ショップ</h2>
      {shops.length === 0 ? (
        <p className="mt-6 rounded-xl border border-ink/10 bg-white/90 p-8 text-center text-ink/65 dark:border-paper/10 dark:bg-ink/60 dark:text-paper/65">
          フォロー中のショップはまだありません。
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              returnTo="/mypage/following"
              isFavoriteShop={social.favoriteShopIds.has(shop.id)}
              isFollowing={social.followingShopIds.has(shop.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
