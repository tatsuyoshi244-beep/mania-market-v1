import { upsertSellerRolePreservingAdmin } from "@/lib/auth";
import { queryOne, queryRows } from "@/lib/neon/db";
import { ensureUniqueShopSlug, slugifyShopName } from "@/lib/partner-applications/slug";

type Application = {
  id:string; status:string; shop_id:string|null; shop_name:string; description:string|null;
  website_url:string|null; x_url:string|null; instagram_url:string|null; email:string;
  owner_name:string; categories:string[];
};

export async function publishPartnerApplicationShop(_client: unknown, applicationId: string) {
  const application = await queryOne<Application>("select * from public.partner_applications where id=$1", [applicationId]);
  if (!application) throw new Error("申請が見つかりません。");
  if (application.status !== "approved") throw new Error("承認済みの申請のみ公開できます。");
  if (application.shop_id) throw new Error("この申請はすでに公開済みです。");

  const owner = await queryOne<{ id:string }>("select id from public.users where lower(email)=lower($1) limit 1", [application.email]);
  const ownerId = owner?.id ?? null;
  const slug = await ensureUniqueShopSlug(null, slugifyShopName(application.shop_name));
  const shop = await queryOne<{id:string;slug:string}>(
    `insert into public.shops
     (slug,name,description,website_url,twitter_url,instagram_url,owner_id,pending_owner_email,is_published,status,plan_key,partner_application_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,true,'active','free',$9) returning id::text,slug`,
    [slug,application.shop_name,application.description,application.website_url,application.x_url,
      application.instagram_url,ownerId,ownerId ? null : application.email,application.id]
  );
  if (!shop) throw new Error("ショップの作成に失敗しました。");

  if (application.categories?.length) {
    await queryRows(
      `insert into public.shop_categories (shop_id,category_id)
       select $1,id from public.categories where name=any($2::text[]) on conflict do nothing returning shop_id`,
      [shop.id,application.categories]
    );
  }
  if (ownerId) await upsertSellerRolePreservingAdmin(null, ownerId, { display_name: application.owner_name });
  await queryRows(
    `update public.partner_applications set status='published',published_at=now(),reviewed_at=now(),shop_id=$1,
     pending_owner_email=$2 where id=$3 returning id`, [shop.id,ownerId ? null : application.email,application.id]
  );
  return { shopId: shop.id, shopSlug: shop.slug, ownerLinked: Boolean(ownerId) };
}
