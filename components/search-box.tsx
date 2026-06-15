import Link from "next/link";
import { Search } from "lucide-react";

type SearchBoxProps = {
  placeholder: string;
  action?: string;
  defaultQuery?: string;
  hiddenFields?: Record<string, string | undefined>;
};

export function SearchBox({
  placeholder,
  action = "",
  defaultQuery = "",
  hiddenFields = {}
}: SearchBoxProps) {
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      {Object.entries(hiddenFields).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null
      )}
      <label className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/45 dark:text-paper/45" />
        <input
          name="q"
          defaultValue={defaultQuery}
          className="w-full rounded-md border border-ink/15 bg-white py-3 pl-10 pr-3 text-ink dark:border-paper/15 dark:bg-ink/60 dark:text-paper"
          placeholder={placeholder}
        />
      </label>
      <button className="rounded-md bg-cinnabar px-5 py-3 font-semibold text-white hover:bg-ink dark:hover:bg-lagoon">
        検索
      </button>
    </form>
  );
}
