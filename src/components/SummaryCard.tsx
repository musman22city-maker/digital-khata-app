import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  Scale,
  Calendar,
  Share2,
  FileSpreadsheet,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarRange,
  Filter,
  Bell,
  X
} from 'lucide-react';
import { AppSettings, Customer, PeriodFilter, Transaction } from '../types';
import { getTodayDateString, formatDatePretty } from '../utils/date';
import { isReminderDue, getDaysDiffFromToday } from '../utils/reminders';

interface SummaryCardProps {
  customer: Customer | null;
  transactions: Transaction[];
  settings: AppSettings;
  period: PeriodFilter;
  onPeriodChange: (p: PeriodFilter) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomDateChange: (start: string, end: string) => void;
  onOpenWhatsApp: () => void;
  onOpenExport: () => void;
  onOpenReceipt: () => void;
  onOpenReminder?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  customer,
  transactions,
  settings,
  period,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  onOpenWhatsApp,
  onOpenExport,
  onOpenReceipt,
  onOpenReminder,
}) => {
  const isUrdu = settings.language === 'ur';
  const currency = settings.currency || 'Rs.';

  let totalGave = 0;
  let totalGot = 0;

  transactions.forEach((tx) => {
    if (tx.type === 'gave') totalGave += tx.amount;
    else totalGot += tx.amount;
  });

  // Net Balance:
  // If You Gave > You Got: Balance is positive -> "آپ نے لینے ہیں" (You will receive)
  // If You Got > You Gave: Balance is negative -> "آپ نے دینے ہیں" (You will pay)
  const netBalance = totalGave - totalGot;
  const isSettled = netBalance === 0;
  const willReceive = netBalance > 0;

  // Preset Date Period Options
  const periods: { id: PeriodFilter; labelUrdu: string; labelEng: string; shortBadge?: string }[] = [
    { id: 'all', labelUrdu: 'مکمل کھاتہ', labelEng: 'All Time' },
    { id: 'today', labelUrdu: 'آج', labelEng: 'Today' },
    { id: 'last7days', labelUrdu: 'پچھلے 7 دن', labelEng: 'Last 7 Days', shortBadge: '7D' },
    { id: 'last30days', labelUrdu: 'ایک مہینہ (30 دن)', labelEng: 'Last 1 Month', shortBadge: '30D' },
    { id: 'month', labelUrdu: 'رواں مہینہ', labelEng: 'This Month' },
    { id: 'custom', labelUrdu: 'مخصوص تاریخ رینج', labelEng: 'Custom Date Range', shortBadge: 'Custom' },
  ];

  // Quick preset dates for custom picker
  const handleQuickPreset = (daysBack: number) => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - daysBack);

    const format = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    onCustomDateChange(format(past), format(today));
    onPeriodChange('custom');
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden mb-4">
      {/* Top customer status line */}
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-700">
            {customer ? customer.name : (isUrdu ? 'کوئی کھاتہ منتخب نہیں' : 'No Customer')}
          </span>
          {customer?.phone && (
            <span className="text-[11px] text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md font-mono">
              {customer.phone}
            </span>
          )}
        </div>

        {/* Quick share buttons */}
        <div className="flex items-center gap-1.5">
          {onOpenReminder && (
            <button
              type="button"
              onClick={onOpenReminder}
              title={isUrdu ? "تکراری ادائیگی یاد دہانی سیٹ کریں" : "Set Recurring Payment Reminder"}
              className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-xl transition shadow-xs cursor-pointer active:scale-95 ${
                customer?.reminder?.enabled
                  ? isReminderDue(customer.reminder)
                    ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              <Bell className="w-3 h-3" />
              <span>
                {customer?.reminder?.enabled
                  ? isUrdu
                    ? 'یاد دہانی فعال'
                    : 'Reminder On'
                  : isUrdu
                  ? 'یاد دہانی'
                  : 'Reminder'}
              </span>
            </button>
          )}

          <button
            onClick={onOpenWhatsApp}
            title={isUrdu ? "واٹس ایپ پر خلاصہ بھیجیں" : "Send WhatsApp Reminder"}
            className="flex items-center gap-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 py-1 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
          >
            <Share2 className="w-3 h-3" />
            <span>{isUrdu ? 'واٹس ایپ' : 'WhatsApp'}</span>
          </button>
          <button
            onClick={onOpenReceipt}
            title={isUrdu ? "رسید پرنٹ کریں" : "Print Bill Receipt"}
            className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-900 text-white font-medium px-2.5 py-1 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
          >
            <FileText className="w-3 h-3" />
            <span>{isUrdu ? 'رسید بل' : 'Bill'}</span>
          </button>
        </div>
      </div>

      {/* Main Net Balance Badge */}
      <div className="p-4 sm:p-5">
        <div className="text-center mb-4">
          <div className="text-xs text-slate-500 font-medium mb-1">
            {isUrdu ? 'صافی بقایا حساب (Net Balance)' : 'Net Current Balance'}
          </div>

          <div className="flex items-center justify-center gap-2">
            <span
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                isSettled
                  ? 'text-slate-600'
                  : willReceive
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {currency} {Math.abs(netBalance).toLocaleString()}
            </span>
          </div>

          {/* Meaningful Status Pill */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
            {isSettled ? (
              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-slate-500" />
                {isUrdu ? 'حساب برابر ہے (Settled / 0)' : 'Account Settled'}
              </span>
            ) : willReceive ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                {isUrdu ? 'آپ نے لینے ہیں (You Will Receive)' : 'You Will Receive'}
              </span>
            ) : (
              <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                {isUrdu ? 'آپ نے دینے ہیں (You Will Pay)' : 'You Will Pay'}
              </span>
            )}
          </div>

          {/* Recurring Reminder Status Badge if configured */}
          {customer?.reminder?.enabled && (
            <div
              onClick={onOpenReminder}
              className={`mt-2.5 mx-auto max-w-sm p-2 rounded-2xl border text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                isReminderDue(customer.reminder)
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Bell className={`w-3.5 h-3.5 shrink-0 ${isReminderDue(customer.reminder) ? 'text-amber-600 animate-bounce' : 'text-emerald-600'}`} />
                <span className="truncate text-[11px]">
                  {customer.reminder.frequency === 'weekly'
                    ? isUrdu
                      ? 'ہفتہ وار یاد دہانی:'
                      : 'Weekly reminder:'
                    : customer.reminder.frequency === 'biweekly'
                    ? isUrdu
                      ? '15 روزہ یاد دہانی:'
                      : 'Bi-weekly reminder:'
                    : isUrdu
                    ? 'ماہانہ یاد دہانی:'
                    : 'Monthly reminder:'}{' '}
                  <strong>{formatDatePretty(customer.reminder.nextDueDate, isUrdu ? 'ur' : 'en')}</strong>
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                isReminderDue(customer.reminder)
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isReminderDue(customer.reminder)
                  ? isUrdu
                    ? 'آج تاریخ ہے!'
                    : 'Due Now!'
                  : isUrdu
                  ? 'شیڈول'
                  : 'Scheduled'}
              </span>
            </div>
          )}
        </div>

        {/* 2-Column Gave vs Got Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Gave (میں نے دیا) */}
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-rose-700 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                {isUrdu ? 'میں نے دیا (You Gave)' : 'You Gave'}
              </span>
              <span className="text-[10px] bg-rose-200/70 text-rose-800 px-1.5 py-0.2 rounded font-bold">
                {isUrdu ? 'سامان/ادھار' : 'Debit'}
              </span>
            </div>
            <div className="text-xl font-bold text-rose-700">
              {currency} {totalGave.toLocaleString()}
            </div>
            <div className="text-[10px] text-rose-600/80 mt-0.5">
              {isUrdu ? 'کل دیا گیا سامان یا کیش' : 'Total given out'}
            </div>
          </div>

          {/* Got (میں نے لیا) */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                {isUrdu ? 'میں نے لیا (You Got)' : 'You Got'}
              </span>
              <span className="text-[10px] bg-emerald-200/70 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                {isUrdu ? 'وصولی' : 'Credit'}
              </span>
            </div>
            <div className="text-xl font-bold text-emerald-700">
              {currency} {totalGot.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-600/80 mt-0.5">
              {isUrdu ? 'کل وصول شدہ رقم' : 'Total received'}
            </div>
          </div>
        </div>

        {/* DATE RANGE & PERIOD FILTER SECTION */}
        <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200 space-y-2.5">
          <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-800">
              <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isUrdu ? 'تاریخ و مدت کے لحاظ سے اندراجات دیکھیں:' : 'Filter Entries by Date Period:'}</span>
            </span>
            <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-full font-bold text-slate-600 shadow-2xs">
              {transactions.length} {isUrdu ? 'اندراجات' : 'entries'}
            </span>
          </div>

          {/* Period Filter Tabs (1 Month, 7 Days, Today, Month, All, Custom) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {periods.map((p) => {
              const isActive = period === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onPeriodChange(p.id);
                    if (p.id === 'custom' && !customStartDate && !customEndDate) {
                      // Default custom range: last 30 days
                      const today = getTodayDateString();
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      const start = `${thirtyDaysAgo.getFullYear()}-${String(
                        thirtyDaysAgo.getMonth() + 1
                      ).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;
                      onCustomDateChange(start, today);
                    }
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer font-bold flex items-center gap-1 shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <span>{isUrdu ? p.labelUrdu : p.labelEng}</span>
                </button>
              );
            })}
          </div>

          {/* CUSTOM DATE RANGE PICKER WHEN 'custom' IS SELECTED */}
          {period === 'custom' && (
            <div className="p-3 bg-white border-2 border-emerald-500/30 rounded-2xl space-y-2.5 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isUrdu ? 'کسٹم تاریخ کا انتخاب کریں:' : 'Select Custom Date Range:'}</span>
                </span>

                {/* Quick Presets inside Custom */}
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleQuickPreset(7)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-semibold text-slate-600 cursor-pointer"
                  >
                    7 {isUrdu ? 'دن' : 'Days'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset(30)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-semibold text-slate-600 cursor-pointer"
                  >
                    30 {isUrdu ? 'دن' : 'Days'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset(90)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-semibold text-slate-600 cursor-pointer"
                  >
                    90 {isUrdu ? 'دن' : 'Days'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    {isUrdu ? 'شروع کی تاریخ (از تاریخ):' : 'Start Date (From):'}
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => onCustomDateChange(e.target.value, customEndDate)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    {isUrdu ? 'آخری تاریخ (تا تاریخ):' : 'End Date (To):'}
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => onCustomDateChange(customStartDate, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Status & Reset Filter */}
              {(customStartDate || customEndDate) && (
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-emerald-700 font-medium">
                    {isUrdu ? 'فلٹر فعال ہے: ' : 'Active filter: '}
                    <strong className="font-mono">{customStartDate || '...'}</strong>{' '}
                    {isUrdu ? 'سے' : 'to'}{' '}
                    <strong className="font-mono">{customEndDate || '...'}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      onCustomDateChange('', '');
                      onPeriodChange('all');
                    }}
                    className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>{isUrdu ? 'فلٹر ہٹائیں' : 'Clear filter'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
