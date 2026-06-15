import Link from "next/link";
import { Gauge } from "lucide-react";
import type { ShopDiagnosis } from "@/types/concierge";
import { cn } from "@/lib/utils";

type ConciergeCompletionCardProps = {
  diagnosis: ShopDiagnosis;
};

export function ConciergeCompletionCard({ diagnosis }: ConciergeCompletionCardProps) {
  const { score, items } = diagnosis;
  const ringColor = score >= 80 ? "text-moss" : score >= 50 ? "text-lagoon" : "text-cinnabar";

  return (
    <section className="rounded-2xl border border-ink/10 bg-white/90 p-4 shadow-sm dark:border-paper/10 dark:bg-ink/60">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Gauge className="size-4 text-lagoon" />
        ショップ完成度
      </h3>
      <div className="mt-4 flex items-center gap-4">
        <div className={cn("font-display text-4xl font-semibold", ringColor)}>{score}%</div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
          <div
            className={cn("h-full rounded-full transition-all", score >= 80 ? "bg-moss" : score >= 50 ? "bg-lagoon" : "bg-cinnabar")}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      <ul className="mt-4 max-h-40 space-y-1 overflow-y-auto text-[11px]">
        {items.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-2">
            <span className={item.done ? "text-ink/45 line-through dark:text-paper/45" : "font-medium"}>{item.label}</span>
            <span className={item.done ? "text-moss" : "text-cinnabar"}>{item.done ? "✓" : "—"}</span>
          </li>
        ))}
      </ul>
      <Link href="/dashboard" className="mt-3 inline-block text-xs font-bold text-lagoon hover:text-cinnabar">
        ショップ設定を開く →
      </Link>
    </section>
  );
}