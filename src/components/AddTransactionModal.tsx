import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Sparkles,
  Check,
  Tag,
  FileText,
  History,
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
  Flame,
  Search
} from 'lucide-react';
import { AppSettings, Customer, Transaction, TransactionType } from '../types';
import { getCurrentTimeString, getTodayDateString } from '../utils/date';
import confetti from 'canvas-confetti';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id' | 'timestamp'> & { id?: string }) => void;
  initialType?: TransactionType;
  editingTx?: Transaction | null;
  customer: Customer | null;
  settings: AppSettings;
  transactions?: Transaction[];
}

const COMMON_ITEMS_URDU = [
  'نقد رقم (Cash)',
  'گھر کا راشن (Grocery)',
  'آٹا تھیلا 20 کلو',
  'کوکنگ آئل 5 لیٹر',
  'چاول باسمتی',
  'چینی 5 کلو',
  'موبائل بیلنس لوڈ',
  'ادھار واپسی (Payment)',
  'سپلائی مال (Delivery)',
];

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'gave',
  editingTx,
  customer,
  settings,
  transactions = [],
}) => {
  const isUrdu = settings.language === 'ur';
  const currency = settings.currency || 'Rs.';

  const [type, setType] = useState<TransactionType>(initialType);
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isRecentDropdownOpen, setIsRecentDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Synchronize on open or change in editing transaction
  useEffect(() => {
    if (editingTx) {
      setType(editingTx.type);
      setItemName(editingTx.itemName);
      setAmount(editingTx.amount.toString());
      setDate(editingTx.date);
      setTime(editingTx.time);
      setNote(editingTx.note || '');
    } else {
      setType(initialType);
      setItemName('');
      setAmount('');
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setNote('');
    }
    setError('');
    setIsInputFocused(false);
    setIsRecentDropdownOpen(false);
  }, [editingTx, initialType, isOpen]);

  // Close dropdown if user clicks outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsRecentDropdownOpen(false);
      }
    };
    if (isRecentDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isRecentDropdownOpen]);

  // Compute the top 10 most frequently used item names from the user's previous transaction history
  const top10RecentItems = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const statsMap = new Map<
      string,
      {
        count: number;
        lastAmount: number;
        lastType: TransactionType;
        lastUsedTime: number;
        forCurrentCustomer: boolean;
      }
    >();

    // Process from oldest to newest so lastAmount & lastUsedTime reflect the latest occurrence
    for (const tx of transactions) {
      const trimmed = tx.itemName?.trim();
      if (!trimmed) continue;

      const isCurrentCust = customer ? tx.customerId === customer.id : false;
      const existing = statsMap.get(trimmed);

      if (!existing) {
        statsMap.set(trimmed, {
          count: 1,
          lastAmount: tx.amount,
          lastType: tx.type,
          lastUsedTime: tx.timestamp || 0,
          forCurrentCustomer: isCurrentCust,
        });
      } else {
        existing.count += 1;
        existing.lastAmount = tx.amount;
        existing.lastType = tx.type;
        if (tx.timestamp && tx.timestamp > existing.lastUsedTime) {
          existing.lastUsedTime = tx.timestamp;
        }
        if (isCurrentCust) {
          existing.forCurrentCustomer = true;
        }
      }
    }

    // Sort primarily by frequency (count DESC), then by recency (lastUsedTime DESC)
    return Array.from(statsMap.entries())
      .map(([name, data]) => ({
        name,
        ...data,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return b.lastUsedTime - a.lastUsedTime;
      })
      .slice(0, 10);
  }, [transactions, customer]);

  // Autocomplete matching items as user types
  const autocompleteList = useMemo(() => {
    const query = itemName.trim().toLowerCase();

    if (!query) {
      return top10RecentItems;
    }

    // Match across all past items, prioritizing the top 10 and exact prefixes
    const filtered = top10RecentItems.filter((item) =>
      item.name.toLowerCase().includes(query)
    );

    return filtered.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(query);
      const bStarts = b.name.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return b.count - a.count;
    });
  }, [itemName, top10RecentItems]);

  const handleSelectSuggestion = (item: { name: string; lastAmount?: number }) => {
    setItemName(item.name);
    // Pre-fill amount if current amount is empty and previous amount exists
    if (!amount && item.lastAmount) {
      setAmount(item.lastAmount.toString());
    }
    setIsInputFocused(false);
    setIsRecentDropdownOpen(false);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!itemName.trim()) {
      setError(isUrdu ? 'براہ کرم چیز یا آئٹم کا نام لکھیں' : 'Please enter item name or description');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setError(isUrdu ? 'براہ کرم درست رقم (پرائس) درج کریں' : 'Please enter a valid price/amount');
      return;
    }

    onSave({
      id: editingTx ? editingTx.id : undefined,
      customerId: customer?.id || '',
      type,
      itemName: itemName.trim(),
      amount: numAmount,
      date: date || getTodayDateString(),
      time: time || getCurrentTimeString(),
      note: note.trim() || undefined,
      receiptNo: editingTx?.receiptNo || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    // Celebration animation
    try {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    onClose();
  };

  const isGave = type === 'gave';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div
          className={`p-4 text-white flex items-center justify-between shrink-0 transition-colors ${
            isGave
              ? 'bg-gradient-to-r from-rose-700 via-rose-600 to-rose-800'
              : 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              {isGave ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {editingTx
                  ? isUrdu
                    ? 'حساب میں ترمیم کریں'
                    : 'Edit Transaction'
                  : isUrdu
                  ? 'نیا لین دین / اندراج'
                  : 'Add New Entry'}
              </h3>
              <p className="text-xs text-white/80">
                {customer?.name} • {isUrdu ? 'کھاتہ' : 'Ledger'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium animate-fadeIn">
              {error}
            </div>
          )}

          {/* TYPE TOGGLE: GAVE (دیئے) vs GOT (لیئے) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isUrdu ? 'لین دین کی قسم منتخب کریں:' : 'Transaction Type:'}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* BUTTON 1: میں نے دیا (You Gave) */}
              <button
                type="button"
                onClick={() => setType('gave')}
                className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition cursor-pointer border-2 ${
                  isGave
                    ? 'bg-rose-50 border-rose-600 text-rose-700 shadow-sm ring-2 ring-rose-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <TrendingUp className={`w-4 h-4 ${isGave ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-extrabold">{isUrdu ? 'میں نے دیا' : 'You Gave'}</span>
                </div>
                <span className="text-[11px] font-normal text-slate-500">
                  {isUrdu ? '(سامان یا ادھار دیا)' : '(Debit / You Gave)'}
                </span>
              </button>

              {/* BUTTON 2: میں نے لیا (You Got) */}
              <button
                type="button"
                onClick={() => setType('got')}
                className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition cursor-pointer border-2 ${
                  !isGave
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <TrendingDown className={`w-4 h-4 ${!isGave ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-extrabold">{isUrdu ? 'میں نے لیا' : 'You Got'}</span>
                </div>
                <span className="text-[11px] font-normal text-slate-500">
                  {isUrdu ? '(وصولی یا کیش ملا)' : '(Credit / You Got)'}
                </span>
              </button>
            </div>
          </div>

          {/* ITEM NAME INPUT WITH RECENT ITEMS DROPDOWN & AUTOCOMPLETE */}
          <div ref={dropdownRef} className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>{isUrdu ? 'چیز یا آئٹم کا نام (کیا دیا یا کیا لیا):' : 'Item Name or Description:'}</span>
              </label>

              {/* Recent Items Dropdown Toggle Button */}
              {top10RecentItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsRecentDropdownOpen((prev) => !prev)}
                  className="text-[11px] text-emerald-800 hover:text-emerald-950 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  title={isUrdu ? 'پہلے سے استعمال شدہ ٹاپ 10 اشیاء' : 'Top 10 Most Frequent Items'}
                >
                  <History className="w-3 h-3 text-emerald-600" />
                  <span>{isUrdu ? 'سابقہ ٹاپ 10 اشیاء' : 'Recent Items'}</span>
                  {isRecentDropdownOpen ? (
                    <ChevronUp className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-emerald-600" />
                  )}
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder={
                  isUrdu
                    ? isGave
                      ? 'مثلاً آٹا، چاول، گھی، راشن یا نقد...'
                      : 'مثلاً نقد رقم، جاز کیش، بینک وصولی...'
                    : 'e.g. Flour, Rice, Cash, Grocery...'
                }
                value={itemName}
                onChange={(e) => {
                  setItemName(e.target.value);
                  setIsRecentDropdownOpen(false);
                }}
                onFocus={() => setIsInputFocused(true)}
                className={`w-full bg-slate-50 text-slate-900 font-medium py-2.5 rounded-2xl border transition text-sm ${
                  isUrdu ? 'pr-3.5 pl-16' : 'pl-3.5 pr-16'
                } ${
                  (isInputFocused && autocompleteList.length > 0) || isRecentDropdownOpen
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white'
                    : 'border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                }`}
                autoFocus
              />

              <div
                className={`absolute top-2.5 flex items-center gap-1 ${
                  isUrdu ? 'left-2.5' : 'right-2.5'
                }`}
              >
                {itemName && (
                  <button
                    type="button"
                    onClick={() => {
                      setItemName('');
                      setIsRecentDropdownOpen(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition cursor-pointer"
                    title={isUrdu ? 'صاف کریں' : 'Clear'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Dropdown chevron button inside input field */}
                {top10RecentItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsRecentDropdownOpen((prev) => !prev)}
                    className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition cursor-pointer"
                    title={isUrdu ? 'ٹاپ 10 اشیاء کھولیں' : 'Open Recent Items'}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isRecentDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* 1. DEDICATED 'RECENT ITEMS' DROPDOWN (TOP 10 MOST FREQUENT ITEMS) */}
            {isRecentDropdownOpen && top10RecentItems.length > 0 && (
              <div className="absolute left-0 right-0 z-30 mt-1.5 p-2.5 bg-white rounded-2xl border-2 border-emerald-400 shadow-2xl space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                    <Flame className="w-4 h-4 text-emerald-600" />
                    <span>
                      {isUrdu
                        ? 'سب سے زیادہ استعمال ہونے والی ٹاپ 10 اشیاء:'
                        : 'Top 10 Most Frequently Used Items:'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    {top10RecentItems.length} {isUrdu ? 'اشیاء' : 'items'}
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 pr-0.5">
                  {top10RecentItems.map((item, idx) => (
                    <button
                      key={`recent-top-${item.name}-${idx}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(item);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-emerald-50/80 transition flex items-center justify-between gap-2 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-emerald-200 text-slate-600 group-hover:text-emerald-900 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-800 truncate group-hover:text-emerald-900">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            <span>
                              {item.count} {isUrdu ? 'مرتبہ استعمال شدہ' : 'times used'}
                            </span>
                            {item.forCurrentCustomer && (
                              <span className="text-emerald-700 font-semibold">
                                • {isUrdu ? 'اس گاہک کیلئے بھی' : 'Used for this customer'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.lastAmount > 0 && (
                          <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {currency} {item.lastAmount.toLocaleString()}
                          </span>
                        )}
                        <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 px-2">
                  <span>{isUrdu ? 'فوری انتخاب کے لیے کسی بھی آئٹم پر ٹیپ کریں' : 'Tap any item to fast-fill'}</span>
                  <button
                    type="button"
                    onClick={() => setIsRecentDropdownOpen(false)}
                    className="text-emerald-700 hover:underline font-semibold cursor-pointer"
                  >
                    {isUrdu ? 'بند کریں' : 'Close'}
                  </button>
                </div>
              </div>
            )}

            {/* 2. AUTOCOMPLETE LIST (WHILE USER IS TYPING OR FOCUSED) */}
            {!isRecentDropdownOpen && isInputFocused && autocompleteList.length > 0 && (
              <div className="absolute left-0 right-0 z-30 mt-1.5 p-2 bg-white rounded-2xl border border-emerald-300 shadow-xl space-y-1 animate-fadeIn">
                <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-500 border-b border-slate-100">
                  <span className="flex items-center gap-1 text-emerald-800 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    {itemName.trim()
                      ? isUrdu
                        ? 'مماثل اشیاء (Autocomplete):'
                        : 'Matching Recent Items:'
                      : isUrdu
                      ? 'ٹاپ 10 کثرت سے استعمال شدہ اشیاء:'
                      : 'Top 10 Frequently Used Items:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsInputFocused(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {isUrdu ? 'چھپائیں' : 'Hide'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 pr-0.5">
                  {autocompleteList.map((item, idx) => (
                    <button
                      key={`auto-${item.name}-${idx}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevents input blur before click triggers
                        handleSelectSuggestion(item);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-emerald-50 transition flex items-center justify-between gap-2 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-xs text-slate-800 truncate group-hover:text-emerald-900">
                          {item.name}
                        </span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full shrink-0">
                          {item.count}x
                        </span>
                        {item.forCurrentCustomer && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded-full shrink-0">
                            {isUrdu ? 'اس گاہک کی سابقہ' : 'This customer'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.lastAmount > 0 && (
                          <span className="text-[11px] font-mono text-slate-600 font-semibold">
                            {currency} {item.lastAmount.toLocaleString()}
                          </span>
                        )}
                        <CornerDownLeft className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Chips below the input (when dropdowns are closed) */}
            {!isRecentDropdownOpen && !isInputFocused && (
              <div className="mt-2 space-y-1.5">
                {/* Horizontal scrollable row of Top Recent Items */}
                {top10RecentItems.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {isUrdu ? 'ٹاپ اشیاء:' : 'Top Items:'}
                    </span>
                    {top10RecentItems.slice(0, 5).map((item) => (
                      <button
                        key={`chip-${item.name}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1 font-semibold shrink-0 shadow-2xs"
                      >
                        <History className="w-2.5 h-2.5 text-emerald-600" />
                        <span>{item.name}</span>
                        <span className="text-[9px] opacity-75">({item.count})</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Common General Items */}
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ITEMS_URDU.slice(0, 4).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setItemName(item.split(' (')[0])}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-xl transition cursor-pointer"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PRICE / AMOUNT INPUT */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                {isUrdu ? 'رقم / پرائس (Price / Amount):' : 'Amount / Price:'}
              </label>
              <span className="text-[11px] font-bold text-emerald-700">
                {isGave
                  ? isUrdu
                    ? 'آپ کے کھاتے میں جمع ہوگا'
                    : 'Adds to your receivable'
                  : isUrdu
                  ? 'کھاتے سے کم ہوگا'
                  : 'Deducts from receivable'}
              </span>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3 font-bold text-slate-400 text-sm">
                {currency}
              </span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 font-extrabold text-xl pl-12 pr-3.5 py-2.5 rounded-2xl border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Quick Amount Increment Buttons */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    const current = parseFloat(amount) || 0;
                    setAmount((current + val).toString());
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-xl transition cursor-pointer"
                >
                  +{val.toLocaleString()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="text-xs text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-xl transition cursor-pointer"
              >
                {isUrdu ? 'صاف کریں' : 'Clear'}
              </button>
            </div>
          </div>

          {/* DATE & TIME ROW */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{isUrdu ? 'تاریخ (Date):' : 'Date:'}</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{isUrdu ? 'وقت (Time):' : 'Time:'}</span>
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* NOTE / REMARK */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-500" />
              <span>{isUrdu ? 'اضافی نوٹ / تفصیل (اختیاری):' : 'Note / Remarks (Optional):'}</span>
            </label>
            <input
              type="text"
              placeholder={isUrdu ? 'مثلاً اگلی ادائیگی جمعہ کو ہوگی' : 'e.g. Next payment next Friday...'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                isGave
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {editingTx
                  ? isUrdu
                    ? 'تبدیلیاں محفوظ کریں'
                    : 'Save Changes'
                  : isGave
                  ? isUrdu
                    ? 'دیئے گئے روپے درج کریں'
                    : 'Save Debit Entry (You Gave)'
                  : isUrdu
                  ? 'وصول شدہ روپے درج کریں'
                  : 'Save Credit Entry (You Got)'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
