import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function listCategories(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("categories")
    .select("id,slug,name,description")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function parseCategoryIds(formData: FormData): string[] {
  return [
    ...new Set(
      formData
        .getAll("category_ids")
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  ];
}