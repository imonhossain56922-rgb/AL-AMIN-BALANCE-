import { Contact, Transaction, Payment, ContactFinancials, AccountStatus } from '../types';

export function formatCurrency(amount: number, currency: string = 'AED'): string {
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${currency} ${formattedNumber}`;
}

export function calculateContactFinancials(
  contact: Contact,
  transactions: Transaction[],
  payments: Payment[]
): ContactFinancials {
  const contactTrans = transactions.filter((t) => t.contactId === contact.id);
  const contactPays = payments.filter((p) => p.contactId === contact.id);

  // Receivable
  const receiveTrans = contactTrans.filter((t) => t.type === 'RECEIVE');
  const receiveTotal = receiveTrans.reduce((acc, t) => acc + (Number(t.originalAmount) || 0), 0);
  const receivePayments = contactPays.filter((p) => p.type === 'PAYMENT_RECEIVED');
  const receivedTotal = receivePayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const receiveRemaining = Math.max(0, receiveTotal - receivedTotal);

  let receiveStatus: AccountStatus | 'NONE' = 'NONE';
  if (receiveTotal > 0) {
    if (receivedTotal === 0) {
      receiveStatus = 'UNPAID';
    } else if (receiveRemaining > 0) {
      receiveStatus = 'PARTIALLY PAID';
    } else {
      receiveStatus = 'PAID';
    }
  }

  // Payable
  const payTrans = contactTrans.filter((t) => t.type === 'PAY');
  const payTotal = payTrans.reduce((acc, t) => acc + (Number(t.originalAmount) || 0), 0);
  const payPayments = contactPays.filter((p) => p.type === 'PAYMENT_MADE');
  const paidTotal = payPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const payRemaining = Math.max(0, payTotal - paidTotal);

  let payStatus: AccountStatus | 'NONE' = 'NONE';
  if (payTotal > 0) {
    if (paidTotal === 0) {
      payStatus = 'UNPAID';
    } else if (payRemaining > 0) {
      payStatus = 'PARTIALLY PAID';
    } else {
      payStatus = 'PAID';
    }
  }

  // Primary type determination
  const primaryType = receiveTotal >= payTotal ? 'RECEIVE' : 'PAY';
  const netRemaining = receiveRemaining - payRemaining;
  const hasOutstanding = receiveRemaining > 0 || payRemaining > 0;

  return {
    contact,
    receiveTotal,
    receivedTotal,
    receiveRemaining,
    receiveStatus,
    payTotal,
    paidTotal,
    payRemaining,
    payStatus,
    netRemaining,
    hasOutstanding,
    primaryType,
  };
}

export function calculateAppTotals(
  contacts: Contact[],
  transactions: Transaction[],
  payments: Payment[]
) {
  let totalReceiveOutstanding = 0;
  let totalPayOutstanding = 0;
  let totalReceivedAllTime = 0;
  let totalPaidAllTime = 0;

  const contactSummaries: ContactFinancials[] = contacts.map((c) =>
    calculateContactFinancials(c, transactions, payments)
  );

  for (const s of contactSummaries) {
    totalReceiveOutstanding += s.receiveRemaining;
    totalPayOutstanding += s.payRemaining;
    totalReceivedAllTime += s.receivedTotal;
    totalPaidAllTime += s.paidTotal;
  }

  const netOutstanding = totalReceiveOutstanding - totalPayOutstanding;

  // Monthly stats
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const collectedThisMonth = payments
    .filter((p) => p.type === 'PAYMENT_RECEIVED' && (p.date || '').startsWith(currentYearMonth))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const paidThisMonth = payments
    .filter((p) => p.type === 'PAYMENT_MADE' && (p.date || '').startsWith(currentYearMonth))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const peopleOweMeCount = contactSummaries.filter((s) => s.receiveRemaining > 0).length;
  const iOwePeopleCount = contactSummaries.filter((s) => s.payRemaining > 0).length;

  // Pending transactions: transactions associated with an account that has remaining balance
  const contactsWithDue = new Set(contactSummaries.filter((s) => s.hasOutstanding).map((s) => s.contact.id));
  const pendingTransactionsCount = transactions.filter((t) => contactsWithDue.has(t.contactId)).length;

  return {
    totalReceiveOutstanding,
    totalPayOutstanding,
    netOutstanding,
    totalReceivedAllTime,
    totalPaidAllTime,
    collectedThisMonth,
    paidThisMonth,
    peopleOweMeCount,
    iOwePeopleCount,
    pendingTransactionsCount,
    contactSummaries,
  };
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
