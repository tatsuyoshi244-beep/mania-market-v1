import type { Database } from "@/types/database";
import { queryOne } from "@/lib/neon/db";

type PartnerApplication = Database["public"]["Tables"]["partner_applications"]["Row"];

export async function requireAdminUser(_client: unknown, userId: string) {
  const user = await queryOne<{ id: string; role: string }>(
    "select id, role from public.users where id = $1 limit 1",
    [userId]
  );
  if (user?.role !== "admin") throw new Error("管理者権限が必要です。");
  return user;
}

export async function getPartnerApplicationById(_client: unknown, id: string) {
  return queryOne<PartnerApplication>(
    "select * from public.partner_applications where id = $1 limit 1",
    [id]
  );
}
