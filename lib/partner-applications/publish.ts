import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { upsertSellerRolePreservingAdmin } from "@/lib/auth";
import { ensureUniqueShopSlug, slugifyShopName } from "@/lib/partner-applications/slug";

type ServiceClient = SupabaseClient<Database>;

export async function publishPartnerApplicationShop(
  service: ServiceClient,
  applicationId: string
) {
  const { data: application, error: loadError } = await service
    .from("partner_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (loadError || !application) {
    throw new Error("申請が見つかりません。");
  }
  if (application.status !== "approved") {
    throw new Error("承認済みの申請のみ公開できます。");
  }
  if (application.shop_id) {
    throw new Error("この申請はすでに公開済みです。");
  }

  const { data: ownerId, error: ownerError } = await service.rpc("user_id_by_email", {
    target_email: application.email
  });

  if (ownerError) {
    console.error("[publishPartnerApplicationShop] user_id_by_email", ownerError);
  }

  const baseSlug = slugifyShopName(application.shop_name);
  const slug = await ensureUniqueShopSlug(service, baseSlug);
  const now = new Date().toISOString();

  const shopPayload = {
    slug,
    name: application.shop_name,
    description: application.description,
    website_url: application.website_url,
    twitter_url: application.x_url,
    instagram_url: application.instagram_url,
    owner_id: ownerId ?? null,
    pending_owner_email: ownerId ? null : application.email,
    is_published: true,
    status: "active" as const,
    plan_key: "free" as const,
    partner_application_id: application.id
  };

  const { data: shop, error: shopError } = await service.from("shops").insert(shopPayload).select("id,slug").single();

  if (shopError || !shop) {
    console.error("[publishPartnerApplicationShop] insert shop", shopError);
    if (shopError) {
      throw new Error(
        `ショップ作成失敗: ${shopError.code} ${shopError.message} ${shopError.details ?? ""} ${shopError.hint ?? ""}`
      );
    }
    throw new Error("ショップの作成に失敗しました。");
  }

  if (application.categories.length > 0) {
    const { data: categories } = await service.from("categories").select("id,name");
    const categoryIds = (categories ?? [])
      .filter((row) => application.categories.includes(row.name))
      .map((row) => row.id);

    if (categoryIds.length > 0) {
      const { error: catError } = await service.from("shop_categories").insert(
        categoryIds.map((category_id) => ({ shop_id: shop.id, category_id }))
      );
      if (catError) {
        console.error("[publishPartnerApplicationShop] shop_categories", catError);
      }
    }
  }

  if (ownerId) {
    await upsertSellerRolePreservingAdmin(service, ownerId, {
      display_name: application.owner_name
    });
  }

  const { error: appError } = await service
    .from("partner_applications")
    .update({
      status: "published",
      published_at: now,
      reviewed_at: now,
      shop_id: shop.id,
      pending_owner_email: ownerId ? null : application.email
    })
    .eq("id", application.id);

  if (appError) {
    throw new Error("申請ステータスの更新に失敗しました。");
  }

  return { shopId: shop.id, shopSlug: shop.slug, ownerLinked: Boolean(ownerId) };
}
