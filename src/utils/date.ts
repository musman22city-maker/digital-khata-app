import { PeriodFilter } from '../types';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatTime12h(timeStr: string, lang: 'ur' | 'en' = 'ur'): string {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';
  const isPM = hours >= 12;
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const amPmUrdu = isPM ? 'شام' : 'صبح';
  const amPmEng = isPM ? 'PM' : 'AM';

  if (lang === 'ur') {
    return `${hours}:${minutes} ${amPmEng} (${amPmUrdu})`;
  }
  return `${hours}:${minutes} ${amPmEng}`;
}

const urduMonths = [
  'جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون',
  'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'
];

export function formatDatePretty(dateStr: string, lang: 'ur' | 'en' = 'ur'): string {
  if (!dateStr) return '';
  const today = getTodayDateString();
  const yesterday = new Date(Date.now() - 86400000);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (dateStr === today) {
    return lang === 'ur' ? 'آج (Today)' : 'Today';
  }
  if (dateStr === yStr) {
    return lang === 'ur' ? 'کل (Yesterday)' : 'Yesterday';
  }

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    if (lang === 'ur' && monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${urduMonths[monthIndex]} ${year}`;
    }
    const d = new Date(parseInt(year, 10), monthIndex, day);
    return d.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  return dateStr;
}

export function isDateInPeriod(
  dateStr: string,
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string
): boolean {
  if (!dateStr) return false;
  if (period === 'all') return true;

  const targetDate = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === 'today') {
    return dateStr === getTodayDateString();
  }

  if (period === 'last7days' || period === 'week') {
    // Last 7 days including today
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    return targetDate >= sevenDaysAgo && targetDate <= new Date();
  }

  if (period === 'last30days') {
    // Last 30 days (1 month span)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return targetDate >= thirtyDaysAgo && targetDate <= new Date();
  }

  if (period === 'month') {
    // Current calendar month (1st of month to end of month)
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    return targetDate >= thisMonthStart && targetDate <= thisMonthEnd;
  }

  if (period === 'custom') {
    if (!customStart && !customEnd) return true;
    if (customStart && dateStr < customStart) return false;
    if (customEnd && dateStr > customEnd) return false;
    return true;
  }

  return true;
}
