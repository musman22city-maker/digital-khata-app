/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, testConnection } from './firebase';
import {
  loadSettings,
  saveSettings,
  loadCustomers,
  saveCustomers,
  loadTransactions,
  saveTransactions,
  loadActiveCustomerId,
  saveActiveCustomerId,
  BackupData,
} from './utils/storage';
import { AppSettings, Customer, CustomerReminder, PeriodFilter, Transaction, TransactionType } from './types';
import { Header } from './components/Header';
import { GoogleAuthBanner } from './components/GoogleAuthBanner';
import { GoogleAccountModal } from './components/GoogleAccountModal';
import { SummaryCard } from './components/SummaryCard';
import { TransactionList } from './components/TransactionList';
import { AddTransactionModal } from './components/AddTransactionModal';
import { CustomerModal } from './components/CustomerModal';
import { CustomersListModal } from './components/CustomersListModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ExportModal } from './components/ExportModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { SettingsModal } from './components/SettingsModal';
import { InstallAppModal } from './components/InstallAppModal';
import { ReminderModal } from './components/ReminderModal';
import { DueRemindersBanner } from './components/DueRemindersBanner';
import { AutoInstallAlertBanner } from './components/AutoInstallAlertBanner';
import { BottomBar } from './components/BottomBar';
import { LockScreen } from './components/LockScreen';
import { isDateInPeriod, getTodayDateString } from './utils/date';
import { sounds } from './utils/audio';
import { isReminderDue, calculateNextDueDate, sendPushNotification } from './utils/reminders';
import {
  saveCustomerToCloud,
  deleteCustomerFromCloud,
  saveTransactionToCloud,
  deleteTransactionFromCloud,
  deleteCustomerAndAllDataFromCloud,
  subscribeToCustomers,
  subscribeToTransactions,
  uploadInitialDataToCloud,
  syncUserSettingsToCloud,
  CloudSyncState,
} from './services/khataSync';

