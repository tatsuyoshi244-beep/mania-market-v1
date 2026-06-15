import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { createProduct, updateProductStatus } from "@/app/actions";
import { getProductLimitInfo } from "@/lib/products";
import { PLANS } from "@/lib/plans";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { asRelatedList } from "@/lib/utils";

export default async function DashboardProductsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <div className="px-4 py-10"><AuthCard /></div>;

  const [{ data: shop }, { data: products }, limitInfo] = await Promise.all([
    supabase.from("shops").select("id,name").eq("owner_id", userData.user.id).maybeSingle(),
    supabase
      .from("products")
      .select("id,name,status,created_at,external_url,product_tags(tag)")
      .eq("seller_id", userData.user.id)
      .order("created_at", { ascending: false }),
    getProductLimitInfo(supabase, userData.user.id)
  ]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-black">商品管理</h1>
        <Link href="/dashboard/concierge" className="rounded-full border border-ink/15 px-4 py-2 text-sm font-bold hover:border-cinnabar">
          Mania Concierge
        </Link>
      </div>
      <p className="mt-2 text-ink/65">
        現在のプラン: {PLANS[limitInfo.planKey].name} / active商品 {limitInfo.activeCount} / {limitInfo.limit === null ? "無制限" : `${limitInfo.limit}件`}
      </p>

      <section className="mt-8 rounded-lg border border-ink/10 bg-paper/95 p-6 shadow-sm">
        <h2 className="text-2xl font-black">商品を登録</h2>
        {!shop ? (
          <p className="mt-4 text-cinnabar">先にショップページを作成してください。</p>
        ) : !limitInfo.canCreate ? (
          <p className="mt-4 text-cinnabar">現在のプランの商品数上限に達しています。プランをアップグレードするか、既存商品を非表示にしてください。</p>
        ) : (
          <form action={createProduct} className="mt-5 grid gap-4">
            <input type="hidden" name="shop_id" value={shop.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium">
                商品名
                <input name="name" required className="rounded-md border border-ink/15 bg-white px-3 py-2" />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                タグ（カンマ区切り）
                <input name="tags" placeholder="vintage, film, lens" className="rounded-md border border-ink/15 bg-white px-3 py-2" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium">
                価格表示
                <input name="price_label" placeholder="¥12,800" className="rounded-md border border-ink/15 bg-white px-3 py-2" />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                外部販売URL
                <input name="external_url" type="url" required className="rounded-md border border-ink/15 bg-white px-3 py-2" />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-medium">
              画像URL
              <input name="image_url" type="url" className="rounded-md border border-ink/15 bg-white px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              説明
              <textarea name="description" rows={4} className="rounded-md border border-ink/15 bg-white px-3 py-2" />
            </label>
            <button className="w-fit rounded-md bg-ink px-5 py-3 font-semibold text-white hover:bg-lagoon">
              登録
            </button>
          </form>
        )}
      </section>

      <section className="mt-8 rounded-lg border border-ink/10 bg-paper/95 p-6 shadow-sm">
        <h2 className="text-2xl font-black">登録済み商品</h2>
        <div className="mt-4 grid gap-3">
          {(products ?? []).map((product) => {
            const tags = asRelatedList(product.product_tags);
            return (
            <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-ink/10 bg-white p-3">
              <div>
                <p className="font-bold">{product.name}</p>
                <p className="text-sm text-ink/60">{product.status}</p>
                {tags.length ? (
                  <p className="mt-1 text-xs text-ink/50">
                    {tags.map((row) => row.tag).join(", ")}
                  </p>
                ) : null}
              </div>
              <form action={updateProductStatus} className="flex gap-2">
                <input type="hidden" name="product_id" value={product.id} />
                <button name="status" value={product.status === "active" ? "hidden" : "active"} className="rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold hover:border-cinnabar">
                  {product.status === "active" ? "非表示" : "公開"}
                </button>
              </form>
            </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
