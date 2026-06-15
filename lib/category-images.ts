/** LP / カテゴリ表示用サンプル写真（Unsplash） */
const CATEGORY_IMAGES: Record<string, string> = {
  "vintage-camera":
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
  "collectible-toys":
    "https://images.unsplash.com/photo-1558060370-d644478cb6bf?auto=format&fit=crop&w=900&q=80",
  "retro-games":
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",
  "designer-vintage":
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80",
  "analog-audio":
    "https://images.unsplash.com/photo-1483412033650-f1014d9bbaad?auto=format&fit=crop&w=900&q=80",
  "outdoor-gear":
    "https://images.unsplash.com/photo-1478131143081-80f7f84bca02?auto=format&fit=crop&w=900&q=80"
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80";

export function getCategoryImageUrl(slug: string) {
  return CATEGORY_IMAGES[slug] ?? FALLBACK_IMAGE;
}