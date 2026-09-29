import React, { useState, useRef } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Store,
  User as UserIcon,
  Phone,
  MapPin,
  Coins,
  Download,
  Upload,
  RotateCcw,
  Check,
  Save,
  Languages,
  Cloud,
  FileJson,
  ShieldCheck,
  HardDrive,
  Copy,
  AlertCircle,
  FileCheck,
  HelpCircle,
  RefreshCw,
  Lock,
  Unlock,
  Fingerprint,
  KeyRound,
  Smartphone
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppSettings, Customer, Transaction } from '../types';
import {
  BackupData,
  generateBackupJSON,
  validateBackupJSON,
} from '../utils/storage';
import { checkBiometricsAvailability } from '../utils/security';
import { DeleteCustomerModal } from './DeleteCustomerModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  customers: Customer[];
  transactions: Transaction[];
  currentUser: User | null;
  onOpenGoogleAccount: () => void;
  onSaveSettings: (settings: AppSettings) => void;
  onResetData: () => void;
  onRestoreBackup: (backup: BackupData, mode: 'replace' | 'merge') => void;
  onLockApp?: () => void;
  onDeleteCustomer?: (customerId: string) => Promise<void> | void;
  onOpenInstallApp?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  customers,
  transactions,
  currentUser,
  onOpenGoogleAccount,
  onSaveSettings,
  onResetData,
  onRestoreBackup,
  onLockApp,
  onDeleteCustomer,
  onOpenInstallApp,
}) => {
  const isUrdu = settings.language === 'ur';

  // Form states
  const [shopName, setShopName] = useState(settings.shopName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [shopPhone, setShopPhone] = useState(settings.shopPhone);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [currency, setCurrency] = useState(settings.currency);
  const [language, setLanguage] = useState<'en' | 'ur'>(settings.language);

  // Security / App Lock states
  const [lockEnabled, setLockEnabled] = useState(settings.lockEnabled || false);
  const [passcode, setPasscode] = useState(settings.passcode || '');
  const [confirmPasscode, setConfirmPasscode] = useState(settings.passcode || '');
  const [biometricEnabled, setBiometricEnabled] = useState(settings.biometricEnabled || false);
  const [lockValidationError, setLockValidationError] = useState<string | null>(null);

  // Customer Management & Deletion state
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  // Backup & Restore states
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [stagedBackup, setStagedBackup] = useState<BackupData | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [importError, setImportError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLockValidationError(null);

    if (lockEnabled) {
      const cleanPasscode = passcode.trim();
      if (!/^\d{4}$/.test(cleanPasscode)) {
        setLockValidationError(
          isUrdu ? 'پن کوڈ میں لازمی 4 ہندسے ہونے چاہئیں (مثلاً 1234)' : 'Passcode PIN must be exactly 4 digits (e.g. 1234)'
        );
        return;
      }
      if (cleanPasscode !== confirmPasscode.trim()) {
        setLockValidationError(
          isUrdu ? 'دونوں پن کوڈز کا آپس میں ملنا ضروری ہے' : 'Passcodes do not match'
        );
        return;
      }
    }

    onSaveSettings({
      ...settings,
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      shopPhone: shopPhone.trim(),
      shopAddress: shopAddress.trim(),
      currency: currency.trim() || 'Rs.',
      language,
      lockEnabled,
      passcode: lockEnabled ? passcode.trim() : '',
      biometricEnabled: lockEnabled ? biometricEnabled : false,
    });
    onClose();
  };

  // Local JSON Export Handler
  const handleExportJSON = () => {
    try {
      const jsonStr = generateBackupJSON(
        {
          ...settings,
          shopName: shopName.trim() || settings.shopName,
          ownerName: ownerName.trim() || settings.ownerName,
          shopPhone: shopPhone.trim() || settings.shopPhone,
          shopAddress: shopAddress.trim() || settings.shopAddress,
          currency: currency.trim() || settings.currency,
          language,
        },
        customers,
        transactions
      );

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      const safeShopName = (shopName || 'Khata').replace(/[^a-zA-Z0-9]/g, '_');

      link.href = url;
      link.download = `${safeShopName}_Backup_${dateStr}_${timeStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotice(
        isUrdu
          ? `بیک اپ ڈاؤن لوڈ ہو گیا! (${customers.length} گاہک، ${transactions.length} لین دین)`
          : `Backup downloaded! (${customers.length} customers, ${transactions.length} entries)`
      );
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  // Copy JSON string to clipboard (for easy transfer)
  const handleCopyJSON = () => {
    try {
      const jsonStr = generateBackupJSON(settings, customers, transactions);
      navigator.clipboard.writeText(jsonStr);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    } catch {
      // ignore
    }
  };

  // Handle file selection for JSON import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setRestoreSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = validateBackupJSON(content);

      if (!validation.valid || !validation.data) {
        setImportError(
          validation.error || (isUrdu ? 'فائل درست کھاتہ بیک اپ نہیں ہے' : 'Invalid backup JSON file')
        );
        setStagedBackup(null);
      } else {
        setStagedBackup(validation.data);
      }
    };

    reader.onerror = () => {
      setImportError(isUrdu ? 'فائل پڑھنے میں مسئلہ ہوا' : 'Failed to read file');
      setStagedBackup(null);
    };

    reader.readAsText(file);

    // Reset input so same file can be re-selected if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Confirm and apply the staged restore
  const handleConfirmRestore = () => {
    if (!stagedBackup) return;

    try {
      onRestoreBackup(stagedBackup, restoreMode);

      setRestoreSuccess(
        isUrdu
          ? `کامیابی سے بحال ہو گیا! (${stagedBackup.customers.length} گاہک، ${stagedBackup.transactions.length} اندراج)`
          : `Restored successfully! (${stagedBackup.customers.length} customers, ${stagedBackup.transactions.length} entries)`
      );

      // Update current form inputs to match restored settings
      if (stagedBackup.settings) {
        setShopName(stagedBackup.settings.shopName || shopName);
        setOwnerName(stagedBackup.settings.ownerName || ownerName);
        setShopPhone(stagedBackup.settings.shopPhone || shopPhone);
        setShopAddress(stagedBackup.settings.shopAddress || shopAddress);
        setCurrency(stagedBackup.settings.currency || currency);
        setLanguage(stagedBackup.settings.language || language);
      }

      setStagedBackup(null);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isUrdu ? 'کھاتہ کی ترتیبات اور بیک اپ' : 'Settings & Local Backup'}
              </h3>
              <p className="text-xs text-slate-400">
                {isUrdu ? 'دکان کی تفصیلات، کلاؤڈ اور لوکل بیک اپ' : 'Store details, cloud sync & offline JSON fail-safe'}
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Mobile App Installation Banner */}
          {onOpenInstallApp && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-2xl shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-emerald-200" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm leading-tight text-white">
                    {isUrdu ? 'موبائل میں اصلی ایپ کی طرح انسٹال کریں' : 'Install on Mobile Phone'}
                  </h4>
                  <p className="text-[11px] text-emerald-200 truncate">
                    {isUrdu ? 'اینڈرائیڈ اور آئی فون کیلئے فوری ہوم اسکرین ایپ' : 'Fast standalone home screen app for Android & iOS'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInstallApp();
                }}
                className="py-1.5 px-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 shadow-xs active:scale-95"
              >
                {isUrdu ? 'انسٹال کریں' : 'Install'}
              </button>
            </div>
          )}

          {/* Cloud Sync Status Banner */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-xs text-slate-800">
                  {isUrdu ? 'گوگل و جی میل کلاؤڈ سنک' : 'Google & Gmail Cloud Sync'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGoogleAccount();
                }}
                className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-xl transition cursor-pointer shadow-2xs"
              >
                {currentUser ? (isUrdu ? 'اکاؤنٹ کھولیں' : 'Manage Account') : (isUrdu ? 'لاگ ان کریں' : 'Connect Gmail')}
              </button>
            </div>

            <p className="text-[11px] text-slate-600">
              {currentUser ? (
                <span>
                  {isUrdu ? 'منسلک جی میل اکاؤنٹ:' : 'Connected Gmail:'}{' '}
                  <strong className="font-mono text-emerald-800">{currentUser.email}</strong>. {isUrdu ? 'آپ کا کھاتہ خود بخود کلاؤڈ پر محفوظ ہو رہا ہے۔' : 'Your data is synced automatically.'}
                </span>
              ) : (
                isUrdu
                  ? 'اپنے جی میل سے لاگ ان کریں تاکہ کلاؤڈ میں خودکار سنک فعال ہو سکے، یا نیچے سے دستی لوکل JSON بیک اپ محفوظ کریں۔'
                  : 'Connect your Gmail for automatic multi-device sync, or use the local JSON backup below as an offline fail-safe.'
              )}
            </p>
          </div>

          {/* LOCAL JSON EXPORT & IMPORT FAIL-SAFE SECTION */}
          <div className="p-4 bg-slate-50 border border-slate-300/80 rounded-3xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                    {isUrdu ? 'لوکل JSON بیک اپ و بحالی (Fail-Safe)' : 'Local JSON Backup & Restore (Fail-safe)'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isUrdu
                      ? 'تمام ڈیٹا کو ایک محفوظ فائل کے طور پر اپنے موبائل یا کمپیوٹر میں ڈاؤن لوڈ اور بعد میں بحال کریں۔'
                      : 'Manually export your entire app data to a file on your device and restore it anytime.'}
                  </p>
                </div>
              </div>

              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full shrink-0">
                Offline
              </span>
            </div>

            {/* Notification messages */}
            {exportNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5 font-medium animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{exportNotice}</span>
              </div>
            )}

            {restoreSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5 font-medium animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{restoreSuccess}</span>
              </div>
            )}

            {importError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-start gap-1.5 font-medium animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {/* Current data stats indicator */}
            <div className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
              <span>{isUrdu ? 'موجودہ ڈیٹا سائز:' : 'Current In-App Data:'}</span>
              <span className="font-semibold text-slate-900">
                {customers.length} {isUrdu ? 'گاہک' : 'Customers'} • {transactions.length} {isUrdu ? 'اندراج' : 'Transactions'}
              </span>
            </div>

            {/* Two Action Buttons: Export & Import */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* EXPORT BUTTON */}
              <button
                type="button"
                onClick={handleExportJSON}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>{isUrdu ? 'بیک اپ فائل ڈاؤن لوڈ کریں' : 'Export JSON Backup'}</span>
              </button>

              {/* IMPORT FILE SELECTOR */}
              <label className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-98 text-center">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>{isUrdu ? 'بیک اپ فائل اپلوڈ کریں' : 'Import JSON File'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {isUrdu ? 'کلاؤڈ بند ہونے پر بھی محفوظ' : 'Works 100% offline & portable'}
              </span>
              <button
                type="button"
                onClick={handleCopyJSON}
                className="text-slate-600 hover:text-emerald-700 underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedNotice ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : (isUrdu ? 'JSON ٹیکسٹ کاپی کریں' : 'Copy JSON')}</span>
              </button>
            </div>

            {/* STAGED RESTORE PREVIEW & CONFIRMATION CARD */}
            {stagedBackup && (
              <div className="p-3.5 bg-amber-50/90 border-2 border-amber-300 rounded-2xl space-y-3 mt-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <FileCheck className="w-4 h-4 text-amber-600" />
                    <span>{isUrdu ? 'بیک اپ فائل کی تفصیلات (Preview)' : 'Backup File Preview'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStagedBackup(null)}
                    className="text-amber-800 hover:text-amber-950 text-xs p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                  <div>
                    <span className="text-slate-400 block">{isUrdu ? 'دکان:' : 'Store Name:'}</span>
                    <span className="font-bold text-slate-900 truncate block">
                      {stagedBackup.settings?.shopName || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isUrdu ? 'تاریخ بیک اپ:' : 'Exported Date:'}</span>
                    <span className="font-mono text-slate-800">
                      {stagedBackup.exportDate ? new Date(stagedBackup.exportDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isUrdu ? 'گاہکوں کی تعداد:' : 'Customers Count:'}</span>
                    <span className="font-bold text-emerald-700">
                      {stagedBackup.customers.length} {isUrdu ? 'کھاتے دار' : 'parties'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isUrdu ? 'لین دین کی تعداد:' : 'Transactions Count:'}</span>
                    <span className="font-bold text-emerald-700">
                      {stagedBackup.transactions.length} {isUrdu ? 'اندراج' : 'entries'}
                    </span>
                  </div>
                </div>

                {/* Restore Mode Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1.5">
                    {isUrdu ? 'بحالی کا طریقہ منتخب کریں:' : 'Select Restore Mode:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreMode('replace')}
                      className={`p-2 rounded-xl text-xs font-semibold border transition text-left cursor-pointer ${
                        restoreMode === 'replace'
                          ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-400/20'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${restoreMode === 'replace' ? 'bg-rose-600' : 'bg-slate-300'}`}></span>
                        {isUrdu ? 'مکمل اوور رائٹ' : 'Replace All'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {isUrdu ? 'موجودہ ڈیٹا مٹا کر فائل والا ڈیٹا لائے گا' : 'Overwrites current data completely'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRestoreMode('merge')}
                      className={`p-2 rounded-xl text-xs font-semibold border transition text-left cursor-pointer ${
                        restoreMode === 'merge'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-400/20'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${restoreMode === 'merge' ? 'bg-emerald-600' : 'bg-slate-300'}`}></span>
                        {isUrdu ? 'مرج (ملاوٹ کریں)' : 'Merge Data'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {isUrdu ? 'موجودہ بھی رکھے گا اور نئے بھی جوڑے گا' : 'Combines without deleting existing'}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Confirm Button */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {isUrdu
                        ? `تصدیق کریں: ${stagedBackup.customers.length} گاہک بحال کریں`
                        : `Confirm & Restore Data`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStagedBackup(null)}
                    className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    {isUrdu ? 'منسوخ' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* APP SECURITY: BIOMETRIC & PASSCODE LOCK SECTION */}
          <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl space-y-3.5 shadow-md border border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${lockEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
                  {lockEnabled ? <Lock className="w-5 h-5 text-emerald-400" /> : <Unlock className="w-5 h-5 text-slate-400" />}
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white leading-tight">
                    {isUrdu ? 'ایپ سیکیورٹی و پاس کوڈ لاک' : 'App Security & Passcode Lock'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isUrdu
                      ? 'ایپ کھولنے پر حساس مالیاتی ریکارڈز محفوظ رکھنے کے لیے پن کوڈ اور بائیومیٹرک لاک'
                      : 'Protect sensitive ledger data upon opening the app'}
                  </p>
                </div>
              </div>

              {/* Master Lock Toggle */}
              <button
                type="button"
                onClick={() => {
                  setLockEnabled(!lockEnabled);
                  if (!lockEnabled && !passcode) {
                    setPasscode('1234');
                    setConfirmPasscode('1234');
                  }
                  setLockValidationError(null);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  lockEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    lockEnabled ? (isUrdu ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {lockValidationError && (
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-1.5 font-medium animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{lockValidationError}</span>
              </div>
            )}

            {lockEnabled && (
              <div className="space-y-3 pt-1 border-t border-slate-800 animate-fadeIn">
                {/* 4-Digit Passcode Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-emerald-400" />
                      <span>{isUrdu ? '4 ہندسوں کا پن کوڈ بنائیں:' : 'Set 4-Digit PIN:'}</span>
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={passcode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPasscode(val);
                      }}
                      placeholder="1234"
                      className="w-full bg-slate-800 text-emerald-400 font-mono font-bold text-center tracking-widest text-base px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>{isUrdu ? 'پن کوڈ کی دوبارہ تصدیق:' : 'Confirm 4-Digit PIN:'}</span>
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={confirmPasscode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setConfirmPasscode(val);
                      }}
                      placeholder="1234"
                      className="w-full bg-slate-800 text-emerald-400 font-mono font-bold text-center tracking-widest text-base px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Biometric Toggle Switch */}
                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">
                        {isUrdu ? 'فنگر پرنٹ / بائیومیٹرک ان لاک' : 'Fingerprint / Biometric Unlock'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isUrdu
                          ? 'موبائل کے فنگر پرنٹ سینسر سے فوری کھاتہ ان لاک کریں'
                          : 'Unlock instantly with device fingerprint sensor'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBiometricEnabled(!biometricEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      biometricEnabled ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        biometricEnabled ? (isUrdu ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Lock Immediately / Test Button */}
                {onLockApp && (
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {isUrdu ? 'ابھی چیک کریں کہ لاک کیسے کام کرتا ہے:' : 'Test lock screen now:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onSaveSettings({
                          ...settings,
                          lockEnabled: true,
                          passcode: passcode.trim() || '1234',
                          biometricEnabled,
                        });
                        onClose();
                        onLockApp();
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isUrdu ? 'ابھی ایپ لاک کریں' : 'Lock App Now'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-slate-500" />
              <span>{isUrdu ? 'زبان کا انتخاب (Default Language):' : 'Application Language:'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  language === 'en'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>English (Default)</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ur')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  language === 'ur'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>اردو (Urdu)</span>
              </button>
            </div>
          </div>

          {/* Shop Information fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isUrdu ? 'دکان یا کاروبار کا نام:' : 'Business / Shop Name:'}</span>
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{isUrdu ? 'مالک کا نام:' : 'Owner Name:'}</span>
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-slate-500" />
                <span>{isUrdu ? 'کرنسی کی علامت:' : 'Currency Symbol:'}</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Rs.">Rs. (روپے)</option>
                <option value="PKR">PKR (پاکستانی روپیہ)</option>
                <option value="SAR">SAR (سعودی ریال)</option>
                <option value="AED">AED (اماراتی درہم)</option>
                <option value="$">$ (US Dollar)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{isUrdu ? 'رابطہ فون نمبر (رسیدوں کے لیے):' : 'Phone Number:'}</span>
            </label>
            <input
              type="text"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{isUrdu ? 'دکان کا پتہ / شہر:' : 'Shop Address / Location:'}</span>
            </label>
            <input
              type="text"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* MANAGE & DELETE CUSTOMERS SECTION */}
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-3xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                    {isUrdu ? 'گاہکوں کا ریکارڈ و مستقل اخراج' : 'Customer Ledger Management & Deletion'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isUrdu
                      ? 'کسی بھی گاہک کا کھاتہ اور تمام لین دین ڈیٹا بیس سے مکمل ڈیلیٹ کریں'
                      : 'Safely erase customer profile and all their transactions'}
                  </p>
                </div>
              </div>

              <span className="text-[11px] bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded-full shrink-0">
                {customers.length} {isUrdu ? 'گاہک' : 'Customers'}
              </span>
            </div>

            {/* Quick Customer Search inside Settings */}
            {customers.length > 3 && (
              <div className="relative">
                <input
                  type="text"
                  placeholder={isUrdu ? 'گاہک تلاش کریں...' : 'Search customer to manage...'}
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-white text-xs text-slate-900 px-3 py-1.5 rounded-xl border border-rose-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                {customerSearch && (
                  <button
                    type="button"
                    onClick={() => setCustomerSearch('')}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Customer List with Delete Actions */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-rose-100 pr-0.5">
              {customers
                .filter(
                  (c) =>
                    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    (c.phone && c.phone.includes(customerSearch))
                )
                .map((c) => {
                  let gave = 0;
                  let got = 0;
                  let count = 0;
                  transactions.forEach((tx) => {
                    if (tx.customerId === c.id) {
                      if (tx.type === 'gave') gave += tx.amount;
                      else got += tx.amount;
                      count += 1;
                    }
                  });
                  const net = gave - got;

                  return (
                    <div
                      key={c.id}
                      className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-rose-100/50 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({count} {isUrdu ? 'اندراج' : 'tx'})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          {c.phone && <span>{c.phone}</span>}
                          <span
                            className={`font-mono font-semibold ${
                              net > 0 ? 'text-rose-700' : net < 0 ? 'text-emerald-700' : 'text-slate-600'
                            }`}
                          >
                            {currency} {Math.abs(net).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Delete button triggering secure DeleteCustomerModal */}
                      <button
                        type="button"
                        onClick={() => setCustomerToDelete(c)}
                        className="py-1 px-2.5 bg-white hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 hover:border-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 shrink-0"
                        title={isUrdu ? 'گاہک اور تمام ڈیٹا ڈیلیٹ کریں' : 'Delete Customer & All Data'}
                      >
                        <RotateCcw className="w-3 h-3 hidden" />
                        <span>{isUrdu ? 'حذف کریں' : 'Delete'}</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(isUrdu ? 'کیا آپ واقعی ابتدائی نمونہ ڈیٹا دوبارہ بحال کرنا چاہتے ہیں؟' : 'Reset to initial sample data? This will clear local edits.')) {
                  onResetData();
                  onClose();
                }
              }}
              className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isUrdu ? 'ابتدائی نمونہ ڈیٹا بحال کریں (Reset Sample Data)' : 'Reset Sample Data'}</span>
            </button>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isUrdu ? 'ترتیبات محفوظ کریں' : 'Save Settings'}</span>
            </button>
          </div>
        </form>

        {/* Delete Customer Confirmation Modal */}
        {customerToDelete && (
          <DeleteCustomerModal
            isOpen={Boolean(customerToDelete)}
            onClose={() => setCustomerToDelete(null)}
            customer={customerToDelete}
            transactionsCount={
              transactions.filter((tx) => tx.customerId === customerToDelete.id).length
            }
            customerBalance={(() => {
              let gave = 0;
              let got = 0;
              transactions.forEach((tx) => {
                if (tx.customerId === customerToDelete.id) {
                  if (tx.type === 'gave') gave += tx.amount;
                  else got += tx.amount;
                }
              });
              return gave - got;
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
