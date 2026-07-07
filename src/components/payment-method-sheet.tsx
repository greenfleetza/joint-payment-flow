// PaymentMethodSheet — full-screen sheet for selecting existing / adding methods.
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, CreditCard, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import type { TxMethod, MethodBrand } from "@/lib/tx-store";
import { AddCardForm } from "@/components/add-card-form";

interface Props {
  open: boolean;
  title?: string;
  methods: TxMethod[];
  initiallySelected: string[];
  onCancel: () => void;
  onDone: (selectedIds: string[]) => void;
  onAddMethod: (m: TxMethod) => void;
}

function initialsOf(label: string) {
  const parts = label.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "•").toUpperCase() + (parts[1]?.[0] ?? parts[0]?.[1] ?? "").toUpperCase();
}

export function PaymentMethodSheet({
  open,
  title = "Choose a payment method",
  methods,
  initiallySelected,
  onCancel,
  onDone,
  onAddMethod,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initiallySelected));
  const [addingCard, setAddingCard] = useState(false);
  const [addingWallet, setAddingWallet] = useState(false);
  const [walletBrand, setWalletBrand] = useState<MethodBrand>("paypal");

  useEffect(() => {
    if (open) setSelected(new Set(initiallySelected));
  }, [open, initiallySelected]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const walletOptions: { brand: MethodBrand; label: string }[] = useMemo(
    () => [
      { brand: "applepay", label: "Apple Pay" },
      { brand: "googlepay", label: "Google Pay" },
      { brand: "paypal", label: "PayPal" },
      { brand: "venmo", label: "Venmo" },
      { brand: "cashapp", label: "Cash App" },
      { brand: "zelle", label: "Zelle" },
    ],
    [],
  );

  const sheet = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="sheet-backdrop"
          className="fixed inset-0 z-[9990] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            key="sheet-panel"
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={spring}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl ring-1 ring-border/60 sm:rounded-3xl"
          >
            <div className="border-b border-border/60 px-5 pb-3 pt-5">
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <ul className="flex flex-col gap-2">
                {methods.map((m) => {
                  const isSel = selected.has(m.id);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => toggle(m.id)}
                        aria-pressed={isSel}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                          isSel ? "bg-[color:var(--primary)]/10 ring-1 ring-[color:var(--primary)]/40" : "bg-secondary/60 hover:bg-secondary",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 flex-none items-center justify-center rounded-full text-xs font-bold",
                            isSel ? "bg-[color:var(--primary)] text-white" : "bg-white text-foreground ring-1 ring-border",
                          )}
                        >
                          {isSel ? <Check className="h-5 w-5" /> : initialsOf(m.label)}
                        </span>
                        <span className="flex-1 text-sm font-medium">{m.label}</span>
                      </button>
                    </li>
                  );
                })}

                {/* Add new card */}
                <li>
                  {addingCard ? (
                    <AddCardForm
                      onCancel={() => setAddingCard(false)}
                      onSave={({ brand, last4, label }) => {
                        const id = `pm_${brand}_${last4}_${Date.now()}`;
                        onAddMethod({ id, kind: "card", brand, last4, label });
                        setSelected((s) => new Set(s).add(id));
                        setAddingCard(false);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingCard(true)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-secondary/60 px-3 py-3 text-left transition-colors hover:bg-secondary"
                    >
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white ring-1 ring-border">
                        <Plus className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm font-medium">Add new credit/debit card</span>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </li>

                {/* Add new wallet */}
                <li>
                  {addingWallet ? (
                    <div className="rounded-2xl bg-secondary/60 p-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={walletBrand}
                          onChange={(e) => setWalletBrand(e.target.value as MethodBrand)}
                          className="flex-1 rounded-xl bg-white px-2 py-2 text-sm ring-1 ring-border"
                        >
                          {walletOptions.map((w) => (
                            <option key={w.brand} value={w.brand}>{w.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const label = walletOptions.find((w) => w.brand === walletBrand)?.label ?? "Wallet";
                            const id = `pm_${walletBrand}_${Date.now()}`;
                            onAddMethod({ id, kind: "wallet", brand: walletBrand, label });
                            setSelected((s) => new Set(s).add(id));
                            setAddingWallet(false);
                          }}
                          className="rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingWallet(false)}
                          className="rounded-full px-3 py-1.5 text-xs text-muted-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingWallet(true)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-secondary/60 px-3 py-3 text-left transition-colors hover:bg-secondary"
                    >
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white ring-1 ring-border">
                        <Plus className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm font-medium">Add new digital wallet</span>
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border/60 px-4 py-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-full bg-secondary px-4 py-3 text-sm font-semibold text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onDone(Array.from(selected))}
                className="flex-1 rounded-full bg-[color:var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.97]"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(sheet, document.body) : null;
}
