import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Calendar,
  Clock,
  Repeat,
  Check,
  Phone,
  AlertCircle,
  Share2,
  CalendarClock,
  Sparkles,
  Info
} from 'lucide-react';
import { AppSettings, Customer, CustomerReminder, ReminderFrequency } from '../types';
import { calculateNextDueDate, requestNotificationPermission } from '../utils/reminders';
import { getTodayDateString, formatDatePretty } from '../utils/date';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  settings: AppSettings;
  netBalance: number;
  onSaveReminder: (customerId: string, reminder: CustomerReminder | undefined) => void;
  onOpenWhatsApp?: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  customer,
  settings,
  netBalance,
  onSaveReminder,
  onOpenWhatsApp,
}) => {
  const isUrdu = settings.language === 'ur';
  const currency = settings.currency || 'Rs.';

  const existingReminder = customer?.reminder;

  const [enabled, setEnabled] = useState(existingReminder?.enabled ?? true);
  const [frequency, setFrequency] = useState<ReminderFrequency>(
    existingReminder?.frequency ?? 'monthly'
  );
  const [startDate, setStartDate] = useState(
    existingReminder?.startDate || getTodayDateString()
  );
  const [nextDueDate, setNextDueDate] = useState(
    existingReminder?.nextDueDate || calculateNextDueDate(getTodayDateString(), 'monthly')
  );
  const [customAmount, setCustomAmount] = useState<string>(
    existingReminder?.amount ? String(existingReminder.amount) : (netBalance > 0 ? String(netBalance) : '')
  );
  const [customNote, setCustomNote] = useState(existingReminder?.customNote || '');
  const [permissionState, setPermissionState] = useState<string>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, [isOpen]);

  useEffect(() => {
    if (customer?.reminder) {
      setEnabled(customer.reminder.enabled);
      setFrequency(customer.reminder.frequency);
      setStartDate(customer.reminder.startDate);
      setNextDueDate(customer.reminder.nextDueDate);
      setCustomAmount(customer.reminder.amount ? String(customer.reminder.amount) : (netBalance > 0 ? String(netBalance) : ''));
      setCustomNote(customer.reminder.customNote || '');
    } else {
      const today = getTodayDateString();
      setEnabled(true);
      setFrequency('monthly');
      setStartDate(today);
      setNextDueDate(calculateNextDueDate(today, 'monthly'));
      setCustomAmount(netBalance > 0 ? String(netBalance) : '');
      setCustomNote('');
    }
  }, [customer, netBalance]);

  if (!isOpen || !customer) return null;

  const handleFrequencyChange = (freq: ReminderFrequency) => {
    setFrequency(freq);
    if (freq !== 'none') {
      const next = calculateNextDueDate(startDate, freq);
      setNextDueDate(next);
    }
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (frequency !== 'none') {
      setNextDueDate(calculateNextDueDate(newStart, frequency));
    } else {
      setNextDueDate(newStart);
    }
  };

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionState(res);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!enabled || frequency === 'none') {
      onSaveReminder(customer.id, undefined);
    } else {
      const reminder: CustomerReminder = {
        enabled: true,
        frequency,
        startDate,
        nextDueDate,
        amount: customAmount ? Number(customAmount) : undefined,
        customNote: customNote.trim() || undefined,
        lastNotifiedDate: existingReminder?.lastNotifiedDate,
      };
      onSaveReminder(customer.id, reminder);
    }
    onClose();
  };

  const handleRemoveReminder = () => {
    onSaveReminder(customer.id, undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner shrink-0">
              <Bell className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isUrdu ? 'تکراری ادائیگی یاد دہانی' : 'Recurring Payment Reminder'}
              </h3>
              <p className="text-xs text-emerald-200 truncate">
                {customer.name} {customer.phone ? `(${customer.phone})` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Customer Current Balance Snapshot */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">
                {isUrdu ? 'موجودہ واجب الادا بقایا رقم:' : 'Current Due Balance:'}
              </span>
              <span
                className={`text-base font-extrabold ${
                  netBalance > 0
                    ? 'text-emerald-700'
                    : netBalance < 0
                    ? 'text-rose-600'
                    : 'text-slate-600'
                }`}
              >
                {currency} {Math.abs(netBalance).toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {netBalance > 0
                  ? isUrdu
                    ? 'آپ نے لینے ہیں'
                    : 'Receivable'
                  : isUrdu
                  ? 'برابر / صفر'
                  : 'Settled'}
              </span>
            </div>
          </div>

          {/* Browser Push Notification Permission Banner */}
          {permissionState !== 'granted' && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">
                  {isUrdu
                    ? 'موبائل پش نوٹیفکیشن اجازت درکار ہے'
                    : 'Enable Push Notifications'}
                </span>
                <span className="text-[11px] text-amber-800 block mt-0.5">
                  {isUrdu
                    ? 'مقررہ تاریخ پر موبائل نوٹیفکیشن الرٹ موصول کرنے کیلئے اجازت دیں۔'
                    : 'Allow notification alerts so you never miss a customer payment due date.'}
                </span>
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="mt-2 text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  {isUrdu ? 'نوٹیفکیشن کی اجازت دیں' : 'Allow Notifications'}
                </button>
              </div>
            </div>
          )}

          {/* Enable Reminder Toggle */}
          <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-emerald-700" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {isUrdu ? 'ادائیگی یاد دہانی فعال کریں' : 'Enable Recurring Reminder'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isUrdu
                    ? 'تاریخ آنے پر خودکار الرٹ اور پش نوٹیفکیشن'
                    : 'Triggers push notification & badge alert on due date'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  enabled ? (isUrdu ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {enabled && (
            <div className="space-y-3.5 animate-fadeIn">
              {/* Frequency selection: Weekly, Bi-weekly, Monthly */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isUrdu ? 'تکرار کی مدت (Frequency):' : 'Repeat Frequency:'}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFrequencyChange('weekly')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      frequency === 'weekly'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>{isUrdu ? 'ہفتہ وار' : 'Weekly'}</div>
                    <div className="text-[9px] font-normal opacity-80">{isUrdu ? 'ہر 7 دن' : 'Every 7d'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFrequencyChange('biweekly')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      frequency === 'biweekly'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>{isUrdu ? '15 روزہ' : 'Bi-weekly'}</div>
                    <div className="text-[9px] font-normal opacity-80">{isUrdu ? 'ہر 14 دن' : 'Every 14d'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFrequencyChange('monthly')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      frequency === 'monthly'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>{isUrdu ? 'ماہانہ' : 'Monthly'}</div>
                    <div className="text-[9px] font-normal opacity-80">{isUrdu ? 'ہر مہینہ' : 'Every month'}</div>
                  </button>
                </div>
              </div>

              {/* Start Date & Next Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{isUrdu ? 'شروع کی تاریخ:' : 'Start Date:'}</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>{isUrdu ? 'اگلی مقررہ تاریخ (Due Date):' : 'Next Due Date:'}</span>
                  </label>
                  <input
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full bg-emerald-50/70 border border-emerald-400 font-bold rounded-xl px-2.5 py-1.5 text-xs text-emerald-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-100/50 rounded-xl text-[11px] text-emerald-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>
                  {isUrdu ? 'اگلا الرٹ: ' : 'Next Alert Date: '}
                  <strong className="font-bold">{formatDatePretty(nextDueDate, isUrdu ? 'ur' : 'en')}</strong>
                </span>
              </div>

              {/* Expected Installment Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isUrdu ? 'متوقع ادائیگی کی رقم (اختیاری):' : 'Expected Amount (Optional):'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                    {currency}
                  </span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={netBalance > 0 ? String(netBalance) : '0'}
                    className="w-full bg-slate-50 text-slate-900 font-bold px-3 py-2 pl-9 rounded-xl border border-slate-300 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Custom Note or Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isUrdu ? 'یاد دہانی کا پیغام / نوٹ (اختیاری):' : 'Reminder Note / Custom Message:'}
                </label>
                <textarea
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder={
                    isUrdu
                      ? 'محترم گاہک! آپ کی ماہانہ قسط / ادھار کی رقم کی تاریخ آ گئی ہے، برائے مہربانی تشریف لائیں۔'
                      : 'Kindly clear your pending payment by the due date.'
                  }
                  className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isUrdu ? 'یاد دہانی محفوظ کریں' : 'Save Reminder Schedule'}</span>
            </button>

            {existingReminder && (
              <button
                type="button"
                onClick={handleRemoveReminder}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
              >
                {isUrdu ? 'یاد دہانی ختم کریں' : 'Remove Reminder'}
              </button>
            )}

            {onOpenWhatsApp && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWhatsApp();
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isUrdu ? 'ابھی واٹس ایپ پر ادائیگی میسج بھیجیں' : 'Send WhatsApp Reminder Now'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
