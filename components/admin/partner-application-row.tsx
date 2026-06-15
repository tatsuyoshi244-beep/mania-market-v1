import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PartnerApplicationStatusBadge } from "@/components/admin/partner-application-status";
import type { PartnerApplication } from "@/types/database";

type PartnerApplicationRowProps = {
  application: PartnerApplication;
};

export function PartnerApplicationRow({ application }: PartnerApplicationRowProps) {
  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm dark:border-paper/10 dark:bg-ink/50">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-semibold">{application.shop_name}</h2>
            <PartnerApplicationStatusBadge status={application.status} />
          </div>
          <p className="mt-2 text-sm text-ink/65 dark:text-paper/65">
            {application.owner_name} / {application.email}
          </p>
          <p className="mt-1 text-xs text-ink/50">
            申請日: {new Date(application.created_at).toLocaleString("ja-JP")}
          </p>
          {application.ai_score !== null && application.ai_recommendation ? (
            <p className="mt-2 text-xs font-semibold text-lagoon">
              AI {application.ai_score}点 · {application.ai_recommendation}
            </p>
          ) : null}
          {application.categories.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {application.categories.map((category) => (
                <span key={category} className="rounded-full border border-ink/10 px-2 py-0.5 text-[11px] font-semibold">
                  {category}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <Link
          href={`/admin/partner-applications/${application.id}`}
          className="inline-flex items-center gap-1 rounded-full border border-ink/12 px-4 py-2 text-xs font-bold hover:border-cinnabar"
        >
          詳細
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}