import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { hintedCategorySlugs } from "@/lib/guide/keywords";
import type { GuideCategoryRec, GuideProductRec, GuideRecommendations, GuideShopRec } from "@/types/guide";

function orIlike(fields: string[], token: string) {
  return fields.map((field) => `${field}.ilike.%${token}%`).join(",");
}

function scoreText(text: string | null | undefined, keywords: string[]) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  return keywords.reduce((sum, kw) => (lower.includes(kw) ? sum + 2 : sum), 0);
}

function rankByScore<T extends { score: number }>(items: T[], limit: number) {
  return items.sort((a, b) => b.score - a.score).slice(0, limit).map(({ score: _score, ...rest }) => rest);
}

export async function searchGuideCatalog(
  supabase: SupabaseClient<Database>,
  query: string,
  keywords: string[]
): Promise<GuideRecommendations> {
  const tokens = keywords.length > 0 ? keywords : [query.trim()].filter(Boolean);
  const hintedSlugs = hintedCategorySlugs(tokens);

  const [categoriesResult, shopsResult, productsResult, tagProductIds] = await Promise.all([
    searchCategories(supabase, tokens, hintedSlugs),
    searchShops(supabase, tokens),
    searchProducts(supabase, tokens),
    searchProductIdsByTags(supabase, tokens)
  ]);

  let products = productsResult;
  if (tagProductIds.length > 0) {
    const tagged = await fetchProductsByIds(supabase, tagProductIds);
    const seen = new Set(products.map((p) => p.id));
    products = [...products, ...tagged.filter((p) => !seen.has(p.id))];
  }

  return {
    categories: categoriesResult.slice(0, 3),
    shops: shopsResult.slice(0, 3),
    products: products.slice(0, 4)
  };
}

async function searchCategories(
  supabase: SupabaseClient<Database>,
  tokens: string[],
  hintedSlugs: string[]
) {
  const { data, error } = await supabase
    .from("categories")
    .select("id,slug,name,description,sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data) return [] as GuideCategoryRec[];

  const scored = data.map((row) => {
    let score = scoreText(row.name, tokens) * 2 + scoreText(row.description, tokens) + scoreText(row.slug, tokens);
    if (hintedSlugs.includes(row.slug)) score += 6;
    return { ...row, score };
  });

  const filtered = scored.filter((row) => row.score > 0);
  const pool = filtered.length > 0 ? filtered : scored.slice(0, 3).map((row) => ({ ...row, score: row.score + 1 }));
  return rankByScore(pool, 3) as GuideCategoryRec[];
}

async function searchShops(supabase: SupabaseClient<Database>, tokens: string[]) {
  let query = supabase
    .from("shops")
    .select("id,slug,name,description,logo_url")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(24);

  if (tokens.length > 0) {
    const orFilter = tokens.map((token) => orIlike(["name", "description"], token)).join(",");
    query = query.or(orFilter);
  }

  const { data, error } = await query;
  if (error || !data) return [] as GuideShopRec[];

  const scored = data.map((row) => ({
    ...row,
    score: scoreText(row.name, tokens) * 2 + scoreText(row.description, tokens)
  }));

  const pool = scored.filter((row) => row.score > 0);
  const fallback = scored.slice(0, 3);
  return rankByScore(pool.length > 0 ? pool : fallback.map((r) => ({ ...r, score: r.score + 1 })), 3) as GuideShopRec[];
}

async function searchProducts(supabase: SupabaseClient<Database>, tokens: string[]) {
  let query = supabase
    .from("products")
    .select("id,name,description,price_label,image_url,shops(name,slug)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(24);

  if (tokens.length > 0) {
    const orFilter = tokens.map((token) => orIlike(["name", "description"], token)).join(",");
    query = query.or(orFilter);
  }

  const { data, error } = await query;
  if (error || !data) return [] as GuideProductRec[];

  const scored = data.map((row) => {
    const shop = Array.isArray(row.shops) ? row.shops[0] : row.shops;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price_label: row.price_label,
      image_url: row.image_url,
      shop_name: shop?.name ?? null,
      shop_slug: shop?.slug ?? null,
      score: scoreText(row.name, tokens) * 2 + scoreText(row.description, tokens)
    };
  });

  const pool = scored.filter((row) => row.score > 0);
  const fallback = scored.slice(0, 4);
  return rankByScore(pool.length > 0 ? pool : fallback.map((r) => ({ ...r, score: r.score + 1 })), 4) as GuideProductRec[];
}

async function searchProductIdsByTags(supabase: SupabaseClient<Database>, tokens: string[]) {
  if (tokens.length === 0) return [] as string[];

  const orFilter = tokens.map((token) => `tag.ilike.%${token}%`).join(",");
  const { data, error } = await supabase.from("product_tags").select("product_id").or(orFilter).limit(20);
  if (error || !data) return [];
  return [...new Set(data.map((row) => row.product_id))];
}

async function fetchProductsByIds(supabase: SupabaseClient<Database>, ids: string[]) {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,description,price_label,image_url,shops(name,slug)")
    .in("id", ids)
    .eq("status", "active")
    .limit(8);

  if (error || !data) return [] as GuideProductRec[];

  return data.map((row) => {
    const shop = Array.isArray(row.shops) ? row.shops[0] : row.shops;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price_label: row.price_label,
      image_url: row.image_url,
      shop_name: shop?.name ?? null,
      shop_slug: shop?.slug ?? null
    };
  });
}