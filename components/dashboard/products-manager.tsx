"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductsTable, type SellerProductRow } from "@/components/dashboard/products-table";

type SortKey = "created_desc" | "created_asc" | "name_asc" | "name_desc" | "status";

type ProductsManagerProps = {
  products: SellerProductRow[];
  readOnly?: boolean;
};

export function ProductsManager({ products, readOnly = false }: ProductsManagerProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("created_desc");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let rows = products;
    if (normalized) {
      rows = rows.filter((product) => {
        const tags = Array.isArray(product.product_tags)
          ? product.product_tags.map((row) => row.tag).join(" ")
          : product.product_tags?.tag ?? "";
        const category = Array.isArray(product.categories)
          ? product.categories[0]?.name ?? ""
          : product.categories?.name ?? "";
        return [product.name, category, tags].join(" ").toLowerCase().includes(normalized);
      });
    }

    return [...rows].sort((a, b) => {
      if (sort === "name_asc") return a.name.localeCompare(b.name, "ja");
      if (sort === "name_desc") return b.name.localeCompare(a.name, "ja");
      if (sort === "status") return a.status.localeCompare(b.status);
      if (sort === "created_asc") return a.created_at.localeCompare(b.created_at);
      return b.created_at.localeCompare(a.created_at);
    });
  }, [products, query, sort]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="grid gap-1 text-sm font-medium sm:max-w-md sm:flex-1">
          検索
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="商品名・カテゴリ・タグ"
            className="rounded-md border border-ink/15 bg-white px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium sm:w-48">
          並び替え
          <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="rounded-md border border-ink/15 bg-white px-3 py-2">
            <option value="created_desc">新しい順</option>
            <option value="created_asc">古い順</option>
            <option value="name_asc">名前 A→Z</option>
            <option value="name_desc">名前 Z→A</option>
            <option value="status">ステータス順</option>
          </select>
        </label>
      </div>

      <p className="text-xs text-ink/50">{filtered.length}件表示 / 全{products.length}件</p>
      <ProductsTable products={filtered} readOnly={readOnly} />
      {!readOnly && products.length === 0 ? (
        <Link href="/dashboard/products/new" className="inline-flex w-fit rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-lagoon">
          最初の商品を登録
        </Link>
      ) : null}
    </div>
  );
}