import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Printer,
  FileSpreadsheet,
  Users,
  Plus
} from 'lucide-react';
import { AppSettings } from '../types';

interface BottomBarProps {
  settings: AppSettings;
  onOpenAddModal: (type: 'gave' | 'got') => void;
  onOpenReceipt: () => void;
  onOpenExport: () => void;
  onOpenCustomers: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  settings,
  onOpenAddModal,
  onOpenReceipt,
  onOpenExport,
  onOpenCustomers,
}) => {
  const isUrdu = settings.language === 'ur';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl py-2 px-3 no-print">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
        {/* Navigation icon buttons */}
        <button
          onClick={onOpenCustomers}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer shrink-0"
        >
          <Users className="w-4 h-4 text-slate-700" />
          <span className="text-[10px] font-medium mt-0.5">
            {isUrdu ? 'گاہک' : 'Parties'}
          </span>
        </button>

        <button
          onClick={onOpenReceipt}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer shrink-0"
        >
          <Printer className="w-4 h-4 text-slate-700" />
          <span className="text-[10px] font-medium mt-0.5">
            {isUrdu ? 'رسید' : 'Receipt'}
          </span>
        </button>

        {/* TWO PROMINENT ACTION BUTTONS: میں نے دیا & میں نے لیا */}
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          {/* BUTTON 1: میں نے دیا (You Gave) */}
          <button
            onClick={() => onOpenAddModal('gave')}
            className="flex-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold py-2.5 px-3 rounded-2xl shadow-md shadow-rose-600/25 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer text-xs sm:text-sm"
          >
            <TrendingUp className="w-4 h-4" />
            <div className="leading-tight text-center">
              <div>{isUrdu ? 'میں نے دیا' : 'You Gave'}</div>
              <div className="text-[9px] font-normal text-rose-100">
                {isUrdu ? '(سامان/ادھار)' : '(-) Debit'}
              </div>
            </div>
          </button>

          {/* BUTTON 2: میں نے لیا (You Got) */}
          <button
            onClick={() => onOpenAddModal('got')}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-2.5 px-3 rounded-2xl shadow-md shadow-emerald-600/25 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer text-xs sm:text-sm"
          >
            <TrendingDown className="w-4 h-4" />
            <div className="leading-tight text-center">
              <div>{isUrdu ? 'میں نے لیا' : 'You Got'}</div>
              <div className="text-[9px] font-normal text-emerald-100">
                {isUrdu ? '(وصولی/کیش)' : '(+) Credit'}
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onOpenExport}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          <span className="text-[10px] font-medium mt-0.5">
            {isUrdu ? 'رپورٹ' : 'Report'}
          </span>
        </button>
      </div>
    </div>
  );
};
