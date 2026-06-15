import { Sparkles } from "lucide-react";
import type { PartnerApplication } from "@/types/database";

const RECOMMENDATION_CLASS: Record<string, string> = {
  "承認推奨": "bg-moss/15 text-moss border-moss/25",
  "要確認": "bg-lagoon/15 text-lagoon border-lagoon/25",
  "再審査推奨": "bg-cinnabar/15 text-cinnabar border-cinnabar/25"
};

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  const pct = Math.round((value / 25) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="text-ink/55">{value}/25</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
        <div className="h-full rounded-full bg-lagoon transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

type PartnerApplicationAiReviewProps = {
  application: PartnerApplication;
};

export function PartnerApplicationAiReview({ application }: PartnerApplicationAiReviewProps) {
  if (application.ai_score === null || !application.ai_recommendation) {
    return (
      <section className="rounded-3xl border border-dashed border-ink/15 bg-ink/5 p-6 dark:border-paper/15 dark:bg-paper/5">
        <p className="text-sm text-ink/55">Mania Review AI の評価はまだありません。</p>
      </section>
    );
  }

  const recClass = RECOMMENDATION_CLASS[application.ai_recommendation] ?? "bg-ink/10 text-ink/70";

  return (
    <section className="rounded-3xl border border-ink/10 bg-gradient-to-br from-lagoon/8 via-white to-cinnabar/5 p-6 dark:border-paper/10 dark:from-lagoon/15 dark:via-ink/50 dark:to-cinnabar/10 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-lagoon">
            <Sparkles className="size-4 text-cinnabar" />
            Mania Review AI
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">AI一次審査</h2>
          {application.ai_checked_at ? (
            <p className="mt-1 text-xs text-ink/50">
              審査日時: {new Date(application.ai_checked_at).toLocaleString("ja-JP")}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="font-display text-5xl font-semibold text-ink dark:text-paper">{application.ai_score}</p>
          <p className="text-xs text-ink/50">/ 100</p>
        </div>
      </div>

      <div className="mt-5">
        <span className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-bold ${recClass}`}>
          AI判定: {application.ai_recommendation}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <ScoreBar label="専門性" value={application.ai_specialty} />
        <ScoreBar label="独自性" value={application.ai_originality} />
        <ScoreBar label="熱量" value={application.ai_passion} />
        <ScoreBar label="安全性" value={application.ai_safety} />
      </div>

      {application.ai_comment ? (
        <div className="mt-6 rounded-2xl border border-ink/8 bg-white/70 p-4 dark:border-paper/10 dark:bg-ink/40">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45">AIコメント</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink/75 dark:text-paper/75">
            {application.ai_comment}
          </p>
        </div>
      ) : null}

      <p className="mt-4 text-[11px] text-ink/45">
        ※ ルールベースの参考情報です。最終判断は管理者が行ってください。
      </p>
    </section>
  );
}