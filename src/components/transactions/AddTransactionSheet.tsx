import React, { useState, useEffect } from 'react';
import { TransactionType, Contact } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { ContactPickerModal } from '../contacts/ContactPickerModal';
import { getTodayDateString } from '../../services/financials';
import { UserCheck, Calendar, FileText, Check, Phone } from 'lucide-react';

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  type: TransactionType;
  currency: string;
  contacts: Contact[];
  preselectedContact?: Contact | null;
  onSave: (data: {
    contactId: string;
    type: TransactionType;
    originalAmount: number;
    description: string;
    date: string;
  }) => Promise<void>;
  onAddNewContact: (name: string, phone: string) => Promise<Contact>;
}

export const AddTransactionSheet: React.FC<AddTransactionSheetProps> = ({
  isOpen,
  onClose,
  type,
  currency,
  contacts,
  preselectedContact,
  onSave,
  onAddNewContact,
}) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (preselectedContact) {
        setSelectedContact(preselectedContact);
      } else {
        setSelectedContact(null);
      }
      setAmount('');
      setDescription('');
      setDate(getTodayDateString());
      setError(null);
    }
  }, [isOpen, preselectedContact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) {
      setError('Please select a contact');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description (what is this money for?)');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        contactId: selectedContact.id,
        type,
        originalAmount: numAmount,
        description: description.trim(),
        date,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save transaction';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReceive = type === 'RECEIVE';
  const title = isReceive ? 'MONEY TO RECEIVE' : 'MONEY TO PAY';
  const subtitle = isReceive
    ? 'Record money someone owes you'
    : 'Record money you owe to someone';

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}>
        <form onSubmit={handleSubmit} className="space-y-4 pb-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Contact Selection */}
          <div>
            <label className="block text-[11px] font-bold text-[#8E95A3] mb-1.5 uppercase tracking-wider">
              CONTACT <span className={isReceive ? 'text-emerald-400' : 'text-rose-400'}>*</span>
            </label>

            {selectedContact ? (
              <div className="p-3.5 rounded-2xl bg-[#0D0F15] border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#1A1E29] border border-white/[0.1] flex items-center justify-center font-extrabold text-white text-base shadow-xs">
                    <span className={isReceive ? 'text-emerald-400' : 'text-rose-400'}>
                      {selectedContact.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{selectedContact.name}</p>
                    <p className="text-xs text-[#8E95A3] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-[#5A6272]" />
                      {selectedContact.phone || 'No phone number'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                    isReceive
                      ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                      : 'text-rose-400 hover:text-rose-300 bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="w-full py-4 px-4 rounded-2xl bg-[#0D0F15] border-2 border-dashed border-white/15 hover:border-white/30 hover:bg-[#12151D] active:scale-[0.99] flex items-center justify-center gap-2 text-[#8E95A3] hover:text-white font-semibold transition"
              >
                <UserCheck className={`w-5 h-5 ${isReceive ? 'text-emerald-400' : 'text-rose-400'}`} />
                <span>Select Contact</span>
              </button>
            )}
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-[11px] font-bold text-[#8E95A3] mb-1.5 uppercase tracking-wider">
              AMOUNT ({currency}) <span className={isReceive ? 'text-emerald-400' : 'text-rose-400'}>*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <span className={`text-base font-bold ${isReceive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currency}
                </span>
              </div>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.00"
                className={`w-full bg-[#0D0F15] border border-white/[0.08] rounded-2xl pl-20 pr-4 py-3.5 text-2xl font-black text-white placeholder-[#5A6272] focus:outline-none focus:ring-2 tabular-nums ${
                  isReceive
                    ? 'focus:ring-emerald-500/50 focus:border-emerald-500/60'
                    : 'focus:ring-rose-500/50 focus:border-rose-500/60'
                }`}
              />
            </div>
          </div>

          {/* Description input */}
          <div>
            <label className="block text-[11px] font-bold text-[#8E95A3] mb-1.5 uppercase tracking-wider">
              DESCRIPTION <span className={isReceive ? 'text-emerald-400' : 'text-rose-400'}>*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-[#5A6272]" />
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this money for? (e.g. Borrowed money for grocery)"
                className={`w-full bg-[#0D0F15] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5A6272] focus:outline-none focus:ring-2 resize-none ${
                  isReceive
                    ? 'focus:ring-emerald-500/50 focus:border-emerald-500/60'
                    : 'focus:ring-rose-500/50 focus:border-rose-500/60'
                }`}
              />
            </div>

            {/* Quick description chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                'Borrowed money',
                'Grocery expense',
                'Business payment',
                'Graphic design payment',
                'Personal loan',
                'Transport expense',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setDescription(chip)}
                  className="text-[11px] bg-[#181C26] hover:bg-[#202534] active:scale-95 text-[#8E95A3] hover:text-white px-3 py-1 rounded-full border border-white/[0.06] transition"
                >
                  +{chip}
                </button>
              ))}
            </div>
          </div>

          {/* Date picker */}
          <div>
            <label className="block text-[11px] font-bold text-[#8E95A3] mb-1.5 uppercase tracking-wider">
              DATE
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6272] pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full bg-[#0D0F15] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 cursor-pointer ${
                  isReceive
                    ? 'focus:ring-emerald-500/50 focus:border-emerald-500/60'
                    : 'focus:ring-rose-500/50 focus:border-rose-500/60'
                }`}
              />
            </div>
          </div>

          {/* Save Transaction Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-4 rounded-2xl font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-xl transition active:scale-[0.99] ${
                isReceive
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-950/40'
              }`}
            >
              <Check className="w-5 h-5 stroke-[3px]" />
              <span>{isSubmitting ? 'SAVING...' : 'SAVE TRANSACTION'}</span>
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Contact Picker Modal */}
      <ContactPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        contacts={contacts}
        onSelectContact={(contact) => {
          setSelectedContact(contact);
          setIsPickerOpen(false);
        }}
        onAddNewContact={onAddNewContact}
      />
    </>
  );
};
