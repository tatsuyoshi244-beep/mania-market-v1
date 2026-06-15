import { ProductCard } from "@/components/product-card";
import { listFavoriteProducts } from "@/lib/queries/mypage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function FavoriteProductsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const products = await listFavoriteProducts(supabase, data.user.id);

  return (
    <div>
      <h2 className="text-2xl font-black">お気に入り商品</h2>
      {products.length === 0 ? (
        <p className="mt-6 rounded-xl border border-ink/10 bg-white/90 p-8 text-center text-ink/65 dark:border-paper/10 dark:bg-ink/60 dark:text-paper/65">
          お気に入り商品はまだありません。
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} isFavorited returnTo="/mypage/favorites/products" />
          ))}
        </div>
      )}
    </div>
  );
}