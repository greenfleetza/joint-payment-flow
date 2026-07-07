export interface EmailTemplateContext {
  merchantName: string;
  recipientName: string;
  recipientEmail: string;
  shareAmount: number;
  link: string;
  transactionId: string;
}

export function buildInvitationEmail({ merchantName, recipientName, shareAmount, link, transactionId }: EmailTemplateContext) {
  const subject = `You’re invited to pay your share for ${merchantName}`;
  const body = [
    `Hi ${recipientName},`,
    ``,
    `${merchantName} has invited you to split a payment for transaction ${transactionId}.`,
    `Your share is ${formatMoney(shareAmount)}.`,
    `Open this link to complete your payment: ${link}`,
    ``,
    "Thanks,",
    "ZakaPay",
  ].join("\n");

  return { subject, body };
}

export function buildReminderEmail({ merchantName, recipientName, shareAmount, link, transactionId }: EmailTemplateContext) {
  const subject = `Reminder: pay your share for ${merchantName}`;
  const body = [
    `Hi ${recipientName},`,
    ``,
    `This is a friendly reminder that your share of ${merchantName}'s payment for transaction ${transactionId} is still outstanding.`,
    `Amount due: ${formatMoney(shareAmount)}.`,
    `Complete it here: ${link}`,
    ``,
    "Thanks,",
    "ZakaPay",
  ].join("\n");

  return { subject, body };
}

export function buildShareText(link: string, title: string) {
  return {
    title,
    text: `Open this payment link to continue: ${link}`,
    url: link,
  };
}

export async function shareOrCopy(link: string, title: string) {
  const shareData = buildShareText(link, title);
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
      return true;
    } catch {
      // Fall back to clipboard
    }
  }

  if (typeof navigator.clipboard?.writeText === "function") {
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch {
      // Ignore
    }
  }

  return false;
}

export function openEmailComposer({ recipientEmail, subject, body }: { recipientEmail: string; subject: string; body: string }) {
  if (typeof window === "undefined") return;
  const href = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
}

function formatMoney(amountCents: number) {
  return `$${(amountCents / 100).toFixed(2)}`;
}
