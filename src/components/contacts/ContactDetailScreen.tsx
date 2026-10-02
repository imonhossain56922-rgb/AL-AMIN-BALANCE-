import React, { useState } from 'react';
import {
  Contact,
  Transaction,
  Payment,
  AppSettings,
  TransactionType,
  PaymentType,
} from '../../types';
import {
  calculateContactFinancials,
  formatCurrency,
  formatDate,
} from '../../services/financials';
import {
  buildContactTimeline,
  generateStatementPDF,
  generateThermalReceiptPDF,
} from '../../services/pdfGenerator';
import { StatusBadge } from '../common/StatusBadge';
import { PaymentSheet } from '../transactions/PaymentSheet';
import { ShareSheetModal, PdfReportFormat } from '../transactions/ShareSheetModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EditContactSheet } from './EditContactSheet';
import { EditTransactionSheet } from '../transactions/EditTransactionSheet';
import {
  ArrowLeft,
  Phone,
  FileText,
  Share2,
  PlusCircle,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Sparkles,
  Edit2,
  Calendar,
  Receipt,
} from 'lucide-react';

interface ContactDetailScreenProps {
  contact: Contact;
  transactions: Transaction[];
  payments: Payment[];
  settings: AppSettings;
  onBack: () => void;
  onAddPayment: (data: {
    contactId: string;
    type: PaymentType;
    amount: number;
    description: string;
    date: string;
  }) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onDeletePayment: (id: string) => Promise<void>;
  onDeleteContact: (contactId: string) => Promise<void>;
  onUpdateContact: (contact: Contact) => Promise<void>;
  onUpdateTransaction: (transaction: Transaction) => Promise<void>;
  onUpdatePayment: (payment: Payment) => Promise<void>;
  onOpenAddMoreTransaction: (contact: Contact, type: TransactionType) => void;
}

