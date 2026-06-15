import { signOut } from "@/app/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold hover:border-cinnabar dark:border-paper/15 dark:bg-ink/60"
      >
        ログアウト
      </button>
    </form>
  );
}