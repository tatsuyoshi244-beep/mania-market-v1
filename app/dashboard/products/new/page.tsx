import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProductForm } from "@/components/dashboard/product-form";
import { ProductLimitBanner } from "@/components/dashboard/product-limit-banner";
import { listCategories } from "@/lib/categories";
import { requireOwnerDashboardAccess } from "@/lib/dashboard/access";
import { getProductLimitInfo } from "@/lib/products";

export const metadata = { title: "商品を登録 — Mania Market" };

export default async function DashboardProductNewPage() {
  const access = await requireOwnerDashboardAccess("/dashboard/products/new");
  const [categories, limitInfo] = await Promise.all([
    listCategories(access.supabase),
    getProductLimitInfo(access.supabase, access.userId)
  ]);

  if (!limitInfo.canCreate) {
    redirect("/dashboard/billing");
  }

  return (
    <DashboardShell title="商品を登録" description="商品情報を入力して公開準備を進めます。" email={access.email} mode={access.mode} shopName={access.shop.name}>
      <Link href="/dashboard/products" className="text-sm font-semibold text-lagoon hover:text-cinnabar">← 商品一覧</Link>
      <div className="mt-4"><ProductLimitBanner limitInfo={limitInfo} /></div>
      <section className="mt-6 rounded-xl border border-ink/10 bg-paper/95 p-6 shadow-sm">
        <ProductForm shopId={access.shop.id} categories={categories} mode="create" />
      </section>
    </DashboardShell>
  );
}