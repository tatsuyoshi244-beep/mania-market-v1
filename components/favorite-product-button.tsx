import { Heart } from "lucide-react";
import { toggleFavoriteProduct } from "@/app/actions";
import { cn } from "@/lib/utils";

type FavoriteProductButtonProps = {
  productId: string;
  active: boolean;
  returnTo: string;
  variant?: "icon" | "text";
};

export function FavoriteProductButton({
  productId,
  active,
  returnTo,
  variant = "icon"
}: FavoriteProductButtonProps) {
  return (
    <form action={toggleFavoriteProduct}>
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="active" value={active ? "true" : "false"} />
      <button
        type="submit"
        className={cn(
          variant === "icon"
            ? "inline-flex size-10 items-center justify-center rounded-md border border-ink/15 bg-white hover:border-cinnabar dark:border-paper/15 dark:bg-ink/80"
            : "rounded-md border border-ink/15 bg-white px-5 py-3 font-semibold hover:border-cinnabar dark:border-paper/15 dark:bg-ink/80",
          active && "border-cinnabar text-cinnabar"
        )}
        title={active ? "お気に入り解除" : "お気に入り"}
      >
        <Heart className={cn("size-4", active && "fill-current")} />
        {variant === "text" ? <span className="ml-2">{active ? "お気に入り解除" : "お気に入り"}</span> : null}
      </button>
    </form>
  );
}