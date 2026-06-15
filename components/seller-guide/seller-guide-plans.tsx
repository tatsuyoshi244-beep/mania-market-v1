import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { yen } from "@/lib/utils";

const FEATURES: Record<string, string[]> = {
  free: ["ショップ公開", "商品3件まで", "基本ブランディング", "Mania Concierge"],
  standard: ["商品30件まで", "優先サポート（予定）", "分析機能（予定）"],
  premium: ["商品無制限", "プレミアム表示（予定）", "広告枠（予定）"]
};

export function SellerGuidePlans() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {Object.values(PLANS).map((plan) => (
        <article
          key={plan.key}
          className={`rounded-3xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-editorial ${
            plan.key === "standard"
              ? "border-cinnabar/30 bg-cinnabar/5 dark:bg-cinnabar/10"
              : "border-ink/10 bg-white/80 dark:border-paper/10 dark:bg-ink/50"
          }`}
        >
          {plan.key === "standard" ? (
            <span className="rounded-full bg-cinnabar px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Popular
            </span>
          ) : (
            <span className="inline-block h-6" />
          )}
          <h3 className="mt-3 font-display text-2xl font-semibold">{plan.name}</h3>
          <p className="mt-3 font-display text-4xl font-semibold">
            {plan.monthlyPrice === 0 ? "無料" : yen(plan.monthlyPrice)}
            {plan.monthlyPrice > 0 ? <span className="text-sm font-sans text-ink/50"> /月</span> : null}
          </p>
          <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">
            公開商品 {plan.productLimit === null ? "無制限" : `${plan.productLimit}件まで`}
          </p>
          <ul className="mt-6 space-y-2">
            {(FEATURES[plan.key] ?? []).map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-ink/75 dark:text-paper/75">
                <Check className="mt-0.5 size-4 shrink-0 text-moss" />
                {feature}
              </li>
            ))}
          </ul>
        </article>
      ))}
      <p className="md:col-span-3 text-center text-xs text-ink/45 dark:text-paper/45">
        有料プランの詳細・お支払いは
        <Link href="/dashboard/billing" className="mx-1 font-semibold text-lagoon hover:text-cinnabar">
          ダッシュボードの請求
        </Link>
        から設定できます。
      </p>
    </div>
  );
}