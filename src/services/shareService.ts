import { Contact, ContactFinancials } from '../types';
import { formatCurrency } from './financials';

export type ShareResult =
  | { status: 'shared' }
  | { status: 'cancelled' }
  | { status: 'unsupported'; reason: string }
  | { status: 'error'; message: string };

export async function sharePdfStatement(
  pdfBlob: Blob,
  fileName: string,
  contact: Contact,
  financials: ContactFinancials,
  currency: string
): Promise<ShareResult> {
  const isReceive = financials.receiveTotal >= financials.payTotal;
  const remaining = isReceive ? financials.receiveRemaining : financials.payRemaining;
  const remainingText = formatCurrency(remaining, currency);

  const title = `ALARMENS BALANCE Statement - ${contact.name}`;
  const text = isReceive
    ? `Salam ${contact.name}, here is your latest account statement from ALARMENS BALANCE. Remaining balance to receive: ${remainingText}.`
    : `Salam ${contact.name}, here is our latest account statement from ALARMENS BALANCE. Remaining balance: ${remainingText}.`;

  // Create standard File object
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

  // Check Web Share API with files support
  if (typeof navigator !== 'undefined' && navigator.share) {
    const canShareFiles =
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] });

    if (canShareFiles) {
      try {
        await navigator.share({
          files: [file],
          title,
          text,
        });
        return { status: 'shared' };
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            return { status: 'cancelled' };
          }
          return { status: 'error', message: err.message };
        }
        return { status: 'error', message: 'Share failed' };
      }
    }
  }

  // Not supported by environment or browser (e.g. desktop Chrome without flag, or inside restricted iframe)
  return {
    status: 'unsupported',
    reason: 'Direct file sharing not supported by current browser context',
  };
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function buildWhatsAppUrl(
  contactPhone: string,
  contactName: string,
  financials: ContactFinancials,
  currency: string
): string {
  // Clean phone number: remove spaces, dashes, parentheses
  const cleanPhone = contactPhone.replace(/[^0-9]/g, '');
  const isReceive = financials.receiveTotal >= financials.payTotal;
  const remaining = isReceive ? financials.receiveRemaining : financials.payRemaining;
  const remainingText = formatCurrency(remaining, currency);

  const message = isReceive
    ? `Salam ${contactName}, here is your account statement from ALARMENS BALANCE.\nOutstanding Balance: ${remainingText}.\n(Attaching statement PDF)`
    : `Salam ${contactName}, here is our account statement from ALARMENS BALANCE.\nOutstanding Balance: ${remainingText}.\n(Attaching statement PDF)`;

  const encodedMsg = encodeURIComponent(message);
  if (cleanPhone.length >= 8) {
    return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
  }
  return `https://wa.me/?text=${encodedMsg}`;
}