export const ContactDetailScreen: React.FC<ContactDetailScreenProps> = ({
  contact,
  transactions,
  payments,
  settings,
  onBack,
  onAddPayment,
  onDeleteTransaction,
  onDeletePayment,
  onDeleteContact,
  onUpdateContact,
  onUpdateTransaction,
  onUpdatePayment,
  onOpenAddMoreTransaction,
}) => {
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    | { type: 'transaction'; data: Transaction }
    | { type: 'payment'; data: Payment }
    | null
  >(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfFormat, setPdfFormat] = useState<PdfReportFormat>('statement');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Deletion confirm states
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'transaction' | 'payment' | 'contact';
    id: string;
    title: string;
  } | null>(null);

  const financials = calculateContactFinancials(contact, transactions, payments);
  const timeline = buildContactTimeline(contact.id, transactions, payments);

  const isReceive = financials.receiveTotal >= financials.payTotal;
  const targetTotal = isReceive ? financials.receiveTotal : financials.payTotal;
  const targetSettled = isReceive ? financials.receivedTotal : financials.paidTotal;
  const targetRemaining = isReceive ? financials.receiveRemaining : financials.payRemaining;
  const targetStatus = isReceive ? financials.receiveStatus : financials.payStatus;

  const handleGeneratePdf = async (format: PdfReportFormat = 'statement') => {
    setIsGeneratingPdf(true);
    setPdfFormat(format);
    try {
      const generated =
        format === 'thermal'
          ? await generateThermalReceiptPDF(
              contact,
              financials,
              transactions,
              payments,
              settings.currency
            )
          : await generateStatementPDF(
              contact,
              financials,
              transactions,
              payments,
              settings.currency
            );
      setPdfBlob(generated.blob);
      setPdfFileName(generated.fileName);
      setIsShareModalOpen(true);
      return { blob: generated.blob, fileName: generated.fileName };
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'transaction') {
      await onDeleteTransaction(deleteTarget.id);
    } else if (deleteTarget.type === 'payment') {
      await onDeletePayment(deleteTarget.id);
    } else if (deleteTarget.type === 'contact') {
      await onDeleteContact(deleteTarget.id);
      onBack();
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* Top Bar with Back Button & Delete Option */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 py-2 px-3.5 rounded-full bg-[#12151D] border border-white/[0.08] text-[#8E95A3] hover:text-white active:scale-95 transition text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setDeleteTarget({
              type: 'contact',
              id: contact.id,
              title: contact.name,
            })
          }
          className="w-9 h-9 rounded-2xl bg-[#12151D] border border-white/[0.08] text-[#5A6272] hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition flex items-center justify-center"
          title="Delete Account"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Contact Profile Header */}
      <div className="p-4 rounded-3xl bg-[#12151D] border border-white/[0.08] shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#1A1E29] border border-white/[0.1] flex items-center justify-center font-black text-white text-xl shadow-md">
            <span className={isReceive ? 'text-emerald-400' : 'text-rose-400'}>
              {contact.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">{contact.name}</h2>
            <p className="text-xs text-[#8E95A3] flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-[#5A6272]" />
              <span>{contact.phone || 'No phone number'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditContactOpen(true)}
            className="w-10 h-10 rounded-2xl bg-[#1A1E29] text-[#8E95A3] hover:text-white hover:border-emerald-500/40 active:scale-95 transition flex items-center justify-center border border-white/[0.08]"
            title="Edit Contact Details"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/25 active:scale-95 transition border border-emerald-500/30"
              title="Call Contact"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Large Financial Summary Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12151E] via-[#0E1117] to-[#0A0C11] border border-white/[0.09] p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
          <span
            className={`text-xs font-black tracking-wider uppercase ${
              isReceive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isReceive ? 'MONEY TO RECEIVE' : 'MONEY TO PAY'}
          </span>
          <StatusBadge status={targetStatus} size="md" />
        </div>

        {/* 3 Metric Columns: Total, Received/Paid, Remaining */}
        <div className="grid grid-cols-3 gap-2">
          {/* Total */}
          <div className="p-3 rounded-2xl bg-[#0D0F15] border border-white/[0.06] text-left">
            <span className="text-[10px] font-bold text-[#8E95A3] block uppercase">
              TOTAL
            </span>
            <span className="text-sm font-extrabold text-white mt-0.5 block truncate tabular-nums">
              {formatCurrency(targetTotal, settings.currency)}
            </span>
          </div>

          {/* Received / Paid */}
          <div className="p-3 rounded-2xl bg-[#0D0F15] border border-white/[0.06] text-left">
            <span
              className={`text-[10px] font-bold block uppercase ${
                isReceive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isReceive ? 'RECEIVED' : 'PAID'}
            </span>
            <span
              className={`text-sm font-extrabold mt-0.5 block truncate tabular-nums ${
                isReceive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(targetSettled, settings.currency)}
            </span>
          </div>

          {/* Remaining */}
          <div className="p-3 rounded-2xl bg-[#0D0F15] border border-white/[0.06] text-left">
            <span className="text-[10px] font-bold text-[#8E95A3] block uppercase">
              REMAINING
            </span>
            <span
              className={`text-sm font-extrabold mt-0.5 block truncate tabular-nums ${
                targetRemaining > 0
                  ? isReceive
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {formatCurrency(targetRemaining, settings.currency)}
            </span>
          </div>
        </div>

        {/* Progress bar visual */}
        {targetTotal > 0 && (
          <div className="pt-1">
            <div className="w-full h-2 rounded-full bg-[#1A1E29] overflow-hidden flex">
              <div
                className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                  isReceive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : 'bg-gradient-to-r from-rose-500 to-rose-400'
                }`}
                style={{
                  width: `${Math.min(100, (targetSettled / targetTotal) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#8E95A3] mt-1.5 font-medium">
              <span>{Math.round((targetSettled / Math.max(1, targetTotal)) * 100)}% Settled</span>
              <span>
                {targetRemaining === 0 ? '✓ Paid in Full' : `${formatCurrency(targetRemaining, settings.currency)} pending`}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons: [+ RECEIVE/MAKE PAYMENT] [A4 STATEMENT] [POS RECEIPT] [SHARE] */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {/* Receive Payment / Make Payment Button */}
          {targetRemaining > 0 ? (
            <button
              type="button"
              onClick={() => setIsPaymentSheetOpen(true)}
              className={`py-3 px-2 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition text-center ${
                isReceive
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-950/40'
              }`}
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5px]" />
              <span>{isReceive ? '+ RECEIVE' : '+ PAY'}</span>
            </button>
          ) : (
            <div className="py-3 px-2 rounded-2xl bg-[#0D0F15] border border-white/[0.08] text-emerald-400 text-xs font-bold flex flex-col items-center justify-center gap-1 text-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>✓ All Paid</span>
            </div>
          )}

          {/* Generate A4 Statement Button */}
          <button
            type="button"
            onClick={() => handleGeneratePdf('statement')}
            disabled={isGeneratingPdf}
            className="py-3 px-2 rounded-2xl bg-[#1A1E29] hover:bg-[#222736] active:scale-95 text-white border border-white/[0.08] text-xs font-bold flex flex-col items-center justify-center gap-1 transition text-center"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>A4 STATEMENT</span>
          </button>

          {/* Generate 80mm POS Thermal Receipt Button */}
          <button
            type="button"
            onClick={() => handleGeneratePdf('thermal')}
            disabled={isGeneratingPdf}
            className="py-3 px-2 rounded-2xl bg-[#1A1E29] hover:bg-[#222736] active:scale-95 text-white border border-white/[0.08] text-xs font-bold flex flex-col items-center justify-center gap-1 transition text-center"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>80MM RECEIPT</span>
          </button>

          {/* WhatsApp / Share Button */}
          <button
            type="button"
            onClick={() => handleGeneratePdf('statement')}
            className="py-3 px-2 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 active:scale-95 text-emerald-400 text-xs font-bold flex flex-col items-center justify-center gap-1 transition text-center"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>SHARE</span>
          </button>
        </div>

        {/* Quick Add More Transaction Entry */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onOpenAddMoreTransaction(contact, isReceive ? 'RECEIVE' : 'PAY')}
            className="w-full py-2.5 px-3 rounded-full bg-[#1A1E29] hover:bg-[#222736] text-[#8E95A3] hover:text-white text-xs font-semibold border border-white/[0.08] flex items-center justify-center gap-1.5 transition active:scale-98"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Add More Transaction to Account</span>
          </button>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
              TRANSACTION HISTORY
            </h3>
          </div>
          <span className="text-xs text-[#8E95A3] font-semibold">
            {timeline.length} record{timeline.length === 1 ? '' : 's'}
          </span>
        </div>

        {timeline.length === 0 ? (
          <div className="p-6 rounded-3xl bg-[#12151D] border border-white/[0.08] text-center">
            <p className="text-xs text-[#8E95A3]">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {timeline.map((item) => {
              const isPayment = item.category === 'PAYMENT';

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-3xl bg-[#12151D] border border-white/[0.08] shadow-sm flex items-start justify-between gap-3 group transition hover:border-white/[0.18]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isPayment
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : item.isCredit
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {isPayment ? (
                        <ArrowDownLeft className="w-4 h-4 stroke-[2.5px]" />
                      ) : item.isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-wide text-white uppercase">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-[#5A6272] font-medium flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {formatDate(item.date)}
                        </span>
                      </div>

                      <p className="text-xs text-[#8E95A3] mt-1 font-medium leading-relaxed">
                        “{item.description}”
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <span
                      className={`text-sm font-extrabold tabular-nums ${
                        item.isCredit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.isCredit ? '+' : '-'}{formatCurrency(item.amount, settings.currency)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPayment) {
                            const p = payments.find((x) => x.id === item.id);
                            if (p) setEditingItem({ type: 'payment', data: p });
                          } else {
                            const t = transactions.find((x) => x.id === item.id);
                            if (t) setEditingItem({ type: 'transaction', data: t });
                          }
                        }}
                        className="opacity-70 group-hover:opacity-100 text-[#8E95A3] hover:text-emerald-400 transition p-1"
                        title="Edit record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: isPayment ? 'payment' : 'transaction',
                            id: item.id,
                            title: `${item.title} - ${formatCurrency(item.amount, settings.currency)}`,
                          })
                        }
                        className="opacity-70 group-hover:opacity-100 text-[#8E95A3] hover:text-rose-400 transition p-1"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Contact Bottom Sheet */}
      <EditContactSheet
        isOpen={isEditContactOpen}
        onClose={() => setIsEditContactOpen(false)}
        contact={contact}
        onSave={onUpdateContact}
      />

      {/* Edit Transaction / Payment Bottom Sheet */}
      <EditTransactionSheet
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        currency={settings.currency}
        item={editingItem}
        onSaveTransaction={onUpdateTransaction}
        onSavePayment={onUpdatePayment}
      />

      {/* Payment Bottom Sheet */}
      <PaymentSheet
        isOpen={isPaymentSheetOpen}
        onClose={() => setIsPaymentSheetOpen(false)}
        contact={contact}
        paymentType={isReceive ? 'PAYMENT_RECEIVED' : 'PAYMENT_MADE'}
        remainingBalance={targetRemaining}
        currency={settings.currency}
        onSavePayment={onAddPayment}
      />

      {/* PDF Statement Share Sheet Modal */}
      <ShareSheetModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        contact={contact}
        financials={financials}
        currency={settings.currency}
        pdfBlob={pdfBlob}
        fileName={pdfFileName}
        initialFormat={pdfFormat}
        onRegeneratePdf={handleGeneratePdf}
      />

      {/* Mobile Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={
          deleteTarget?.type === 'contact'
            ? 'Delete this contact?'
            : deleteTarget?.type === 'payment'
            ? 'Delete this payment record?'
            : 'Delete this transaction?'
        }
        message={
          deleteTarget?.type === 'contact'
            ? `Are you sure you want to permanently remove ${deleteTarget.title} and all related transactions?`
            : `Are you sure you want to permanently remove this record (${deleteTarget?.title})?`
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
