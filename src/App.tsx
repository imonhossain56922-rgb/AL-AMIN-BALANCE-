import React, { useState, useEffect, useCallback } from 'react';
import {
  Contact,
  Transaction,
  Payment,
  AppSettings,
  ActiveTab,
  TransactionType,
  PaymentType,
} from './types';
import { StorageService } from './services/storage';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { FloatingActionButton } from './components/common/FloatingActionButton';
import { LoadingSplash } from './components/common/LoadingSplash';
import { QuickActionSheet } from './components/transactions/QuickActionSheet';
import { AddTransactionSheet } from './components/transactions/AddTransactionSheet';
import { ContactPickerModal } from './components/contacts/ContactPickerModal';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { ContactsScreen } from './components/contacts/ContactsScreen';
import { ContactDetailScreen } from './components/contacts/ContactDetailScreen';
import { TransactionsScreen } from './components/transactions/TransactionsScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { ShareSheetModal, PdfReportFormat } from './components/transactions/ShareSheetModal';
import { generateStatementPDF, generateThermalReceiptPDF } from './services/pdfGenerator';
import { calculateContactFinancials } from './services/financials';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    currency: 'AED',
    currencySymbol: 'AED',
    userName: 'Personal Ledger',
    hasSeenWelcome: true,
  });

  // Navigation & Modal states
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [addTransactionType, setAddTransactionType] = useState<TransactionType>('RECEIVE');
  const [addTransactionContact, setAddTransactionContact] = useState<Contact | null>(null);
  const [isStandaloneAddContactOpen, setIsStandaloneAddContactOpen] = useState(false);

  // Share modal state for contacts screen
  const [shareModalData, setShareModalData] = useState<{
    contact: Contact;
    blob: Blob | null;
    fileName: string;
  } | null>(null);

  // In-app toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 3200);
  };

  // Load data from persistent storage
  const loadData = useCallback(async () => {
    try {
      await StorageService.init();
      const [storedContacts, storedTransactions, storedPayments, storedSettings] =
        await Promise.all([
          StorageService.getContacts(),
          StorageService.getTransactions(),
          StorageService.getPayments(),
          StorageService.getSettings(),
        ]);

      setContacts(storedContacts);
      setTransactions(storedTransactions);
      setPayments(storedPayments);
      setSettings(storedSettings);

      // Keep selectedContact up to date if currently open
      if (selectedContact) {
        const updated = storedContacts.find((c) => c.id === selectedContact.id);
        if (updated) setSelectedContact(updated);
      }
    } catch (e) {
      console.error('Failed to load storage data', e);
    }
  }, [selectedContact]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler: Add new contact
  const handleAddNewContact = async (name: string, phone: string): Promise<Contact> => {
    const avatarGradients = [
      'from-emerald-500 to-teal-700',
      'from-amber-500 to-orange-700',
      'from-blue-500 to-indigo-700',
      'from-rose-500 to-red-700',
      'from-purple-500 to-pink-700',
      'from-cyan-500 to-blue-700',
    ];
    const randomGradient = avatarGradients[Math.floor(Math.random() * avatarGradients.length)];

    const newContact: Contact = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name,
      phone,
      createdAt: new Date().toISOString(),
      avatarColor: randomGradient,
    };

    await StorageService.addOrUpdateContact(newContact);
    await loadData();
    showToast(`Added contact ${name}`);
    return newContact;
  };

  // Handler: Save Transaction (Money to Receive or Money to Pay)
  const handleSaveTransaction = async (data: {
    contactId: string;
    type: TransactionType;
    originalAmount: number;
    description: string;
    date: string;
  }) => {
    const newTransaction: Transaction = {
      id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      contactId: data.contactId,
      type: data.type,
      originalAmount: data.originalAmount,
      description: data.description,
      date: data.date,
      createdAt: new Date().toISOString(),
    };

    await StorageService.addTransaction(newTransaction);
    await loadData();
    showToast(
      data.type === 'RECEIVE'
        ? `Added ${settings.currency} ${data.originalAmount.toFixed(2)} to receive`
        : `Added ${settings.currency} ${data.originalAmount.toFixed(2)} to pay`
    );
  };

  // Handler: Save Payment (Receive Payment or Make Payment)
  const handleSavePayment = async (data: {
    contactId: string;
    type: PaymentType;
    amount: number;
    description: string;
    date: string;
  }) => {
    const newPayment: Payment = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      contactId: data.contactId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date,
      createdAt: new Date().toISOString(),
    };

    await StorageService.addPayment(newPayment);
    await loadData();
    showToast(
      data.type === 'PAYMENT_RECEIVED'
        ? `Payment of ${settings.currency} ${data.amount.toFixed(2)} received`
        : `Payment of ${settings.currency} ${data.amount.toFixed(2)} recorded`
    );
  };

  // Handler: Delete Transaction
  const handleDeleteTransaction = async (transactionId: string) => {
    await StorageService.deleteTransaction(transactionId);
    await loadData();
    showToast('Transaction removed');
  };

  // Handler: Delete Payment
  const handleDeletePayment = async (paymentId: string) => {
    await StorageService.deletePayment(paymentId);
    await loadData();
    showToast('Payment record removed');
  };

  // Handler: Delete Contact & All associated records
  const handleDeleteContact = async (contactId: string) => {
    await StorageService.deleteContact(contactId);
    setSelectedContact(null);
    await loadData();
    showToast('Contact and account deleted');
  };

  // Handler: Update Contact (Rule 31)
  const handleUpdateContact = async (updatedContact: Contact) => {
    await StorageService.addOrUpdateContact(updatedContact);
    setSelectedContact(updatedContact);
    await loadData();
    showToast('Contact updated successfully');
  };

  // Handler: Update Transaction (Rule 31)
  const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
    await StorageService.updateTransaction(updatedTransaction);
    await loadData();
    showToast('Transaction updated');
  };

  // Handler: Update Payment
  const handleUpdatePayment = async (updatedPayment: Payment) => {
    await StorageService.updatePayment(updatedPayment);
    await loadData();
    showToast('Payment record updated');
  };

  // Handler: Open Quick Action
  const handleSelectQuickActionType = (type: TransactionType) => {
    setAddTransactionType(type);
    setAddTransactionContact(null);
    setIsAddTransactionOpen(true);
  };

  // Handler: Add more transaction to an existing contact
  const handleOpenAddMoreToContact = (contact: Contact, type: TransactionType) => {
    setAddTransactionType(type);
    setAddTransactionContact(contact);
    setIsAddTransactionOpen(true);
  };

  // Handler: Open Share Modal from Contacts Screen
  const handleOpenShareModalFromList = async (contact: Contact) => {
    const financials = calculateContactFinancials(contact, transactions, payments);
    const generated = await generateStatementPDF(
      contact,
      financials,
      transactions,
      payments,
      settings.currency
    );
    setShareModalData({
      contact,
      blob: generated.blob,
      fileName: generated.fileName,
    });
  };

  // Calculate unread/pending badges for bottom navigation
  const outstandingCount = contacts.filter((c) => {
    const stats = calculateContactFinancials(c, transactions, payments);
    return stats.hasOutstanding;
  }).length;

  return (
    <>
      {/* Short Startup Splash Animation (Rule 36) */}
      {isLoading && (
        <LoadingSplash onFinish={() => setIsLoading(false)} durationMs={900} />
      )}

      {/* Main Responsive App Container */}
      <div className="min-h-screen bg-slate-100/80 text-slate-900 flex justify-center">
        {/* Mobile Viewport Wrapper */}
        <div className="w-full max-w-md min-h-screen bg-[#F8FAFC] flex flex-col relative border-x border-slate-200/80 shadow-xl">
          {/* Header */}
          <Header
            title={selectedContact ? selectedContact.name : 'ALARMENS BALANCE'}
            subtitle={
              selectedContact
                ? 'Account Statement & Timeline'
                : 'Personal Money Manager'
            }
          />

          {/* Toast Notification */}
          {toast && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4 animate-in slide-in-from-top-4 duration-200">
              <div
                className={`py-2.5 px-4 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border ${
                  toast.type === 'success'
                    ? 'bg-slate-900 border-slate-800 text-emerald-300 shadow-slate-900/10'
                    : 'bg-slate-900 border-rose-900/50 text-rose-300 shadow-slate-900/10'
                }`}
              >
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{toast.message}</span>
              </div>
            </div>
          )}

          {/* Active Screen Content */}
          <main className="flex-1 px-4 pt-4 pb-20 overflow-y-auto">
            {selectedContact ? (
              /* Dedicated Individual Contact Details Screen */
              <ContactDetailScreen
                contact={selectedContact}
                transactions={transactions}
                payments={payments}
                settings={settings}
                onBack={() => setSelectedContact(null)}
                onAddPayment={handleSavePayment}
                onDeleteTransaction={handleDeleteTransaction}
                onDeletePayment={handleDeletePayment}
                onDeleteContact={handleDeleteContact}
                onUpdateContact={handleUpdateContact}
                onUpdateTransaction={handleUpdateTransaction}
                onUpdatePayment={handleUpdatePayment}
                onOpenAddMoreTransaction={handleOpenAddMoreToContact}
              />
            ) : (
              <>
                {activeTab === 'home' && (
                  <DashboardScreen
                    contacts={contacts}
                    transactions={transactions}
                    payments={payments}
                    settings={settings}
                    onOpenContact={(contact) => setSelectedContact(contact)}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onOpenAddTransaction={() => setIsQuickActionOpen(true)}
                  />
                )}

                {activeTab === 'contacts' && (
                  <ContactsScreen
                    contacts={contacts}
                    transactions={transactions}
                    payments={payments}
                    settings={settings}
                    onOpenContact={(contact) => setSelectedContact(contact)}
                    onOpenShareModal={handleOpenShareModalFromList}
                    onOpenAddContact={() => setIsStandaloneAddContactOpen(true)}
                  />
                )}

                {activeTab === 'transactions' && (
                  <TransactionsScreen
                    contacts={contacts}
                    transactions={transactions}
                    payments={payments}
                    settings={settings}
                    onOpenContact={(contact) => setSelectedContact(contact)}
                    onOpenAddTransaction={() => setIsQuickActionOpen(true)}
                  />
                )}

                {activeTab === 'reports' && (
                  <ReportsScreen
                    contacts={contacts}
                    transactions={transactions}
                    payments={payments}
                    settings={settings}
                    onOpenContact={(contact) => setSelectedContact(contact)}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsScreen
                    settings={settings}
                    onUpdateSettings={async (newSettings) => {
                      await StorageService.saveSettings(newSettings);
                      setSettings(newSettings);
                      showToast('Preferences updated');
                    }}
                    onRefreshData={loadData}
                  />
                )}
              </>
            )}
          </main>

          {/* Fixed Floating Action Button (FAB) near bottom-right */}
          {!selectedContact && (
            <FloatingActionButton
              onClick={() => setIsQuickActionOpen(true)}
              ariaLabel="Create Transaction"
            />
          )}

          {/* Fixed Bottom Navigation Bar */}
          {!selectedContact && (
            <BottomNav
              activeTab={activeTab}
              onChangeTab={(tab) => {
                setSelectedContact(null);
                setActiveTab(tab);
              }}
              contactsBadge={outstandingCount}
            />
          )}
        </div>
      </div>

      {/* Quick Action Sheet (Money to Receive / Money to Pay) */}
      <QuickActionSheet
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSelectType={handleSelectQuickActionType}
      />

      {/* Add Transaction Form Bottom Sheet */}
      <AddTransactionSheet
        isOpen={isAddTransactionOpen}
        onClose={() => {
          setIsAddTransactionOpen(false);
          setAddTransactionContact(null);
        }}
        type={addTransactionType}
        currency={settings.currency}
        contacts={contacts}
        preselectedContact={addTransactionContact}
        onSave={handleSaveTransaction}
        onAddNewContact={handleAddNewContact}
      />

      {/* Standalone Contact Creation Modal (from Contacts screen) */}
      <ContactPickerModal
        isOpen={isStandaloneAddContactOpen}
        onClose={() => setIsStandaloneAddContactOpen(false)}
        contacts={contacts}
        onSelectContact={(contact) => {
          setIsStandaloneAddContactOpen(false);
          setSelectedContact(contact);
        }}
        onAddNewContact={handleAddNewContact}
      />

      {/* Direct Share Modal when tapped from Contacts screen */}
      {shareModalData && (
        <ShareSheetModal
          isOpen={true}
          onClose={() => setShareModalData(null)}
          contact={shareModalData.contact}
          financials={calculateContactFinancials(
            shareModalData.contact,
            transactions,
            payments
          )}
          currency={settings.currency}
          pdfBlob={shareModalData.blob}
          fileName={shareModalData.fileName}
          onRegeneratePdf={async (format: PdfReportFormat = 'statement') => {
            const financials = calculateContactFinancials(
              shareModalData.contact,
              transactions,
              payments
            );
            const gen =
              format === 'thermal'
                ? await generateThermalReceiptPDF(
                    shareModalData.contact,
                    financials,
                    transactions,
                    payments,
                    settings.currency
                  )
                : await generateStatementPDF(
                    shareModalData.contact,
                    financials,
                    transactions,
                    payments,
                    settings.currency
                  );
            return { blob: gen.blob, fileName: gen.fileName };
          }}
        />
      )}
    </>
  );
}
