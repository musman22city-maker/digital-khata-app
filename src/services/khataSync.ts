import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { AppSettings, Customer, Transaction } from '../types';

export interface CloudSyncState {
  status: 'offline' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: Date | null;
  errorMessage: string | null;
}

/**
 * Sync user profile/settings to Firestore
 */
export async function syncUserSettingsToCloud(userId: string, settings: AppSettings): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      shopName: settings.shopName.slice(0, 100),
      ownerName: settings.ownerName.slice(0, 100),
      shopPhone: settings.shopPhone.slice(0, 50),
      shopAddress: settings.shopAddress.slice(0, 200),
      currency: settings.currency.slice(0, 20),
      soundEnabled: settings.soundEnabled,
      language: settings.language,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save / Update a customer in Firestore
 */
export async function saveCustomerToCloud(userId: string, customer: Customer): Promise<void> {
  const path = `users/${userId}/customers/${customer.id}`;
  try {
    const custRef = doc(db, 'users', userId, 'customers', customer.id);
    const dataToSave: any = {
      id: customer.id,
      userId,
      name: customer.name.slice(0, 150),
      phone: customer.phone ? customer.phone.slice(0, 50) : '',
      city: customer.city ? customer.city.slice(0, 100) : '',
      notes: customer.notes ? customer.notes.slice(0, 500) : '',
      createdAt: customer.createdAt || Date.now()
    };
    if (customer.reminder) {
      dataToSave.reminder = {
        enabled: Boolean(customer.reminder.enabled),
        frequency: customer.reminder.frequency,
        startDate: customer.reminder.startDate || '',
        nextDueDate: customer.reminder.nextDueDate || '',
        amount: customer.reminder.amount ? Number(customer.reminder.amount) : null,
        customNote: customer.reminder.customNote ? customer.reminder.customNote.slice(0, 300) : '',
        lastNotifiedDate: customer.reminder.lastNotifiedDate || ''
      };
    }
    await setDoc(custRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a customer from Firestore
 */
export async function deleteCustomerFromCloud(userId: string, customerId: string): Promise<void> {
  const path = `users/${userId}/customers/${customerId}`;
  try {
    const custRef = doc(db, 'users', userId, 'customers', customerId);
    await deleteDoc(custRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save / Update a transaction in Firestore
 */
export async function saveTransactionToCloud(userId: string, transaction: Transaction): Promise<void> {
  const path = `users/${userId}/transactions/${transaction.id}`;
  try {
    const txRef = doc(db, 'users', userId, 'transactions', transaction.id);
    await setDoc(txRef, {
      id: transaction.id,
      userId,
      customerId: transaction.customerId,
      type: transaction.type,
      itemName: transaction.itemName.slice(0, 200),
      amount: Number(transaction.amount),
      date: transaction.date,
      time: transaction.time || '',
      timestamp: transaction.timestamp || Date.now(),
      note: transaction.note ? transaction.note.slice(0, 300) : '',
      receiptNo: transaction.receiptNo ? transaction.receiptNo.slice(0, 50) : ''
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a transaction from Firestore
 */
export async function deleteTransactionFromCloud(userId: string, transactionId: string): Promise<void> {
  const path = `users/${userId}/transactions/${transactionId}`;
  try {
    const txRef = doc(db, 'users', userId, 'transactions', transactionId);
    await deleteDoc(txRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Delete a customer and all their transactions from Firestore
 */
export async function deleteCustomerAndAllDataFromCloud(
  userId: string,
  customerId: string,
  transactionIds: string[]
): Promise<void> {
  try {
    // Delete all related transactions
    for (const txId of transactionIds) {
      await deleteTransactionFromCloud(userId, txId);
    }
    // Delete customer
    await deleteCustomerFromCloud(userId, customerId);
  } catch (error) {
    console.error('Error deleting customer and data from cloud:', error);
    throw error;
  }
}

export function subscribeToCustomers(
  userId: string,
  onUpdate: (customers: Customer[]) => void,
  onError: (err: unknown) => void
) {
  const path = `users/${userId}/customers`;
  const colRef = collection(db, 'users', userId, 'customers');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Customer[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Customer);
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError(error);
    }
  );
}

/**
 * Real-time listener for transactions
 */
export function subscribeToTransactions(
  userId: string,
  onUpdate: (transactions: Transaction[]) => void,
  onError: (err: unknown) => void
) {
  const path = `users/${userId}/transactions`;
  const colRef = collection(db, 'users', userId, 'transactions');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Transaction);
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError(error);
    }
  );
}

/**
 * Migrate/Upload local data to user's new cloud account on first sign-in
 */
export async function uploadInitialDataToCloud(
  userId: string,
  localCustomers: Customer[],
  localTransactions: Transaction[],
  localSettings: AppSettings
): Promise<void> {
  try {
    await syncUserSettingsToCloud(userId, localSettings);

    for (const cust of localCustomers) {
      await saveCustomerToCloud(userId, cust);
    }

    for (const tx of localTransactions) {
      await saveTransactionToCloud(userId, tx);
    }
  } catch (error) {
    console.error('Initial cloud upload error:', error);
  }
}
