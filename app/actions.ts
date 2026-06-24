"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import type { PartnerApplicationStatus } from "@/types/database";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/partner-applications/admin";
import { adminAssignShopOwner, claimPendingShop } from "@/lib/partner-applications/claim";
import { publishPartnerApplicationShop } from "@/lib/partner-applications/publish";
import { runManiaReviewAi } from "@/lib/partner-applications/review-ai";
import { ensureAppUser, requireAuth, upsertSellerRolePreservingAdmin } from "@/lib/auth";
import { parseCategoryIds } from "@/lib/categories";
import {
  assertCanCreateProduct,
  getOwnedShop,
  getSellerProduct,
  parseProductTags,
  syncProductTags,
  syncShopCategories
} from "@/lib/products";
import { toDbProductStatus, type ProductUiStatus } from "@/lib/products/status";
import { writeAuditLog } from "@/lib/audit/log";
import { throwUserFacing } from "@/lib/security/safe-error";
import { logServerError } from "@/lib/security/safe-log";
import { getRequestClientContext } from "@/lib/security/client-context";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { recordAnalyticsEvent } from "@/lib/analytics";

function throwDbError(context: string, error: unknown): never {
  logServerError(context, error);
  throwUserFacing(error);
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function loginRedirect(returnTo: string): Route {
  return `/login?next=${encodeURIComponent(returnTo)}` as Route;
}

function revalidateSocialPaths(returnTo: string) {
  revalidatePath(returnTo);
  revalidatePath("/mypage");
  revalidatePath("/mypage/favorites/products");
  revalidatePath("/mypage/favorites/shops");
  revalidatePath("/mypage/following");
  revalidatePath("/products");
  revalidatePath("/shops");
}

async function guardProductOps(userId: string) {
  const service = createSupabaseServiceClient();
  await enforceRateLimit(service, "product_ops", userId);
  return { service, ctx: await getRequestClientContext() };
}

async function guardSocialOps(userId: string) {
  const service = createSupabaseServiceClient();
  await enforceRateLimit(service, "social_ops", userId);
}

async function guardAdminOps(userId: string) {
  const service = createSupabaseServiceClient();
  await enforceRateLimit(service, "admin_ops", userId);
  return { service, ctx: await getRequestClientContext() };
}

async function guardApplicationSubmit(userId: string | null) {
  const service = createSupabaseServiceClient();
  const ctx = await getRequestClientContext();
  const subject = userId ?? `ip:${ctx.ipHash}`;
  await enforceRateLimit(service, "application_submit", subject);
  return { service, ctx };
}

export async function signIn(formData: FormData) {
  const email = text(formData, "email");
  if (!email) throw new Error("メールアドレスを入力してください。");
  const redirectTo = text(formData, "redirect_to") ?? "/mypage";
  const supabase = await createSupabaseServerClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`)}`
    }
  });
  if (error) throwDbError("serverAction", error);
  redirect(`/login?sent=1&next=${encodeURIComponent(redirectTo)}` as Route);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function saveShop(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const authUser = await requireAuth();
  await ensureAppUser(supabase, authUser);

  const slug = text(formData, "slug");
  const name = text(formData, "name");
  if (!slug || !name) throw new Error("ショップ名とslugは必須です。");

  await upsertSellerRolePreservingAdmin(supabase, authUser.id, {
    display_name: authUser.email
  });

  const payload = {
    owner_id: authUser.id,
    slug,
    name,
    description: text(formData, "description"),
    website_url: text(formData, "website_url"),
    logo_url: text(formData, "logo_url"),
    cover_image_url: text(formData, "cover_image_url"),
    twitter_url: text(formData, "twitter_url"),
    instagram_url: text(formData, "instagram_url"),
    location: text(formData, "location"),
    is_published: formData.get("is_published") === "on"
  };

  const shopId = text(formData, "shop_id");
  const result = shopId
    ? await supabase.from("shops").update(payload).eq("id", shopId).select("id").single()
    : await supabase.from("shops").insert(payload).select("id").single();

  if (result.error) throwDbError("saveShop", result.error);

  const savedShopId = result.data.id;
  await syncShopCategories(supabase, savedShopId, parseCategoryIds(formData));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/shop");
  revalidatePath("/shops");
  redirect("/dashboard/shop");
}

function parseUiStatus(formData: FormData): ProductUiStatus {
  const value = text(formData, "ui_status") ?? text(formData, "status");
  return value === "published" ? "published" : "draft";
}

