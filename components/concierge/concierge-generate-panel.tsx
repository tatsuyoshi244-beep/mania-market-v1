"use client";

import { useState } from "react";
import { Copy, Loader2, Sparkles } from "lucide-react";
import type { ConciergeProduct, GenerateType } from "@/types/concierge";

const GENERATE_OPTIONS: Array<{ type: GenerateType; label: string; description: string }> = [
  { type: "shop_description", label: "ショップ紹介文", description: "ショップページ用の説明文" },
  { type: "product_description", label: "商品説明文", description: "選択した商品の説明下書き" },
  { type: "sns_post", label: "SNS投稿文", description: "X / Instagram 向け投稿" },
  { type: "catch_copy", label: "キャッチコピー", description: "短い訴求フレーズ" }
];

type ConciergeGeneratePanelProps = {
  products: ConciergeProduct[];
};

export function ConciergeGeneratePanel({ products }: ConciergeGeneratePanelProps) {
  const [type, setType] = useState<GenerateType>("shop_description");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [keywords, setKeywords] = useState("");
  const [draft, setDraft] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setCopied(false);
    try {
      const res = await fetch("/api/concierge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          hints: {
            productId: type === "product_description" ? productId : undefined,
            keywords: keywords || undefined
          }
        })
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { draft: string; disclaimer: string };
      setDraft(data.draft);
      setDisclaimer(data.disclaimer);
    } catch {
      setDraft("生成に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/50">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-cinnabar" />
        <h2 className="font-display text-2xl font-semibold">AI文章生成</h2>
      </div>
      <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">Ver.1 はルールベースの下書き生成（将来 LLM 接続予定）</p>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {GENERATE_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => setType(option.type)}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              type === option.type
                ? "border-cinnabar bg-cinnabar/10"
                : "border-ink/10 hover:border-lagoon dark:border-paper/15"
            }`}
          >
            <p className="text-sm font-bold">{option.label}</p>
            <p className="mt-1 text-xs text-ink/55 dark:text-paper/55">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {type === "product_description" ? (
          <label className="grid gap-1 text-sm font-medium">
            対象商品
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="rounded-xl border border-ink/12 bg-white px-3 py-2 dark:border-paper/15 dark:bg-ink/60"
            >
              {products.length === 0 ? <option value="">商品がありません</option> : null}
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="grid gap-1 text-sm font-medium">
          キーワード（任意）
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="例: フィルムカメラ, 限定品"
            className="rounded-xl border border-ink/12 bg-white px-3 py-2 dark:border-paper/15 dark:bg-ink/60"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void handleGenerate()}
        disabled={loading || (type === "product_description" && !productId)}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-lagoon disabled:opacity-50 dark:bg-lagoon"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        下書きを生成
      </button>

      {draft ? (
        <div className="mt-5 rounded-2xl border border-ink/10 bg-paper/50 p-4 dark:border-paper/10 dark:bg-ink/40">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/45">Draft</p>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-lagoon hover:text-cinnabar"
            >
              <Copy className="size-3.5" />
              {copied ? "コピーしました" : "コピー"}
            </button>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{draft}</p>
          {disclaimer ? <p className="mt-3 text-[11px] leading-5 text-ink/45">{disclaimer}</p> : null}
        </div>
      ) : null}
    </section>
  );
}