import type { ProductLimitInfo } from "@/types/auth";
import { PLANS } from "@/lib/plans";
import { getProductLimitInfo } from "@/lib/products";
import { queryOne } from "@/lib/neon/db";

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
  _legacyClient: unknown,
  shopId: string
): Promise<ShopStats> {
  const row = await queryOne<Record<keyof ShopStats, number>>(
    `select
      (select count(*)::int from public.follows where shop_id = $1::uuid) as "followerCount",
      (select count(*)::int from public.favorites where shop_id = $1::uuid) as "shopFavoriteCount",
      (select count(*)::int from public.favorites f join public.products p on p.id = f.product_id
        where p.shop_id = $1::uuid) as "productFavoriteCount",
      (select count(*)::int from public.analytics_events where shop_id = $1::uuid and event_type = 'shop_view') as "shopViewCount",
      (select count(*)::int from public.analytics_events where shop_id = $1::uuid and event_type = 'product_view') as "productViewCount",
      (select count(*)::int from public.analytics_events where shop_id = $1::uuid
        and event_type in ('shop_view','product_view')) as "totalViewCount"`,
    [shopId]
  );
  if (!row) return EMPTY_STATS;
  return {
    followerCount: Number(row.followerCount ?? 0), shopFavoriteCount: Number(row.shopFavoriteCount ?? 0),
    productFavoriteCount: Number(row.productFavoriteCount ?? 0), shopViewCount: Number(row.shopViewCount ?? 0),
    productViewCount: Number(row.productViewCount ?? 0), totalViewCount: Number(row.totalViewCount ?? 0)
  };
}

export async function getDashboardSummary(
  legacyClient: unknown,
  userId: string,
  shop: { id: string; name: string; slug: string; is_published: boolean }
): Promise<DashboardSummary> {
  const [limitInfo, stats] = await Promise.all([
    getProductLimitInfo(legacyClient, userId),
    getShopStats(legacyClient, shop.id)
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
