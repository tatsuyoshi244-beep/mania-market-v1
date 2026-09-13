import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { safeInternalRoute } from "@/lib/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "新規登録", robots: { index: false, follow: false } };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const redirectTo = safeInternalRoute(next, "/mypage");
  const message = error === "account_exists"
    ? "このメールアドレスは既に登録されています。ログインしてください。"
    : error === "missing_fields"
      ? "メールアドレス・表示名・パスワードを入力してください。"
      : error === "weak_password"
        ? "パスワードは8文字以上で入力してください。"
        : error
          ? "登録処理に接続できませんでした。時間をおいて、もう一度お試しください。"
          : undefined;

  return (
    <div className="px-4 py-10">
      <AuthCard
        next={redirectTo}
        mode="signup"
        title="新規登録"
        description="メールアドレス・表示名・パスワードを入力してアカウントを作成します。"
        allowSignUp={false}
        error={message}
      />
      <p className="mx-auto mt-4 max-w-xl text-center text-sm text-ink/65 dark:text-paper/65">
        すでにアカウントをお持ちですか？ <Link className="font-semibold text-lagoon hover:text-cinnabar" href={`/login?next=${encodeURIComponent(redirectTo)}`}>ログイン</Link>
      </p>
    </div>
  );
}
