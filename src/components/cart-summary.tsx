// CartSummary — expandable cart items with optional coupon, subtotal, VAT and total.
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Tag, ShoppingBag, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { spring } from "@/lib/motion";
import type { DemoCartItem } from "@/lib/demo-session";

interface CartSummaryProps {
  items: DemoCartItem[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  currency?: string;
  showCoupon?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function CartSummary({
  items,
  subtotalCents,
  vatCents,
  totalCents,
  currency = "USD",
  showCoupon = true,
  defaultOpen = false,
  className,
}: CartSummaryProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(false);
  const discount = applied ? Math.round(subtotalCents * 0.1) : 0;
  const finalTotal = totalCents - discount;
  const itemCount = items.reduce((a, b) => a + b.qty, 0);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-white/80 backdrop-blur-md",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white"
      >
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[color:var(--primary)]/10 text-[color:var(--primary)]">
          <ShoppingBag className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your order
          </p>
          <p className="truncate text-sm font-semibold">
            {itemCount} {itemCount === 1 ? "item" : "items"} · {formatMoney(finalTotal, currency)}
          </p>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 flex-none text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="cart-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-4">
              <ul className="flex flex-col gap-2">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-foreground">
                      <span className="text-muted-foreground">{it.qty}×</span> {it.name}
                    </span>
                    <span className="tabular flex-none text-foreground">
                      {formatMoney(it.unitCents * it.qty, currency)}
                    </span>
                  </li>
                ))}
              </ul>

              {showCoupon && (
                <div className="flex items-center gap-2 rounded-xl bg-secondary/60 p-2">
                  <Tag className="ml-1 h-4 w-4 text-muted-foreground" />
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    disabled={applied}
                    placeholder="Promo code"
                    className="flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => coupon.trim() && setApplied(true)}
                    disabled={applied || !coupon.trim()}
                    className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background disabled:opacity-40"
                  >
                    {applied ? <><Check className="h-3 w-3" /> Applied</> : "Apply"}
                  </button>
                </div>
              )}

              <div className="mt-1 flex flex-col gap-1.5 border-t border-border/60 pt-3 text-sm">
                <Row label="Subtotal" value={formatMoney(subtotalCents, currency)} muted />
                {applied && (
                  <Row
                    label="Promo (10% off)"
                    value={`- ${formatMoney(discount, currency)}`}
                    accent
                  />
                )}
                <Row label="VAT" value={formatMoney(vatCents, currency)} muted />
                <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="tabular text-base font-semibold">
                    {formatMoney(finalTotal, currency)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value, muted, accent }: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-sm", muted && "text-muted-foreground")}>{label}</span>
      <span
        className={cn(
          "tabular text-sm",
          muted && "text-muted-foreground",
          accent && "text-[color:var(--success)]",
        )}
      >
        {value}
      </span>
    </div>
  );
}
