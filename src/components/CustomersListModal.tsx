import React, { useState } from 'react';
import {
  X,
  Users,
  Search,
  PlusCircle,
  Phone,
  MapPin,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Bell
} from 'lucide-react';
import { AppSettings, Customer, Transaction } from '../types';
import { DeleteCustomerModal } from './DeleteCustomerModal';
import { isReminderDue } from '../utils/reminders';

interface CustomersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  activeCustomer: Customer | null;
  transactions: Transaction[];
  settings: AppSettings;
  onSelectCustomer: (cust: Customer) => void;
  onOpenNewCustomer: () => void;
  onDeleteCustomer?: (customerId: string) => Promise<void> | void;
  onOpenReminderModal?: (customer: Customer) => void;
}

export const CustomersListModal: React.FC<CustomersListModalProps> = ({
  isOpen,
  onClose,
  customers,
  activeCustomer,
  transactions,
  settings,
  onSelectCustomer,
  onOpenNewCustomer,
  onDeleteCustomer,
  onOpenReminderModal,
}) => {
  const isUrdu = settings.language === 'ur';
  const currency = settings.currency || 'Rs.';
  const [search, setSearch] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  if (!isOpen) return null;

  // Calculate net balance for each customer
  const customerBalances = new Map<string, { gave: number; got: number; net: number; count: number }>();

  customers.forEach((c) => {
    customerBalances.set(c.id, { gave: 0, got: 0, net: 0, count: 0 });
  });

  transactions.forEach((t) => {
    const stats = customerBalances.get(t.customerId) || { gave: 0, got: 0, net: 0, count: 0 };
    if (t.type === 'gave') stats.gave += t.amount;
    else stats.got += t.amount;
    stats.net = stats.gave - stats.got;
    stats.count += 1;
    customerBalances.set(t.customerId, stats);
  });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isUrdu ? 'تمام کھاتے دار / گاہک' : 'All Customer Ledgers'}
              </h3>
              <p className="text-xs text-emerald-200">
                {customers.length} {isUrdu ? 'کسٹمرز موجود ہیں' : 'parties registered'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenNewCustomer();
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'نیا گاہک' : 'Add'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="relative flex items-center">
            <Search className={`w-4 h-4 text-slate-400 absolute pointer-events-none ${isUrdu ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={isUrdu ? 'گاہک کا نام، شہر یا فون تلاش کریں...' : 'Search customer by name, phone or city...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full bg-white text-xs sm:text-sm text-slate-900 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs ${
                isUrdu ? 'pr-9 pl-8' : 'pl-9 pr-8'
              }`}
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className={`absolute text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer ${
                  isUrdu ? 'left-2.5' : 'right-2.5'
                }`}
                title={isUrdu ? 'تلاش ختم کریں' : 'Clear search'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Result Counter & Filter Info */}
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500">
            <span>
              {search.trim() ? (
                <>
                  {isUrdu ? 'تلاش کے نتائج: ' : 'Found: '}
                  <strong className="text-slate-800 font-bold">{filtered.length}</strong>
                  {isUrdu ? ` (${customers.length} میں سے)` : ` of ${customers.length}`}
                </>
              ) : (
                <>
                  {isUrdu ? 'کل کھاتے: ' : 'Total Customers: '}
                  <strong className="text-slate-800 font-bold">{customers.length}</strong>
                </>
              )}
            </span>
            {search.trim() && (
              <button
                onClick={() => setSearch('')}
                className="text-emerald-700 hover:text-emerald-800 font-medium underline cursor-pointer"
              >
                {isUrdu ? 'تمام دکھائیں' : 'Reset search'}
              </button>
            )}
          </div>
        </div>

        {/* Customer List */}
        <div className="overflow-y-auto flex-1 p-3 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-700 text-sm">
                {isUrdu ? `"${search}" کے نام سے کوئی گاہک نہیں ملا` : `No customers matching "${search}"`}
              </p>
              <p className="text-slate-500 text-[11px]">
                {isUrdu ? 'نام کے ہجے چیک کریں یا نیا گاہک شامل کریں' : 'Check the spelling or add a new customer'}
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => setSearch('')}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-medium text-xs transition cursor-pointer"
                >
                  {isUrdu ? 'تلاش صاف کریں' : 'Clear Search'}
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenNewCustomer();
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  {isUrdu ? '+ نیا گاہک شامل کریں' : '+ Add New Customer'}
                </button>
              </div>
            </div>
          ) : (
            filtered.map((c) => {
              const stats = customerBalances.get(c.id) || { gave: 0, got: 0, net: 0, count: 0 };
              const isSelected = activeCustomer?.id === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCustomer(c);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/90 border border-emerald-300'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                      {c.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {c.name}
                        </h4>
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.2 rounded-full font-bold">
                            {isUrdu ? 'منتخب' : 'Active'}
                          </span>
                        )}
                        {c.reminder?.enabled && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenReminderModal) onOpenReminderModal(c);
                            }}
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 cursor-pointer ${
                              isReminderDue(c.reminder)
                                ? 'bg-amber-500 text-white animate-pulse'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                            title={isUrdu ? 'ادائیگی یاد دہانی' : 'Payment reminder'}
                          >
                            <Bell className="w-2.5 h-2.5" />
                            <span>
                              {c.reminder.frequency === 'weekly'
                                ? isUrdu
                                  ? 'ہفتہ وار'
                                  : 'Weekly'
                                : c.reminder.frequency === 'biweekly'
                                ? isUrdu
                                  ? '15 روزہ'
                                  : 'Bi-weekly'
                                : isUrdu
                                ? 'ماہانہ'
                                : 'Monthly'}
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        {c.phone && <span className="font-mono">📞 {c.phone}</span>}
                        {c.city && <span>📍 {c.city}</span>}
                        <span>• {stats.count} {isUrdu ? 'اندراج' : 'entries'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Balance Status & Delete Action */}
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <div className="text-left">
                      <div
                        className={`text-sm font-extrabold ${
                          stats.net > 0
                            ? 'text-emerald-600'
                            : stats.net < 0
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {currency} {Math.abs(stats.net).toLocaleString()}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400">
                        {stats.net > 0
                          ? isUrdu
                            ? 'لینے ہیں (Receive)'
                            : 'Receive'
                          : stats.net < 0
                          ? isUrdu
                            ? 'دینے ہیں (Pay)'
                            : 'Pay'
                          : isUrdu
                          ? 'برابر (Settled)'
                          : 'Settled'}
                      </div>
                    </div>

                    {/* Delete Customer Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomerToDelete(c);
                      }}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                      title={isUrdu ? 'گاہک اور اس کا تمام ریکارڈ ڈیلیٹ کریں' : 'Delete customer & records'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs shrink-0">
          <span className="text-slate-500">
            {isUrdu ? 'کسی بھی گاہک پر کلک کر کے اس کا کھاتہ کھولیں۔' : 'Click any customer to open their ledger.'}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
          >
            {isUrdu ? 'بند کریں' : 'Close'}
          </button>
        </div>

        {/* Delete Customer Modal */}
        {customerToDelete && (
          <DeleteCustomerModal
            isOpen={Boolean(customerToDelete)}
            onClose={() => setCustomerToDelete(null)}
            customer={customerToDelete}
            transactionsCount={
              transactions.filter((tx) => tx.customerId === customerToDelete.id).length
            }
            customerBalance={(() => {
              const stats = customerBalances.get(customerToDelete.id);
              return stats ? stats.net : 0;
            })()}
            settings={settings}
            onConfirmDelete={async (custId) => {
              if (onDeleteCustomer) {
                await onDeleteCustomer(custId);
              }
              setCustomerToDelete(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