export default function App() {
  // App State
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [customers, setCustomers] = useState<Customer[]>(loadCustomers);
  const [activeCustomerId, setActiveCustomerId] = useState<string>(() =>
    loadActiveCustomerId(customers)
  );
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);

  // Firebase Auth State & Cloud Sync
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [syncState, setSyncState] = useState<CloudSyncState>({
    status: 'offline',
    lastSyncedAt: null,
    errorMessage: null,
  });

  // Period Filter State
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Mobile Android Container View Toggle
  const [isAndroidView, setIsAndroidView] = useState<boolean>(true);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<TransactionType>('gave');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Security Lock State
  const [isLocked, setIsLocked] = useState<boolean>(() =>
    Boolean(settings.lockEnabled && settings.passcode)
  );

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomersListModalOpen, setIsCustomersListModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [singleReceiptTx, setSingleReceiptTx] = useState<Transaction | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInstallAppModalOpen, setIsInstallAppModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderTargetCustomer, setReminderTargetCustomer] = useState<Customer | null>(null);

  // Store references for upload synchronization
  const customersRef = useRef(customers);
  const transactionsRef = useRef(transactions);
  const settingsRef = useRef(settings);
  customersRef.current = customers;
  transactionsRef.current = transactions;
  settingsRef.current = settings;

  // Test Firestore Connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Firebase Auth & Realtime Sync Subscription
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user) {
        setSyncState({
          status: 'syncing',
          lastSyncedAt: new Date(),
          errorMessage: null,
        });

        // Listen for cloud customers
        const unsubCust = subscribeToCustomers(
          user.uid,
          (cloudCusts) => {
            if (cloudCusts.length > 0) {
              setCustomers(cloudCusts);
            } else {
              // Cloud is empty for this user: automatically backup current local data to user's Google account
              uploadInitialDataToCloud(
                user.uid,
                customersRef.current,
                transactionsRef.current,
                settingsRef.current
              );
            }
            setSyncState((prev) => ({
              ...prev,
              status: 'synced',
              lastSyncedAt: new Date(),
            }));
          },
          (err) => {
            console.error('Customer sync error:', err);
            setSyncState((prev) => ({
              ...prev,
              status: 'error',
              errorMessage: 'Could not sync customers with Google account',
            }));
          }
        );

        // Listen for cloud transactions
        const unsubTx = subscribeToTransactions(
          user.uid,
          (cloudTxs) => {
            if (cloudTxs.length > 0) {
              setTransactions(cloudTxs);
            }
            setSyncState((prev) => ({
              ...prev,
              status: 'synced',
              lastSyncedAt: new Date(),
            }));
          },
          (err) => {
            console.error('Transactions sync error:', err);
          }
        );

        return () => {
          unsubCust();
          unsubTx();
        };
      } else {
        setSyncState({
          status: 'offline',
          lastSyncedAt: null,
          errorMessage: null,
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Synchronize document direction & language
  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'ur' ? 'rtl' : 'ltr';
  }, [settings.language]);

  // Synchronize localStorage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveActiveCustomerId(activeCustomerId);
  }, [activeCustomerId]);

  // Auto-lock when user backgrounds/minimizes the app if lock is enabled
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && settings.lockEnabled && settings.passcode) {
        setIsLocked(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [settings.lockEnabled, settings.passcode]);

  // List of customers whose recurring payment reminder is due
  const dueCustomers = customers.filter((c) => isReminderDue(c.reminder));

  // Check and trigger push notification and audio chime when due reminders exist
  const notifiedRemindersRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (dueCustomers.length > 0) {
      const today = getTodayDateString();
      const unnotified = dueCustomers.filter(
        (c) => !notifiedRemindersRef.current.has(`${c.id}_${c.reminder?.nextDueDate || today}`)
      );

      if (unnotified.length > 0) {
        // Play reminder chime
        sounds.playReminder(settings.soundEnabled);

        // Send Push Notification if browser permission is granted
        const names = unnotified.map((c) => c.name).join(', ');
        const isUrdu = settings.language === 'ur';
        const title = isUrdu ? '⚠️ ڈیجیٹل کھاتہ: ادائیگی یاد دہانی!' : '⚠️ Digital Khata: Payment Due Reminder!';
        const body = isUrdu
          ? `${names} کے کھاتے کی مقررہ تاریخ آ گئی ہے۔`
          : `Payment due date arrived for ${names}.`;

        sendPushNotification(title, {
          body,
          tag: 'payment-due-reminder',
        });

        // Mark as notified for today
        unnotified.forEach((c) => {
          notifiedRemindersRef.current.add(`${c.id}_${c.reminder?.nextDueDate || today}`);
        });
      }
    }
  }, [dueCustomers, settings.soundEnabled, settings.language]);

  const activeCustomer =
    customers.find((c) => c.id === activeCustomerId) || customers[0] || null;

  // Filtered transactions for the selected customer & period
  const customerTransactions = transactions.filter(
    (tx) => tx.customerId === activeCustomer?.id
  );

  const filteredTransactions = customerTransactions.filter((tx) =>
    isDateInPeriod(tx.date, period, customStartDate, customEndDate)
  );

  // Handlers
  const handleToggleSound = () => {
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const handleToggleLanguage = () => {
    setSettings((prev) => {
      const nextLang: 'en' | 'ur' = prev.language === 'en' ? 'ur' : 'en';
      const updated: AppSettings = { ...prev, language: nextLang };
      if (currentUser) {
        syncUserSettingsToCloud(currentUser.uid, updated);
      }
      return updated;
    });
  };

  const handleOpenAddModal = (type: TransactionType = 'gave') => {
    setEditingTx(null);
    setAddModalType(type);
    setIsAddModalOpen(true);
  };

  const handleEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setAddModalType(tx.type);
    setIsAddModalOpen(true);
  };

  const handleDeleteTx = async (id: string) => {
    const isUrdu = settings.language === 'ur';
    if (window.confirm(isUrdu ? 'کیا آپ اس اندراج کو حذف کرنا چاہتے ہیں؟' : 'Delete this entry?')) {
      sounds.playDelete(settings.soundEnabled);
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      if (currentUser) {
        try {
          await deleteTransactionFromCloud(currentUser.uid, id);
        } catch (e) {
          console.error('Delete transaction from cloud error:', e);
        }
      }
    }
  };

  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id' | 'timestamp'> & { id?: string }
  ) => {
    sounds.playSuccess(settings.soundEnabled);

    if (txData.id) {
      // Edit existing
      const updatedList = transactions.map((t) =>
        t.id === txData.id
          ? {
              ...t,
              ...txData,
              userId: currentUser ? currentUser.uid : t.userId,
              timestamp: t.timestamp,
            }
          : t
      );
      setTransactions(updatedList);

      const target = updatedList.find((t) => t.id === txData.id);
      if (currentUser && target) {
        saveTransactionToCloud(currentUser.uid, target);
      }
    } else {
      // Add new
      const newTx: Transaction = {
        ...txData,
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser ? currentUser.uid : undefined,
        timestamp: Date.now(),
      };
      setTransactions((prev) => [newTx, ...prev]);

      if (currentUser) {
        saveTransactionToCloud(currentUser.uid, newTx);
      }
    }
  };

  const handleAddCustomer = async (newCustData: Omit<Customer, 'id' | 'createdAt'>) => {
    sounds.playSuccess(settings.soundEnabled);
    const newCust: Customer = {
      ...newCustData,
      id: `cust_${Date.now()}`,
      userId: currentUser ? currentUser.uid : undefined,
      createdAt: Date.now(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    setActiveCustomerId(newCust.id);

    if (currentUser) {
      saveCustomerToCloud(currentUser.uid, newCust);
    }
  };

  const handleSelectCustomer = (cust: Customer) => {
    setActiveCustomerId(cust.id);
  };

  const handleSaveReminder = async (customerId: string, reminder: CustomerReminder | undefined) => {
    sounds.playSuccess(settings.soundEnabled);
    const updated = customers.map((c) =>
      c.id === customerId ? { ...c, reminder } : c
    );
    setCustomers(updated);
    saveCustomers(updated);

    const target = updated.find((c) => c.id === customerId);
    if (currentUser && target) {
      saveCustomerToCloud(currentUser.uid, target);
    }
  };

  const handleAcknowledgeReminder = async (cust: Customer) => {
    if (!cust.reminder) return;
    sounds.playSuccess(settings.soundEnabled);
    const nextDate = calculateNextDueDate(
      cust.reminder.nextDueDate || getTodayDateString(),
      cust.reminder.frequency
    );
    const updatedReminder: CustomerReminder = {
      ...cust.reminder,
      nextDueDate: nextDate,
      lastNotifiedDate: getTodayDateString(),
    };
    handleSaveReminder(cust.id, updatedReminder);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    if (!newSettings.lockEnabled) {
      setIsLocked(false);
    }
    if (currentUser) {
      syncUserSettingsToCloud(currentUser.uid, newSettings);
    }
  };

  const handleManualSync = async () => {
    if (!currentUser) return;
    await uploadInitialDataToCloud(
      currentUser.uid,
      customers,
      transactions,
      settings
    );
    setSyncState({
      status: 'synced',
      lastSyncedAt: new Date(),
      errorMessage: null,
    });
  };

  const handleRestoreBackup = async (
    backup: BackupData,
    mode: 'replace' | 'merge'
  ) => {
    sounds.playSuccess(settings.soundEnabled);

    let finalSettings = settings;
    let finalCustomers: Customer[] = [];
    let finalTransactions: Transaction[] = [];

    if (mode === 'replace') {
      finalSettings = backup.settings || settings;
      finalCustomers = backup.customers || [];
      finalTransactions = backup.transactions || [];
    } else {
      // Merge mode
      finalSettings = { ...settings, ...(backup.settings || {}) };

      // Deduplicate customers
      const existingCustIds = new Set(customers.map((c) => c.id));
      const newCusts = (backup.customers || []).filter((c) => !existingCustIds.has(c.id));
      finalCustomers = [...customers, ...newCusts];

      // Deduplicate transactions
      const existingTxIds = new Set(transactions.map((t) => t.id));
      const newTxs = (backup.transactions || []).filter((t) => !existingTxIds.has(t.id));
      finalTransactions = [...transactions, ...newTxs];
    }

    // Update state
    setSettings(finalSettings);
    setCustomers(finalCustomers);
    setTransactions(finalTransactions);

    if (finalCustomers.length > 0 && (!activeCustomerId || !finalCustomers.some((c) => c.id === activeCustomerId))) {
      setActiveCustomerId(finalCustomers[0].id);
    }

    // Persist to local storage
    saveSettings(finalSettings);
    saveCustomers(finalCustomers);
    saveTransactions(finalTransactions);

    // If signed into Google Cloud, sync restored data immediately
    if (currentUser) {
      try {
        await uploadInitialDataToCloud(
          currentUser.uid,
          finalCustomers,
          finalTransactions,
          finalSettings
        );
        setSyncState({
          status: 'synced',
          lastSyncedAt: new Date(),
          errorMessage: null,
        });
      } catch (err) {
        console.error('Cloud sync after backup restore failed:', err);
      }
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    sounds.playDelete(settings.soundEnabled);

    // Collect all transaction IDs for this customer
    const txIdsToDelete = transactions
      .filter((t) => t.customerId === customerId)
      .map((t) => t.id);

    // 1. Filter out customer and their transactions
    const remainingCustomers = customers.filter((c) => c.id !== customerId);
    const remainingTransactions = transactions.filter((t) => t.customerId !== customerId);

    if (remainingCustomers.length > 0) {
      setCustomers(remainingCustomers);
      saveCustomers(remainingCustomers);
      if (activeCustomerId === customerId) {
        setActiveCustomerId(remainingCustomers[0].id);
        saveActiveCustomerId(remainingCustomers[0].id);
      }
    } else {
      // If the last customer was deleted, create a clean default customer
      const freshCustomer: Customer = {
        id: `cust_${Date.now()}`,
        name: settings.language === 'ur' ? 'نیا گاہک' : 'New Customer',
        phone: '',
        createdAt: Date.now(),
      };
      setCustomers([freshCustomer]);
      saveCustomers([freshCustomer]);
      setActiveCustomerId(freshCustomer.id);
      saveActiveCustomerId(freshCustomer.id);
    }

    setTransactions(remainingTransactions);
    saveTransactions(remainingTransactions);

    // 2. Cloud delete if user is logged into Google
    if (currentUser) {
      try {
        await deleteCustomerAndAllDataFromCloud(currentUser.uid, customerId, txIdsToDelete);
        setSyncState((prev) => ({
          ...prev,
          status: 'synced',
          lastSyncedAt: new Date(),
        }));
      } catch (err) {
        console.error('Cloud customer delete failed:', err);
      }
    }
  };

  const handleResetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const getPeriodTitle = (): string => {
    const isUrdu = settings.language === 'ur';
    if (period === 'all') return isUrdu ? 'تمام حساب (All)' : 'All Time';
    if (period === 'today') return isUrdu ? 'آج کا حساب (Today)' : 'Today';
    if (period === 'last7days') return isUrdu ? 'پچھلے 7 دن (Last 7 Days)' : 'Last 7 Days';
    if (period === 'last30days') return isUrdu ? '1 مہینہ / 30 دن (Last 30 Days)' : 'Last 30 Days';
    if (period === 'week') return isUrdu ? 'اس ہفتے (Week)' : 'This Week';
    if (period === 'month') return isUrdu ? 'رواں مہینہ (Month)' : 'This Month';
    if (period === 'custom')
      return `${customStartDate || (isUrdu ? 'شروع' : 'Start')} - ${customEndDate || (isUrdu ? 'آج' : 'Today')}`;
    return '';
  };

  return (
    <div
      className={`min-h-screen bg-slate-900 text-slate-800 ${
        isAndroidView ? 'py-0 sm:py-6 px-0 sm:px-4 flex justify-center items-center' : ''
      }`}
    >
      {/* Android Device Shell Container */}
      <div
        className={`w-full transition-all duration-300 ${
          isAndroidView
            ? 'max-w-md sm:max-w-lg bg-slate-100 min-h-screen sm:min-h-[850px] sm:max-h-[92vh] sm:rounded-[42px] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] sm:border-8 sm:border-slate-800 flex flex-col relative overflow-hidden ring-1 ring-slate-700/50'
            : 'max-w-2xl mx-auto bg-slate-100 min-h-screen flex flex-col shadow-2xl'
        }`}
      >
        {/* Android Punch Hole Camera on Top Bezel (in Android Frame mode) */}
        {isAndroidView && (
          <div className="hidden sm:block absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rounded-full z-40 border border-slate-700/60 shadow-inner">
            <div className="w-1.5 h-1.5 bg-blue-950/80 rounded-full mx-auto my-1"></div>
          </div>
        )}

        {/* Automatic PWA / Android App Install Alert Banner (Prominently alerts non-installed users on home screen visit) */}
        <AutoInstallAlertBanner
          settings={settings}
          onOpenDetailedGuide={() => setIsInstallAppModalOpen(true)}
        />

        {/* Top Header */}
        <Header
          settings={settings}
          customers={customers}
          activeCustomer={activeCustomer}
          currentUser={currentUser}
          onOpenGoogleAccount={() => setIsGoogleModalOpen(true)}
          onSelectCustomer={handleSelectCustomer}
          onOpenNewCustomer={() => setIsCustomerModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onToggleSound={handleToggleSound}
          onToggleLanguage={handleToggleLanguage}
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenReceipt={() => {
            setSingleReceiptTx(null);
            setIsReceiptModalOpen(true);
          }}
          isAndroidView={isAndroidView}
          onToggleAndroidView={() => setIsAndroidView(!isAndroidView)}
          onLockApp={() => setIsLocked(true)}
          onOpenInstallApp={() => setIsInstallAppModalOpen(true)}
          dueRemindersCount={dueCustomers.length}
          onOpenReminderModal={() => {
            const target = dueCustomers[0] || activeCustomer;
            setReminderTargetCustomer(target);
            setIsReminderModalOpen(true);
          }}
        />

        {/* Google / Gmail Sync Notification Banner */}
        <GoogleAuthBanner
          currentUser={currentUser}
          syncState={syncState}
          settings={settings}
          onOpenAuthModal={() => setIsGoogleModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-3.5 sm:px-4 pt-3.5 pb-20">
          {/* Due Payment Reminders Push Notification & In-App Alert Banner */}
          <DueRemindersBanner
            dueCustomers={dueCustomers}
            allTransactions={transactions}
            settings={settings}
            onOpenCustomer={(cust) => {
              setActiveCustomerId(cust.id);
            }}
            onOpenReminderModal={(cust) => {
              setReminderTargetCustomer(cust);
              setIsReminderModalOpen(true);
            }}
            onOpenWhatsApp={(cust) => {
              setActiveCustomerId(cust.id);
              setIsWhatsAppModalOpen(true);
            }}
            onAcknowledgeReminder={handleAcknowledgeReminder}
          />

          {/* Customer Balance Summary Card with Period Filters */}
          <SummaryCard
            customer={activeCustomer}
            transactions={filteredTransactions}
            settings={settings}
            period={period}
            onPeriodChange={(p) => setPeriod(p)}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomDateChange={(start, end) => {
              setCustomStartDate(start);
              setCustomEndDate(end);
            }}
            onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)}
            onOpenExport={() => setIsExportModalOpen(true)}
            onOpenReceipt={() => {
              setSingleReceiptTx(null);
              setIsReceiptModalOpen(true);
            }}
            onOpenReminder={() => {
              if (activeCustomer) {
                setReminderTargetCustomer(activeCustomer);
                setIsReminderModalOpen(true);
              }
            }}
          />

          {/* Chat History & Ledger Feed */}
          <TransactionList
            customer={activeCustomer}
            transactions={filteredTransactions}
            settings={settings}
            onEdit={handleEditTx}
            onDelete={handleDeleteTx}
            onOpenAddModal={handleOpenAddModal}
            onViewReceipt={(tx) => {
              setSingleReceiptTx(tx);
              setIsReceiptModalOpen(true);
            }}
          />
        </main>

        {/* Android Bottom Action Dock */}
        <BottomBar
          settings={settings}
          onOpenAddModal={handleOpenAddModal}
          onOpenReceipt={() => {
            setSingleReceiptTx(null);
            setIsReceiptModalOpen(true);
          }}
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenCustomers={() => setIsCustomersListModalOpen(true)}
        />

        {/* MODALS */}
        {/* Google Sign-in / Cloud Account Modal */}
        <GoogleAccountModal
          isOpen={isGoogleModalOpen}
          onClose={() => setIsGoogleModalOpen(false)}
          currentUser={currentUser}
          syncState={syncState}
          onManualSync={handleManualSync}
          settings={settings}
          customers={customers}
          transactions={transactions}
        />

        {/* 1. Add / Edit Transaction Modal (With You Gave / You Got Buttons) */}
        <AddTransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveTransaction}
          initialType={addModalType}
          editingTx={editingTx}
          customer={activeCustomer}
          settings={settings}
          transactions={transactions}
        />

        {/* 2. Add New Customer Modal */}
        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onAddCustomer={handleAddCustomer}
          settings={settings}
        />

        {/* 3. Customer Ledger Directory Modal */}
        <CustomersListModal
          isOpen={isCustomersListModalOpen}
          onClose={() => setIsCustomersListModalOpen(false)}
          customers={customers}
          activeCustomer={activeCustomer}
          transactions={transactions}
          settings={settings}
          onSelectCustomer={handleSelectCustomer}
          onOpenNewCustomer={() => {
            setIsCustomersListModalOpen(false);
            setIsCustomerModalOpen(true);
          }}
          onDeleteCustomer={handleDeleteCustomer}
          onOpenReminderModal={(cust) => {
            setIsCustomersListModalOpen(false);
            setReminderTargetCustomer(cust);
            setIsReminderModalOpen(true);
          }}
        />

        {/* 4. Thermal / Invoice Printable Receipt Modal */}
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setSingleReceiptTx(null);
          }}
          customer={activeCustomer}
          transactions={filteredTransactions}
          settings={settings}
          periodTitle={getPeriodTitle()}
          singleTx={singleReceiptTx}
        />

        {/* 5. PDF & Excel Export Center */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          customer={activeCustomer}
          allTransactions={transactions}
          settings={settings}
          onOpenReceipt={() => {
            setIsExportModalOpen(false);
            setSingleReceiptTx(null);
            setIsReceiptModalOpen(true);
          }}
          onOpenWhatsApp={() => {
            setIsExportModalOpen(false);
            setIsWhatsAppModalOpen(true);
          }}
        />

        {/* 6. WhatsApp Statement Share Modal */}
        <WhatsAppModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          customer={activeCustomer}
          transactions={filteredTransactions}
          settings={settings}
          periodTitle={getPeriodTitle()}
        />

        {/* 7. Settings Modal */}
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          customers={customers}
          transactions={transactions}
          currentUser={currentUser}
          onOpenGoogleAccount={() => setIsGoogleModalOpen(true)}
          onSaveSettings={handleSaveSettings}
          onResetData={handleResetData}
          onRestoreBackup={handleRestoreBackup}
          onLockApp={() => setIsLocked(true)}
          onDeleteCustomer={handleDeleteCustomer}
          onOpenInstallApp={() => setIsInstallAppModalOpen(true)}
        />

        {/* 8. Install Mobile App Modal (PWA / Android / iOS) */}
        <InstallAppModal
          isOpen={isInstallAppModalOpen}
          onClose={() => setIsInstallAppModalOpen(false)}
          settings={settings}
        />

        {/* 9. Recurring Payment Reminder Modal */}
        <ReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => {
            setIsReminderModalOpen(false);
            setReminderTargetCustomer(null);
          }}
          customer={reminderTargetCustomer || activeCustomer}
          settings={settings}
          netBalance={(() => {
            const target = reminderTargetCustomer || activeCustomer;
            if (!target) return 0;
            let gave = 0;
            let got = 0;
            transactions
              .filter((t) => t.customerId === target.id)
              .forEach((t) => {
                if (t.type === 'gave') gave += t.amount;
                else got += t.amount;
              });
            return gave - got;
          })()}
          onSaveReminder={handleSaveReminder}
          onOpenWhatsApp={() => {
            if (reminderTargetCustomer) {
              setActiveCustomerId(reminderTargetCustomer.id);
            }
            setIsWhatsAppModalOpen(true);
          }}
        />

        {/* 10. Biometric & Passcode Lock Screen Overlay */}
        {isLocked && settings.lockEnabled && settings.passcode && (
          <LockScreen
            settings={settings}
            onUnlock={() => setIsLocked(false)}
          />
        )}
      </div>
    </div>
  );
}
