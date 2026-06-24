import Link from "next/link";
import type { DashboardSummary } from "@/lib/dashboard/stats";

type DashboardSummaryProps = {
  summary: DashboardSummary;
  readOnly?: boolean;
};

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white/90 p-4 shadow-sm dark:bg-ink/50">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink/50">{hint}</p> : null}
    </div>
  );
}

export function DashboardSummaryCards({ summary, readOnly = false }: DashboardSummaryProps) {
  const limitLabel = summary.limitInfo.limit === null ? "無制限" : `${summary.limitInfo.limit}件`;
  const favoriteTotal = summary.stats.shopFavoriteCount + summary.stats.productFavoriteCount;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="ショップ名" value={summary.shopName} hint={summary.isPublished ? "公開中" : "非公開"} />
        <StatCard label="現在プラン" value={summary.planName} />
        <StatCard label="商品登録数" value={`${summary.limitInfo.productCount}件`} hint={`上限 ${limitLabel}`} />
        <StatCard label="公開状態" value={summary.isPublished ? "公開" : "非公開"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="フォロワー数" value={`${summary.stats.followerCount}`} />
        <StatCard label="お気に入り数" value={`${favoriteTotal}`} hint={`ショップ ${summary.stats.shopFavoriteCount} / 商品 ${summary.stats.productFavoriteCount}`} />
        <StatCard label="閲覧数" value={`${summary.stats.totalViewCount}`} hint={`ショップ ${summary.stats.shopViewCount} / 商品 ${summary.stats.productViewCount}`} />
        <StatCard label="残り登録可能" value={summary.limitInfo.remaining === null ? "無制限" : `${summary.limitInfo.remaining}件`} />
      </div>

      {!readOnly ? (
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/products/new" className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-lagoon">
            商品を登録
          </Link>
          <Link href="/dashboard/shop" className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-bold hover:border-cinnabar">
            ショップを編集
          </Link>
          <Link href="/dashboard/analytics" className="rounded-full border border-lagoon/25 bg-lagoon/10 px-5 py-2.5 text-sm font-bold text-lagoon">
            アナリティクス
          </Link>
          <Link href={`/shops/${summary.shopSlug}`} className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-bold">
            公開ページを見る
          </Link>
        </div>
      ) : null}
    </div>
  );
}