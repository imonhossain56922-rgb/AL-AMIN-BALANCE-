import React, { useState, useEffect } from 'react';
import { Contact, ContactFinancials } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { formatCurrency } from '../../services/financials';
import {
  sharePdfStatement,
  triggerBlobDownload,
  buildWhatsAppUrl,
  ShareResult,
} from '../../services/shareService';
import {
  FileDown,
  Share2,
  CheckCircle,
  ExternalLink,
  Smartphone,
  AlertCircle,
  Eye,
  FileText,
  Receipt,
  Loader2,
} from 'lucide-react';

export type PdfReportFormat = 'statement' | 'thermal';

interface ShareSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  financials: ContactFinancials;
  currency: string;
  pdfBlob: Blob | null;
  fileName: string;
  initialFormat?: PdfReportFormat;
  onRegeneratePdf: (format: PdfReportFormat) => Promise<{ blob: Blob; fileName: string }>;
}

export const ShareSheetModal: React.FC<ShareSheetModalProps> = ({
  isOpen,
  onClose,
  contact,
  financials,
  currency,
  pdfBlob,
  fileName,
  initialFormat = 'statement',
  onRegeneratePdf,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<PdfReportFormat>(initialFormat);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(pdfBlob);
  const [currentFileName, setCurrentFileName] = useState<string>(fileName);
  const [isSwitchingFormat, setIsSwitchingFormat] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Sync props when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedFormat(initialFormat);
      setCurrentBlob(pdfBlob);
      setCurrentFileName(fileName);
      setStatusMessage(null);
    }
  }, [isOpen, pdfBlob, fileName, initialFormat]);

  if (!isOpen) return null;

  const isReceive = financials.receiveTotal >= financials.payTotal;
  const remaining = isReceive ? financials.receiveRemaining : financials.payRemaining;

  const handleFormatChange = async (format: PdfReportFormat) => {
    if (format === selectedFormat) return;
    setSelectedFormat(format);
    setIsSwitchingFormat(true);
    setStatusMessage(null);
    try {
      const generated = await onRegeneratePdf(format);
      setCurrentBlob(generated.blob);
      setCurrentFileName(generated.fileName);
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Failed to format document',
      });
    } finally {
      setIsSwitchingFormat(false);
    }
  };

  const handleNativeShare = async () => {
    setIsSharing(true);
    setStatusMessage(null);
    try {
      let activeBlob = currentBlob;
      let activeFileName = currentFileName;
      if (!activeBlob) {
        const generated = await onRegeneratePdf(selectedFormat);
        activeBlob = generated.blob;
        activeFileName = generated.fileName;
        setCurrentBlob(activeBlob);
        setCurrentFileName(activeFileName);
      }

      const result: ShareResult = await sharePdfStatement(
        activeBlob,
        activeFileName,
        contact,
        financials,
        currency
      );

      if (result.status === 'shared') {
        setStatusMessage({
          type: 'success',
          text: `${selectedFormat === 'thermal' ? 'Thermal Receipt' : 'Statement PDF'} shared successfully!`,
        });
      } else if (result.status === 'cancelled') {
        // User cancelled share sheet; no false success message
        setStatusMessage(null);
      } else if (result.status === 'unsupported') {
        setStatusMessage({
          type: 'info',
          text: 'Direct PDF file sharing is not supported by your current browser. Please download the PDF and send via WhatsApp below.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || 'Share failed',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'An error occurred while sharing the statement.',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    try {
      let activeBlob = currentBlob;
      let activeFileName = currentFileName;
      if (!activeBlob) {
        const generated = await onRegeneratePdf(selectedFormat);
        activeBlob = generated.blob;
        activeFileName = generated.fileName;
        setCurrentBlob(activeBlob);
        setCurrentFileName(activeFileName);
      }
      triggerBlobDownload(activeBlob, activeFileName);
      setStatusMessage({
        type: 'success',
        text: `${selectedFormat === 'thermal' ? 'Thermal Receipt' : 'Account Statement'} downloaded!`,
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Failed to download PDF',
      });
    }
  };

  const handleOpenWhatsApp = () => {
    const url = buildWhatsAppUrl(contact.phone, contact.name, financials, currency);
    window.open(url, '_blank', 'noopener,noreferrer');
    setStatusMessage({
      type: 'info',
      text: 'WhatsApp opened. Remember to attach the downloaded PDF receipt/statement.',
    });
  };

  const handlePreviewPdf = () => {
    if (!currentBlob) return;
    const blobUrl = URL.createObjectURL(currentBlob);
    window.open(blobUrl, '_blank');
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Share Statement & Receipt"
      subtitle={`Account Report for ${contact.name}`}
    >
      <div className="space-y-4 pb-2">
        {/* Format Selector Pills */}
        <div>
          <label className="block text-[11px] font-bold text-[#8E95A3] mb-2 uppercase tracking-wider">
            Report Format
          </label>
          <div className="grid grid-cols-2 gap-2 bg-[#0D0F15] p-1.5 rounded-2xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => handleFormatChange('statement')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                selectedFormat === 'statement'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-[#8E95A3] hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>A4 Statement</span>
            </button>

            <button
              type="button"
              onClick={() => handleFormatChange('thermal')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                selectedFormat === 'thermal'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-[#8E95A3] hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>80mm POS Slip</span>
            </button>
          </div>
        </div>

        {/* Contact Statement Summary Card */}
        <div className="p-4 rounded-2xl bg-[#0D0F15] border border-white/[0.08]">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <p className="font-bold text-white text-base">{contact.name}</p>
              <p className="text-xs text-[#8E95A3]">{contact.phone || 'No phone number'}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#8E95A3] block uppercase tracking-wider">
                Remaining Balance
              </span>
              <span
                className={`text-base font-extrabold tabular-nums ${
                  remaining > 0 ? (isReceive ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'
                }`}
              >
                {formatCurrency(remaining, currency)}
              </span>
            </div>
          </div>

          <div className="pt-2.5 flex items-center justify-between text-xs text-[#8E95A3]">
            <span className="flex items-center gap-1">
              {isSwitchingFormat && <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />}
              <span>{selectedFormat === 'thermal' ? 'POS Receipt Slip:' : 'Statement File:'}</span>
            </span>
            <span className="font-mono text-emerald-400 text-[11px] truncate max-w-[190px]">
              {currentFileName || (selectedFormat === 'thermal' ? 'alarmens_receipt.pdf' : 'alarmens_statement.pdf')}
            </span>
          </div>
        </div>

        {/* Status feedback banner */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                : statusMessage.type === 'info'
                ? 'bg-blue-500/15 border border-blue-500/30 text-blue-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : statusMessage.type === 'info' ? (
              <Smartphone className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Primary Action: Native Share Sheet */}
        <button
          type="button"
          onClick={handleNativeShare}
          disabled={isSharing || isSwitchingFormat}
          className="w-full py-4 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/20 active:scale-[0.99] transition text-sm tracking-wider"
        >
          <Share2 className="w-5 h-5 stroke-[2.5px]" />
          <span>
            {isSharing
              ? 'PREPARING SHARE SHEET...'
              : `SHARE ${selectedFormat === 'thermal' ? 'POS RECEIPT' : 'PDF STATEMENT'}`}
          </span>
        </button>

        {/* Fallback & Direct Sharing Options Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Download PDF button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isSwitchingFormat}
            className="py-3.5 px-3 rounded-2xl bg-[#1A1E29] hover:bg-[#222736] border border-white/[0.08] active:scale-[0.98] transition flex flex-col items-center justify-center gap-1.5 text-center text-white"
          >
            <FileDown className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold">
              Download {selectedFormat === 'thermal' ? 'Receipt' : 'PDF'}
            </span>
            <span className="text-[10px] text-[#8E95A3]">Save to device</span>
          </button>

          {/* Open WhatsApp button */}
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="py-3.5 px-3 rounded-2xl bg-[#1A1E29] hover:bg-[#222736] border border-white/[0.08] active:scale-[0.98] transition flex flex-col items-center justify-center gap-1.5 text-center text-emerald-400"
          >
            <div className="flex items-center gap-1">
              <span className="text-sm">💬</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-white">Open WhatsApp</span>
            <span className="text-[10px] text-[#8E95A3]">Send balance note</span>
          </button>
        </div>

        {/* Preview PDF */}
        {currentBlob && (
          <button
            type="button"
            onClick={handlePreviewPdf}
            className="w-full py-2.5 text-xs text-[#8E95A3] hover:text-white flex items-center justify-center gap-1.5 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview {selectedFormat === 'thermal' ? '80mm Receipt Slip' : 'Full Statement PDF'}
          </button>
        )}
      </div>
    </BottomSheet>
  );
};
