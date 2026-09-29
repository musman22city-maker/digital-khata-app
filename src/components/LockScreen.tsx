import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  Fingerprint,
  Delete,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Store
} from 'lucide-react';
import { AppSettings } from '../types';
import { authenticateBiometrics } from '../utils/security';
import { sounds } from '../utils/audio';

interface LockScreenProps {
  settings: AppSettings;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ settings, onUnlock }) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [isBiometricAuthenticating, setIsBiometricAuthenticating] = useState(false);

  const isUrdu = settings.language === 'ur';
  const expectedPin = settings.passcode || '1234';

  const triggerError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    sounds.playDelete(settings.soundEnabled);
    setTimeout(() => setShake(false), 500);
    setTimeout(() => {
      setPin('');
      setErrorMsg(null);
    }, 1200);
  }, [settings.soundEnabled]);

  const verifyPin = useCallback((currentPin: string) => {
    if (currentPin === expectedPin) {
      sounds.playSuccess(settings.soundEnabled);
      onUnlock();
    } else {
      triggerError(
        isUrdu ? 'غلط پن کوڈ! دوبارہ کوشش کریں' : 'Incorrect PIN! Please try again'
      );
    }
  }, [expectedPin, isUrdu, onUnlock, settings.soundEnabled, triggerError]);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMsg(null);
      if (newPin.length === 4) {
        setTimeout(() => {
          verifyPin(newPin);
        }, 150);
      }
    }
  }, [pin, verifyPin]);

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg(null);
    }
  };

  const handleBiometricPrompt = useCallback(async () => {
    if (!settings.biometricEnabled) return;
    setIsBiometricAuthenticating(true);
    setErrorMsg(null);

    try {
      const verified = await authenticateBiometrics(
        isUrdu ? 'ڈیجیٹل کھاتہ ان لاک کریں' : 'Unlock Digital Khata'
      );
      if (verified) {
        sounds.playSuccess(settings.soundEnabled);
        onUnlock();
      } else {
        triggerError(
          isUrdu ? 'بائیومیٹرک تصدیق ناکام رہی' : 'Biometric authentication cancelled'
        );
      }
    } catch {
      triggerError(
        isUrdu ? 'بائیومیٹرک دستیاب نہیں ہے' : 'Biometric verification failed'
      );
    } finally {
      setIsBiometricAuthenticating(false);
    }
  }, [isUrdu, onUnlock, settings.biometricEnabled, settings.soundEnabled, triggerError]);

  // Keyboard support for typing digits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit]);

  // Auto-prompt biometric once if enabled
  useEffect(() => {
    if (settings.biometricEnabled) {
      const timer = setTimeout(() => {
        handleBiometricPrompt();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [handleBiometricPrompt, settings.biometricEnabled]);

  return (
    <div className="absolute inset-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-6 select-none animate-fadeIn">
      {/* Top Branding & Lock Status */}
      <div className="pt-8 sm:pt-12 text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
          <Lock className="w-8 h-8 text-white" />
        </div>

        <div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {settings.shopName || (isUrdu ? 'ڈیجیٹل کھاتہ' : 'Digital Khata')}
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'محفوظ کھاتہ لاک' : 'Secured Financial Ledger'}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          {isUrdu
            ? 'اپنے گاہکوں اور مالیاتی حساب کتاب کے تحفظ کے لیے 4 ہندسوں کا پن کوڈ درج کریں:'
            : 'Enter your 4-digit PIN to access customer accounts:'}
        </p>
      </div>

      {/* PIN Dots Indicator */}
      <div className="py-4 text-center">
        <div
          className={`flex items-center justify-center gap-4 transition-transform ${
            shake ? 'animate-shake' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                  isFilled
                    ? 'bg-emerald-400 border-emerald-400 scale-125 shadow-md shadow-emerald-400/50'
                    : 'bg-transparent border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {errorMsg ? (
          <div className="mt-3 text-xs font-semibold text-rose-400 flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="mt-3 text-[11px] text-slate-500">
            {settings.biometricEnabled && (
              <span>{isUrdu ? 'یا فنگر پرنٹ سینسر کو چھوئیں' : 'or use Fingerprint sensor'}</span>
            )}
          </div>
        )}
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-xs mx-auto pb-4">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num.toString())}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-emerald-600 active:scale-95 text-xl font-bold text-white transition flex items-center justify-center cursor-pointer border border-slate-700/50 shadow-sm"
            >
              {num}
            </button>
          ))}

          {/* Biometric Button */}
          {settings.biometricEnabled ? (
            <button
              type="button"
              onClick={handleBiometricPrompt}
              disabled={isBiometricAuthenticating}
              className="h-14 sm:h-16 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 active:scale-95 text-emerald-300 transition flex flex-col items-center justify-center cursor-pointer border border-emerald-700/50"
              title={isUrdu ? 'بائیومیٹرک ان لاک' : 'Biometric Unlock'}
            >
              <Fingerprint className={`w-6 h-6 ${isBiometricAuthenticating ? 'animate-pulse text-emerald-400' : ''}`} />
              <span className="text-[9px] mt-0.5 font-bold">{isUrdu ? 'فنگر' : 'Touch'}</span>
            </button>
          ) : (
            <div className="h-14 sm:h-16" />
          )}

          {/* Zero Button */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 sm:h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-emerald-600 active:scale-95 text-xl font-bold text-white transition flex items-center justify-center cursor-pointer border border-slate-700/50 shadow-sm"
          >
            0
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 sm:h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-700/60 active:scale-95 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer border border-slate-700/40"
            title={isUrdu ? 'حذف' : 'Backspace'}
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-5 text-center">
          <p className="text-[11px] text-slate-500">
            {isUrdu ? 'پن کوڈ تبدیل کرنے کے لیے ترتیبات میں جائیں' : 'Passcode can be updated inside Settings'}
          </p>
        </div>
      </div>
    </div>
  );
};
