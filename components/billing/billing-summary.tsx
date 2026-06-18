import type { BillingSummary } from "@/lib/billing/queries";
import { PLANS } from "@/lib/plans";
import { yen } from "@/lib/utils";

export function BillingSummaryCard({ summary }: { summary: BillingSummary }) {
  const limitLabel = summary.limitInfo.limit === null ? "無制限" : `${summary.limitInfo.limit}件`;
  const renewalLabel = summary.currentPeriodEnd
    ? new Date(summary.currentPeriodEnd).toLocaleDateString("ja-JP")
    : "—";

  return (
    <section className="rounded-2xl border border-ink/10 bg-white/90 p-6 shadow-sm dark:bg-ink/50">
      <h2 className="text-xl font-black">現在のプラン</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-ink/50">プラン</p>
          <p className="text-2xl font-black">{summary.planName}</p>
          <p className="mt-1 text-sm text-ink/60">{summary.monthlyPrice === 0 ? "無料" : `${yen(summary.monthlyPrice)} / 月`}</p>
        </div>
        <div>
          <p className="text-xs text-ink/50">次回更新日</p>
          <p className="text-lg font-bold">{summary.planKey === "free" ? "—" : renewalLabel}</p>
          {summary.subscriptionStatus ? (
            <p className="mt-1 text-xs text-ink/55">状態: {summary.subscriptionStatus}</p>
          ) : null}
        </div>
        <div>
          <p className="text-xs text-ink/50">登録商品数</p>
          <p className="text-lg font-bold">{summary.limitInfo.productCount}件</p>
        </div>
        <div>
          <p className="text-xs text-ink/50">利用上限</p>
          <p className="text-lg font-bold">{limitLabel}</p>
        </div>
      </div>
      {!summary.limitInfo.canCreate ? (
        <p className="mt-5 rounded-lg border border-cinnabar/25 bg-cinnabar/8 px-4 py-3 text-sm font-semibold text-cinnabar">
          現在のプランの上限に達しました。上位プランへのアップグレードをご検討ください。
        </p>
      ) : null}
      <p className="mt-4 text-xs text-ink/45">
        {PLANS.free.name} {PLANS.free.productLimit}件 / {PLANS.standard.name} {PLANS.standard.productLimit}件 / {PLANS.premium.name} 無制限
      </p>
    </section>
  );
}