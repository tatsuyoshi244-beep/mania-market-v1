import Link from "next/link";
import type { PlanKey } from "@/types/database";
import { PLANS } from "@/lib/plans";
import { yen } from "@/lib/utils";

type BillingPlanCardsProps = {
  currentPlan: PlanKey;
  hasStripeCustomer: boolean;
};

const PLAN_ORDER: PlanKey[] = ["free", "standard", "premium"];

function canCheckout(plan: PlanKey, currentPlan: PlanKey) {
  if (plan === "free") return false;
  if (currentPlan === "free") return true;
  if (currentPlan === "standard" && plan === "premium") return true;
  return false;
}

export function BillingPlanCards({ currentPlan, hasStripeCustomer }: BillingPlanCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PLAN_ORDER.map((planKey) => {
        const plan = PLANS[planKey];
        const isCurrent = currentPlan === planKey;
        const showCheckout = canCheckout(planKey, currentPlan);

        return (
          <section
            key={plan.key}
            className={`rounded-xl border p-5 shadow-sm ${
              isCurrent ? "border-moss/40 bg-moss/5" : "border-ink/10 bg-paper/95"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold">{plan.name}</h3>
              {isCurrent ? (
                <span className="rounded-md bg-moss px-2 py-1 text-xs font-bold text-white">現在</span>
              ) : null}
            </div>
            <p className="mt-3 text-3xl font-black">{plan.monthlyPrice === 0 ? "無料" : yen(plan.monthlyPrice)}</p>
            <p className="mt-2 text-sm text-ink/65">
              商品{plan.productLimit === null ? "無制限" : `${plan.productLimit}件まで`}
            </p>
            <div className="mt-5">
              {showCheckout ? (
                <Link
                  href={`/checkout/${plan.key}`}
                  className="inline-flex rounded-md bg-cinnabar px-4 py-2 text-sm font-bold text-white hover:bg-ink"
                >
                  {currentPlan === "free" ? `${plan.name}に登録` : `${plan.name}へアップグレード`}
                </Link>
              ) : null}
              {isCurrent && planKey !== "free" && hasStripeCustomer ? (
                <p className="text-xs text-ink/55">プラン変更・解約は下の「請求管理」から行えます。</p>
              ) : null}
              {isCurrent && planKey === "free" ? (
                <p className="text-xs text-ink/55">有料プランは上のボタンから登録できます。</p>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}