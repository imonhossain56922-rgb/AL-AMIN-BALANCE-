import React, { useState } from 'react';
import { Contact, Transaction, Payment, AppSettings } from '../../types';
import { calculateContactFinancials, formatCurrency, formatDate } from '../../services/financials';
import { Search, ArrowDownLeft, ArrowUpRight, PlusCircle, Sparkles } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface TransactionsScreenProps {
  contacts: Contact[];
  transactions: Transaction[];
  payments: Payment[];
  settings: AppSettings;
  onOpenContact: (contact: Contact) => void;
  onOpenAddTransaction: () => void;
}

export type FilterCategory = 'all' | 'receive' | 'pay' | 'unpaid' | 'partial' | 'paid';

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  contacts,
  transactions,
  payments,
  settings,
  onOpenContact,
  onOpenAddTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  const contactsMap = new Map<string, Contact>();
  contacts.forEach((c) => contactsMap.set(c.id, c));

  const financialsMap = new Map<string, ReturnType<typeof calculateContactFinancials>>();
  contacts.forEach((c) => {
    financialsMap.set(c.id, calculateContactFinancials(c, transactions, payments));
  });

  const filteredTransactions = transactions.filter((t) => {
    const contact = contactsMap.get(t.contactId);
    const contactName = contact?.name || '';
    const contactPhone = contact?.phone || '';
    const desc = t.description || '';

    // Search query: Name, Mobile, or Description
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const match =
        contactName.toLowerCase().includes(query) ||
        contactPhone.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query);
      if (!match) return false;
    }

    if (activeFilter === 'receive') {
      return t.type === 'RECEIVE';
    }
    if (activeFilter === 'pay') {
      return t.type === 'PAY';
    }

    const financials = financialsMap.get(t.contactId);
    const status = t.type === 'RECEIVE' ? financials?.receiveStatus : financials?.payStatus;

    if (activeFilter === 'paid') {
      return status === 'PAID';
    }
    if (activeFilter === 'partial') {
      return status === 'PARTIALLY PAID';
    }
    if (activeFilter === 'unpaid') {
      return status === 'UNPAID';
    }

    return true;
  });

  const filters: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: `All (${transactions.length})` },
    { id: 'receive', label: 'Receive' },
    { id: 'pay', label: 'Pay' },
    { id: 'unpaid', label: 'Unpaid' },
    { id: 'partial', label: 'Partial' },
    { id: 'paid', label: 'Paid' },
  ];

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Header & Search */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">TRANSACTIONS</h2>
          <p className="text-xs text-[#8E95A3]">All entries, amounts & descriptions</p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6272]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by contact or notes..."
            className="w-full bg-[#0D0F15] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5A6272] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/60"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                activeFilter === f.id
                  ? 'bg-white text-black shadow-md shadow-white/10'
                  : 'bg-[#12151D] text-[#8E95A3] hover:text-white border border-white/[0.08]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.08] bg-[#12151D] p-8 text-center my-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-white mb-1">No transactions found</p>
          <p className="text-xs text-[#8E95A3] mb-4">
            Try adjusting your search query or selected filter.
          </p>
          <button
            type="button"
            onClick={onOpenAddTransaction}
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Transaction</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map((t) => {
            const contact = contactsMap.get(t.contactId);
            const financials = financialsMap.get(t.contactId);
            const isReceive = t.type === 'RECEIVE';
            const status = isReceive ? financials?.receiveStatus : financials?.payStatus;

            return (
              <div
                key={t.id}
                onClick={() => contact && onOpenContact(contact)}
                className="p-4 rounded-3xl bg-[#12151D] border border-white/[0.08] hover:border-white/[0.18] shadow-sm flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition group"
              >
                {/* Left side: Icon + Contact + Description */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isReceive
                        ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                        : 'bg-rose-500/15 border-rose-500/25 text-rose-400'
                    }`}
                  >
                    {isReceive ? (
                      <ArrowDownLeft className="w-5 h-5 stroke-[2.2px]" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 stroke-[2.2px]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-white group-hover:text-emerald-400 transition text-sm truncate">
                      {contact?.name || 'Unknown Contact'}
                    </p>
                    <p className="text-xs text-[#8E95A3] truncate mt-0.5">
                      {t.description || (isReceive ? 'Money to Receive' : 'Money to Pay')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
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

                {/* Right side: Amount + Status Badge */}
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
  );
};
