import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { PartnerApplicationsTable } from "@/components/admin/partner-applications-table";
import {
  listAllPartnerApplications,
  partnerApplicationErrorMessage
} from "@/lib/queries/partner-applications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "出店申請管理 — Mania Market Admin"
};

export default async function AdminPartnerApplicationsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return (
      <div className="px-4 py-10">
        <AuthCard next="/admin/partner-applications" />
      </div>
    );
  }

  const { data: user } = await supabase.from("users").select("role").eq("id", userData.user.id).single();

  if (user?.role !== "admin") {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-ink/10 bg-paper/95 p-6 shadow-sm">
          <h1 className="text-3xl font-black">管理者専用</h1>
          <p className="mt-3 text-ink/70">出店申請の管理には管理者権限が必要です。</p>
        </div>
      </section>
    );
  }

  const { data: applications, error } = await listAllPartnerApplications(supabase);
  const errorMessage = partnerApplicationErrorMessage(error);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold">出店申請管理</h1>
          <p className="mt-2 text-sm text-ink/60">申請 → AI審査 → 管理者確認 → 承認/却下 → 公開</p>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-lagoon hover:text-cinnabar">
          ← 管理トップ
        </Link>
      </div>

      {errorMessage ? (
        <p className="mt-8 rounded-2xl border border-cinnabar/30 bg-cinnabar/8 p-6 text-sm leading-7">{errorMessage}</p>
      ) : null}

      {!errorMessage && applications.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-ink/10 bg-white/80 p-8 text-center text-sm text-ink/60 dark:bg-ink/50">
          申請はまだありません。
        </p>
      ) : null}

      {!errorMessage && applications.length > 0 ? (
        <div className="mt-8">
          <PartnerApplicationsTable applications={applications} />
        </div>
      ) : null}
    </section>
  );
}
