import React, { useState } from 'react';
import { X, UserPlus, Phone, MapPin, FileText, Check, Users, Bell, Repeat, Calendar } from 'lucide-react';
import { AppSettings, Customer, CustomerReminder, ReminderFrequency } from '../types';
import { calculateNextDueDate } from '../utils/reminders';
import { getTodayDateString } from '../utils/date';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  settings: AppSettings;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onAddCustomer,
  settings,
}) => {
  const isUrdu = settings.language === 'ur';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Optional recurring reminder setup on party creation
  const [enableReminder, setEnableReminder] = useState(false);
  const [frequency, setFrequency] = useState<ReminderFrequency>('monthly');
  const [expectedAmount, setExpectedAmount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(isUrdu ? 'گاہک یا کھاتے دار کا نام ضروری ہے' : 'Customer name is required');
      return;
    }

    let reminder: CustomerReminder | undefined = undefined;
    if (enableReminder) {
      const today = getTodayDateString();
      reminder = {
        enabled: true,
        frequency,
        startDate: today,
        nextDueDate: calculateNextDueDate(today, frequency),
        amount: expectedAmount ? Number(expectedAmount) : undefined,
      };
    }

    onAddCustomer({
      name: name.trim(),
      phone: phone.trim() || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined,
      reminder,
    });

    setName('');
    setPhone('');
    setCity('');
    setNotes('');
    setEnableReminder(false);
    setExpectedAmount('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isUrdu ? 'نیا گاہک / پارٹی کھاتہ' : 'Add New Customer'}
              </h3>
              <p className="text-xs text-emerald-200">
                {isUrdu ? 'حساب کتاب محفوظ رکھنے کے لیے' : 'To maintain accounts ledger'}
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isUrdu ? 'گاہک / کسٹمر کا نام *' : 'Customer Name *'}
            </label>
            <input
              type="text"
              placeholder={isUrdu ? 'مثلاً محمد عثمان، بلال برادرز...' : 'e.g. Ahmad Khan, Bilal...'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 font-medium px-3.5 py-2.5 rounded-2xl border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{isUrdu ? 'موبائل نمبر (اختیاری):' : 'Mobile / Phone # (Optional):'}</span>
            </label>
            <input
              type="tel"
              placeholder="0300-1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-2xl border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{isUrdu ? 'شہر یا پتہ (اختیاری):' : 'City or Address (Optional):'}</span>
            </label>
            <input
              type="text"
              placeholder={isUrdu ? 'مثلاً لاہور، مین مارکیٹ' : 'e.g. Lahore, Main Bazaar'}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-2xl border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
              <span>{isUrdu ? 'اضافی نوٹ / تفصیل:' : 'Additional Notes:'}</span>
            </label>
            <textarea
              rows={2}
              placeholder={isUrdu ? 'کوئی خاص تفصیل یا ادھار کی حد...' : 'Special instructions or credit limit...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-2xl border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            ></textarea>
          </div>

          {/* Recurring Reminder quick toggle */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-slate-800">
                  {isUrdu ? 'تکراری ادائیگی یاد دہانی سیٹ کریں؟' : 'Set Recurring Reminder?'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={enableReminder}
                onChange={(e) => setEnableReminder(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
            </div>

            {enableReminder && (
              <div className="pt-2 border-t border-emerald-200/60 space-y-2 text-xs animate-fadeIn">
                <div className="grid grid-cols-3 gap-1.5">
                  {(['weekly', 'biweekly', 'monthly'] as ReminderFrequency[]).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setFrequency(freq)}
                      className={`py-1.5 px-2 rounded-xl font-bold border transition text-center cursor-pointer ${
                        frequency === freq
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {freq === 'weekly'
                        ? isUrdu
                          ? 'ہفتہ وار'
                          : 'Weekly'
                        : freq === 'biweekly'
                        ? isUrdu
                          ? '15 روزہ'
                          : 'Bi-weekly'
                        : isUrdu
                        ? 'ماہانہ'
                        : 'Monthly'}
                    </button>
                  ))}
                </div>

                <div>
                  <input
                    type="number"
                    placeholder={isUrdu ? 'متوقع ادائیگی رقم (اختیاری)' : 'Expected installment amount (optional)'}
                    value={expectedAmount}
                    onChange={(e) => setExpectedAmount(e.target.value)}
                    className="w-full bg-white text-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl font-bold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isUrdu ? 'گاہک کھاتہ بنائیں' : 'Create Customer Ledger'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
