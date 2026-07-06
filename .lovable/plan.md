# ZakaPay Checkout Overhaul — Implementation Plan

This is a large, interlocking change. I'll implement it in tightly-scoped modules so state, screens, and flows stay consistent. All work stays in frontend/presentation — no backend schema changes.

## 1. Foundational: Transaction Store (`src/lib/tx-store.ts`)

A single in-memory Zustand-style store (plain module + `useSyncExternalStore` hook) keyed by transaction ID. Every screen reads/writes here so data stays specific per transaction.

```text
TxStore
├── transactions: Record<txId, Transaction>
├── createContributorTx() → returns C-prefixed id
├── createMultiCardTx()   → returns M-prefixed id
├── updateContributors(txId, ...)
├── updatePayerAllocations(txId, contributorId, methods[])
├── markContributorPaid(txId, contributorId)
├── setPromo(txId, code, discountCents)
└── selectors: getRemaining, getPaidCount, getExpiresAt (+7d)
```

Cart items, subtotal, VAT, total, contributors, allocations, promo, expiry, kind (`contributor` | `multi_card`) all live here.

## 2. Shared Components

- **`CloseConfirm`** — raise z-index to `z-[100]`, backdrop `z-[99]`. "Yes" → `navigate({to:"/"})`. Reused everywhere.
- **`PaymentMethodSheet`** (new) — full-screen modal matching uploaded screenshot #1: list all methods with initials-avatars (AM/AP/GO/PA/VE/CA/ZE), checkboxes, "Add new credit/debit card" & "Add new digital wallet" rows, Cancel/Done buttons. Returns selected method IDs. Used from both `pay.tsx` "Add method" and multi-card screen.
- **`ProcessingCard`** — animated flipping card component. Renders realistic Visa/MC/Amex face with brand gradient + chip + last4, or wallet logo tile. Cycles through allocations sequentially with framer-motion 3D flip.
- **`CelebrationBurst`** — confetti-ish SVG burst for thread-completed screens.
- **`ReceiptSection`** — expanded cart items + subtotal/VAT/promo/total block, reused in both completed screens and status screen.

## 3. Screen Changes

### `checkout.$sessionId.index.tsx` (Split Method)
On selection, create tx in store (C… for contributor, M… for multi-card), navigate with new txId in URL param.

### `checkout.$sessionId.contributors.tsx` (Add Contributors, S02)
- Add **Split Evenly** button that divides total across all contributor rows (initiator included).
- Validation: name + email required on every row; send button disabled otherwise AND until sum === total.

### `checkout.$sessionId.invited.tsx` (S03)
- Render every contributor from store for this txId.
- Bottom action row: **[Payment Status] [Pay Your Share]** side-by-side, half-width each.
- Payment Status button and short-URL link both → `/checkout/$sessionId/status`.
- Edit Details opens dialog editing name + email only (amount locked).
- Copy: "Invitations expire in 7 days".

### `checkout.$sessionId.pay.tsx` (S04 Pay Your Share)
- Remove "Pay Your Share" sub-label and the "Charged only when…" footer.
- "Add method" opens `PaymentMethodSheet`; selections merge into allocation list.
- Submit → `/processing`.

### `checkout.$sessionId.cards.tsx` (S07 Multi-Card)
- Remove "Distribute across your cards"; render `CartSummary` instead (same as previous screens).
- Show M-prefixed txId chip.
- Activate Back button + add `CloseConfirm` X.
- Replace add-card inline UI with `PaymentMethodSheet` trigger (adapted: no "your share" language). Allocation rows show selected methods with amount inputs + Split Evenly.
- CTA: **Pay $X,XXX.XX** — disabled until sum === total → `/processing`.

### `checkout.$sessionId.processing.tsx`
- Iterate `allocations` sequentially, ~1.2s each, animate `ProcessingCard` flip per method.
- On last success: wait 5s, then route by tx prefix:
  - `M…` → `/complete?kind=multi`
  - `C…` → if all contributors paid → `/complete?kind=contrib`; else → `/status`

### `checkout.$sessionId.complete.tsx` (Thread Completed — shared)
Two variants driven by tx kind:
- **Contributor**: celebration burst, full progress ring (N/N paid), expanded cart items with promo/VAT/subtotal/total, contributor list — each row: name, share, method breakdown (brand + last4 + amount).
- **Multi-card**: same layout but list of payment methods used with amount from each.
- View/Download Receipt button (prints or downloads a simple PDF via `window.print` scoped stylesheet), CloseConfirm X.

### `checkout.$sessionId.status.tsx` (Contributor Payment Status, S05)
- Progress bar: paid / total contributors + time remaining until expiry.
- Expandable `CartSummary`.
- Contributor list:
  - Paid → show share + method breakdown.
  - Unpaid → show share + **Pay for them** / **Resend reminder** / **Share link** buttons.
- CloseConfirm X.

### `c.$token.tsx` (contributor invite link landing)
Route to same status view so short-URL lands on payment-status screen.

## 4. Routing / Data Flow Summary

```text
index (pick split)
  ├─(contrib)→ contributors → invited ─┬→ pay → processing → status | complete(contrib)
  │                                     └→ status (via link/button)
  └─(multi) → cards → processing → complete(multi)
```

## 5. Files Touched

**New:** `src/lib/tx-store.ts`, `src/components/payment-method-sheet.tsx`, `src/components/processing-card.tsx`, `src/components/celebration-burst.tsx`, `src/components/receipt-section.tsx`, `src/components/edit-contributor-dialog.tsx`

**Modified:** `close-confirm.tsx`, all `checkout.$sessionId.*.tsx` routes, `c.$token.tsx`, `demo-session.ts` (kept as seed only), `payment-method-picker.tsx` (accept sheet-selected methods).

## 6. Out of Scope

- No backend/Supabase changes.
- No real payment processing.
- Receipt is client-side print stylesheet, not server-generated PDF.

## Notes for Non-Technical Review

- All transaction data is kept per-transaction so different flows don't leak into each other.
- The X button will always trigger the confirmation and take you home on Yes.
- Contributor and multi-card flows share the same "success" and "receipt" look for consistency but show contributors vs cards.
- Expiry is exactly 7 days from when the invitations are sent.
