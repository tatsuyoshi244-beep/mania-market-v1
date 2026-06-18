import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { BillingPlanCards } from "@/components/billing/billing-plan-cards";
import { BillingPortalButton } from "@/components/billing/portal-button";
import { BillingSummaryCard } from "@/components/billing/billing-summary";
import { getBillingSummary } from "@/lib/billing/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "プラン・請求 — Mania Market"
};

type BillingPageProps = {
  searchParams: Promise<{ success?: string; canceled?: string; error?: string }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return (
      <div className="px-4 py-10">
        <AuthCard next="/dashboard/billing" />
      </div>
    );
  }

  const summary = await getBillingSummary(supabase, userData.user.id);
  const params = await searchParams;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black">プラン・請求</h1>
          <p className="mt-2 text-ink/65">サブスクリプションの確認とプラン変更</p>
        </div>
        <Link href="/dashboard" className="text-sm font-semibold text-lagoon hover:text-cinnabar">
          ← ダッシュボード
        </Link>
      </div>

      {params.success ? (
        <p className="mt-6 rounded-xl border border-moss/30 bg-moss/10 px-4 py-3 text-sm font-semibold text-moss">
          お支払い手続きが完了しました。反映まで数秒かかる場合があります。
        </p>
      ) : null}
      {params.canceled ? (
        <p className="mt-6 rounded-xl border border-ink/15 bg-paper/80 px-4 py-3 text-sm text-ink/70">
          お支払い手続きはキャンセルされました。
        </p>
      ) : null}
      {params.error ? (
        <p className="mt-6 rounded-xl border border-cinnabar/30 bg-cinnabar/8 px-4 py-3 text-sm text-cinnabar">
          {decodeURIComponent(params.error)}
        </p>
      ) : null}

      <div className="mt-8">
        <BillingSummaryCard summary={summary} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {summary.stripeCustomerId ? <BillingPortalButton /> : null}
        <p className="text-xs text-ink/50">テストカード: 4242 4242 4242 4242（本番前確認用）</p>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-black">プラン変更</h2>
        <p className="mt-2 text-sm text-ink/60">
          有料プラン登録済みの場合、プラン変更・解約・支払い方法の変更は請求管理から行えます。
        </p>
        <div className="mt-6">
          <BillingPlanCards currentPlan={summary.planKey} hasStripeCustomer={Boolean(summary.stripeCustomerId)} />
        </div>
      </div>
    </section>
  );
}