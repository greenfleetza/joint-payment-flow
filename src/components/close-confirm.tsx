// CloseConfirm — top-right X with a confirmation dialog rendered above everything.
import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

interface CloseConfirmProps {
  className?: string;
  redirectTo?: string;
}

export function CloseConfirm({ className, redirectTo = "/" }: CloseConfirmProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const modal = open ? (
    <AnimatePresence>
      <motion.div
        key="close-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
        onClick={() => setOpen(false)}
      >
        <motion.div
          key="close-panel"
          initial={{ scale: 0.94, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 12 }}
          transition={spring}
          onClick={(e) => e.stopPropagation()}
          className="relative z-[9999] w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl ring-1 ring-border/60"
          role="dialog"
          aria-modal="true"
        >
          <h2 className="text-lg font-semibold tracking-tight">Cancel this checkout?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your progress will be lost and any pending invitations will be voided.
            Are you sure you want to leave?
          </p>
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
            >
              Keep going
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate({ to: redirectTo });
              }}
              className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-transform active:scale-[0.97]"
            >
              Yes, cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Close checkout"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-white/80 text-muted-foreground backdrop-blur-md transition-colors hover:bg-white hover:text-foreground",
          className,
        )}
      >
        <X className="h-4 w-4" />
      </button>

      {typeof document !== "undefined" && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
