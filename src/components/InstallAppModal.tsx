import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  Share2,
  MoreVertical,
  PlusSquare,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  QrCode
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { AppSettings } from '../types';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const isUrdu = settings.language === 'ur';
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-200 w-full max-w-lg overflow-hidden transform transition-all my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner shrink-0">
              <Smartphone className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {isUrdu ? 'موبائل میں انسٹال کریں (Install App)' : 'Install App on Mobile'}
              </h3>
              <p className="text-xs text-emerald-100">
                {isUrdu ? 'پلے اسٹور کے بغیر براہ راست فل اسکرین ایپ' : 'Direct Home Screen App installation'}
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Main App Showcase Card */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-2xl border border-emerald-200/80 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md shrink-0 border-2 border-emerald-500">
              <div className="text-2xl font-black">₨</div>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <span>{settings.shopName || (isUrdu ? 'ڈیجیٹل کھاتہ' : 'Digital Khata')}</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded-full">
                  PWA App
                </span>
              </h4>
              <p className="text-xs text-slate-600 leading-snug mt-0.5">
                {isUrdu
                  ? 'اینڈرائیڈ اور آئی فون پر ہوم اسکرین آئیکن کے ساتھ اصلی ایپ کی طرح کام کرے گی'
                  : 'Installs as a standalone native-style app with desktop & home screen icon'}
              </p>
            </div>
          </div>

          {/* Quick 1-Click Install Button if browser supports BeforeInstallPrompt */}
          {isInstallable && !isInstalled && (
            <button
              onClick={async () => {
                await install();
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-lg shadow-emerald-700/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 animate-pulse"
            >
              <Download className="w-5 h-5" />
              <span>{isUrdu ? 'ابھی موبائل میں انسٹال کریں (1-Click Install)' : 'Install to Home Screen Now'}</span>
            </button>
          )}

          {isInstalled && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs rounded-2xl flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>
                {isUrdu
                  ? 'یہ ایپلیکیشن پہلے ہی آپ کے سسٹم / موبائل میں انسٹال ہے!'
                  : 'App is already installed and running in standalone mode!'}
              </span>
            </div>
          )}

          {/* Step-by-Step Android Chrome Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 border-b border-slate-200 pb-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">
                1
              </span>
              <span>
                {isUrdu ? 'اینڈرائیڈ (Android / Google Chrome) کے لیے طریقہ کار:' : 'Android (Chrome) Installation Steps:'}
              </span>
            </div>

            <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside leading-relaxed">
              <li className="font-medium">
                {isUrdu ? (
                  <span>
                    اپنے موبائل فون پر گوگل کروم (Google Chrome) میں اس ایپ کو کھولیں۔
                  </span>
                ) : (
                  <span>Open this link in Google Chrome on your Android mobile.</span>
                )}
              </li>
              <li className="font-medium">
                {isUrdu ? (
                  <span>
                    اوپر دائیں کونے میں موجود <strong className="text-slate-900 font-bold">3 نقطوں (⋮ Menu)</strong> پر کلک کریں۔
                  </span>
                ) : (
                  <span>Tap the 3 vertical dots (Menu) at top right.</span>
                )}
              </li>
              <li className="font-medium">
                {isUrdu ? (
                  <span>
                    مینیو میں سے <strong className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">"Install app"</strong> یا <strong className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">"Add to Home Screen (ہوم اسکرین پر شامل کریں)"</strong> منتخب کریں۔
                  </span>
                ) : (
                  <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                )}
              </li>
              <li className="font-medium">
                {isUrdu ? (
                  <span>
                    چند سیکنڈز میں ایپ کا آئیکن آپ کی موبائل اسکرین پر بن جائے گا اور یہ بغیر براؤزر بار کے فل اسکرین ایپ بن جائے گی!
                  </span>
                ) : (
                  <span>The app icon will appear on your phone home screen with full screen experience!</span>
                )}
              </li>
            </ol>
          </div>

          {/* iPhone / Safari Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 border-b border-slate-200 pb-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px]">
                2
              </span>
              <span>
                {isUrdu ? 'آئی فون (Apple iOS / Safari) کے لیے طریقہ کار:' : 'iPhone (Safari) Steps:'}
              </span>
            </div>

            <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside leading-relaxed">
              <li className="font-medium">
                {isUrdu ? (
                  <span>سفاری (Safari Browser) میں یہ صفحہ کھولیں۔</span>
                ) : (
                  <span>Open this page in Safari browser on your iPhone.</span>
                )}
              </li>
              <li className="font-medium">
                {isUrdu ? (
                  <span>
                    نیچے موجود <strong className="text-slate-900">شیئر کے نشان (Share Icon ⎋)</strong> پر ٹیپ کریں۔
                  </span>
                ) : (
                  <span>Tap the Share icon (box with arrow) at the bottom.</span>
                )}
              </li>
              <li className="font-medium">
                {isUrdu ? (
                  <span>
                    تھوڑا نیچے سکرول کر کے <strong className="text-slate-900">"Add to Home Screen"</strong> پر کلک کریں۔
                  </span>
                ) : (
                  <span>Scroll down and select <strong>"Add to Home Screen"</strong>.</span>
                )}
              </li>
            </ol>
          </div>

          {/* App URL Share & Copy */}
          <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{isUrdu ? 'ایپ کا موبائل لنک کاپی کریں:' : 'Mobile App Link:'}</span>
              {copiedLink && (
                <span className="text-emerald-700 text-[11px] font-bold">
                  ✓ {isUrdu ? 'لنک کاپی ہو گیا!' : 'Copied!'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full bg-white text-[11px] text-slate-600 font-mono px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0 active:scale-95"
              >
                {copiedLink ? (isUrdu ? 'کاپی شدہ' : 'Copied') : (isUrdu ? 'کاپی' : 'Copy')}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              {isUrdu
                ? 'اس لنک کو واٹس ایپ پر اپنے موبائل پر بھیجیں اور گوگل کروم میں اوپن کریں۔'
                : 'Send this link to your phone via WhatsApp and open in Chrome.'}
            </p>
          </div>

          {/* Benefits Bullet Points */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{isUrdu ? 'تیز رفتار و فُل اسکرین' : 'Fast & Full Screen'}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{isUrdu ? 'گوگل کلاؤڈ محفوظ بیک اپ' : 'Google Cloud Backup'}</span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              {isUrdu ? 'بند کریں (Close)' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
