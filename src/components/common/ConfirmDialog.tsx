import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl text-slate-900">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDestructive ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}
          >
            {isDestructive ? (
              <Trash2 className="w-5 h-5 stroke-[2.2px]" />
            ) : (
              <AlertTriangle className="w-5 h-5 stroke-[2.2px]" />
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
        </div>

        <p className="text-xs text-slate-600 mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition active:scale-95 text-center"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs tracking-wider transition active:scale-95 text-center ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
