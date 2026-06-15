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
  parseProductTags,
  syncProductTags,
  syncShopCategories
} from "@/lib/products";
import { recordAnalyticsEvent } from "@/lib/analytics";

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
  if (error) throw error;
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
    is_published: formData.get("is_published") === "on"
  };

  const shopId = text(formData, "shop_id");
  const result = shopId
    ? await supabase.from("shops").update(payload).eq("id", shopId).select("id").single()
    : await supabase.from("shops").insert(payload).select("id").single();

  if (result.error) throw result.error;

  const savedShopId = result.data.id;
  await syncShopCategories(supabase, savedShopId, parseCategoryIds(formData));

  revalidatePath("/dashboard");
  revalidatePath("/shops");
  redirect("/dashboard");
}

export async function createProduct(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const authUser = await requireAuth();

  const shopId = text(formData, "shop_id");
  const name = text(formData, "name");
  const externalUrl = text(formData, "external_url");
  if (!shopId || !name || !externalUrl) {
    throw new Error("ショップ、商品名、外部販売URLは必須です。");
  }

  await assertCanCreateProduct(supabase, authUser.id);

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
      status: "active"
    })
    .select("id")
    .single();

  if (error) throw error;

  await syncProductTags(supabase, product.id, parseProductTags(text(formData, "tags")));

  revalidatePath("/dashboard");
  revalidatePath("/products");
  redirect("/dashboard/products");
}

export async function updateProductStatus(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const authUser = await requireAuth();
  const id = text(formData, "product_id");
  const status = formData.get("status") === "active" ? "active" : "hidden";
  if (!id) throw new Error("商品IDがありません。");

  if (status === "active") {
    await assertCanCreateProduct(supabase, authUser.id);
  }

  const { error } = await supabase.from("products").update({ status }).eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/products");
}

export async function toggleFavoriteProduct(formData: FormData) {
  const returnTo = text(formData, "return_to") ?? "/products";
  const supabase = await createSupabaseServerClient();
  const authUser = await requireAuth(loginRedirect(returnTo));
  await ensureAppUser(supabase, authUser);

  const productId = text(formData, "product_id");
  if (!productId) return;

  const active = formData.get("active") === "true";

  if (active) {
    await supabase.from("favorites").delete().eq("user_id", authUser.id).eq("product_id", productId);
  } else {
    const { error } = await supabase
      .from("favorites")
      .upsert({ user_id: authUser.id, product_id: productId, shop_id: null });
    if (error) throw error;
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

  const active = formData.get("active") === "true";

  if (active) {
    await supabase.from("favorites").delete().eq("user_id", authUser.id).eq("shop_id", shopId);
  } else {
    const { error } = await supabase
      .from("favorites")
      .upsert({ user_id: authUser.id, shop_id: shopId, product_id: null });
    if (error) throw error;
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

  const active = formData.get("active") === "true";

  if (active) {
    await supabase.from("follows").delete().eq("user_id", authUser.id).eq("shop_id", shopId);
  } else {
    const { error } = await supabase.from("follows").upsert({ user_id: authUser.id, shop_id: shopId });
    if (error) throw error;
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

  const { error } = await supabase.from("partner_applications").insert({
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
  });

  if (error) {
    console.error("[submitPartnerApplication]", JSON.stringify(error, null, 2));
    throw new Error("申請の送信に失敗しました。入力内容をご確認ください。");
  }

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

  if (error) throw error;
  revalidatePartnerApplicationPaths(id);
}

export async function approvePartnerApplication(formData: FormData) {
  const { supabase } = await adminPartnerContext();
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

  if (error) throw error;
  revalidatePartnerApplicationPaths(id);
}

export async function rejectPartnerApplication(formData: FormData) {
  const { supabase } = await adminPartnerContext();
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

  if (error) throw error;
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

  if (error) throw error;
  revalidatePartnerApplicationPaths(id);
}

export async function publishPartnerApplication(formData: FormData) {
  await adminPartnerContext();
  const id = applicationId(formData);
  const service = createSupabaseServiceClient();
  await publishPartnerApplicationShop(service, id);
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

  const applicationIdValue = text(formData, "application_id");
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