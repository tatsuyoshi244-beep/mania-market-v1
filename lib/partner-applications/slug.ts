import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function slugifyShopName(name: string) {
  const ascii = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (ascii.length >= 3) return ascii.slice(0, 48);
  return `shop-${Date.now().toString(36)}`;
}

export async function ensureUniqueShopSlug(
  supabase: SupabaseClient<Database>,
  baseSlug: string
) {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { data } = await supabase.from("shops").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}
