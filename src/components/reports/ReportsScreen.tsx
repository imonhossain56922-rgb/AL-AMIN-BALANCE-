import React, { useState } from 'react';
import { Contact, Transaction, Payment, AppSettings } from '../../types';
import {
  calculateAppTotals,
  calculateContactFinancials,
  formatCurrency,
  formatDate,
} from '../../services/financials';
import { generateLedgerReportPDF } from '../../services/pdfGenerator';
import { StatusBadge } from '../common/StatusBadge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Share2,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ReportsScreenProps {
  contacts: Contact[];
  transactions: Transaction[];
  payments: Payment[];
  settings: AppSettings;
  onOpenContact: (contact: Contact) => void;
}

type DateRange = 'all' | 'this-month' | 'last-month' | 'this-year';

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  contacts,
  transactions,
  payments,
  settings,
  onOpenContact,
}) => {
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Date filtering logic
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const isWithinRange = (dateStr: string) => {
    if (dateRange === 'all') return true;
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return false;

    if (dateRange === 'this-month') {
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }
    if (dateRange === 'last-month') {
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      return (
        d.getFullYear() === lastMonthDate.getFullYear() &&
        d.getMonth() === lastMonthDate.getMonth()
      );
    }
    if (dateRange === 'this-year') {
      return d.getFullYear() === currentYear;
    }
    return true;
  };

  const filteredTransactions = transactions.filter((t) => isWithinRange(t.date));
  const filteredPayments = payments.filter((p) => isWithinRange(p.date));

  // Compute stats on the active range
  const totals = calculateAppTotals(contacts, filteredTransactions, filteredPayments);

  const contactFinancialsList = contacts.map((c) =>
    calculateContactFinancials(c, filteredTransactions, filteredPayments)
  );

  const totalReceivableGross = contactFinancialsList.reduce((sum, s) => sum + s.receiveTotal, 0);
  const totalReceived = contactFinancialsList.reduce((sum, s) => sum + s.receivedTotal, 0);
  const totalReceivableRemaining = contactFinancialsList.reduce((sum, s) => sum + s.receiveRemaining, 0);

  const totalPayableGross = contactFinancialsList.reduce((sum, s) => sum + s.payTotal, 0);
  const totalPaid = contactFinancialsList.reduce((sum, s) => sum + s.paidTotal, 0);
  const totalPayableRemaining = contactFinancialsList.reduce((sum, s) => sum + s.payRemaining, 0);

  const netBalance = totalReceivableRemaining - totalPayableRemaining;

  // Collection recovery rates
  const collectionRate =
    totalReceivableGross > 0 ? Math.round((totalReceived / totalReceivableGross) * 100) : 100;
  const payoutRate =
    totalPayableGross > 0 ? Math.round((totalPaid / totalPayableGross) * 100) : 100;

  // Top outstanding receivables & payables
  const topReceivables = [...contactFinancialsList]
    .filter((s) => s.receiveRemaining > 0)
    .sort((a, b) => b.receiveRemaining - a.receiveRemaining);

  const topPayables = [...contactFinancialsList]
    .filter((s) => s.payRemaining > 0)
    .sort((a, b) => b.payRemaining - a.payRemaining);

  // Settlement breakdown counts
  const fullySettledCount = contactFinancialsList.filter(
    (s) =>
      (s.receiveTotal > 0 || s.payTotal > 0) &&
      s.receiveRemaining === 0 &&
      s.payRemaining === 0
  ).length;

  const partialCount = contactFinancialsList.filter(
    (s) => s.receiveStatus === 'PARTIALLY PAID' || s.payStatus === 'PARTIALLY PAID'
  ).length;

  const unpaidCount = contactFinancialsList.filter(
    (s) =>
      (s.receiveStatus === 'UNPAID' || s.payStatus === 'UNPAID') &&
      s.receiveStatus !== 'PARTIALLY PAID' &&
      s.payStatus !== 'PARTIALLY PAID'
  ).length;

  // Export Executive PDF Ledger Summary
  const handleExportFullPdf = async () => {
    try {
      setIsExporting(true);
      const generated = await generateLedgerReportPDF(
        contactFinancialsList,
        {
          totalReceivableGross,
          totalReceived,
          totalReceivableRemaining,
          totalPayableGross,
          totalPaid,
          totalPayableRemaining,
          netBalance,
        },
        settings.currency,
        dateRange.toUpperCase().replace('-', ' ')
      );

      generated.doc.save(generated.fileName);
    } catch (err) {
      console.error('Failed to export PDF report', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* Header with Title and Date Range Pills */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E95A3]">
            FINANCIAL ANALYTICS
          </span>
          <h1 className="text-xl font-black text-white tracking-tight">
            Financial Reports
          </h1>
        </div>

        <button
          type="button"
          onClick={handleExportFullPdf}
          disabled={isExporting}
          className="flex items-center gap-1.5 py-2 px-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
        </button>
      </div>

      {/* Date Range Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all' as DateRange, label: 'All Time' },
          { id: 'this-month' as DateRange, label: 'This Month' },
          { id: 'last-month' as DateRange, label: 'Last Month' },
          { id: 'this-year' as DateRange, label: 'This Year' },
        ].map((pill) => {
          const isActive = dateRange === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setDateRange(pill.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'bg-white text-black font-extrabold shadow-md shadow-white/10'
                  : 'bg-[#12151D] text-[#8E95A3] hover:text-white border border-white/[0.08]'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* High-Level Net Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12151E] via-[#0E1117] to-[#0A0C11] border border-white/[0.09] p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E95A3]">
            NET REMAINING POSITION
          </span>
          <span
            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
              netBalance >= 0
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}
          >
            {netBalance >= 0 ? '+ NET RECEIVABLE' : '- NET PAYABLE'}
          </span>
        </div>

        <div className="mt-3">
          <h2
            className={`text-3xl sm:text-4xl font-black tracking-tight tabular-nums ${
              netBalance >= 0 ? 'text-white' : 'text-rose-400'
            }`}
          >
            {formatCurrency(netBalance, settings.currency)}
          </h2>
          <p className="text-xs text-[#8E95A3] mt-1">
            {netBalance >= 0
              ? 'You have more money to collect than you owe to others.'
              : 'You have more payables due than receivables to collect.'}
          </p>
        </div>

        {/* Mini progress bar of Receivables vs Payables */}
        <div className="mt-4 pt-3 border-t border-white/[0.08]">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-emerald-400 font-bold">
              Receivables: {formatCurrency(totalReceivableRemaining, settings.currency)}
            </span>
            <span className="text-rose-400 font-bold">
              Payables: {formatCurrency(totalPayableRemaining, settings.currency)}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{
                width: `${
                  totalReceivableRemaining + totalPayableRemaining > 0
                    ? (totalReceivableRemaining / (totalReceivableRemaining + totalPayableRemaining)) * 100
                    : 50
                }%`,
              }}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{
                width: `${
                  totalReceivableRemaining + totalPayableRemaining > 0
                    ? (totalPayableRemaining / (totalReceivableRemaining + totalPayableRemaining)) * 100
                    : 50
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Two-Column Breakdown: Receivables vs Payables */}
      <div className="grid grid-cols-2 gap-3">
        {/* Receivables Column */}
        <div className="p-4 rounded-3xl bg-[#12151D] border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ArrowDownLeft className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              RECEIVABLES
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#8E95A3] block">Total Invoiced</span>
            <span className="text-base font-extrabold text-white tabular-nums">
              {formatCurrency(totalReceivableGross, settings.currency)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#8E95A3] block">Total Collected</span>
            <span className="text-base font-extrabold text-emerald-400 tabular-nums">
              {formatCurrency(totalReceived, settings.currency)}
            </span>
          </div>
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-[#8E95A3] text-[10px]">Recovery:</span>
            <span className="font-extrabold text-emerald-400">{collectionRate}%</span>
          </div>
        </div>

        {/* Payables Column */}
        <div className="p-4 rounded-3xl bg-[#12151D] border border-rose-500/20 space-y-3">
          <div className="flex items-center gap-1.5 text-rose-400">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              PAYABLES
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#8E95A3] block">Total Due</span>
            <span className="text-base font-extrabold text-white tabular-nums">
              {formatCurrency(totalPayableGross, settings.currency)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#8E95A3] block">Total Paid Out</span>
            <span className="text-base font-extrabold text-rose-400 tabular-nums">
              {formatCurrency(totalPaid, settings.currency)}
            </span>
          </div>
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-[#8E95A3] text-[10px]">Settled:</span>
            <span className="font-extrabold text-rose-400">{payoutRate}%</span>
          </div>
        </div>
      </div>

      {/* Account Status Distribution */}
      <div className="p-4 rounded-3xl bg-[#12151D] border border-white/[0.08] space-y-3">
        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
          PORTFOLIO HEALTH
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-[#1A1E29] border border-white/[0.05]">
            <span className="text-base font-black text-emerald-400 block">{fullySettledCount}</span>
            <span className="text-[10px] font-medium text-[#8E95A3]">Fully Settled</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#1A1E29] border border-white/[0.05]">
            <span className="text-base font-black text-amber-400 block">{partialCount}</span>
            <span className="text-[10px] font-medium text-[#8E95A3]">Partially Paid</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#1A1E29] border border-white/[0.05]">
            <span className="text-base font-black text-rose-400 block">{unpaidCount}</span>
            <span className="text-[10px] font-medium text-[#8E95A3]">Unpaid</span>
          </div>
        </div>
      </div>

      {/* Top Receivables Ranking */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            TOP MONEY TO RECEIVE
          </h3>
          <span className="text-[10px] text-emerald-400 font-bold">
            {topReceivables.length} accounts
          </span>
        </div>

        {topReceivables.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#12151D] border border-white/[0.06] text-center text-xs text-[#8E95A3]">
            No outstanding receivables.
          </div>
        ) : (
          <div className="space-y-2">
            {topReceivables.slice(0, 4).map((s, idx) => (
              <div
                key={s.contact.id}
                onClick={() => onOpenContact(s.contact)}
                className="p-3.5 rounded-2xl bg-[#12151D] border border-white/[0.08] hover:border-emerald-500/40 transition flex items-center justify-between cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-black text-[#8E95A3]">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{s.contact.name}</h4>
                    <p className="text-[11px] text-[#8E95A3]">{s.contact.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-400 tabular-nums block">
                    {formatCurrency(s.receiveRemaining, settings.currency)}
                  </span>
                  <StatusBadge status={s.receiveStatus} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Payables Ranking */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            TOP MONEY I OWE
          </h3>
          <span className="text-[10px] text-rose-400 font-bold">
            {topPayables.length} accounts
          </span>
        </div>

        {topPayables.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#12151D] border border-white/[0.06] text-center text-xs text-[#8E95A3]">
            No debts owed. All clean!
          </div>
        ) : (
          <div className="space-y-2">
            {topPayables.slice(0, 4).map((s, idx) => (
              <div
                key={s.contact.id}
                onClick={() => onOpenContact(s.contact)}
                className="p-3.5 rounded-2xl bg-[#12151D] border border-white/[0.08] hover:border-rose-500/40 transition flex items-center justify-between cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-black text-[#8E95A3]">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{s.contact.name}</h4>
                    <p className="text-[11px] text-[#8E95A3]">{s.contact.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-rose-400 tabular-nums block">
                    {formatCurrency(s.payRemaining, settings.currency)}
                  </span>
                  <StatusBadge status={s.payStatus} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
