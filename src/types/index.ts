export type TransactionType = 'RECEIVE' | 'PAY';
export type PaymentType = 'PAYMENT_RECEIVED' | 'PAYMENT_MADE';
export type AccountStatus = 'UNPAID' | 'PARTIALLY PAID' | 'PAID';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  avatarColor?: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  contactId: string;
  type: TransactionType; // 'RECEIVE' (Money to Receive) or 'PAY' (Money to Pay)
  originalAmount: number; // NEVER overwritten
  description: string; // e.g. "Borrowed money for grocery shopping"
  date: string; // "YYYY-MM-DD"
  createdAt: string;
}

export interface Payment {
  id: string;
  contactId: string;
  transactionId?: string; // Optional: can link to specific transaction or general contact account
  type: PaymentType; // 'PAYMENT_RECEIVED' (for RECEIVE) | 'PAYMENT_MADE' (for PAY)
  amount: number;
  description: string; // e.g. "Partial payment"
  date: string; // "YYYY-MM-DD"
  createdAt: string;
}

export interface ContactFinancials {
  contact: Contact;
  // Receivable stats
  receiveTotal: number;
  receivedTotal: number;
  receiveRemaining: number;
  receiveStatus: AccountStatus | 'NONE';

  // Payable stats
  payTotal: number;
  paidTotal: number;
  payRemaining: number;
  payStatus: AccountStatus | 'NONE';

  // Combined overview
  netRemaining: number; // receiveRemaining - payRemaining
  hasOutstanding: boolean;
  primaryType: TransactionType;
}

export interface AppSettings {
  currency: string;
  currencySymbol: string;
  userName: string;
  hasSeenWelcome: boolean;
  theme?: 'light' | 'dark';
}

export interface BackupData {
  version: number;
  exportDate: string;
  contacts: Contact[];
  transactions: Transaction[];
  payments: Payment[];
  settings: AppSettings;
}

export type ActiveTab = 'home' | 'contacts' | 'transactions' | 'reports' | 'settings';
