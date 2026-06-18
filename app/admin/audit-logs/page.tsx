import Link from "next/link";
import { summarizeAuditMetadata } from "@/lib/audit/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "監査ログ — Mania Market Admin"
};

export default async function AdminAuditLogsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("id, created_at, action, target_type, target_id, user_id, metadata")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold">監査ログ</h1>
          <p className="mt-2 text-sm text-ink/60">重要操作の記録（直近200件）</p>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-lagoon hover:text-cinnabar">
          ← 管理トップ
        </Link>
      </div>

      {error ? (
        <p className="mt-8 rounded-2xl border border-cinnabar/30 bg-cinnabar/8 p-6 text-sm leading-7">
          監査ログの取得に失敗しました。
        </p>
      ) : null}

      {!error && (logs ?? []).length === 0 ? (
        <p className="mt-8 rounded-2xl border border-ink/10 bg-white/80 p-8 text-center text-sm text-ink/60 dark:bg-ink/50">
          まだ監査ログはありません。
        </p>
      ) : null}

      {!error && (logs ?? []).length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white/90 shadow-sm dark:bg-ink/40">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-paper/80 text-xs uppercase tracking-wide text-ink/55">
              <tr>
                <th className="px-4 py-3 font-semibold">日時</th>
                <th className="px-4 py-3 font-semibold">action</th>
                <th className="px-4 py-3 font-semibold">target_type</th>
                <th className="px-4 py-3 font-semibold">target_id</th>
                <th className="px-4 py-3 font-semibold">user_id</th>
                <th className="px-4 py-3 font-semibold">metadata</th>
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).map((log) => (
                <tr key={log.id} className="border-b border-ink/5 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-ink/75">
                    {new Date(log.created_at).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-3">{log.target_type}</td>
                  <td className="max-w-[10rem] truncate px-4 py-3 font-mono text-xs text-ink/70">
                    {log.target_id ?? "—"}
                  </td>
                  <td className="max-w-[10rem] truncate px-4 py-3 font-mono text-xs text-ink/70">
                    {log.user_id ?? "—"}
                  </td>
                  <td className="max-w-md truncate px-4 py-3 text-ink/70">
                    {summarizeAuditMetadata(
                      log.metadata as Record<string, string | number | boolean | null> | null
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}