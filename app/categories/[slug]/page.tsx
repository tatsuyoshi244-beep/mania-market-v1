import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ShopCard } from "@/components/shop-card";
import { getCategoryImageUrl } from "@/lib/category-images";
import { getCategoryBySlug } from "@/lib/queries/categories";
import { listProductsByCategory } from "@/lib/queries/products";
import { listShopsByCategory } from "@/lib/queries/shops";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CategoryDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const category = await getCategoryBySlug(supabase, slug);
  if (!category) notFound();

  const [shops, products] = await Promise.all([
    listShopsByCategory(supabase, category.id),
    listProductsByCategory(supabase, category.id)
  ]);

  const imageUrl = getCategoryImageUrl(slug);

  return (
    <section>
      <div className="relative h-56 overflow-hidden sm:h-72 lg:h-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Category</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-white sm:text-5xl">{category.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">{category.description}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <section>
          <h2 className="text-2xl font-black">このカテゴリのショップ</h2>
          {shops.length === 0 ? (
            <p className="mt-4 text-ink/60 dark:text-paper/60">ショップが見つかりません。</p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-black">このカテゴリの商品</h2>
          {products.length === 0 ? (
            <p className="mt-4 text-ink/60 dark:text-paper/60">商品が見つかりません。</p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}