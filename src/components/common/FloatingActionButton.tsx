import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  ariaLabel?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  ariaLabel = 'Add transaction',
}) => {
  return (
    <div className="fixed bottom-20 right-5 z-30 sm:right-[max(1.25rem,calc(50%-14rem))]">
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center justify-center shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/25"
      >
        <Plus className="w-7 h-7 stroke-[3px]" />
      </button>
    </div>
  );
};
