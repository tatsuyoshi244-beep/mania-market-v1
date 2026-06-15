import Link from "next/link";
import { getCategoryImageUrl } from "@/lib/category-images";

type CategoryScrollCardProps = {
  slug: string;
  name: string;
  shopCount: number;
};

export function CategoryScrollCard({ slug, name, shopCount }: CategoryScrollCardProps) {
  const imageUrl = getCategoryImageUrl(slug);

  return (
    <Link
      href={`/categories/${slug}`}
      className="group relative w-[min(72vw,220px)] shrink-0 snap-start overflow-hidden rounded-3xl"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display text-xl font-semibold leading-tight text-white">{name}</h3>
          <p className="mt-2 text-[10px] font-bold tracking-[0.14em] text-white/70">{shopCount} SHOPS</p>
        </div>
      </div>
    </Link>
  );
}