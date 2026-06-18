import Link from "next/link";
import { AccessDenied } from "@/components/access-denied";
import { getOwnedShop } from "@/lib/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardProductsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const shop = await getOwnedShop(supabase, userData.user.id);
  if (!shop) {
    return (
      <AccessDenied
        title="ショップオーナー専用"
        message="商品管理は owner_id が自分のショップに紐づいている場合のみ利用できます。"
        backHref="/dashboard"
        backLabel="ダッシュボードへ"
      />
    );
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <p className="text-xs text-ink/50">
          管理中ショップ: <span className="font-semibold text-ink/70">{shop.name}</span>
          {" · "}
          <Link href="/dashboard" className="font-semibold text-lagoon hover:text-cinnabar">ダッシュボード</Link>
        </p>
      </div>
      {children}
    </>
  );
}