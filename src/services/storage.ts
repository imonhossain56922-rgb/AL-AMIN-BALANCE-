import { Contact, Transaction, Payment, AppSettings, BackupData } from '../types';

const DB_NAME = 'alarmens_balance_db';
const DB_VERSION = 1;

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'AED',
  currencySymbol: 'AED',
  userName: 'ALARMENS BALANCE',
  hasSeenWelcome: true,
  theme: 'light',
};

// Initial sample data representing a realistic starting point with requested contacts
export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c_rahim',
    name: 'Rahim Ahmed',
    phone: '+971 50 123 4567',
    createdAt: '2026-10-01T08:00:00.000Z',
    avatarColor: 'from-[#FF9F1C] to-[#E07A00]',
    notes: 'Colleague & Friend'
  },
  {
    id: 'c_karim',
    name: 'Karim Ahmed',
    phone: '+971 52 987 6543',
    createdAt: '2026-10-01T09:30:00.000Z',
    avatarColor: 'from-[#FFB52E] to-[#B37400]',
    notes: 'Graphic Design Partner'
  },
  {
    id: 'c_hasan',
    name: 'Hasan Ahmed',
    phone: '+971 55 456 7890',
    createdAt: '2026-10-01T11:15:00.000Z',
    avatarColor: 'from-amber-600 to-yellow-800',
    notes: 'Office Maintenance'
  },
  {
    id: 'c_ahmed',
    name: 'Ahmed Ali',
    phone: '+971 56 333 4455',
    createdAt: '2026-10-01T14:00:00.000Z',
    avatarColor: 'from-orange-500 to-amber-700',
    notes: 'Project Consultant'
  },
  {
    id: 'c_sami',
    name: 'Sami Khan',
    phone: '+971 58 777 8899',
    createdAt: '2026-10-01T16:20:00.000Z',
    avatarColor: 'from-[#FFD166] to-[#C79100]',
    notes: 'Personal Loan'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't_1',
    contactId: 'c_rahim',
    type: 'RECEIVE',
    originalAmount: 100,
    description: 'Borrowed money for grocery shopping',
    date: '2026-10-02',
    createdAt: '2026-10-02T08:15:00.000Z'
  },
  {
    id: 't_2',
    contactId: 'c_karim',
    type: 'PAY',
    originalAmount: 50,
    description: 'Graphic design payment',
    date: '2026-10-01',
    createdAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 't_3',
    contactId: 'c_hasan',
    type: 'RECEIVE',
    originalAmount: 150,
    description: 'Office air conditioner maintenance fee advance',
    date: '2026-09-28',
    createdAt: '2026-09-28T11:30:00.000Z'
  },
  {
    id: 't_4',
    contactId: 'c_ahmed',
    type: 'RECEIVE',
    originalAmount: 200,
    description: 'Personal loan for weekend trip',
    date: '2026-09-30',
    createdAt: '2026-09-30T15:00:00.000Z'
  },
  {
    id: 't_5',
    contactId: 'c_sami',
    type: 'PAY',
    originalAmount: 80,
    description: 'Dinner split and transportation',
    date: '2026-10-01',
    createdAt: '2026-10-01T19:00:00.000Z'
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'p_1',
    contactId: 'c_rahim',
    transactionId: 't_1',
    type: 'PAYMENT_RECEIVED',
    amount: 50,
    description: 'Partial payment via cash',
    date: '2026-10-02',
    createdAt: '2026-10-02T09:00:00.000Z'
  },
  {
    id: 'p_2',
    contactId: 'c_hasan',
    transactionId: 't_3',
    type: 'PAYMENT_RECEIVED',
    amount: 150,
    description: 'Complete settlement received',
    date: '2026-10-01',
    createdAt: '2026-10-01T12:00:00.000Z'
  }
];

