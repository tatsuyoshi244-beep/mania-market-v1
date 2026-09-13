"use client";

import { deleteProduct } from "@/app/actions";

export function DeleteProductForm({ productId, productName }: { productId: string; productName: string }) {
  return (
    <form
      action={deleteProduct}
      onSubmit={(event) => {
        if (!window.confirm(`「${productName}」を削除します。元に戻せません。よろしいですか？`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="product_id" value={productId} />
      <button
        type="submit"
        className="rounded-full border border-cinnabar/25 bg-cinnabar/10 px-3 py-1 text-xs font-bold text-cinnabar"
      >
        削除
      </button>
    </form>
  );
}
