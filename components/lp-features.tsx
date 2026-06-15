import { Compass, Eye, MapPin } from "lucide-react";

const STEPS = [
  {
    icon: Eye,
    title: "Browse",
    description: "ジャンルやショップを、雑誌のように眺める。検索しなくても、次の「好き」に出会える導線を設計しています。"
  },
  {
    icon: Compass,
    title: "Discover",
    description: "今日の発見、人気ショップ、マニアの専門店。知らなかった世界へ、偶然の出会いを届けます。"
  },
  {
    icon: MapPin,
    title: "Visit",
    description: "気になったらショップへ。購入は各店の公式サイトで。Mania Market は「発見」に特化したインフラです。"
  }
] as const;

export function LpFeatures() {
  return (
    <section className="border-y border-ink/10 bg-ink text-paper dark:border-paper/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-paper/50">Philosophy</p>
          <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">探すより、出会う。</h2>
          <p className="mt-4 text-sm leading-7 text-paper/65">
            欲しいものを検索する場所ではなく、知らなかった専門店と出会うためのプラットフォーム。
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <article
              key={step.title}
              className="rounded-2xl border border-paper/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-cinnabar/20 text-cinnabar">
                <step.icon className="size-5" />
              </div>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-paper/45">0{index + 1}</p>
              <h3 className="mt-2 font-display text-2xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-paper/70">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}