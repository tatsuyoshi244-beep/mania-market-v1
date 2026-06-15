import { AuthCard } from "@/components/auth-card";
import { MypageNav } from "@/components/mypage-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MypageLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <div className="px-4 py-10">
        <AuthCard
          next="/mypage"
          title="マイページ"
          description="ログインするとお気に入りとフォロー一覧を確認できます。"
        />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black">マイページ</h1>
          <p className="mt-2 text-ink/65 dark:text-paper/65">
            {data.user.email ?? "ログイン中"} — お気に入りとフォロー中のショップを管理
          </p>
        </div>
        <SignOutButton />
      </div>
      <MypageNav />
      {children}
    </section>
  );
}