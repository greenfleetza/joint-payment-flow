// Shared checkout shell: merchant header + step bar + optional close button.
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AmbientBackground } from "@/components/ambient-background";
import { CloseConfirm } from "@/components/close-confirm";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils"

interface CheckoutShellProps {
  merchantName: string;
  merchantInitial: string;
  orderReference?: string;
  step?: number;
  totalSteps?: number;
  showStepBar?: boolean;
  showClose?: boolean;
  children: ReactNode;
}

export function CheckoutShell({
  merchantName,
  merchantInitial,
  orderReference,
  step,
  totalSteps = 3,
  showStepBar = true,
  showClose = false,
  children,
}: CheckoutShellProps) {
  const navigate = useNavigate();
  const renderBar = showStepBar && typeof step === "number";
  const [logoConfirm, setLogoConfirm] = useState(false);

  const logoModal = logoConfirm ? (
    <AnimatePresence>
      <motion.div
        key="logo-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
        onClick={() => setLogoConfirm(false)}
      >
        <motion.div
          key="logo-panel"
          initial={{ scale: 0.94, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 12 }}
          transition={spring}
          onClick={(e) => e.stopPropagation()}
          className="relative z-[9999] w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl ring-1 ring-border/60"
          role="dialog"
          aria-modal="true"
        >
          <h2 className="text-lg font-semibold tracking-tight">Go to home?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to leave? Your current progress may be lost.
          </p>
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setLogoConfirm(false)}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
            >
              Stay here
            </button>
            <button
              type="button"
              onClick={() => { setLogoConfirm(false); navigate({ to: "/" }); }}
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform active:scale-[0.97]"
            >
              Yes, go home
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  ) : null;

  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackground />
      <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <button type="button" onClick={() => setLogoConfirm(true)} className="flex min-w-0 items-center gap-3 text-left">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-background">
            {merchantInitial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-none">{merchantName}</p>
            {orderReference && (
              <p className="mt-1 truncate text-xs text-muted-foreground">Order {orderReference}</p>
            )}
          </div>
        </button>
        <div className="flex flex-none items-center gap-2">
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Secured by ZakaPay
          </div>
          {showClose && <CloseConfirm />}
        </div>
      </header>

      {renderBar && (
        <div className="relative z-10 mx-auto flex w-full max-w-3xl items-center gap-3 px-6 pb-2">
          <div className="flex flex-1 items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i < (step ?? 0) ? "bg-foreground" : "bg-secondary",
                )}
              />
            ))}
          </div>
          <span className="flex-none text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {step} of {totalSteps}
          </span>
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
      {typeof document !== "undefined" && logoModal ? createPortal(logoModal, document.body) : null}
    </div>
  );
}
