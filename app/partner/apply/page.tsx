import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";
import { PartnerApplyForm } from "@/components/partner/partner-apply-form";
import { listCategories } from "@/lib/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "出店申請 — Mania Market",
  description: "Mania Market への出店申請フォーム"
};

export default async function PartnerApplyPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: userData }, categories] = await Promise.all([
    supabase.auth.getUser(),
    listCategories(supabase)
  ]);

  return (
    <div className="bg-paper dark:bg-ink">
      <section className="relative overflow-hidden border-b border-ink/10 dark:border-paper/10">
        <div className="lp-mesh absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-10 sm:pb-16 sm:pt-14">
          <Link href="/seller-guide" className="inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-cinnabar dark:text-paper/60">
            <ArrowLeft className="size-4" />
            出店ガイドに戻る
          </Link>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/55 px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] text-ink/65 backdrop-blur dark:border-paper/15 dark:bg-ink/45">
            <Store className="size-3.5 text-cinnabar" />
            PARTNER APPLY
          </p>
          <h1 className="mt-5 font-display text-4xl font-semibold sm:text-5xl">出店申請</h1>
          <p className="mt-4 text-sm leading-7 text-ink/65 dark:text-paper/65">
            審査後、メールにてご連絡します。購入・決済は各ショップの外部サイトで行われます。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/50 sm:p-8">
          <PartnerApplyForm categories={categories} defaultEmail={userData.user?.email} />
        </div>
      </section>
    </div>
  );
}