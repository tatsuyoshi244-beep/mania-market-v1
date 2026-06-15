import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { queryFailure, querySuccess, type QueryResult } from "@/lib/supabase/errors";

const categorySelect = "id,slug,name,description,sort_order";

export async function listAllCategories(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("categories")
    .select(categorySelect)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[categories.listAllCategories]", JSON.stringify(error, null, 2));
    return [];
  }
  return data ?? [];
}

export async function getPopularCategories(
  supabase: SupabaseClient<Database>,
  limit = 6
): Promise<QueryResult<Array<{ id: string; slug: string; name: string; description: string | null; sort_order: number }>>> {
  const source = "categories.getPopularCategories";
  try {
    const { data, error } = await supabase
      .from("categories")
      .select(categorySelect)
      .order("sort_order", { ascending: true })
      .limit(limit);

    if (error) return queryFailure(source, error, []);
    return querySuccess(source, data ?? []);
  } catch (error) {
    return queryFailure(source, error, []);
  }
}

export async function getCategoryShopCounts(
  supabase: SupabaseClient<Database>
): Promise<QueryResult<Map<string, number>>> {
  const source = "shop_categories.getCategoryShopCounts";
  const fallback = new Map<string, number>();
  try {
    const { data, error } = await supabase.from("shop_categories").select("category_id");
    if (error) return queryFailure(source, error, fallback);

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
    }
    return querySuccess(source, counts);
  } catch (error) {
    return queryFailure(source, error, fallback);
  }
}

export async function getCategoryBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
) {
  const { data, error } = await supabase
    .from("categories")
    .select(categorySelect)
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data;
}

export async function getShopIdsForCategory(
  supabase: SupabaseClient<Database>,
  categoryId: string
) {
  const { data, error } = await supabase
    .from("shop_categories")
    .select("shop_id")
    .eq("category_id", categoryId);

  if (error) {
    console.error("[shop_categories.getShopIdsForCategory]", JSON.stringify(error, null, 2));
    return [];
  }
  return (data ?? []).map((row) => row.shop_id);
}