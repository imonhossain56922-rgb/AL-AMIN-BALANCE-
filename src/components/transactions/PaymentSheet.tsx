import React, { useState, useEffect } from 'react';
import { Contact, PaymentType } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { formatCurrency, getTodayDateString } from '../../services/financials';
import { Calendar, FileText, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  paymentType: PaymentType;
  remainingBalance: number;
  currency: string;
  onSavePayment: (data: {
    contactId: string;
    type: PaymentType;
    amount: number;
    description: string;
    date: string;
  }) => Promise<void>;
}

export const PaymentSheet: React.FC<PaymentSheetProps> = ({
  isOpen,
  onClose,
  contact,
  paymentType,
  remainingBalance,
  currency,
  onSavePayment,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDescription(paymentType === 'PAYMENT_RECEIVED' ? 'Partial payment' : 'Payment made');
      setDate(getTodayDateString());
      setError(null);
    }
  }, [isOpen, paymentType]);

  const isReceivePayment = paymentType === 'PAYMENT_RECEIVED';
  const title = isReceivePayment ? '+ RECEIVE PAYMENT' : '+ MAKE PAYMENT';
  const subtitle = isReceivePayment
    ? `Record payment received from ${contact.name}`
    : `Record payment made to ${contact.name}`;

  const handleFullAmount = () => {
    setAmount(remainingBalance.toString());
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (numAmount > remainingBalance + 0.001) {
      setError('Payment amount cannot be greater than the remaining balance.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSavePayment({
        contactId: contact.id,
        type: paymentType,
        amount: numAmount,
        description: description.trim() || (isReceivePayment ? 'Payment received' : 'Payment settled'),
        date,
      });

      if (Math.abs(remainingBalance - numAmount) < 0.01) {
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#10B981', '#34D399', '#FBBF24', '#FFFFFF'],
          });
        } catch {
          // ignore
        }
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}>
      <form onSubmit={handleSubmit} className="space-y-4 pb-4">
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Contact Overview Box */}
        <div className="p-3.5 rounded-2xl bg-[#0D0F15] border border-white/[0.08] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8E95A3]">Account Holder</p>
            <p className="text-sm font-bold text-white mt-0.5">{contact.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#8E95A3]">Current Due</p>
            <p
              className={`text-sm font-black tabular-nums mt-0.5 ${
                isReceivePayment ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(remainingBalance, currency)}
            </p>
          </div>
        </div>

        {/* Amount Input with Quick "Full Amount" button */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-[#8E95A3] uppercase tracking-wider">
              PAYMENT AMOUNT ({currency}) <span className={isReceivePayment ? 'text-emerald-400' : 'text-rose-400'}>*</span>
            </label>
            <button
              type="button"
              onClick={handleFullAmount}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/25 active:scale-95 transition"
            >
              Pay Full ({formatCurrency(remainingBalance, currency)})
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <span className={`text-base font-bold ${isReceivePayment ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currency}
              </span>
            </div>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0.01"
              max={remainingBalance}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full bg-[#0D0F15] border border-white/[0.08] rounded-2xl pl-20 pr-4 py-3.5 text-2xl font-black text-white placeholder-[#5A6272] focus:outline-none focus:ring-2 tabular-nums ${
                isReceivePayment
                  ? 'focus:ring-emerald-500/50 focus:border-emerald-500/60'
                  : 'focus:ring-rose-500/50 focus:border-rose-500/60'
              }`}
            />
          </div>
        </div>

        {/* Description / Notes */}
        <div>
          <label className="block text-[11px] font-bold text-[#8E95A3] mb-1.5 uppercase tracking-wider">
            NOTES / REFERENCE
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6272]" />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Bank transfer, cash payment"
              className={`w-full bg-[#0D0F15] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5A6272] focus:outline-none focus:ring-2 ${
                isReceivePayment
                  ? 'focus:ring-emerald-500/50 focus:border-emerald-500/60'
                  : 'focus:ring-rose-500/50 focus:border-rose-500/60'
              }`}
            />
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
                isReceivePayment
                  ? 'focus:ring-emerald-500/50 focus:border-emerald-500/60'
                  : 'focus:ring-rose-500/50 focus:border-rose-500/60'
              }`}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-4 rounded-2xl font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-xl transition active:scale-[0.99] ${
              isReceivePayment
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-950/40'
            }`}
          >
            <Check className="w-5 h-5 stroke-[3px]" />
            <span>{isSubmitting ? 'RECORDING...' : 'RECORD PAYMENT'}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
