import { ExternalLink, Instagram, Store } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { FavoriteShopButton } from "@/components/favorite-shop-button";
import { FollowShopButton } from "@/components/follow-shop-button";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { listProductsByShop } from "@/lib/queries/products";
import { getShopBySlug } from "@/lib/queries/shops";
import { getUserSocialState } from "@/lib/queries/social";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { asRelatedList } from "@/lib/utils";

export default async function ShopDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const shop = await getShopBySlug(supabase, slug);
  if (!shop) notFound();

  const { data: userData } = await supabase.auth.getUser();
  const social = await getUserSocialState(supabase, userData.user?.id);
  const returnTo = `/shops/${slug}`;

  await recordAnalyticsEvent({ type: "shop_view", shopId: shop.id, userId: userData.user?.id });

  const products = await listProductsByShop(supabase, shop.id);
  const categoryNames = asRelatedList(shop.shop_categories)
    .map((row) => row.categories?.name)
    .filter(Boolean);

  return (
    <section className="pb-12">
      <div className="relative h-48 overflow-hidden bg-lagoon/20 sm:h-64 lg:h-80">
        {shop.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.cover_image_url} alt="" className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
      </div>

      <div className="mx-auto -mt-16 max-w-6xl px-4 sm:-mt-20">
        <div className="rounded-2xl border border-ink/10 bg-white/95 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/80 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm sm:size-24">
                {shop.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shop.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Store className="size-8 text-moss" />
                )}
              </div>
              <div>
                {categoryNames.length ? (
                  <p className="text-sm font-bold text-cinnabar">{categoryNames.join(" / ")}</p>
                ) : null}
                <h1 className="mt-1 text-3xl font-black sm:text-4xl">{shop.name}</h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <FavoriteShopButton
                shopId={shop.id}
                active={social.favoriteShopIds.has(shop.id)}
                returnTo={returnTo}
                variant="text"
              />
              <FollowShopButton
                shopId={shop.id}
                active={social.followingShopIds.has(shop.id)}
                returnTo={returnTo}
                variant="text"
              />
              {shop.website_url ? (
                <a
                  href={shop.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-5 py-3 font-semibold hover:border-cinnabar dark:border-paper/15 dark:bg-ink/60"
                >
                  <ExternalLink className="size-4" />
                  外部ショップ
                </a>
              ) : null}
            </div>
          </div>

          <p className="mt-6 max-w-3xl leading-8 text-ink/75 dark:text-paper/75">{shop.description}</p>

          {(shop.twitter_url || shop.instagram_url) ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {shop.twitter_url ? (
                <a
                  href={shop.twitter_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:border-cinnabar dark:border-paper/15"
                >
                  X / Twitter
                </a>
              ) : null}
              {shop.instagram_url ? (
                <a
                  href={shop.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:border-cinnabar dark:border-paper/15"
                >
                  <Instagram className="size-4" />
                  Instagram
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <h2 className="mt-10 text-3xl font-black">商品一覧</h2>
        {products.length === 0 ? (
          <p className="mt-4 rounded-xl border border-ink/10 bg-white/90 p-6 text-ink/65 dark:border-paper/10 dark:bg-ink/60 dark:text-paper/65">
            公開中の商品はまだありません。
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorited={social.favoriteProductIds.has(product.id)}
                returnTo={returnTo}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}