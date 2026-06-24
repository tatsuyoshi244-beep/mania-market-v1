import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireDashboardAccess } from "@/lib/dashboard/access";
import { getShopAnalyticsSummary } from "@/lib/dashboard/analytics";

export const metadata = { title: "アナリティクス — Mania Market" };

export default async function DashboardAnalyticsPage() {
  const access = await requireDashboardAccess("/dashboard/analytics");

  if (!access.shop) {
    return (
      <DashboardShell title="アナリティクス" description="閲覧数と人気商品を確認できます。" email={access.email} mode={access.mode} shopName={null}>
        <p className="rounded-xl border border-ink/10 bg-paper/95 p-6 text-sm text-ink/65">ショップ公開後に閲覧データが表示されます。</p>
      </DashboardShell>
    );
  }

  const analytics = await getShopAnalyticsSummary(access.supabase, access.shop.id);

  return (
    <DashboardShell title="アナリティクス" description="閲覧数と人気商品を確認できます。" email={access.email} mode={access.mode} shopName={access.shop.name}>
      <AnalyticsPanel analytics={analytics} />
    </DashboardShell>
  );
}