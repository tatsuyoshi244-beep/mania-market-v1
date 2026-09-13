import { AuthCard } from "@/components/auth-card";
import { safeInternalRoute } from "@/lib/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン",
  robots: { index: false, follow: false }
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; sent?: string; error?: string }>;
}) {
  const { next, sent, error } = await searchParams;
  const redirectTo = safeInternalRoute(next, "/mypage");

  return (
    <div className="px-4 py-10">
      {error ? (
        <p className="mx-auto mb-4 max-w-xl rounded-md border border-cinnabar/30 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabar">
          {error === "missing_fields" ? "メールアドレスとパスワードを入力してください。" : error === "auth_unavailable" ? "認証サービスに接続できませんでした。時間をおいて、もう一度お試しください。" : "ログインに失敗しました。メールアドレスとパスワードを確認してください。"}
        </p>
      ) : null}
      <AuthCard
        next={redirectTo}
        title="ログイン"
        description="お気に入り・フォロー機能を使うにはログインが必要です。"
        sent={sent === "1"}
        error={undefined}
      />
    </div>
  );
}
