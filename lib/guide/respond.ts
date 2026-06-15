import type { GuideChatResponse, GuideRecommendations } from "@/types/guide";

export const EXTERNAL_PURCHASE_DISCLAIMER =
  "Mania Market では商品の購入・決済は行いません。気になる商品は各ショップの公式サイトでご購入ください。サイト内での購入保証や返品対応はありません。";

export function buildGuideResponse(query: string, recommendations: GuideRecommendations): GuideChatResponse {
  const { categories, shops, products } = recommendations;

  const parts: string[] = [];

  if (categories.length > 0) {
    const names = categories.map((c) => `「${c.name}」`).join("、");
    parts.push(`まずはジャンルから——${names}あたりが、あなたの関心に近いかもしれません。`);
  }

  if (shops.length > 0) {
    const names = shops.map((s) => `「${s.name}」`).join("、");
    parts.push(`熱量の高い専門店として、${names}をチェックしてみてください。`);
  }

  if (products.length > 0) {
    const names = products.map((p) => `「${p.name}」`).join("、");
    parts.push(`具体的な一品なら、${names}が候補です。`);
  }

  let message: string;
  if (parts.length === 0) {
    message =
      "まだデータが少ないようです。ジャンル一覧から眺めてみるのもおすすめです。興味のあるキーワード（例：フィルムカメラ、レトロゲーム）をもう少し具体的に教えてください。";
  } else {
    message = `「${query}」について、Mania Market 内で見つけた発見候補です。\n\n${parts.join("\n\n")}`;
  }

  message += `\n\n※ 購入は各ショップの外部サイトで行われます。`;

  return {
    message,
    disclaimer: EXTERNAL_PURCHASE_DISCLAIMER,
    recommendations
  };
}