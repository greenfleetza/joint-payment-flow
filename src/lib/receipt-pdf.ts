// Client-side PDF receipt generation.
import { jsPDF } from "jspdf";
import type { Transaction } from "./tx-store";
import { formatMoney } from "./format";

export function downloadReceiptPdf(tx: Transaction) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("ZakaPay Receipt", 56, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  y += 18;
  doc.text(`Transaction ${tx.id}`, 56, y);
  y += 12;
  doc.text(new Date(tx.createdAt).toLocaleString(), 56, y);

  // Merchant
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  y += 30;
  doc.text(tx.merchantName, 56, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 14;
  doc.text(`Order ref: ${tx.orderReference}`, 56, y);

  // Items
  y += 24;
  doc.setFont("helvetica", "bold");
  doc.text("Items", 56, y);
  doc.line(56, y + 4, pageW - 56, y + 4);
  y += 18;
  doc.setFont("helvetica", "normal");
  tx.items.forEach((it) => {
    doc.text(`${it.qty ?? 1} × ${it.name}`, 56, y);
    doc.text(formatMoney(it.amountCents * (it.qty ?? 1)), pageW - 56, y, { align: "right" });
    y += 14;
  });

  // Totals
  y += 10;
  doc.line(56, y, pageW - 56, y);
  y += 16;
  const totalRow = (label: string, cents: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, 56, y);
    doc.text(formatMoney(cents), pageW - 56, y, { align: "right" });
    y += 14;
  };
  totalRow("Subtotal", tx.subtotalCents);
  totalRow("VAT", tx.vatCents);
  if (tx.promoDiscountCents > 0) totalRow(`Discount (${tx.promoCode ?? ""})`, -tx.promoDiscountCents);
  y += 4;
  totalRow("Total paid", tx.totalCents - tx.promoDiscountCents, true);

  // Contributors / methods
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text(tx.kind === "multi_card" ? "Payment methods" : "Contributors", 56, y);
  doc.line(56, y + 4, pageW - 56, y + 4);
  y += 18;
  doc.setFont("helvetica", "normal");

  if (tx.kind === "multi_card") {
    tx.hostAllocations.forEach((a) => {
      const m = tx.methods.find((mm) => mm.id === a.methodId);
      doc.text(m?.label ?? "Method", 56, y);
      doc.text(formatMoney(a.amountCents), pageW - 56, y, { align: "right" });
      y += 14;
    });
  } else {
    tx.contributors.forEach((c) => {
      doc.text(`${c.name}${c.isInitiator ? " (Host)" : ""} — ${c.status}`, 56, y);
      doc.text(formatMoney(c.shareCents), pageW - 56, y, { align: "right" });
      y += 14;
      c.allocations.forEach((a) => {
        const m = tx.methods.find((mm) => mm.id === a.methodId);
        doc.setTextColor(120);
        doc.text(`   ${m?.label ?? "Method"}`, 56, y);
        doc.text(formatMoney(a.amountCents), pageW - 56, y, { align: "right" });
        doc.setTextColor(30);
        y += 12;
      });
    });
  }

  // Footer
  y = doc.internal.pageSize.getHeight() - 56;
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("Thank you for using ZakaPay.", pageW / 2, y, { align: "center" });

  doc.save(`ZakaPay-Receipt-${tx.id}.pdf`);
}
