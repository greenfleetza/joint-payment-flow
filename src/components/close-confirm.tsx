// CloseConfirm — top-right X with an "are you sure?" confirmation.
import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

interface CloseConfirmProps {
  className?: string;
  redirectTo?: string;
}

export function CloseConfirm({ className, redirectTo = "/" }: CloseConfirmProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Close checkout"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-white/70 text-muted-foreground backdrop-blur-md transition-colors hover:bg-white hover:text-foreground",
          className,
        )}
      >
        <X className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="close-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              key="close-panel"
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={spring}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl"
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
                  className="rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-transform active:scale-[0.97]"
                >
                  Yes, cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
