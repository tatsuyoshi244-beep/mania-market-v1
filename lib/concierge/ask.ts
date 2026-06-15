import { matchFaq } from "@/lib/concierge/faq";
import { buildConciergeActions } from "@/lib/concierge/actions";
import { diagnoseShop } from "@/lib/concierge/diagnosis";
import type { ConciergeContext } from "@/types/concierge";

export function answerConciergeQuestion(question: string, context: ConciergeContext) {
  const faq = matchFaq(question);
  if (faq) {
    return {
      answer: faq.answer,
      source: "faq" as const,
      faqId: faq.id
    };
  }

  const diagnosis = diagnoseShop(context);
  const actions = buildConciergeActions(context, diagnosis);
  const normalized = question.toLowerCase();

  if (normalized.includes("完成") || normalized.includes("診断") || normalized.includes("スコア")) {
    return {
      answer: `現在のショップ完成度は ${diagnosis.score}% です。\n\n不足している項目:\n${actions.missing.map((m) => `・${m}`).join("\n") || "・なし（素晴らしいです！）"}`,
      source: "diagnosis" as const
    };
  }

  if (normalized.includes("今日") || normalized.includes("やること") || normalized.includes("タスク")) {
    const tasks = actions.today.map((t) => `・${t.label}`).join("\n");
    return {
      answer: `今日のおすすめアクション:\n\n${tasks || "・現状、急ぎのタスクはありません。SNS投稿や商品追加でさらに充実させましょう。"}`,
      source: "actions" as const
    };
  }

  if (normalized.includes("タグ") || normalized.includes("マーケ") || normalized.includes("集客")) {
    return {
      answer:
        "マーケティング提案は右側の「提案」カードをご確認ください。人気タグ・関連カテゴリ・季節トレンドを表示しています。商品タグに人気キーワードを取り入れると、発見されやすくなります。",
      source: "marketing" as const
    };
  }

  return {
    answer:
      "ご質問ありがとうございます。FAQ（出店方法・商品登録・SNS連携・審査）をご確認いただくか、もう少し具体的なキーワードでお聞きください。例:「商品の登録方法は？」「完成度を上げるには？」",
    source: "fallback" as const
  };
}