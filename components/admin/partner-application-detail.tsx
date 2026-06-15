import Link from "next/link";
import {
  approvePartnerApplication,
  adminForceAssignShopOwner,
  publishPartnerApplication,
  rejectPartnerApplication,
  savePartnerApplicationReviewNote,
  setPartnerApplicationReviewing
} from "@/app/actions";
import { PartnerApplicationAiReview } from "@/components/admin/partner-application-ai-review";
import { PartnerApplicationStatusBadge } from "@/components/admin/partner-application-status";
import type { PartnerApplication } from "@/types/database";

type PartnerApplicationDetailProps = {
  application: PartnerApplication;
  shopSlug?: string | null;
  shopOwnerId?: string | null;
  shopPendingOwnerEmail?: string | null;
};

function DetailField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-ink/45">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm leading-7 text-ink/80 dark:text-paper/80">{value}</dd>
    </div>
  );
}

export function PartnerApplicationDetail({
  application,
  shopSlug,
  shopOwnerId,
  shopPendingOwnerEmail
}: PartnerApplicationDetailProps) {
  const canReview = application.status === "pending" || application.status === "reviewing";
  const canPublish = application.status === "approved" && !application.shop_id;
  const canForceAssign =
    application.status === "published" && application.shop_id && !shopOwnerId;

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-ink/10 bg-white/80 p-6 dark:border-paper/10 dark:bg-ink/50 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold">{application.shop_name}</h1>
          <PartnerApplicationStatusBadge status={application.status} />
        </div>
        <p className="mt-3 text-sm text-ink/65">
          {application.owner_name} · {application.email}
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <DetailField label="活動地域" value={application.region} />
          <DetailField label="届けたい相手" value={application.target_user} />
          <DetailField label="公式サイト" value={application.website_url} />
          <DetailField label="Instagram" value={application.instagram_url} />
          <DetailField label="X" value={application.x_url} />
        </dl>
        <div className="mt-6 grid gap-4">
          <DetailField label="ショップ説明" value={application.description} />
          <DetailField label="想い" value={application.mission} />
        </div>
        {application.categories.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {application.categories.map((category) => (
              <span key={category} className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold">
                {category}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-6 grid gap-2 text-xs text-ink/50 sm:grid-cols-2">
          <p>申請: {new Date(application.created_at).toLocaleString("ja-JP")}</p>
          {application.reviewed_at ? <p>審査: {new Date(application.reviewed_at).toLocaleString("ja-JP")}</p> : null}
          {application.approved_at ? <p>承認: {new Date(application.approved_at).toLocaleString("ja-JP")}</p> : null}
          {application.published_at ? <p>公開: {new Date(application.published_at).toLocaleString("ja-JP")}</p> : null}
        </div>
        {shopSlug ? (
          <p className="mt-4">
            <Link href={`/shops/${shopSlug}`} className="text-sm font-bold text-lagoon hover:text-cinnabar">
              公開ショップを見る →
            </Link>
          </p>
        ) : null}
      </header>

      <PartnerApplicationAiReview application={application} />

      <section className="rounded-3xl border border-ink/10 bg-white/80 p-6 dark:border-paper/10 dark:bg-ink/50">
        <h2 className="font-display text-2xl font-semibold">管理者メモ</h2>
        <p className="mt-2 text-sm text-ink/60">申請者のマイページにも表示されます（メール通知はしません）。</p>

        <form className="mt-5 grid gap-4">
          <input type="hidden" name="application_id" value={application.id} />
          <label className="grid gap-1.5 text-sm font-medium">
            審査メモ
            <textarea
              name="review_note"
              rows={4}
              defaultValue={application.review_note ?? ""}
              className="rounded-xl border border-ink/12 bg-white px-3 py-2 dark:border-paper/15 dark:bg-ink/60"
              placeholder="申請者への連絡事項・内部メモ"
            />
          </label>
          <button
            formAction={savePartnerApplicationReviewNote}
            type="submit"
            className="w-fit rounded-full border border-ink/15 px-5 py-2 text-sm font-bold hover:border-lagoon"
          >
            メモを保存
          </button>
        </form>
      </section>

      {canReview ? (
        <section className="rounded-3xl border border-ink/10 bg-white/80 p-6 dark:border-paper/10 dark:bg-ink/50">
          <h2 className="font-display text-2xl font-semibold">審査操作</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {application.status === "pending" ? (
              <form action={setPartnerApplicationReviewing} className="inline">
                <input type="hidden" name="application_id" value={application.id} />
                <input type="hidden" name="review_note" value={application.review_note ?? ""} />
                <button type="submit" className="rounded-full border border-lagoon/30 bg-lagoon/10 px-4 py-2 text-sm font-bold text-lagoon">
                  審査中（reviewing）
                </button>
              </form>
            ) : null}
            <form action={approvePartnerApplication} className="inline">
              <input type="hidden" name="application_id" value={application.id} />
              <input type="hidden" name="review_note" value={application.review_note ?? ""} />
              <button type="submit" className="rounded-full bg-moss px-4 py-2 text-sm font-bold text-white">
                承認する（approved）
              </button>
            </form>
            <form action={rejectPartnerApplication} className="inline">
              <input type="hidden" name="application_id" value={application.id} />
              <input type="hidden" name="review_note" value={application.review_note ?? ""} />
              <button type="submit" className="rounded-full border border-cinnabar/30 bg-cinnabar/10 px-4 py-2 text-sm font-bold text-cinnabar">
                却下する（rejected）
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {canPublish ? (
        <section className="rounded-3xl border border-cinnabar/25 bg-cinnabar/8 p-6">
          <h2 className="font-display text-2xl font-semibold">公開処理</h2>
          <p className="mt-2 text-sm leading-7 text-ink/70 dark:text-paper/70">
            承認済みの申請から shops レコードを作成し、status を published に更新します。
          </p>
          <form action={publishPartnerApplication} className="mt-4">
            <input type="hidden" name="application_id" value={application.id} />
            <button
              type="submit"
              className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-lagoon dark:bg-lagoon"
            >
              ショップとして公開する（published）
            </button>
          </form>
        </section>
      ) : null}

      {canForceAssign ? (
        <section className="rounded-3xl border border-lagoon/25 bg-lagoon/8 p-6">
          <h2 className="font-display text-2xl font-semibold">オーナー強制紐付け</h2>
          <p className="mt-2 text-sm leading-7 text-ink/70 dark:text-paper/70">
            オーナー未設定の公開ショップを、登録済みユーザーに紐付けます。
            {shopPendingOwnerEmail ? (
              <span className="mt-1 block">待機中メール: {shopPendingOwnerEmail}</span>
            ) : null}
          </p>
          <form action={adminForceAssignShopOwner} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="application_id" value={application.id} />
            <label className="grid gap-1 text-sm font-medium">
              紐付け先メール
              <input
                name="target_email"
                type="email"
                required
                defaultValue={application.email}
                className="min-w-[240px] rounded-xl border border-ink/12 bg-white px-3 py-2 dark:border-paper/15 dark:bg-ink/60"
              />
            </label>
            <button
              type="submit"
              className="rounded-full border border-lagoon/30 bg-white px-5 py-2.5 text-sm font-bold text-lagoon hover:border-lagoon dark:bg-ink/60"
            >
              強制紐付け
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
