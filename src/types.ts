export type TransactionType = 'gave' | 'got'; // gave = میں نے دیا (Debit), got = میں نے لیا (Credit)

export interface Transaction {
  id: string;
  userId?: string;
  customerId: string;
  type: TransactionType;
  itemName: string;
  amount: number;
  date: string; // ISO string YYYY-MM-DD
  time: string; // HH:mm
  timestamp: number; // unix ms
  note?: string;
  receiptNo?: string;
  runningBalance?: number;
}

export type ReminderFrequency = 'none' | 'weekly' | 'biweekly' | 'monthly';

export interface CustomerReminder {
  enabled: boolean;
  frequency: ReminderFrequency; // weekly, biweekly, monthly
  amount?: number; // target amount or balance
  startDate: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  lastNotifiedDate?: string; // YYYY-MM-DD
  customNote?: string;
}

export interface Customer {
  id: string;
  userId?: string;
  name: string;
  phone?: string;
  city?: string;
  notes?: string;
  createdAt: number;
  reminder?: CustomerReminder;
}

export type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'custom' | 'last7days' | 'last30days';

export interface AppSettings {
  shopName: string;
  ownerName: string;
  shopPhone: string;
  shopAddress: string;
  currency: string;
  soundEnabled: boolean;
  language: 'en' | 'ur';
  lockEnabled?: boolean;
  passcode?: string;
  biometricEnabled?: boolean;
  autoLockOnExit?: boolean;
}
