import React from 'react';
import { Cloud, CloudOff, CheckCircle2, RefreshCw, UserCheck, Shield } from 'lucide-react';
import { User } from 'firebase/auth';
import { AppSettings } from '../types';
import { CloudSyncState } from '../services/khataSync';

interface GoogleAuthBannerProps {
  currentUser: User | null;
  syncState: CloudSyncState;
  settings: AppSettings;
  onOpenAuthModal: () => void;
}

export const GoogleAuthBanner: React.FC<GoogleAuthBannerProps> = ({
  currentUser,
  syncState,
  settings,
  onOpenAuthModal,
}) => {
  const isUrdu = settings.language === 'ur';

  if (currentUser) {
    return (
      <div className="bg-emerald-950/80 border-b border-emerald-800/60 px-3.5 py-1.5 text-xs text-emerald-200 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span className="truncate">
            <span className="text-emerald-100 font-semibold">{currentUser.displayName || currentUser.email}</span>
            <span className="text-emerald-300/80 text-[11px] ml-1.5 hidden sm:inline">
              ({isUrdu ? 'جی میل کلاؤڈ میں محفوظ ہے' : 'Cloud Synced'})
            </span>
          </span>
        </div>

        <button
          onClick={onOpenAuthModal}
          className="text-[11px] bg-emerald-800/80 hover:bg-emerald-700/80 text-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-600/40 font-medium transition cursor-pointer shrink-0 flex items-center gap-1 active:scale-95"
        >
          <Cloud className="w-3 h-3 text-emerald-300" />
          <span>{isUrdu ? 'کلاؤڈ اکاؤنٹ' : 'Cloud Status'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-900/90 via-amber-800/90 to-amber-900/90 border-b border-amber-600/40 px-3.5 py-1.5 text-xs text-amber-100 flex items-center justify-between gap-2 shadow-sm">
      <div className="flex items-center gap-2 min-w-0">
        <CloudOff className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span className="text-[11px] truncate">
          {isUrdu
            ? 'گوگل / جی میل سے لاگ ان کریں تاکہ ڈیٹا کلاؤڈ میں محفوظ رہے'
            : 'Sign in with Google to backup data to Gmail & sync'}
        </span>
      </div>

      <button
        onClick={onOpenAuthModal}
        className="text-[11px] bg-white text-slate-900 font-bold px-2.5 py-0.5 rounded-lg shadow-xs hover:bg-amber-50 transition cursor-pointer shrink-0 flex items-center gap-1 active:scale-95"
      >
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
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
        <span>{isUrdu ? 'لاگ ان' : 'Sign In'}</span>
      </button>
    </div>
  );
};
