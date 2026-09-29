import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Calendar,
  Printer,
  Share2,
  CheckCircle,
  FileText,
  Clock
} from 'lucide-react';
import { AppSettings, Customer, PeriodFilter, Transaction } from '../types';
import { exportToExcelCSV, exportToPDF } from '../utils/export';
import { isDateInPeriod } from '../utils/date';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  allTransactions: Transaction[];
  settings: AppSettings;
  onOpenReceipt: () => void;
  onOpenWhatsApp: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  customer,
  allTransactions,
  settings,
  onOpenReceipt,
  onOpenWhatsApp,
}) => {
  const isUrdu = settings.language === 'ur';
  const currency = settings.currency || 'Rs.';

  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  if (!isOpen || !customer) return null;

  // Filter transactions for this customer & chosen period
  const filtered = allTransactions.filter(
    (t) =>
      t.customerId === customer.id &&
      isDateInPeriod(t.date, period, customStart, customEnd)
  );

  let totalGave = 0;
  let totalGot = 0;
  filtered.forEach((t) => {
    if (t.type === 'gave') totalGave += t.amount;
    else totalGot += t.amount;
  });

  const getPeriodLabel = (): string => {
    if (period === 'all') return isUrdu ? 'مکمل ریکارڈ (All Time)' : 'All Time';
    if (period === 'today') return isUrdu ? 'آج کا حساب (Today)' : 'Today';
    if (period === 'last7days') return isUrdu ? 'پچھلے 7 دن (Last 7 Days)' : 'Last 7 Days';
    if (period === 'last30days') return isUrdu ? 'پچھلے 30 دن / 1 مہینہ (Last 30 Days)' : 'Last 30 Days';
    if (period === 'week') return isUrdu ? 'اس ہفتے کا حساب (This Week)' : 'This Week';
    if (period === 'month') return isUrdu ? 'اس مہینے کا حساب (This Month)' : 'This Month';
    if (period === 'custom')
      return `${customStart || 'شروع'} تا ${customEnd || 'آج'}`;
    return '';
  };

  const handleExcelExport = () => {
    exportToExcelCSV(customer, filtered, settings, getPeriodLabel());
  };

  const handlePdfExport = () => {
    exportToPDF(customer, filtered, settings, getPeriodLabel());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Download className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isUrdu ? 'پی ڈی ایف اور ایکسل رپورٹ ڈاؤن لوڈ' : 'Export Reports & Statements'}
              </h3>
              <p className="text-xs text-emerald-200">
                {customer.name} • {isUrdu ? 'حساب کتاب' : 'Ledger'}
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

        <div className="p-4 sm:p-5 space-y-4">
          {/* Period Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isUrdu ? 'رپورٹ کی مدت منتخب کریں (Filter Period):' : 'Select Report Period:'}</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPeriod('today')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  period === 'today'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isUrdu ? 'آج (Today)' : 'Today'}
              </button>

              <button
                type="button"
                onClick={() => setPeriod('last7days')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  period === 'last7days'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isUrdu ? 'پچھلے 7 دن' : 'Last 7 Days'}
              </button>

              <button
                type="button"
                onClick={() => setPeriod('last30days')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  period === 'last30days'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isUrdu ? '1 مہینہ (30 دن)' : 'Last 1 Month'}
              </button>

              <button
                type="button"
                onClick={() => setPeriod('month')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  period === 'month'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isUrdu ? 'رواں مہینہ' : 'This Month'}
              </button>

              <button
                type="button"
                onClick={() => setPeriod('all')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  period === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isUrdu ? 'سب ریکارڈ (All)' : 'All Records'}
              </button>

              <button
                type="button"
                onClick={() => setPeriod('custom')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  period === 'custom'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isUrdu ? 'کسٹم تاریخ' : 'Custom Dates'}
              </button>
            </div>

            {/* Custom Range Inputs */}
            {period === 'custom' && (
              <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">
                    {isUrdu ? 'از تاریخ:' : 'From:'}
                  </span>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">
                    {isUrdu ? 'تا تاریخ:' : 'To:'}
                  </span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Summary of filtered data */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{isUrdu ? 'منتخب ریکارڈز کی تعداد:' : 'Transactions Found:'}</span>
              <span className="font-bold text-slate-900">{filtered.length} {isUrdu ? 'اندراج' : 'items'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{isUrdu ? 'کل سامان دیا (You Gave):' : 'Total Given:'}</span>
              <span className="font-bold text-rose-600">{currency} {totalGave.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{isUrdu ? 'کل وصولی (You Got):' : 'Total Received:'}</span>
              <span className="font-bold text-emerald-600">{currency} {totalGot.toLocaleString()}</span>
            </div>
            <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900">
              <span>{isUrdu ? 'صافی بقایا (Net Balance):' : 'Net Balance:'}</span>
              <span className={totalGave - totalGot >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                {currency} {(totalGave - totalGot).toLocaleString()}
              </span>
            </div>
          </div>

          {/* DOWNLOAD ACTION BUTTONS */}
          <div className="space-y-2 pt-1">
            {/* EXCEL SHEET DOWNLOAD */}
            <button
              onClick={handleExcelExport}
              disabled={filtered.length === 0}
              className="w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white bg-emerald-700 hover:bg-emerald-800 shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>
                {isUrdu
                  ? 'ایکسل شیٹ ڈاؤن لوڈ کریں (.CSV / Excel)'
                  : 'Download Excel Sheet (.CSV)'}
              </span>
            </button>

            {/* PDF REPORT DOWNLOAD */}
            <button
              onClick={handlePdfExport}
              disabled={filtered.length === 0}
              className="w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white bg-rose-700 hover:bg-rose-800 shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>
                {isUrdu
                  ? 'پی ڈی ایف اسٹیٹمنٹ ڈاؤن لوڈ کریں (.PDF)'
                  : 'Download PDF Statement'}
              </span>
            </button>

            {/* PRINT RECEIPT */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenReceipt();
                }}
                className="py-2.5 px-3 rounded-2xl font-semibold text-xs text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>{isUrdu ? 'رسید بل پرنٹ کریں' : 'Print Receipt'}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenWhatsApp();
                }}
                className="py-2.5 px-3 rounded-2xl font-semibold text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isUrdu ? 'واٹس ایپ پر بھیجیں' : 'WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
