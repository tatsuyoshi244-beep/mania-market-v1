import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getCategoryImageUrl } from "@/lib/category-images";

type CategoryCardProps = {
  slug: string;
  name: string;
  description: string | null;
  shopCount: number;
  index?: number;
};

export function CategoryCard({ slug, name, description, shopCount }: CategoryCardProps) {
  const imageUrl = getCategoryImageUrl(slug);

  return (
    <Link
      href={`/categories/${slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-ink/8 shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-editorial dark:border-paper/10 dark:hover:shadow-glow"
    >
      <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[3/4]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-ink/10" />
        <div className="absolute inset-0 bg-cinnabar/0 transition duration-500 group-hover:bg-cinnabar/10" />

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">Category</p>
              <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">
                {name}
              </h3>
            </div>
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition group-hover:border-white group-hover:bg-white group-hover:text-ink">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/75">{description}</p>
          <p className="mt-4 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wide text-white backdrop-blur">
            {shopCount} SHOPS
          </p>
        </div>
      </div>
    </Link>
  );
}