import { formatSupabaseError } from "@/lib/supabase/errors";

type QueryErrorPanelProps = {
  errors: Array<{ source: string; error: unknown }>;
};

export function QueryErrorPanel({ errors }: QueryErrorPanelProps) {
  if (errors.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-6">
      <div className="rounded-xl border border-cinnabar/40 bg-cinnabar/10 p-4 dark:bg-cinnabar/15">
        <h2 className="text-sm font-black text-cinnabar">Supabase 取得エラー（開発用）</h2>
        <p className="mt-1 text-xs text-ink/70 dark:text-paper/70">
          ページは空データで表示を続けます。原因特定のため詳細を表示しています。
        </p>
        <div className="mt-4 space-y-4">
          {errors.map((item) => (
            <div key={item.source}>
              <p className="text-sm font-bold">{item.source}</p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-ink/90 p-3 text-xs text-paper">
                {formatSupabaseError(item.error)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}