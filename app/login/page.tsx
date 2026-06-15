import { AuthCard } from "@/components/auth-card";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; sent?: string; error?: string }>;
}) {
  const { next, sent, error } = await searchParams;
  const redirectTo = next && next.startsWith("/") ? next : "/mypage";

  return (
    <div className="px-4 py-10">
      {error === "auth" ? (
        <p className="mx-auto mb-4 max-w-xl rounded-md border border-cinnabar/30 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabar">
          ログインに失敗しました。もう一度お試しください。
        </p>
      ) : null}
      <AuthCard
        next={redirectTo}
        title="ログイン"
        description="お気に入り・フォロー機能を使うにはログインが必要です。"
        sent={sent === "1"}
      />
    </div>
  );
}