// Open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('contacts')) {
        db.createObjectStore('contacts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('payments')) {
        db.createObjectStore('payments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// LocalStorage mirror for reliability
const LS_PREFIX = 'alarmens_balance_';
const LEGACY_PREFIXES = ['alamin_balance_', 'hisab_app_'];

function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    let item = localStorage.getItem(LS_PREFIX + key);
    if (!item) {
      for (const legacy of LEGACY_PREFIXES) {
        const legacyVal = localStorage.getItem(legacy + key);
        if (legacyVal) {
          item = legacyVal;
          // Migrate forward
          localStorage.setItem(LS_PREFIX + key, legacyVal);
          break;
        }
      }
    }
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
}

export const StorageService = {
  async init(): Promise<void> {
    const initialized = localStorage.getItem(LS_PREFIX + 'initialized');
    if (!initialized) {
      // First run: seed initial realistic sample data
      await this.saveContacts(INITIAL_CONTACTS);
      await this.saveTransactions(INITIAL_TRANSACTIONS);
      await this.savePayments(INITIAL_PAYMENTS);
      await this.saveSettings(DEFAULT_SETTINGS);
      localStorage.setItem(LS_PREFIX + 'initialized', 'true');
    }
  },

  async getContacts(): Promise<Contact[]> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('contacts', 'readonly');
        const store = tx.objectStore('contacts');
        const req = store.getAll();
        req.onsuccess = () => {
          if (req.result && req.result.length > 0) {
            resolve(req.result);
          } else {
            resolve(getLocalStorage<Contact[]>('contacts', INITIAL_CONTACTS));
          }
        };
        req.onerror = () => resolve(getLocalStorage<Contact[]>('contacts', INITIAL_CONTACTS));
      });
    } catch {
      return getLocalStorage<Contact[]>('contacts', INITIAL_CONTACTS);
    }
  },

  async saveContacts(contacts: Contact[]): Promise<void> {
    setLocalStorage('contacts', contacts);
    try {
      const db = await openDB();
      const tx = db.transaction('contacts', 'readwrite');
      const store = tx.objectStore('contacts');
      store.clear();
      for (const contact of contacts) {
        store.put(contact);
      }
    } catch (e) {
      console.warn('IDB write fallback to LS', e);
    }
  },

  async addOrUpdateContact(contact: Contact): Promise<void> {
    const contacts = await this.getContacts();
    const index = contacts.findIndex((c) => c.id === contact.id);
    if (index >= 0) {
      contacts[index] = contact;
    } else {
      contacts.unshift(contact);
    }
    await this.saveContacts(contacts);
  },

  async deleteContact(contactId: string): Promise<void> {
    const contacts = (await this.getContacts()).filter((c) => c.id !== contactId);
    await this.saveContacts(contacts);

    // Also delete associated transactions and payments
    const transactions = (await this.getTransactions()).filter((t) => t.contactId !== contactId);
    await this.saveTransactions(transactions);

    const payments = (await this.getPayments()).filter((p) => p.contactId !== contactId);
    await this.savePayments(payments);
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        const req = store.getAll();
        req.onsuccess = () => {
          if (req.result && req.result.length > 0) {
            resolve(req.result);
          } else {
            resolve(getLocalStorage<Transaction[]>('transactions', INITIAL_TRANSACTIONS));
          }
        };
        req.onerror = () => resolve(getLocalStorage<Transaction[]>('transactions', INITIAL_TRANSACTIONS));
      });
    } catch {
      return getLocalStorage<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
    }
  },

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    setLocalStorage('transactions', transactions);
    try {
      const db = await openDB();
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
      store.clear();
      for (const t of transactions) {
        store.put(t);
      }
    } catch (e) {
      console.warn('IDB write fallback to LS', e);
    }
  },

  async addTransaction(transaction: Transaction): Promise<void> {
    const transactions = await this.getTransactions();
    transactions.unshift(transaction);
    await this.saveTransactions(transactions);
  },

  async updateTransaction(transaction: Transaction): Promise<void> {
    const transactions = await this.getTransactions();
    const index = transactions.findIndex((t) => t.id === transaction.id);
    if (index >= 0) {
      transactions[index] = transaction;
      await this.saveTransactions(transactions);
    }
  },

  async deleteTransaction(transactionId: string): Promise<void> {
    const transactions = (await this.getTransactions()).filter((t) => t.id !== transactionId);
    await this.saveTransactions(transactions);
  },

  async getPayments(): Promise<Payment[]> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('payments', 'readonly');
        const store = tx.objectStore('payments');
        const req = store.getAll();
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result);
          } else {
            resolve(getLocalStorage<Payment[]>('payments', INITIAL_PAYMENTS));
          }
        };
        req.onerror = () => resolve(getLocalStorage<Payment[]>('payments', INITIAL_PAYMENTS));
      });
    } catch {
      return getLocalStorage<Payment[]>('payments', INITIAL_PAYMENTS);
    }
  },

  async savePayments(payments: Payment[]): Promise<void> {
    setLocalStorage('payments', payments);
    try {
      const db = await openDB();
      const tx = db.transaction('payments', 'readwrite');
      const store = tx.objectStore('payments');
      store.clear();
      for (const p of payments) {
        store.put(p);
      }
    } catch (e) {
      console.warn('IDB write fallback to LS', e);
    }
  },

  async addPayment(payment: Payment): Promise<void> {
    const payments = await this.getPayments();
    payments.unshift(payment);
    await this.savePayments(payments);
  },

  async updatePayment(payment: Payment): Promise<void> {
    const payments = await this.getPayments();
    const index = payments.findIndex((p) => p.id === payment.id);
    if (index >= 0) {
      payments[index] = payment;
      await this.savePayments(payments);
    }
  },

  async deletePayment(paymentId: string): Promise<void> {
    const payments = (await this.getPayments()).filter((p) => p.id !== paymentId);
    await this.savePayments(payments);
  },

  async getSettings(): Promise<AppSettings> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const req = store.get('app_settings');
        req.onsuccess = () => {
          if (req.result && req.result.value) {
            resolve(req.result.value);
          } else {
            resolve(getLocalStorage<AppSettings>('settings', DEFAULT_SETTINGS));
          }
        };
        req.onerror = () => resolve(getLocalStorage<AppSettings>('settings', DEFAULT_SETTINGS));
      });
    } catch {
      return getLocalStorage<AppSettings>('settings', DEFAULT_SETTINGS);
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    setLocalStorage('settings', settings);
    try {
      const db = await openDB();
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      store.put({ key: 'app_settings', value: settings });
    } catch (e) {
      console.warn('IDB write fallback to LS', e);
    }
  },

  async exportBackup(): Promise<string> {
    const contacts = await this.getContacts();
    const transactions = await this.getTransactions();
    const payments = await this.getPayments();
    const settings = await this.getSettings();

    const backup: BackupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      contacts,
      transactions,
      payments,
      settings,
    };

    return JSON.stringify(backup, null, 2);
  },

  async importBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(jsonString) as BackupData;
      if (!data || !Array.isArray(data.contacts) || !Array.isArray(data.transactions)) {
        return { success: false, message: 'Invalid backup file structure' };
      }
      await this.saveContacts(data.contacts);
      await this.saveTransactions(data.transactions);
      await this.savePayments(data.payments || []);
      if (data.settings) {
        await this.saveSettings(data.settings);
      }
      return { success: true, message: 'Data restored successfully' };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, message: 'JSON parse error: ' + errorMessage };
    }
  },

  async resetToDemoData(): Promise<void> {
    await this.saveContacts(INITIAL_CONTACTS);
    await this.saveTransactions(INITIAL_TRANSACTIONS);
    await this.savePayments(INITIAL_PAYMENTS);
    await this.saveSettings(DEFAULT_SETTINGS);
  },

  async clearAllData(): Promise<void> {
    await this.saveContacts([]);
    await this.saveTransactions([]);
    await this.savePayments([]);
  }
};
