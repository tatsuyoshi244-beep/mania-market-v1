import { PLANS } from "@/lib/plans";
import { yen } from "@/lib/utils";

export function PlanCards({ currentPlan }: { currentPlan?: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Object.values(PLANS).map((plan) => (
        <section key={plan.key} className="rounded-lg border border-ink/10 bg-paper/95 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{plan.name}</h2>
            {currentPlan === plan.key ? (
              <span className="rounded-md bg-moss px-2 py-1 text-xs font-bold text-white">現在</span>
            ) : null}
          </div>
          <p className="mt-3 text-3xl font-black">{yen(plan.monthlyPrice)}</p>
          <p className="mt-2 text-sm text-ink/65">
            商品{plan.productLimit === null ? "無制限" : `${plan.productLimit}件まで`}
          </p>
        </section>
      ))}
    </div>
  );
}
