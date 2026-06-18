import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { logServerError } from "@/lib/security/safe-log";

export type AuditAction =
  | "admin_approve_application"
  | "admin_reject_application"
  | "admin_publish_shop"
  | "seller_create_product"
  | "seller_update_product"
  | "seller_delete_product"
  | "seller_claim_shop"
  | "application_submit";

type WriteAuditLogInput = {
  userId?: string | null;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, Json>;
  ipHash?: string | null;
  userAgentHash?: string | null;
};

const FORBIDDEN_METADATA_KEYS = new Set([
  "email",
  "owner_name",
  "description",
  "mission",
  "review_note",
  "ai_comment",
  "website_url",
  "instagram_url",
  "x_url",
  "external_url",
  "image_url",
  "name",
  "shop_name"
]);

export function sanitizeAuditMetadata(metadata: Record<string, Json> = {}) {
  const safe: Record<string, Json> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_METADATA_KEYS.has(key)) continue;
    if (typeof value === "string" && value.length > 120) continue;
    safe[key] = value;
  }
  return safe;
}

export async function writeAuditLog(
  service: SupabaseClient<Database>,
  input: WriteAuditLogInput
) {
  const { error } = await service.from("audit_logs").insert({
    user_id: input.userId ?? null,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    metadata: sanitizeAuditMetadata(input.metadata),
    ip_hash: input.ipHash ?? null,
    user_agent_hash: input.userAgentHash ?? null
  });

  if (error) {
    logServerError("writeAuditLog", error);
  }
}

export function summarizeAuditMetadata(metadata: Record<string, Json> | null) {
  if (!metadata || Object.keys(metadata).length === 0) return "—";
  return Object.entries(metadata)
    .slice(0, 4)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(", ");
}