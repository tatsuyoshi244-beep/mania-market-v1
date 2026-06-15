"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CONCIERGE_FAQ } from "@/lib/concierge/faq";
import { cn } from "@/lib/utils";

export function ConciergeFaq() {
  const [openId, setOpenId] = useState<string | null>(CONCIERGE_FAQ[0]?.id ?? null);

  return (
    <section className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/50">
      <h2 className="font-display text-2xl font-semibold">FAQ</h2>
      <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">出店・商品・SNS・審査について</p>
      <div className="mt-5 divide-y divide-ink/8 dark:divide-paper/10">
        {CONCIERGE_FAQ.map((item) => {
          const open = openId === item.id;
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full items-center justify-between gap-3 py-4 text-left"
              >
                <span className="font-semibold">{item.question}</span>
                <ChevronDown className={cn("size-4 shrink-0 transition", open && "rotate-180")} />
              </button>
              {open ? (
                <p className="whitespace-pre-wrap pb-4 text-sm leading-7 text-ink/70 dark:text-paper/70">{item.answer}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}