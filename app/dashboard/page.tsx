import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { ProductLimitBanner } from "@/components/dashboard/product-limit-banner";
import { PlanCards } from "@/components/plan-cards";
import { saveShop, signOut } from "@/app/actions";
import { listCategories } from "@/lib/categories";
import { getProductLimitInfo } from "@/lib/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <div className="px-4 py-10"><AuthCard next="/dashboard" title="出店ダッシュボード" description="ログインしてショップ管理を開始してください。" /></div>;

  const [{ data: user }, { data: shop }, categories, limitInfo] = await Promise.all([
    supabase.from("users").select("plan_key").eq("id", userData.user.id).single(),
    supabase.from("shops").select("*").eq("owner_id", userData.user.id).maybeSingle(),
    listCategories(supabase),
    getProductLimitInfo(supabase, userData.user.id)
  ]);

  const { data: shopCategoryRows } = shop?.id
    ? await supabase.from("shop_categories").select("category_id").eq("shop_id", shop.id)
    : { data: [] as Array<{ category_id: string }> };

  const selectedCategoryIds = new Set((shopCategoryRows ?? []).map((row) => row.category_id));

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black">出店者ダッシュボード</h1>
          <p className="mt-2 text-ink/65">{userData.user.email}</p>
        </div>
        <form action={signOut}>
          <button className="rounded-md border border-ink/15 bg-white px-4 py-2 font-semibold hover:border-cinnabar">
            ログアウト
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        <Link href="/dashboard/concierge" className="flex items-center gap-3 rounded-lg border border-cinnabar/25 bg-cinnabar/8 p-4 font-bold shadow-sm">
          Mania Concierge（AI秘書）
        </Link>
        <Link href="/dashboard/products" className="flex items-center gap-3 rounded-lg border border-ink/10 bg-paper/95 p-4 font-bold shadow-sm">
          商品管理
        </Link>
      </div>

      {shop ? (
        <div className="mt-8">
          <ProductLimitBanner limitInfo={limitInfo} />
        </div>
      ) : null}

      <div className="mt-8">
        <PlanCards currentPlan={user?.plan_key} />
      </div>

      <section className="mt-8 rounded-lg border border-ink/10 bg-paper/95 p-6 shadow-sm">
        <h2 className="text-2xl font-black">ショップ登録</h2>
        <form action={saveShop} className="mt-5 grid gap-4">
          {shop?.id ? <input type="hidden" name="shop_id" value={shop.id} /> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              ショップ名
              <input name="name" required defaultValue={shop?.name ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              slug
              <input name="slug" required defaultValue={shop?.slug ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" placeholder="rare-camera-lab" />
            </label>
          </div>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">カテゴリ</legend>
            <div className="grid gap-2 md:grid-cols-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    name="category_ids"
                    value={category.id}
                    defaultChecked={selectedCategoryIds.has(category.id)}
                  />
                  {category.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              ロゴ画像URL
              <input name="logo_url" type="url" defaultValue={shop?.logo_url ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2 dark:border-paper/15 dark:bg-ink/60" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              カバー画像URL
              <input name="cover_image_url" type="url" defaultValue={shop?.cover_image_url ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2 dark:border-paper/15 dark:bg-ink/60" />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              X / Twitter URL
              <input name="twitter_url" type="url" defaultValue={shop?.twitter_url ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2 dark:border-paper/15 dark:bg-ink/60" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Instagram URL
              <input name="instagram_url" type="url" defaultValue={shop?.instagram_url ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2 dark:border-paper/15 dark:bg-ink/60" />
            </label>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            公式URL
            <input name="website_url" type="url" defaultValue={shop?.website_url ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2 dark:border-paper/15 dark:bg-ink/60" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            説明
            <textarea name="description" rows={4} defaultValue={shop?.description ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input name="is_published" type="checkbox" defaultChecked={shop?.is_published ?? false} />
            公開する
          </label>
          <button className="w-fit rounded-md bg-ink px-5 py-3 font-semibold text-white hover:bg-lagoon">
            保存
          </button>
        </form>
      </section>
    </section>
  );
}
