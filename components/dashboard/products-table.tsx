import Link from "next/link";
import { deleteProduct, updateProductStatus } from "@/app/actions";
import { productStatusLabel } from "@/lib/products/status";
import { asRelatedList } from "@/lib/utils";
import type { ProductStatus } from "@/types/database";

export type SellerProductRow = {
  id: string;
  name: string;
  status: ProductStatus;
  created_at: string;
  external_url: string;
  category_id: string | null;
  categories: { id: string; name: string } | null | Array<{ id: string; name: string }>;
  product_tags: Array<{ tag: string }> | { tag: string } | null;
};

type ProductsTableProps = {
  products: SellerProductRow[];
  readOnly?: boolean;
};

export function ProductsTable({ products, readOnly = false }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white/90 p-8 text-center text-sm text-ink/60 dark:bg-ink/60">
        商品はまだ登録されていません。
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white shadow-sm dark:border-paper/10 dark:bg-ink/60">
      <table className="min-w-[760px] w-full text-left text-sm">
        <thead className="border-b border-ink/10 bg-ink/5 text-xs uppercase tracking-wider text-ink/55">
          <tr>
            <th className="px-4 py-3 font-bold">商品名</th>
            <th className="px-4 py-3 font-bold">カテゴリ</th>
            <th className="px-4 py-3 font-bold">status</th>
            <th className="px-4 py-3 font-bold">作成日</th>
            <th className="px-4 py-3 font-bold">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/8">
          {products.map((product) => {
            const category = Array.isArray(product.categories) ? product.categories[0] : product.categories;
            const tags = asRelatedList(product.product_tags);
            return (
              <tr key={product.id} className="align-top">
                <td className="px-4 py-4">
                  <p className="font-semibold">{product.name}</p>
                  {tags.length ? <p className="mt-1 text-xs text-ink/50">{tags.map((row) => row.tag).join(", ")}</p> : null}
                </td>
                <td className="px-4 py-4">{category?.name ?? "-"}</td>
                <td className="px-4 py-4">{productStatusLabel(product.status)}</td>
                <td className="px-4 py-4 text-xs text-ink/60">{new Date(product.created_at).toLocaleString("ja-JP")}</td>
                <td className="px-4 py-4">
                  {readOnly ? (
                    <Link href={`/products/${product.id}`} className="rounded-full border border-ink/15 px-3 py-1 text-xs font-bold hover:border-cinnabar">
                      公開ページ
                    </Link>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/dashboard/products/${product.id}/edit`} className="rounded-full border border-ink/15 px-3 py-1 text-xs font-bold hover:border-cinnabar">編集</Link>
                      <form action={updateProductStatus}>
                        <input type="hidden" name="product_id" value={product.id} />
                        <button type="submit" name="ui_status" value={product.status === "active" ? "draft" : "published"} className="rounded-full border border-lagoon/25 bg-lagoon/10 px-3 py-1 text-xs font-bold text-lagoon">
                          {product.status === "active" ? "非公開" : "公開"}
                        </button>
                      </form>
                      <form action={deleteProduct}>
                        <input type="hidden" name="product_id" value={product.id} />
                        <button type="submit" className="rounded-full border border-cinnabar/25 bg-cinnabar/10 px-3 py-1 text-xs font-bold text-cinnabar">削除</button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}