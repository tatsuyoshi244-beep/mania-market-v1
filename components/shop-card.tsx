import Link from "next/link";
import { ArrowUpRight, Store } from "lucide-react";
import { FavoriteShopButton } from "@/components/favorite-shop-button";
import { FollowShopButton } from "@/components/follow-shop-button";
import { shopAccentFromSlug } from "@/lib/shop-theme";
import { asRelatedList, cn } from "@/lib/utils";

type ShopCardProps = {
  shop: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    logo_url?: string | null;
    cover_image_url?: string | null;
    shop_categories?:
      | Array<{ categories: { name: string; slug: string } | null }>
      | { categories: { name: string; slug: string } | null };
  };
  returnTo?: string;
  isFavoriteShop?: boolean;
  isFollowing?: boolean;
  variant?: "default" | "featured";
  showActions?: boolean;
};

export function ShopCard({
  shop,
  returnTo = "/shops",
  isFavoriteShop = false,
  isFollowing = false,
  variant = "default",
  showActions = true
}: ShopCardProps) {
  const categories = asRelatedList(shop.shop_categories)
    .map((row) => row.categories?.name)
    .filter(Boolean);
  const accent = shopAccentFromSlug(shop.slug);
  const featured = variant === "featured";

  return (
    <article
      className={cn(
        "group shop-card-shine overflow-hidden rounded-2xl border border-ink/8 bg-white/90 shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-editorial dark:border-paper/10 dark:bg-ink/70 dark:hover:shadow-glow",
        featured && "md:col-span-2 md:grid md:grid-cols-2"
      )}
    >
      <Link href={`/shops/${shop.slug}`} className={cn("relative block overflow-hidden", featured ? "min-h-[280px] md:min-h-full" : "")}>
        <div className={cn("relative w-full", featured ? "h-full min-h-[280px]" : "aspect-[5/4]")}>
          {shop.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.cover_image_url}
              alt=""
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full" style={{ background: accent.gradient }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="flex items-end gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/30 bg-white/95 shadow-lg sm:size-16">
                {shop.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shop.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Store className="size-6 text-moss" />
                )}
              </div>
              <div className="min-w-0 flex-1 text-white">
                {categories.length ? (
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                    {categories.join(" · ")}
                  </p>
                ) : null}
                <h3 className="mt-1 font-display text-2xl font-semibold leading-tight sm:text-3xl">{shop.name}</h3>
              </div>
              <span className="hidden rounded-full border border-white/30 bg-white/10 p-2 backdrop-blur sm:inline-flex">
                <ArrowUpRight className="size-4 text-white" />
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className={cn("flex flex-col justify-between p-5", featured && "md:p-7")}>
        <div>
          {featured ? (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cinnabar">Featured Shop</p>
          ) : null}
          <p className={cn("line-clamp-3 text-sm leading-7 text-ink/70 dark:text-paper/70", featured ? "mt-4 text-base" : "mt-0")}>
            {shop.description}
          </p>
        </div>

        {showActions ? (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <FavoriteShopButton shopId={shop.id} active={isFavoriteShop} returnTo={returnTo} />
            <FollowShopButton shopId={shop.id} active={isFollowing} returnTo={returnTo} />
            <Link
              href={`/shops/${shop.slug}`}
              className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-lagoon hover:text-cinnabar"
            >
              ショップを見る
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}