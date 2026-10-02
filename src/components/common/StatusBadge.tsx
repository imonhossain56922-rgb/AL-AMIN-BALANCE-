import React from 'react';
import { AccountStatus } from '../../types';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: AccountStatus | 'NONE';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  if (status === 'NONE') return null;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  if (status === 'PAID') {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        ✓ PAID
      </span>
    );
  }

  if (status === 'PARTIALLY PAID') {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses}`}
      >
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        PARTIALLY PAID
      </span>
    );
  }

  // UNPAID
  return (
    <span
      className={`inline-flex items-center font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses}`}
    >
      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
      UNPAID
    </span>
  );
};
