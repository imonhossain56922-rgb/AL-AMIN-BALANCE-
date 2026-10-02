import React, { useState } from 'react';
import { Contact, Transaction, Payment, AppSettings, ActiveTab } from '../../types';
import {
  calculateAppTotals,
  calculateContactFinancials,
  formatCurrency,
  formatDate,
  getTimeGreeting,
} from '../../services/financials';
import { StatusBadge } from '../common/StatusBadge';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  PlusCircle,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface DashboardScreenProps {
  contacts: Contact[];
  transactions: Transaction[];
  payments: Payment[];
  settings: AppSettings;
  onOpenContact: (contact: Contact) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAddTransaction: () => void;
}

export type DashboardFilter = 'all' | 'to-receive' | 'to-pay' | 'paid' | 'pending' | 'partially-paid';

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  contacts,
  transactions,
  payments,
  settings,
  onOpenContact,
  onNavigateTab,
  onOpenAddTransaction,
}) => {
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>('all');
  const totals = calculateAppTotals(contacts, transactions, payments);
  const greeting = getTimeGreeting();

  const contactsMap = new Map<string, Contact>();
  contacts.forEach((c) => contactsMap.set(c.id, c));

  const financialsMap = new Map<string, ReturnType<typeof calculateContactFinancials>>();
  contacts.forEach((c) => {
    financialsMap.set(c.id, calculateContactFinancials(c, transactions, payments));
  });

  // Outstanding list: only accounts with remaining balance > 0
  const outstandingReceivables = totals.contactSummaries
    .filter((s) => s.receiveRemaining > 0)
    .sort((a, b) => b.receiveRemaining - a.receiveRemaining);

  const outstandingPayables = totals.contactSummaries
    .filter((s) => s.payRemaining > 0)
    .sort((a, b) => b.payRemaining - a.payRemaining);

  // Filter transactions according to selected filter
  const filteredTransactions = transactions.filter((t) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'to-receive') return t.type === 'RECEIVE';
    if (activeFilter === 'to-pay') return t.type === 'PAY';

    const financials = financialsMap.get(t.contactId);
    const status = t.type === 'RECEIVE' ? financials?.receiveStatus : financials?.payStatus;

    if (activeFilter === 'paid') return status === 'PAID';
    if (activeFilter === 'partially-paid') return status === 'PARTIALLY PAID';
    if (activeFilter === 'pending') return status === 'UNPAID' || status === 'PARTIALLY PAID';
    return true;
  });

  const hasAnyRecords = transactions.length > 0 || contacts.length > 0;

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* User Greeting & Header Subtitle */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E95A3]">
            {greeting}
          </span>
          <h1 className="text-lg font-black text-white tracking-tight">
            {settings.userName || 'Personal Ledger'}
          </h1>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Ledger</span>
        </div>
      </div>

      {/* 1. Large Premium NET BALANCE Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12151E] via-[#0E1117] to-[#0A0C11] border border-white/[0.09] p-5 shadow-2xl">
        {/* Subtle mesh glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-emerald-500/15 via-emerald-400/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-bold tracking-[0.16em] text-[#8E95A3] uppercase">
              NET BALANCE
            </span>
          </div>
          <span className="text-[10px] font-bold text-white/80 bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-white/[0.08]">
            {settings.currency}
          </span>
        </div>

        {/* Large Financial Amount */}
        <div className="relative z-10 mt-3.5">
          <h2 className="text-[34px] sm:text-[38px] font-extrabold text-white tracking-tight leading-tight tabular-nums">
            {formatCurrency(totals.netOutstanding, settings.currency)}
          </h2>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-[#8E95A3]">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              {totals.netOutstanding >= 0 ? 'Receivables exceed payables' : 'Payables exceed receivables'}
            </span>
            <span>•</span>
            <span>{contacts.length} Accounts</span>
          </div>
        </div>

        {/* Quick entry bar inside card */}
        <div className="relative z-10 pt-4 mt-3 border-t border-white/[0.07] flex items-center justify-between text-xs">
          <span className="text-[#8E95A3] text-[11px]">ALARMENS BALANCE</span>
          <button
            type="button"
            onClick={onOpenAddTransaction}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition active:scale-95"
          >
            <span>+ Quick Entry</span>
          </button>
        </div>
      </div>

      {/* 2. I WILL RECEIVE & I WILL PAY Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* I WILL RECEIVE */}
        <div className="p-4 rounded-3xl bg-[#12151D] border border-emerald-500/25 shadow-md flex flex-col justify-between hover:border-emerald-500/40 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              I WILL RECEIVE
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5px]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-emerald-400 tracking-tight tabular-nums">
              {formatCurrency(totals.totalReceiveOutstanding, settings.currency)}
            </h3>
            <span className="text-[10px] text-[#8E95A3] mt-0.5 block">
              {totals.peopleOweMeCount} people owe you
            </span>
          </div>
        </div>

        {/* I WILL PAY */}
        <div className="p-4 rounded-3xl bg-[#12151D] border border-rose-500/25 shadow-md flex flex-col justify-between hover:border-rose-500/40 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
              I WILL PAY
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5px]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-rose-400 tracking-tight tabular-nums">
              {formatCurrency(totals.totalPayOutstanding, settings.currency)}
            </h3>
            <span className="text-[10px] text-[#8E95A3] mt-0.5 block">
              {totals.iOwePeopleCount} people you owe
            </span>
          </div>
        </div>
      </div>

      {/* 3. Summary Cards (Requirement 7) */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* COLLECTED THIS MONTH */}
        <div className="p-3.5 rounded-2xl bg-[#10131A] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E95A3]">
              COLLECTED
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white tabular-nums leading-tight block">
              {formatCurrency(totals.collectedThisMonth, settings.currency)}
            </span>
            <span className="text-[9px] text-[#8E95A3] mt-0.5 block">This Month</span>
          </div>
        </div>

        {/* PAID THIS MONTH */}
        <div className="p-3.5 rounded-2xl bg-[#10131A] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E95A3]">
              PAID OUT
            </span>
            <Wallet className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white tabular-nums leading-tight block">
              {formatCurrency(totals.paidThisMonth, settings.currency)}
            </span>
            <span className="text-[9px] text-[#8E95A3] mt-0.5 block">This Month</span>
          </div>
        </div>

        {/* PENDING TRANSACTIONS */}
        <div className="p-3.5 rounded-2xl bg-[#10131A] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E95A3]">
              PENDING
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white tabular-nums leading-tight block">
              {totals.pendingTransactionsCount}
            </span>
            <span className="text-[9px] text-[#8E95A3] mt-0.5 block">Records due</span>
          </div>
        </div>
      </div>

      {/* 4. Quick Filters (Requirement 8) */}
      <div className="pt-1">
        <div className="flex items-center justify-between px-1 mb-2">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            FILTER ACTIVITY
          </h3>
          <span className="text-[10px] text-[#8E95A3] font-medium">
            {filteredTransactions.length} items
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all' as DashboardFilter, label: 'All' },
            { id: 'to-receive' as DashboardFilter, label: 'To Receive' },
            { id: 'to-pay' as DashboardFilter, label: 'To Pay' },
            { id: 'paid' as DashboardFilter, label: 'Paid' },
            { id: 'pending' as DashboardFilter, label: 'Pending' },
            { id: 'partially-paid' as DashboardFilter, label: 'Partially Paid' },
          ].map((pill) => {
            const isActive = activeFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveFilter(pill.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'bg-white text-black shadow-md shadow-white/10 scale-102 font-extrabold'
                    : 'bg-[#12151D] text-[#8E95A3] hover:text-white border border-white/[0.08]'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Outstanding List (Requirement 9: MONEY I WILL RECEIVE & MONEY I WILL PAY) */}
      <div className="space-y-4 pt-1">
        {/* MONEY I WILL RECEIVE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                MONEY I WILL RECEIVE
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('contacts')}
              className="text-[11px] font-bold text-[#8E95A3] hover:text-white flex items-center gap-0.5 active:scale-95 transition"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {outstandingReceivables.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#10131A] border border-white/[0.06] text-center">
              <p className="text-xs text-[#8E95A3]">All receivable accounts are settled!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {outstandingReceivables.slice(0, 3).map((s) => (
                <div
                  key={s.contact.id}
                  onClick={() => onOpenContact(s.contact)}
                  className="p-3.5 rounded-2xl bg-[#12151D] border border-emerald-500/20 hover:border-emerald-500/40 transition flex items-center justify-between cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-sm flex items-center justify-center">
                      {s.contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                        {s.contact.name}
                      </h4>
                      <p className="text-[11px] text-[#8E95A3]">{s.contact.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-400 tabular-nums block">
                      {formatCurrency(s.receiveRemaining, settings.currency)} remaining
                    </span>
                    <StatusBadge status={s.receiveStatus} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MONEY I WILL PAY */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <h3 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider">
                MONEY I WILL PAY
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('contacts')}
              className="text-[11px] font-bold text-[#8E95A3] hover:text-white flex items-center gap-0.5 active:scale-95 transition"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {outstandingPayables.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#10131A] border border-white/[0.06] text-center">
              <p className="text-xs text-[#8E95A3]">No pending debts. All payables cleared!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {outstandingPayables.slice(0, 3).map((s) => (
                <div
                  key={s.contact.id}
                  onClick={() => onOpenContact(s.contact)}
                  className="p-3.5 rounded-2xl bg-[#12151D] border border-rose-500/20 hover:border-rose-500/40 transition flex items-center justify-between cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold text-sm flex items-center justify-center">
                      {s.contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition">
                        {s.contact.name}
                      </h4>
                      <p className="text-[11px] text-[#8E95A3]">{s.contact.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-rose-400 tabular-nums block">
                      {formatCurrency(s.payRemaining, settings.currency)} remaining
                    </span>
                    <StatusBadge status={s.payStatus} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Filtered Activity / Transactions List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            {activeFilter === 'all' ? 'RECENT ACTIVITY' : `ACTIVITY (${activeFilter.toUpperCase().replace('-', ' ')})`}
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('transactions')}
            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 active:scale-95 transition"
          >
            <span>Transactions Screen</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {!hasAnyRecords || filteredTransactions.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.08] bg-[#12151D] p-7 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">No transactions found</h4>
            <p className="text-xs text-[#8E95A3] max-w-xs mx-auto mb-4">
              {activeFilter === 'all'
                ? 'Your ledger is empty. Tap below to create your first transaction.'
                : `No activity found matching filter "${activeFilter}".`}
            </p>
            <button
              type="button"
              onClick={onOpenAddTransaction}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Transaction</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTransactions.slice(0, 5).map((t) => {
              const contact = contactsMap.get(t.contactId);
              const financials = financialsMap.get(t.contactId);
              const isReceive = t.type === 'RECEIVE';
              const status = isReceive ? financials?.receiveStatus : financials?.payStatus;

              return (
                <div
                  key={t.id}
                  onClick={() => contact && onOpenContact(contact)}
                  className="p-3.5 rounded-2xl bg-[#12151D] border border-white/[0.08] hover:border-white/[0.18] shadow-sm flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#1A1E29] border border-white/[0.08] flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-xs group-hover:border-emerald-500/40 transition">
                      <span className={isReceive ? 'text-emerald-400' : 'text-rose-400'}>
                        {contact?.name.charAt(0).toUpperCase() || 'C'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-white group-hover:text-emerald-400 transition text-sm truncate">
                        {contact?.name || 'Unknown Contact'}
                      </p>
                      <p className="text-xs text-[#8E95A3] truncate mt-0.5">
                        {t.description || (isReceive ? 'Money to Receive' : 'Money to Pay')}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#5A6272] font-medium">
                          {formatDate(t.date)}
                        </span>
                        <span className="text-[10px] text-[#5A6272]">•</span>
                        <span
                          className={`text-[10px] font-bold ${
                            isReceive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isReceive ? 'To Receive' : 'To Pay'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`text-base font-extrabold tracking-tight tabular-nums ${
                        isReceive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isReceive ? '+' : '-'}{formatCurrency(t.originalAmount, settings.currency)}
                    </span>
                    <StatusBadge status={status || 'NONE'} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
