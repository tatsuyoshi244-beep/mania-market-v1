import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildPageHref } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
};

export function Pagination({ page, totalPages, basePath, params = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1
  );

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <Link
        href={buildPageHref(basePath, Math.max(1, page - 1), params)}
        aria-disabled={page <= 1}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold dark:border-paper/15 dark:bg-ink/60",
          page <= 1 && "pointer-events-none opacity-40"
        )}
      >
        <ChevronLeft className="size-4" />
        Prev
      </Link>

      {pages.map((n, index) => {
        const prev = pages[index - 1];
        const showEllipsis = prev !== undefined && n - prev > 1;
        return (
          <span key={n} className="flex items-center gap-2">
            {showEllipsis ? <span className="px-1 text-ink/40">...</span> : null}
            <Link
              href={buildPageHref(basePath, n, params)}
              className={cn(
                "inline-flex min-w-10 items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold",
                n === page
                  ? "border-cinnabar bg-cinnabar text-white"
                  : "border-ink/15 bg-white hover:border-cinnabar dark:border-paper/15 dark:bg-ink/60"
              )}
            >
              {n}
            </Link>
          </span>
        );
      })}

      <Link
        href={buildPageHref(basePath, Math.min(totalPages, page + 1), params)}
        aria-disabled={page >= totalPages}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold dark:border-paper/15 dark:bg-ink/60",
          page >= totalPages && "pointer-events-none opacity-40"
        )}
      >
        Next
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}