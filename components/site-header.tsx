import Link from "next/link";
import type { Route } from "next";

const navItems = [
  { href: "/shops", label: "ショップ" },
  { href: "/products", label: "商品" },
  { href: "/categories", label: "カテゴリ" },
  { href: "/about", label: "サービス概要" },
  { href: "/mypage", label: "マイページ" },
  { href: "/seller-guide", label: "出店" }
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/8 bg-paper/80 backdrop-blur-xl dark:border-paper/10 dark:bg-ink/80">
      <nav className="mx-auto flex max-w-6xl flex-col items-stretch gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-4">
        <Link href="/" className="whitespace-nowrap font-display text-lg font-semibold tracking-tight sm:text-xl">
          好きは、価値になる。
        </Link>
        <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 text-sm font-medium sm:mx-0 sm:justify-end sm:gap-2 sm:overflow-visible sm:px-0">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href as Route}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-ink/75 transition hover:bg-ink/5 hover:text-cinnabar dark:text-paper/75 dark:hover:bg-paper/5"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
