import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { TransactionType } from '../../types';

interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: TransactionType) => void;
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="ADD TRANSACTION"
      subtitle="Select transaction direction"
    >
      <div className="space-y-3.5 py-2">
        {/* + MONEY TO RECEIVE */}
        <button
          type="button"
          onClick={() => {
            onSelectType('RECEIVE');
            onClose();
          }}
          className="w-full p-4 rounded-3xl bg-[#12151D] border border-emerald-500/30 hover:border-emerald-500/60 active:scale-[0.99] transition flex items-center justify-between group shadow-lg text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-black flex items-center justify-center group-hover:scale-105 transition shadow-md shadow-emerald-500/20">
              <Plus className="w-6 h-6 stroke-[3px]" />
            </div>
            <div>
              <p className="text-base font-extrabold text-white group-hover:text-emerald-400 transition">
                + MONEY TO RECEIVE
              </p>
              <p className="text-xs text-[#8E95A3] mt-0.5">
                Someone owes me money (Lent, advance, loan)
              </p>
            </div>
          </div>
          <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            Receivable
          </span>
        </button>

        {/* - MONEY TO PAY */}
        <button
          type="button"
          onClick={() => {
            onSelectType('PAY');
            onClose();
          }}
          className="w-full p-4 rounded-3xl bg-[#12151D] border border-rose-500/30 hover:border-rose-500/60 active:scale-[0.99] transition flex items-center justify-between group shadow-lg text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center group-hover:scale-105 transition shadow-md shadow-rose-950/40">
              <Minus className="w-6 h-6 stroke-[3px]" />
            </div>
            <div>
              <p className="text-base font-extrabold text-white group-hover:text-rose-300 transition">
                - MONEY TO PAY
              </p>
              <p className="text-xs text-[#8E95A3] mt-0.5">
                I owe money to someone (Borrowed, service, debt)
              </p>
            </div>
          </div>
          <span className="text-rose-400 font-bold text-xs bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
            Payable
          </span>
        </button>
      </div>
    </BottomSheet>
  );
};
