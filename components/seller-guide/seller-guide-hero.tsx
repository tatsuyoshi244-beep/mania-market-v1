import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

export function SellerGuideHero() {
  return (
    <section className="relative overflow-hidden border-b border-ink/10 dark:border-paper/10">
      <div className="lp-mesh absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-12 sm:pb-28 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="max-w-3xl animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/55 px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] text-ink/65 backdrop-blur dark:border-paper/15 dark:bg-ink/45 dark:text-paper/65">
            <Store className="size-3.5 text-cinnabar" />
            SELLER GUIDE
          </p>
          <h1 className="mt-8 font-display text-4xl font-semibold leading-[1.35] tracking-tight sm:text-5xl lg:text-6xl">
            あなたの好きを、
            <span className="mt-2 block text-cinnabar">誰かの発見に変える。</span>
          </h1>
          <p className="mt-8 max-w-xl text-base leading-8 text-ink/70 dark:text-paper/70 sm:text-lg">
            Mania Market は、マニアの専門店と出会うための発見プラットフォーム。
            出店の流れ・条件・プランを、このガイドでまとめて確認できます。
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/partner/apply"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white shadow-editorial transition hover:bg-lagoon dark:bg-lagoon dark:hover:bg-cinnabar"
            >
              出店申請する
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/dashboard/concierge"
              className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white/65 px-6 py-3.5 text-sm font-bold backdrop-blur transition hover:border-cinnabar hover:text-cinnabar dark:border-paper/18 dark:bg-ink/45"
            >
              Mania Concierge を見る
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}