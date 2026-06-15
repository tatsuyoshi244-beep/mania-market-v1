import { CategoryCard } from "@/components/category-card";
import { getCategoryShopCounts, listAllCategories } from "@/lib/queries/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CategoriesPage() {
  const supabase = await createSupabaseServerClient();
  const [categories, shopCountsResult] = await Promise.all([
    listAllCategories(supabase),
    getCategoryShopCounts(supabase)
  ]);
  const shopCounts = shopCountsResult.data;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">カテゴリ一覧</h1>
      <p className="mt-2 text-ink/65 dark:text-paper/65">ジャンル別にショップと商品を探索</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => (
          <CategoryCard
            key={category.id}
            slug={category.slug}
            name={category.name}
            description={category.description}
            shopCount={shopCounts.get(category.id) ?? 0}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}