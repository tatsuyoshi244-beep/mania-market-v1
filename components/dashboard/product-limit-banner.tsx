import Link from "next/link";
import type { ProductLimitInfo } from "@/types/auth";
import { PLANS } from "@/lib/plans";

type ProductLimitBannerProps = {
  limitInfo: ProductLimitInfo;
};

export function ProductLimitBanner({ limitInfo }: ProductLimitBannerProps) {
  const planName = PLANS[limitInfo.planKey].name;
  const limitLabel = limitInfo.limit === null ? "無制限" : `${limitInfo.limit}件`;
  const remainingLabel = limitInfo.remaining === null ? "無制限" : `${limitInfo.remaining}件`;

  return (
    <div className="rounded-xl border border-ink/10 bg-white/90 p-5 shadow-sm dark:border-paper/10 dark:bg-ink/60">
      <p className="text-sm font-semibold text-ink/55">プランと商品登録数</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-ink/50">現在のプラン</p>
          <p className="text-lg font-bold">{planName}</p>
        </div>
        <div>
          <p className="text-xs text-ink/50">登録数</p>
          <p className="text-lg font-bold">{limitInfo.productCount}件</p>
        </div>
        <div>
          <p className="text-xs text-ink/50">上限</p>
          <p className="text-lg font-bold">{limitLabel}</p>
        </div>
        <div>
          <p className="text-xs text-ink/50">残り</p>
          <p className="text-lg font-bold">{remainingLabel}</p>
        </div>
      </div>
      {!limitInfo.canCreate ? (
        <div className="mt-4 rounded-lg border border-cinnabar/25 bg-cinnabar/8 p-4">
          <p className="text-sm font-semibold text-cinnabar">現在のプランの上限に達しました</p>
          <Link href="/dashboard/billing" className="mt-2 inline-flex text-sm font-bold text-lagoon hover:text-cinnabar">
            プランをアップグレード
          </Link>
        </div>
      ) : null}
    </div>
  );
}