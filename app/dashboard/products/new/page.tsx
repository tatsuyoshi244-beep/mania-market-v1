import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { ProductForm } from "@/components/dashboard/product-form";
import { ProductLimitBanner } from "@/components/dashboard/product-limit-banner";
import { listCategories } from "@/lib/categories";
import { getOwnedShop, getProductLimitInfo } from "@/lib/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "商品を登録 — Mania Market" };

export default async function DashboardProductNewPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <div className="px-4 py-10"><AuthCard next="/dashboard/products/new" /></div>;

  const [shop, categories, limitInfo] = await Promise.all([
    getOwnedShop(supabase, userData.user.id),
    listCategories(supabase),
    getProductLimitInfo(supabase, userData.user.id)
  ]);
  if (!shop) notFound();

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/dashboard/products" className="text-sm font-semibold text-lagoon hover:text-cinnabar">← 商品一覧</Link>
      <h1 className="mt-2 text-4xl font-black">商品を登録</h1>
      <div className="mt-6"><ProductLimitBanner limitInfo={limitInfo} /></div>
      <section className="mt-8 rounded-xl border border-ink/10 bg-paper/95 p-6 shadow-sm">
        {!limitInfo.canCreate ? (
          <p className="text-sm text-cinnabar">
            現在のプランの上限に達しました。
            <Link href="/dashboard/billing" className="ml-2 font-bold hover:underline">
              プランをアップグレード
            </Link>
          </p>
        ) : (
          <ProductForm shopId={shop.id} categories={categories} mode="create" />
        )}
      </section>
    </section>
  );
}