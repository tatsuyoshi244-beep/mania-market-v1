import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "申請完了 — Mania Market",
  description: "出店申請を受け付けました"
};

export default function PartnerApplyThanksPage() {
  return (
    <div className="bg-paper dark:bg-ink">
      <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-moss/15 text-moss">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-8 font-display text-4xl font-semibold">申請を受け付けました</h1>
        <p className="mt-4 text-base leading-8 text-ink/65 dark:text-paper/65">
          審査後にご連絡します。
          <br />
          通常、数日以内にメールで結果をお知らせします。
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/seller-guide"
            className="inline-flex items-center gap-2 rounded-full border border-ink/12 px-6 py-3 text-sm font-bold hover:border-cinnabar"
          >
            出店ガイドを見る
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-lagoon dark:bg-lagoon"
          >
            トップへ
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}