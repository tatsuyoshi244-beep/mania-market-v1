import Link from "next/link";
import {
  approvePartnerApplication,
  publishPartnerApplication,
  rejectPartnerApplication,
  savePartnerApplicationReviewNote,
  setPartnerApplicationReviewing
} from "@/app/actions";
import { PartnerApplicationStatusBadge } from "@/components/admin/partner-application-status";
import type { PartnerApplication } from "@/types/database";

type PartnerApplicationsTableProps = {
  applications: PartnerApplication[];
};

export function PartnerApplicationsTable({ applications }: PartnerApplicationsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm dark:border-paper/10 dark:bg-ink/50">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="border-b border-ink/10 bg-ink/5 text-xs uppercase tracking-wider text-ink/55 dark:border-paper/10 dark:bg-paper/5">
          <tr>
            <th className="px-4 py-3 font-bold">ショップ名</th>
            <th className="px-4 py-3 font-bold">申請者</th>
            <th className="px-4 py-3 font-bold">メール</th>
            <th className="px-4 py-3 font-bold">カテゴリ</th>
            <th className="px-4 py-3 font-bold">status</th>
            <th className="px-4 py-3 font-bold">AI</th>
            <th className="px-4 py-3 font-bold">申請日</th>
            <th className="px-4 py-3 font-bold">メモ</th>
            <th className="px-4 py-3 font-bold">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/8 dark:divide-paper/10">
          {applications.map((application) => (
            <tr key={application.id} className="align-top">
              <td className="px-4 py-4 font-semibold">{application.shop_name}</td>
              <td className="px-4 py-4">{application.owner_name}</td>
              <td className="px-4 py-4 text-xs text-ink/70">{application.email}</td>
              <td className="px-4 py-4">
                <div className="flex max-w-[180px] flex-wrap gap-1">
                  {application.categories.map((category) => (
                    <span key={category} className="rounded-full border border-ink/10 px-2 py-0.5 text-[10px]">
                      {category}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-4">
                <PartnerApplicationStatusBadge status={application.status} />
              </td>
              <td className="px-4 py-4 text-xs">
                {application.ai_score !== null ? (
                  <div>
                    <p className="font-bold text-lagoon">{application.ai_score}点</p>
                    <p className="text-ink/55">{application.ai_recommendation}</p>
                  </div>
                ) : (
                  <span className="text-ink/40">—</span>
                )}
              </td>
              <td className="px-4 py-4 text-xs text-ink/60">
                {new Date(application.created_at).toLocaleString("ja-JP")}
              </td>
              <td className="px-4 py-4">
                <form className="flex min-w-[160px] flex-col gap-1">
                  <input type="hidden" name="application_id" value={application.id} />
                  <textarea
                    name="review_note"
                    rows={2}
                    defaultValue={application.review_note ?? ""}
                    className="w-full rounded-lg border border-ink/12 bg-white px-2 py-1 text-xs dark:border-paper/15 dark:bg-ink/60"
                    placeholder="管理者メモ"
                  />
                  <button
                    formAction={savePartnerApplicationReviewNote}
                    type="submit"
                    className="rounded-full border border-ink/15 px-2 py-1 text-[10px] font-bold hover:border-lagoon"
                  >
                    保存
                  </button>
                </form>
              </td>
              <td className="px-4 py-4">
                <div className="flex min-w-[200px] flex-col gap-2">
                  <Link
                    href={`/admin/partner-applications/${application.id}`}
                    className="inline-flex w-fit rounded-full border border-ink/12 px-3 py-1 text-xs font-bold hover:border-cinnabar"
                  >
                    詳細を見る
                  </Link>
                  <div className="flex flex-wrap gap-1">
                    {application.status === "pending" ? (
                      <form action={setPartnerApplicationReviewing}>
                        <input type="hidden" name="application_id" value={application.id} />
                        <button type="submit" className="rounded-full bg-lagoon/10 px-2 py-1 text-[10px] font-bold text-lagoon">
                          reviewing
                        </button>
                      </form>
                    ) : null}
                    {application.status === "pending" || application.status === "reviewing" ? (
                      <>
                        <form action={approvePartnerApplication}>
                          <input type="hidden" name="application_id" value={application.id} />
                          <button type="submit" className="rounded-full bg-moss/15 px-2 py-1 text-[10px] font-bold text-moss">
                            approved
                          </button>
                        </form>
                        <form action={rejectPartnerApplication}>
                          <input type="hidden" name="application_id" value={application.id} />
                          <button type="submit" className="rounded-full bg-cinnabar/10 px-2 py-1 text-[10px] font-bold text-cinnabar">
                            rejected
                          </button>
                        </form>
                      </>
                    ) : null}
                    {application.status === "approved" && !application.shop_id ? (
                      <form action={publishPartnerApplication}>
                        <input type="hidden" name="application_id" value={application.id} />
                        <button type="submit" className="rounded-full bg-ink px-2 py-1 text-[10px] font-bold text-white dark:bg-lagoon">
                          published
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}