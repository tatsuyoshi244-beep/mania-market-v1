import { buildConciergeActions } from "@/lib/concierge/actions";
import { diagnoseShop } from "@/lib/concierge/diagnosis";
import { buildMarketingSuggestions } from "@/lib/concierge/marketing";
import { queryOne, queryRows } from "@/lib/neon/db";
import type { ConciergeContext, ConciergePayload } from "@/types/concierge";

export async function loadConciergeContext(userId: string): Promise<ConciergeContext> {
  const shop = await queryOne<NonNullable<ConciergeContext["shop"]> & { id: string }>(
    `select id::text, slug, name, description, website_url, logo_url, cover_image_url,
            twitter_url, instagram_url, is_published
     from public.shops where owner_id=$1 limit 1`,
    [userId]
  );

  const categories = shop
    ? await queryRows<{ name: string; slug: string }>(
        `select c.name,c.slug from public.shop_categories sc
         join public.categories c on c.id=sc.category_id where sc.shop_id=$1::uuid`,
        [shop.id]
      )
    : [];

  const products = await queryRows<ConciergeContext["products"][number]>(
    `select p.id::text,p.name,p.description,p.price_label,p.image_url,p.status,
            coalesce(array_agg(pt.tag) filter(where pt.tag is not null),'{}') as tags
     from public.products p left join public.product_tags pt on pt.product_id=p.id
     where p.seller_id=$1 group by p.id order by p.created_at desc`,
    [userId]
  );

  return {
    shop,
    shopCategoryNames: categories.map((category) => category.name),
    shopCategorySlugs: categories.map((category) => category.slug),
    products,
    activeProductCount: products.filter((product) => product.status === "active").length
  };
}

export async function fetchPopularTags() {
  return queryRows<{ tag: string; count: number }>(
    `select lower(tag) as tag,count(*)::int as count from public.product_tags
     group by lower(tag) order by count desc limit 100`
  );
}

export async function loadConciergePayload(userId: string): Promise<ConciergePayload> {
  const context = await loadConciergeContext(userId);
  const diagnosis = diagnoseShop(context);
  const actions = buildConciergeActions(context, diagnosis);
  const popularTags = await fetchPopularTags();
  const marketing = buildMarketingSuggestions(context, popularTags);
  return { context, diagnosis, actions, marketing };
}
