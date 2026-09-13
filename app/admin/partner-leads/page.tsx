import Link from "next/link";
import type { Route } from "next";
import { createPartnerLead } from "@/app/admin/partner-leads/actions";
import { getPartnerLeadSummary, listPartnerLeads, PARTNER_LEAD_STATUS, partnerLeadStatusLabel } from "@/lib/partner-leads";
import type { PartnerLeadStatus } from "@/types/database";

export const metadata = { title: "パートナー営業 — Mania Market Admin" };
export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ status?: string }> };

function validStatus(value?: string): PartnerLeadStatus | null {
  return PARTNER_LEAD_STATUS.some((item) => item.value === value) ? value as PartnerLeadStatus : null;
}

export default async function AdminPartnerLeadsPage({ searchParams }: PageProps) {
  const selectedStatus = validStatus((await searchParams).status);
  const [leads, summary] = await Promise.all([listPartnerLeads(selectedStatus), getPartnerLeadSummary()]);
  const total = [...summary.values()].reduce((sum, count) => sum + count, 0);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cinnabar">Partner Growth</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">パートナー営業</h1>
          <p className="mt-2 text-sm text-ink/60">候補発見から申請・掲載までを一つの案件として管理します。</p>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-lagoon hover:text-cinnabar">← 管理トップ</Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryLink href="/admin/partner-leads" label="すべて" count={total} active={!selectedStatus} />
        {PARTNER_LEAD_STATUS.slice(0, 4).map((item) => (
          <SummaryLink key={item.value} href={`/admin/partner-leads?status=${item.value}`} label={item.label} count={summary.get(item.value) ?? 0} active={selectedStatus === item.value} />
        ))}
      </div>

      <details className="mt-8 rounded-3xl border border-ink/10 bg-white/85 p-5 shadow-sm dark:border-paper/10 dark:bg-ink/50">
        <summary className="cursor-pointer text-lg font-bold">営業候補を追加</summary>
        <form action={createPartnerLead} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field name="shop_name" label="店舗・サービス名" required />
          <Field name="contact_name" label="担当者名" />
          <Field name="email" label="メール" type="email" />
          <Field name="category" label="ジャンル" placeholder="ヴィンテージ / AI など" />
          <Field name="region" label="地域" placeholder="東京都 / オンライン" />
          <Field name="source" label="発見元" placeholder="Instagram / 紹介 / 検索" defaultValue="manual" />
          <Field name="website_url" label="公式サイト" type="url" placeholder="https://" />
          <Field name="instagram_url" label="Instagram" type="url" placeholder="https://instagram.com/..." />
          <Field name="x_url" label="X" type="url" placeholder="https://x.com/..." />
          <label className="grid gap-1.5 text-sm font-medium">優先度
            <select name="priority" defaultValue="2" className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:bg-ink">
              <option value="3">高</option><option value="2">中</option><option value="1">低</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">次回対応
            <input name="next_action_at" type="datetime-local" className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:bg-ink" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2 lg:col-span-3">メモ
            <textarea name="notes" rows={3} className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:bg-ink" />
          </label>
          <button className="w-fit rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-lagoon dark:bg-lagoon">候補を保存</button>
        </form>
      </details>

      <details className="mt-5 rounded-3xl border border-lagoon/20 bg-lagoon/5 p-5">
        <summary className="cursor-pointer text-lg font-bold">営業テンプレートと選定基準</summary>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl bg-white/85 p-5 dark:bg-ink/50">
            <h2 className="font-bold">最初に声をかける条件</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/65">
              <li>・専門性が一文で説明できる</li>
              <li>・公式サイトまたは販売先がある</li>
              <li>・商品写真と説明が一定品質に達している</li>
              <li>・他店との差が見える</li>
            </ul>
          </article>
          <article className="rounded-2xl bg-white/85 p-5 dark:bg-ink/50">
            <h2 className="font-bold">初回連絡</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink/65">{`突然のご連絡失礼します。\nMania Marketは、専門性の高いショップを、まだその世界を知らない人へ届ける発見プラットフォームです。\n\n貴店の「［具体的に惹かれた点］」に専門性を感じ、ご案内しました。掲載は無料3商品から始められ、購入は現在の公式サイトへ直接送客します。\n\nご関心があれば、こちらの専用ページから内容をご確認ください。`}</p>
          </article>
          <article className="rounded-2xl bg-white/85 p-5 dark:bg-ink/50 lg:col-span-2">
            <h2 className="font-bold">返信がない場合の確認</h2>
            <p className="mt-3 text-sm leading-7 text-ink/65">5〜7日後に一度だけ、掲載費用・決済方法・送客先を短く補足します。返答がなければ「保留」にし、繰り返し送信しません。</p>
          </article>
        </div>
      </details>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white/90 shadow-sm dark:bg-ink/50">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper/80 text-xs text-ink/55">
            <tr><th className="px-4 py-3">候補</th><th className="px-4 py-3">状態</th><th className="px-4 py-3">優先度</th><th className="px-4 py-3">次回対応</th><th className="px-4 py-3">最終連絡</th></tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-4">
                  <Link href={`/admin/partner-leads/${lead.id}` as Route} className="font-bold hover:text-cinnabar">{lead.shop_name}</Link>
                  <p className="mt-1 text-xs text-ink/50">{[lead.category, lead.region, lead.source].filter(Boolean).join(" · ")}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-4">{partnerLeadStatusLabel(lead.status)}</td>
                <td className="px-4 py-4">{lead.priority === 3 ? "高" : lead.priority === 2 ? "中" : "低"}</td>
                <td className="whitespace-nowrap px-4 py-4">{formatDate(lead.next_action_at)}</td>
                <td className="whitespace-nowrap px-4 py-4">{formatDate(lead.last_contacted_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 ? <p className="p-8 text-center text-sm text-ink/55">該当する営業候補はありません。</p> : null}
      </div>
    </section>
  );
}

function SummaryLink({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return <Link href={href as Route} className={`rounded-2xl border p-4 ${active ? "border-cinnabar bg-cinnabar/8" : "border-ink/10 bg-white/80"}`}><p className="text-xs text-ink/55">{label}</p><p className="mt-1 text-2xl font-black">{count}</p></Link>;
}

function Field({ name, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { name: string; label: string }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<input name={name} {...props} className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:bg-ink" /></label>;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
}
