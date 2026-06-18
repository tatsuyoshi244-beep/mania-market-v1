import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { ProductLimitBanner } from "@/components/dashboard/product-limit-banner";
import { ProductsTable } from "@/components/dashboard/products-table";
import { getOwnedShop, getProductLimitInfo, listSellerProducts } from "@/lib/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "商品管理 — Mania Market" };

export default async function DashboardProductsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <div className="px-4 py-10"><AuthCard next="/dashboard/products" /></div>;

  const [shop, products, limitInfo] = await Promise.all([
    getOwnedShop(supabase, userData.user.id),
    listSellerProducts(supabase, userData.user.id),
    getProductLimitInfo(supabase, userData.user.id)
  ]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-lagoon hover:text-cinnabar">← ダッシュボード</Link>
          <h1 className="mt-2 text-4xl font-black">商品管理</h1>
        </div>
        {shop && limitInfo.canCreate ? (
          <Link href="/dashboard/products/new" className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-lagoon">新規登録</Link>
        ) : (
          <span className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-bold text-ink/40">新規登録</span>
        )}
      </div>
      {!shop ? (
        <p className="mt-6 rounded-xl border border-cinnabar/25 bg-cinnabar/8 p-6 text-sm">先にショップを登録または引き継いでください。<Link href="/dashboard" className="ml-2 font-bold text-cinnabar hover:underline">ダッシュボードへ</Link></p>
      ) : (
        <>
          <div className="mt-6"><ProductLimitBanner limitInfo={limitInfo} /></div>
          <div className="mt-8"><ProductsTable products={products} /></div>
        </>
      )}
    </section>
  );
}