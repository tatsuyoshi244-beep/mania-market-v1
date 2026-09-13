"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

export function PartnerShareCard({ shopSlug }: { shopSlug: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/partner/apply?ref=${encodeURIComponent(shopSlug)}&utm_source=partner_referral&utm_medium=share&utm_campaign=partner_network`;

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareLink() {
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      await navigator.share({ title: "Mania Market パートナー募集", text: "専門店の魅力を、まだ知らない人へ。", url });
    } else {
      await copyLink();
    }
  }

  return (
    <section className="mt-10 rounded-3xl border border-cinnabar/20 bg-cinnabar/5 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-cinnabar">Partner Network</p>
      <h2 className="mt-2 text-2xl font-black">知っている専門店を紹介する</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/65">この専用リンクから申請されたパートナーは、あなたのショップからの紹介として記録されます。</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={copyLink} className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-bold">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "コピー済み" : "紹介リンクをコピー"}
        </button>
        <button type="button" onClick={shareLink} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-lagoon">
          <Share2 className="size-4" />共有する
        </button>
      </div>
    </section>
  );
}
