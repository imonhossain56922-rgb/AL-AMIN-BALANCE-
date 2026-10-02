import { jsPDF } from 'jspdf';
import { Contact, Transaction, Payment, ContactFinancials } from '../types';
import { formatCurrency, formatDate } from './financials';

export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  amount: number;
  description: string;
  isCredit: boolean;
  category: 'TRANSACTION' | 'PAYMENT';
}

export function buildContactTimeline(
  contactId: string,
  transactions: Transaction[],
  payments: Payment[]
): TimelineEntry[] {
  const contactTrans = transactions.filter((t) => t.contactId === contactId);
  const contactPays = payments.filter((p) => p.contactId === contactId);

  const entries: TimelineEntry[] = [];

  for (const t of contactTrans) {
    entries.push({
      id: t.id,
      date: t.date,
      title: t.type === 'RECEIVE' ? 'Money to Receive' : 'Money to Pay',
      amount: t.originalAmount,
      description: t.description || 'Initial transaction',
      isCredit: t.type === 'RECEIVE',
      category: 'TRANSACTION',
    });
  }

  for (const p of contactPays) {
    entries.push({
      id: p.id,
      date: p.date,
      title: p.type === 'PAYMENT_RECEIVED' ? 'Payment Received' : 'Payment Made',
      amount: p.amount,
      description: p.description || (p.type === 'PAYMENT_RECEIVED' ? 'Payment received' : 'Payment settled'),
      isCredit: p.type === 'PAYMENT_RECEIVED',
      category: 'PAYMENT',
    });
  }

  // Sort chronologically ascending for statement readability
  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function generateStatementPDF(
  contact: Contact,
  financials: ContactFinancials,
  transactions: Transaction[],
  payments: Payment[],
  currency: string = 'AED'
): Promise<{ doc: jsPDF; blob: Blob; fileName: string }> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // ALARMENS BALANCE Luxury Palette
  const darkBlack = [17, 17, 17]; // #111111
  const goldPrimary = [255, 159, 28]; // #FF9F1C
  const goldLight = [255, 209, 102]; // #FFD166
  const textMuted = [115, 115, 115];
  const bgLight = [248, 250, 252];
  const borderLight = [229, 231, 235];

  // 1. Header Banner
  doc.setFillColor(darkBlack[0], darkBlack[1], darkBlack[2]);
  doc.roundedRect(margin, margin, contentWidth, 30, 3, 3, 'F');

  // Gold accent line under header
  doc.setFillColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.rect(margin, margin + 28, contentWidth, 2, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('ALARMENS BALANCE', margin + 8, margin + 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(goldLight[0], goldLight[1], goldLight[2]);
  doc.text('PERSONAL MONEY STATEMENT', margin + 8, margin + 20);

  // Date on right
  const todayFormatted = formatDate(new Date().toISOString().split('T')[0]);
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text(`Report Date: ${todayFormatted}`, pageWidth - margin - 8, margin + 16, { align: 'right' });

  // 2. Contact Information & Account Type
  let curY = margin + 36;

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, curY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkBlack[0], darkBlack[1], darkBlack[2]);
  doc.text(contact.name, margin + 6, curY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Mobile: ${contact.phone || 'N/A'}`, margin + 6, curY + 15);

  // Account Type on the right
  const isReceive = financials.receiveTotal >= financials.payTotal;
  const accountTypeLabel = isReceive
    ? 'Account Type: Money to Receive'
    : 'Account Type: Money to Pay';

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkBlack[0], darkBlack[1], darkBlack[2]);
  doc.text(accountTypeLabel, pageWidth - margin - 6, curY + 8, { align: 'right' });

  curY += 30;

  // 3. Summary Cards Grid (TOTAL AMOUNT, TOTAL RECEIVED, REMAINING, STATUS)
  const totalAmount = isReceive ? financials.receiveTotal : financials.payTotal;
  const settledAmount = isReceive ? financials.receivedTotal : financials.paidTotal;
  const remainingAmount = isReceive ? financials.receiveRemaining : financials.payRemaining;
  const status = isReceive ? financials.receiveStatus : financials.payStatus;

  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 22;

  const metrics = [
    { label: isReceive ? 'TOTAL AMOUNT' : 'TOTAL PAYABLE', val: formatCurrency(totalAmount, currency), color: [20, 20, 20] },
    { label: isReceive ? 'TOTAL RECEIVED' : 'TOTAL PAID', val: formatCurrency(settledAmount, currency), color: [34, 197, 94] },
    { label: 'REMAINING', val: formatCurrency(remainingAmount, currency), color: remainingAmount > 0 ? [239, 68, 68] : [34, 197, 94] },
    { label: 'STATUS', val: status, color: status === 'PAID' ? [34, 197, 94] : (status === 'PARTIALLY PAID' ? [217, 119, 6] : [239, 68, 68]) },
  ];

  metrics.forEach((m, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(cardX, curY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(m.label, cardX + 4, curY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(m.label === 'STATUS' ? 8.5 : 9);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.val, cardX + 4, curY + 15);
  });

  curY += cardHeight + 10;

  // 4. Section Title: TRANSACTION HISTORY
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkBlack[0], darkBlack[1], darkBlack[2]);
  doc.text('TRANSACTION HISTORY', margin, curY);

  curY += 4;

  // 5. Table Header
  const colDate = margin;
  const colTrans = margin + 28;
  const colDesc = margin + 74;
  const colAmount = pageWidth - margin;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, curY, contentWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text('Date', colDate + 3, curY + 5.5);
  doc.text('Transaction Type', colTrans, curY + 5.5);
  doc.text('Description', colDesc, curY + 5.5);
  doc.text('Amount', colAmount - 3, curY + 5.5, { align: 'right' });

  curY += 8;

  // 6. Table Rows
  const timeline = buildContactTimeline(contact.id, transactions, payments);

  if (timeline.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('No transactions recorded yet.', margin + 4, curY + 8);
    curY += 14;
  } else {
    timeline.forEach((item, index) => {
      if (curY > pageHeight - 35) {
        doc.addPage();
        curY = margin;
      }

      if (index % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, curY, contentWidth, 9, 'F');
      }

      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.line(margin, curY + 9, pageWidth - margin, curY + 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(55, 65, 81);
      doc.text(formatDate(item.date), colDate + 3, curY + 6);

      doc.setFont('helvetica', 'bold');
      if (item.category === 'PAYMENT') {
        doc.setTextColor(34, 197, 94);
      } else {
        doc.setTextColor(20, 20, 20);
      }
      doc.text(item.title, colTrans, curY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const cleanDesc = item.description.length > 36
        ? item.description.substring(0, 34) + '...'
        : item.description;
      doc.text(cleanDesc, colDesc, curY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text(formatCurrency(item.amount, currency), colAmount - 3, curY + 6, { align: 'right' });

      curY += 9;
    });
  }

  curY += 8;

  // 7. Outstanding Balance Highlight Box
  if (curY > pageHeight - 40) {
    doc.addPage();
    curY = margin;
  }

  const highlightBg = remainingAmount > 0 ? [254, 242, 242] : [240, 253, 244];
  const highlightBorder = remainingAmount > 0 ? [254, 202, 202] : [187, 247, 208];
  const highlightText = remainingAmount > 0 ? [239, 68, 68] : [34, 197, 94];

  doc.setFillColor(highlightBg[0], highlightBg[1], highlightBg[2]);
  doc.setDrawColor(highlightBorder[0], highlightBorder[1], highlightBorder[2]);
  doc.roundedRect(margin, curY, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text('OUTSTANDING BALANCE:', margin + 6, curY + 11);

  doc.setFontSize(12);
  doc.setTextColor(highlightText[0], highlightText[1], highlightText[2]);
  doc.text(formatCurrency(remainingAmount, currency), pageWidth - margin - 6, curY + 11.5, { align: 'right' });

  curY += 26;

  // 8. Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('ALARMENS BALANCE • Personal Money Manager', margin, pageHeight - margin + 4);
  doc.text(`Report Generated: ${todayFormatted}`, pageWidth - margin, pageHeight - margin + 4, { align: 'right' });

  const cleanName = contact.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const fileName = `alarmens_balance_${cleanName}.pdf`;

  const blob = doc.output('blob');

  return { doc, blob, fileName };
}

/**
 * Generates an 80mm POS thermal receipt format PDF.
 * Ideal for thermal voucher printing, compact mobile sharing, and quick payment receipts.
 */
export async function generateThermalReceiptPDF(
  contact: Contact,
  financials: ContactFinancials,
  transactions: Transaction[],
  payments: Payment[],
  currency: string = 'AED'
): Promise<{ doc: jsPDF; blob: Blob; fileName: string }> {
  const timeline = buildContactTimeline(contact.id, transactions, payments);

  // Dynamic height for 80mm receipt roll (minimum 160mm)
  const itemRowsHeight = Math.max(1, timeline.length) * 8.5;
  const receiptHeight = Math.max(160, 115 + itemRowsHeight);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, receiptHeight],
  });

  const pageWidth = 80;
  const margin = 5;
  const contentWidth = pageWidth - margin * 2; // 70mm
  const centerX = pageWidth / 2;

  const isReceive = financials.receiveTotal >= financials.payTotal;
  const totalAmount = isReceive ? financials.receiveTotal : financials.payTotal;
  const settledAmount = isReceive ? financials.receivedTotal : financials.paidTotal;
  const remainingAmount = isReceive ? financials.receiveRemaining : financials.payRemaining;
  const status = isReceive ? financials.receiveStatus : financials.payStatus;

  let y = 8;

  // Header: POS Receipt Title
  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text('ALARMENS BALANCE', centerX, y, { align: 'center' });

  y += 5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text('PERSONAL MONEY MANAGER', centerX, y, { align: 'center' });

  y += 4;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('80MM POS THERMAL ACCOUNT SLIP', centerX, y, { align: 'center' });

  y += 4;
  // Dashed Cut Line
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('----------------------------------------', centerX, y, { align: 'center' });

  // Receipt Metadata
  y += 4.5;
  const now = new Date();
  const dateFormatted = formatDate(now.toISOString().split('T')[0]);
  const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const receiptNo = `AB-${contact.id.slice(-4).toUpperCase()}-${now.getDate()}${now.getMonth() + 1}`;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text(`Receipt #: ${receiptNo}`, margin, y);
  y += 3.5;
  doc.text(`Date/Time: ${dateFormatted} ${timeFormatted}`, margin, y);
  y += 3.5;
  doc.text(`Contact:   ${contact.name}`, margin, y);
  y += 3.5;
  doc.text(`Mobile:    ${contact.phone || 'N/A'}`, margin, y);
  y += 3.5;
  doc.text(`Ledger:    ${isReceive ? 'MONEY TO RECEIVE' : 'MONEY TO PAY'}`, margin, y);

  y += 3.5;
  doc.text('----------------------------------------', centerX, y, { align: 'center' });

  // Items Table Header
  y += 4;
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('DATE', margin, y);
  doc.text('TRANSACTION / ITEM', margin + 18, y);
  doc.text('AMOUNT', pageWidth - margin, y, { align: 'right' });

  y += 2.5;
  doc.setFont('courier', 'normal');
  doc.text('----------------------------------------', centerX, y, { align: 'center' });

  y += 4;

  if (timeline.length === 0) {
    doc.setFont('courier', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text('No transaction records', centerX, y, { align: 'center' });
    y += 5;
  } else {
    timeline.forEach((item) => {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(40, 40, 40);

      // Date column (e.g. 02 Oct)
      const shortDate = item.date.slice(5); // MM-DD
      doc.text(shortDate, margin, y);

      // Title & Description
      let label = item.category === 'PAYMENT' ? '[PAID] ' : '';
      label += item.description ? item.description : item.title;
      if (label.length > 20) label = label.substring(0, 19) + '..';

      doc.text(label, margin + 18, y);

      // Amount with +/-
      const sign = item.category === 'PAYMENT' ? '-' : '+';
      const formattedAmt = `${sign}${formatCurrency(item.amount, currency)}`;
      doc.setFont('courier', 'bold');
      if (item.category === 'PAYMENT') {
        doc.setTextColor(34, 139, 34); // Forest green
      } else {
        doc.setTextColor(20, 20, 20);
      }
      doc.text(formattedAmt, pageWidth - margin, y, { align: 'right' });

      y += 4.5;
    });
  }

  // Summary Divider
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('========================================', centerX, y, { align: 'center' });

  y += 4.5;
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text(isReceive ? 'TOTAL AMOUNT:' : 'TOTAL PAYABLE:', margin, y);
  doc.text(formatCurrency(totalAmount, currency), pageWidth - margin, y, { align: 'right' });

  y += 4;
  doc.text(isReceive ? 'TOTAL RECEIVED:' : 'TOTAL PAID:', margin, y);
  doc.setTextColor(34, 139, 34);
  doc.text(formatCurrency(settledAmount, currency), pageWidth - margin, y, { align: 'right' });

  y += 4;
  doc.setFont('courier', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('----------------------------------------', centerX, y, { align: 'center' });

  // Outstanding Balance Box (Distinct highlight)
  y += 5;
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.rect(margin, y - 3.5, contentWidth, 12, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text('BALANCE DUE:', margin + 2.5, y + 1.5);

  doc.setFontSize(10.5);
  if (remainingAmount > 0) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(34, 139, 34);
  }
  doc.text(formatCurrency(remainingAmount, currency), pageWidth - margin - 2.5, y + 2, { align: 'right' });

  y += 12;
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(`STATUS: [ ${status} ]`, centerX, y, { align: 'center' });

  y += 4;
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('----------------------------------------', centerX, y, { align: 'center' });

  // Footer / Thank You / Verification
  y += 4.5;
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text('* * * THANK YOU * * *', centerX, y, { align: 'center' });

  y += 4;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('VERIFIED BY ALARMENS BALANCE', centerX, y, { align: 'center' });

  y += 3.5;
  doc.text('Personal Mobile Accounting System', centerX, y, { align: 'center' });

  const cleanName = contact.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const fileName = `alarmens_receipt_${cleanName}.pdf`;
  const blob = doc.output('blob');

  return { doc, blob, fileName };
}

export async function generateLedgerReportPDF(
  contactFinancialsList: ContactFinancials[],
  summary: {
    totalReceivableGross: number;
    totalReceived: number;
    totalReceivableRemaining: number;
    totalPayableGross: number;
    totalPaid: number;
    totalPayableRemaining: number;
    netBalance: number;
  },
  currency: string = 'AED',
  rangeLabel: string = 'ALL TIME'
): Promise<{ doc: jsPDF; blob: Blob; fileName: string }> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Header banner
  doc.setFillColor(10, 12, 17);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Emerald brand line
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 36, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('ALARMENS BALANCE', margin, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(167, 243, 208);
  doc.text('EXECUTIVE FINANCIAL REPORT & AUDIT LEDGER', margin, 26);

  const todayFormatted = formatDate(new Date().toISOString().split('T')[0]);
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(`Generated: ${todayFormatted} • Period: ${rangeLabel}`, pageWidth - margin, 26, { align: 'right' });

  let curY = 46;

  // Key Financial Overview Cards
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('FINANCIAL OVERVIEW', margin, curY);

  curY += 5;
  const cardW = (contentWidth - 6) / 3;
  const cardH = 22;

  // 1. Receivables Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(margin, curY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('TOTAL TO RECEIVE', margin + 4, curY + 6);
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(formatCurrency(summary.totalReceivableRemaining, currency), margin + 4, curY + 14);
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text(`Collected: ${formatCurrency(summary.totalReceived, currency)}`, margin + 4, curY + 19);

  // 2. Payables Card
  const card2X = margin + cardW + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card2X, curY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(225, 29, 72);
  doc.text('TOTAL TO PAY', card2X + 4, curY + 6);
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(formatCurrency(summary.totalPayableRemaining, currency), card2X + 4, curY + 14);
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text(`Paid: ${formatCurrency(summary.totalPaid, currency)}`, card2X + 4, curY + 19);

  // 3. Net Balance Card
  const card3X = card2X + cardW + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card3X, curY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 65, 81);
  doc.text('NET OUTSTANDING', card3X + 4, curY + 6);
  doc.setFontSize(11);
  if (summary.netBalance >= 0) {
    doc.setTextColor(5, 150, 105);
  } else {
    doc.setTextColor(225, 29, 72);
  }
  doc.text(formatCurrency(summary.netBalance, currency), card3X + 4, curY + 14);
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text(summary.netBalance >= 0 ? 'Surplus (Receivable)' : 'Deficit (Payable)', card3X + 4, curY + 19);

  curY += cardH + 12;

  // Contacts Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('CONTACT-WISE ACCOUNT SUMMARY', margin, curY);

  curY += 5;
  const thHeight = 8;
  doc.setFillColor(18, 21, 29);
  doc.rect(margin, curY, contentWidth, thHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('CONTACT NAME', margin + 4, curY + 5.5);
  doc.text('MOBILE', margin + 50, curY + 5.5);
  doc.text('RECEIVABLE DUE', margin + 95, curY + 5.5, { align: 'right' });
  doc.text('PAYABLE DUE', margin + 138, curY + 5.5, { align: 'right' });
  doc.text('NET POSITION', pageWidth - margin - 4, curY + 5.5, { align: 'right' });

  curY += thHeight;

  // Contacts Rows
  contactFinancialsList.forEach((s, idx) => {
    if (curY > pageHeight - 25) {
      doc.addPage();
      curY = 20;
    }

    const rowBg = idx % 2 === 0 ? [255, 255, 255] : [249, 250, 251];
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, curY, contentWidth, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(s.contact.name.slice(0, 24), margin + 4, curY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(s.contact.phone || '-', margin + 50, curY + 5.5);

    // Receivable Due
    doc.setTextColor(s.receiveRemaining > 0 ? 5 : 100, s.receiveRemaining > 0 ? 150 : 116, s.receiveRemaining > 0 ? 105 : 139);
    doc.text(formatCurrency(s.receiveRemaining, currency), margin + 95, curY + 5.5, { align: 'right' });

    // Payable Due
    doc.setTextColor(s.payRemaining > 0 ? 225 : 100, s.payRemaining > 0 ? 29 : 116, s.payRemaining > 0 ? 72 : 139);
    doc.text(formatCurrency(s.payRemaining, currency), margin + 138, curY + 5.5, { align: 'right' });

    // Net Position
    if (s.netRemaining >= 0) {
      doc.setTextColor(5, 150, 105);
    } else {
      doc.setTextColor(225, 29, 72);
    }
    doc.text(formatCurrency(s.netRemaining, currency), pageWidth - margin - 4, curY + 5.5, { align: 'right' });

    // Row bottom border
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, curY + 8, pageWidth - margin, curY + 8);

    curY += 8;
  });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('ALARMENS BALANCE • Personal Money Manager', margin, pageHeight - 10);
  doc.text('CONFIDENTIAL & PRIVILEGED LEDGER', pageWidth - margin, pageHeight - 10, { align: 'right' });

  const fileName = `alarmens_report_${new Date().toISOString().slice(0, 10)}.pdf`;
  const blob = doc.output('blob');

  return { doc, blob, fileName };
}
