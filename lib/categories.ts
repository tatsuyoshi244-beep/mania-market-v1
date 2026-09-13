import { queryRows } from "@/lib/neon/db";

export async function listCategories() {
  return queryRows<{ id: string; slug: string; name: string; description: string | null }>(
    `select id::text, slug, name, description
     from public.categories order by sort_order asc, name asc`
  );
}

export function parseCategoryIds(formData: FormData): string[] {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return [
    ...new Set(
      formData
        .getAll("category_ids")
        .filter((value): value is string => typeof value === "string" && uuidPattern.test(value))
    )
  ];
}
