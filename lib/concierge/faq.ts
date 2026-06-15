import type { FaqItem } from "@/types/concierge";

export const CONCIERGE_FAQ: FaqItem[] = [
  {
    id: "setup",
    question: "出店方法を教えてください",
    keywords: ["出店", "登録", "ショップ", "始め方", "開設", "setup"],
    answer:
      "1. ダッシュボードでショップ名・slug・カテゴリを入力して保存\n2. ロゴ・カバー・説明文で世界観を整える\n3. 商品を1点以上登録\n4. 「公開する」にチェックを入れて保存\n\n公開後、Mania Market のショップ一覧・カテゴリページに表示されます。購入は各ショップの公式サイトで行われます。"
  },
  {
    id: "products",
    question: "商品の登録方法は？",
    keywords: ["商品", "登録", "product", "タグ", "外部", "url"],
    answer:
      "「商品管理」から商品名・説明・価格表示・画像URL・外部販売URLを入力します。タグはカンマ区切りで追加できます。\n\nプランごとに active 商品数に上限があります。上限に達した場合はプランアップグレードか、既存商品を非表示にしてください。"
  },
  {
    id: "sns",
    question: "SNS連携はどうすればいい？",
    keywords: ["sns", "twitter", "instagram", "x", "連携", "ソーシャル"],
    answer:
      "ショップ登録フォームに X (Twitter) URL と Instagram URL の欄があります。入力して保存すると、ショップページにリンクが表示されます。\n\nMania Concierge の「SNS投稿文」生成で、ショップ紹介用の投稿下書きも作成できます。"
  },
  {
    id: "review",
    question: "審査はありますか？",
    keywords: ["審査", "公開", "承認", "review", "掲載", "基準"],
    answer:
      "現行 Ver.1 では自動審査フローはありません。出店者が「公開する」をオンにすると掲載されます。\n\nマニア向け専門店としての信頼性のため、説明文・画像・外部販売URLの整備を推奨しています。不適切なコンテンツは運営が非公開にする場合があります。"
  }
];

export function matchFaq(question: string): FaqItem | null {
  const normalized = question.trim().toLowerCase();
  if (!normalized) return null;

  let best: FaqItem | null = null;
  let bestScore = 0;

  for (const item of CONCIERGE_FAQ) {
    let score = 0;
    if (normalized.includes(item.question.toLowerCase().slice(0, 6))) score += 3;
    for (const keyword of item.keywords) {
      if (normalized.includes(keyword.toLowerCase())) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return bestScore >= 2 ? best : null;
}