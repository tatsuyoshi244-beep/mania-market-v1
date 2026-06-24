import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProductLimitBanner } from "@/components/dashboard/product-limit-banner";
import { ProductsManager } from "@/components/dashboard/products-manager";
import { requireDashboardAccess } from "@/lib/dashboard/access";
import { getProductLimitInfo, listSellerProducts } from "@/lib/products";

export const metadata = { title: "商品管理 — Mania Market" };

export default async function DashboardProductsPage() {
  const access = await requireDashboardAccess("/dashboard/products");
  const readOnly = !access.canEdit;

  if (!access.shop) {
    return (
      <DashboardShell title="商品管理" description="商品の一覧・検索・公開管理" email={access.email} mode={access.mode} shopName={null}>
        <p className="rounded-xl border border-cinnabar/25 bg-cinnabar/8 p-6 text-sm">先にショップを引き継いでください。</p>
      </DashboardShell>
    );
  }

  const [products, limitInfo] = await Promise.all([
    listSellerProducts(access.supabase, access.userId),
    getProductLimitInfo(access.supabase, access.userId)
  ]);

  return (
    <DashboardShell title="商品管理" description="商品の一覧・検索・公開管理" email={access.email} mode={access.mode} shopName={access.shop.name}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div />
        {!readOnly && limitInfo.canCreate ? (
          <Link href="/dashboard/products/new" className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-lagoon">新規登録</Link>
        ) : (
          <span className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-bold text-ink/40">新規登録</span>
        )}
      </div>
      <div className="mt-4"><ProductLimitBanner limitInfo={limitInfo} /></div>
      <div className="mt-6"><ProductsManager products={products} readOnly={readOnly} /></div>
    </DashboardShell>
  );
}