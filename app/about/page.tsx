import Link from "next/link";
import { ArrowRight, Compass, Globe2, ShieldCheck, Store } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "サービス概要",
  description: "マニアマーケットの役割、掲載ジャンル、ショップ運営、購入の流れをご案内します。",
  alternates: { canonical: "/about" }
};

const PRINCIPLES = [
  {
    icon: Compass,
    title: "発見に特化",
    body: "検索結果を並べるだけでなく、ジャンル・商品・専門店を眺めながら、まだ知らない「好き」に出会える導線をつくります。"
  },
  {
    icon: Store,
    title: "専門店を主役に",
    body: "ヴィンテージ、クラフト、アウトドア、音楽、コレクション、食に加えて、WebサービスやAIも掲載できます。"
  },
  {
    icon: Globe2,
    title: "購入は各ショップで",
    body: "Mania Market内では決済を行いません。気になった商品は掲載ショップの公式サイトへ移動して購入します。"
  },
  {
    icon: ShieldCheck,
    title: "掲載品質を守る",
    body: "出店申請と公開状態を管理し、専門性・正確な情報・外部リンクの安全性を確認しながら掲載します。"
  }
] as const;

export default function AboutPage() {
  return (
    <div className="bg-paper dark:bg-ink">
      <section className="relative overflow-hidden border-b border-ink/10 dark:border-paper/10">
        <div className="lp-mesh absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cinnabar">About Mania Market</p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-tight sm:text-7xl">
            欲しいものではなく、
            <br />
            知らなかった世界に出会う。
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-ink/70 dark:text-paper/70 sm:text-lg">
            Mania Marketは、熱量の高い専門店と商品を見つけるための発見プラットフォームです。
            店舗や作品の背景まで眺め、気になったらそのショップへ訪れる。発見と送客に集中します。
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/categories" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white hover:bg-lagoon dark:bg-lagoon">
              ジャンルを見る <ArrowRight className="size-4" />
            </Link>
            <Link href="/seller-guide" className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/70 px-6 py-3.5 text-sm font-bold hover:border-cinnabar dark:border-paper/15 dark:bg-ink/50">
              出店について
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cinnabar">How it works</p>
        <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Mania Marketの役割</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {PRINCIPLES.map((item) => (
            <article key={item.title} className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/50 sm:p-8">
              <div className="flex size-11 items-center justify-center rounded-xl bg-lagoon/15 text-lagoon"><item.icon className="size-5" /></div>
              <h3 className="mt-5 font-display text-2xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-ink/65 dark:text-paper/65">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-ink/10 bg-ink text-paper dark:border-paper/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-20 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-paper/50">For visitors</p>
            <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">見る、気づく、訪れる。</h2>
            <p className="mt-5 text-sm leading-7 text-paper/70">カテゴリや今日の発見から気になるものを見つけ、ショップの世界観を確認します。購入・配送・返品は各ショップの案内に従います。</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-paper/50">For sellers</p>
            <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">専門性を、見つけてもらう。</h2>
            <p className="mt-5 text-sm leading-7 text-paper/70">ショップ情報と商品を登録し、カテゴリ・タグ・外部販売先を整えます。無料プランから始められ、掲載後は閲覧や外部クリックを確認できます。</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-20">
        <h2 className="font-display text-4xl font-semibold sm:text-5xl">まずは、眺めてみる。</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-ink/65 dark:text-paper/65">現在はヴィンテージからWeb・AIまで、8ジャンルを掲載しています。</p>
        <Link href="/categories" className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white hover:bg-lagoon dark:bg-lagoon">カテゴリを眺める <ArrowRight className="size-4" /></Link>
      </section>
      <SiteFooter />
    </div>
  );
}
