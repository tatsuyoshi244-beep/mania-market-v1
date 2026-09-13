import { CategoryFilter } from "@/components/category-filter";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";
import { listAllCategories } from "@/lib/queries/categories";
import { listProducts } from "@/lib/queries/products";
import { parsePage } from "@/lib/pagination";
import { getAuthUser } from "@/lib/auth";
import { getUserSocialState } from "@/lib/queries/social";
import type { Metadata } from "next";
import { normalizeSearchQuery } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string; tag?: string; page?: string }>;
}): Promise<Metadata> {
  const { q, category, tag, page } = await searchParams;
  const filtered = Boolean(q || category || tag || (page && page !== "1"));
  return {
    title: q ? `「${normalizeSearchQuery(q)}」の商品検索` : "こだわり商品を探す",
    description: "専門店が選んだヴィンテージ、工芸、アウトドア、音楽、コレクション、食、Web・アプリ、AI・生成AIの商品を探せます。",
    alternates: { canonical: "/products" },
    robots: filtered ? { index: false, follow: true } : undefined
  };
}

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string; tag?: string; page?: string }>;
}) {
  const { q: rawQuery, category, tag, page: pageParam } = await searchParams;
  const q = normalizeSearchQuery(rawQuery);
  const page = parsePage(pageParam);
  const user = await getAuthUser();
  const [categories, result, social] = await Promise.all([
    listAllCategories(),
    listProducts({ page, query: q, categorySlug: category, tag }),
    getUserSocialState(user?.id)
  ]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-black">商品一覧</h1>
        <p className="mt-2 text-ink/65 dark:text-paper/65">カテゴリ・タグ・キーワードで商品を絞り込み</p>
      </div>

      <div className="mt-8 space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <SearchBox
            placeholder="商品名、キーワード"
            action="/products"
            defaultQuery={q ?? ""}
            hiddenFields={{ category, tag }}
          />
          <form action="/products" className="flex gap-2">
            {category ? <input type="hidden" name="category" value={category} /> : null}
            {q ? <input type="hidden" name="q" value={q} /> : null}
            <input
              name="tag"
              defaultValue={tag ?? ""}
              placeholder="タグ（例: vintage, film）"
              className="w-full rounded-md border border-ink/15 bg-white px-3 py-3 dark:border-paper/15 dark:bg-ink/60"
            />
            <button className="rounded-md bg-lagoon px-5 font-semibold text-white">タグ検索</button>
          </form>
        </div>
        <CategoryFilter
          categories={categories}
          activeSlug={category}
          basePath="/products"
          extraParams={{ q, tag }}
        />
      </div>

      <p className="mt-6 text-sm text-ink/60 dark:text-paper/60">{result.total} 件</p>

      {result.products.length === 0 ? (
        <p className="mt-8 rounded-xl border border-ink/10 bg-white/90 p-8 text-center dark:border-paper/10 dark:bg-ink/60">
          条件に一致する商品がありません。
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.products.map((product) => (
            <ProductCard key={product.id} product={product} isFavorited={social.favoriteProductIds.has(product.id)} returnTo="/products" />
          ))}
        </div>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/products"
        params={{ q, category, tag }}
      />
    </section>
  );
}
