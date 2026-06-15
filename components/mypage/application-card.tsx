import Link from "next/link";
import { claimPartnerShop } from "@/app/actions";
import { PartnerApplicationStatusBadge } from "@/components/admin/partner-application-status";
import { canClaimPublishedShop } from "@/lib/partner-applications/claim";
import type { PartnerApplicationWithShop } from "@/lib/queries/partner-applications";

type ApplicationCardProps = {
  application: PartnerApplicationWithShop;
  userEmail: string;
  userId: string;
};

export function ApplicationCard({ application, userEmail, userId }: ApplicationCardProps) {
  const shop = Array.isArray(application.shops) ? application.shops[0] : application.shops;
  const canClaim = canClaimPublishedShop({
    applicationStatus: application.status,
    shopId: application.shop_id,
    shopOwnerId: shop?.owner_id,
    shopPendingOwnerEmail: shop?.pending_owner_email,
    userEmail
  });
  const isOwner = Boolean(shop?.owner_id && shop.owner_id === userId);

  return (
    <article className="rounded-2xl border border-ink/10 bg-white/90 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">{application.shop_name}</h2>
          <p className="mt-1 text-sm text-ink/60">申請日: {new Date(application.created_at).toLocaleString("ja-JP")}</p>
        </div>
        <PartnerApplicationStatusBadge status={application.status} />
      </div>

      {application.ai_score !== null ? (
        <div className="mt-4 rounded-xl border border-lagoon/20 bg-lagoon/8 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-lagoon">Mania Review AI</p>
          <p className="mt-1 text-lg font-bold">
            {application.ai_score}点 · {application.ai_recommendation}
          </p>
          {application.ai_comment ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink/70 dark:text-paper/70">
              {application.ai_comment}
            </p>
          ) : null}
        </div>
      ) : null}

      {application.review_note ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-ink/5 p-4 dark:bg-paper/5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/45">管理者メモ</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{application.review_note}</p>
        </div>
      ) : null}

      {shop ? (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link href={`/shops/${shop.slug}`} className="inline-flex text-sm font-bold text-cinnabar hover:text-lagoon">
            公開されたショップを見る →
          </Link>
          {isOwner ? (
            <Link href="/dashboard" className="inline-flex text-sm font-bold text-lagoon hover:text-cinnabar">
              ダッシュボードで管理する →
            </Link>
          ) : null}
        </div>
      ) : null}

      {canClaim && shop ? (
        <form action={claimPartnerShop} className="mt-4">
          <input type="hidden" name="application_id" value={application.id} />
          <input type="hidden" name="shop_id" value={application.shop_id ?? ""} />
          <p className="mb-3 text-sm text-ink/65 dark:text-paper/65">
            公開されたショップの管理権限を、ログイン中のメール（{userEmail}）で引き継げます。
          </p>
          <button
            type="submit"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-lagoon dark:bg-lagoon"
          >
            このショップを管理する
          </button>
        </form>
      ) : null}

      {application.status === "rejected" ? (
        <p className="mt-4 text-sm text-cinnabar">今回の申請は却下されました。内容を見直して再申請できます。</p>
      ) : null}
    </article>
  );
}