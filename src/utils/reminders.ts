import { Customer, CustomerReminder, ReminderFrequency } from '../types';
import { getTodayDateString } from './date';

/**
 * Calculates the next due date based on frequency from a given base date (YYYY-MM-DD)
 */
export function calculateNextDueDate(baseDateStr: string, frequency: ReminderFrequency): string {
  const [year, month, day] = baseDateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else if (frequency === 'biweekly') {
    date.setDate(date.getDate() + 14);
  } else if (frequency === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks if a customer's reminder is due on or before today
 */
export function isReminderDue(reminder?: CustomerReminder): boolean {
  if (!reminder || !reminder.enabled || reminder.frequency === 'none' || !reminder.nextDueDate) {
    return false;
  }
  const today = getTodayDateString();
  return reminder.nextDueDate <= today;
}

/**
 * Calculates how many days overdue or remaining for a reminder
 * positive = overdue by N days
 * negative = N days left
 * 0 = due today
 */
export function getDaysDiffFromToday(dueDateStr: string): number {
  if (!dueDateStr) return 0;
  const today = getTodayDateString();
  const [tY, tM, tD] = today.split('-').map(Number);
  const [dY, dM, dD] = dueDateStr.split('-').map(Number);

  const todayDate = new Date(tY, tM - 1, tD).getTime();
  const dueDate = new Date(dY, dM - 1, dD).getTime();

  const diffMs = todayDate - dueDate;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Helper to request browser Push/Notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    return await Notification.requestPermission();
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Sends a system push notification if permitted
 */
export function sendPushNotification(title: string, options?: NotificationOptions): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
      return true;
    } catch (err) {
      console.error('Failed to trigger Notification:', err);
    }
  }
  return false;
}
