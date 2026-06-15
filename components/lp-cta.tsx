import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

export function LpCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-gradient-to-br from-lagoon via-lagoon to-moss p-8 text-white shadow-editorial sm:p-12">
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 left-1/3 size-56 rounded-full bg-cinnabar/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">For Sellers</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            あなたの専門店を、マニアに届けよう。
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
            無料プランから始められるショップ開設。商品掲載・ブランディング・外部販売リンクまで、ひとつのダッシュボードで。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-ink transition hover:bg-paper"
            >
              <Store className="size-4" />
              無料で出店する
            </Link>
            <Link
              href="/shops"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              ショップを見る
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}