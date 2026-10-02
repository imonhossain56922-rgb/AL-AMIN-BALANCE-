import React, { useState, useEffect } from 'react';
import { Contact } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { User, Phone, Check, AlertCircle } from 'lucide-react';

interface EditContactSheetProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  onSave: (updatedContact: Contact) => Promise<void>;
}

export const EditContactSheet: React.FC<EditContactSheetProps> = ({
  isOpen,
  onClose,
  contact,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contact && isOpen) {
      setName(contact.name);
      setPhone(contact.phone || '');
      setError(null);
    }
  }, [contact, isOpen]);

  if (!contact) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Contact name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        ...contact,
        name: name.trim(),
        phone: phone.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update contact';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Contact"
      subtitle={`Update details for ${contact.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pb-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Contact Name */}
        <div>
          <label className="block text-[11px] font-bold text-[#A7A7A7] mb-1.5 uppercase tracking-wider">
            Contact Name <span className="text-[#FF9F1C]">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707070]" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahim Ahmed"
              className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-[#FF9F1C] focus:border-[#FF9F1C]"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-[11px] font-bold text-[#A7A7A7] mb-1.5 uppercase tracking-wider">
            Mobile Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707070]" />
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +971 50 123 4567"
              className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-[#FF9F1C] focus:border-[#FF9F1C]"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-[#FF9F1C] to-[#FFB52E] text-black font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#FF9F1C]/25 transition active:scale-[0.99]"
          >
            <Check className="w-5 h-5 stroke-[2.5px]" />
            <span>{isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
