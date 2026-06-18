import { createProduct, updateProduct } from "@/app/actions";
import { toUiProductStatus, type ProductUiStatus } from "@/lib/products/status";
import type { ProductStatus } from "@/types/database";

type CategoryOption = { id: string; name: string };

type ProductFormProps = {
  shopId: string;
  categories: CategoryOption[];
  mode: "create" | "edit";
  product?: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    external_url: string;
    category_id: string | null;
    status: ProductStatus;
    tags: string[];
  };
};

export function ProductForm({ shopId, categories, mode, product }: ProductFormProps) {
  const action = mode === "create" ? createProduct : updateProduct;
  const uiStatus: ProductUiStatus = product ? toUiProductStatus(product.status) : "draft";

  return (
    <form action={action} className="grid gap-4">
      {mode === "edit" && product ? <input type="hidden" name="product_id" value={product.id} /> : null}
      <input type="hidden" name="shop_id" value={shopId} />
      <label className="grid gap-1 text-sm font-medium">商品名<input name="name" required defaultValue={product?.name ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" /></label>
      <label className="grid gap-1 text-sm font-medium">説明<textarea name="description" rows={4} defaultValue={product?.description ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" /></label>
      <label className="grid gap-1 text-sm font-medium">画像URL<input name="image_url" type="url" defaultValue={product?.image_url ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" /></label>
      <label className="grid gap-1 text-sm font-medium">カテゴリ
        <select name="category_id" defaultValue={product?.category_id ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2">
          <option value="">未選択</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">タグ（カンマ区切り）<input name="tags" defaultValue={product?.tags.join(", ") ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" /></label>
      <label className="grid gap-1 text-sm font-medium">外部販売URL<input name="external_url" type="url" required defaultValue={product?.external_url ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" /></label>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">status</legend>
        <label className="flex items-center gap-2 text-sm"><input type="radio" name="ui_status" value="draft" defaultChecked={uiStatus === "draft"} />draft（下書き）</label>
        <label className="flex items-center gap-2 text-sm"><input type="radio" name="ui_status" value="published" defaultChecked={uiStatus === "published"} />published（公開）</label>
      </fieldset>
      <button className="w-fit rounded-md bg-ink px-5 py-3 font-semibold text-white hover:bg-lagoon">{mode === "create" ? "登録" : "保存"}</button>
    </form>
  );
}