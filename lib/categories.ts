import { queryRows } from "@/lib/neon/db";

export async function listCategories(_legacyClient?: unknown) {
  return queryRows<{ id: string; slug: string; name: string; description: string | null }>(
    `select id::text, slug, name, description
     from public.categories order by sort_order asc, name asc`
  );
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
