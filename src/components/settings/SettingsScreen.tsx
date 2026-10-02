import React, { useState, useRef } from 'react';
import { AppSettings, BackupData } from '../../types';
import { StorageService } from '../../services/storage';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Coins,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Shield,
  Info,
  CheckCircle,
  AlertCircle,
  User,
  Heart,
  Sparkles,
} from 'lucide-react';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

const SUPPORTED_CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'SAR', name: 'Saudi Riyal (SAR)' },
  { code: 'QAR', name: 'Qatari Riyal (QAR)' },
  { code: 'KWD', name: 'Kuwaiti Dinar (KWD)' },
  { code: 'OMR', name: 'Omani Rial (OMR)' },
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'PKR', name: 'Pakistani Rupee (PKR)' },
  { code: 'BDT', name: 'Bangladeshi Taka (৳)' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onRefreshData,
}) => {
  const [userName, setUserName] = useState(settings.userName);
  const [currency, setCurrency] = useState(settings.currency);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [confirmAction, setConfirmAction] = useState<'reset' | 'clear' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      ...settings,
      userName: userName.trim() || 'ALARMENS BALANCE',
      currency,
      currencySymbol: currency,
    });
    setFeedback({ type: 'success', text: 'Preferences updated successfully!' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleExportBackup = async () => {
    try {
      const jsonBackup = await StorageService.exportBackup();
      const blob = new Blob([jsonBackup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `alarmens-balance-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      setFeedback({ type: 'success', text: 'Backup file exported successfully!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to export backup.' });
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await StorageService.importBackup(text);
      if (res.success) {
        await onRefreshData();
        setFeedback({ type: 'success', text: 'Backup restored successfully!' });
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Could not read backup file.' });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleConfirmReset = async () => {
    if (confirmAction === 'reset') {
      await StorageService.resetToDemoData();
      await onRefreshData();
      setFeedback({ type: 'success', text: 'Reset to sample test data successfully!' });
    } else if (confirmAction === 'clear') {
      await StorageService.clearAllData();
      await onRefreshData();
      setFeedback({ type: 'success', text: 'All data cleared successfully!' });
    }
    setConfirmAction(null);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">SETTINGS</h2>
        <p className="text-xs text-[#A7A7A7]">Preferences, currency & data management</p>
      </div>

      {/* PWA Experience Card */}
      <div className="p-4 rounded-3xl bg-[#141414] border border-[#242424] flex items-center justify-between shadow-sm">
        <div>
          <h3 className="text-sm font-extrabold text-white">App Experience</h3>
          <p className="text-xs text-[#A7A7A7] mt-0.5">Install ALARMENS BALANCE on your home screen</p>
        </div>
        <PWAInstallButton />
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-[#FF9F1C]/15 border border-[#FF9F1C]/35 text-[#FFB52E]'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Profile & Currency Form */}
      <form
        onSubmit={handleSavePreferences}
        className="p-5 rounded-3xl bg-[#141414] border border-[#242424] shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-[#242424] pb-3">
          <Coins className="w-4 h-4 text-[#FF9F1C]" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            General Preferences
          </h3>
        </div>

        {/* User / App Name */}
        <div>
          <label className="block text-[11px] font-bold text-[#A7A7A7] mb-1.5 uppercase">
            Ledger / Owner Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707070]" />
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. ALARMENS BALANCE"
              className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]"
            />
          </div>
        </div>

        {/* Currency selection */}
        <div>
          <label className="block text-[11px] font-bold text-[#A7A7A7] mb-1.5 uppercase">
            Primary Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF9F1C] cursor-pointer"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-[#A7A7A7] mt-1">
            Financial amounts will display in {currency} format (e.g. {currency} 100.00).
          </p>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-gradient-to-r from-[#FF9F1C] to-[#FFB52E] text-black font-extrabold rounded-2xl text-xs shadow-md shadow-[#FF9F1C]/20 transition active:scale-95"
        >
          Save Preferences
        </button>
      </form>

      {/* Backup & Restore (Section 25) */}
      <div className="p-5 rounded-3xl bg-[#141414] border border-[#242424] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#242424] pb-3">
          <Download className="w-4 h-4 text-[#FF9F1C]" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Backup & Restore
          </h3>
        </div>

        <p className="text-xs text-[#A7A7A7] leading-relaxed">
          Export your entire financial ledger (contacts, transactions, payments, descriptions) to a JSON file, or restore it on another phone.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* Export button */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="py-3.5 px-3 rounded-2xl bg-[#1C1C1C] hover:bg-[#252525] border border-[#2D2D2D] active:scale-95 transition flex flex-col items-center justify-center gap-1.5 text-center text-white"
          >
            <Download className="w-5 h-5 text-[#FFB52E]" />
            <span className="text-xs font-bold">Export Backup</span>
            <span className="text-[10px] text-[#A7A7A7]">Download JSON</span>
          </button>

          {/* Import button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-3.5 px-3 rounded-2xl bg-[#1C1C1C] hover:bg-[#252525] border border-[#2D2D2D] active:scale-95 transition flex flex-col items-center justify-center gap-1.5 text-center text-white"
          >
            <Upload className="w-5 h-5 text-[#FF9F1C]" />
            <span className="text-xs font-bold">Import Backup</span>
            <span className="text-[10px] text-[#A7A7A7]">Restore JSON</span>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFileChange}
          accept=".json,application/json"
          className="hidden"
        />
      </div>

      {/* Data Management */}
      <div className="p-5 rounded-3xl bg-[#141414] border border-[#242424] shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-[#242424] pb-3">
          <RotateCcw className="w-4 h-4 text-[#FFB52E]" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Data Management
          </h3>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => setConfirmAction('reset')}
            className="w-full py-3 px-4 rounded-2xl bg-[#1C1C1C] hover:bg-[#252525] text-[#A7A7A7] hover:text-white border border-[#2D2D2D] text-xs font-semibold flex items-center justify-between active:scale-98 transition"
          >
            <span>Reset with Sample Test Data</span>
            <RotateCcw className="w-3.5 h-3.5 text-[#707070]" />
          </button>

          <button
            type="button"
            onClick={() => setConfirmAction('clear')}
            className="w-full py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-between active:scale-98 transition"
          >
            <span>Clear All Ledger Data</span>
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>
      </div>

      {/* About & Privacy */}
      <div className="p-5 rounded-3xl bg-[#141414] border border-[#242424] shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-[#242424] pb-3">
          <Shield className="w-4 h-4 text-[#FF9F1C]" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            About ALARMENS BALANCE & Privacy
          </h3>
        </div>

        <div className="space-y-2 text-xs text-[#A7A7A7] leading-relaxed">
          <p>
            <strong className="text-white">ALARMENS BALANCE</strong> is a luxury dark fintech personal money manager crafted for fast, dependable smartphone accounting.
          </p>
          <p>
            <strong className="text-white">100% Client-Side Privacy:</strong> All contacts, accounts, transactions, and partial payments are stored directly inside your phone’s IndexedDB storage.
          </p>
          <div className="pt-2 text-[11px] text-[#707070] flex items-center justify-between border-t border-[#242424]">
            <span>Version 2.0.0 (Production)</span>
            <span className="flex items-center gap-1 text-[#A7A7A7]">
              Built with <Sparkles className="w-3 h-3 text-[#FFB52E]" /> for Mobile
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        title={confirmAction === 'reset' ? 'Reset to Sample Data?' : 'Clear All Data?'}
        message={
          confirmAction === 'reset'
            ? 'This will restore sample contacts (Rahim Ahmed, Karim Ahmed, Hasan Ahmed, Ahmed Ali, Sami Khan) and transactions for testing.'
            : 'Are you sure you want to permanently delete all your contacts, transactions, and payments? This action cannot be undone.'
        }
        confirmLabel={confirmAction === 'reset' ? 'Reset Data' : 'Clear Everything'}
        isDestructive={confirmAction === 'clear'}
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};
