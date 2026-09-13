import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { addPartnerLeadActivity, updatePartnerLead } from "@/app/admin/partner-leads/actions";
import { getPartnerLead, listPartnerLeadActivities, PARTNER_LEAD_ACTIVITY, PARTNER_LEAD_STATUS, partnerLeadStatusLabel } from "@/lib/partner-leads";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ id: string }> };

export default async function PartnerLeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [lead, activities] = await Promise.all([getPartnerLead(id), listPartnerLeadActivities(id)]);
  if (!lead) notFound();
  const invitePath = `/partner/apply?lead=${lead.invite_token}&utm_source=direct_outreach&utm_campaign=partner_invite`;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <Link href={"/admin/partner-leads" as Route} className="text-sm font-semibold text-lagoon hover:text-cinnabar">← 営業一覧</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="font-display text-4xl font-semibold">{lead.shop_name}</h1><p className="mt-2 text-sm text-ink/60">{partnerLeadStatusLabel(lead.status)} · {lead.source}</p></div>
        <Link href={invitePath as Route} className="rounded-full bg-cinnabar px-5 py-2.5 text-sm font-bold text-white">招待ページを開く</Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <form action={updatePartnerLead} className="grid gap-4 rounded-3xl border border-ink/10 bg-white/85 p-6 shadow-sm dark:bg-ink/50 sm:grid-cols-2">
          <input type="hidden" name="lead_id" value={lead.id} />
          <Field name="shop_name" label="店舗・サービス名" defaultValue={lead.shop_name} required />
          <Field name="contact_name" label="担当者名" defaultValue={lead.contact_name ?? ""} />
          <Field name="email" label="メール" type="email" defaultValue={lead.email ?? ""} />
          <Field name="category" label="ジャンル" defaultValue={lead.category ?? ""} />
          <Field name="region" label="地域" defaultValue={lead.region ?? ""} />
          <Field name="source" label="発見元" defaultValue={lead.source} />
          <Field name="website_url" label="公式サイト" type="url" defaultValue={lead.website_url ?? ""} />
          <Field name="instagram_url" label="Instagram" type="url" defaultValue={lead.instagram_url ?? ""} />
          <Field name="x_url" label="X" type="url" defaultValue={lead.x_url ?? ""} />
          <label className="grid gap-1.5 text-sm font-medium">状態<select name="status" defaultValue={lead.status} className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:bg-ink">{PARTNER_LEAD_STATUS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-medium">優先度<select name="priority" defaultValue={lead.priority} className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:bg-ink"><option value="3">高</option><option value="2">中</option><option value="1">低</option></select></label>
          <label className="grid gap-1.5 text-sm font-medium">次回対応<input name="next_action_at" type="datetime-local" defaultValue={toLocalInput(lead.next_action_at)} className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:bg-ink" /></label>
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">メモ<textarea name="notes" rows={4} defaultValue={lead.notes ?? ""} className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:bg-ink" /></label>
          <button className="w-fit rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-lagoon dark:bg-lagoon">更新する</button>
        </form>

        <div className="grid content-start gap-6">
          <section className="rounded-3xl border border-cinnabar/20 bg-cinnabar/5 p-6">
            <h2 className="font-display text-2xl font-semibold">専用招待リンク</h2>
            <p className="mt-3 break-all rounded-xl bg-white/80 p-3 text-xs">{invitePath}</p>
            <p className="mt-3 text-xs leading-6 text-ink/55">このリンクから申請されると、申請と営業候補が自動で結び付きます。</p>
          </section>
          <form action={addPartnerLeadActivity} className="rounded-3xl border border-ink/10 bg-white/85 p-6 dark:bg-ink/50">
            <input type="hidden" name="lead_id" value={lead.id} />
            <h2 className="font-display text-2xl font-semibold">連絡を記録</h2>
            <select name="activity_type" className="mt-4 w-full rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:bg-ink">{PARTNER_LEAD_ACTIVITY.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <textarea name="note" required rows={4} placeholder="送った内容、返答、次に行うこと" className="mt-3 w-full rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:bg-ink" />
            <button className="mt-3 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-bold hover:border-cinnabar">記録する</button>
          </form>
        </div>
      </div>

      <section className="mt-8 rounded-3xl border border-ink/10 bg-white/85 p-6 dark:bg-ink/50">
        <h2 className="font-display text-2xl font-semibold">活動履歴</h2>
        <div className="mt-5 grid gap-3">{activities.map((item) => <article key={item.id} className="rounded-xl border border-ink/8 p-4"><div className="flex justify-between gap-3 text-xs text-ink/50"><span>{item.activity_type}</span><time>{new Date(item.created_at).toLocaleString("ja-JP")}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.note}</p></article>)}{activities.length === 0 ? <p className="text-sm text-ink/55">まだ連絡履歴はありません。</p> : null}</div>
      </section>
    </section>
  );
}

function Field({ name, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { name: string; label: string }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<input name={name} {...props} className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:bg-ink" /></label>;
}

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
