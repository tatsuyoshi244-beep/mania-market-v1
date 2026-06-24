import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

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
  supabase: SupabaseClient<Database>,
  shopId: string
): Promise<ShopAnalyticsSummary> {
  const { data, error } = await supabase.rpc("seller_shop_analytics", { target_shop_id: shopId });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    return EMPTY_ANALYTICS;
  }

  const payload = data as Record<string, Json | undefined>;
  return {
    viewsToday: asNumber(payload.views_today),
    views7d: asNumber(payload.views_7d),
    views30d: asNumber(payload.views_30d),
    topProducts: parseTopProducts(payload.top_products),
    topPages: parseTopPages(payload.top_pages)
  };
}