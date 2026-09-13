import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { safeInternalRoute } from "@/lib/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "管理者ログイン", robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const redirectTo = safeInternalRoute(next, "/admin");
  const message = error === "account_exists"
    ? "このメールアドレスは登録済みです。管理者アカウントでログインしてください。"
    : error
      ? "管理者ログインに失敗しました。認証情報を確認してください。"
      : undefined;

  return (
    <div className="px-4 py-10">
      <AuthCard
        next={redirectTo}
        title="管理者ログイン"
        description="管理者権限を持つアカウント専用のログインです。新規登録はここから行えません。"
        allowSignUp={false}
        error={message}
      />
      <p className="mx-auto mt-4 max-w-xl text-center text-sm text-ink/65 dark:text-paper/65">
        一般ユーザーの方は <Link className="font-semibold text-lagoon hover:text-cinnabar" href="/login">通常ログイン</Link> を利用してください。
      </p>
    </div>
  );
}
