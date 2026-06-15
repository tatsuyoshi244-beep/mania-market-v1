import Link from "next/link";
import { Sparkles } from "lucide-react";
import { asRelatedList } from "@/lib/utils";

type DiscoveryProductCardProps = {
  product: {
    id: string;
    name: string;
    description: string | null;
    price_label: string | null;
    image_url: string | null;
    product_tags?: Array<{ tag: string }> | { tag: string };
    shops?: { name: string; slug: string } | null;
  };
  layout?: "tall" | "square" | "wide";
};

const WRAPPER_CLASS = {
  tall: "md:row-span-2 min-h-[280px] md:min-h-0",
  square: "min-h-[220px] md:min-h-0",
  wide: "md:col-span-1 min-h-[200px] md:min-h-0"
} as const;

export function DiscoveryProductCard({ product, layout = "square" }: DiscoveryProductCardProps) {
  const tags = asRelatedList(product.product_tags).map((row) => row.tag);

  return (
    <Link
      href={`/products/${product.id}`}
      className={`group relative block h-full overflow-hidden rounded-3xl bg-ink/5 shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-editorial ${WRAPPER_CLASS[layout]}`}
    >
      <div className="relative h-full min-h-[inherit] overflow-hidden">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt=""
            className="h-full min-h-[inherit] w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full min-h-[inherit] items-center justify-center bg-gradient-to-br from-lagoon/20 to-moss/15 text-sm text-ink/50">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
          <Sparkles className="size-3" />
          Discovery
        </span>
        <div className="absolute inset-x-0 bottom-0 p-5">
          {product.shops ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">{product.shops.name}</p>
          ) : null}
          <h3 className="mt-1 font-display text-xl font-semibold leading-snug text-white sm:text-2xl">{product.name}</h3>
          {tags[0] ? <p className="mt-2 text-xs text-white/65">#{tags[0]}</p> : null}
        </div>
      </div>
    </Link>
  );
}