"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import type { PartnerApplicationStatus } from "@/types/database";
import { requireAdminUser } from "@/lib/partner-applications/admin";
import { adminAssignShopOwner, claimPendingShop } from "@/lib/partner-applications/claim";
import { publishPartnerApplicationShop } from "@/lib/partner-applications/publish";
import { runManiaReviewAi } from "@/lib/partner-applications/review-ai";
import { ensureAppUser, getAuthUser, requireAuth, upsertSellerRolePreservingAdmin } from "@/lib/auth";
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
import { logServerError } from "@/lib/security/safe-log";
import { getRequestClientContext } from "@/lib/security/client-context";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { getNeonAuth } from "@/lib/neon/auth";
import { queryOne, queryRows } from "@/lib/neon/db";
import { safeInternalRoute } from "@/lib/navigation";

function authErrorCode(error: unknown, fallback: "auth" | "signup") {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (/(already|exist|registered|duplicate|既に|登録済)/i.test(message)) return "account_exists";
  if (/(invalid|credential|password|メール|パスワード|認証)/i.test(message)) return fallback;
  return "auth_unavailable";
}

function authErrorRedirect(redirectTo: string, code: string, mode: "signin" | "signup") {
  const path = redirectTo === "/admin" ? "/admin/login" : mode === "signup" ? "/signup" : "/login";
  return "/"+path.slice(1)+"?next="+encodeURIComponent(redirectTo)+"&error="+encodeURIComponent(code);
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function httpUrl(formData: FormData, key: string, required = false) {
  const value = text(formData, key);
  if (!value) {
    if (required) throw new Error(`${key}を入力してください。`);
    return null;
  }

  try {
    const url = new URL(value);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) {
      throw new Error();
    }
    return url.toString();
  } catch {
    throw new Error("URLは http:// または https:// から正しく入力してください。");
  }
}

function shopSlug(formData: FormData) {
  const value = text(formData, "slug")?.toLowerCase();
  if (!value || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error("slugは半角英数字とハイフンで入力してください。");
  }
  return value;
}

function uuid(formData: FormData, key: string): string;
function uuid(formData: FormData, key: string, required: false): string | null;
function uuid(formData: FormData, key: string, required = true): string | null {
  const value = text(formData, key);
  if (!value && !required) return null;
  if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("送信されたIDが不正です。ページを再読み込みしてください。");
  }
  return value;
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
  await enforceRateLimit("product_ops", userId);
  return { ctx: await getRequestClientContext() };
}

async function guardSocialOps(userId: string) {
  await enforceRateLimit("social_ops", userId);
}

async function guardAdminOps(userId: string) {
  await enforceRateLimit("admin_ops", userId);
  return { ctx: await getRequestClientContext() };
}

async function guardApplicationSubmit(userId: string | null) {
  const ctx = await getRequestClientContext();
  const subject = userId ?? `ip:${ctx.ipHash}`;
  await enforceRateLimit("application_submit", subject);
  return { ctx };
}

export async function signIn(formData: FormData) {
  const email = text(formData, "email")?.toLowerCase();
  const password = text(formData, "password");
  const redirectTo = safeInternalRoute(text(formData, "redirect_to"), "/mypage");
  if (!email || !password) {
    redirect(authErrorRedirect(redirectTo, "missing_fields", "signin") as Route);
  }
  try {
    const { error } = await getNeonAuth().signIn.email({ email, password });
    if (error) {
      logServerError("signIn", error);
      redirect(authErrorRedirect(redirectTo, authErrorCode(error, "auth"), "signin") as Route);
    }
  } catch (error) {
    logServerError("signIn", error);
    redirect(authErrorRedirect(redirectTo, "auth_unavailable", "signin") as Route);
  }
  redirect(redirectTo);
}

export async function signUp(formData: FormData) {
  const email = text(formData, "email")?.toLowerCase();
  const password = text(formData, "password");
  const name = text(formData, "name") ?? email?.split("@")[0];
  const redirectTo = safeInternalRoute(text(formData, "redirect_to"), "/mypage");
  if (!email || !password || !name) {
    redirect(authErrorRedirect(redirectTo, "missing_fields", "signup") as Route);
  }
  if (password.length < 8) {
    redirect(authErrorRedirect(redirectTo, "weak_password", "signup") as Route);
  }
  try {
    const { error } = await getNeonAuth().signUp.email({ email, password, name });
    if (error) {
      logServerError("signUp", error);
      redirect(authErrorRedirect(redirectTo, authErrorCode(error, "signup"), "signup") as Route);
    }
  } catch (error) {
    logServerError("signUp", error);
    redirect(authErrorRedirect(redirectTo, "auth_unavailable", "signup") as Route);
  }
  redirect(redirectTo);
}

