import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <div className="px-4 py-10"><AuthCard /></div>;

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (user?.role !== "admin") {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-ink/10 bg-paper/95 p-6 shadow-sm">
          <h1 className="text-3xl font-black">管理者専用</h1>
          <p className="mt-3 text-ink/70">管理者権限のあるユーザーだけが全件管理できます。</p>
        </div>
      </section>
    );
  }

  const [{ data: shops }, { data: products }, { data: events }] = await Promise.all([
    supabase.from("shops").select("id,name,slug,is_published,created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("products").select("id,name,status,created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("analytics_events").select("id,event_type,created_at").order("created_at", { ascending: false }).limit(20)
  ]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-black">管理</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/partner-applications"
          className="rounded-xl border border-cinnabar/25 bg-cinnabar/8 p-5 font-bold shadow-sm transition hover:border-cinnabar"
        >
          出店申請管理
          <p className="mt-2 text-sm font-normal text-ink/65">審査・承認・公開</p>
        </Link>
        <Link
          href="/admin/audit-logs"
          className="rounded-xl border border-lagoon/25 bg-lagoon/8 p-5 font-bold shadow-sm transition hover:border-lagoon"
        >
          監査ログ
          <p className="mt-2 text-sm font-normal text-ink/65">重要操作の記録</p>
        </Link>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <AdminList title="ショップ" rows={(shops ?? []).map((shop) => `${shop.name} / ${shop.is_published ? "公開" : "非公開"}`)} />
        <AdminList title="商品" rows={(products ?? []).map((product) => `${product.name} / ${product.status}`)} />
        <AdminList title="分析イベント" rows={(events ?? []).map((event) => `${event.event_type} / ${new Date(event.created_at).toLocaleString("ja-JP")}`)} />
      </div>
    </section>
  );
}

function AdminList({ title, rows }: { title: string; rows: string[] }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-paper/95 p-5 shadow-sm">
      <h2 className="text-xl font-black">{title}</h2>
      <div className="mt-4 grid gap-2 text-sm">
        {rows.map((row) => (
          <div key={row} className="rounded-md bg-white p-3">{row}</div>
        ))}
      </div>
    </section>
  );
}
