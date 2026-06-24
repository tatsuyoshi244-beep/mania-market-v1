import Link from "next/link";
import type { ShopAnalyticsSummary } from "@/lib/dashboard/analytics";

type AnalyticsPanelProps = {
  analytics: ShopAnalyticsSummary;
};

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white/90 p-5 shadow-sm dark:bg-ink/50">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

export function AnalyticsPanel({ analytics }: AnalyticsPanelProps) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="今日の閲覧数" value={analytics.viewsToday} />
        <MetricCard label="7日間閲覧数" value={analytics.views7d} />
        <MetricCard label="30日間閲覧数" value={analytics.views30d} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-ink/10 bg-paper/95 p-5 shadow-sm">
          <h2 className="text-lg font-black">人気商品 TOP5（30日）</h2>
          {analytics.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-ink/60">まだデータがありません。</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {analytics.topProducts.map((product, index) => (
                <li key={product.product_id} className="flex items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2 text-sm">
                  <span className="font-semibold">{index + 1}. {product.name}</span>
                  <span className="text-ink/55">{product.views} views</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-xl border border-ink/10 bg-paper/95 p-5 shadow-sm">
          <h2 className="text-lg font-black">人気流入ページ（30日）</h2>
          {analytics.topPages.length === 0 ? (
            <p className="mt-4 text-sm text-ink/60">まだデータがありません。</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {analytics.topPages.map((page, index) => (
                <li key={`${page.page_type}-${page.label}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2 text-sm">
                  <span className="font-semibold">{index + 1}. {page.label}</span>
                  <span className="text-ink/55">{page.views} views</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <p className="text-xs text-ink/50">
        閲覧数はショップページ・商品ページの合算です。
        <Link href="/dashboard/getting-started" className="ml-2 font-semibold text-lagoon hover:text-cinnabar">運営ガイド</Link>
        で集客のヒントを確認できます。
      </p>
    </div>
  );
}