export async function signOut() {
  await getNeonAuth().signOut();
  redirect("/");
}

export async function saveShop(formData: FormData) {
  const authUser = await requireAuth();
  await ensureAppUser(authUser);

  const slug = shopSlug(formData);
  const name = text(formData, "name");
  if (!name) throw new Error("ショップ名は必須です。");

  await upsertSellerRolePreservingAdmin(authUser.id, {
    display_name: authUser.email
  });

  const shopId = uuid(formData, "shop_id", false);
  const values = [authUser.id, slug, name, text(formData, "description"), httpUrl(formData, "website_url"),
    httpUrl(formData, "logo_url"), httpUrl(formData, "cover_image_url"), httpUrl(formData, "twitter_url"),
    httpUrl(formData, "instagram_url"), text(formData, "location"), formData.get("is_published") === "on"];
  const saved = shopId
    ? await queryOne<{ id: string }>(
        `update public.shops set owner_id=$1,slug=$2,name=$3,description=$4,website_url=$5,logo_url=$6,
         cover_image_url=$7,twitter_url=$8,instagram_url=$9,location=$10,is_published=$11,updated_at=now()
         where id=$12 and owner_id=$1 returning id::text`, [...values, shopId])
    : await queryOne<{ id: string }>(
        `insert into public.shops
         (owner_id,slug,name,description,website_url,logo_url,cover_image_url,twitter_url,instagram_url,location,is_published)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id::text`, values);
  if (!saved) throw new Error("ショップを保存できませんでした。");
  await syncShopCategories(saved.id, parseCategoryIds(formData));

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
  return uuid(formData, "category_id", false);
}

async function requireOwnedShopId(ownerId: string, shopId: string) {
  const shop = await getOwnedShop(ownerId);
  if (!shop || shop.id !== shopId) {
    throw new Error("自分のショップのみ操作できます。");
  }
  return shop;
}

