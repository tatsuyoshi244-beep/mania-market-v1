import { queryOne } from "@/lib/neon/db";
import { upsertSellerRolePreservingAdmin } from "@/lib/auth";

export function canClaimPublishedShop(input: {
  applicationStatus: string; shopId: string | null; shopOwnerId: string | null | undefined;
  shopPendingOwnerEmail: string | null | undefined; userEmail: string;
}) {
  return input.applicationStatus === "published" && Boolean(input.shopId) && !input.shopOwnerId &&
    Boolean(input.shopPendingOwnerEmail) && input.shopPendingOwnerEmail!.toLowerCase() === input.userEmail.toLowerCase();
}

export async function claimPendingShop(shopId: string, userId: string, email: string) {
  const shop = await queryOne<{ id: string }>(
    `update public.shops set owner_id=$1,pending_owner_email=null,updated_at=now()
     where id=$2 and owner_id is null and lower(pending_owner_email)=lower($3) returning id::text`,
    [userId, shopId, email]
  );
  if (!shop) throw new Error("このショップを引き継ぐ権限がないか、すでにオーナーが設定されています。");
  await upsertSellerRolePreservingAdmin(userId, {});
  return { shopId: shop.id };
}

export async function adminAssignShopOwner(shopId: string, targetUserId: string) {
  const shop = await queryOne<{ id: string }>(
    `update public.shops set owner_id=$1,pending_owner_email=null,updated_at=now()
     where id=$2 and owner_id is null returning id::text`, [targetUserId, shopId]
  );
  if (!shop) throw new Error("オーナーの強制紐付けに失敗しました。");
  await upsertSellerRolePreservingAdmin(targetUserId, {});
  return { shopId: shop.id };
}
