// Card entry form using react-payment-inputs (card number, expiry, CVC).
import { useState } from "react";
import { usePaymentInputs } from "react-payment-inputs";
import { CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MethodBrand } from "@/lib/tx-store";

interface Props {
  onSave: (m: { brand: MethodBrand; last4: string; label: string }) => void;
  onCancel: () => void;
}

const BRAND_MAP: Record<string, MethodBrand> = {
  visa: "visa",
  mastercard: "mastercard",
  "american-express": "amex",
  amex: "amex",
};

export function AddCardForm({ onSave, onCancel }: Props) {
  const { meta, getCardNumberProps, getExpiryDateProps, getCVCProps } = usePaymentInputs();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");

  const digits = cardNumber.replace(/\D/g, "");
  const brandKey = (meta.cardType?.type as string | undefined) ?? "visa";
  const brand: MethodBrand = BRAND_MAP[brandKey] ?? "visa";
  const last4 = digits.slice(-4);
  const canSave = digits.length >= 13 && !!expiry && cvc.length >= 3 && !meta.error;

  function submit() {
    if (!canSave) return;
    onSave({
      brand,
      last4,
      label: `${brand[0].toUpperCase() + brand.slice(1)} •••• ${last4}`,
    });
  }

  return (
    <div className="rounded-2xl bg-secondary/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <CreditCard className="h-4 w-4" /> Add a new card
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cc-name">Cardholder name</Label>
          <Input
            id="cc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name on card"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cc-number">Card number</Label>
          <div className="relative">
            <Input
              id="cc-number"
              {...getCardNumberProps({
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCardNumber(e.target.value),
              })}
              value={cardNumber}
              className="pr-14 tabular"
              placeholder="0000 0000 0000 0000"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {brandKey.replace("-", " ")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cc-exp">Expiry</Label>
            <Input
              id="cc-exp"
              {...getExpiryDateProps({
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setExpiry(e.target.value),
              })}
              value={expiry}
              className="tabular"
              placeholder="MM / YY"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cc-cvc">CVC</Label>
            <Input
              id="cc-cvc"
              {...getCVCProps({
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCvc(e.target.value),
              })}
              value={cvc}
              className="tabular"
              placeholder="123"
            />
          </div>
        </div>

        {meta.isTouched && meta.error && (
          <p className="text-xs text-[color:var(--destructive)]">{meta.error}</p>
        )}

        <div className="mt-1 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSave}
            className="rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
          >
            Save card
          </button>
        </div>
      </div>
    </div>
  );
}
