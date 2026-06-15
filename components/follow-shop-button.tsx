import { UserCheck, UserPlus } from "lucide-react";
import { toggleFollowShop } from "@/app/actions";
import { cn } from "@/lib/utils";

type FollowShopButtonProps = {
  shopId: string;
  active: boolean;
  returnTo: string;
  variant?: "icon" | "text";
};

export function FollowShopButton({
  shopId,
  active,
  returnTo,
  variant = "icon"
}: FollowShopButtonProps) {
  return (
    <form action={toggleFollowShop}>
      <input type="hidden" name="shop_id" value={shopId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="active" value={active ? "true" : "false"} />
      <button
        type="submit"
        className={cn(
          variant === "icon"
            ? "inline-flex size-9 items-center justify-center rounded-md border border-ink/15 bg-white hover:border-cinnabar dark:border-paper/15 dark:bg-ink/80"
            : active
              ? "rounded-md border border-ink/15 bg-white px-5 py-3 font-semibold hover:border-cinnabar dark:border-paper/15 dark:bg-ink/80"
              : "rounded-md bg-ink px-5 py-3 font-semibold text-white hover:bg-lagoon dark:bg-lagoon",
          active && variant === "icon" && "border-cinnabar text-cinnabar"
        )}
        title={active ? "フォロー解除" : "フォロー"}
      >
        {active ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
        {variant === "text" ? <span className="ml-2">{active ? "フォロー解除" : "フォロー"}</span> : null}
      </button>
    </form>
  );
}