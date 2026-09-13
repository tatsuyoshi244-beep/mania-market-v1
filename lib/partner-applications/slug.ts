import { queryOne } from "@/lib/neon/db";

export function slugifyShopName(name: string) {
  const ascii = name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (ascii.length >= 3) return ascii.slice(0, 48);
  return `shop-${Date.now().toString(36)}`;
}

export async function ensureUniqueShopSlug(baseSlug: string) {
  let slug = baseSlug;
  let suffix = 2;
  while (await queryOne("select id from public.shops where slug=$1", [slug])) {
    slug = `${baseSlug}-${suffix++}`;
  }
  return slug;
}
