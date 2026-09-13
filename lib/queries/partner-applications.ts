import { queryRows } from "@/lib/neon/db";
import type { PartnerApplication } from "@/types/database";

export type PartnerApplicationWithShop = PartnerApplication & {
  shops: { slug: string; name: string; owner_id: string | null; pending_owner_email: string | null } | null;
};

export function partnerApplicationErrorMessage(error: Error | null) {
  return error ? "データの取得に失敗しました。時間をおいて再度お試しください。" : null;
}

export async function listMyPartnerApplications(email: string): Promise<{ data: PartnerApplicationWithShop[]; error: Error | null }> {
  try {
    const data = await queryRows<PartnerApplicationWithShop>(
      `select pa.*,
              case when s.id is null then null else jsonb_build_object(
                'slug', s.slug, 'name', s.name, 'owner_id', s.owner_id,
                'pending_owner_email', s.pending_owner_email
              ) end as shops
       from public.partner_applications pa
       left join public.shops s on s.id = pa.shop_id
       where lower(pa.email) = lower($1)
       order by pa.created_at desc`,
      [email]
    );
    return { data, error: null };
  } catch (error) {
    console.error("[partner-applications.listMine]", error);
    return { data: [], error: error instanceof Error ? error : new Error("query failed") };
  }
}

export async function listAllPartnerApplications() {
  try {
    return {
      data: await queryRows<PartnerApplication>(
        `select * from public.partner_applications order by created_at desc`
      ),
      error: null as Error | null
    };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error : new Error("query failed") };
  }
}
