import { discountPercent, effectivePrice, formatINR, cn } from "@/lib/utils";

export function Price({ regular, discount, size = "md" }: { regular: number; discount: number | null; size?: "sm" | "md" | "lg" }) {
  const p = { regular_price: regular, discount_price: discount };
  const eff = effectivePrice(p);
  const off = discountPercent(p);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={cn("font-bold text-ink", size === "lg" ? "text-2xl sm:text-3xl" : size === "sm" ? "text-sm" : "text-base")}>{formatINR(eff)}</span>
      {off > 0 && (
        <>
          <span className={cn("text-ink-faint line-through", size === "lg" ? "text-base" : "text-xs")}>{formatINR(regular)}</span>
          <span className={cn("font-bold text-emerald-600", size === "lg" ? "text-sm" : "text-xs")}>{off}% off</span>
        </>
      )}
    </div>
  );
}
