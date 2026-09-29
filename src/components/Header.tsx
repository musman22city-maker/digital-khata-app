import React, { useState } from 'react';
import {
  Store,
  Users,
  Volume2,
  VolumeX,
  Settings,
  Languages,
  PlusCircle,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  Search,
  Sparkles,
  Smartphone,
  Cloud,
  Lock,
  Bell
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppSettings, Customer } from '../types';

interface HeaderProps {
  settings: AppSettings;
  customers: Customer[];
  activeCustomer: Customer | null;
  currentUser: User | null;
  dueRemindersCount?: number;
  onOpenGoogleAccount: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onOpenNewCustomer: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onToggleLanguage: () => void;
  onOpenExport: () => void;
  onOpenReceipt: () => void;
  isAndroidView: boolean;
  onToggleAndroidView: () => void;
  onLockApp?: () => void;
  onOpenInstallApp?: () => void;
  onOpenReminderModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  customers,
  activeCustomer,
  currentUser,
  dueRemindersCount = 0,
  onOpenGoogleAccount,
  onSelectCustomer,
  onOpenNewCustomer,
  onOpenSettings,
  onToggleSound,
  onToggleLanguage,
  onOpenExport,
  onOpenReceipt,
  isAndroidView,
  onToggleAndroidView,
  onLockApp,
  onOpenInstallApp,
  onOpenReminderModal,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isUrdu = settings.language === 'ur';

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <header className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-lg sticky top-0 z-30">
      {/* Android Top Status Bar Simulation */}
      <div className="px-4 py-1.5 flex items-center justify-between text-xs text-emerald-100/80 border-b border-emerald-600/30 font-mono">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-wider">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-300">
            4G LTE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleAndroidView}
            title={isAndroidView ? "Switch to Wide Layout" : "Switch to Android Mobile View"}
            className="flex items-center gap-1 text-[11px] bg-emerald-900/50 hover:bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded transition cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isAndroidView ? 'Full View' : 'Android Frame'}</span>
          </button>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
            <span className="text-[11px] font-sans">آن لائن کھاتہ</span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Shop branding */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-inner shrink-0 text-emerald-200">
              <Store className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-tight truncate text-white drop-shadow-sm flex items-center gap-1.5">
                {settings.shopName || (isUrdu ? 'ڈیجیٹل کھاتہ' : 'Digital Khata')}
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.2 rounded-full font-normal">
                  PRO
                </span>
              </h1>
              <p className="text-[11px] text-emerald-200/80 truncate">
                {settings.ownerName} • {isUrdu ? 'حساب کتاب بک' : 'Ledger Book'}
              </p>
            </div>
          </div>

          {/* Quick tool actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenReceipt}
              title={isUrdu ? "رسید دیکھیں و پرنٹ کریں" : "View & Print Receipt"}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenExport}
              title={isUrdu ? "پی ڈی ایف / ایکسل رپورٹ" : "Export PDF & Excel"}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 transition active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleSound}
              title={settings.soundEnabled ? "آواز بند کریں" : "آواز آن کریں"}
              className={`p-2 rounded-xl transition cursor-pointer active:scale-95 ${
                settings.soundEnabled
                  ? 'bg-emerald-500/30 text-emerald-200'
                  : 'bg-white/5 text-slate-300'
              }`}
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onToggleLanguage}
              title="Change Language (English / اردو)"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer font-bold text-xs"
            >
              {isUrdu ? 'EN' : 'اردو'}
            </button>

            {/* Google Account / Cloud Sync Button */}
            <button
              onClick={onOpenGoogleAccount}
              title={
                currentUser
                  ? isUrdu
                    ? `گوگل سنک فعال ہے: ${currentUser.email}`
                    : `Google Cloud Synced: ${currentUser.email}`
                  : isUrdu
                  ? 'گوگل / جی میل کے ساتھ لاگ ان کریں'
                  : 'Sign in with Google'
              }
              className={`p-1.5 rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center relative ${
                currentUser
                  ? 'bg-emerald-500/30 border border-emerald-400/40 text-white'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              {currentUser?.photoURL ? (
                <div className="relative">
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google'}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 ring-1 ring-emerald-950"></span>
                </div>
              ) : currentUser ? (
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {currentUser.displayName ? currentUser.displayName[0] : 'G'}
                </div>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
            </button>

            {/* Recurring Payment Reminder quick action button */}
            {onOpenReminderModal && (
              <button
                type="button"
                onClick={onOpenReminderModal}
                title={
                  dueRemindersCount > 0
                    ? isUrdu
                      ? `${dueRemindersCount} گاہکوں کی ادائیگی کی تاریخ آ گئی ہے!`
                      : `${dueRemindersCount} payment reminders due!`
                    : isUrdu
                    ? 'تکراری ادائیگی یاد دہانی'
                    : 'Recurring Payment Reminders'
                }
                className={`p-2 rounded-xl transition cursor-pointer active:scale-95 relative ${
                  dueRemindersCount > 0
                    ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-emerald-200'
                }`}
              >
                <Bell className="w-4 h-4" />
                {dueRemindersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-emerald-800">
                    {dueRemindersCount}
                  </span>
                )}
              </button>
            )}

            {/* Quick Lock Button if Lock is enabled */}
            {settings.lockEnabled && onLockApp && (
              <button
                onClick={onLockApp}
                title={isUrdu ? "ایپ لاک کریں" : "Lock App"}
                className="p-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 transition active:scale-95 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-rose-300" />
              </button>
            )}

            {/* Install App on Phone button */}
            {onOpenInstallApp && (
              <button
                onClick={onOpenInstallApp}
                title={isUrdu ? "موبائل میں ایپ انسٹال کریں" : "Install App on Phone"}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/50 text-white border border-emerald-400/40 transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs font-bold text-xs"
              >
                <Smartphone className="w-4 h-4 text-emerald-300" />
                <span className="hidden sm:inline">{isUrdu ? 'انسٹال' : 'Install'}</span>
              </button>
            )}

            <button
              onClick={onOpenSettings}
              title={isUrdu ? "ترتیبات" : "Settings"}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customer Selector Bar */}
        <div className="mt-3 relative">
          <div className="bg-emerald-900/50 backdrop-blur-md rounded-2xl p-1.5 border border-emerald-500/30 flex items-center justify-between gap-2 shadow-inner">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 transition flex-1 text-right min-w-0 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow">
                {activeCustomer ? activeCustomer.name.slice(0, 1).toUpperCase() : '؟'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-emerald-300 font-medium">
                  {isUrdu ? 'منتخب کسٹمر / کھاتہ دار:' : 'Active Customer:'}
                </div>
                <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                  {activeCustomer ? activeCustomer.name : (isUrdu ? 'کسٹمر منتخب کریں' : 'Select Customer')}
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                </div>
              </div>
            </button>

            <button
              onClick={onOpenNewCustomer}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition shadow-sm active:scale-95 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'نیا گاہک' : 'Add Party'}</span>
            </button>
          </div>

          {/* Customer Dropdown with Search */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-lg border border-slate-700/80 rounded-2xl shadow-2xl z-50 p-2 text-slate-100 max-h-80 flex flex-col">
              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={isUrdu ? "گاہک کا نام یا فون تلاش کریں..." : "Search customer by name or phone..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800/90 text-xs text-white pr-9 pl-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
                {filteredCustomers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    {isUrdu ? 'کوئی گاہک نہیں ملا' : 'No customer found'}
                  </div>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isSelected = activeCustomer?.id === cust.id;
                    return (
                      <button
                        key={cust.id}
                        onClick={() => {
                          onSelectCustomer(cust);
                          setDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full p-2.5 text-right flex items-center justify-between rounded-xl transition cursor-pointer ${
                          isSelected ? 'bg-emerald-600/30 text-emerald-300 font-bold' : 'hover:bg-slate-800/80 text-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-sm truncate">{cust.name}</div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {cust.phone || (isUrdu ? 'فون درج نہیں' : 'No phone')} • {cust.city || (isUrdu ? 'شہر درج نہیں' : 'No city')}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                            {isUrdu ? 'فعال' : 'Active'}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400 text-[11px]">
                  {customers.length} {isUrdu ? 'کل کھاتے' : 'Total Customers'}
                </span>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenNewCustomer();
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'نیا کھاتہ شامل کریں' : '+ New Customer'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
