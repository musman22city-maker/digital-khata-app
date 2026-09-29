import React from 'react';
import {
  Bell,
  Calendar,
  Clock,
  AlertTriangle,
  Share2,
  CheckCircle,
  X,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { AppSettings, Customer, Transaction } from '../types';
import { formatDatePretty } from '../utils/date';
import { calculateNextDueDate, getDaysDiffFromToday } from '../utils/reminders';

interface DueRemindersBannerProps {
  dueCustomers: Customer[];
  allTransactions: Transaction[];
  settings: AppSettings;
  onOpenCustomer: (customer: Customer) => void;
  onOpenReminderModal: (customer: Customer) => void;
  onOpenWhatsApp: (customer: Customer) => void;
  onAcknowledgeReminder: (customer: Customer) => void;
}

export const DueRemindersBanner: React.FC<DueRemindersBannerProps> = ({
  dueCustomers,
  allTransactions,
  settings,
  onOpenCustomer,
  onOpenReminderModal,
  onOpenWhatsApp,
  onAcknowledgeReminder,
}) => {
  const isUrdu = settings.language === 'ur';
  const currency = settings.currency || 'Rs.';

  if (!dueCustomers || dueCustomers.length === 0) return null;

  return (
    <div className="mb-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-3.5 text-white shadow-md border border-amber-400/50 animate-fadeIn">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shadow-inner shrink-0 animate-bounce">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
              <span>{isUrdu ? 'ادائیگی یاد دہانی الرٹ!' : 'Payment Due Reminder Alert!'}</span>
              <span className="text-[10px] bg-white text-orange-800 font-bold px-1.5 py-0.2 rounded-full">
                {dueCustomers.length} {isUrdu ? 'گاہک' : 'due'}
              </span>
            </h4>
            <p className="text-[11px] text-amber-100">
              {isUrdu
                ? 'مندرجہ ذیل گاہکوں کی ادائیگی کی تاریخ آ گئی ہے:'
                : 'Payment due date has arrived for the following customers:'}
            </p>
          </div>
        </div>
      </div>

      {/* Due Customer Cards Scrollable List */}
      <div className="space-y-2 mt-2">
        {dueCustomers.map((cust) => {
          const reminder = cust.reminder;
          if (!reminder) return null;

          // Calculate current balance
          let gave = 0;
          let got = 0;
          allTransactions
            .filter((t) => t.customerId === cust.id)
            .forEach((t) => {
              if (t.type === 'gave') gave += t.amount;
              else got += t.amount;
            });
          const balance = gave - got;
          const daysOverdue = getDaysDiffFromToday(reminder.nextDueDate);

          const frequencyLabel =
            reminder.frequency === 'weekly'
              ? isUrdu
                ? 'ہفتہ وار'
                : 'Weekly'
              : reminder.frequency === 'biweekly'
              ? isUrdu
                ? '15 روزہ'
                : 'Bi-weekly'
              : isUrdu
              ? 'ماہانہ'
              : 'Monthly';

          return (
            <div
              key={cust.id}
              className="bg-white/95 text-slate-900 rounded-2xl p-2.5 shadow-sm border border-white flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                onClick={() => onOpenCustomer(cust)}
              >
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-800 font-bold flex items-center justify-center text-xs shrink-0">
                  {cust.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {cust.name}
                    </span>
                    <span className="text-[10px] bg-orange-100 text-orange-800 font-semibold px-2 py-0.2 rounded-md">
                      {frequencyLabel}
                    </span>
                    {daysOverdue > 0 ? (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                        {daysOverdue} {isUrdu ? 'دن تاخیر' : 'days overdue'}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                        {isUrdu ? 'آج مقرر ہے' : 'Due Today'}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>
                      {isUrdu ? 'مقررہ تاریخ: ' : 'Due Date: '}
                      <strong className="text-slate-800">
                        {formatDatePretty(reminder.nextDueDate, isUrdu ? 'ur' : 'en')}
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="font-extrabold text-orange-700">
                      {currency} {(reminder.amount || Math.abs(balance)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => onOpenWhatsApp(cust)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                  title={isUrdu ? 'واٹس ایپ یاد دہانی بھیجیں' : 'Send WhatsApp Reminder'}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'واٹس ایپ' : 'WhatsApp'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenReminderModal(cust)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
                  title={isUrdu ? 'تاریخ یا شیڈول تبدیل کریں' : 'Change Date / Schedule'}
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                </button>

                <button
                  type="button"
                  onClick={() => onAcknowledgeReminder(cust)}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title={isUrdu ? 'اگلی تاریخ پر منتقل کریں' : 'Postpone to Next Cycle'}
                >
                  <CheckCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>{isUrdu ? 'اگلا سائیکل' : 'Next Cycle'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
