import { AppSettings, Customer, Transaction } from '../types';
import { getCurrentTimeString, getTodayDateString } from './date';

const STORAGE_KEYS = {
  TRANSACTIONS: 'dk_transactions_v1',
  CUSTOMERS: 'dk_customers_v1',
  SETTINGS: 'dk_settings_v1',
  ACTIVE_CUSTOMER: 'dk_active_customer_id',
};

const DEFAULT_SETTINGS: AppSettings = {
  shopName: 'Bismillah General Store',
  ownerName: 'Muhammad Usman',
  shopPhone: '+92 300 1234567',
  shopAddress: 'Main Bazaar',
  currency: 'Rs.',
  soundEnabled: true,
  language: 'en',
  lockEnabled: false,
  passcode: '',
  biometricEnabled: false,
  autoLockOnExit: true,
};

const today = getTodayDateString();
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'احمد علی (Ahmad Ali)',
    phone: '0301-4455667',
    city: 'لاہور',
    notes: 'باقاعدہ گاہک - کریڈٹ لمٹ 50,000',
    createdAt: Date.now() - 86400000 * 10,
    reminder: {
      enabled: true,
      frequency: 'weekly',
      startDate: yesterday,
      nextDueDate: today,
      amount: 1500,
      customNote: 'ہفتہ وار ادھار کی قسط',
    },
  },
  {
    id: 'cust-2',
    name: 'بلال برادرز ٹریڈرز (Bilal Traders)',
    phone: '0322-8899112',
    city: 'فیصل آباد',
    notes: 'ہول سیل سپلائر',
    createdAt: Date.now() - 86400000 * 5,
    reminder: {
      enabled: true,
      frequency: 'monthly',
      startDate: yesterday,
      nextDueDate: today,
      amount: 4500,
      customNote: 'ماہانہ کھاتہ ادائیگی',
    },
  },
  {
    id: 'cust-3',
    name: 'حاجی رشید کریانہ (Rashid Store)',
    phone: '0345-9988776',
    city: 'گوجرانوالہ',
    notes: 'ہفتہ وار حساب',
    createdAt: Date.now() - 86400000 * 2,
  },
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn-1',
    customerId: 'cust-1',
    type: 'gave',
    itemName: 'آٹا 20 کلو تھیلا (Flour 20kg)',
    amount: 2850,
    date: yesterday,
    time: '11:15',
    timestamp: Date.now() - 86400000 + 1000,
    note: 'بل نمبر #1042',
    receiptNo: 'REC-001',
  },
  {
    id: 'txn-2',
    customerId: 'cust-1',
    type: 'gave',
    itemName: 'کوکنگ آئل 5 لیٹر اور چینی 5 کلو',
    amount: 3200,
    date: yesterday,
    time: '11:20',
    timestamp: Date.now() - 86400000 + 2000,
    note: 'گھر کا راشن',
    receiptNo: 'REC-002',
  },
  {
    id: 'txn-3',
    customerId: 'cust-1',
    type: 'got',
    itemName: 'نقد رقم وصولی (Cash Payment)',
    amount: 4000,
    date: today,
    time: '10:30',
    timestamp: Date.now() - 3600000 * 2,
    note: 'جاز کیش کے ذریعے ادائیگی موصول ہوئی',
    receiptNo: 'REC-003',
  },
  {
    id: 'txn-4',
    customerId: 'cust-1',
    type: 'gave',
    itemName: 'سیل فون ریچارج اور چائے پتی',
    amount: 1150,
    date: today,
    time: getCurrentTimeString(),
    timestamp: Date.now(),
    note: 'موبائل کارڈ + لپٹن 500 گرام',
    receiptNo: 'REC-004',
  },
  {
    id: 'txn-5',
    customerId: 'cust-2',
    type: 'gave',
    itemName: 'چاول کرنل باسمتی 50 کلو',
    amount: 14500,
    date: yesterday,
    time: '16:45',
    timestamp: Date.now() - 86400000 + 5000,
    note: 'ڈلیوری موصول ہو گئی',
    receiptNo: 'REC-005',
  },
  {
    id: 'txn-6',
    customerId: 'cust-2',
    type: 'got',
    itemName: 'آن لائن بینک ٹرانسفر (HBL)',
    amount: 10000,
    date: today,
    time: '09:00',
    timestamp: Date.now() - 3600000 * 4,
    note: 'بینک رسید #4492',
    receiptNo: 'REC-006',
  },
];

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function loadCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_CUSTOMERS;
}

export function saveCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch {
    // ignore
  }
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_TRANSACTIONS;
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch {
    // ignore
  }
}

export function loadActiveCustomerId(customers: Customer[]): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_CUSTOMER);
    if (raw && customers.some(c => c.id === raw)) {
      return raw;
    }
  } catch {
    // fallback
  }
  return customers[0]?.id || '';
}

export function saveActiveCustomerId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CUSTOMER, id);
  } catch {
    // ignore
  }
}

export interface BackupData {
  app: string;
  version: string;
  exportDate: string;
  deviceInfo?: string;
  stats: {
    totalCustomers: number;
    totalTransactions: number;
    currency: string;
  };
  settings: AppSettings;
  customers: Customer[];
  transactions: Transaction[];
}

export function generateBackupJSON(
  settings: AppSettings,
  customers: Customer[],
  transactions: Transaction[]
): string {
  const data: BackupData = {
    app: 'Digital Khata',
    version: '2.0',
    exportDate: new Date().toISOString(),
    deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser',
    stats: {
      totalCustomers: customers.length,
      totalTransactions: transactions.length,
      currency: settings.currency || 'Rs.',
    },
    settings,
    customers,
    transactions,
  };
  return JSON.stringify(data, null, 2);
}

export function exportBackupJSON(): string {
  return generateBackupJSON(loadSettings(), loadCustomers(), loadTransactions());
}

export function validateBackupJSON(jsonStr: string): {
  valid: boolean;
  error?: string;
  data?: BackupData;
} {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'The file is not a valid JSON document.' };
    }

    // Check if at least customers or transactions exist
    const hasCustomers = Array.isArray(parsed.customers);
    const hasTransactions = Array.isArray(parsed.transactions);

    if (!hasCustomers && !hasTransactions) {
      return {
        valid: false,
        error: 'Unrecognized file format. No customers or transactions found.',
      };
    }

    const customers: Customer[] = (parsed.customers || []).filter(
      (c: any) => c && typeof c === 'object' && typeof c.id === 'string' && typeof c.name === 'string'
    );

    const transactions: Transaction[] = (parsed.transactions || []).filter(
      (t: any) =>
        t &&
        typeof t === 'object' &&
        typeof t.id === 'string' &&
        typeof t.customerId === 'string' &&
        (t.type === 'gave' || t.type === 'got')
    );

    const settings: AppSettings = {
      ...loadSettings(),
      ...(parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {}),
    };

    const validData: BackupData = {
      app: parsed.app || 'Digital Khata',
      version: parsed.version || '1.0',
      exportDate: parsed.exportDate || new Date().toISOString(),
      stats: {
        totalCustomers: customers.length,
        totalTransactions: transactions.length,
        currency: settings.currency || 'Rs.',
      },
      settings,
      customers,
      transactions,
    };

    return { valid: true, data: validData };
  } catch (err: unknown) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Invalid JSON file.',
    };
  }
}

export function importBackupJSON(jsonStr: string): boolean {
  const result = validateBackupJSON(jsonStr);
  if (!result.valid || !result.data) {
    return false;
  }
  const { customers, transactions, settings } = result.data;
  saveCustomers(customers);
  saveTransactions(transactions);
  saveSettings(settings);
  return true;
}
