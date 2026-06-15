import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/shops", label: "ショップ" },
  { href: "/products", label: "商品" },
  { href: "/categories", label: "カテゴリ" },
  { href: "/mypage", label: "マイページ" },
  { href: "/seller-guide", label: "出店" }
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/8 bg-paper/80 backdrop-blur-xl dark:border-paper/10 dark:bg-ink/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:py-4">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          Mania Market
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-1 text-sm font-medium sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-ink/75 transition hover:bg-ink/5 hover:text-cinnabar dark:text-paper/75 dark:hover:bg-paper/5"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}