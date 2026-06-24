import { BillingPlanCards } from "@/components/billing/billing-plan-cards";
import { BillingPortalButton } from "@/components/billing/portal-button";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PLANS } from "@/lib/plans";
import { getBillingSummary } from "@/lib/billing/queries";
import { requireDashboardAccess } from "@/lib/dashboard/access";

export const metadata = { title: "プラン管理 — Mania Market" };

type BillingPageProps = {
  searchParams: Promise<{ success?: string; canceled?: string; error?: string }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const access = await requireDashboardAccess("/dashboard/billing");
  const summary = await getBillingSummary(access.supabase, access.userId);
  const params = await searchParams;
  const limitLabel = summary.limitInfo.limit === null ? "無制限" : `${summary.limitInfo.limit}件`;
  const remainingLabel = summary.limitInfo.remaining === null ? "無制限" : `${summary.limitInfo.remaining}件`;

  return (
    <DashboardShell title="プラン管理" description="現在のプラン確認とアップグレード" email={access.email} mode={access.mode} shopName={access.shop?.name ?? null}>
      {params.success ? (
        <p className="rounded-xl border border-moss/30 bg-moss/10 px-4 py-3 text-sm font-semibold text-moss">
          お支払い手続きが完了しました。反映まで数秒かかる場合があります。
        </p>
      ) : null}
      {params.canceled ? (
        <p className="mt-4 rounded-xl border border-ink/15 bg-paper/80 px-4 py-3 text-sm text-ink/70">お支払い手続きはキャンセルされました。</p>
      ) : null}
      {params.error ? (
        <p className="mt-4 rounded-xl border border-cinnabar/30 bg-cinnabar/8 px-4 py-3 text-sm text-cinnabar">{decodeURIComponent(params.error)}</p>
      ) : null}

      <section className="rounded-2xl border border-ink/10 bg-white/90 p-6 shadow-sm dark:bg-ink/50">
        <h2 className="text-xl font-black">現在のプラン</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-ink/50">プラン</p><p className="text-2xl font-black">{summary.planName}</p><p className="text-sm text-ink/60">{PLANS[summary.planKey].monthlyPrice === 0 ? "無料" : `月額 ${PLANS[summary.planKey].monthlyPrice}円`}</p></div>
          <div><p className="text-xs text-ink/50">利用数</p><p className="text-lg font-bold">{summary.limitInfo.productCount}件</p></div>
          <div><p className="text-xs text-ink/50">上限</p><p className="text-lg font-bold">{limitLabel}</p></div>
          <div><p className="text-xs text-ink/50">残り登録可能数</p><p className="text-lg font-bold">{remainingLabel}</p></div>
        </div>
        {!summary.limitInfo.canCreate ? (
          <p className="mt-5 rounded-lg border border-cinnabar/25 bg-cinnabar/8 px-4 py-3 text-sm font-semibold text-cinnabar">
            現在のプランの上限に達しました。上位プランへのアップグレードをご検討ください。
          </p>
        ) : null}
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {summary.stripeCustomerId ? <BillingPortalButton /> : null}
        <p className="text-xs text-ink/50">テストカード: 4242 4242 4242 4242</p>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-black">プラン変更</h2>
        <div className="mt-6">
          <BillingPlanCards currentPlan={summary.planKey} hasStripeCustomer={Boolean(summary.stripeCustomerId)} />
        </div>
      </div>
    </DashboardShell>
  );
}