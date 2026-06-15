import Link from "next/link";
import { ApplicationCard } from "@/components/mypage/application-card";
import {
  listMyPartnerApplications,
  partnerApplicationErrorMessage
} from "@/lib/queries/partner-applications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "出店申請状況 — Mania Market"
};

export default async function MypageApplicationsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user?.email) return null;

  const userEmail = userData.user.email;

  const { data: applications, error } = await listMyPartnerApplications(supabase, userEmail);
  const errorMessage = partnerApplicationErrorMessage(error);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-black">出店申請状況</h2>
        <Link href="/partner/apply" className="rounded-full border border-ink/15 px-4 py-2 text-sm font-bold hover:border-cinnabar">
          新規申請
        </Link>
      </div>

      {errorMessage ? (
        <p className="mt-6 rounded-xl border border-cinnabar/30 bg-cinnabar/8 p-6 text-sm leading-7">{errorMessage}</p>
      ) : null}

      {!errorMessage && applications.length === 0 ? (
        <p className="mt-6 rounded-xl border border-ink/10 bg-white/90 p-8 text-center text-sm text-ink/65 dark:border-paper/10 dark:bg-ink/60 dark:text-paper/65">
          出店申請はまだありません。
          <Link href="/partner/apply" className="ml-2 font-bold text-cinnabar hover:underline">
            申請する
          </Link>
        </p>
      ) : null}

      <div className="mt-6 grid gap-4">
        {applications.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            userEmail={userEmail}
            userId={userData.user.id}
          />
        ))}
      </div>
    </div>
  );
}