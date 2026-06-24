import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardSummaryCards } from "@/components/dashboard/dashboard-summary";
import { GettingStartedSteps } from "@/components/dashboard/getting-started-steps";
import { requireDashboardAccess } from "@/lib/dashboard/access";
import { getDashboardSummary } from "@/lib/dashboard/stats";

export const metadata = { title: "運営サマリー — Mania Market" };

export default async function DashboardPage() {
  const access = await requireDashboardAccess("/dashboard");

  if (!access.shop) {
    return (
      <DashboardShell title="運営サマリー" description="ショップ公開後の運営状況をここで確認できます。" email={access.email} mode={access.mode} shopName={null}>
        <GettingStartedSteps
          hasProducts={false}
          hasShopProfile={false}
          hasSocialLinks={false}
          hasFollowers={false}
          isPremiumOrStandard={false}
          readOnly={!access.canEdit}
        />
      </DashboardShell>
    );
  }

  const summary = await getDashboardSummary(access.supabase, access.userId, access.shop);
  const limitInfo = summary.limitInfo;
  const hasShopProfile = Boolean(access.shop.description && access.shop.logo_url);
  const hasSocialLinks = Boolean(access.shop.website_url || access.shop.instagram_url || access.shop.twitter_url);

  return (
    <DashboardShell title="運営サマリー" description="ショップの運営状況をひと目で確認できます。" email={access.email} mode={access.mode} shopName={access.shop.name}>
      <DashboardSummaryCards summary={summary} readOnly={!access.canEdit} />
      <section className="mt-10">
        <h2 className="text-2xl font-black">はじめの一歩</h2>
        <div className="mt-4">
          <GettingStartedSteps
            hasProducts={limitInfo.productCount > 0}
            hasShopProfile={hasShopProfile}
            hasSocialLinks={hasSocialLinks}
            hasFollowers={summary.stats.followerCount > 0}
            isPremiumOrStandard={limitInfo.planKey !== "free"}
            shopSlug={access.shop.slug}
            readOnly={!access.canEdit}
          />
        </div>
      </section>
    </DashboardShell>
  );
}