"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app-error]", error.digest ?? "error");
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";
  const message = isDev ? error.message : "処理に失敗しました。時間をおいて再試行してください。";

  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-black">エラーが発生しました</h1>
      <p className="mt-4 text-sm leading-7 text-ink/70">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-full bg-ink px-5 py-2 text-sm font-bold text-white hover:bg-lagoon">再試行</button>
        <Link href="/" className="rounded-full border border-ink/15 px-5 py-2 text-sm font-bold hover:border-cinnabar">トップへ</Link>
      </div>
    </section>
  );
}