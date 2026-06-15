import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";

type CategoryFilterProps = {
  categories: Array<{ slug: string; name: string }>;
  activeSlug?: string;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
};

export function CategoryFilter({
  categories,
  activeSlug,
  basePath,
  extraParams = {}
}: CategoryFilterProps) {
  function href(slug?: string) {
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    return (query ? `${basePath}?${query}` : basePath) as Route;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={href()}
        className={cn(
          "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
          !activeSlug
            ? "border-cinnabar bg-cinnabar text-white"
            : "border-ink/15 bg-white hover:border-cinnabar dark:border-paper/15 dark:bg-ink/60"
        )}
      >
        すべて
      </Link>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={href(category.slug)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
            activeSlug === category.slug
              ? "border-cinnabar bg-cinnabar text-white"
              : "border-ink/15 bg-white hover:border-cinnabar dark:border-paper/15 dark:bg-ink/60"
          )}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}