// AmountDisplay — tabular numeric money, hero-scale.
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

interface AmountDisplayProps {
  amountCents: number | bigint;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  className?: string;
  tone?: "default" | "muted" | "success";
}

const sizeMap = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-5xl md:text-6xl",
};

export function AmountDisplay({
  amountCents,
  currency = "USD",
  size = "lg",
  label,
  tone = "default",
  className,
}: AmountDisplayProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      )}
      <span
        className={cn(
          "tabular font-semibold tracking-tight",
          sizeMap[size],
          tone === "muted" && "text-muted-foreground",
          tone === "success" && "text-[color:var(--success)]",
        )}
      >
        {formatMoney(amountCents, currency)}
      </span>
    </div>
  );
}
