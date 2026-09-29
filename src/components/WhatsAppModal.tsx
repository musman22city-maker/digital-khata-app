import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare } from 'lucide-react';
import { AppSettings, Customer, Transaction } from '../types';
import { buildWhatsAppMessage } from '../utils/export';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  transactions: Transaction[];
  settings: AppSettings;
  periodTitle: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  customer,
  transactions,
  settings,
  periodTitle,
}) => {
  const [copied, setCopied] = useState(false);
  const isUrdu = settings.language === 'ur';

  if (!isOpen || !customer) return null;

  const messageText = buildWhatsAppMessage(customer, transactions, settings, periodTitle);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    let url = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
    if (cleanPhone) {
      // standard international format
      const formattedPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
      url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isUrdu ? 'واٹس ایپ پر حساب کتاب شیئر کریں' : 'Share Statement via WhatsApp'}
              </h3>
              <p className="text-xs text-emerald-200">
                {customer.name} ({customer.phone || 'No phone'})
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

        <div className="p-4 sm:p-5 space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            {isUrdu ? 'پیغام کا پیش نظارہ (Message Preview):' : 'Message Preview:'}
          </label>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
            {messageText}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleCopy}
              className="py-2.5 px-3 rounded-2xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : (isUrdu ? 'کاپی کریں' : 'Copy Text')}</span>
            </button>

            <button
              onClick={handleSend}
              className="py-2.5 px-3 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>{isUrdu ? 'واٹس ایپ کھولیں' : 'Open WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
