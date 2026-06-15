import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { pageRange, SHOP_PAGE_SIZE, totalPages } from "@/lib/pagination";
import { getCategoryBySlug, getShopIdsForCategory } from "@/lib/queries/categories";
import { queryFailure, querySuccess, type QueryResult } from "@/lib/supabase/errors";

const shopCardSelectBasic =
  "id,slug,name,description,website_url,is_published,created_at,shop_categories(categories(name,slug))";

const shopCardSelectBranding =
  "id,slug,name,description,logo_url,cover_image_url,website_url,twitter_url,instagram_url,is_published,created_at,shop_categories(categories(name,slug))";

export type HomeShop = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  is_published: boolean;
  created_at: string;
  shop_categories?:
    | Array<{ categories: { name: string; slug: string } | null }>
    | { categories: { name: string; slug: string } | null };
};

function isMissingColumnError(error: PostgrestError) {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "42703" || message.includes("does not exist") || message.includes("column");
}

async function fetchPublishedShops(
  supabase: SupabaseClient<Database>,
  limit: number
): Promise<{ data: HomeShop[]; error: PostgrestError | null }> {
  const branded = await supabase
    .from("shops")
    .select(shopCardSelectBranding)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!branded.error) {
    return { data: (branded.data ?? []) as HomeShop[], error: null };
  }

  if (isMissingColumnError(branded.error)) {
    const basic = await supabase
      .from("shops")
      .select(shopCardSelectBasic)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    return {
      data: (basic.data ?? []) as HomeShop[],
      error: basic.error
    };
  }

  return { data: [], error: branded.error };
}

export async function getPopularShops(
  supabase: SupabaseClient<Database>,
  limit = 6
): Promise<QueryResult<HomeShop[]>> {
  const source = "shops.getPopularShops";
  try {
    const { data, error } = await fetchPublishedShops(supabase, limit);
    if (error) return queryFailure(source, error, []);
    return querySuccess(source, data);
  } catch (error) {
    return queryFailure(source, error, []);
  }
}

export async function listShops(
  supabase: SupabaseClient<Database>,
  options: {
    page: number;
    query?: string;
    categorySlug?: string;
  }
) {
  const { page, query, categorySlug } = options;
  const { from, to } = pageRange(page, SHOP_PAGE_SIZE);

  let shopIds: string[] | null = null;
  if (categorySlug) {
    const category = await getCategoryBySlug(supabase, categorySlug);
    if (!category) {
      return { shops: [], total: 0, page, totalPages: 1 };
    }
    shopIds = await getShopIdsForCategory(supabase, category.id);
    if (shopIds.length === 0) {
      return { shops: [], total: 0, page, totalPages: 1 };
    }
  }

  let dbQuery = supabase
    .from("shops")
    .select(shopCardSelectBranding, { count: "exact" })
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (shopIds) dbQuery = dbQuery.in("id", shopIds);
  if (query) dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);

  const primary = await dbQuery;

  if (primary.error) {
    console.error("[shops.listShops]", JSON.stringify(primary.error, null, 2));
    return { shops: [], total: 0, page, totalPages: 1 };
  }

  const total = primary.count ?? 0;
  return {
    shops: (primary.data ?? []) as HomeShop[],
    total,
    page,
    totalPages: totalPages(total, SHOP_PAGE_SIZE)
  };
}

export async function getShopBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
) {
  const branded = await supabase
    .from("shops")
    .select(shopCardSelectBranding)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!branded.error) return branded.data as HomeShop;

  if (isMissingColumnError(branded.error)) {
    const basic = await supabase
      .from("shops")
      .select(shopCardSelectBasic)
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (basic.error) return null;
    return basic.data as HomeShop;
  }

  return null;
}

export async function listShopsByCategory(
  supabase: SupabaseClient<Database>,
  categoryId: string
) {
  const shopIds = await getShopIdsForCategory(supabase, categoryId);
  if (shopIds.length === 0) return [];

  const branded = await supabase
    .from("shops")
    .select(shopCardSelectBranding)
    .in("id", shopIds)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (!branded.error) return (branded.data ?? []) as HomeShop[];

  if (isMissingColumnError(branded.error)) {
    const basic = await supabase
      .from("shops")
      .select(shopCardSelectBasic)
      .in("id", shopIds)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (basic.error) {
      console.error("[shops.listShopsByCategory]", JSON.stringify(basic.error, null, 2));
      return [];
    }
    return (basic.data ?? []) as HomeShop[];
  }

  console.error("[shops.listShopsByCategory]", JSON.stringify(branded.error, null, 2));
  return [];
}