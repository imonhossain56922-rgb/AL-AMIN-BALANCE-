import React, { useState } from 'react';
import { Contact } from '../../types';
import { Search, UserCheck, Smartphone, UserPlus, X, Phone } from 'lucide-react';

interface ContactPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onAddNewContact: (name: string, phone: string) => Promise<Contact>;
}

export const ContactPickerModal: React.FC<ContactPickerModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onSelectContact,
  onAddNewContact,
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'manual'>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDevicePickerLoading, setIsDevicePickerLoading] = useState(false);

  if (!isOpen) return null;

  // Check if Web Contact Picker API is available
  const hasDeviceContactPicker =
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    'ContactsManager' in window;

  const handleDevicePicker = async () => {
    setIsDevicePickerLoading(true);
    setError(null);
    try {
      const nav = navigator as unknown as {
        contacts: {
          select: (
            properties: string[],
            options?: { multiple?: boolean }
          ) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
        };
      };

      const selected = await nav.contacts.select(['name', 'tel'], { multiple: false });
      if (selected && selected.length > 0) {
        const picked = selected[0];
        const name = (picked.name && picked.name[0]) || 'Phone Contact';
        const phone = (picked.tel && picked.tel[0]) || '';

        // Check if contact already exists in saved contacts
        const existing = contacts.find(
          (c) =>
            c.name.trim().toLowerCase() === name.trim().toLowerCase() ||
            (phone && c.phone.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, ''))
        );

        if (existing) {
          onSelectContact(existing);
          onClose();
        } else {
          const newContact = await onAddNewContact(name, phone);
          onSelectContact(newContact);
          onClose();
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Device contact picker was cancelled or unavailable.');
      }
      setActiveTab('manual');
    } finally {
      setIsDevicePickerLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) {
      setError('Please enter contact name');
      return;
    }

    try {
      // Check if contact already exists
      const existing = contacts.find(
        (c) =>
          c.name.trim().toLowerCase() === manualName.trim().toLowerCase() ||
          (manualPhone && c.phone.replace(/[^0-9]/g, '') === manualPhone.replace(/[^0-9]/g, ''))
      );

      if (existing) {
        onSelectContact(existing);
      } else {
        const newContact = await onAddNewContact(manualName.trim(), manualPhone.trim());
        onSelectContact(newContact);
      }
      onClose();
    } catch {
      setError('Failed to save contact');
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#141414] border border-[#292929] rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#242424]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#FFB52E]" />
            <h3 className="text-base font-extrabold text-white">SELECT CONTACT</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#A7A7A7] hover:text-white hover:bg-[#202020] transition active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Picker Banner */}
        <div className="p-4 bg-[#181818] border-b border-[#242424]">
          <button
            type="button"
            onClick={handleDevicePicker}
            disabled={isDevicePickerLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#FF9F1C] to-[#FFB52E] text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF9F1C]/20 transition text-xs tracking-wider active:scale-[0.99]"
          >
            <Smartphone className="w-4 h-4 stroke-[2.5px]" />
            {isDevicePickerLoading
              ? 'Opening Contacts...'
              : hasDeviceContactPicker
              ? 'Choose from Phone Contacts'
              : 'Import from Phone / Contacts'}
          </button>
          {!hasDeviceContactPicker && (
            <p className="text-[11px] text-[#A7A7A7] text-center mt-1.5">
              Select existing or enter contact details below
            </p>
          )}
        </div>

        {/* Tab switcher: Saved vs Manual */}
        <div className="flex border-b border-[#242424] px-4 pt-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('saved');
              setError(null);
            }}
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition border-b-2 text-center ${
              activeTab === 'saved'
                ? 'border-[#FF9F1C] text-[#FFB52E]'
                : 'border-transparent text-[#A7A7A7] hover:text-white'
            }`}
          >
            Saved Contacts ({contacts.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              setError(null);
            }}
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition border-b-2 text-center ${
              activeTab === 'manual'
                ? 'border-[#FF9F1C] text-[#FFB52E]'
                : 'border-transparent text-[#A7A7A7] hover:text-white'
            }`}
          >
            Enter Manually
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'saved' ? (
            <div className="space-y-3">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707070]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name or number..."
                  className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-[#FF9F1C] focus:border-[#FF9F1C]"
                />
              </div>

              {filteredContacts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-[#A7A7A7]">No matching contacts found.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#FFB52E] hover:text-[#FFD166] font-bold"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Enter Contact Manually
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#222222]">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => {
                        onSelectContact(contact);
                        onClose();
                      }}
                      className="w-full text-left py-3 px-2 flex items-center justify-between hover:bg-[#1C1C1C] active:bg-[#202020] rounded-2xl transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${
                            contact.avatarColor || 'from-[#FF9F1C] to-[#E07A00]'
                          } flex items-center justify-center font-black text-black text-sm shadow-xs`}
                        >
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-[#FFB52E] transition text-sm">
                            {contact.name}
                          </p>
                          <p className="text-xs text-[#A7A7A7] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#707070]" />
                            {contact.phone || 'No phone number'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-[#1F1F1F] group-hover:bg-[#FF9F1C] text-[#A7A7A7] group-hover:text-black font-bold px-3 py-1.5 rounded-full border border-[#2D2D2D] group-hover:border-transparent transition">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#A7A7A7] mb-1.5 uppercase tracking-wider">
                  Contact Name <span className="text-[#FF9F1C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Rahim Ahmed"
                  className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl px-4 py-3 text-white text-base placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#A7A7A7] mb-1.5 uppercase tracking-wider">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="e.g. +971 50 123 4567"
                  className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl px-4 py-3 text-white text-base placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-[#FF9F1C] to-[#FFB52E] text-black font-black rounded-2xl shadow-xl shadow-[#FF9F1C]/20 transition text-xs tracking-wider flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <UserPlus className="w-4 h-4 stroke-[3px]" />
                  SAVE & SELECT CONTACT
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
