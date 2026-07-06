// EditContributorDialog — edit name + email of an already-invited contributor (amount locked).
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { spring } from "@/lib/motion";
import { formatMoney } from "@/lib/format";

interface Props {
  open: boolean;
  name: string;
  email: string;
  shareCents: number;
  onCancel: () => void;
  onSave: (name: string, email: string) => void;
}

export function EditContributorDialog({ open, name, email, shareCents, onCancel, onSave }: Props) {
  const [n, setN] = useState(name);
  const [e, setE] = useState(email);
  useEffect(() => {
    if (open) {
      setN(name);
      setE(email);
    }
  }, [open, name, email]);

  const body = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={spring}
            onClick={(ev) => ev.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl"
          >
            <h2 className="text-lg font-semibold tracking-tight">Edit contributor</h2>
            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Full name</span>
                <input
                  value={n}
                  onChange={(ev) => setN(ev.target.value)}
                  className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Email address</span>
                <input
                  value={e}
                  type="email"
                  onChange={(ev) => setE(ev.target.value)}
                  className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2">
                <span className="text-xs text-muted-foreground">Share (locked)</span>
                <span className="tabular text-sm font-semibold">{formatMoney(shareCents)}</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave(n.trim(), e.trim())}
                disabled={!n.trim() || !e.trim()}
                className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(body, document.body) : null;
}
