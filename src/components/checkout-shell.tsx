// Shared checkout shell: merchant header + progress dots + card container.
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { AmbientBackground } from "@/components/ambient-background";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface CheckoutShellProps {
  merchantName: string;
  merchantInitial: string;
  orderReference?: string;
  step?: number;
  totalSteps?: number;
  children: ReactNode;
}

export function CheckoutShell({
  merchantName,
  merchantInitial,
  orderReference,
  step,
  totalSteps = 3,
  children,
}: CheckoutShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackground />
      <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-background">
            {merchantInitial}
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{merchantName}</p>
            {orderReference && (
              <p className="mt-1 text-xs text-muted-foreground">Order {orderReference}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Secured by ZakaPay
        </div>
      </header>

      {typeof step === "number" && (
        <div className="relative z-10 mx-auto flex w-full max-w-3xl items-center gap-1.5 px-6 pb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i < step ? "bg-foreground" : "bg-secondary",
              )}
            />
          ))}
        </div>
      )}

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 pb-16 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
