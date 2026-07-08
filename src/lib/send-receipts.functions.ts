// Server function — send email receipts to every contributor after a session completes.
// Uses the Resend Node SDK (already installed). RESEND_API_KEY must be set as a secret.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const receiptSchema = z.object({
  txId: z.string().min(1),
  merchantName: z.string(),
  totalCents: z.number().int().min(0),
  correlationId: z.string(),
  recipients: z
    .array(
      z.object({
        name: z.string(),
        email: z.string().email(),
        shareCents: z.number().int().min(0),
      }),
    )
    .min(1),
  lineItems: z.array(z.object({ name: z.string(), amountCents: z.number().int() })),
});

function money(c: number) { return `$${(c / 100).toFixed(2)}`; }

function receiptHtml({
  merchantName, txId, name, shareCents, totalCents, lineItems,
}: {
  merchantName: string; txId: string; name: string; shareCents: number; totalCents: number;
  lineItems: { name: string; amountCents: number }[];
}) {
  const rows = lineItems.map(
    (i) => `<tr><td style="padding:6px 0;color:#71717a;font-size:13px;">${i.name}</td><td style="padding:6px 0;text-align:right;font-size:13px;">${money(i.amountCents)}</td></tr>`,
  ).join("");
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#000;padding:20px 32px;color:#fff;font-weight:700;">✦ ZakaPay Receipt</td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 4px;font-size:22px;color:#18181b;">Thanks, ${name.replace(/</g, "&lt;")}</h1>
          <p style="margin:0 0 20px;color:#71717a;font-size:14px;">Payment to <strong>${merchantName.replace(/</g, "&lt;")}</strong> is complete. Your share: <strong>${money(shareCents)}</strong>.</p>
          <table role="presentation" width="100%" style="border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;margin:16px 0;padding:8px 0;">${rows}
            <tr><td style="padding-top:12px;font-weight:700;font-size:14px;">Order total</td><td style="padding-top:12px;text-align:right;font-weight:700;font-size:14px;">${money(totalCents)}</td></tr>
          </table>
          <p style="margin:20px 0 0;color:#a1a1aa;font-size:12px;">Transaction ${txId}</p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

export const sendReceiptsToContributors = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => receiptSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM ?? "noreply@zakapay.co";
    if (!apiKey) {
      return { sent: 0, skipped: data.recipients.length, reason: "no_api_key" as const, correlationId: data.correlationId };
    }
    const { Resend } = await import("resend");
    const client = new Resend(apiKey);

    let sent = 0;
    const errors: { email: string; error: string }[] = [];
    for (const r of data.recipients) {
      try {
        const html = receiptHtml({
          merchantName: data.merchantName,
          txId: data.txId,
          name: r.name,
          shareCents: r.shareCents,
          totalCents: data.totalCents,
          lineItems: data.lineItems,
        });
        const res = await client.emails.send({
          from: `ZakaPay <${from}>`,
          to: r.email,
          subject: `Receipt · ${data.merchantName} · ${data.txId}`,
          html,
          headers: { "X-Correlation-Id": data.correlationId },
        });
        if (res.error) errors.push({ email: r.email, error: res.error.message });
        else sent++;
      } catch (err) {
        errors.push({ email: r.email, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return { sent, skipped: 0, errors, correlationId: data.correlationId };
  });

// Resend a single email (invitation / reminder / completed) — used by the dashboard.
const singleSchema = z.object({
  kind: z.enum(["invitation", "reminder", "completed"]),
  txId: z.string(),
  merchantName: z.string(),
  recipientName: z.string(),
  recipientEmail: z.string().email(),
  shareCents: z.number().int().min(0),
  link: z.string(),
  correlationId: z.string(),
});

export const resendSingleEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => singleSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM ?? "noreply@zakapay.co";
    if (!apiKey) return { sent: false, reason: "no_api_key" as const };
    const { Resend } = await import("resend");
    const client = new Resend(apiKey);
    const subjectMap = {
      invitation: `You're invited to split ${data.merchantName}`,
      reminder: `Reminder: pay your share for ${data.merchantName}`,
      completed: `Payment complete — ${data.merchantName}`,
    } as const;
    const body = data.kind === "completed"
      ? `<p>Hi ${data.recipientName},</p><p>The order at <strong>${data.merchantName}</strong> (Tx ${data.txId}) is fully paid. Your share: <strong>$${(data.shareCents / 100).toFixed(2)}</strong>.</p>`
      : `<p>Hi ${data.recipientName},</p><p>Your share of <strong>$${(data.shareCents / 100).toFixed(2)}</strong> for <strong>${data.merchantName}</strong> is ready to pay.</p><p><a href="${data.link}" style="background:#000;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;">Pay your share</a></p>`;
    try {
      const res = await client.emails.send({
        from: `ZakaPay <${from}>`,
        to: data.recipientEmail,
        subject: subjectMap[data.kind],
        html: `<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:32px;background:#f4f4f5"><div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border-radius:16px">${body}<p style="color:#a1a1aa;font-size:12px;margin-top:24px">Transaction ${data.txId}</p></div></body></html>`,
        headers: { "X-Correlation-Id": data.correlationId },
      });
      return res.error ? { sent: false, reason: res.error.message } : { sent: true, id: res.data?.id };
    } catch (err) {
      return { sent: false, reason: err instanceof Error ? err.message : String(err) };
    }
  });
