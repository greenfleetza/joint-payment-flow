// PaymentMethodPicker — select multiple cards / wallets and split an amount across them.
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Pencil, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { spring } from "@/lib/motion";
import type { DemoPaymentMethod } from "@/lib/demo-session";

export interface MethodAllocation {
  id: string;
  amountCents: number;
  selected: boolean;
}

interface PaymentMethodPickerProps {
  methods: DemoPaymentMethod[];
  allocations: Record<string, MethodAllocation>;
  totalCents: number;
  currency?: string;
  onToggle: (id: string) => void;
  onAmountChange: (id: string, cents: number) => void;
  onRemove: (id: string) => void;
  onSplitEvenly: () => void;
  onAddMethod?: () => void;
}

const BRAND_STYLES: Record<DemoPaymentMethod["brand"], { bg: string; label: string }> = {
  visa: { bg: "from-[#1a1f71] to-[#4b5fbd]", label: "VISA" },
  mastercard: { bg: "from-[#eb001b] to-[#f79e1b]", label: "MC" },
  amex: { bg: "from-[#2e77bb] to-[#0f4c8c]", label: "AMEX" },
  venmo: { bg: "from-[#3d95ce] to-[#008cff]", label: "V" },
  cashapp: { bg: "from-[#00c853] to-[#00e676]", label: "$" },
  applepay: { bg: "from-neutral-800 to-neutral-950", label: "" },
  paypal: { bg: "from-[#003087] to-[#009cde]", label: "PP" },
};

export function PaymentMethodPicker({
  methods,
  allocations,
  totalCents,
  currency = "USD",
  onToggle,
  onAmountChange,
  onRemove,
  onSplitEvenly,
  onAddMethod,
}: PaymentMethodPickerProps) {
  const allocated = useMemo(
    () =>
      methods.reduce((acc, m) => {
        const a = allocations[m.id];
        return acc + (a?.selected ? a.amountCents : 0);
      }, 0),
    [methods, allocations],
  );
  const remaining = totalCents - allocated;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Select payment methods
        </p>
        <button
          type="button"
          onClick={onSplitEvenly}
          className="text-xs font-semibold uppercase tracking-wider text-[color:var(--primary)] hover:underline underline-offset-4"
        >
          Split evenly
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {methods.map((m) => {
            const a = allocations[m.id];
            const selected = !!a?.selected;
            const brand = BRAND_STYLES[m.brand];
            return (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={spring}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
                  selected
                    ? "border-[color:var(--primary)]/40 bg-white"
                    : "border-border/60 bg-secondary/40",
                )}
              >
                <button
                  type="button"
                  onClick={() => onToggle(m.id)}
                  aria-pressed={selected}
                  aria-label={`Toggle ${m.label}`}
                  className={cn(
                    "flex h-10 w-10 flex-none items-center justify-center rounded-full transition-transform active:scale-95",
                    selected
                      ? "bg-[color:var(--primary)] text-white"
                      : "border border-border bg-white text-transparent",
                  )}
                >
                  <Check className="h-5 w-5" />
                </button>

                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <div
                    className={cn(
                      "hidden h-8 w-11 flex-none items-center justify-center rounded-md bg-gradient-to-br text-[10px] font-bold text-white shadow-sm sm:flex",
                      brand.bg,
                    )}
                    aria-hidden
                  >
                    {brand.label}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{m.label}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-muted-foreground">
                      <button type="button" aria-label={`Edit ${m.label}`} className="hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(m.id)}
                        aria-label={`Remove ${m.label}`}
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex flex-none items-center gap-1 rounded-full bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-border/60 transition-opacity",
                    !selected && "opacity-50",
                  )}
                >
                  <span className="text-muted-foreground">$</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={!selected}
                    value={((a?.amountCents ?? 0) / 100).toFixed(2)}
                    onChange={(e) =>
                      onAmountChange(
                        m.id,
                        Math.max(0, Math.round(parseFloat(e.target.value || "0") * 100)),
                      )
                    }
                    className="tabular w-20 bg-transparent text-right font-semibold outline-none"
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {onAddMethod && (
          <button
            type="button"
            onClick={onAddMethod}
            className="mt-1 inline-flex items-center justify-center gap-2 self-center rounded-full border border-dashed border-border bg-secondary/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
              <Plus className="h-3 w-3" />
            </span>
            Add method
          </button>
        )}
      </div>

      {remaining !== 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {remaining > 0
            ? `${formatMoney(remaining, currency)} still to allocate across selected methods.`
            : `Over by ${formatMoney(Math.abs(remaining), currency)}.`}
        </p>
      )}
    </div>
  );
}
