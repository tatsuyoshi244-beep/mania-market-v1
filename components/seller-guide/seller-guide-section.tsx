import { cn } from "@/lib/utils";

type SellerGuideSectionProps = {
  label: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
};

export function SellerGuideSection({
  label,
  title,
  description,
  children,
  className,
  dark = false
}: SellerGuideSectionProps) {
  return (
    <section
      className={cn(
        "py-16 sm:py-24",
        dark ? "border-y border-ink/10 bg-ink text-paper dark:border-paper/10" : "",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <p
            className={cn(
              "text-xs font-bold uppercase tracking-[0.2em]",
              dark ? "text-paper/50" : "text-cinnabar"
            )}
          >
            {label}
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">{title}</h2>
          {description ? (
            <p className={cn("mt-4 text-sm leading-8 sm:text-base", dark ? "text-paper/65" : "text-ink/65 dark:text-paper/65")}>
              {description}
            </p>
          ) : null}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}