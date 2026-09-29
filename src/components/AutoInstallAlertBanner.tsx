import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  X,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { AppSettings } from '../types';

interface AutoInstallAlertBannerProps {
  settings: AppSettings;
  onOpenDetailedGuide: () => void;
}

export const AutoInstallAlertBanner: React.FC<AutoInstallAlertBannerProps> = ({
  settings,
  onOpenDetailedGuide,
}) => {
  const isUrdu = settings.language === 'ur';
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [isDismissedThisSession, setIsDismissedThisSession] = useState(false);
  const [hasEverInstalled, setHasEverInstalled] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  useEffect(() => {
    // Check if app was previously marked installed
    const stored = localStorage.getItem('dk_pwa_installed');
    if (stored === 'true') {
      setHasEverInstalled(true);
    }
  }, []);

  useEffect(() => {
    if (isInstalled) {
      localStorage.setItem('dk_pwa_installed', 'true');
      setHasEverInstalled(true);
    }
  }, [isInstalled]);

  // If already running in standalone mode OR verified as installed, never show!
  if (isInstalled || hasEverInstalled) {
    return null;
  }

  // If user dismissed it during current page view (they'll be reminded on next visit until installed)
  if (isDismissedThisSession) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsTriggering(true);
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        localStorage.setItem('dk_pwa_installed', 'true');
        setHasEverInstalled(true);
      }
    } else {
      // If browser hasn't fired beforeinstallprompt or on iOS, open the step-by-step 1-click guide
      onOpenDetailedGuide();
    }
    setIsTriggering(false);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-b-2 border-emerald-400/60 shadow-xl px-3.5 py-3 sticky top-0 z-40 animate-fadeIn">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        {/* Left icon & text */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-inner relative">
            <Smartphone className="w-5 h-5 text-emerald-300 animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-emerald-950 animate-ping"></span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-xs sm:text-sm text-white tracking-wide">
                {isUrdu ? 'اینڈرائیڈ ایپ دستیاب ہے!' : 'Install Android App!'}
              </span>
              <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full shadow-2xs">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/90 truncate leading-tight mt-0.5">
              {isUrdu
                ? 'فل اسکرین تجربے اور آف لائن کام کیلئے ابھی موبائل میں انسٹال کریں۔'
                : 'Install to your mobile phone home screen for full-screen & offline use.'}
            </p>
          </div>
        </div>

        {/* Right CTA Button & Dismiss */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={isTriggering}
            className="py-1.5 px-3 sm:px-4 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer ring-2 ring-emerald-300/40 animate-bounce"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{isUrdu ? 'انسٹال کریں' : 'Install App'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDismissedThisSession(true)}
            title={isUrdu ? 'عارضی بند کریں' : 'Dismiss for now'}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
