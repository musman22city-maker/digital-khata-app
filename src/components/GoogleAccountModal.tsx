import React, { useState } from 'react';
import {
  X,
  Mail,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Smartphone,
  HardDriveDownload,
  AlertCircle
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppSettings, Customer, Transaction } from '../types';
import { loginWithGoogle, logoutUser } from '../firebase';
import { CloudSyncState, uploadInitialDataToCloud } from '../services/khataSync';

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  syncState: CloudSyncState;
  onManualSync: () => Promise<void>;
  settings: AppSettings;
  customers: Customer[];
  transactions: Transaction[];
}

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  syncState,
  onManualSync,
  settings,
  customers,
  transactions,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isUrdu = settings.language === 'ur';

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const user = await loginWithGoogle();
      if (user) {
        // Trigger initial upload if needed
        await uploadInitialDataToCloud(user.uid, customers, transactions, settings);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await logoutUser();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign out failed.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setLoading(true);
      await onManualSync();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <Mail className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isUrdu ? 'گوگل و جی میل کلاؤڈ سنک' : 'Google Account & Cloud Storage'}
              </h3>
              <p className="text-xs text-emerald-200">
                {isUrdu ? 'خودکار کلاؤڈ بیک اپ اور بحالی' : 'Automatic cloud backup & multi-device sync'}
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

        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 break-words">{errorMsg}</div>
            </div>
          )}

          {currentUser ? (
            /* Signed In User View */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg">
                    {currentUser.displayName ? currentUser.displayName[0] : 'G'}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-sm truncate">
                      {currentUser.displayName || 'Google User'}
                    </span>
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {isUrdu ? 'تصدیق شدہ' : 'Verified'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 truncate font-mono mt-0.5">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              {/* Cloud Status details */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium">{isUrdu ? 'کلاؤڈ سٹوریج اسٹیٹس:' : 'Cloud Storage Status:'}</span>
                  </span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isUrdu ? 'آن لائن سنک فعال ہے' : 'Active & Synced'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/80 text-[11px]">
                  <span>{isUrdu ? 'آخری بار سنک ہوا:' : 'Last Synced:'}</span>
                  <span className="font-mono text-slate-700">
                    {syncState.lastSyncedAt
                      ? syncState.lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : isUrdu ? 'ابھی ابھی' : 'Just now'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>{isUrdu ? 'محفوظ شدہ کھاتے اور انٹریز:' : 'Cloud Records:'}</span>
                  <span className="font-semibold text-slate-800">
                    {customers.length} {isUrdu ? 'گاہک' : 'customers'} • {transactions.length} {isUrdu ? 'اندراج' : 'entries'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={loading}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>{isUrdu ? 'ابھی سنک کریں' : 'Sync Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300 hover:border-rose-200 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'لاگ آؤٹ' : 'Sign Out'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 text-center leading-relaxed">
                {isUrdu
                  ? 'آپ کا تمام حساب کتاب آپ کے گوگل اکاؤنٹ پر خود بخود بیک اپ ہو رہا ہے۔ کسی بھی دوسرے فون یا لیپ ٹاپ پر یہی جی میل لگائیں اور تمام ڈیٹا واپس پائیں۔'
                  : 'Your Khata entries are automatically backed up to your Google account. Log in with this Gmail on any mobile or PC to restore all your data instantly.'}
              </div>
            </div>
          ) : (
            /* Not Signed In View */
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                <Cloud className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base mb-1">
                  {isUrdu ? 'جی میل / گوگل کے ساتھ لاگ ان کریں' : 'Sign In with Google Account'}
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                  {isUrdu
                    ? 'اپنا حساب کتاب اپنے جی میل میں محفوظ بنائیں تاکہ موبائل گم ہونے یا نیا فون لینے پر ایک کلک سے تمام پرانا ڈیٹا خود بخود بحال ہو جائے۔'
                    : 'Connect your Gmail to store your Khata safely in the cloud. Switch phones anytime without losing your customer ledger.'}
                </p>
              </div>

              {/* Features list */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 text-slate-700">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isUrdu ? 'تمام موبائلز اور کمپیوٹرز پر ڈیٹا خود بخود ہم آہنگ (Sync)' : 'Instant real-time sync across all your devices'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDriveDownload className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isUrdu ? 'موبائل تبدیل کرنے پر پرانا سارا ریکارڈ محفوظ رہتا ہے' : 'Never lose customer debts or entries'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isUrdu ? 'گوگل سیکیورٹی کے تحت مکمل نجی اور محفوظ کھاتہ' : '100% private & protected by Google security'}</span>
                </div>
              </div>

              {/* Big Google Login Button */}
              <button
                type="button"
                onClick={handleSignIn}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-slate-400 rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {/* Official Google G Logo SVG */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>
                  {loading
                    ? isUrdu
                      ? 'لاگ ان ہو رہا ہے...'
                      : 'Connecting with Google...'
                    : isUrdu
                    ? 'گوگل اکاؤنٹ سے لاگ ان کریں'
                    : 'Sign in with Google'}
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
          >
            {isUrdu ? 'بند کریں' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
