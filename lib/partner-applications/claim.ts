import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function canClaimPublishedShop(input: {
  applicationStatus: string;
  shopId: string | null;
  shopOwnerId: string | null | undefined;
  shopPendingOwnerEmail: string | null | undefined;
  userEmail: string;
}) {
  if (input.applicationStatus !== "published") return false;
  if (!input.shopId) return false;
  if (input.shopOwnerId) return false;
  if (!input.shopPendingOwnerEmail) return false;
  return input.shopPendingOwnerEmail.toLowerCase() === input.userEmail.toLowerCase();
}

export async function claimPendingShop(
  supabase: SupabaseClient<Database>,
  shopId: string
): Promise<{ shopId: string }> {
  const { data, error } = await supabase.rpc("claim_pending_shop", {
    target_shop_id: shopId
  });

  if (error) {
    const message = error.message ?? "ショップの引き継ぎに失敗しました。";
    if (message.includes("権限がありません")) {
      throw new Error("このショップを引き継ぐ権限がありません。ログイン中のメールが申請時と一致しているか確認してください。");
    }
    if (message.includes("すでにオーナー")) {
      throw new Error("このショップはすでに別のオーナーに紐付けられています。");
    }
    throw new Error(message);
  }

  if (!data) {
    throw new Error("ショップの引き継ぎに失敗しました。");
  }

  return { shopId: data };
}

export async function adminAssignShopOwner(
  supabase: SupabaseClient<Database>,
  shopId: string,
  targetUserId: string
): Promise<{ shopId: string }> {
  const { data, error } = await supabase.rpc("admin_assign_shop_owner", {
    target_shop_id: shopId,
    target_user_id: targetUserId
  });

  if (error) {
    throw new Error(error.message ?? "オーナーの強制紐付けに失敗しました。");
  }

  if (!data) {
    throw new Error("オーナーの強制紐付けに失敗しました。");
  }

  return { shopId: data };
}