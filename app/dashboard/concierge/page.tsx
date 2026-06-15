import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AuthCard } from "@/components/auth-card";
import { ConciergeFaq } from "@/components/concierge/concierge-faq";
import { ConciergeGeneratePanel } from "@/components/concierge/concierge-generate-panel";
import { ConciergeSidebar } from "@/components/concierge/concierge-sidebar";
import { loadConciergePayload } from "@/lib/concierge/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ConciergePage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return (
      <div className="px-4 py-10">
        <AuthCard next="/dashboard/concierge" title="Mania Concierge" description="ログインして AI 秘書を利用してください。" />
      </div>
    );
  }

  const payload = await loadConciergePayload(supabase, userData.user.id);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-6">
          <header>
            <p className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-ink/60 dark:border-paper/15 dark:bg-ink/50">
              <Sparkles className="size-3.5 text-cinnabar" />
              MANIA CONCIERGE
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">出店者向け AI 秘書</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/65 dark:text-paper/65">
              ショップの完成度診断、今日のタスク、文章生成、マーケティング提案をひとつに。
              Ver.1 はルールベースで動作し、将来 LLM に接続できる設計です。
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link href="/dashboard" className="rounded-full border border-ink/12 px-4 py-2 font-semibold hover:border-cinnabar">
                ショップ設定
              </Link>
              <Link href="/dashboard/products" className="rounded-full border border-ink/12 px-4 py-2 font-semibold hover:border-cinnabar">
                商品管理
              </Link>
            </div>
          </header>

          {!payload.context.shop ? (
            <div className="rounded-2xl border border-cinnabar/30 bg-cinnabar/8 p-5 text-sm">
              まずショップを作成してください。
              <Link href="/dashboard" className="ml-2 font-bold text-cinnabar underline">
                ショップ登録へ
              </Link>
            </div>
          ) : null}

          <ConciergeFaq />
          <ConciergeGeneratePanel products={payload.context.products} />
        </div>

        <ConciergeSidebar
          diagnosis={payload.diagnosis}
          actions={payload.actions}
          marketing={payload.marketing}
        />
      </div>
    </section>
  );
}