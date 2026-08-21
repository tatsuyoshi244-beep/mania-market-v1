import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { getAuthUser } from "@/lib/auth";
import { queryOne, queryRows } from "@/lib/neon/db";

export default async function AdminPage() {
  const authUser = await getAuthUser();
  if (!authUser) return <div className="px-4 py-10"><AuthCard /></div>;
  const user = await queryOne<{ role: string }>("select role from public.users where id=$1", [authUser.id]);

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

  const [shops, products, events] = await Promise.all([
    queryRows<{name:string;is_published:boolean}>("select name,is_published from public.shops order by created_at desc limit 20"),
    queryRows<{name:string;status:string}>("select name,status::text from public.products order by created_at desc limit 20"),
    queryRows<{event_type:string;created_at:string}>("select event_type,created_at::text from public.analytics_events order by created_at desc limit 20")
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
        <AdminList title="ショップ" rows={shops.map((shop) => `${shop.name} / ${shop.is_published ? "公開" : "非公開"}`)} />
        <AdminList title="商品" rows={products.map((product) => `${product.name} / ${product.status}`)} />
        <AdminList title="分析イベント" rows={events.map((event) => `${event.event_type} / ${new Date(event.created_at).toLocaleString("ja-JP")}`)} />
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
