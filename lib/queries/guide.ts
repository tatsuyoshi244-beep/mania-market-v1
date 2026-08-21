import { hintedCategorySlugs } from "@/lib/guide/keywords";
import { queryRows } from "@/lib/neon/db";
import type { GuideCategoryRec, GuideProductRec, GuideRecommendations, GuideShopRec } from "@/types/guide";

function scoreText(text: string | null | undefined, keywords: string[]) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  return keywords.reduce((sum, keyword) => (lower.includes(keyword.toLowerCase()) ? sum + 2 : sum), 0);
}

function rankByScore<T extends { score: number }>(items: T[], limit: number) {
  return items.sort((a, b) => b.score - a.score).slice(0, limit).map(({ score: _score, ...rest }) => rest);
}

type CategorySearchRow = GuideCategoryRec & { sort_order: number };
type ShopSearchRow = GuideShopRec & { created_at: string };
type ProductSearchRow = GuideProductRec & { created_at: string; tags: string[] };

export async function searchGuideCatalog(
  _legacyClient: unknown,
  query: string,
  keywords: string[]
): Promise<GuideRecommendations> {
  const tokens = keywords.length > 0 ? keywords : [query.trim()].filter(Boolean);
  const hintedSlugs = hintedCategorySlugs(tokens);

  const [categories, shops, products] = await Promise.all([
    queryRows<CategorySearchRow>(
      `select id::text, slug, name, description, sort_order
       from public.categories order by sort_order asc, name asc`
    ),
    queryRows<ShopSearchRow>(
      `select id::text, slug, name, description, logo_url, created_at::text
       from public.shops where is_published = true
       order by created_at desc limit 24`
    ),
    queryRows<ProductSearchRow>(
      `select p.id::text, p.name, p.description, p.price_label, p.image_url,
              s.name as shop_name, s.slug as shop_slug, p.created_at::text,
              coalesce(array_agg(pt.tag) filter (where pt.tag is not null), '{}') as tags
       from public.products p
       left join public.shops s on s.id = p.shop_id
       left join public.product_tags pt on pt.product_id = p.id
       where p.status = 'active'
       group by p.id, s.name, s.slug
       order by p.created_at desc limit 24`
    )
  ]);

  const scoredCategories = categories.map((row) => ({
    ...row,
    score: scoreText(row.name, tokens) * 2 + scoreText(row.description, tokens) +
      scoreText(row.slug, tokens) + (hintedSlugs.includes(row.slug) ? 6 : 0)
  }));
  const scoredShops = shops.map((row) => ({
    ...row,
    score: scoreText(row.name, tokens) * 2 + scoreText(row.description, tokens)
  }));
  const scoredProducts = products.map((row) => ({
    ...row,
    score: scoreText(row.name, tokens) * 2 + scoreText(row.description, tokens) +
      row.tags.reduce((sum, tag) => sum + scoreText(tag, tokens), 0)
  }));
  const matchedCategories = scoredCategories.filter((row) => row.score > 0);
  const matchedShops = scoredShops.filter((row) => row.score > 0);
  const matchedProducts = scoredProducts.filter((row) => row.score > 0);

  return {
    categories: rankByScore(matchedCategories.length ? matchedCategories : scoredCategories.map((row) => ({ ...row, score: 1 })), 3),
    shops: rankByScore(matchedShops.length ? matchedShops : scoredShops.map((row) => ({ ...row, score: 1 })), 3),
    products: rankByScore(matchedProducts.length ? matchedProducts : scoredProducts.map((row) => ({ ...row, score: 1 })), 4)
  };
}
