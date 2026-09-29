import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  Package,
  Receipt,
  Plus
} from 'lucide-react';
import { AppSettings, Customer, Transaction } from '../types';
import { formatDatePretty, formatTime12h } from '../utils/date';

interface TransactionListProps {
  customer: Customer | null;
  transactions: Transaction[];
  settings: AppSettings;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: (type?: 'gave' | 'got') => void;
  onViewReceipt: (tx: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  customer,
  transactions,
  settings,
  onEdit,
  onDelete,
  onOpenAddModal,
  onViewReceipt,
}) => {
  const isUrdu = settings.language === 'ur';
  const currency = settings.currency || 'Rs.';

  // Group transactions by date for clean chat/feed sections
  const groupedByDate: { [date: string]: Transaction[] } = {};
  
  // Calculate running balance per transaction from oldest to newest
  const sortedAsc = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
  let running = 0;
  const runningMap = new Map<string, number>();

  sortedAsc.forEach((tx) => {
    if (tx.type === 'gave') {
      running += tx.amount;
    } else {
      running -= tx.amount;
    }
    runningMap.set(tx.id, running);
  });

  // Display newest at the top (or chat order)
  const sortedDesc = [...transactions].sort((a, b) => b.timestamp - a.timestamp);

  sortedDesc.forEach((tx) => {
    const d = tx.date;
    if (!groupedByDate[d]) {
      groupedByDate[d] = [];
    }
    groupedByDate[d].push(tx);
  });

  const dates = Object.keys(groupedByDate);

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/90 shadow-xs my-4">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-600">
          <Receipt className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-slate-800 text-base mb-1">
          {isUrdu ? 'اس مدت میں کوئی حساب درج نہیں ہے' : 'No transactions found'}
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5">
          {isUrdu
            ? 'نیچے دیے گئے "میں نے دیا" یا "میں نے لیا" بٹن پر کلک کر کے نیا اندراج شامل کریں۔'
            : 'Click the Gave or Got buttons below to record your first transaction.'}
        </p>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onOpenAddModal('gave')}
            className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer active:scale-95 shadow-xs"
          >
            {isUrdu ? '+ میں نے دیا (You Gave)' : '+ You Gave'}
          </button>
          <button
            onClick={() => onOpenAddModal('got')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer active:scale-95 shadow-xs"
          >
            {isUrdu ? '+ میں نے لیا (You Got)' : '+ You Got'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {dates.map((dateStr) => {
        const txList = groupedByDate[dateStr];
        const prettyDate = formatDatePretty(dateStr, settings.language);

        return (
          <div key={dateStr} className="space-y-2.5">
            {/* Sticky/Grouped Date Divider */}
            <div className="flex items-center justify-center my-3">
              <span className="bg-slate-200/80 text-slate-700 text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5 border border-slate-300/50">
                <Calendar className="w-3 h-3 text-slate-500" />
                {prettyDate}
              </span>
            </div>

            {/* Transaction Cards */}
            {txList.map((tx) => {
              const isGave = tx.type === 'gave';
              const balanceAfter = runningMap.get(tx.id) ?? 0;

              return (
                <div
                  key={tx.id}
                  className={`bg-white rounded-2xl p-3.5 border transition hover:shadow-md ${
                    isGave
                      ? 'border-rose-200/80 hover:border-rose-300'
                      : 'border-emerald-200/80 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Icon + Title + Info */}
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                          isGave
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {isGave ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Item Name */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm leading-snug break-words">
                            {tx.itemName || (isUrdu ? 'لین دین' : 'Transaction')}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              isGave
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isGave
                              ? isUrdu
                                ? 'دیا (Gave)'
                                : 'You Gave'
                              : isUrdu
                              ? 'لیا (Got)'
                              : 'You Got'}
                          </span>
                        </div>

                        {/* Timestamp & Notes */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatTime12h(tx.time, settings.language)}
                          </span>

                          {tx.note && (
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] truncate max-w-[180px]">
                              {tx.note}
                            </span>
                          )}

                          {tx.receiptNo && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{tx.receiptNo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price / Amount & Running Balance */}
                    <div className="text-left shrink-0">
                      <div
                        className={`text-base sm:text-lg font-extrabold ${
                          isGave ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {isGave ? '-' : '+'} {currency} {tx.amount.toLocaleString()}
                      </div>

                      <div className="text-[10px] text-slate-400 text-right mt-0.5">
                        {isUrdu ? 'بقایا: ' : 'Bal: '}
                        <span
                          className={`font-semibold ${
                            balanceAfter > 0
                              ? 'text-emerald-600'
                              : balanceAfter < 0
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {currency} {balanceAfter.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer for entry */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <button
                      onClick={() => onViewReceipt(tx)}
                      className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 transition cursor-pointer"
                    >
                      <Receipt className="w-3 h-3 text-slate-400" />
                      <span>{isUrdu ? 'رسید دیکھیں' : 'Receipt'}</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onEdit(tx)}
                        className="text-slate-400 hover:text-emerald-600 transition flex items-center gap-1 cursor-pointer"
                        title={isUrdu ? 'ترمیم کریں' : 'Edit'}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="text-[11px]">{isUrdu ? 'ترمیم' : 'Edit'}</span>
                      </button>
                      <button
                        onClick={() => onDelete(tx.id)}
                        className="text-slate-400 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
                        title={isUrdu ? 'حذف کریں' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">{isUrdu ? 'حذف' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
