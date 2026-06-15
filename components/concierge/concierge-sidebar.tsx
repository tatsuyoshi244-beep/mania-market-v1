import { ConciergeAskCard } from "@/components/concierge/concierge-ask-card";
import { ConciergeCompletionCard } from "@/components/concierge/concierge-completion-card";
import { ConciergeSuggestionsCard } from "@/components/concierge/concierge-suggestions-card";
import { ConciergeTodayCard } from "@/components/concierge/concierge-today-card";
import type { ConciergeActions, MarketingSuggestions, ShopDiagnosis } from "@/types/concierge";

type ConciergeSidebarProps = {
  diagnosis: ShopDiagnosis;
  actions: ConciergeActions;
  marketing: MarketingSuggestions;
};

export function ConciergeSidebar({ diagnosis, actions, marketing }: ConciergeSidebarProps) {
  return (
    <aside className="w-full lg:w-96 lg:shrink-0">
      <div className="space-y-4 lg:sticky lg:top-24">
        <ConciergeTodayCard actions={actions} />
        <ConciergeAskCard />
        <ConciergeCompletionCard diagnosis={diagnosis} />
        <ConciergeSuggestionsCard marketing={marketing} />
      </div>
    </aside>
  );
}