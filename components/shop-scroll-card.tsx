import Link from "next/link";
import { Store } from "lucide-react";
import { shopAccentFromSlug } from "@/lib/shop-theme";
import { asRelatedList } from "@/lib/utils";

type ShopScrollCardProps = {
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
};

export function ShopScrollCard({ shop }: ShopScrollCardProps) {
  const categories = asRelatedList(shop.shop_categories)
    .map((row) => row.categories?.name)
    .filter(Boolean);
  const accent = shopAccentFromSlug(shop.slug);

  return (
    <Link
      href={`/shops/${shop.slug}`}
      className="group relative w-[min(82vw,300px)] shrink-0 snap-start overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-editorial dark:border-paper/10 dark:bg-ink/70"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-end gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-white/95">
              {shop.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Store className="size-5 text-moss" />
              )}
            </div>
            <div className="min-w-0 text-white">
              {categories[0] ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">{categories[0]}</p>
              ) : null}
              <h3 className="mt-0.5 truncate font-display text-lg font-semibold">{shop.name}</h3>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/75">{shop.description}</p>
        </div>
      </div>
    </Link>
  );
}