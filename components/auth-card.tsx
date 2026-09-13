import { signIn, signUp } from "@/app/actions";

type AuthCardProps = {
  next?: string;
  title?: string;
  description?: string;
  sent?: boolean;
  mode?: "signin" | "signup";
  allowSignUp?: boolean;
  error?: string;
};

export function AuthCard({
  next = "/mypage",
  title = "ログイン",
  description = "メールアドレスとパスワードでログインしてください。",
  sent = false,
  mode = "signin",
  allowSignUp = true,
  error
}: AuthCardProps) {
  const isSignUp = mode === "signup";
  return (
    <section className="mx-auto max-w-xl rounded-lg border border-ink/10 bg-paper/95 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/60">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">{description}</p>
      {error ? (
        <p role="alert" className="mt-4 rounded-md border border-cinnabar/30 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabar">
          {error}
        </p>
      ) : null}
      {sent ? null : null}
      <form action={isSignUp ? signUp : signIn} className="mt-5 grid gap-3">
        <input type="hidden" name="redirect_to" value={next} />
        <label className="grid gap-1 text-sm font-medium">
          メールアドレス
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-ink/15 bg-white px-3 py-2 dark:border-paper/15 dark:bg-ink/80"
            placeholder="you@example.com"
          />
        </label>
        {isSignUp ? (
          <label className="grid gap-1 text-sm font-medium">
            表示名
            <input
              name="name"
              type="text"
              required
              maxLength={80}
              autoComplete="name"
              className="rounded-md border border-ink/15 bg-white px-3 py-2 dark:border-paper/15 dark:bg-ink/80"
              placeholder="マニアマーケット太郎"
            />
          </label>
        ) : null}
        <label className="grid gap-1 text-sm font-medium">
          パスワード
          <input
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete="current-password"
            className="rounded-md border border-ink/15 bg-white px-3 py-2 dark:border-paper/15 dark:bg-ink/80"
          />
        </label>
        <button className="rounded-md bg-ink px-4 py-2 font-semibold text-white hover:bg-lagoon dark:bg-lagoon">
          {isSignUp ? "アカウントを作成" : "ログイン"}
        </button>
      </form>
      {allowSignUp ? (
        <p className="mt-4 text-center text-sm text-ink/65 dark:text-paper/65">
          アカウントをお持ちでない方は <a className="font-semibold text-lagoon hover:text-cinnabar" href={`/signup?next=${encodeURIComponent(next)}`}>新規登録</a>
        </p>
      ) : null}
    </section>
  );
}
