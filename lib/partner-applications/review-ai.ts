export type PartnerApplicationReviewInput = {
  shop_name: string;
  owner_name: string;
  email: string;
  region?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  x_url?: string | null;
  description?: string | null;
  mission?: string | null;
  target_user?: string | null;
  categories: string[];
};

export type AiRecommendationLabel = "承認推奨" | "要確認" | "再審査推奨";

export type ManiaReviewAiResult = {
  ai_score: number;
  ai_specialty: number;
  ai_originality: number;
  ai_passion: number;
  ai_safety: number;
  ai_recommendation: AiRecommendationLabel;
  ai_comment: string;
  ai_checked_at: string;
};

const PASSION_WORDS = [
  "こだわり",
  "熱量",
  "マニア",
  "愛",
  "情熱",
  "厳選",
  "専門",
  "探求",
  "コレクション",
  "想い"
];

const SPECIALTY_WORDS = [
  "専門",
  "ヴィンテージ",
  "レア",
  "限定",
  "一点物",
  "鑑定",
  "知識",
  "経験",
  "セレクト"
];

const UNSAFE_WORDS = [
  "偽物",
  "海賊版",
  "コピー品",
  "投資",
  "儲かる",
  "副業",
  "マルチ",
  "mlm",
  "即日",
  "保証します",
  "返金保証"
];

const GENERIC_SHOP_NAMES = ["shop", "store", "ショップ", "ストア", "test", "サンプル"];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function countKeywordHits(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.reduce((sum, word) => (lower.includes(word.toLowerCase()) ? sum + 1 : sum), 0);
}

function scoreSpecialty(input: PartnerApplicationReviewInput) {
  let score = 0;
  const description = input.description?.trim() ?? "";
  const descLen = description.length;

  if (input.categories.length >= 1) score += 8;
  if (input.categories.length >= 2) score += 4;
  if (input.categories.length >= 3) score += 3;
  if (descLen >= 50) score += 4;
  if (descLen >= 150) score += 4;
  if (descLen >= 300) score += 4;
  if (input.region?.trim()) score += 2;
  score += Math.min(4, countKeywordHits(description, SPECIALTY_WORDS) * 2);

  return clamp(score, 0, 25);
}

function scoreOriginality(input: PartnerApplicationReviewInput) {
  let score = 0;
  const mission = input.mission?.trim() ?? "";
  const target = input.target_user?.trim() ?? "";
  const shopName = input.shop_name.trim().toLowerCase();

  if (mission.length >= 20) score += 8;
  else if (mission.length > 0) score += 4;

  if (target.length >= 10) score += 6;
  else if (target.length > 0) score += 3;

  if (input.website_url?.trim()) score += 5;
  if (input.instagram_url?.trim()) score += 3;
  if (input.x_url?.trim()) score += 3;

  const isGeneric = GENERIC_SHOP_NAMES.some((name) => shopName === name || shopName.includes(name));
  if (!isGeneric && shopName.length >= 4) score += 4;

  return clamp(score, 0, 25);
}

function scorePassion(input: PartnerApplicationReviewInput) {
  let score = 0;
  const mission = input.mission?.trim() ?? "";
  const description = input.description?.trim() ?? "";
  const combined = `${mission}\n${description}`;

  if (mission.length >= 80) score += 10;
  else if (mission.length >= 30) score += 7;
  else if (mission.length > 0) score += 4;

  const passionHits = countKeywordHits(combined, PASSION_WORDS);
  score += Math.min(10, passionHits * 3);

  if (input.target_user?.trim()) score += 3;

  return clamp(score, 0, 25);
}

function scoreSafety(input: PartnerApplicationReviewInput) {
  let score = 25;
  const combined = [
    input.shop_name,
    input.description,
    input.mission,
    input.target_user,
    input.website_url
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  const unsafeHits = countKeywordHits(combined, UNSAFE_WORDS);
  score -= unsafeHits * 8;

  const descLen = input.description?.trim().length ?? 0;
  if (descLen < 30) score -= 10;
  else if (descLen < 80) score -= 4;

  if (!input.website_url?.trim() && !input.instagram_url?.trim() && !input.x_url?.trim()) {
    score -= 5;
  }

  if (!input.email.includes("@")) score -= 10;

  return clamp(score, 0, 25);
}

export function recommendationFromScore(total: number): AiRecommendationLabel {
  if (total >= 90) return "承認推奨";
  if (total >= 70) return "要確認";
  return "再審査推奨";
}

function buildAiComment(
  input: PartnerApplicationReviewInput,
  scores: Pick<ManiaReviewAiResult, "ai_specialty" | "ai_originality" | "ai_passion" | "ai_safety" | "ai_recommendation">
) {
  const parts: string[] = [];

  parts.push(`【Mania Review AI】${input.shop_name} の一次審査結果です。`);

  if (scores.ai_specialty >= 18) {
    parts.push("専門性: カテゴリと説明文から、マニア向け専門店としての姿勢が読み取れます。");
  } else if (scores.ai_specialty >= 12) {
    parts.push("専門性: 一定の専門性はありますが、扱う領域の具体性をさらに補強すると良いです。");
  } else {
    parts.push("専門性: 説明やカテゴリ情報が薄く、専門店としての信頼感が不足しています。");
  }

  if (scores.ai_originality >= 18) {
    parts.push("独自性: 想い・届けたい相手・導線が揃い、世界観の独自性が感じられます。");
  } else {
    parts.push("独自性: 他店と差別化するストーリーや導線の記載を増やすと印象が強まります。");
  }

  if (scores.ai_passion >= 18) {
    parts.push("熱量: テキストから運営者の熱量が十分に伝わります。");
  } else {
    parts.push("熱量: 想いや説明をもう少し具体的にすると、マニアへの訴求力が上がります。");
  }

  if (scores.ai_safety >= 20) {
    parts.push("安全性: 大きな懸念ワードは見当たりません。");
  } else if (scores.ai_safety >= 12) {
    parts.push("安全性: 一部の表現や情報不足により、管理者の目視確認を推奨します。");
  } else {
    parts.push("安全性: 懸念表現または情報不足が多く、慎重な再審査を推奨します。");
  }

  parts.push(`総合判定: ${scores.ai_recommendation}（最終判断は管理者が行ってください）。`);

  return parts.join("\n");
}

/** ルールベース一次審査（将来 LLM に差し替え可能） */
export function runManiaReviewAi(input: PartnerApplicationReviewInput): ManiaReviewAiResult {
  const ai_specialty = scoreSpecialty(input);
  const ai_originality = scoreOriginality(input);
  const ai_passion = scorePassion(input);
  const ai_safety = scoreSafety(input);
  const ai_score = ai_specialty + ai_originality + ai_passion + ai_safety;
  const ai_recommendation = recommendationFromScore(ai_score);
  const ai_comment = buildAiComment(input, {
    ai_specialty,
    ai_originality,
    ai_passion,
    ai_safety,
    ai_recommendation
  });

  return {
    ai_score,
    ai_specialty,
    ai_originality,
    ai_passion,
    ai_safety,
    ai_recommendation,
    ai_comment,
    ai_checked_at: new Date().toISOString()
  };
}