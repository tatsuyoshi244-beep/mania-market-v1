import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { FavoriteProductButton } from "@/components/favorite-product-button";
import { asRelatedList, cn } from "@/lib/utils";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    description: string | null;
    price_label: string | null;
    external_url: string;
    image_url: string | null;
    product_tags?: Array<{ tag: string }> | { tag: string };
    shops?: { name: string; slug: string; logo_url?: string | null } | null;
  };
  compact?: boolean;
  isFavorited?: boolean;
  returnTo?: string;
};

export function ProductCard({
  product,
  compact = false,
  isFavorited = false,
  returnTo = "/products"
}: ProductCardProps) {
  const tags = asRelatedList(product.product_tags).map((row) => row.tag);

  return (
    <article className="group overflow-hidden rounded-2xl border border-ink/8 bg-white/90 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-editorial dark:border-paper/10 dark:bg-ink/70">
      <Link href={`/products/${product.id}`} className="relative block aspect-[4/5] overflow-hidden bg-ink/5">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-lagoon/15 to-moss/10 text-sm text-ink/50 dark:text-paper/50">
            No image
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-4 pt-12">
          <p className="font-display text-lg font-semibold leading-snug text-white">{product.name}</p>
          {product.shops ? (
            <p className="mt-1 text-xs text-white/75">{product.shops.name}</p>
          ) : null}
        </div>
      </Link>
      <div className={cn("grid gap-3 p-4", compact && "gap-2 p-3")}>
        {!compact ? (
          <p className="line-clamp-2 min-h-10 text-sm text-ink/70 dark:text-paper/70">{product.description}</p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-bold text-cinnabar">{product.price_label ?? "価格は販売先で確認"}</span>
          {tags.length && !compact ? (
            <span className="text-xs text-ink/50 dark:text-paper/50">{tags.slice(0, 2).join(" · ")}</span>
          ) : null}
        </div>
        {!compact ? (
          <div className="flex gap-2">
            <FavoriteProductButton productId={product.id} active={isFavorited} returnTo={returnTo} />
            <a
              href={`/api/external-click?productId=${product.id}&url=${encodeURIComponent(product.external_url)}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-lagoon dark:bg-lagoon"
            >
              <ExternalLink className="size-4" />
              販売サイトへ
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}