import { CategoryFilter } from "@/components/category-filter";
import { Pagination } from "@/components/pagination";
import { SearchBox } from "@/components/search-box";
import { ShopCard } from "@/components/shop-card";
import { listAllCategories } from "@/lib/queries/categories";
import { listShops } from "@/lib/queries/shops";
import { parsePage } from "@/lib/pagination";
import { getUserSocialState } from "@/lib/queries/social";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ShopsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const { q, category, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();
  const [categories, result, social] = await Promise.all([
    listAllCategories(supabase),
    listShops(supabase, { page, query: q, categorySlug: category }),
    getUserSocialState(supabase, userData.user?.id)
  ]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-black">ショップ一覧</h1>
        <p className="mt-2 text-ink/65 dark:text-paper/65">公開中の専門ショップをカテゴリ別に探索</p>
      </div>

      <div className="mt-8 space-y-6">
        <SearchBox
          placeholder="ショップ名、キーワード"
          action="/shops"
          defaultQuery={q ?? ""}
          hiddenFields={{ category }}
        />
        <CategoryFilter
          categories={categories}
          activeSlug={category}
          basePath="/shops"
          extraParams={{ q }}
        />
      </div>

      <p className="mt-6 text-sm text-ink/60 dark:text-paper/60">{result.total} 件</p>

      {result.shops.length === 0 ? (
        <p className="mt-8 rounded-xl border border-ink/10 bg-white/90 p-8 text-center dark:border-paper/10 dark:bg-ink/60">
          条件に一致するショップがありません。
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} returnTo="/shops" isFavoriteShop={social.favoriteShopIds.has(shop.id)} isFollowing={social.followingShopIds.has(shop.id)} />
          ))}
        </div>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/shops"
        params={{ q, category }}
      />
    </section>
  );
}
