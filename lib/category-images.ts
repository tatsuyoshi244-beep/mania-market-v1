/** カテゴリ表示用のローカル画像。外部サービスの停止やURL変更に影響されない。 */
const CATEGORY_IMAGES: Record<string, string> = {
  vintage: "/images/categories/vintage.jpg",
  craft: "/images/categories/craft.jpg",
  outdoor: "/images/categories/outdoor.jpg",
  music: "/images/categories/music.jpg",
  collectibles: "/images/categories/collectibles.jpg",
  food: "/images/categories/food.jpg",
  web: "/images/categories/web.jpg",
  ai: "/images/categories/ai.jpg"
};

const FALLBACK_IMAGE = "/images/categories/vintage.jpg";

export function getCategoryImageUrl(slug: string) {
  return CATEGORY_IMAGES[slug] ?? FALLBACK_IMAGE;
}
