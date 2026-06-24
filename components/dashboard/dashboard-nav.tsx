"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "サマリー" },
  { href: "/dashboard/products", label: "商品管理" },
  { href: "/dashboard/shop", label: "ショップ編集" },
  { href: "/dashboard/billing", label: "プラン管理" },
  { href: "/dashboard/analytics", label: "アナリティクス" },
  { href: "/dashboard/getting-started", label: "運営ガイド" },
  { href: "/dashboard/concierge", label: "Concierge" }
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-ink text-white shadow-sm"
                : "text-ink/70 hover:bg-ink/5 hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}