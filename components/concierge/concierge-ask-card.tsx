"use client";

import { useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";

type AskMessage = { role: "user" | "assistant"; content: string };

const QUICK_QUESTIONS = ["出店方法を教えて", "完成度を上げるには？", "今日やることは？"];

export function ConciergeAskCard() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AskMessage[]>([
    {
      role: "assistant",
      content: "Mania Concierge です。出店・商品・SNS・完成度について何でも聞いてください。"
    }
  ]);

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/concierge/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed })
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { answer: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "応答に失敗しました。もう一度お試しください。" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-ink/10 bg-white/90 p-4 shadow-sm dark:border-paper/10 dark:bg-ink/60">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <MessageCircle className="size-4 text-lagoon" />
        AIに相談
      </h3>

      <div className="mt-3 max-h-44 space-y-2 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`rounded-xl px-3 py-2 text-xs leading-5 whitespace-pre-wrap ${
              msg.role === "user"
                ? "ml-6 bg-ink text-white dark:bg-lagoon"
                : "mr-4 border border-ink/8 bg-paper/60 dark:border-paper/10 dark:bg-ink/40"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading ? (
          <div className="inline-flex items-center gap-1 text-xs text-ink/50">
            <Loader2 className="size-3 animate-spin" /> 考え中…
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => void send(q)}
            className="rounded-full border border-ink/10 px-2 py-0.5 text-[10px] font-medium hover:border-cinnabar dark:border-paper/15"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="mt-2 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="質問を入力…"
          maxLength={500}
          className="min-w-0 flex-1 rounded-xl border border-ink/12 bg-white px-3 py-2 text-xs dark:border-paper/15 dark:bg-ink/50"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-white disabled:opacity-40 dark:bg-lagoon"
        >
          <Send className="size-3.5" />
        </button>
      </form>
      <p className="mt-2 text-[10px] text-ink/40">会話ログは保存されません</p>
    </section>
  );
}