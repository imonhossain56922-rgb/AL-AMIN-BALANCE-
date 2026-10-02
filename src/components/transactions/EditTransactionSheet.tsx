import React, { useState, useEffect } from 'react';
import { Transaction, Payment } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { Calendar, FileText, Check, AlertCircle } from 'lucide-react';

interface EditTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  item:
    | { type: 'transaction'; data: Transaction }
    | { type: 'payment'; data: Payment }
    | null;
  onSaveTransaction: (updated: Transaction) => Promise<void>;
  onSavePayment: (updated: Payment) => Promise<void>;
}

export const EditTransactionSheet: React.FC<EditTransactionSheetProps> = ({
  isOpen,
  onClose,
  currency,
  item,
  onSaveTransaction,
  onSavePayment,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      if (item.type === 'transaction') {
        setAmount(item.data.originalAmount.toString());
        setDescription(item.data.description);
        setDate(item.data.date);
      } else {
        setAmount(item.data.amount.toString());
        setDescription(item.data.description);
        setDate(item.data.date);
      }
      setError(null);
    }
  }, [item, isOpen]);

  if (!item) return null;

  const isTransaction = item.type === 'transaction';
  const title = isTransaction ? 'Edit Transaction' : 'Edit Payment';
  const subtitle = isTransaction
    ? 'Update transaction amount or description'
    : 'Update payment amount or description';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (isTransaction && !description.trim()) {
      setError('Please provide a description');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (isTransaction) {
        await onSaveTransaction({
          ...item.data,
          originalAmount: numAmount,
          description: description.trim(),
          date,
        });
      } else {
        await onSavePayment({
          ...item.data,
          amount: numAmount,
          description: description.trim(),
          date,
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save changes';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}>
      <form onSubmit={handleSubmit} className="space-y-4 pb-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-[11px] font-bold text-[#A7A7A7] mb-1.5 uppercase tracking-wider">
            Amount ({currency}) <span className="text-[#FF9F1C]">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <span className="text-base font-bold text-[#FFB52E]">{currency}</span>
            </div>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl pl-20 pr-4 py-3.5 text-2xl font-black text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-[#FF9F1C] focus:border-[#FF9F1C] tabular-nums"
            />
          </div>
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-[11px] font-bold text-[#A7A7A7] mb-1.5 uppercase tracking-wider">
            Description {isTransaction && <span className="text-[#FF9F1C]">*</span>}
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-[#707070]" />
            <input
              type="text"
              required={isTransaction}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Borrowed money for grocery"
              className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-[#FF9F1C] focus:border-[#FF9F1C]"
            />
          </div>
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-[11px] font-bold text-[#A7A7A7] mb-1.5 uppercase tracking-wider">
            Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707070] pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF9F1C] focus:border-[#FF9F1C] cursor-pointer"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-[#FF9F1C] to-[#FFB52E] text-black font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#FF9F1C]/25 transition active:scale-[0.99]"
          >
            <Check className="w-5 h-5 stroke-[2.5px]" />
            <span>{isSubmitting ? 'UPDATING...' : 'UPDATE RECORD'}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
