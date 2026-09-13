"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { getAuthUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit/log";
import { queryRows } from "@/lib/neon/db";
import { requireAdminUser } from "@/lib/partner-applications/admin";
import { getRequestClientContext } from "@/lib/security/client-context";
import type { PartnerLeadActivityType, PartnerLeadStatus } from "@/types/database";

const STATUSES = new Set<PartnerLeadStatus>([
  "candidate", "ready", "contacted", "replied", "explaining", "applied", "published", "paused", "declined"
]);
const ACTIVITIES = new Set<PartnerLeadActivityType>(["note", "email", "instagram", "x", "phone", "meeting", "status_change"]);

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function required(formData: FormData, key: string) {
  const result = value(formData, key);
  if (!result) throw new Error(`${key}を入力してください。`);
  return result;
}

function uuid(formData: FormData, key: string) {
  const result = required(formData, key);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result)) {
    throw new Error("IDが不正です。");
  }
  return result;
}

function optionalUrl(formData: FormData, key: string) {
  const raw = value(formData, key);
  if (!raw) return null;
  const parsed = new URL(raw);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error("URLを正しく入力してください。");
  }
  return parsed.toString();
}

function optionalDate(formData: FormData, key: string) {
  const raw = value(formData, key);
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) throw new Error("日時が不正です。");
  return parsed.toISOString();
}

async function adminContext() {
  const user = await getAuthUser();
  if (!user) throw new Error("ログインが必要です。");
  await requireAdminUser(user.id);
  return { user, ctx: await getRequestClientContext() };
}

export async function createPartnerLead(formData: FormData) {
  const { user, ctx } = await adminContext();
  const shopName = required(formData, "shop_name");
  const priority = Number(value(formData, "priority") ?? 2);
  if (![1, 2, 3].includes(priority)) throw new Error("優先度が不正です。");

  const rows = await queryRows<{ id: string }>(
    `insert into public.partner_leads
      (shop_name,contact_name,email,category,region,website_url,instagram_url,x_url,source,priority,notes,next_action_at,created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id::text`,
    [
      shopName, value(formData, "contact_name"), value(formData, "email")?.toLowerCase() ?? null,
      value(formData, "category"), value(formData, "region"), optionalUrl(formData, "website_url"),
      optionalUrl(formData, "instagram_url"), optionalUrl(formData, "x_url"), value(formData, "source") ?? "manual",
      priority, value(formData, "notes"), optionalDate(formData, "next_action_at"), user.id
    ]
  );
  const id = rows[0]?.id;
  if (!id) throw new Error("営業候補を保存できませんでした。");
  await writeAuditLog({
    userId: user.id, action: "admin_create_partner_lead", targetType: "partner_lead", targetId: id,
    metadata: { priority, source: value(formData, "source") ?? "manual" }, ipHash: ctx.ipHash, userAgentHash: ctx.userAgentHash
  });
  redirect(`/admin/partner-leads/${id}` as Route);
}

export async function updatePartnerLead(formData: FormData) {
  const { user, ctx } = await adminContext();
  const id = uuid(formData, "lead_id");
  const status = required(formData, "status") as PartnerLeadStatus;
  const priority = Number(value(formData, "priority") ?? 2);
  if (!STATUSES.has(status) || ![1, 2, 3].includes(priority)) throw new Error("更新内容が不正です。");

  await queryRows(
    `update public.partner_leads set
       shop_name=$1,contact_name=$2,email=$3,category=$4,region=$5,website_url=$6,instagram_url=$7,x_url=$8,
       source=$9,status=$10,priority=$11,notes=$12,next_action_at=$13,
       last_contacted_at=case when $10='contacted' and status<>'contacted' then now() else last_contacted_at end,
       updated_at=now()
     where id=$14 returning id`,
    [
      required(formData, "shop_name"), value(formData, "contact_name"), value(formData, "email")?.toLowerCase() ?? null,
      value(formData, "category"), value(formData, "region"), optionalUrl(formData, "website_url"), optionalUrl(formData, "instagram_url"),
      optionalUrl(formData, "x_url"), value(formData, "source") ?? "manual", status, priority,
      value(formData, "notes"), optionalDate(formData, "next_action_at"), id
    ]
  );
  await writeAuditLog({
    userId: user.id, action: "admin_update_partner_lead", targetType: "partner_lead", targetId: id,
    metadata: { status, priority }, ipHash: ctx.ipHash, userAgentHash: ctx.userAgentHash
  });
  revalidatePath("/admin/partner-leads");
  revalidatePath(`/admin/partner-leads/${id}`);
}

export async function addPartnerLeadActivity(formData: FormData) {
  const { user, ctx } = await adminContext();
  const id = uuid(formData, "lead_id");
  const activityType = required(formData, "activity_type") as PartnerLeadActivityType;
  const note = required(formData, "note");
  if (!ACTIVITIES.has(activityType)) throw new Error("活動種別が不正です。");

  await queryRows(
    `insert into public.partner_lead_activities (lead_id,activity_type,note,created_by)
     values ($1,$2,$3,$4) returning id`,
    [id, activityType, note, user.id]
  );
  if (["email", "instagram", "x", "phone", "meeting"].includes(activityType)) {
    await queryRows(
      `update public.partner_leads set last_contacted_at=now(),status=case when status in ('candidate','ready') then 'contacted' else status end,updated_at=now() where id=$1`,
      [id]
    );
  }
  await writeAuditLog({
    userId: user.id, action: "admin_add_partner_lead_activity", targetType: "partner_lead", targetId: id,
    metadata: { activity_type: activityType }, ipHash: ctx.ipHash, userAgentHash: ctx.userAgentHash
  });
  revalidatePath("/admin/partner-leads");
  revalidatePath(`/admin/partner-leads/${id}`);
}
