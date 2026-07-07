// Email templates — HTML + plain text for ZakaPay transactional emails.
// Uses Resend API for delivery; falls back to mailto: when Resend is unavailable.

export interface EmailTemplateContext {
  merchantName: string;
  recipientName: string;
  recipientEmail: string;
  shareAmount: number;
  link: string;
  transactionId: string;
}

// ---------- helpers ----------

function formatMoney(amountCents: number) {
  return `$${(amountCents / 100).toFixed(2)}`;
}

function wrapHtml(title: string, bodyHtml: string) {
  const escapedTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>' + escapedTitle + '</title></head>',
    '<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">',
    '<tr><td align="center">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">',
    '<tr><td style="background:#000000;padding:24px 32px;text-align:center;">',
    '<span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">\u2726 ZakaPay</span>',
    '</td></tr>',
    bodyHtml,
    '<tr><td style="padding:24px 32px;border-top:1px solid #e5e5e5;text-align:center;">',
    '<p style="margin:0;font-size:12px;color:#a1a1aa;">ZakaPay \u2014 Pay together, checkout as one.</p>',
    '<p style="margin:8px 0 0;font-size:11px;color:#d4d4d8;">This email was sent by ZakaPay</p>',
    '</td></tr>',
    '</table>',
    '</td></tr></table>',
    '</body></html>',
  ].join('\n');
}

// ---------- invitation email ----------

export function buildInvitationEmail(ctx: EmailTemplateContext) {
  const subject = `You're invited to pay your share for ${ctx.merchantName}`;

  const html = wrapHtml(subject, `
  <tr><td style="padding:32px;">
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">You're invited to split a payment</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#71717a;line-height:1.5;">
      ${ctx.merchantName} has invited you to contribute <strong style="color:#18181b;">${formatMoney(ctx.shareAmount)}</strong> toward transaction <strong>${ctx.transactionId}</strong>.
    </p>
    <a href="${ctx.link}" style="display:inline-block;background:#000000;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:999px;">
      Pay Your Share →
    </a>
    <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">No account required — pay from any device.</p>
  </td></tr>`);

  const text = [
    `Hi ${ctx.recipientName},`,
    ``,
    `${ctx.merchantName} has invited you to split a payment for transaction ${ctx.transactionId}.`,
    `Your share is ${formatMoney(ctx.shareAmount)}.`,
    ``,
    `Complete your payment here: ${ctx.link}`,
    ``,
    `No account required — pay from any device.`,
    ``,
    `Thanks,`,
    `ZakaPay`,
  ].join('\n');

  return { subject, html, text };
}

// ---------- reminder email ----------

export function buildReminderEmail(ctx: EmailTemplateContext) {
  const subject = `Reminder: pay your share for ${ctx.merchantName}`;

  const html = wrapHtml(subject, `
  <tr><td style="padding:32px;">
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Friendly reminder</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#71717a;line-height:1.5;">
      Your share of <strong style="color:#18181b;">${formatMoney(ctx.shareAmount)}</strong> for ${ctx.merchantName}'s payment (transaction ${ctx.transactionId}) is still outstanding.
    </p>
    <a href="${ctx.link}" style="display:inline-block;background:#000000;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:999px;">
      Complete Payment →
    </a>
    <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">Invitations expire in 7 days.</p>
  </td></tr>`);

  const text = [
    `Hi ${ctx.recipientName},`,
    ``,
    `This is a friendly reminder that your share of ${ctx.merchantName}'s payment for transaction ${ctx.transactionId} is still outstanding.`,
    `Amount due: ${formatMoney(ctx.shareAmount)}.`,
    ``,
    `Complete it here: ${ctx.link}`,
    ``,
    `Invitations expire in 7 days.`,
    ``,
    `Thanks,`,
    `ZakaPay`,
  ].join('\n');

  return { subject, html, text };
}

// ---------- payment confirmation email ----------

export function buildConfirmationEmail(ctx: EmailTemplateContext & { methodsUsed?: number }) {
  const subject = `Payment confirmed — ${ctx.merchantName}`;

  const html = wrapHtml(subject, `
  <tr><td style="padding:32px;text-align:center;">
    <div style="display:inline-flex;width:56px;height:56px;border-radius:50%;background:#f0fdf4;align-items:center;justify-content:center;margin-bottom:16px;">
      <span style="font-size:28px;">✓</span>
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Payment complete</h1>
    <p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#16a34a;">${formatMoney(ctx.shareAmount)}</p>
    <p style="margin:0 0 24px;font-size:14px;color:#71717a;">
      ${ctx.merchantName} · Transaction ${ctx.transactionId}
    </p>
    ${ctx.methodsUsed ? `<p style="font-size:13px;color:#a1a1aa;margin:0 0 24px;">Paid using ${ctx.methodsUsed} method${ctx.methodsUsed > 1 ? 's' : ''}.</p>` : ''}
  </td></tr>`);

  const text = [
    `Payment confirmed!`,
    ``,
    `Amount: ${formatMoney(ctx.shareAmount)}`,
    `Merchant: ${ctx.merchantName}`,
    `Transaction: ${ctx.transactionId}`,
    ``,
    `Thanks,`,
    `ZakaPay`,
  ].join('\n');

  return { subject, html, text };
}

// ---------- share / clipboard helpers ----------

export function buildShareText(link: string, title: string) {
  return { title, text: `Open this payment link to continue: ${link}`, url: link };
}

export async function shareOrCopy(link: string, title: string) {
  const shareData = buildShareText(link, title);
  if (typeof navigator === 'undefined') return false;
  if (typeof navigator.share === 'function') {
    try { await navigator.share(shareData); return true; } catch { /* fall back */ }
  }
  if (typeof navigator.clipboard?.writeText === 'function') {
    try { await navigator.clipboard.writeText(link); return true; } catch { /* ignore */ }
  }
  return false;
}

export function openEmailComposer({ recipientEmail, subject, body }: { recipientEmail: string; subject: string; body: string }) {
  if (typeof window === 'undefined') return;
  const href = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
}
