import { signIn } from "@/app/actions";

type AuthCardProps = {
  next?: string;
  title?: string;
  description?: string;
  sent?: boolean;
};

export function AuthCard({
  next = "/mypage",
  title = "ログイン",
  description = "マジックリンクを送信してログインしてください。",
  sent = false
}: AuthCardProps) {
  return (
    <section className="mx-auto max-w-xl rounded-lg border border-ink/10 bg-paper/95 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/60">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">{description}</p>
      {sent ? (
        <p className="mt-4 rounded-md border border-lagoon/30 bg-lagoon/10 px-3 py-2 text-sm text-lagoon">
          ログインリンクを送信しました。メールを確認してください。
        </p>
      ) : null}
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
        <button className="rounded-md bg-ink px-4 py-2 font-semibold text-white hover:bg-lagoon dark:bg-lagoon">
          マジックリンクを送信
        </button>
      </form>
    </section>
  );
}