import "server-only";

import type { Database, PartnerLeadStatus } from "@/types/database";
import { queryOne, queryRows } from "@/lib/neon/db";

export type PartnerLead = Database["public"]["Tables"]["partner_leads"]["Row"];
export type PartnerLeadActivity = Database["public"]["Tables"]["partner_lead_activities"]["Row"];

export const PARTNER_LEAD_STATUS: Array<{ value: PartnerLeadStatus; label: string }> = [
  { value: "candidate", label: "候補" },
  { value: "ready", label: "連絡準備" },
  { value: "contacted", label: "連絡済み" },
  { value: "replied", label: "返信あり" },
  { value: "explaining", label: "掲載説明中" },
  { value: "applied", label: "申請済み" },
  { value: "published", label: "掲載済み" },
  { value: "paused", label: "保留" },
  { value: "declined", label: "見送り" }
];

export const PARTNER_LEAD_ACTIVITY = [
  { value: "note", label: "メモ" },
  { value: "email", label: "メール" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X" },
  { value: "phone", label: "電話" },
  { value: "meeting", label: "打ち合わせ" }
] as const;

export function partnerLeadStatusLabel(status: PartnerLeadStatus) {
  return PARTNER_LEAD_STATUS.find((item) => item.value === status)?.label ?? status;
}

export async function listPartnerLeads(status?: PartnerLeadStatus | null) {
  return queryRows<PartnerLead>(
    `select id::text,invite_token::text,shop_name,contact_name,email,category,region,website_url,
            instagram_url,x_url,source,status,priority,notes,next_action_at::text,last_contacted_at::text,
            application_id::text,published_shop_id::text,created_by,created_at::text,updated_at::text
       from public.partner_leads
      where ($1::text is null or status=$1)
      order by
        case when next_action_at is not null and next_action_at <= now() then 0 else 1 end,
        priority desc, next_action_at nulls last, updated_at desc
      limit 300`,
    [status ?? null]
  );
}

export async function getPartnerLead(id: string) {
  return queryOne<PartnerLead>(
    `select id::text,invite_token::text,shop_name,contact_name,email,category,region,website_url,
            instagram_url,x_url,source,status,priority,notes,next_action_at::text,last_contacted_at::text,
            application_id::text,published_shop_id::text,created_by,created_at::text,updated_at::text
       from public.partner_leads where id=$1 limit 1`,
    [id]
  );
}

export async function listPartnerLeadActivities(leadId: string) {
  return queryRows<PartnerLeadActivity>(
    `select id::text,lead_id::text,activity_type,note,created_by,created_at::text
       from public.partner_lead_activities where lead_id=$1 order by created_at desc limit 100`,
    [leadId]
  );
}

export async function getPartnerLeadSummary() {
  const rows = await queryRows<{ status: PartnerLeadStatus; count: number }>(
    `select status,count(*)::int as count from public.partner_leads group by status`
  );
  return new Map(rows.map((row) => [row.status, Number(row.count)]));
}
