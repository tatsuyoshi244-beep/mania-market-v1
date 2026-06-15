import Link from "next/link";
import { Lightbulb, Tag, TrendingUp } from "lucide-react";
import type { MarketingSuggestions } from "@/types/concierge";

type ConciergeSuggestionsCardProps = {
  marketing: MarketingSuggestions;
};

export function ConciergeSuggestionsCard({ marketing }: ConciergeSuggestionsCardProps) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-white/90 p-4 shadow-sm dark:border-paper/10 dark:bg-ink/60">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Lightbulb className="size-4 text-cinnabar" />
        提案
      </h3>

      <div className="mt-3">
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink/45">
          <Tag className="size-3" /> 人気タグ
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {marketing.popularTags.length === 0 ? (
            <span className="text-xs text-ink/50">データ収集中</span>
          ) : (
            marketing.popularTags.map((row) => (
              <span
                key={row.tag}
                className="rounded-full border border-ink/10 px-2 py-0.5 text-[10px] font-semibold dark:border-paper/15"
              >
                #{row.tag}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink/45">関連カテゴリ</p>
        <div className="mt-1.5 space-y-1">
          {marketing.relatedCategories.length === 0 ? (
            <p className="text-xs text-ink/50">カテゴリ登録後に表示されます</p>
          ) : (
            marketing.relatedCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="block rounded-lg border border-ink/8 px-2 py-1.5 text-xs transition hover:border-lagoon dark:border-paper/10"
              >
                <span className="font-semibold">{cat.name}</span>
                <span className="mt-0.5 block text-[10px] text-ink/50">{cat.reason}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="mt-3">
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink/45">
          <TrendingUp className="size-3" /> 季節トレンド
        </p>
        {marketing.seasonalTrends.map((trend) => (
          <div key={trend.title} className="mt-1.5 rounded-lg bg-ink/5 p-2 dark:bg-paper/5">
            <p className="text-xs font-semibold">{trend.title}</p>
            <p className="mt-0.5 text-[10px] leading-5 text-ink/55 dark:text-paper/55">{trend.description}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {trend.tags.map((tag) => (
                <span key={tag} className="text-[10px] text-lagoon">#{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}