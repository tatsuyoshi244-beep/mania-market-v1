import { ShopForm } from "@/components/dashboard/shop-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listCategories } from "@/lib/categories";
import { requireDashboardAccess } from "@/lib/dashboard/access";

export const metadata = { title: "ショップ編集 — Mania Market" };

export default async function DashboardShopPage() {
  const access = await requireDashboardAccess("/dashboard/shop");
  const categories = await listCategories(access.supabase);

  const selectedCategoryIds = access.shop
    ? (
        await access.supabase.from("shop_categories").select("category_id").eq("shop_id", access.shop.id)
      ).data?.map((row) => row.category_id) ?? []
    : [];

  return (
    <DashboardShell title="ショップ編集" description="ショップの基本情報・SNS・公開設定を編集します。" email={access.email} mode={access.mode} shopName={access.shop?.name ?? null}>
      {!access.shop ? (
        <p className="rounded-xl border border-cinnabar/25 bg-cinnabar/8 p-6 text-sm">管理中のショップがありません。出店申請の公開後に引き継いでください。</p>
      ) : (
        <ShopForm shop={access.shop} categories={categories} selectedCategoryIds={selectedCategoryIds} readOnly={!access.canEdit} />
      )}
    </DashboardShell>
  );
}