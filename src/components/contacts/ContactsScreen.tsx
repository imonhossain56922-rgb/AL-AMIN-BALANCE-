import React, { useState } from 'react';
import { Contact, Transaction, Payment, AppSettings } from '../../types';
import { calculateContactFinancials, formatCurrency } from '../../services/financials';
import { Search, UserPlus, Phone, Eye, MessageCircle } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface ContactsScreenProps {
  contacts: Contact[];
  transactions: Transaction[];
  payments: Payment[];
  settings: AppSettings;
  onOpenContact: (contact: Contact) => void;
  onOpenAddContact: () => void;
  onOpenShareModal: (contact: Contact) => void;
}

export const ContactsScreen: React.FC<ContactsScreenProps> = ({
  contacts,
  transactions,
  payments,
  settings,
  onOpenContact,
  onOpenAddContact,
  onOpenShareModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'receive' | 'pay' | 'settled'>('all');

  // Pre-calculate financials for each contact
  const contactStats = contacts.map((c) => ({
    contact: c,
    financials: calculateContactFinancials(c, transactions, payments),
  }));

  // Filter based on search & category
  const filtered = contactStats.filter(({ contact, financials }) => {
    // 1. Search Query
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchName = contact.name.toLowerCase().includes(query);
      const matchPhone = contact.phone ? contact.phone.toLowerCase().includes(query) : false;
      if (!matchName && !matchPhone) return false;
    }

    // 2. Filter Category
    if (filterType === 'receive') {
      return financials.receiveRemaining > 0;
    }
    if (filterType === 'pay') {
      return financials.payRemaining > 0;
    }
    if (filterType === 'settled') {
      return !financials.hasOutstanding && (financials.receivedTotal > 0 || financials.paidTotal > 0);
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Search Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">ACCOUNTS</h2>
            <p className="text-xs text-[#8E95A3]">Individual accounts & balances</p>
          </div>
          <button
            type="button"
            onClick={onOpenAddContact}
            className="flex items-center gap-1.5 py-2 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5px]" />
            <span>Add Account</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6272]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or phone number..."
            className="w-full bg-[#0D0F15] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5A6272] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/60"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: `All (${contacts.length})` },
            { id: 'receive', label: 'To Receive' },
            { id: 'pay', label: 'To Pay' },
            { id: 'settled', label: 'Settled (Paid)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as typeof filterType)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                filterType === tab.id
                  ? 'bg-white text-black shadow-md shadow-white/10'
                  : 'bg-[#12151D] text-[#8E95A3] hover:text-white border border-white/[0.08]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.08] bg-[#12151D] p-8 text-center my-6">
          <p className="text-sm text-[#8E95A3]">No accounts found matching your query.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ contact, financials }) => {
            const hasReceive = financials.receiveRemaining > 0;
            const hasPay = financials.payRemaining > 0;

            return (
              <div
                key={contact.id}
                className="p-4 rounded-3xl bg-[#12151D] border border-white/[0.08] shadow-sm space-y-3 transition hover:border-white/[0.18]"
              >
                {/* Contact Header */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => onOpenContact(contact)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1A1E29] border border-white/[0.08] flex items-center justify-center font-black text-white text-base shadow-xs">
                      <span className={hasReceive ? 'text-emerald-400' : hasPay ? 'text-rose-400' : 'text-slate-300'}>
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base hover:text-emerald-400 transition">
                        {contact.name}
                      </h4>
                      <p className="text-xs text-[#8E95A3] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-[#5A6272]" />
                        {contact.phone || 'No phone number'}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {financials.receiveStatus !== 'NONE' && (
                      <StatusBadge status={financials.receiveStatus} size="sm" />
                    )}
                    {financials.receiveStatus === 'NONE' && financials.payStatus !== 'NONE' && (
                      <StatusBadge status={financials.payStatus} size="sm" />
                    )}
                  </div>
                </div>

                {/* Balance summary callout */}
                <div
                  className="p-3.5 rounded-2xl bg-[#0D0F15] border border-white/[0.06] flex items-center justify-between cursor-pointer"
                  onClick={() => onOpenContact(contact)}
                >
                  <div>
                    <span className="text-[10px] font-bold text-[#8E95A3] block uppercase tracking-wider">
                      {hasReceive
                        ? 'YOU WILL RECEIVE'
                        : hasPay
                        ? 'YOU WILL PAY'
                        : 'ACCOUNT STATUS'}
                    </span>
                    <span
                      className={`text-base font-extrabold tabular-nums ${
                        hasReceive
                          ? 'text-emerald-400'
                          : hasPay
                          ? 'text-rose-400'
                          : 'text-[#8E95A3]'
                      }`}
                    >
                      {hasReceive
                        ? formatCurrency(financials.receiveRemaining, settings.currency)
                        : hasPay
                        ? formatCurrency(financials.payRemaining, settings.currency)
                        : 'PAID (All Settled)'}
                    </span>
                  </div>

                  {/* Secondary stats */}
                  <div className="text-right text-[11px] text-[#8E95A3]">
                    {financials.receivedTotal > 0 && (
                      <span className="block text-emerald-400 font-medium">
                        Rec: {formatCurrency(financials.receivedTotal, settings.currency)}
                      </span>
                    )}
                    {financials.paidTotal > 0 && (
                      <span className="block text-rose-400 font-medium">
                        Paid: {formatCurrency(financials.paidTotal, settings.currency)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Buttons: [ WhatsApp ] [ View ] */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenShareModal(contact);
                    }}
                    className="py-2.5 px-3 rounded-full bg-[#1A1E29] hover:bg-[#222736] active:scale-95 text-emerald-400 border border-white/[0.08] text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenContact(contact)}
                    className="py-2.5 px-3 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 active:scale-95 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Account</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
