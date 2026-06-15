import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  Compass,
  FileText,
  Globe,
  Shield,
  Sparkles,
  Store
} from "lucide-react";
import { SellerGuideHero } from "@/components/seller-guide/seller-guide-hero";
import { SellerGuidePlans } from "@/components/seller-guide/seller-guide-plans";
import { SellerGuideSection } from "@/components/seller-guide/seller-guide-section";
import { SiteFooter } from "@/components/site-footer";
import {
  SELLER_PROHIBITED,
  SELLER_REQUIREMENTS,
  SELLER_STEPS,
  TERMS_SUMMARY
} from "@/lib/seller-guide-content";

export const metadata = {
  title: "出店ガイド — Mania Market",
  description: "Mania Market への出店方法・条件・プラン・利用規約の要約。マニア専門店の出店を安心して始められます。"
};

export default function SellerGuidePage() {
  return (
    <div className="bg-paper dark:bg-ink">
      <SellerGuideHero />

      <SellerGuideSection
        label="About"
        title="Mania Market とは"
        description="欲しいものを探す場所ではなく、知らなかった専門店と出会うための発見プラットフォームです。"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Compass,
              title: "発見に特化",
              body: "ジャンル・ショップ・商品を眺めながら、偶然の出会いを生む導線を大切にしています。"
            },
            {
              icon: Store,
              title: "マニア専門店の場",
              body: "ヴィンテージカメラ、レトロゲーム、アナログ音楽など、熱量の高い専門店が集まります。"
            },
            {
              icon: Globe,
              title: "購入は外部サイト",
              body: "Mania Market では決済しません。気になったら各ショップの公式サイトへ。発見とキュレーションに集中します。"
            }
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/50"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-lagoon/15 text-lagoon">
                <item.icon className="size-5" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-ink/65 dark:text-paper/65">{item.body}</p>
            </article>
          ))}
        </div>
      </SellerGuideSection>

      <SellerGuideSection
        label="Requirements"
        title="出店条件"
        description="以下を満たすショップの出店を歓迎します。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {SELLER_REQUIREMENTS.map((item) => (
            <article
              key={item.title}
              className="flex gap-4 rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/50"
            >
              <CheckCircle2 className="size-6 shrink-0 text-moss" />
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-ink/65 dark:text-paper/65">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </SellerGuideSection>

      <SellerGuideSection
        label="Prohibited"
        title="出店できないもの"
        description="以下に該当する場合、掲載をお断りする、または非公開とする場合があります。"
        className="bg-cinnabar/5 dark:bg-cinnabar/10"
      >
        <div className="rounded-3xl border border-cinnabar/20 bg-white/80 p-6 dark:border-cinnabar/30 dark:bg-ink/50 sm:p-8">
          <div className="flex items-center gap-2 text-cinnabar">
            <Ban className="size-5" />
            <p className="text-sm font-bold">掲載不可の例</p>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {SELLER_PROHIBITED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm leading-7 text-ink/75 dark:text-paper/75">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-cinnabar/80" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </SellerGuideSection>

      <SellerGuideSection
        label="Flow"
        title="出店の流れ"
        description="5つのステップで、無料から始められます。"
        dark
      >
        <ol className="grid gap-4 md:grid-cols-5">
          {SELLER_STEPS.map((step) => (
            <li
              key={step.step}
              className="rounded-2xl border border-paper/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-paper/45">{step.step}</p>
              <h3 className="mt-3 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-paper/70">{step.description}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 text-center">
          <Link
            href="/partner/apply" className="inline-flex items-center gap-2 rounded-full bg-cinnabar px-6 py-3.5 text-sm font-bold text-white transition hover:bg-paper hover:text-ink">出店申請する
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </SellerGuideSection>

      <SellerGuideSection label="Plans" title="プラン一覧" description="まずは無料プランから。成長に合わせてアップグレードできます。">
        <SellerGuidePlans />
      </SellerGuideSection>

      <SellerGuideSection
        label="Concierge"
        title="Mania Concierge"
        description="出店者向け AI 秘書。ショップの完成度診断、文章生成、今日のタスクをサポートします。"
      >
        <div className="grid items-center gap-8 rounded-3xl border border-ink/10 bg-gradient-to-br from-lagoon/10 via-white to-moss/10 p-8 shadow-sm dark:border-paper/10 dark:from-lagoon/20 dark:via-ink/50 dark:to-moss/15 sm:p-10 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-cinnabar/15 text-cinnabar">
              <Sparkles className="size-6" />
            </div>
            <h3 className="mt-5 font-display text-3xl font-semibold">あなたの出店パートナー</h3>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-ink/70 dark:text-paper/70">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-moss" /> ショップ完成度スコア（0〜100%）
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-moss" /> ショップ紹介文・商品説明・SNS投稿の下書き生成
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-moss" /> 今日やること・マーケティング提案
              </li>
            </ul>
            <p className="mt-4 text-xs text-ink/50 dark:text-paper/50">ログイン後、ダッシュボードから利用できます。</p>
          </div>
          <Link
            href="/dashboard/concierge"
            className="inline-flex h-fit items-center gap-2 self-start rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white transition hover:bg-lagoon dark:bg-lagoon lg:self-center"
          >
            Concierge を開く
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </SellerGuideSection>

      <SellerGuideSection
        label="Terms"
        title="利用規約（要約）"
        description="正式な利用規約の要点です。出店前にご確認ください。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {TERMS_SUMMARY.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/50"
            >
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-lagoon" />
                <h3 className="font-semibold">{item.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-ink/65 dark:text-paper/65">{item.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-ink/10 bg-ink/5 p-5 dark:border-paper/10 dark:bg-paper/5">
          <Shield className="size-5 shrink-0 text-lagoon" />
          <p className="text-sm leading-7 text-ink/65 dark:text-paper/65">
            本ページは要約です。出店により、掲載内容の正確性・法令遵守・外部サイトでの取引に関する責任は出店者に帰属します。
          </p>
        </div>
      </SellerGuideSection>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-4 sm:pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-gradient-to-br from-lagoon via-lagoon to-moss p-8 text-white shadow-editorial sm:p-12">
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Ready?</p>
            <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">さあ、あなたの専門店を。</h2>
            <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
              無料プランから今すぐ始められます。わからないことは Mania Concierge に相談してください。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/partner/apply" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-ink transition hover:bg-paper"><Store className="size-4" />出店申請する
              </Link>
              <Link
                href="/login?next=/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                ログイン
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}