function parseCategoryId(formData: FormData) {
  return text(formData, "category_id");
}

async function requireOwnedShopId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ownerId: string,
  shopId: string
) {
  const shop = await getOwnedShop(supabase, ownerId);
  if (!shop || shop.id !== shopId) {
    throw new Error("自分のショップのみ操作できます。");
  }
  return shop;
}

export async function createProduct(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const authUser = await requireAuth("/dashboard/products/new" as Route);

  const shopId = text(formData, "shop_id");
  const name = text(formData, "name");
  const externalUrl = text(formData, "external_url");
  if (!shopId || !name || !externalUrl) {
    throw new Error("ショップ、商品名、外部販売URLは必須です。");
  }

  await requireOwnedShopId(supabase, authUser.id, shopId);
  await assertCanCreateProduct(supabase, authUser.id);
  const { service, ctx } = await guardProductOps(authUser.id);
  const uiStatus = parseUiStatus(formData);

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      seller_id: authUser.id,
      shop_id: shopId,
      name,
      description: text(formData, "description"),
      price_label: text(formData, "price_label"),
      external_url: externalUrl,
      image_url: text(formData, "image_url"),
      category_id: parseCategoryId(formData),
      status: toDbProductStatus(uiStatus)
    })
    .select("id")
    .single();

  if (error) throwDbError("serverAction", error);

  await syncProductTags(supabase, product.id, parseProductTags(text(formData, "tags")));
  await writeAuditLog(service, {
    userId: authUser.id,
    action: "seller_create_product",
    targetType: "product",
    targetId: product.id,
    metadata: { shop_id: shopId, status: toDbProductStatus(uiStatus) },
    ipHash: ctx.ipHash,
    userAgentHash: ctx.userAgentHash
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath("/products");
  redirect("/dashboard/products");
}

export async function updateProduct(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const authUser = await requireAuth("/dashboard/products" as Route);

  const productId = text(formData, "product_id");
  const shopId = text(formData, "shop_id");
  const name = text(formData, "name");
  const externalUrl = text(formData, "external_url");
  if (!productId || !shopId || !name || !externalUrl) {
    throw new Error("商品情報が不正です。");
  }

  const existing = await getSellerProduct(supabase, productId, authUser.id);
  if (!existing || existing.shop_id !== shopId) {
    throw new Error("編集権限がありません。");
  }

  const { service, ctx } = await guardProductOps(authUser.id);
  const uiStatus = parseUiStatus(formData);

  const { error } = await supabase
    .from("products")
    .update({
      name,
      description: text(formData, "description"),
      price_label: text(formData, "price_label"),
      external_url: externalUrl,
      image_url: text(formData, "image_url"),
      category_id: parseCategoryId(formData),
      status: toDbProductStatus(uiStatus)
    })
    .eq("id", productId)
    .eq("seller_id", authUser.id);

  if (error) throwDbError("serverAction", error);

  await syncProductTags(supabase, productId, parseProductTags(text(formData, "tags")));
  await writeAuditLog(service, {
    userId: authUser.id,
    action: "seller_update_product",
    targetType: "product",
    targetId: productId,
    metadata: { shop_id: shopId, status: toDbProductStatus(uiStatus) },
    ipHash: ctx.ipHash,
    userAgentHash: ctx.userAgentHash
  });

  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${productId}/edit`);
  revalidatePath("/products");
  redirect("/dashboard/products");
}

export async function updateProductStatus(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const authUser = await requireAuth("/dashboard/products" as Route);
  const id = text(formData, "product_id");
  if (!id) throw new Error("商品IDがありません。");

  const existing = await getSellerProduct(supabase, id, authUser.id);
  if (!existing) throw new Error("編集権限がありません。");

  const { service, ctx } = await guardProductOps(authUser.id);
  const dbStatus = toDbProductStatus(parseUiStatus(formData));

  const { error } = await supabase
    .from("products")
    .update({ status: dbStatus })
    .eq("id", id)
    .eq("seller_id", authUser.id);

  if (error) throwDbError("serverAction", error);
  await writeAuditLog(service, {
    userId: authUser.id,
    action: "seller_update_product",
    targetType: "product",
    targetId: id,
    metadata: { shop_id: existing.shop_id, status: dbStatus },
    ipHash: ctx.ipHash,
    userAgentHash: ctx.userAgentHash
  });
  revalidatePath("/dashboard/products");
  revalidatePath("/products");
}

export async function deleteProduct(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const authUser = await requireAuth("/dashboard/products" as Route);
  const id = text(formData, "product_id");
  if (!id) throw new Error("商品IDがありません。");

  const existing = await getSellerProduct(supabase, id, authUser.id);
  if (!existing) throw new Error("削除権限がありません。");

  const { service, ctx } = await guardProductOps(authUser.id);

  const { error } = await supabase.from("products").delete().eq("id", id).eq("seller_id", authUser.id);
  if (error) throwDbError("serverAction", error);
  await writeAuditLog(service, {
    userId: authUser.id,
    action: "seller_delete_product",
    targetType: "product",
    targetId: id,
    metadata: { shop_id: existing.shop_id },
    ipHash: ctx.ipHash,
    userAgentHash: ctx.userAgentHash
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/products");
}

export async function toggleFavoriteProduct(formData: FormData) {
  const returnTo = text(formData, "return_to") ?? "/products";
  const supabase = await createSupabaseServerClient();
  const authUser = await requireAuth(loginRedirect(returnTo));
  await ensureAppUser(supabase, authUser);

  const productId = text(formData, "product_id");
  if (!productId) return;

  await guardSocialOps(authUser.id);
  const active = formData.get("active") === "true";

  if (active) {
    await supabase.from("favorites").delete().eq("user_id", authUser.id).eq("product_id", productId);
  } else {
    const { error } = await supabase
      .from("favorites")
      .upsert({ user_id: authUser.id, product_id: productId, shop_id: null });
    if (error) throwDbError("serverAction", error);
    await recordAnalyticsEvent({ type: "favorite_add", productId, userId: authUser.id });
  }

  revalidateSocialPaths(returnTo);
}

export async function toggleFavoriteShop(formData: FormData) {
  const returnTo = text(formData, "return_to") ?? "/shops";
  const supabase = await createSupabaseServerClient();
  const authUser = await requireAuth(loginRedirect(returnTo));
  await ensureAppUser(supabase, authUser);

  const shopId = text(formData, "shop_id");
  if (!shopId) return;

  await guardSocialOps(authUser.id);
  const active = formData.get("active") === "true";

  if (active) {
    await supabase.from("favorites").delete().eq("user_id", authUser.id).eq("shop_id", shopId);
  } else {
    const { error } = await supabase
      .from("favorites")
      .upsert({ user_id: authUser.id, shop_id: shopId, product_id: null });
    if (error) throwDbError("serverAction", error);
    await recordAnalyticsEvent({ type: "favorite_add", shopId, userId: authUser.id });
  }

  revalidateSocialPaths(returnTo);
}

export async function toggleFollowShop(formData: FormData) {
  const returnTo = text(formData, "return_to") ?? "/shops";
  const supabase = await createSupabaseServerClient();
  const authUser = await requireAuth(loginRedirect(returnTo));
  await ensureAppUser(supabase, authUser);

  const shopId = text(formData, "shop_id");
  if (!shopId) return;

  await guardSocialOps(authUser.id);
  const active = formData.get("active") === "true";

  if (active) {
    await supabase.from("follows").delete().eq("user_id", authUser.id).eq("shop_id", shopId);
  } else {
    const { error } = await supabase.from("follows").upsert({ user_id: authUser.id, shop_id: shopId });
    if (error) throwDbError("serverAction", error);
    await recordAnalyticsEvent({ type: "follow_add", shopId, userId: authUser.id });
  }

  revalidateSocialPaths(returnTo);
}

/** @deprecated use toggleFavoriteProduct */
export async function favoriteProduct(formData: FormData) {
  formData.set("active", "false");
  await toggleFavoriteProduct(formData);
}

/** @deprecated use toggleFollowShop */
export async function followShop(formData: FormData) {
  formData.set("active", "false");
  await toggleFollowShop(formData);
}

function parseCategories(formData: FormData) {
  return [
    ...new Set(
      formData
        .getAll("categories")
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim())
    )
  ];
}

export async function submitPartnerApplication(formData: FormData) {
  if (formData.get("terms_agreed") !== "on") {
    throw new Error("利用規約への同意が必要です。");
  }

  const shop_name = text(formData, "shop_name");
  const owner_name = text(formData, "owner_name");
  const email = text(formData, "email");
  const categories = parseCategories(formData);

  if (!shop_name || !owner_name || !email) {
    throw new Error("ショップ名・運営者名・メールアドレスは必須です。");
  }
  if (categories.length === 0) {
    throw new Error("カテゴリを1つ以上選択してください。");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { service, ctx } = await guardApplicationSubmit(userData.user?.id ?? null);
  await verifyTurnstileToken(text(formData, "cf-turnstile-response"));

  const aiReview = runManiaReviewAi({
    shop_name,
    owner_name,
    email,
    region: text(formData, "region"),
    website_url: text(formData, "website_url"),
    instagram_url: text(formData, "instagram_url"),
    x_url: text(formData, "x_url"),
    description: text(formData, "description"),
    mission: text(formData, "mission"),
    target_user: text(formData, "target_user"),
    categories
  });

  const { data: inserted, error } = await supabase.from("partner_applications").insert({
    shop_name,
    owner_name,
    email,
    region: text(formData, "region"),
    website_url: text(formData, "website_url"),
    instagram_url: text(formData, "instagram_url"),
    x_url: text(formData, "x_url"),
    description: text(formData, "description"),
    mission: text(formData, "mission"),
    target_user: text(formData, "target_user"),
    categories,
    status: "pending",
    ...aiReview
  }).select("id").single();

  if (error) {
    throwDbError("submitPartnerApplication", error);
  }

  await writeAuditLog(service, {
    userId: userData.user?.id ?? null,
    action: "application_submit",
    targetType: "partner_application",
    targetId: inserted.id,
    metadata: {
      category_count: categories.length,
      ai_recommendation: aiReview.ai_recommendation ?? null
    },
    ipHash: ctx.ipHash,
    userAgentHash: ctx.userAgentHash
  });

  redirect("/partner/apply/thanks");
}

async function adminPartnerContext() {
  const supabase = await createSupabaseServerClient();
  const authUser = await requireAuth("/admin/partner-applications" as Route);
  await requireAdminUser(supabase, authUser.id);
  return { supabase, authUser };
}

function reviewNote(formData: FormData) {
  return text(formData, "review_note");
}

function applicationId(formData: FormData) {
  const id = text(formData, "application_id");
  if (!id) throw new Error("申請IDが不正です。");
  return id;
}

export async function setPartnerApplicationReviewing(formData: FormData) {
  const { supabase } = await adminPartnerContext();
  const id = applicationId(formData);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("partner_applications")
    .update({
      status: "reviewing",
      review_note: reviewNote(formData),
      reviewed_at: now
    })
    .eq("id", id);

  if (error) throwDbError("serverAction", error);
  revalidatePartnerApplicationPaths(id);
}

export async function approvePartnerApplication(formData: FormData) {
  const { supabase, authUser } = await adminPartnerContext();
  const { service, ctx } = await guardAdminOps(authUser.id);
  const id = applicationId(formData);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("partner_applications")
    .update({
      status: "approved",
      review_note: reviewNote(formData),
      reviewed_at: now,
      approved_at: now
    })
    .eq("id", id);

  if (error) throwDbError("serverAction", error);
  await writeAuditLog(service, {
    userId: authUser.id,
    action: "admin_approve_application",
    targetType: "partner_application",
    targetId: id,
    metadata: {},
    ipHash: ctx.ipHash,
    userAgentHash: ctx.userAgentHash
  });
  revalidatePartnerApplicationPaths(id);
}

export async function rejectPartnerApplication(formData: FormData) {
  const { supabase, authUser } = await adminPartnerContext();
  const { service, ctx } = await guardAdminOps(authUser.id);
  const id = applicationId(formData);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("partner_applications")
    .update({
      status: "rejected",
      review_note: reviewNote(formData),
      reviewed_at: now,
      approved_at: null
    })
    .eq("id", id);

  if (error) throwDbError("serverAction", error);
  await writeAuditLog(service, {
    userId: authUser.id,
    action: "admin_reject_application",
    targetType: "partner_application",
    targetId: id,
    metadata: {},
    ipHash: ctx.ipHash,
    userAgentHash: ctx.userAgentHash
  });
  revalidatePartnerApplicationPaths(id);
}

export async function savePartnerApplicationReviewNote(formData: FormData) {
  const { supabase } = await adminPartnerContext();
  const id = applicationId(formData);

  const { error } = await supabase
    .from("partner_applications")
    .update({
      review_note: reviewNote(formData),
      reviewed_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) throwDbError("serverAction", error);
  revalidatePartnerApplicationPaths(id);
}

export async function publishPartnerApplication(formData: FormData) {
  const { authUser } = await adminPartnerContext();
  const { service, ctx } = await guardAdminOps(authUser.id);
  const id = applicationId(formData);
  const result = await publishPartnerApplicationShop(service, id);
  await writeAuditLog(service, {
    userId: authUser.id,
    action: "admin_publish_shop",
    targetType: "shop",
    targetId: result.shopId,
    metadata: { application_id: id, owner_linked: result.ownerLinked },
    ipHash: ctx.ipHash,
    userAgentHash: ctx.userAgentHash
  });
  revalidatePartnerApplicationPaths(id);
  revalidatePath("/shops");
}

export async function claimPartnerShop(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const authUser = await requireAuth("/mypage/applications" as Route);
  if (!authUser.email) {
    throw new Error("メールアドレスが確認できません。");
  }

  const shopId = text(formData, "shop_id");
  if (!shopId) throw new Error("ショップIDが不正です。");

  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id, owner_id, pending_owner_email")
    .eq("id", shopId)
    .maybeSingle();

  if (shopError || !shop) {
    throw new Error("ショップが見つかりません。");
  }
  if (shop.owner_id) {
    throw new Error("このショップはすでにオーナーがいます。");
  }
  if (!shop.pending_owner_email || shop.pending_owner_email.toLowerCase() !== authUser.email.toLowerCase()) {
    throw new Error("このショップを引き継ぐ権限がありません。");
  }

  await claimPendingShop(supabase, shopId);
  await ensureAppUser(supabase, authUser);

  const service = createSupabaseServiceClient();
  const ctx = await getRequestClientContext();
  const applicationIdValue = text(formData, "application_id");
  await writeAuditLog(service, {
    userId: authUser.id,
    action: "seller_claim_shop",
    targetType: "shop",
    targetId: shopId,
    metadata: { application_id: applicationIdValue ?? null },
    ipHash: ctx.ipHash,
    userAgentHash: ctx.userAgentHash
  });

  if (applicationIdValue) {
    revalidatePartnerApplicationPaths(applicationIdValue);
  } else {
    revalidatePath("/mypage/applications");
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath("/shops");
  redirect("/dashboard");
}

export async function adminForceAssignShopOwner(formData: FormData) {
  const { supabase } = await adminPartnerContext();
  const id = applicationId(formData);
  const targetEmail = text(formData, "target_email");
  if (!targetEmail) throw new Error("紐付け先メールアドレスを入力してください。");

  const { data: application, error: appError } = await supabase
    .from("partner_applications")
    .select("shop_id, email")
    .eq("id", id)
    .single();

  if (appError || !application?.shop_id) {
    throw new Error("公開済みショップが見つかりません。");
  }

  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id, owner_id")
    .eq("id", application.shop_id)
    .single();

  if (shopError || !shop) {
    throw new Error("ショップが見つかりません。");
  }
  if (shop.owner_id) {
    throw new Error("このショップはすでにオーナーがいます。");
  }

  const service = createSupabaseServiceClient();
  const { data: targetUserId, error: lookupError } = await service.rpc("user_id_by_email", {
    target_email: targetEmail
  });

  if (lookupError || !targetUserId) {
    throw new Error("指定メールのユーザーが見つかりません。先にアカウント登録が必要です。");
  }

  await adminAssignShopOwner(supabase, shop.id, targetUserId);
  revalidatePartnerApplicationPaths(id);
  revalidatePath("/dashboard");
  revalidatePath("/shops");
}

function revalidatePartnerApplicationPaths(id: string) {
  revalidatePath("/admin/partner-applications");
  revalidatePath(`/admin/partner-applications/${id}`);
  revalidatePath("/mypage/applications");
  revalidatePath("/dashboard");
}

/** @deprecated use granular partner application actions */
export async function updatePartnerApplicationStatus(formData: FormData) {
  const status = text(formData, "status") as PartnerApplicationStatus | null;
  if (status === "reviewing") return setPartnerApplicationReviewing(formData);
  if (status === "approved") return approvePartnerApplication(formData);
  if (status === "rejected") return rejectPartnerApplication(formData);
  throw new Error("この操作は詳細画面から実行してください。");
}