import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "lucide-react";
import { CategoryScrollCard } from "@/components/category-scroll-card";
import { DiscoveryProductCard } from "@/components/discovery-product-card";
import { HeroSection } from "@/components/hero-section";
import { HorizontalScroll } from "@/components/horizontal-scroll";
import { LpCta } from "@/components/lp-cta";
import { LpFeatures } from "@/components/lp-features";
import { QueryErrorPanel } from "@/components/query-error-panel";
import { ShopScrollCard } from "@/components/shop-scroll-card";
import { SiteFooter } from "@/components/site-footer";
import { getCategoryShopCounts, getPopularCategories } from "@/lib/queries/categories";
import { getDiscoverProducts } from "@/lib/queries/products";
import { getUserSocialState } from "@/lib/queries/social";
import { getPopularShops } from "@/lib/queries/shops";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DISCOVERY_LAYOUTS = ["tall", "square", "wide"] as const;

function SectionHeader({
  label,
  title,
  description,
  href
}: {
  label: string;
  title: string;
  description: string;
  href?: Route;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cinnabar">{label}</p>
        <h2 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-7 text-ink/65 dark:text-paper/65">{description}</p>
      </div>
      {href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold transition hover:border-cinnabar hover:text-cinnabar dark:border-paper/15"
        >
          すべて見る
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const queryErrors: Array<{ source: string; error: unknown }> = [];
  let categories: Awaited<ReturnType<typeof getPopularCategories>>["data"] = [];
  let shopCounts = new Map<string, number>();
  let shops: Awaited<ReturnType<typeof getPopularShops>>["data"] = [];
  let discoverProducts: Awaited<ReturnType<typeof getDiscoverProducts>>["data"] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();

    try {
      const result = await getPopularCategories(supabase, 6);
      categories = result.data;
      if (result.error) queryErrors.push({ source: result.source, error: result.error });
    } catch (error) {
      queryErrors.push({ source: "categories.getPopularCategories (unexpected)", error });
    }

    try {
      const result = await getCategoryShopCounts(supabase);
      shopCounts = result.data;
      if (result.error) queryErrors.push({ source: result.source, error: result.error });
    } catch (error) {
      queryErrors.push({ source: "shop_categories.getCategoryShopCounts (unexpected)", error });
    }

    try {
      const result = await getPopularShops(supabase, 12);
      shops = result.data;
      if (result.error) queryErrors.push({ source: result.source, error: result.error });
    } catch (error) {
      queryErrors.push({ source: "shops.getPopularShops (unexpected)", error });
    }

    try {
      const result = await getDiscoverProducts(supabase, 3);
      discoverProducts = result.data;
      if (result.error) queryErrors.push({ source: result.source, error: result.error });
    } catch (error) {
      queryErrors.push({ source: "products.getDiscoverProducts (unexpected)", error });
    }

    try {
      await getUserSocialState(supabase, userData.user?.id);
    } catch (error) {
      queryErrors.push({ source: "social.getUserSocialState (unexpected)", error });
    }
  } catch (error) {
    queryErrors.push({ source: "createSupabaseServerClient", error });
    console.error("[HomePage]", formatSupabaseError(error));
  }

  return (
    <div className="bg-paper dark:bg-ink">
      <HeroSection />
      <QueryErrorPanel errors={queryErrors} />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-18">
        <SectionHeader
          label="Today"
          title="今日の発見"
          description="毎日3つの一品。偶然の出会いを、日替わりでお届けします。"
          href="/products"
        />
        {discoverProducts.length === 0 ? (
          <p className="rounded-3xl border border-ink/10 bg-white/90 p-10 text-center text-sm text-ink/65 dark:border-paper/10 dark:bg-ink/60 dark:text-paper/65">
            公開中の商品がありません。
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2 md:gap-5">
            {discoverProducts.map((product, index) => (
              <DiscoveryProductCard
                key={product.id}
                product={product}
                layout={DISCOVERY_LAYOUTS[index] ?? "square"}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <SectionHeader
          label="Genres"
          title="ジャンルから探す"
          description="写真で世界観を感じながら、マニアの領域へ。"
          href="/categories"
        />
        {categories.length === 0 ? (
          <p className="rounded-3xl border border-ink/10 bg-white/90 p-10 text-center text-sm text-ink/65 dark:border-paper/10 dark:bg-ink/60 dark:text-paper/65">
            カテゴリデータがありません。
          </p>
        ) : (
          <HorizontalScroll>
            {categories.map((category) => (
              <CategoryScrollCard
                key={category.id}
                slug={category.slug}
                name={category.name}
                shopCount={shopCounts.get(category.id) ?? 0}
              />
            ))}
          </HorizontalScroll>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-18">
        <SectionHeader
          label="Popular"
          title="人気ショップ"
          description="熱量の高い専門店を、横に流れるギャラリーのように。"
          href="/shops"
        />
        {shops.length === 0 ? (
          <p className="rounded-3xl border border-ink/10 bg-white/90 p-10 text-center text-sm text-ink/65 dark:border-paper/10 dark:bg-ink/60 dark:text-paper/65">
            公開中のショップがありません。
          </p>
        ) : (
          <HorizontalScroll>
            {shops.map((shop) => (
              <ShopScrollCard key={shop.id} shop={shop} />
            ))}
          </HorizontalScroll>
        )}
      </section>

      <LpFeatures />
      <LpCta />
      <SiteFooter />
    </div>
  );
}