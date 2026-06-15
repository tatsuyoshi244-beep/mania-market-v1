"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { GuideRecommendationsList } from "@/components/mania-guide/guide-recommendations";
import { EXTERNAL_PURCHASE_DISCLAIMER } from "@/lib/guide/respond";
import { cn } from "@/lib/utils";
import type { GuideChatMessage, GuideChatResponse } from "@/types/guide";

const WELCOME_MESSAGE: GuideChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "こんにちは、Mania Guide です。\n興味のあるジャンルやキーワードを教えてください。カテゴリ・ショップ・商品の発見をお手伝いします。",
  disclaimer: EXTERNAL_PURCHASE_DISCLAIMER
};

const SUGGESTIONS = [
  "フィルムカメラに興味がある",
  "レトロゲームの専門店を知りたい",
  "ヴィンテージファッションを眺めたい"
] as const;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ManiaGuideWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<GuideChatMessage[]>([WELCOME_MESSAGE]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading, open]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: GuideChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed })
      });

      if (!res.ok) {
        throw new Error("request failed");
      }

      const data = (await res.json()) as GuideChatResponse;
      const assistantMessage: GuideChatMessage = {
        id: createId(),
        role: "assistant",
        content: data.message,
        recommendations: data.recommendations,
        disclaimer: data.disclaimer
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: "すみません、応答の取得に失敗しました。しばらくしてからもう一度お試しください。",
          disclaimer: EXTERNAL_PURCHASE_DISCLAIMER
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-[55] bg-ink/20 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {open ? (
          <div
            className="flex h-[min(78vh,560px)] w-[min(92vw,400px)] flex-col overflow-hidden rounded-3xl border border-ink/10 bg-paper shadow-editorial dark:border-paper/10 dark:bg-ink"
            role="dialog"
            aria-label="Mania Guide"
          >
            <header className="flex items-center justify-between gap-3 border-b border-ink/8 px-4 py-3 dark:border-paper/10">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-full bg-cinnabar/15 text-cinnabar">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Mania Guide</p>
                  <p className="text-[10px] text-ink/50 dark:text-paper/50">発見のお手伝い</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-ink/50 transition hover:bg-ink/5 hover:text-ink dark:text-paper/50 dark:hover:bg-paper/5"
                aria-label="チャットを閉じる"
              >
                <X className="size-5" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 whitespace-pre-wrap",
                      message.role === "user"
                        ? "bg-ink text-white dark:bg-lagoon"
                        : "border border-ink/8 bg-white/80 text-ink dark:border-paper/10 dark:bg-ink/60 dark:text-paper"
                    )}
                  >
                    {message.content}
                    {message.recommendations ? (
                      <GuideRecommendationsList recommendations={message.recommendations} />
                    ) : null}
                  </div>
                </div>
              ))}

              {loading ? (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-ink/8 bg-white/80 px-3 py-2 text-sm text-ink/60 dark:border-paper/10 dark:bg-ink/60 dark:text-paper/60">
                    <Loader2 className="size-4 animate-spin" />
                    探しています…
                  </div>
                </div>
              ) : null}

              {messages.length === 1 && !loading ? (
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void sendMessage(suggestion)}
                      className="rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-left text-xs font-medium text-ink/75 transition hover:border-cinnabar hover:text-cinnabar dark:border-paper/15 dark:bg-ink/50 dark:text-paper/75"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <footer className="border-t border-ink/8 px-4 py-3 dark:border-paper/10">
              <p className="mb-2 text-[10px] leading-4 text-ink/45 dark:text-paper/45">{EXTERNAL_PURCHASE_DISCLAIMER}</p>
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                  rows={1}
                  maxLength={500}
                  placeholder="例：アナログ音楽が好き"
                  className="max-h-24 min-h-[42px] flex-1 resize-none rounded-2xl border border-ink/12 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-lagoon dark:border-paper/15 dark:bg-ink/50"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-white transition hover:bg-lagoon disabled:opacity-40 dark:bg-lagoon dark:hover:bg-cinnabar"
                  aria-label="送信"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </footer>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-bold text-white shadow-editorial transition hover:bg-lagoon dark:bg-lagoon dark:hover:bg-cinnabar"
          aria-expanded={open}
          aria-label={open ? "Mania Guide を閉じる" : "Mania Guide を開く"}
        >
          {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
          <span className="hidden sm:inline">Mania Guide</span>
        </button>
      </div>
    </>
  );
}