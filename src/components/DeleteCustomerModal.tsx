import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Trash2,
  ShieldAlert,
  CheckSquare,
  Square,
  Lock,
  Loader2,
  Users
} from 'lucide-react';
import { AppSettings, Customer } from '../types';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  transactionsCount: number;
  customerBalance: number;
  settings: AppSettings;
  onConfirmDelete: (customerId: string) => Promise<void> | void;
}

export const DeleteCustomerModal: React.FC<DeleteCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  transactionsCount,
  customerBalance,
  settings,
  onConfirmDelete,
}) => {
  const isUrdu = settings.language === 'ur';
  const currency = settings.currency || 'Rs.';

  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setConfirmedCheckbox(false);
      setTypedConfirmation('');
      setIsDeleting(false);
      setErrorMsg(null);
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  // The user must type "DELETE" or "حذف"
  const isMatch =
    typedConfirmation.trim().toUpperCase() === 'DELETE' ||
    typedConfirmation.trim() === 'حذف';

  const isDeleteAllowed = confirmedCheckbox && isMatch && !isDeleting;

  const handleDelete = async () => {
    if (!isDeleteAllowed) return;

    // Final safety confirmation prompt
    const secondPrompt = isUrdu
      ? `کیا آپ 100% پراعتماد ہیں کہ آپ "${customer.name}" اور اس کے تمام ${transactionsCount} اندراجات ہمیشہ کے لیے ڈیلیٹ کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا۔`
      : `Are you 100% certain you want to permanently delete "${customer.name}" and all ${transactionsCount} entries? This cannot be undone.`;

    if (!window.confirm(secondPrompt)) {
      return;
    }

    try {
      setIsDeleting(true);
      setErrorMsg(null);
      await onConfirmDelete(customer.id);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Customer deletion failed');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto select-none">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-rose-300 w-full max-w-md overflow-hidden transform transition-all my-auto animate-fadeIn">
        {/* Header with High-Alert Warning */}
        <div className="p-4 bg-gradient-to-r from-rose-700 via-rose-600 to-red-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner shrink-0">
              <ShieldAlert className="w-6 h-6 text-rose-100" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {isUrdu ? 'گاہک اور مکمل ڈیٹا کا مستقل اخراج' : 'Delete Customer & All Data'}
              </h3>
              <p className="text-xs text-rose-100">
                {isUrdu ? 'حساس مالیاتی ریکارڈز ڈیلیٹ کرنے کا محفوظ عمل' : 'Irreversible ledger deletion process'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Target Customer Info Box */}
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-800">
                {isUrdu ? 'مطلوبہ کھاتہ دار:' : 'Target Customer:'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-bold">
                {transactionsCount} {isUrdu ? 'اندراجات' : 'entries'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {customer.name.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-sm truncate">{customer.name}</h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  {customer.phone || (isUrdu ? 'فون نمبر موجود نہیں' : 'No phone')} {customer.city ? `• ${customer.city}` : ''}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600">{isUrdu ? 'موجودہ خالص بقایا بیلنس:' : 'Net Balance:'}</span>
              <span
                className={`font-black font-mono ${
                  customerBalance > 0
                    ? 'text-rose-700'
                    : customerBalance < 0
                    ? 'text-emerald-700'
                    : 'text-slate-700'
                }`}
              >
                {currency} {Math.abs(customerBalance).toLocaleString()}
                <span className="text-[10px] font-normal ml-1">
                  {customerBalance > 0
                    ? isUrdu ? '(لینا ہے)' : '(Receivable)'
                    : customerBalance < 0
                    ? isUrdu ? '(دینا ہے)' : '(Payable)'
                    : isUrdu ? '(صاف)' : '(Clear)'}
                </span>
              </span>
            </div>
          </div>

          {/* Critical Warning Callout */}
          <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block font-bold">
                {isUrdu ? '⚠️ انتہائی اہم انتباہ:' : '⚠️ Critical Warning:'}
              </strong>
              {isUrdu
                ? 'اس گاہک کو ڈیلیٹ کرنے سے اس کا تمام سابقہ حساب، لین دین، رسیدیں اور ڈیٹابیس کا کلاؤڈ ریکارڈ مستقل طور پر مٹ جائے گا اور بعد میں کبھی بھی واپس نہیں لایا جا سکے گا۔'
                : 'Deleting this customer permanently erases their full ledger history, all past transactions, receipts, and cloud database records. This cannot be undone.'}
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-100 border border-rose-300 text-rose-800 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Safety Check 1: Mandatory Acknowledgement Checkbox */}
          <button
            type="button"
            onClick={() => setConfirmedCheckbox(!confirmedCheckbox)}
            className={`w-full p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
              confirmedCheckbox
                ? 'bg-rose-50/80 border-rose-400 text-rose-950'
                : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {confirmedCheckbox ? (
                <CheckSquare className="w-5 h-5 text-rose-600" />
              ) : (
                <Square className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="text-xs leading-snug">
              <span className="font-bold block mb-0.5">
                {isUrdu ? 'مستقل خاتمے کی توثیق:' : 'Step 1: Acknowledge Deletion'}
              </span>
              <span className="text-slate-600 text-[11px]">
                {isUrdu
                  ? 'میں سمجھتا/سمجھتی ہوں کہ اس کھاتے دار کا تمام ڈیٹا کلاؤڈ اور فون سے مکمل صاف ہو جائے گا۔'
                  : 'I confirm that this customer and all their ledger history will be permanently deleted.'}
              </span>
            </div>
          </button>

          {/* Safety Check 2: Type "DELETE" */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              {isUrdu ? (
                <span>
                  مرحلہ 2: تصدیق کے لیے نیچے دیے گئے خانے میں{' '}
                  <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-mono">
                    DELETE
                  </span>{' '}
                  لکھیں:
                </span>
              ) : (
                <span>
                  Step 2: Type{' '}
                  <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-mono">
                    DELETE
                  </span>{' '}
                  to confirm:
                </span>
              )}
            </label>

            <input
              type="text"
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              placeholder={isUrdu ? 'یہاں DELETE ٹائپ کریں...' : 'Type DELETE here...'}
              disabled={!confirmedCheckbox || isDeleting}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm font-mono transition focus:outline-none ${
                !confirmedCheckbox
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : isMatch
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold focus:ring-2 focus:ring-emerald-400'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
              }`}
            />

            {confirmedCheckbox && !isMatch && typedConfirmation.length > 0 && (
              <p className="text-[11px] text-rose-600 font-medium">
                {isUrdu ? 'براہ کرم بالکل DELETE لکھیں' : 'Must match "DELETE"'}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="py-3 px-4 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer disabled:opacity-50"
            >
              {isUrdu ? 'منسوخ کریں (Cancel)' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={!isDeleteAllowed}
              className={`py-3 px-4 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${
                isDeleteAllowed
                  ? 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isUrdu ? 'ڈیلیٹ ہو رہا ہے...' : 'Deleting...'}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>{isUrdu ? 'مکمل ڈیلیٹ کریں' : 'Delete Permanently'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
