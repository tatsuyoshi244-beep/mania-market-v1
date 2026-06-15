import Link from "next/link";

const LINKS = [
  { href: "/shops", label: "ショップ" },
  { href: "/products", label: "商品" },
  { href: "/categories", label: "カテゴリ" },
  { href: "/mypage", label: "マイページ" },
  { href: "/seller-guide", label: "出店" }
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-white/50 dark:border-paper/10 dark:bg-ink/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-3xl font-semibold">Mania Market</p>
          <p className="mt-2 max-w-sm text-sm leading-7 text-ink/60 dark:text-paper/60">
            マニア専門店の発見プラットフォーム。こだわりのショップとレアな商品を、美しくキュレーションします。
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-ink/70 hover:text-cinnabar dark:text-paper/70">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-ink/10 px-4 py-4 text-center text-xs text-ink/45 dark:border-paper/10 dark:text-paper/45">
        © {new Date().getFullYear()} Mania Market
      </div>
    </footer>
  );
}