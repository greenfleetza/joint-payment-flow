// ProcessingCard — flip animation showing card face / wallet logo while a payment is being authorized.
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TxMethod } from "@/lib/tx-store";

const BRAND_GRADIENT: Record<string, string> = {
  visa: "from-[#1a1f71] to-[#4b5fbd]",
  mastercard: "from-[#eb001b] via-[#ff5f00] to-[#f79e1b]",
  amex: "from-[#2e77bb] to-[#0f4c8c]",
  applepay: "from-neutral-900 to-neutral-700",
  googlepay: "from-white to-neutral-200",
  paypal: "from-[#003087] to-[#009cde]",
  venmo: "from-[#3d95ce] to-[#008cff]",
  cashapp: "from-[#00c853] to-[#00a63a]",
  zelle: "from-[#6d1ed4] to-[#a020f0]",
};

const BRAND_LABEL: Record<string, string> = {
  visa: "VISA",
  mastercard: "mastercard",
  amex: "AMERICAN EXPRESS",
  applepay: " Pay",
  googlepay: "G Pay",
  paypal: "PayPal",
  venmo: "venmo",
  cashapp: "Cash App",
  zelle: "zelle",
};

interface Props {
  method: TxMethod;
  amountCents: number;
  state: "pending" | "active" | "done";
}

export function ProcessingCard({ method, amountCents, state }: Props) {
  const isWallet = method.kind === "wallet";
  const grad = BRAND_GRADIENT[method.brand] ?? "from-neutral-800 to-neutral-600";
  const brandLabel = BRAND_LABEL[method.brand] ?? method.label;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="perspective-[1200px]"
    >
      <motion.div
        animate={{
          rotateY: state === "active" ? [0, 180, 360] : 0,
          scale: state === "active" ? 1.02 : 1,
        }}
        transition={{
          rotateY: state === "active"
            ? { duration: 1.8, ease: "easeInOut", repeat: Infinity }
            : { duration: 0 },
          scale: { type: "spring", stiffness: 300, damping: 20 },
        }}
        style={{ transformStyle: "preserve-3d" }}
        className={cn(
          "relative h-40 w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-xl mx-auto",
          grad,
          method.brand === "googlepay" && "text-neutral-800",
        )}
      >
        {isWallet ? (
          <div className="flex h-full flex-col items-center justify-center">
            <p className="text-3xl font-bold tracking-tight" style={{ backfaceVisibility: "hidden" }}>
              {brandLabel}
            </p>
            <p className="mt-2 text-xs opacity-70">Digital wallet</p>
          </div>
        ) : (
          <div className="flex h-full flex-col justify-between p-1" style={{ backfaceVisibility: "hidden" }}>
            <div className="flex items-start justify-between">
              <div className="flex h-8 w-11 items-center justify-center rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500">
                <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
                  <rect width="24" height="16" rx="2" fill="rgba(0,0,0,0.1)"/>
                  <circle cx="9" cy="8" r="5" fill="#EB001B" opacity="0.8"/>
                  <circle cx="15" cy="8" r="5" fill="#F79E1B" opacity="0.8"/>
                </svg>
              </div>
              <p className="text-sm font-bold uppercase tracking-wider">{brandLabel}</p>
            </div>
            <div>
              <p className="tabular text-lg font-semibold tracking-widest">
                •••• •••• •••• {method.last4 ?? "0000"}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wider opacity-80">
                <span>Card Holder</span>
                <span className="tabular">12/28</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className={cn(
          "font-semibold uppercase tracking-wider",
          state === "done" && "text-[color:var(--success)]",
          state === "active" && "text-[color:var(--primary)]",
          state === "pending" && "text-muted-foreground",
        )}>
          {state === "done" ? "Authorized" : state === "active" ? "Authorizing…" : "Waiting"}
        </span>
        <span className="tabular font-semibold">
          ${(amountCents / 100).toFixed(2)}
        </span>
      </div>
    </motion.div>
  );
}
