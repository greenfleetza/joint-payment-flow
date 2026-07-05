import { cn } from "@/lib/utils";
import { Check, Clock, X, Loader2, AlertCircle } from "lucide-react";

type Status =
  | "pending"
  | "invited"
  | "viewed"
  | "processing"
  | "authorized"
  | "captured"
  | "completed"
  | "paid"
  | "failed"
  | "expired"
  | "refunded";

const config: Record<
  Status,
  { label: string; icon: typeof Check; className: string }
> = {
  pending: { label: "Pending", icon: Clock, className: "bg-muted text-muted-foreground" },
  invited: { label: "Invited", icon: Clock, className: "bg-muted text-muted-foreground" },
  viewed: { label: "Viewed", icon: Clock, className: "bg-secondary text-secondary-foreground" },
  processing: {
    label: "Processing",
    icon: Loader2,
    className: "bg-[color:var(--info)]/12 text-[color:var(--info)]",
  },
  authorized: {
    label: "Authorized",
    icon: Check,
    className: "bg-[color:var(--info)]/12 text-[color:var(--info)]",
  },
  captured: {
    label: "Captured",
    icon: Check,
    className: "bg-[color:var(--success)]/15 text-[color:var(--success-foreground)]",
  },
  completed: {
    label: "Completed",
    icon: Check,
    className: "bg-[color:var(--success)]/15 text-[color:var(--success-foreground)]",
  },
  paid: {
    label: "Paid",
    icon: Check,
    className: "bg-[color:var(--success)]/15 text-[color:var(--success-foreground)]",
  },
  failed: {
    label: "Failed",
    icon: X,
    className: "bg-destructive/12 text-destructive",
  },
  expired: {
    label: "Expired",
    icon: AlertCircle,
    className: "bg-[color:var(--warning)]/15 text-[color:var(--warning-foreground)]",
  },
  refunded: {
    label: "Refunded",
    icon: Check,
    className: "bg-muted text-muted-foreground",
  },
};

export function PaymentStatusPill({ status, className }: { status: Status; className?: string }) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        c.className,
        className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", status === "processing" && "animate-spin")} aria-hidden />
      {c.label}
    </span>
  );
}
