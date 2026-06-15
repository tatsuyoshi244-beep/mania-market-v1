const STOP_WORDS = new Set([
  "の", "に", "を", "は", "が", "と", "で", "や", "か", "も", "へ", "から", "まで",
  "ある", "いる", "する", "したい", "教えて", "ください", "おすすめ", "探して", "知りたい",
  "what", "the", "a", "an", "for", "to", "of", "in", "on", "me", "my", "i", "want", "find"
]);

export const CATEGORY_HINTS: Record<string, string[]> = {
  "vintage-camera": ["カメラ", "フィルム", "レンズ", "camera", "film", "vintage", "写真"],
  "collectible-toys": ["トイ", "フィギュア", "おもちゃ", "toy", "figure", "collectible", "グッズ"],
  "retro-games": ["ゲーム", "レトロ", "ファミコン", "game", "retro", "console", "ソフト"],
  "designer-vintage": ["ファッション", "ヴィンテージ", "バッグ", "服", "fashion", "designer", "アパレル"],
  "analog-audio": ["レコード", "オーディオ", "アナログ", "audio", "vinyl", "record", "音"],
  "outdoor-gear": ["アウトドア", "キャンプ", "登山", "outdoor", "camp", "ギア", "gear"]
};

export function extractGuideKeywords(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [] as string[];

  const roughTokens = normalized
    .replace(/[、。！？!?.,]/g, " ")
    .split(/\s+/)
    .flatMap((part) => part.match(/[\u3040-\u30ff\u4e00-\u9fff]+|[a-z0-9]+/gi) ?? [])
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

  const unique = [...new Set(roughTokens)];
  if (unique.length > 0) return unique;

  return normalized.length >= 2 ? [normalized] : [];
}

export function hintedCategorySlugs(keywords: string[]) {
  const slugs = new Set<string>();
  for (const [slug, hints] of Object.entries(CATEGORY_HINTS)) {
    for (const keyword of keywords) {
      if (hints.some((hint) => hint.includes(keyword) || keyword.includes(hint))) {
        slugs.add(slug);
      }
    }
  }
  return [...slugs];
}