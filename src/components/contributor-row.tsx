import { cn } from "@/lib/utils";
import { formatMoney, initials } from "@/lib/format";
import { PaymentStatusPill } from "./payment-status-pill";

interface ContributorRowProps {
  name: string;
  email: string;
  amountCents: number | bigint;
  currency?: string;
  status: React.ComponentProps<typeof PaymentStatusPill>["status"];
  isInitiator?: boolean;
  action?: React.ReactNode;
  className?: string;
}

export function ContributorRow({
  name,
  email,
  amountCents,
  currency = "USD",
  status,
  isInitiator,
  action,
  className,
}: ContributorRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-border/60 bg-card/70 p-3.5 backdrop-blur-md",
        className,
      )}
    >
      <div
        className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--info)] text-sm font-semibold text-white"
        aria-hidden
      >
        {initials(name || email)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          {isInitiator && (
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              You
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <div className="flex flex-none flex-col items-end gap-1.5">
        <span className="tabular text-sm font-semibold">{formatMoney(amountCents, currency)}</span>
        <PaymentStatusPill status={status} />
      </div>
      {action}
    </div>
  );
}
