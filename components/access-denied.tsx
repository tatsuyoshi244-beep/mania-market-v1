import Link from "next/link";
import type { Route } from "next";

type AccessDeniedProps = {
  title: string;
  message: string;
  backHref?: Route;
  backLabel?: string;
};

export function AccessDenied({
  title,
  message,
  backHref = "/" as Route,
  backLabel = "トップへ戻る"
}: AccessDeniedProps) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-lg border border-ink/10 bg-paper/95 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/60">
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="mt-3 text-ink/70 dark:text-paper/70">{message}</p>
        <Link href={backHref} className="mt-6 inline-flex text-sm font-bold text-lagoon hover:text-cinnabar">
          {backLabel}
        </Link>
      </div>
    </section>
  );
}