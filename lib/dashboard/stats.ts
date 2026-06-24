import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ProductLimitInfo } from "@/types/auth";
import { PLANS } from "@/lib/plans";
import { getProductLimitInfo } from "@/lib/products";

export type ShopStats = {
  followerCount: number;
  shopFavoriteCount: number;
  productFavoriteCount: number;
  shopViewCount: number;
  productViewCount: number;
  totalViewCount: number;
};

export type DashboardSummary = {
  shopName: string;
  shopSlug: string;
  isPublished: boolean;
  planName: string;
  limitInfo: ProductLimitInfo;
  stats: ShopStats;
};

const EMPTY_STATS: ShopStats = {
  followerCount: 0,
  shopFavoriteCount: 0,
  productFavoriteCount: 0,
  shopViewCount: 0,
  productViewCount: 0,
  totalViewCount: 0
};

export async function getShopStats(
  supabase: SupabaseClient<Database>,
  shopId: string
): Promise<ShopStats> {
  const { data, error } = await supabase.rpc("seller_shop_stats", { target_shop_id: shopId });
  if (error || !data || data.length === 0) return EMPTY_STATS;

  const row = data[0];
  return {
    followerCount: Number(row.follower_count ?? 0),
    shopFavoriteCount: Number(row.shop_favorite_count ?? 0),
    productFavoriteCount: Number(row.product_favorite_count ?? 0),
    shopViewCount: Number(row.shop_view_count ?? 0),
    productViewCount: Number(row.product_view_count ?? 0),
    totalViewCount: Number(row.total_view_count ?? 0)
  };
}

export async function getDashboardSummary(
  supabase: SupabaseClient<Database>,
  userId: string,
  shop: { id: string; name: string; slug: string; is_published: boolean }
): Promise<DashboardSummary> {
  const [limitInfo, stats] = await Promise.all([
    getProductLimitInfo(supabase, userId),
    getShopStats(supabase, shop.id)
  ]);

  return {
    shopName: shop.name,
    shopSlug: shop.slug,
    isPublished: shop.is_published,
    planName: PLANS[limitInfo.planKey].name,
    limitInfo,
    stats
  };
}