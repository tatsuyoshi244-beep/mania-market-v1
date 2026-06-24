import Link from "next/link";
import { signOut } from "@/app/actions";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import type { DashboardAccessMode } from "@/lib/dashboard/access";

type DashboardShellProps = {
  title: string;
  description?: string;
  email?: string;
  mode: DashboardAccessMode;
  shopName?: string | null;
  children: React.ReactNode;
};

export function DashboardShell({
  title,
  description,
  email,
  mode,
  shopName,
  children
}: DashboardShellProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="rounded-2xl border border-ink/10 bg-paper/90 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/45">Seller Dashboard</p>
            {shopName ? <p className="mt-2 text-sm font-semibold text-ink/75">{shopName}</p> : null}
            <div className="mt-4 lg:sticky lg:top-6">
              <DashboardNav />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black sm:text-4xl">{title}</h1>
              {description ? <p className="mt-2 text-sm text-ink/65 sm:text-base">{description}</p> : null}
              {email ? <p className="mt-1 text-xs text-ink/45">{email}</p> : null}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm font-semibold text-lagoon hover:text-cinnabar">サイトを見る</Link>
              <form action={signOut}>
                <button className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold hover:border-cinnabar">
                  ログアウト
                </button>
              </form>
            </div>
          </div>

          {mode === "admin-readonly" ? (
            <p className="mt-4 rounded-xl border border-lagoon/25 bg-lagoon/8 px-4 py-3 text-sm text-ink/75">
              管理者として閲覧中です。編集操作はショップオーナーのみ実行できます。
            </p>
          ) : null}

          {mode === "seller-no-shop" ? (
            <p className="mt-4 rounded-xl border border-cinnabar/25 bg-cinnabar/8 px-4 py-3 text-sm text-ink/75">
              まだ管理中のショップがありません。
              <Link href="/mypage/applications" className="ml-2 font-bold text-cinnabar hover:underline">
                出店申請・引き継ぎ
              </Link>
              から始めてください。
            </p>
          ) : null}

          <div className="mt-6 sm:mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}