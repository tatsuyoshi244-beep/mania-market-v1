import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { getCategoryImageUrl } from "@/lib/category-images";

const MOSAIC = [
  { slug: "vintage", label: "ヴィンテージ", className: "col-span-2 row-span-2" },
  { slug: "collectibles", label: "コレクション", className: "col-span-1 row-span-1" },
  { slug: "music", label: "音楽", className: "col-span-1 row-span-2" },
  { slug: "web", label: "Web", className: "col-span-1 row-span-1" },
  { slug: "ai", label: "AI", className: "col-span-2 row-span-1" }
] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="lp-mesh absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8 sm:pb-20 sm:pt-12 lg:pb-24 lg:pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/55 px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] text-ink/65 backdrop-blur dark:border-paper/15 dark:bg-ink/45 dark:text-paper/65">
              <Sparkles className="size-3.5 text-cinnabar" />
              DISCOVERY PLATFORM
            </p>

            <h1 className="mt-7 font-display text-[2rem] font-semibold leading-[1.45] tracking-tight sm:text-[2.35rem] lg:text-[2.65rem]">
              <span className="block text-ink/55 dark:text-paper/55">欲しいものを探す場所ではない。</span>
              <span className="mt-4 block">
                知らなかった世界と、
                <br />
                熱量の高い専門店に出会う場所。
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-8 text-ink/65 dark:text-paper/65 sm:text-lg">
              全国のマニア専門店を発見できる、
              <br className="hidden sm:block" />
              新しい検索インフラ。
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white shadow-editorial transition hover:bg-lagoon dark:bg-lagoon dark:hover:bg-cinnabar"
              >
                ジャンルを眺める
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/shops"
                className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white/65 px-6 py-3.5 text-sm font-bold backdrop-blur transition hover:border-cinnabar hover:text-cinnabar dark:border-paper/18 dark:bg-ink/45"
              >
                ショップを発見する
              </Link>
            </div>
          </div>

          <div className="relative animate-fade-up [animation-delay:140ms]">
            <div className="absolute -right-8 -top-6 size-36 rounded-full bg-cinnabar/12 blur-3xl" />
            <div className="absolute -bottom-10 -left-6 size-44 rounded-full bg-lagoon/15 blur-3xl" />

            <div className="grid h-[340px] grid-cols-3 grid-rows-3 gap-2.5 sm:h-[460px] sm:gap-3 lg:h-[500px]">
              {MOSAIC.map((tile) => (
                <Link
                  key={tile.slug}
                  href={`/categories/${tile.slug}`}
                  aria-label={`${tile.label}カテゴリを見る`}
                  className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl ${tile.className}`}
                >
                  <Image
                    src={getCategoryImageUrl(tile.slug)}
                    alt=""
                    fill
                    sizes="(max-width: 1023px) 66vw, 32vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent opacity-80 transition group-hover:opacity-100" />
                </Link>
              ))}
            </div>

            <div className="animate-float absolute -bottom-3 left-4 rounded-2xl border border-white/45 bg-white/90 px-4 py-3 shadow-editorial backdrop-blur dark:border-paper/10 dark:bg-ink/85 sm:left-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cinnabar">Browse</p>
              <p className="mt-1 text-sm font-semibold">眺めるだけで、世界が広がる</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