export async function createProduct(formData: FormData) {
  const authUser = await requireAuth("/dashboard/products/new" as Route);

  const shopId = uuid(formData, "shop_id");
  const name = text(formData, "name");
  const externalUrl = httpUrl(formData, "external_url", true);
  if (!shopId || !name || !externalUrl) {
    throw new Error("ショップ、商品名、外部販売URLは必須です。");
  }

  await requireOwnedShopId(authUser.id, shopId);
  await assertCanCreateProduct(authUser.id);
  const { ctx } = await guardProductOps(authUser.id);
  const uiStatus = parseUiStatus(formData);

  const product = await queryOne<{ id: string }>(
    `insert into public.products
     (seller_id,shop_id,name,description,price_label,external_url,image_url,category_id,status)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id::text`,
    [authUser.id,shopId,name,text(formData,"description"),text(formData,"price_label"),externalUrl,
      httpUrl(formData,"image_url"),parseCategoryId(formData),toDbProductStatus(uiStatus)]
  );
  if (!product) throw new Error("商品を作成できませんでした。");
  await syncProductTags(product.id, parseProductTags(text(formData, "tags")));
  await writeAuditLog({
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
  const authUser = await requireAuth("/dashboard/products" as Route);

  const productId = uuid(formData, "product_id");
  const shopId = uuid(formData, "shop_id");
  const name = text(formData, "name");
  const externalUrl = httpUrl(formData, "external_url", true);
  if (!productId || !shopId || !name || !externalUrl) {
    throw new Error("商品情報が不正です。");
  }

  const existing = await getSellerProduct(productId, authUser.id);
  if (!existing || existing.shop_id !== shopId) {
    throw new Error("編集権限がありません。");
  }

  const { ctx } = await guardProductOps(authUser.id);
  const uiStatus = parseUiStatus(formData);

  const updated = await queryOne<{ id: string }>(
    `update public.products set name=$1,description=$2,price_label=$3,external_url=$4,image_url=$5,
     category_id=$6,status=$7,updated_at=now() where id=$8 and seller_id=$9 returning id::text`,
    [name,text(formData,"description"),text(formData,"price_label"),externalUrl,httpUrl(formData,"image_url"),
      parseCategoryId(formData),toDbProductStatus(uiStatus),productId,authUser.id]
  );
  if (!updated) throw new Error("商品を更新できませんでした。");
  await syncProductTags(productId, parseProductTags(text(formData, "tags")));
  await writeAuditLog({
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
  const authUser = await requireAuth("/dashboard/products" as Route);
  const id = uuid(formData, "product_id");

  const existing = await getSellerProduct(id, authUser.id);
  if (!existing) throw new Error("編集権限がありません。");

  const { ctx } = await guardProductOps(authUser.id);
  const dbStatus = toDbProductStatus(parseUiStatus(formData));

  await queryRows("update public.products set status=$1,updated_at=now() where id=$2 and seller_id=$3 returning id", [dbStatus,id,authUser.id]);
  await writeAuditLog({
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
  const authUser = await requireAuth("/dashboard/products" as Route);
  const id = uuid(formData, "product_id");

  const existing = await getSellerProduct(id, authUser.id);
  if (!existing) throw new Error("削除権限がありません。");

  const { ctx } = await guardProductOps(authUser.id);

  await queryRows("delete from public.products where id=$1 and seller_id=$2 returning id", [id,authUser.id]);
  await writeAuditLog({
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
  const returnTo = safeInternalRoute(text(formData, "return_to"), "/products");
  const authUser = await requireAuth(returnTo);
  await ensureAppUser(authUser);

  const productId = uuid(formData, "product_id");

  await guardSocialOps(authUser.id);
  const active = formData.get("active") === "true";

  if (active) {
    await queryRows("delete from public.favorites where user_id = $1 and product_id = $2 returning id", [authUser.id, productId]);
  } else {
    await queryRows(
      `insert into public.favorites (user_id, product_id, shop_id)
       select $1, p.id, null from public.products p
       join public.shops s on s.id=p.shop_id
       where p.id=$2::uuid and p.status='active' and s.is_published=true
       on conflict (user_id, product_id) where product_id is not null do nothing returning id`,
      [authUser.id, productId]
    );
    await recordAnalyticsEvent({ type: "favorite_add", productId, userId: authUser.id });
  }

  revalidateSocialPaths(returnTo);
}

export async function toggleFavoriteShop(formData: FormData) {
  const returnTo = safeInternalRoute(text(formData, "return_to"), "/shops");
  const authUser = await requireAuth(returnTo);
  await ensureAppUser(authUser);

  const shopId = uuid(formData, "shop_id");

  await guardSocialOps(authUser.id);
  const active = formData.get("active") === "true";

  if (active) {
    await queryRows("delete from public.favorites where user_id = $1 and shop_id = $2 returning id", [authUser.id, shopId]);
  } else {
    await queryRows(
      `insert into public.favorites (user_id, shop_id, product_id)
       select $1, s.id, null from public.shops s where s.id=$2::uuid and s.is_published=true
       on conflict (user_id, shop_id) where shop_id is not null do nothing returning id`,
      [authUser.id, shopId]
    );
    await recordAnalyticsEvent({ type: "favorite_add", shopId, userId: authUser.id });
  }

  revalidateSocialPaths(returnTo);
}

export async function toggleFollowShop(formData: FormData) {
  const returnTo = safeInternalRoute(text(formData, "return_to"), "/shops");
  const authUser = await requireAuth(returnTo);
  await ensureAppUser(authUser);

  const shopId = uuid(formData, "shop_id");

  await guardSocialOps(authUser.id);
  const active = formData.get("active") === "true";

  if (active) {
    await queryRows("delete from public.follows where user_id = $1 and shop_id = $2 returning shop_id", [authUser.id, shopId]);
  } else {
    await queryRows(
      `insert into public.follows (user_id, shop_id)
       select $1, s.id from public.shops s where s.id=$2::uuid and s.is_published=true
       on conflict (user_id, shop_id) do nothing returning shop_id`, [authUser.id, shopId]);
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

  const authUser = await getAuthUser();
  const { ctx } = await guardApplicationSubmit(authUser?.id ?? null);
  await verifyTurnstileToken(text(formData, "cf-turnstile-response"));

  const aiReview = runManiaReviewAi({
    shop_name,
    owner_name,
    email,
    region: text(formData, "region"),
    website_url: httpUrl(formData, "website_url"),
    instagram_url: httpUrl(formData, "instagram_url"),
    x_url: httpUrl(formData, "x_url"),
    description: text(formData, "description"),
    mission: text(formData, "mission"),
    target_user: text(formData, "target_user"),
    categories
  });

  const inserted = await queryRows<{ id: string }>(
    `insert into public.partner_applications
     (user_id, shop_name, owner_name, email, region, website_url, instagram_url, x_url,
      description, mission, target_user, categories, status, ai_score, ai_specialty,
      ai_originality, ai_passion, ai_safety, ai_recommendation, ai_comment, ai_checked_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending',$13,$14,$15,$16,$17,$18,$19,$20)
     returning id::text`,
    [
      authUser?.id ?? null, shop_name, owner_name, email, text(formData, "region"), httpUrl(formData, "website_url"),
      httpUrl(formData, "instagram_url"), httpUrl(formData, "x_url"), text(formData, "description"),
      text(formData, "mission"), text(formData, "target_user"), categories, aiReview.ai_score,
      aiReview.ai_specialty, aiReview.ai_originality, aiReview.ai_passion, aiReview.ai_safety,
      aiReview.ai_recommendation, aiReview.ai_comment, aiReview.ai_checked_at
    ]
  );
  const insertedId = inserted[0]?.id;
  if (!insertedId) throw new Error("申請を保存できませんでした。");

  await writeAuditLog({
    userId: authUser?.id ?? null,
    action: "application_submit",
    targetType: "partner_application",
    targetId: insertedId,
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
  const authUser = await requireAuth("/admin/partner-applications" as Route);
  await requireAdminUser(authUser.id);
  return { authUser };
}

function reviewNote(formData: FormData) {
  return text(formData, "review_note");
}

function applicationId(formData: FormData) {
  return uuid(formData, "application_id");
}

export async function setPartnerApplicationReviewing(formData: FormData) {
  await adminPartnerContext();
  const id = applicationId(formData);
  await queryRows("update public.partner_applications set status='reviewing',review_note=$1,reviewed_at=now() where id=$2 returning id", [reviewNote(formData),id]);
  revalidatePartnerApplicationPaths(id);
}

export async function approvePartnerApplication(formData: FormData) {
  const { authUser } = await adminPartnerContext();
  const { ctx } = await guardAdminOps(authUser.id);
  const id = applicationId(formData);
  await queryRows("update public.partner_applications set status='approved',review_note=$1,reviewed_at=now(),approved_at=now() where id=$2 returning id", [reviewNote(formData),id]);
  await writeAuditLog({
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
  const { authUser } = await adminPartnerContext();
  const { ctx } = await guardAdminOps(authUser.id);
  const id = applicationId(formData);
  await queryRows("update public.partner_applications set status='rejected',review_note=$1,reviewed_at=now(),approved_at=null where id=$2 returning id", [reviewNote(formData),id]);
  await writeAuditLog({
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
  await adminPartnerContext();
  const id = applicationId(formData);
  await queryRows("update public.partner_applications set review_note=$1,reviewed_at=now() where id=$2 returning id", [reviewNote(formData),id]);
  revalidatePartnerApplicationPaths(id);
}

export async function publishPartnerApplication(formData: FormData) {
  const { authUser } = await adminPartnerContext();
  const { ctx } = await guardAdminOps(authUser.id);
  const id = applicationId(formData);
  const result = await publishPartnerApplicationShop(id);
  await writeAuditLog({
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
  const authUser = await requireAuth("/mypage/applications" as Route);
  if (!authUser.email) {
    throw new Error("メールアドレスが確認できません。");
  }

  const shopId = uuid(formData, "shop_id");

  const shop = await queryOne<{id:string;owner_id:string|null;pending_owner_email:string|null}>(
    "select id::text,owner_id,pending_owner_email from public.shops where id=$1", [shopId]);

  if (!shop) {
    throw new Error("ショップが見つかりません。");
  }
  if (shop.owner_id) {
    throw new Error("このショップはすでにオーナーがいます。");
  }
  if (!shop.pending_owner_email || shop.pending_owner_email.toLowerCase() !== authUser.email.toLowerCase()) {
    throw new Error("このショップを引き継ぐ権限がありません。");
  }

  await ensureAppUser(authUser);
  await claimPendingShop(shopId, authUser.id, authUser.email);

  const ctx = await getRequestClientContext();
  const applicationIdValue = uuid(formData, "application_id", false);
  await writeAuditLog({
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
  await adminPartnerContext();
  const id = applicationId(formData);
  const targetEmail = text(formData, "target_email");
  if (!targetEmail) throw new Error("紐付け先メールアドレスを入力してください。");

  const application = await queryOne<{shop_id:string|null;email:string}>("select shop_id::text,email from public.partner_applications where id=$1", [id]);

  if (!application?.shop_id) {
    throw new Error("公開済みショップが見つかりません。");
  }

  const shop = await queryOne<{id:string;owner_id:string|null}>("select id::text,owner_id from public.shops where id=$1", [application.shop_id]);

  if (!shop) {
    throw new Error("ショップが見つかりません。");
  }
  if (shop.owner_id) {
    throw new Error("このショップはすでにオーナーがいます。");
  }

  const target = await queryOne<{id:string}>("select id from public.users where lower(email)=lower($1) limit 1", [targetEmail]);

  if (!target) {
    throw new Error("指定メールのユーザーが見つかりません。先にアカウント登録が必要です。");
  }

  await adminAssignShopOwner(shop.id, target.id);
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
