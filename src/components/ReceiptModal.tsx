import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  FileSpreadsheet,
  CheckCircle2,
  Receipt as ReceiptIcon,
  Store,
  Phone,
  Calendar,
  Check
} from 'lucide-react';
import { AppSettings, Customer, Transaction } from '../types';
import { formatDatePretty, formatTime12h } from '../utils/date';
import { exportToExcelCSV, exportToPDF } from '../utils/export';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  transactions: Transaction[];
  settings: AppSettings;
  periodTitle: string;
  singleTx?: Transaction | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  customer,
  transactions,
  settings,
  periodTitle,
  singleTx,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const isUrdu = settings.language === 'ur';
  const currency = settings.currency || 'Rs.';

  if (!isOpen || !customer) return null;

  const displayList = singleTx ? [singleTx] : transactions;

  let totalGave = 0;
  let totalGot = 0;
  displayList.forEach((tx) => {
    if (tx.type === 'gave') totalGave += tx.amount;
    else totalGot += tx.amount;
  });

  const netBalance = totalGave - totalGot;
  const receiptNumber = singleTx?.receiptNo || `KH-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    exportToPDF(customer, displayList, settings, singleTx ? `رسید #${singleTx.receiptNo || ''}` : periodTitle);
  };

  const handleDownloadCSV = () => {
    exportToExcelCSV(customer, displayList, settings, singleTx ? `رسید #${singleTx.receiptNo || ''}` : periodTitle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Control Bar (Hidden during print) */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <ReceiptIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">
              {singleTx
                ? isUrdu
                  ? 'انفرادی رسید بل'
                  : 'Transaction Receipt'
                : isUrdu
                ? `کھاتہ سمری رسید (${periodTitle})`
                : `Account Statement (${periodTitle})`}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-sm"
              title="پرنٹ لیں"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'پرنٹ' : 'Print'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer"
              title="پی ڈی ایف ڈاؤن لوڈ"
            >
              <Download className="w-3.5 h-3.5 text-rose-300" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer"
              title="ایکسل شیٹ ڈاؤن لوڈ"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
          <div
            ref={printRef}
            className="bg-white p-5 sm:p-7 rounded-2xl shadow-xs border border-slate-200 text-slate-800 text-sm font-sans mx-auto max-w-lg print:border-none print:shadow-none print:p-0"
          >
            {/* Store Header */}
            <div className="text-center pb-4 border-b-2 border-dashed border-slate-300">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {settings.shopName}
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {settings.ownerName} • {settings.shopAddress}
              </p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                📞 {settings.shopPhone}
              </p>
              <div className="mt-2 inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-300">
                {isUrdu ? 'آفیشل ڈیجیٹل رسید' : 'OFFICIAL LEDGER RECEIPT'}
              </div>
            </div>

            {/* Receipt Details Meta */}
            <div className="py-3 text-xs border-b border-dashed border-slate-200 grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px]">{isUrdu ? 'گاہک کا نام:' : 'Customer Name:'}</span>
                <span className="font-bold text-slate-800">{customer.name}</span>
                {customer.phone && (
                  <span className="block text-[11px] text-slate-500 font-mono">{customer.phone}</span>
                )}
              </div>
              <div className="text-left">
                <span className="text-slate-400 block text-[10px]">{isUrdu ? 'رسید نمبر:' : 'Receipt No:'}</span>
                <span className="font-mono font-bold text-slate-800">#{receiptNumber}</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-3">
              <div className="text-xs font-semibold text-slate-500 mb-2 flex justify-between">
                <span>{isUrdu ? `تفصیل آئٹم (${displayList.length})` : `Items (${displayList.length})`}</span>
                <span>{periodTitle}</span>
              </div>

              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600">
                    <th className="py-1.5 font-bold text-right">{isUrdu ? 'آئٹم / تاریخ' : 'Item / Date'}</th>
                    <th className="py-1.5 font-bold text-center">{isUrdu ? 'قسم' : 'Type'}</th>
                    <th className="py-1.5 font-bold text-left">{isUrdu ? `رقم (${currency})` : `Amount (${currency})`}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayList.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2 pr-1">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {item.itemName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{item.date}</span>
                          <span>{item.time}</span>
                          {item.note && <span className="italic text-slate-500">({item.note})</span>}
                        </div>
                      </td>
                      <td className="py-2 text-center">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.type === 'gave'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.type === 'gave'
                            ? isUrdu
                              ? 'دیا'
                              : 'Gave'
                            : isUrdu
                            ? 'لیا'
                            : 'Got'}
                        </span>
                      </td>
                      <td className="py-2 pl-1 text-left font-bold font-mono">
                        <span className={item.type === 'gave' ? 'text-rose-600' : 'text-emerald-600'}>
                          {item.amount.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="pt-3 border-t-2 border-dashed border-slate-300 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{isUrdu ? 'کل سامان / ادھار دیا گیا (Total Gave):' : 'Total Given:'}</span>
                <span className="font-bold text-rose-600 font-mono">
                  {currency} {totalGave.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isUrdu ? 'کل رقم وصول ہوئی (Total Received):' : 'Total Received:'}</span>
                <span className="font-bold text-emerald-600 font-mono">
                  {currency} {totalGot.toLocaleString()}
                </span>
              </div>

              {/* Net Balance Highlight */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold">
                <span>{isUrdu ? 'صافی بقایا حساب (Net Balance):' : 'Net Balance:'}</span>
                <span
                  className={`text-base font-black px-2 py-0.5 rounded ${
                    netBalance > 0
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      : netBalance < 0
                      ? 'text-rose-700 bg-rose-50 border border-rose-200'
                      : 'text-slate-700 bg-slate-100'
                  }`}
                >
                  {currency} {Math.abs(netBalance).toLocaleString()}
                </span>
              </div>

              <div className="text-[11px] text-center font-bold text-slate-700 pt-1">
                {netBalance > 0
                  ? isUrdu
                    ? `(آپ نے کسٹمر سے ${currency} ${netBalance.toLocaleString()} لینے ہیں)`
                    : `(Customer owes you: ${currency} ${netBalance.toLocaleString()})`
                  : netBalance < 0
                  ? isUrdu
                    ? `(آپ نے کسٹمر کو ${currency} ${Math.abs(netBalance).toLocaleString()} دینے ہیں)`
                    : `(You owe customer: ${currency} ${Math.abs(netBalance).toLocaleString()})`
                  : isUrdu
                  ? `(حساب بالکل برابر اور کلیئر ہے)`
                  : `(Account fully settled)`}
              </div>
            </div>

            {/* Footer Signature & Thank You */}
            <div className="mt-6 pt-4 border-t border-dashed border-slate-300 text-center">
              <div className="flex justify-between items-end text-[10px] text-slate-400 mb-4 px-2">
                <div className="border-t border-slate-400 w-28 pt-1 text-center">
                  {isUrdu ? 'دستخط گاہک' : 'Customer Sign'}
                </div>
                <div className="border-t border-slate-400 w-28 pt-1 text-center">
                  {isUrdu ? 'مہر و دستخط دکان' : 'Shop Stamp/Sign'}
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-600">
                {isUrdu ? 'کاروبار کے لیے آپ کے تعاون کا شکریہ!' : 'Thank you for your business!'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                Powered by Digital Khata Book
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 no-print shrink-0">
          <span className="text-xs text-slate-500">
            {isUrdu ? 'پرنٹ یا محفوظ کرنے کے لیے اوپر بٹن دبائیں۔' : 'Use the buttons above to Print or Save.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            {isUrdu ? 'بند کریں' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
