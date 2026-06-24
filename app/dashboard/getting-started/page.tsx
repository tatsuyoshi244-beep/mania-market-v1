import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GettingStartedSteps } from "@/components/dashboard/getting-started-steps";
import { getShopStats } from "@/lib/dashboard/stats";
import { requireDashboardAccess } from "@/lib/dashboard/access";
import { getProductLimitInfo } from "@/lib/products";

export const metadata = { title: "運営ガイド — Mania Market" };

export default async function DashboardGettingStartedPage() {
  const access = await requireDashboardAccess("/dashboard/getting-started");

  if (!access.shop) {
    return (
      <DashboardShell title="運営ガイド" description="出店後の5ステップで運営を始めましょう。" email={access.email} mode={access.mode} shopName={null}>
        <GettingStartedSteps hasProducts={false} hasShopProfile={false} hasSocialLinks={false} hasFollowers={false} isPremiumOrStandard={false} readOnly={!access.canEdit} />
      </DashboardShell>
    );
  }

  const [limitInfo, stats] = await Promise.all([
    getProductLimitInfo(access.supabase, access.userId),
    getShopStats(access.supabase, access.shop.id)
  ]);

  const hasShopProfile = Boolean(access.shop.description && access.shop.logo_url);
  const hasSocialLinks = Boolean(access.shop.website_url || access.shop.instagram_url || access.shop.twitter_url);

  return (
    <DashboardShell title="運営ガイド" description="出店後の5ステップで運営を始めましょう。" email={access.email} mode={access.mode} shopName={access.shop.name}>
      <GettingStartedSteps
        hasProducts={limitInfo.productCount > 0}
        hasShopProfile={hasShopProfile}
        hasSocialLinks={hasSocialLinks}
        hasFollowers={stats.followerCount > 0}
        isPremiumOrStandard={limitInfo.planKey !== "free"}
        shopSlug={access.shop.slug}
        readOnly={!access.canEdit}
      />
    </DashboardShell>
  );
}