import type { SupabaseClient } from "@supabase/supabase-js";
import { buildConciergeActions } from "@/lib/concierge/actions";
import { diagnoseShop } from "@/lib/concierge/diagnosis";
import { buildMarketingSuggestions } from "@/lib/concierge/marketing";
import { asRelatedList } from "@/lib/utils";
import type { ConciergeContext, ConciergePayload } from "@/types/concierge";
import type { Database } from "@/types/database";

export async function loadConciergeContext(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ConciergeContext> {
  const { data: shop } = await supabase.from("shops").select("*").eq("owner_id", userId).maybeSingle();

  let shopCategoryNames: string[] = [];
  let shopCategorySlugs: string[] = [];

  if (shop?.id) {
    const { data: shopCategories } = await supabase
      .from("shop_categories")
      .select("categories(name,slug)")
      .eq("shop_id", shop.id);

    for (const row of shopCategories ?? []) {
      const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
      if (category?.name) shopCategoryNames.push(category.name);
      if (category?.slug) shopCategorySlugs.push(category.slug);
    }
  }

  const { data: products } = await supabase
    .from("products")
    .select("id,name,description,price_label,image_url,status,product_tags(tag)")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  const mappedProducts = (products ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price_label: product.price_label,
    image_url: product.image_url,
    status: product.status,
    tags: asRelatedList(product.product_tags).map((row) => row.tag)
  }));

  return {
    shop: shop
      ? {
          id: shop.id,
          slug: shop.slug,
          name: shop.name,
          description: shop.description,
          website_url: shop.website_url,
          logo_url: shop.logo_url,
          cover_image_url: shop.cover_image_url,
          twitter_url: shop.twitter_url,
          instagram_url: shop.instagram_url,
          is_published: shop.is_published
        }
      : null,
    shopCategoryNames,
    shopCategorySlugs,
    products: mappedProducts,
    activeProductCount: mappedProducts.filter((p) => p.status === "active").length
  };
}

export async function fetchPopularTags(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.from("product_tags").select("tag").limit(500);
  if (error || !data) return [] as Array<{ tag: string; count: number }>;

  const counts = new Map<string, number>();
  for (const row of data) {
    const tag = row.tag.toLowerCase();
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export async function loadConciergePayload(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ConciergePayload> {
  const context = await loadConciergeContext(supabase, userId);
  const diagnosis = diagnoseShop(context);
  const actions = buildConciergeActions(context, diagnosis);
  const popularTags = await fetchPopularTags(supabase);
  const marketing = buildMarketingSuggestions(context, popularTags);

  return { context, diagnosis, actions, marketing };
}