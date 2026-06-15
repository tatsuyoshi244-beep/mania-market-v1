"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/mypage", label: "概要" },
  { href: "/mypage/applications", label: "出店申請状況" },
  { href: "/mypage/favorites/products", label: "お気に入り商品" },
  { href: "/mypage/favorites/shops", label: "お気に入りショップ" },
  { href: "/mypage/following", label: "フォロー中" }
] as const;

export function MypageNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold transition",
            pathname === item.href
              ? "border-cinnabar bg-cinnabar text-white"
              : "border-ink/15 bg-white hover:border-cinnabar dark:border-paper/15 dark:bg-ink/60"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}