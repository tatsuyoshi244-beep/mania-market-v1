import type { PartnerApplication } from "@/types/database";

export const STATUS_LABEL: Record<PartnerApplication["status"], string> = {
  pending: "受付",
  reviewing: "審査中",
  approved: "承認済",
  rejected: "却下",
  published: "公開済"
};

export const STATUS_CLASS: Record<PartnerApplication["status"], string> = {
  pending: "bg-ink/10 text-ink/70 dark:text-paper/70",
  reviewing: "bg-lagoon/15 text-lagoon",
  approved: "bg-moss/15 text-moss",
  rejected: "bg-cinnabar/15 text-cinnabar",
  published: "bg-cinnabar/10 text-cinnabar"
};

export function PartnerApplicationStatusBadge({ status }: { status: PartnerApplication["status"] }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}