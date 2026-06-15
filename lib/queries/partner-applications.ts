import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database, PartnerApplication } from "@/types/database";

export type PartnerApplicationWithShop = PartnerApplication & {
  shops: { slug: string; name: string; owner_id: string | null; pending_owner_email: string | null } | null;
};

export function partnerApplicationErrorMessage(error: PostgrestError | null) {
  if (!error) return null;
  const code = error.code ?? "";
  const message = error.message?.toLowerCase() ?? "";

  if (code === "42P01" || message.includes("does not exist")) {
    return "partner_applications テーブルが見つかりません。Supabase に Phase4 の migration を適用してください。";
  }
  if (code === "42501" || message.includes("permission denied") || message.includes("row-level security")) {
    return "データへのアクセス権限がありません。ログイン状態または管理者権限を確認してください。";
  }
  if (message.includes("invalid path") || code === "PGRST125") {
    return "Supabase の接続設定を確認してください（NEXT_PUBLIC_SUPABASE_URL）。";
  }

  return `データの取得に失敗しました: ${error.message}`;
}

export async function listMyPartnerApplications(
  supabase: SupabaseClient<Database>,
  email: string
): Promise<{ data: PartnerApplicationWithShop[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("partner_applications")
    .select("*, shops:shop_id(slug,name,owner_id,pending_owner_email)")
    .eq("email", email)
    .order("created_at", { ascending: false });

  return {
    data: (data ?? []) as PartnerApplicationWithShop[],
    error
  };
}

export async function listAllPartnerApplications(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("partner_applications")
    .select("*")
    .order("created_at", { ascending: false });

  return { data: data ?? [], error };
}