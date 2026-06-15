import type { ConciergeContext, MarketingSuggestions, SeasonalTrend } from "@/types/concierge";

const SEASONAL_BY_MONTH: Record<number, SeasonalTrend[]> = {
  0: [{ title: "新年・初売り", description: "限定品・未開封品の訴求が刺さりやすい時期", tags: ["limited", "newyear", "vintage"] }],
  1: [{ title: "冬物ヴィンテージ", description: "アウトドアギア・防寒アイテムの需要", tags: ["winter", "outdoor", "vintage"] }],
  2: [{ title: "春のカメラシーズン", description: "フィルム・散歩カメラの投稿が増える時期", tags: ["film", "camera", "spring"] }],
  3: [{ title: "ゴールデンウィーク前", description: "レジャー・ゲーム・コレクション訴求", tags: ["retro", "games", "collectible"] }],
  4: [{ title: "初夏キャンプ", description: "アウトドアギアとヴィンテージ道具の季節", tags: ["camp", "outdoor", "gear"] }],
  5: [{ title: "梅雨のインドア", description: "レコード・ゲーム・フィギュアの室内趣味", tags: ["analog", "indoor", "retro"] }],
  6: [{ title: "夏フェス・音楽", description: "アナログ音楽・レコードのトレンド", tags: ["vinyl", "audio", "summer"] }],
  7: [{ title: "夏休みコレクション", description: "トイ・レトロゲームの需要ピーク", tags: ["toys", "games", "nostalgia"] }],
  8: [{ title: "秋のヴィンテージファッション", description: "デザイナーヴィンテージの季節", tags: ["fashion", "designer", "autumn"] }],
  9: [{ title: "ハロウィン・レア物", description: "限定・希少アイテムの訴求", tags: ["rare", "limited", "halloween"] }],
  10: [{ title: "ブラックフライデー前", description: "外部サイトへの導線強化の好機", tags: ["sale", "deal", "vintage"] }],
  11: [{ title: "年末ギフト", description: "マニア向けギフト・プレミアム商品", tags: ["gift", "premium", "collector"] }]
};

const CATEGORY_RELATED: Record<string, string[]> = {
  "vintage-camera": ["analog-audio", "designer-vintage"],
  "collectible-toys": ["retro-games", "designer-vintage"],
  "retro-games": ["collectible-toys", "analog-audio"],
  "designer-vintage": ["vintage-camera", "outdoor-gear"],
  "analog-audio": ["vintage-camera", "retro-games"],
  "outdoor-gear": ["designer-vintage", "vintage-camera"]
};

const CATEGORY_LABELS: Record<string, string> = {
  "vintage-camera": "ヴィンテージカメラ",
  "collectible-toys": "コレクタブルトイ",
  "retro-games": "レトロゲーム",
  "designer-vintage": "デザイナーヴィンテージ",
  "analog-audio": "アナログオーディオ",
  "outdoor-gear": "アウトドアギア"
};

export function buildMarketingSuggestions(
  context: ConciergeContext,
  popularTags: Array<{ tag: string; count: number }>
): MarketingSuggestions {
  const relatedSlugs = new Set<string>();
  for (const slug of context.shopCategorySlugs) {
    for (const related of CATEGORY_RELATED[slug] ?? []) {
      if (!context.shopCategorySlugs.includes(related)) relatedSlugs.add(related);
    }
  }

  const relatedCategories = [...relatedSlugs].slice(0, 3).map((slug) => ({
    slug,
    name: CATEGORY_LABELS[slug] ?? slug,
    reason: "あなたのショップカテゴリと相性の良いジャンルです"
  }));

  const month = new Date().getMonth();
  const seasonalTrends = SEASONAL_BY_MONTH[month] ?? SEASONAL_BY_MONTH[0];

  return {
    popularTags: popularTags.slice(0, 8),
    relatedCategories,
    seasonalTrends
  };
}