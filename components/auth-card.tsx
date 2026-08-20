import { signIn, signUp } from "@/app/actions";

type AuthCardProps = {
  next?: string;
  title?: string;
  description?: string;
  sent?: boolean;
};

export function AuthCard({
  next = "/mypage",
  title = "ログイン",
  description = "メールアドレスとパスワードでログインしてください。",
  sent = false
}: AuthCardProps) {
  return (
    <section className="mx-auto max-w-xl rounded-lg border border-ink/10 bg-paper/95 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/60">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">{description}</p>
      {sent ? null : null}
      <form action={signIn} className="mt-5 grid gap-3">
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
        <div className="grid gap-2 sm:grid-cols-2">
          <button className="rounded-md bg-ink px-4 py-2 font-semibold text-white hover:bg-lagoon dark:bg-lagoon">ログイン</button>
          <button formAction={signUp} className="rounded-md border border-ink/20 px-4 py-2 font-semibold hover:border-lagoon">新規登録</button>
        </div>
      </form>
    </section>
  );
}
