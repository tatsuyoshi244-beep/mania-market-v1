import { answerConciergeQuestion } from "@/lib/concierge/ask";
import { generateConciergeText, type GenerateInput } from "@/lib/concierge/generate";
import type { ConciergeContext } from "@/types/concierge";

export type ConciergeProviderKind = "rule" | "openai";

export type ConciergeProviderAdapter = {
  kind: ConciergeProviderKind;
  generateText: (input: GenerateInput) => Promise<{ draft: string; model: string; disclaimer: string }>;
  answerQuestion: (
    question: string,
    context: ConciergeContext
  ) => Promise<{ answer: string; source: string }>;
};

const DRAFT_DISCLAIMER = "AI生成の下書きです。内容は必ずご自身で確認・編集してから公開してください。";

const ruleBasedProvider: ConciergeProviderAdapter = {
  kind: "rule",
  async generateText(input) {
    const result = generateConciergeText(input);
    return { ...result, disclaimer: DRAFT_DISCLAIMER };
  },
  async answerQuestion(question, context) {
    return answerConciergeQuestion(question, context);
  }
};

/** 将来 LLM 接続時は MANIA_AI_PROVIDER=openai で差し替え */
export function getConciergeProvider(): ConciergeProviderAdapter {
  const kind = (process.env.MANIA_AI_PROVIDER ?? "rule") as ConciergeProviderKind;
  if (kind === "openai") {
    // TODO: OpenAI adapter
    return ruleBasedProvider;
  }
  return ruleBasedProvider;
}