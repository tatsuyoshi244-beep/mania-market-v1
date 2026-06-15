import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getMypageCounts } from "@/lib/queries/mypage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MypagePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const counts = await getMypageCounts(supabase, data.user.id);

  const cards = [
    { href: "/mypage/applications", label: "出店申請状況", count: null as number | null },
    { href: "/mypage/favorites/products", label: "お気に入り商品", count: counts.favoriteProducts },
    { href: "/mypage/favorites/shops", label: "お気に入りショップ", count: counts.favoriteShops },
    { href: "/mypage/following", label: "フォロー中ショップ", count: counts.followingShops }
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="rounded-xl border border-ink/10 bg-white/90 p-6 shadow-sm transition hover:border-cinnabar dark:border-paper/10 dark:bg-ink/60"
        >
          <p className="text-sm font-semibold text-ink/60 dark:text-paper/60">{card.label}</p>
          <p className="mt-2 text-4xl font-black">{card.count ?? "—"}</p>
          <p className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-cinnabar">
            一覧を見る
            <ArrowRight className="size-4" />
          </p>
        </Link>
      ))}
    </div>
  );
}