import Link from "next/link";
import { ArrowRight, ListTodo } from "lucide-react";
import type { ConciergeActions } from "@/types/concierge";

type ConciergeTodayCardProps = {
  actions: ConciergeActions;
};

const PRIORITY_CLASS = {
  high: "border-cinnabar/30 bg-cinnabar/8 text-cinnabar",
  medium: "border-lagoon/30 bg-lagoon/8 text-lagoon",
  low: "border-ink/10 bg-ink/5 text-ink/60 dark:border-paper/15 dark:bg-paper/5 dark:text-paper/60"
} as const;

export function ConciergeTodayCard({ actions }: ConciergeTodayCardProps) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-white/90 p-4 shadow-sm dark:border-paper/10 dark:bg-ink/60">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <ListTodo className="size-4 text-cinnabar" />
        今日のやること
      </h3>
      <ul className="mt-3 space-y-2">
        {actions.today.length === 0 ? (
          <li className="text-xs text-ink/55 dark:text-paper/55">急ぎのタスクはありません 🎉</li>
        ) : (
          actions.today.map((task) => (
            <li key={task.id}>
              {task.href ? (
                <Link
                  href={task.href}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition hover:opacity-80 ${PRIORITY_CLASS[task.priority]}`}
                >
                  <span>{task.label}</span>
                  <ArrowRight className="size-3.5 shrink-0" />
                </Link>
              ) : (
                <span className={`block rounded-xl border px-3 py-2 text-xs font-medium ${PRIORITY_CLASS[task.priority]}`}>
                  {task.label}
                </span>
              )}
            </li>
          ))
        )}
      </ul>
      {actions.nextAction ? (
        <div className="mt-3 rounded-xl border border-dashed border-ink/15 p-3 dark:border-paper/15">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/45">Next</p>
          <p className="mt-1 text-xs font-semibold">{actions.nextAction.label}</p>
          <p className="mt-1 text-[11px] leading-5 text-ink/55 dark:text-paper/55">{actions.nextAction.description}</p>
          <Link href={actions.nextAction.href} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-cinnabar">
            進む <ArrowRight className="size-3" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}