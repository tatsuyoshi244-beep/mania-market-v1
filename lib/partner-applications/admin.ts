import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function requireAdminUser(supabase: SupabaseClient<Database>, userId: string) {
  const { data: user, error } = await supabase.from("users").select("role").eq("id", userId).single();
  if (error || user?.role !== "admin") {
    throw new Error("管理者権限が必要です。");
  }
  return user;
}

export async function getPartnerApplicationById(
  supabase: SupabaseClient<Database>,
  id: string
) {
  const { data, error } = await supabase.from("partner_applications").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data;
}