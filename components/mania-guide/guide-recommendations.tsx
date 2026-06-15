import Link from "next/link";
import { FolderOpen, Package, Store } from "lucide-react";
import type { GuideRecommendations } from "@/types/guide";

type GuideRecommendationsProps = {
  recommendations: GuideRecommendations;
};

export function GuideRecommendationsList({ recommendations }: GuideRecommendationsProps) {
  const { categories, shops, products } = recommendations;
  if (categories.length === 0 && shops.length === 0 && products.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {categories.length > 0 ? (
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45 dark:text-paper/45">
            <FolderOpen className="size-3" />
            Categories
          </p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="rounded-full border border-ink/10 bg-white/80 px-3 py-1 text-xs font-semibold text-ink/80 transition hover:border-cinnabar hover:text-cinnabar dark:border-paper/15 dark:bg-ink/50 dark:text-paper/80"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {shops.length > 0 ? (
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45 dark:text-paper/45">
            <Store className="size-3" />
            Shops
          </p>
          <div className="space-y-1.5">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/shops/${shop.slug}`}
                className="block rounded-xl border border-ink/8 bg-white/70 px-3 py-2 text-xs transition hover:border-lagoon dark:border-paper/10 dark:bg-ink/40"
              >
                <span className="font-semibold">{shop.name}</span>
                {shop.description ? (
                  <span className="mt-0.5 block line-clamp-1 text-ink/55 dark:text-paper/55">{shop.description}</span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {products.length > 0 ? (
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45 dark:text-paper/45">
            <Package className="size-3" />
            Products
          </p>
          <div className="space-y-1.5">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="flex items-center gap-2 rounded-xl border border-ink/8 bg-white/70 px-2 py-2 transition hover:border-cinnabar dark:border-paper/10 dark:bg-ink/40"
              >
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image_url} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-lagoon/15 text-[10px] text-ink/40">—</div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{product.name}</p>
                  {product.shop_name ? (
                    <p className="truncate text-[10px] text-ink/50 dark:text-paper/50">{product.shop_name}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}