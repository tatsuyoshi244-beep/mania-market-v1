import type { Json } from "@/types/database";
import { queryOne } from "@/lib/neon/db";

export type TopProductRow = {
  product_id: string;
  name: string;
  views: number;
};

export type TopPageRow = {
  page_type: string;
  label: string;
  views: number;
};

export type ShopAnalyticsSummary = {
  viewsToday: number;
  views7d: number;
  views30d: number;
  topProducts: TopProductRow[];
  topPages: TopPageRow[];
};

const EMPTY_ANALYTICS: ShopAnalyticsSummary = {
  viewsToday: 0,
  views7d: 0,
  views30d: 0,
  topProducts: [],
  topPages: []
};

function asNumber(value: Json | undefined) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function parseTopProducts(value: Json | undefined): TopProductRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) return null;
      const item = row as Record<string, Json | undefined>;
      if (typeof item.product_id !== "string" || typeof item.name !== "string") return null;
      return {
        product_id: item.product_id,
        name: item.name,
        views: asNumber(item.views)
      };
    })
    .filter((row): row is TopProductRow => row !== null);
}

function parseTopPages(value: Json | undefined): TopPageRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) return null;
      const item = row as Record<string, Json | undefined>;
      if (typeof item.page_type !== "string" || typeof item.label !== "string") return null;
      return {
        page_type: item.page_type,
        label: item.label,
        views: asNumber(item.views)
      };
    })
    .filter((row): row is TopPageRow => row !== null);
}

export async function getShopAnalyticsSummary(
  _legacyClient: unknown,
  shopId: string
): Promise<ShopAnalyticsSummary> {
  const payload = await queryOne<Record<string, Json | undefined>>(
    `select
      (select count(*)::int from public.analytics_events where shop_id=$1::uuid
        and event_type in ('shop_view','product_view') and created_at >= date_trunc('day', now())) as views_today,
      (select count(*)::int from public.analytics_events where shop_id=$1::uuid
        and event_type in ('shop_view','product_view') and created_at >= now()-interval '7 days') as views_7d,
      (select count(*)::int from public.analytics_events where shop_id=$1::uuid
        and event_type in ('shop_view','product_view') and created_at >= now()-interval '30 days') as views_30d,
      coalesce((select jsonb_agg(t) from (select p.id::text as product_id,p.name,count(*)::int as views
        from public.analytics_events ae join public.products p on p.id=ae.product_id
        where ae.shop_id=$1::uuid and ae.event_type='product_view' and ae.created_at>=now()-interval '30 days'
        group by p.id,p.name order by views desc limit 5) t),'[]'::jsonb) as top_products,
      coalesce((select jsonb_agg(t) from (select 'product'::text as page_type,
        coalesce(p.name,'商品ページ')::text as label,count(*)::int as views
        from public.analytics_events ae left join public.products p on p.id=ae.product_id
        where ae.shop_id=$1::uuid and ae.event_type='product_view' and ae.created_at>=now()-interval '30 days'
        group by p.name order by views desc limit 5) t),'[]'::jsonb) as top_pages`,
    [shopId]
  );
  if (!payload) return EMPTY_ANALYTICS;
  return {
    viewsToday: asNumber(payload.views_today),
    views7d: asNumber(payload.views_7d),
    views30d: asNumber(payload.views_30d),
    topProducts: parseTopProducts(payload.top_products),
    topPages: parseTopPages(payload.top_pages)
  };
}
